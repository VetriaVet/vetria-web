import { test, expect } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { alvoEhTeste, exigirAlvoDeTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";
import { marcaDeRodada } from "../apoio/busca";
import {
  BOTAO_WHATSAPP,
  COOKIE_DO_VISITANTE,
  CONTATO_LIGADO,
  NO_MESMO_SITE,
  ROTA_CONTATO,
  contatosDe,
  cookiesDoVisitante,
  digitos,
  pedidoDeContato,
  valorDoCookie,
  whatsappDeTeste,
  whatsappFormatado,
} from "../apoio/contato";
import { credencialAdmin, credencialTutor, SEM_ADMIN, SEM_TUTOR } from "../apoio/credenciais";
import { EXIGIR, falharSeExigir, pularOuFalhar } from "../apoio/pulo";
import {
  apagarContasDaRodada,
  aprovarPelaRpc,
  clienteDoUsuario,
  lerSlugDoVet,
  semearVetNaFila,
  varrerDescartaveisAntigas,
  type ContaDescartavel,
} from "../apoio/servico";
import { BASE_URL, aplicarSessao, capturarSessao } from "../apoio/sessao";

// T-043 · O LIMITE DE VERDADE (D3) E O CONTATO DE QUEM ESTÁ LOGADO.
//
// `contato-botao.spec.ts` prova a TELA do 429 com a rota interceptada. Aqui o
// 429 é o do BANCO (`registrar_contato`, 0006 §5): o mesmo visitante abre 5
// profissionais DISTINTOS em 10 minutos e o sexto recebe `muitas_tentativas`,
// sem número e sem linha. E o responsável logado: a linha nasce com o
// `user_id` dele, e ele (e só ele) a lê pelo PostgREST, que é a fonte da tela
// "Seus contatos" da T-042 (a tela ainda é casca; o dado não).
//
// ⚠️ ESCREVE NO BANCO: só no `vetria-e2e`. Seis contas vet descartáveis,
// aprovadas pela RPC com a sessão do admin de teste (como a Server Action faz).
// O `afterAll` apaga as contas, e o `on delete cascade` leva os contatos. O
// visitante é um cookie novo por rodada: duas rodadas seguidas não somam.
//
// ⚠️ SÓ É REGISTRADO com `CONTATO_ABERTO_PARA_TESTE=1` (ver `contato-rota.spec.ts`).

const ATIVO = alvoEhTeste();
const LIMITE_CURTO = 5; // 0006 §5: 5 profissionais distintos em 10 minutos

async function vetAtivo(
  admin: SupabaseClient,
  rotulo: string
): Promise<{ conta: ContaDescartavel; slug: string; whatsapp: string }> {
  const marca = marcaDeRodada();
  const nome = `QA E2E Limite ${rotulo} ${marca[0].toUpperCase()}${marca.slice(1)}`;
  const whatsapp = whatsappDeTeste();
  const conta = await semearVetNaFila(
    nome,
    { crmv: `${1 + Math.floor(Math.random() * 9)}${digitos(5)}`, crmv_uf: "TO" },
    { whatsapp }
  );
  await aprovarPelaRpc(admin, conta.id);
  const slug = await lerSlugDoVet(conta.id);
  if (!slug) throw new Error("vetAtivo: a aprovacao nao gerou slug (0005)");
  return { conta, slug, whatsapp };
}

if (CONTATO_LIGADO) {
  test.describe("Contato: o limite do banco e o responsavel logado", () => {
    test.describe.configure({ timeout: 240_000 });
    test.skip(!ATIVO && !EXIGIR, SEM_ALVO_DE_TESTE);

    let admin: SupabaseClient | null = null;
    const credencialDoAdmin = credencialAdmin();
    const credencialDoTutor = credencialTutor();

    test.beforeAll(async () => {
      falharSeExigir(!ATIVO, SEM_ALVO_DE_TESTE);
      if (!ATIVO) return;
      test.setTimeout(120_000);
      exigirAlvoDeTeste();
      await varrerDescartaveisAntigas(60);
      falharSeExigir(credencialDoAdmin === null, SEM_ADMIN);
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

    test("o mesmo visitante abre 5 profissionais; o sexto recebe muitas_tentativas, sem numero e sem linha, e a tela diz", async ({
      playwright,
      browser,
    }) => {
      const vets = [];
      for (let i = 1; i <= LIMITE_CURTO + 1; i++) vets.push(await vetAtivo(admin!, `N${i}`));

      const api = await playwright.request.newContext({ baseURL: BASE_URL });
      let visitante = "";
      try {
        for (const [i, v] of vets.slice(0, LIMITE_CURTO).entries()) {
          const r = await api.post(ROTA_CONTATO, {
            headers: visitante ? { ...NO_MESMO_SITE, cookie: `${COOKIE_DO_VISITANTE}=${visitante}` } : NO_MESMO_SITE,
            data: pedidoDeContato(v.slug),
          });
          expect(r.status(), `contato ${i + 1} de ${LIMITE_CURTO}`).toBe(200);
          expect(await r.json()).toEqual({ ok: true, whatsapp: v.whatsapp });
          if (!visitante) {
            const cookies = cookiesDoVisitante(r);
            expect(cookies).toHaveLength(1);
            visitante = valorDoCookie(cookies[0]);
          }
          expect(await contatosDe(v.conta.id), `contato ${i + 1}: a linha nao nasceu`).toHaveLength(1);
        }

        // O sexto profissional distinto, em menos de 10 minutos.
        const sexto = vets[LIMITE_CURTO];
        const r = await api.post(ROTA_CONTATO, {
          headers: { ...NO_MESMO_SITE, cookie: `${COOKIE_DO_VISITANTE}=${visitante}` },
          data: pedidoDeContato(sexto.slug),
        });
        expect(r.status(), "o sexto profissional em 10 min passou do limite (D3)").toBe(429);
        expect(r.headers()["cache-control"] ?? "").toContain("no-store");
        const corpo = await r.text();
        expect(JSON.parse(corpo)).toEqual({ ok: false, motivo: "muitas_tentativas" });
        expect(corpo).not.toContain(sexto.whatsapp.slice(-8));
        expect(cookiesDoVisitante(r)).toHaveLength(0);
        expect(await contatosDe(sexto.conta.id), "o pedido recusado gravou linha").toHaveLength(0);

        // D5 vem antes do limite: quem ele JÁ chamou continua acessível.
        const repetido = await api.post(ROTA_CONTATO, {
          headers: { ...NO_MESMO_SITE, cookie: `${COOKIE_DO_VISITANTE}=${visitante}` },
          data: pedidoDeContato(vets[0].slug),
        });
        expect(repetido.status(), "o limite bloqueou um profissional que o visitante ja tinha chamado").toBe(200);
        expect(await repetido.json()).toEqual({ ok: true, whatsapp: vets[0].whatsapp });
        expect(await contatosDe(vets[0].conta.id)).toHaveLength(1);
      } finally {
        await api.dispose();
      }

      // A TELA, com o mesmo visitante no navegador (celular), e o 429 real.
      const contexto = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 375, height: 812 } });
      try {
        await contexto.addCookies([
          {
            name: COOKIE_DO_VISITANTE,
            value: visitante,
            url: BASE_URL,
            httpOnly: true,
            // `secure: false` só aqui: o servidor do teste é http, e o que se
            // prova é o VALOR do cookie chegando à rota. Os atributos reais
            // (Secure, HttpOnly, Lax, 180 dias) são de `contato-rota.spec.ts`.
            secure: false,
            sameSite: "Lax",
          },
        ]);
        const page = await contexto.newPage();
        await page.goto(`/veterinario/${vets[LIMITE_CURTO].slug}`);
        await page.getByRole("button", { name: BOTAO_WHATSAPP }).click();
        await expect(
          page.getByRole("alert").filter({ hasText: "Você abriu muitos contatos em pouco tempo." })
        ).toBeVisible();
        await expect(page.getByText(whatsappFormatado(vets[LIMITE_CURTO].whatsapp))).toHaveCount(0);
        expect(await contatosDe(vets[LIMITE_CURTO].conta.id)).toHaveLength(0);
      } finally {
        await contexto.close().catch(() => {});
      }
    });

    test("responsavel logado: a linha nasce com o user_id dele, ele a le, e outro logado nao", async ({
      browser,
    }) => {
      pularOuFalhar(credencialDoTutor === null, SEM_TUTOR);
      const v = await vetAtivo(admin!, "Logado");

      const sessao = await capturarSessao(browser, credencialDoTutor!, "E2E_TUTOR_EMAIL");
      const contexto = await browser.newContext({ baseURL: BASE_URL });
      try {
        const page = await contexto.newPage();
        await aplicarSessao(page, sessao);
        await page.goto(`/veterinario/${v.slug}`);
        await page.getByRole("button", { name: BOTAO_WHATSAPP }).click();
        await expect(page.getByText(whatsappFormatado(v.whatsapp), { exact: true })).toBeVisible();
        // Logado, o convite para criar conta não faz sentido.
        await expect(page.getByText("Quer acompanhar seus contatos?")).toHaveCount(0);
      } finally {
        await contexto.close().catch(() => {});
      }

      const { cliente: tutor, id: tutorId } = await clienteDoUsuario(credencialDoTutor!);
      try {
        const linhas = await contatosDe(v.conta.id);
        expect(linhas, "o toque logado nao gravou a linha").toHaveLength(1);
        expect(linhas[0].user_id, "o contato logado nao levou o user_id (historico do responsavel)").toBe(tutorId);
        expect(linhas[0].anon_id, "a linha nasceu sem anon_id (R-076)").not.toBeNull();

        // O responsável lê o próprio contato pelas colunas da tela (T-042).
        const { data, error } = await tutor
          .from("contatos")
          .select("id, profissional_id, canal, created_at")
          .eq("profissional_id", v.conta.id);
        expect(error, `o responsavel nao leu o proprio contato: ${error?.message}`).toBeNull();
        expect(data ?? []).toHaveLength(1);
        // E não lê o identificador do navegador, nem o próprio.
        const r = await tutor.from("contatos").select("anon_id").eq("profissional_id", v.conta.id);
        expect(r.error?.code, "o responsavel leu anon_id pelo PostgREST (R-074)").toBe("42501");
      } finally {
        await tutor.auth.signOut().catch(() => {});
      }

      // Outro logado (um vet qualquer, sem relação com o contato) não vê a linha.
      const outro = await vetAtivo(admin!, "Outro");
      const { cliente: estranho } = await clienteDoUsuario(outro.conta);
      try {
        const { data, error } = await estranho
          .from("contatos")
          .select("id, profissional_id")
          .eq("profissional_id", v.conta.id);
        expect(error).toBeNull();
        expect(data ?? [], "um logado sem relacao leu o contato de outro profissional").toHaveLength(0);
      } finally {
        await estranho.auth.signOut().catch(() => {});
      }
    });
  });
}
