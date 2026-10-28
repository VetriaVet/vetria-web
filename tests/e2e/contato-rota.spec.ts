import { test, expect, type APIResponse } from "@playwright/test";
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
  suspenderNoLugarDoMaster,
  varrerDescartaveisAntigas,
  type ContaDescartavel,
} from "../apoio/servico";
import { BASE_URL } from "../apoio/sessao";

// T-040 · A ROTA `POST /api/contato` (DL-047, DL-071 D1 a D5).
//
// Duas partes, e só a primeira roda hoje:
//
//   A. SEMPRE: o que a rota RECUSA antes de tocar no banco. Não precisa da
//      0006 nem de conta: pedido de fora do site, corpo que não é JSON, slug ou
//      tipo fora da lista. E, com a porta fechada, que um pedido válido recebe
//      `indisponivel` sem cookie e sem número.
//
//   B. SÓ COM `CONTATO_ABERTO_PARA_TESTE=1` E `E2E_ALVO=teste`: o contato de
//      verdade contra o `vetria-e2e`. O número só sai no corpo do POST, a
//      linha nasce em `contatos`, o cookie nasce com os atributos do D2, o
//      segundo clique em 24 h não duplica (D5), conta sem WhatsApp e conta que
//      saiu do ar não gravam nada.
//
// ⚠️ A PARTE B SÓ PASSA DEPOIS DA 0006 NO ALVO (sessão A, T-039). A mesma
// variável abre a rota no servidor (`lib/contato/porta.ts`) e registra a parte
// B aqui. Sem ela, nada da parte B é declarado (não aparece como pulado, e por
// isso não vira falha sob `E2E_EXIGIR_FILA=1`); o que amarra o interruptor ao
// estado real é o teste "porta" da parte A, nos dois sentidos:
//   · sem a variável, ele EXIGE `indisponivel` (503) para um pedido válido;
//   · com a variável, ele EXIGE `nao_encontrado` (404) para um slug que não
//     existe, o que só acontece se a função da 0006 respondeu. Variável ligada
//     num banco sem a 0006 fica vermelho, com o motivo.
//
// A linha, no bloco `env:` do job em `.github/workflows/ci.yml`, DEPOIS da
// 0006 aplicada no vetria-e2e (o `next start` do CI herda o env do job, e é
// assim que a variável chega ao servidor):
//
//     CONTATO_ABERTO_PARA_TESTE: "1"
//
// A porta NUNCA abre contra produção, nem com a variável: `porta.ts` recusa o
// modo de teste quando `VERCEL_ENV=production` ou quando a URL do Supabase é a
// de produção (o caso do build local, que lê o `.env.local`).

const CONTATO_LIGADO = process.env.CONTATO_ABERTO_PARA_TESTE === "1";
const ATIVO = alvoEhTeste();

const COMO_DESLIGAR =
  "CONTATO_ABERTO_PARA_TESTE=1, mas a rota nao chegou a funcao registrar_contato. Aplique a 0006 no banco do alvo (T-039), ou tire a variavel. Local, confira que o servidor Next aponta para o vetria-e2e e nao para producao.";

const ROTA = "/api/contato";
const NO_MESMO_SITE = { "content-type": "application/json", "sec-fetch-site": "same-origin" };

type Corpo = Record<string, unknown>;

function pedido(slug: string, tipo = "vet", origem: Corpo | null = null): Corpo {
  return { alvo: { tipo, slug }, origem: origem ?? { cidade: null, especialidade: null }, canal: "whatsapp" };
}

/** Os `Set-Cookie` do cookie do visitante, crus. */
function cookiesDoVisitante(r: APIResponse): string[] {
  return r
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie" && /^vetria_visitante=/i.test(h.value))
    .map((h) => h.value);
}

async function conferirRecusa(r: APIResponse, status: number, motivo: string, quando: string) {
  expect(r.status(), `${quando}: status`).toBe(status);
  expect(r.headers()["cache-control"] ?? "", `${quando}: sem Cache-Control no-store`).toContain("no-store");
  expect(await r.json(), quando).toEqual({ ok: false, motivo });
  expect(cookiesDoVisitante(r), `${quando}: recusa criou o cookie do visitante (D2: so no contato que deu certo)`).toHaveLength(0);
}

