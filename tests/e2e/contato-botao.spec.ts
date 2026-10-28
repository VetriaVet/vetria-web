import { test, expect, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { alvoEhTeste, exigirAlvoDeTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";
import { conferirSemContatoNoHtml, marcaDeRodada } from "../apoio/busca";
import { credencialAdmin, SEM_ADMIN } from "../apoio/credenciais";
import { EXIGIR, falharSeExigir, pularOuFalhar } from "../apoio/pulo";
import {
  apagarContasDaRodada,
  aprovarPelaRpc,
  clienteDeServico,
  clienteDoUsuario,
  lerSlugDoVet,
  semearVetNaFila,
  varrerDescartaveisAntigas,
  type ContaDescartavel,
} from "../apoio/servico";

// T-041 · O BOTÃO "CHAMAR NO WHATSAPP" NO PERFIL PÚBLICO (DL-047, DL-071).
//
// ⚠️ SÓ É REGISTRADO COM `CONTATO_ABERTO_PARA_TESTE=1` E SÓ RODA COM
// `E2E_ALVO=teste`, como a parte B de `contato-rota.spec.ts`: o botão só existe
// com a porta da rota aberta (`lib/contato/porta.ts`), e a porta só abre para
// teste depois da 0006 no `vetria-e2e` (sessão A, T-039). Com a porta fechada,
// o que vale é o "abre em breve" sem botão, conferido em
// `busca-com-dados.spec.ts`.
//
// O que se prova aqui, como a pessoa faria, no celular (360 px):
//   · o HTML do perfil não tem o número, antes e depois do toque;
//   · o toque pelo TECLADO revela o número formatado, com foco nele;
//   · "Abrir no WhatsApp" é `wa.me/55<número>?text=<D7>`, em outra aba, com
//     `rel="noopener noreferrer"`; nada abre sozinho;
//   · a linha nasce em `contatos`; o convite aparece e "Agora não" o tira;
//   · perfil sem WhatsApp: o botão sai e a tela diz por quê (D9);
//   · as falhas (429, 403, 503, 404, rede) com texto honesto, pela rota
//     interceptada (o limite real é provado na sonda 2 da 0006 e na T-043).

const CONTATO_LIGADO = process.env.CONTATO_ABERTO_PARA_TESTE === "1";
const ATIVO = alvoEhTeste();
const BOTAO = "Chamar no WhatsApp";
const MENSAGEM = "Olá! Encontrei seu perfil na Vetria e gostaria de mais informações.";

function digitos(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

async function vetAtivo(
  admin: SupabaseClient,
  rotulo: string,
  whatsapp: string | null
): Promise<{ conta: ContaDescartavel; slug: string }> {
  const marca = marcaDeRodada();
  const nome = `QA E2E Botao ${rotulo} ${marca[0].toUpperCase()}${marca.slice(1)}`;
  const conta = await semearVetNaFila(
    nome,
    { crmv: `${1 + Math.floor(Math.random() * 9)}${digitos(5)}`, crmv_uf: "TO" },
    whatsapp ? { whatsapp } : {}
  );
  await aprovarPelaRpc(admin, conta.id);
  const slug = await lerSlugDoVet(conta.id);
  if (!slug) throw new Error("vetAtivo: a aprovacao nao gerou slug (0005)");
  return { conta, slug };
}

async function quantosContatos(profissionalId: string): Promise<number> {
  const { count, error } = await clienteDeServico()
    .from("contatos")
    .select("profissional_id", { count: "exact", head: true })
    .eq("profissional_id", profissionalId);
  if (error) throw new Error(`quantosContatos: ${error.code}: ${error.message}`);
  return count ?? 0;
}

/** Responde o POST no lugar da rota, para provar a tela de cada falha. */
async function rotaResponde(page: Page, status: number, corpo: unknown) {
  await page.route("**/api/contato", (r) =>
    r.fulfill({ status, contentType: "application/json", body: JSON.stringify(corpo) })
  );
}

if (CONTATO_LIGADO) {
  test.describe("Perfil publico: o botao Chamar no WhatsApp", () => {
    test.describe.configure({ timeout: 120_000 });
    test.skip(!ATIVO && !EXIGIR, SEM_ALVO_DE_TESTE);
    test.use({ viewport: { width: 360, height: 780 } });

    let admin: SupabaseClient | null = null;
    let comZap: { conta: ContaDescartavel; slug: string; whatsapp: string } | null = null;
    const credencialDoAdmin = credencialAdmin();

    test.beforeAll(async () => {
      falharSeExigir(!ATIVO, SEM_ALVO_DE_TESTE);
      if (!ATIVO) return;
      test.setTimeout(120_000);
      exigirAlvoDeTeste();
      await varrerDescartaveisAntigas(60);
      falharSeExigir(credencialDoAdmin === null, SEM_ADMIN);
      if (!credencialDoAdmin) return;
      admin = (await clienteDoUsuario(credencialDoAdmin)).cliente;
      const whatsapp = `639${digitos(8)}`;
      comZap = { ...(await vetAtivo(admin, "Ativo", whatsapp)), whatsapp };
    });

    test.beforeEach(() => {
      pularOuFalhar(admin === null || comZap === null, SEM_ADMIN);
    });

    test.afterAll(async () => {
      if (!ATIVO) return;
      test.setTimeout(120_000);
      await admin?.auth.signOut().catch(() => {});
      await apagarContasDaRodada();
    });

    test("pelo teclado: toque, numero formatado com foco, wa.me certo, linha gravada, convite com Agora nao", async ({
      page,
      request,
    }) => {
      const { conta, slug, whatsapp } = comZap!;
      const rota = `/veterinario/${slug}`;
      const formatado = `(${whatsapp.slice(0, 2)}) ${whatsapp.slice(2, 7)}-${whatsapp.slice(7)}`;

      await conferirSemContatoNoHtml(request, page, rota, [whatsapp]);
      expect(await quantosContatos(conta.id)).toBe(0);

      await page.goto(rota);
      const botao = page.getByRole("button", { name: BOTAO });
      await expect(botao).toBeVisible();
      await expect(page.getByText("Registramos este contato", { exact: false })).toBeVisible();
      // Nada de rolagem lateral no celular.
      const larguraDoConteudo = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(larguraDoConteudo, "o perfil rola para o lado em 360 px").toBeLessThanOrEqual(360);

      // Uma aba nova NÃO pode abrir sozinha depois do toque.
      let abriuAba = false;
      page.context().on("page", () => {
        abriuAba = true;
      });

      await botao.focus();
      await page.keyboard.press("Enter");

      const numero = page.getByText(formatado, { exact: true });
      await expect(numero).toBeVisible();
      await expect(numero).toBeFocused();

      const abrir = page.getByRole("link", { name: /Abrir no WhatsApp/ });
      await expect(abrir).toHaveAttribute(
        "href",
        `https://wa.me/55${whatsapp}?text=${encodeURIComponent(MENSAGEM)}`
      );
      await expect(abrir).toHaveAttribute("target", "_blank");
      await expect(abrir).toHaveAttribute("rel", "noopener noreferrer");
      await expect(page.getByRole("button", { name: "Copiar número" })).toBeVisible();
      expect(abriuAba, "o WhatsApp abriu sozinho depois do toque").toBe(false);

      expect(await quantosContatos(conta.id), "o toque nao gravou a linha em contatos").toBe(1);

      // O convite, nunca portão: aparece depois do número e sai com "Agora não".
      await expect(page.getByText("Quer acompanhar seus contatos?")).toBeVisible();
      await expect(page.getByRole("link", { name: "Criar minha conta" })).toHaveAttribute(
        "href",
        "/cadastro/responsavel"
      );
      await page.getByRole("button", { name: "Agora não" }).click();
      await expect(page.getByText("Quer acompanhar seus contatos?")).toHaveCount(0);
      await expect(numero).toBeVisible();

      // Depois do toque, o HTML servido continua sem o número.
      await conferirSemContatoNoHtml(request, page, rota, [whatsapp]);
    });

    test("perfil sem WhatsApp: o botao sai e a tela diz por que (D9)", async ({ page }) => {
      const { conta, slug } = await vetAtivo(admin!, "SemZap", null);
      await page.goto(`/veterinario/${slug}`);
      await page.getByRole("button", { name: BOTAO }).click();
      // Duas vezes no DOM de propósito: o texto visível e a região que o
      // leitor de tela anuncia. Confere o visível.
      await expect(
        page
          .getByText("Este veterinário ainda não informou um WhatsApp para contato.", { exact: true })
          .filter({ visible: true })
      ).toBeVisible();
      await expect(page.getByRole("button", { name: BOTAO })).toHaveCount(0);
      expect(await quantosContatos(conta.id)).toBe(0);
    });

    test("as falhas: texto honesto, e o botao volta quando da para tentar de novo", async ({ page }) => {
      const rota = `/veterinario/${comZap!.slug}`;
      const casos: [number, unknown, string, string][] = [
        [429, { ok: false, motivo: "muitas_tentativas" }, "Você abriu muitos contatos em pouco tempo.", BOTAO],
        [403, { ok: false, motivo: "verificacao_recusada" }, "Recarregue a página", "Recarregar a página"],
        [503, { ok: false, motivo: "indisponivel" }, "A falha foi do nosso lado.", BOTAO],
        [200, "isto nao e o formato combinado", "A falha foi do nosso lado.", BOTAO],
      ];
      for (const [status, corpo, texto, botaoDepois] of casos) {
        await page.unrouteAll();
        await rotaResponde(page, status, corpo);
        await page.goto(rota);
        await page.getByRole("button", { name: BOTAO }).click();
        await expect(page.getByRole("alert").filter({ hasText: texto }), `${status}`).toBeVisible();
        await expect(page.getByRole("button", { name: botaoDepois }), `${status}`).toBeEnabled();
      }

      // O perfil saiu do ar entre a página e o toque.
      await page.unrouteAll();
      await rotaResponde(page, 404, { ok: false, motivo: "nao_encontrado" });
      await page.goto(rota);
      await page.getByRole("button", { name: BOTAO }).click();
      await expect(page.getByText("Este perfil não está mais disponível.")).toBeVisible();
      await expect(page.getByRole("link", { name: "Ir para a busca" })).toHaveAttribute("href", "/buscar");
      await expect(page.getByRole("button", { name: BOTAO })).toHaveCount(0);

      // Sem rede.
      await page.unrouteAll();
      await page.route("**/api/contato", (r) => r.abort("internetdisconnected"));
      await page.goto(rota);
      await page.getByRole("button", { name: BOTAO }).click();
      await expect(page.getByRole("alert").filter({ hasText: "A falha foi do nosso lado." })).toBeVisible();
      await page.unrouteAll();
    });

    test("durante o envio o botao fica desabilitado e um toque a mais nao manda dois pedidos", async ({ page }) => {
      let pedidos = 0;
      let soltar: () => void = () => {};
      const segurado = new Promise<void>((r) => {
        soltar = r;
      });
      await page.route("**/api/contato", async (r) => {
        pedidos += 1;
        await segurado;
        await r.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ ok: false, motivo: "indisponivel" }),
        });
      });
      await page.goto(`/veterinario/${comZap!.slug}`);
      const botao = page.getByRole("button", { name: BOTAO });
      await botao.click();
      await expect(botao).toBeDisabled();
      await expect(botao).toHaveAttribute("aria-busy", "true");
      await botao.click({ force: true }).catch(() => {});
      soltar();
      await expect(page.getByRole("alert").filter({ hasText: "A falha foi do nosso lado." })).toBeVisible();
      expect(pedidos).toBe(1);
      await page.unrouteAll();
    });
  });
}
