import { test, expect, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { alvoEhTeste, exigirAlvoDeTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";
import { BUSCA_LIGADA, conferirNoindex, conferirSemContatoNoHtml, marcaDeRodada } from "../apoio/busca";
import { credencialAdmin, SEM_ADMIN } from "../apoio/credenciais";
import { EXIGIR, falharSeExigir, pularOuFalhar } from "../apoio/pulo";
import {
  apagarContasDaRodada,
  aprovarPelaRpc,
  clienteDoUsuario,
  lerPerfil,
  lerSlugDoVet,
  semearVetNaFila,
  suspenderNoLugarDoMaster,
  varrerDescartaveisAntigas,
  type ContaDescartavel,
} from "../apoio/servico";
import { BASE_URL, capturarSessao } from "../apoio/sessao";

// Camada 8 da suíte: BUSCA E PERFIL PÚBLICO COM DADO REAL (F4, E4 e E5).
//
// ⚠️ SÓ EXISTE DEPOIS DA 0005, e só é REGISTRADO com `E2E_BUSCA_LIGADA=1`.
// Sem a variável, nenhum teste daqui é declarado: não aparece como pulado, e
// por isso não vira falha sob `E2E_EXIGIR_FILA=1`. O que impede este arquivo
// de ficar esquecido desligado é `busca-publica.spec.ts`, que falha no dia em
// que a 0005 entrar no alvo sem a variável ligada (ver `tests/apoio/busca.ts`).
//
// ⚠️ ESCREVE NO BANCO: o bloco com conta só roda no projeto de TESTE
// (`E2E_ALVO=teste`, DL-064), com a conta admin COMUM de teste. Cada teste cria
// a própria conta vet descartável (`semearVetNaFila`), aprova pela RPC com a
// sessão do admin, e o `afterAll` apaga tudo.
//
// O que se prova aqui é a regra 2 da matriz (§3): QUEM APARECE é decidido pelo
// Postgres (`perfil_esta_ativo`), e só `active` aparece, na busca e no perfil,
// na requisição seguinte à mudança de status, sem cache no meio.

const ATIVO = alvoEhTeste();

/** O slug que a 0005 gera a partir do nome (DL-067), sem o sufixo de colisão. */
function baseDoSlug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function digitos(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

type VetDeTeste = {
  conta: ContaDescartavel;
  nome: string;
  /** Só letras, única por teste: é o termo da busca. */
  marca: string;
  crmv: string;
  /** Os dois números gravados em `perfil_privado`. Nunca podem sair no HTML. */
  numeros: string[];
};

/** Uma conta vet NA FILA, com dados de busca próprios: Palmas/TO,
 *  Cardiologia + Clínica geral, presencial e domiciliar (sem teleorientação),
 *  CRMV-TO aleatório e WhatsApp/telefone privados. */
async function vetNaFila(rotulo: string): Promise<VetDeTeste> {
  const marca = marcaDeRodada();
  const nome = `QA E2E Busca ${rotulo} ${marca[0].toUpperCase()}${marca.slice(1)}`;
  const crmv = `${1 + Math.floor(Math.random() * 9)}${digitos(5)}`;
  const whatsapp = `639${digitos(8)}`;
  const telefone = `633${digitos(7)}`;
  const conta = await semearVetNaFila(
    nome,
    {
      especialidades: ["Cardiologia", "Clínica geral"],
      cidade: "Palmas",
      estado: "TO",
      crmv,
      crmv_uf: "TO",
      atende_presencial: true,
      atende_domiciliar: true,
      atende_teleorientacao: false,
    },
    { whatsapp, telefone }
  );
  return { conta, nome, marca, crmv, numeros: [whatsapp, telefone] };
}

/** O cartão desta conta na lista (o cartão inteiro é um link). */
function cartaoDe(page: Page, nome: string) {
  return page.locator('a[href^="/veterinario/"]').filter({ hasText: nome });
}

const SEM_RESULTADO = "Nenhum resultado com esses filtros";

if (BUSCA_LIGADA) {
  // -------------------------------------------------------------------------
  // SEM CONTA: os avisos da busca (só precisam das listas da 0005)
  // -------------------------------------------------------------------------
  test.describe("busca com a 0005: avisos, sem inventar resultado", () => {
    for (const rota of [
      "/buscar?especialidade=cardiologia&servico=vacinacao",
      "/buscar?atendimento=domiciliar&servico=vacinacao",
      "/buscar?tipo=estabelecimento&especialidade=cardiologia",
    ]) {
      test(`filtros incompativeis mostram o aviso: ${rota}`, async ({ page }) => {
        const resposta = await page.goto(rota);
        expect(resposta?.status()).toBe(200);
        await expect(page.getByRole("heading", { name: "Esses filtros não combinam" })).toBeVisible();
        await expect(page.locator('a[href^="/veterinario/"], a[href^="/estabelecimento/"]')).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Ver veterinários" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Ver estabelecimentos" })).toBeVisible();
      });
    }

    test("a saida 'Ver veterinarios' tira o servico e mantem a especialidade", async ({ page }) => {
      await page.goto("/buscar?especialidade=cardiologia&servico=vacinacao");
      await page.getByRole("link", { name: "Ver veterinários" }).click();
      await page.waitForURL((url) => url.pathname === "/buscar" && url.searchParams.get("tipo") === "veterinario");
      const params = new URL(page.url()).searchParams;
      expect(params.get("especialidade")).toBe("cardiologia");
      expect(params.get("servico")).toBeNull();
      await expect(page.getByRole("heading", { name: "Esses filtros não combinam" })).toHaveCount(0);
    });

    test("cidade com o mesmo nome em dois estados pergunta qual, sem escolher", async ({ page }) => {
      await page.goto("/buscar?cidade=Palmas");
      await expect(
        page.getByRole("heading", { name: 'Existe mais de uma cidade chamada "Palmas"' })
      ).toBeVisible();
      await expect(page.locator('a[href^="/veterinario/"], a[href^="/estabelecimento/"]')).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Palmas, PR" })).toBeVisible();
      await page.getByRole("link", { name: "Palmas, TO" }).click();
      await page.waitForURL((url) => url.searchParams.get("cidade") === "palmas-to");
      expect(new URL(page.url()).searchParams.get("uf")).toBe("TO");
    });

    test("especialidade que nao existe na lista avisa, e nao ignora o filtro", async ({ page }) => {
      await page.goto("/buscar?especialidade=qa-e2e-nao-existe");
      await expect(page.getByRole("heading", { name: "Não encontramos essa especialidade" })).toBeVisible();
      await expect(page.locator('a[href^="/veterinario/"], a[href^="/estabelecimento/"]')).toHaveCount(0);
    });
  });

  // -------------------------------------------------------------------------
  // COM CONTA DESCARTÁVEL: quem aparece e quem não aparece
  // -------------------------------------------------------------------------
  test.describe("busca com a 0005: so conta active aparece (matriz §3, regra 2)", () => {
    test.describe.configure({ timeout: 120_000 });
    test.skip(!ATIVO && !EXIGIR, SEM_ALVO_DE_TESTE);

    let admin: SupabaseClient | null = null;
    const credencialDoAdmin = credencialAdmin();

    test.beforeAll(async () => {
      falharSeExigir(!ATIVO, SEM_ALVO_DE_TESTE);
      if (!ATIVO) return;
      test.setTimeout(120_000);
      exigirAlvoDeTeste();
      await varrerDescartaveisAntigas(60);
      falharSeExigir(credencialDoAdmin === null, SEM_ADMIN);
      // Um login do admin para o arquivo inteiro (limite de /token por IP).
      if (credencialDoAdmin) admin = (await clienteDoUsuario(credencialDoAdmin)).cliente;
    });

    test.beforeEach(() => {
      pularOuFalhar(admin === null, SEM_ADMIN);
    });

    test.afterAll(async () => {
      if (!ATIVO) return;
      test.setTimeout(120_000);
      await admin?.auth.signOut().catch(() => {});
      await apagarContasDaRodada();
    });

    test("vet aprovado aparece por cidade e especialidade e abre o perfil pelo slug, com selo e CRMV", async ({
      page,
      request,
    }) => {
      const v = await vetNaFila("Ativo");
      expect(await lerSlugDoVet(v.conta.id), "conta na fila ja nasceu com slug: endereco publico antes da validacao").toBeNull();

      await aprovarPelaRpc(admin!, v.conta.id);
      const slug = await lerSlugDoVet(v.conta.id);
      expect(slug, "a aprovacao nao gerou o slug (trigger trg_profiles_slug_ao_ativar da 0005)").not.toBeNull();
      expect(slug!).toMatch(new RegExp(`^${baseDoSlug(v.nome)}-palmas-to(-\\d+)?$`));

      // Aparece: termo + cidade (slug do IBGE) + especialidade + atendimento.
      const rota = `/buscar?q=${v.marca}&cidade=palmas-to&especialidade=cardiologia&atendimento=domiciliar`;
      const resposta = await page.goto(rota);
      expect(resposta?.status()).toBe(200);
      await expect(cartaoDe(page, v.nome), "a conta aprovada nao apareceu na busca").toHaveCount(1);
      await expect(cartaoDe(page, v.nome)).toHaveAttribute("href", `/veterinario/${slug}`);
      await expect(page.getByRole("heading", { level: 2, name: /^1 resultado/ })).toBeVisible();

      // A cidade digitada como texto, com UF, chega à mesma conta.
      await page.goto(`/buscar?q=${v.marca}&cidade=Palmas&uf=TO`);
      await expect(cartaoDe(page, v.nome)).toHaveCount(1);

      // E cada filtro FILTRA: trocar um deles tira a conta da lista.
      for (const outra of [
        `/buscar?q=${v.marca}&cidade=palmas-to&especialidade=dermatologia`,
        `/buscar?q=${v.marca}&cidade=palmas-pr&especialidade=cardiologia`,
        `/buscar?q=${v.marca}&cidade=palmas-to&atendimento=teleorientacao`,
        `/buscar?q=${v.marca}&tipo=estabelecimento`,
      ]) {
        await page.goto(outra);
        await expect(cartaoDe(page, v.nome), `${outra}: o filtro nao filtrou`).toHaveCount(0);
        await expect(page.getByRole("heading", { name: SEM_RESULTADO }), outra).toBeVisible();
      }

      // O perfil, a partir do cartão, como a pessoa faria.
      await page.goto(rota);
      await cartaoDe(page, v.nome).click();
      await page.waitForURL((url) => url.pathname === `/veterinario/${slug}`);
      await expect(page.getByRole("heading", { level: 1, name: v.nome })).toBeVisible();
      await expect(page.getByText("Verificado pela Vetria", { exact: true })).toBeVisible();
      await expect(page.getByText(`CRMV-TO ${v.crmv}`, { exact: true })).toBeVisible();
      await expect(page.getByRole("list", { name: "Especialidades" })).toContainText("Cardiologia");
      // Sem botão de contato falso enquanto a S8 não existe.
      await expect(page.getByText("O contato pelo WhatsApp abre em breve.")).toBeVisible();
      await conferirNoindex(page, `/veterinario/${slug}`);

      const direto = await page.goto(`/veterinario/${slug}`);
      expect(direto?.status()).toBe(200);

      // O WhatsApp e o telefone gravados em perfil_privado não saem em lugar
      // nenhum: nem no perfil, nem na lista (DL-047).
      await conferirSemContatoNoHtml(request, page, `/veterinario/${slug}`, v.numeros);
      await conferirSemContatoNoHtml(request, page, rota, v.numeros);
    });

    test("conta em pending_validation nao aparece, nao tem slug, e o endereco que ela teria da 404", async ({
      page,
    }) => {
      const v = await vetNaFila("Pendente");
      expect((await lerPerfil(v.conta.id)).status).toBe("pending_validation");
      expect(await lerSlugDoVet(v.conta.id), "conta na fila com slug").toBeNull();

      for (const rota of [
        `/buscar?q=${v.marca}`,
        `/buscar?q=${v.marca}&cidade=palmas-to&especialidade=cardiologia`,
      ]) {
        await page.goto(rota);
        await expect(cartaoDe(page, v.nome), `${rota}: conta na fila apareceu na busca`).toHaveCount(0);
        await expect(page.getByRole("heading", { name: SEM_RESULTADO }), rota).toBeVisible();
      }

      const resposta = await page.goto(`/veterinario/${baseDoSlug(v.nome)}-palmas-to`);
      expect(resposta?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1, name: "Este perfil não está disponível" })).toBeVisible();
    });

    test("aprovada que volta para a fila (revalidacao) some da busca e o slug da 404, ate para a dona logada", async ({
      page,
      browser,
    }) => {
      const v = await vetNaFila("Revisao");
      await aprovarPelaRpc(admin!, v.conta.id);
      const slug = await lerSlugDoVet(v.conta.id);
      expect(slug).not.toBeNull();

      // Pré-condição: no ar.
      expect((await page.goto(`/veterinario/${slug}`))?.status()).toBe(200);

      // A dona troca o nome (dado vigiado): o trigger da 0002 devolve à fila.
      const { cliente } = await clienteDoUsuario(v.conta);
      const { error } = await cliente
        .from("vet_profiles")
        .update({ nome_exibicao: `${v.nome} Novo` })
        .eq("id", v.conta.id)
        .select("id")
        .single();
      expect(error, `a dona nao conseguiu editar o proprio perfil: ${error?.message}`).toBeNull();
      await cliente.auth.signOut().catch(() => {});
      expect((await lerPerfil(v.conta.id)).status, "trocar o nome nao devolveu a conta para a fila").toBe(
        "pending_validation"
      );
      // O slug fica (é estável, DL-067): é exatamente o caso em que só a RLS
      // separa "tem endereço" de "está no ar".
      expect(await lerSlugDoVet(v.conta.id)).toBe(slug);

      const perfil = await page.goto(`/veterinario/${slug}`);
      expect(perfil?.status(), "conta de volta na fila continua com pagina publica").toBe(404);
      await page.goto(`/buscar?q=${v.marca}`);
      await expect(cartaoDe(page, v.nome)).toHaveCount(0);

      // Nem a dona logada vê a própria página: a leitura é anônima
      // (lib/supabase/publico.ts), e a policy de dono não entra.
      const cookies = await capturarSessao(browser, v.conta, "conta descartavel");
      const contexto = await browser.newContext({ baseURL: BASE_URL });
      try {
        await contexto.addCookies(cookies);
        const daDona = await contexto.newPage();
        const r = await daDona.goto(`/veterinario/${slug}`);
        expect(r?.status(), "a dona em pending_validation abriu a propria pagina publica").toBe(404);
        await daDona.goto(`/buscar?q=${v.marca}`);
        await expect(cartaoDe(daDona, v.nome)).toHaveCount(0);
      } finally {
        await contexto.close().catch(() => {});
      }
    });

    test("conta suspensa some da busca e do perfil na requisicao seguinte (sem cache)", async ({
      page,
      request,
    }) => {
      const v = await vetNaFila("Suspensa");
      await aprovarPelaRpc(admin!, v.conta.id);
      const slug = await lerSlugDoVet(v.conta.id);
      expect(slug).not.toBeNull();

      // Aquecer: duas visitas a cada página, para que QUALQUER cache (HTML do
      // Next, CDN, fetch) tivesse a versão "no ar" guardada.
      const busca = `/buscar?q=${v.marca}&cidade=palmas-to`;
      for (let i = 0; i < 2; i++) {
        expect((await request.get(`/veterinario/${slug}`)).status()).toBe(200);
        await page.goto(busca);
        await expect(cartaoDe(page, v.nome)).toHaveCount(1);
      }

      await suspenderNoLugarDoMaster(v.conta.id);

      // Uma requisição, sem espera nem nova tentativa: "na hora" é isto.
      const depois = await request.get(`/veterinario/${slug}`);
      expect(depois.status(), "a conta suspensa continuou com pagina publica (cache?)").toBe(404);
      const html = await depois.text();
      expect(html.includes(v.nome), "o nome da conta suspensa ainda saiu no HTML").toBe(false);

      await page.goto(busca);
      await expect(cartaoDe(page, v.nome), "a conta suspensa continuou na busca (cache?)").toHaveCount(0);
    });
  });
}