// ---------------------------------------------------------------------------
// A. SEMPRE
// ---------------------------------------------------------------------------
test.describe("POST /api/contato: o que a rota recusa antes do banco", () => {
  test("pedido de fora do site e recusado (Sec-Fetch-Site, R-057)", async ({ request }) => {
    const corpo = pedido("qualquer-um-palmas-to");
    await conferirRecusa(
      await request.post(ROTA, { headers: { "content-type": "application/json" }, data: corpo }),
      403,
      "indisponivel",
      "sem Sec-Fetch-Site"
    );
    for (const site of ["cross-site", "same-site", "none"]) {
      await conferirRecusa(
        await request.post(ROTA, { headers: { "content-type": "application/json", "sec-fetch-site": site }, data: corpo }),
        403,
        "indisponivel",
        `Sec-Fetch-Site: ${site}`
      );
    }
  });

  test("o fetch do proprio site passa da conferencia de origem (o navegador manda same-origin)", async ({ page }) => {
    // Prova o caminho que o botão da T-041 vai usar: um `fetch` de dentro da
    // página. Slug inválido de propósito: passa do 403 e para no 400, sem
    // chegar ao banco.
    await page.goto("/buscar");
    const r = await page.evaluate(async () => {
      const resposta = await fetch("/api/contato", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ alvo: { tipo: "vet", slug: "NAO-E-SLUG" }, canal: "whatsapp" }),
      });
      return { status: resposta.status, corpo: await resposta.json() };
    });
    expect(r.status, "o navegador nao passou da conferencia de Sec-Fetch-Site").toBe(400);
    expect(r.corpo).toEqual({ ok: false, motivo: "nao_encontrado" });
  });

  test("so POST: GET nao existe", async ({ request }) => {
    const r = await request.get(ROTA);
    expect(r.status()).toBe(405);
  });

  test("corpo que nao e JSON e recusado", async ({ request }) => {
    await conferirRecusa(
      await request.post(ROTA, {
        headers: { "content-type": "application/x-www-form-urlencoded", "sec-fetch-site": "same-origin" },
        data: "alvo=1",
      }),
      415,
      "indisponivel",
      "form de fora"
    );
    await conferirRecusa(
      await request.post(ROTA, { headers: NO_MESMO_SITE, data: "{nao e json" }),
      400,
      "indisponivel",
      "JSON quebrado"
    );
    await conferirRecusa(
      await request.post(ROTA, { headers: NO_MESMO_SITE, data: { ...pedido("a-b"), lixo: "x".repeat(5000) } }),
      413,
      "indisponivel",
      "corpo grande demais"
    );
  });

  test("slug e tipo fora da lista sao recusados", async ({ request }) => {
    const ruins: [string, Corpo][] = [
      ["slug com barra", pedido("../perfil_privado")],
      ["slug com maiuscula", pedido("Ana-Palmas-TO")],
      ["slug com espaco", pedido("ana palmas")],
      ["slug com hifen no fim", pedido("ana-")],
      ["slug grande demais", pedido("a".repeat(121))],
      ["slug vazio", pedido("")],
      ["slug numero", { alvo: { tipo: "vet", slug: 123 }, canal: "whatsapp" }],
      ["tipo tutor", pedido("ana-palmas-to", "tutor")],
      ["tipo admin", pedido("ana-palmas-to", "admin")],
      ["tipo com rota em portugues", pedido("ana-palmas-to", "veterinario")],
    ];
    for (const [quando, corpo] of ruins) {
      await conferirRecusa(await request.post(ROTA, { headers: NO_MESMO_SITE, data: corpo }), 400, "nao_encontrado", quando);
    }
    for (const [quando, corpo] of [
      ["canal telefone", { ...pedido("ana-palmas-to"), canal: "telefone" }],
      ["sem canal", { alvo: { tipo: "vet", slug: "ana-palmas-to" } }],
      ["sem alvo", { canal: "whatsapp" }],
      ["origem numero", pedido("ana-palmas-to", "vet", { cidade: 5 })],
      ["lista no lugar do corpo", [1, 2]],
    ] as [string, unknown][]) {
      await conferirRecusa(await request.post(ROTA, { headers: NO_MESMO_SITE, data: corpo }), 400, "indisponivel", quando);
    }
  });

  test("porta: o interruptor bate com o que a rota faz", async ({ request }) => {
    const r = await request.post(ROTA, {
      headers: NO_MESMO_SITE,
      data: pedido(`ninguem-${marcaDeRodada()}-palmas-to`),
    });
    const corpo = await r.text();
    expect(corpo, "a resposta trouxe digitos de telefone").not.toMatch(/\d{8}/);
    if (!CONTATO_LIGADO) {
      // Produção hoje: CONTATO_PELO_SITE_ABERTO = false. Nada é gravado,
      // nenhum cookie nasce, e a resposta diz a verdade.
      expect(r.status(), "com a porta fechada, um pedido valido tem de receber 503").toBe(503);
      expect(JSON.parse(corpo)).toEqual({ ok: false, motivo: "indisponivel" });
      expect(cookiesDoVisitante(r)).toHaveLength(0);
    } else {
      expect(r.status(), COMO_DESLIGAR).toBe(404);
      expect(JSON.parse(corpo)).toEqual({ ok: false, motivo: "nao_encontrado" });
      expect(cookiesDoVisitante(r)).toHaveLength(0);
    }
  });
});

// ---------------------------------------------------------------------------
// B. SÓ COM A 0006 NO ALVO E A PORTA ABERTA PARA TESTE
// ---------------------------------------------------------------------------
function digitos(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

/** Vet descartável aprovado (com slug), com ou sem WhatsApp privado. */
async function vetAtivo(
  admin: SupabaseClient,
  rotulo: string,
  whatsapp: string | null
): Promise<{ conta: ContaDescartavel; slug: string }> {
  const marca = marcaDeRodada();
  const nome = `QA E2E Contato ${rotulo} ${marca[0].toUpperCase()}${marca.slice(1)}`;
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

type LinhaDeContato = {
  profissional_id: string;
  user_id: string | null;
  anon_id: string | null;
  canal: string;
  origem_cidade: string | null;
  origem_especialidade: string | null;
};

/** Leitura com service_role: é prova do que o banco gravou, não atalho. */
async function contatosDe(profissionalId: string): Promise<LinhaDeContato[]> {
  const { data, error } = await clienteDeServico()
    .from("contatos")
    .select("profissional_id, user_id, anon_id, canal, origem_cidade, origem_especialidade")
    .eq("profissional_id", profissionalId);
  if (error) throw new Error(`contatosDe: ${error.code}: ${error.message}`);
  return (data ?? []) as LinhaDeContato[];
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

if (CONTATO_LIGADO) {
  test.describe("POST /api/contato com a 0006: grava e so entao devolve o numero", () => {
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

    test("o numero so vem no corpo do POST, a linha nasce e o cookie nasce com os atributos do D2", async ({
      playwright,
      page,
      request,
    }) => {
      const whatsapp = `639${digitos(8)}`;
      const { conta, slug } = await vetAtivo(admin!, "Ativo", whatsapp);

      // Antes do clique: o perfil não tem o número em lugar nenhum.
      await conferirSemContatoNoHtml(request, page, `/veterinario/${slug}`, [whatsapp]);

      // Role errado para o mesmo slug: não acha, não grava.
      const api = await playwright.request.newContext({ baseURL: BASE_URL });
      try {
        await conferirRecusa(
          await api.post(ROTA, { headers: NO_MESMO_SITE, data: pedido(slug, "clinic") }),
          404,
          "nao_encontrado",
          "slug de vet pedido como clinic"
        );
        expect(await contatosDe(conta.id)).toHaveLength(0);

        // O clique.
        const r = await api.post(ROTA, {
          headers: NO_MESMO_SITE,
          data: pedido(slug, "vet", { cidade: "goiania-go", especialidade: "cardiologia" }),
        });
        expect(r.status()).toBe(200);
        expect(r.headers()["cache-control"] ?? "").toContain("no-store");
        expect(await r.json()).toEqual({ ok: true, whatsapp });

        const cookies = cookiesDoVisitante(r);
        expect(cookies, "o primeiro contato tem de criar exatamente um cookie do visitante").toHaveLength(1);
        const cru = cookies[0];
        const valor = cru.split(";")[0].split("=")[1];
        expect(valor, "o valor do cookie tem de ser um UUID aleatorio, nada mais").toMatch(UUID_V4);
        expect(cru).toMatch(/;\s*HttpOnly/i);
        expect(cru).toMatch(/;\s*Secure/i);
        expect(cru).toMatch(/;\s*SameSite=Lax/i);
        expect(cru).toMatch(/;\s*Path=\/(;|$)/i);
        expect(cru).toMatch(/;\s*Max-Age=15552000(;|$)/i);

        // A linha, no banco.
        const linhas = await contatosDe(conta.id);
        expect(linhas).toEqual([
          {
            profissional_id: conta.id,
            user_id: null,
            anon_id: valor,
            canal: "whatsapp",
            origem_cidade: "goiania-go",
            origem_especialidade: "cardiologia",
          },
        ]);

        // D5: o mesmo visitante de novo em 24 h recebe o número, e não conta 2.
        const de_novo = await api.post(ROTA, {
          headers: { ...NO_MESMO_SITE, cookie: `vetria_visitante=${valor}` },
          data: pedido(slug),
        });
        expect(de_novo.status()).toBe(200);
        expect(await de_novo.json()).toEqual({ ok: true, whatsapp });
        expect(cookiesDoVisitante(de_novo), "visitante conhecido nao ganha cookie novo").toHaveLength(0);
        expect(await contatosDe(conta.id), "o segundo clique em 24 h duplicou a linha (D5)").toHaveLength(1);
      } finally {
        await api.dispose();
      }

      // Cookie que não é nosso é trocado por um novo: é outro visitante.
      const outro = await playwright.request.newContext({ baseURL: BASE_URL });
      try {
        const r = await outro.post(ROTA, {
          headers: { ...NO_MESMO_SITE, cookie: "vetria_visitante=nao-e-um-uuid" },
          data: pedido(slug, "vet", { cidade: "Nao E Slug", especialidade: "inventada-pelo-teste" }),
        });
        expect(r.status()).toBe(200);
        const novo = cookiesDoVisitante(r);
        expect(novo).toHaveLength(1);
        expect(novo[0].split(";")[0].split("=")[1]).toMatch(UUID_V4);
        const linhas = await contatosDe(conta.id);
        expect(linhas).toHaveLength(2);
        // Origem fora da lista não entra na métrica (a rota zera o formato
        // errado; o banco zera o que não está na tabela).
        const segunda = linhas.find((l) => l.origem_cidade === null);
        expect(segunda?.origem_especialidade ?? null).toBeNull();
      } finally {
        await outro.dispose();
      }

      // Depois do clique, o perfil continua sem o número no HTML.
      await conferirSemContatoNoHtml(request, page, `/veterinario/${slug}`, [whatsapp]);
    });

    test("perfil sem WhatsApp devolve sem_whatsapp e nao grava", async ({ playwright }) => {
      const { conta, slug } = await vetAtivo(admin!, "SemZap", null);
      const api = await playwright.request.newContext({ baseURL: BASE_URL });
      try {
        await conferirRecusa(
          await api.post(ROTA, { headers: NO_MESMO_SITE, data: pedido(slug) }),
          422,
          "sem_whatsapp",
          "perfil sem WhatsApp"
        );
      } finally {
        await api.dispose();
      }
      expect(await contatosDe(conta.id)).toHaveLength(0);
    });

    test("conta que saiu de active devolve nao_encontrado e nao grava", async ({ playwright }) => {
      const whatsapp = `639${digitos(8)}`;
      const { conta, slug } = await vetAtivo(admin!, "Suspenso", whatsapp);
      await suspenderNoLugarDoMaster(conta.id);
      const api = await playwright.request.newContext({ baseURL: BASE_URL });
      try {
        const r = await api.post(ROTA, { headers: NO_MESMO_SITE, data: pedido(slug) });
        expect(await r.text()).not.toContain(whatsapp.slice(-8));
        expect(r.status()).toBe(404);
      } finally {
        await api.dispose();
      }
      expect(await contatosDe(conta.id)).toHaveLength(0);
    });
  });
}
