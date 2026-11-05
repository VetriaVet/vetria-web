import { test, expect, type APIRequestContext, type Browser, type BrowserContext } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { alvoEhTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";
import { EXIGIR, falharSeExigir } from "../apoio/pulo";
import {
  PDF_DE_TESTE,
  apagarContasDaRodada,
  clienteDeServico,
  criarContaDescartavel,
  lerPerfil,
  varrerDescartaveisAntigas,
  type ContaDescartavel,
} from "../apoio/servico";
import { BASE_URL, capturarSessao } from "../apoio/sessao";

// REVISÃO DE SEGURANÇA DE 04/11/2026: as rotas que mudam estado.
//
//   A. SEMPRE (sem conta, sem banco): pedido marcado pelo navegador como de
//      fora do site é recusado nas quatro rotas de sessão, e as rotas JSON
//      recusam corpo que não é JSON. Tudo isso sai ANTES da sessão.
//
//   B. SÓ NO PROJETO DE TESTE (`E2E_ALVO=teste`, DL-064):
//      · `/api/admin/set-access`: só master, lista fechada, não mexe na
//        própria conta, vet/clinic nascem `incomplete`, trilha com actor_id;
//      · `/api/documentos/upload`: no máximo 5 envios por hora por conta,
//        contados pelos objetos do prefixo `<uid>/`, e o sexto é 429.
//
// ⚠️ PREPARAÇÃO COM `service_role`, e só preparação: a conta master desta
// rodada é uma descartável promovida direto no banco (não existe master de
// teste fixo, e o master do Elber nunca entra em teste). Os objetos semeados
// no bucket servem só para encher a janela do limite. Tudo é apagado no
// `afterAll` por `apagarContasDaRodada`; as linhas de `audit_logs` ficam, como
// em todo o resto da suíte (a trilha não se apaga).

const ATIVO = alvoEhTeste();

const ROTAS_JSON = ["/api/admin/set-access", "/api/onboarding/set-role", "/api/documentos/abrir"];
const UPLOAD = "/api/documentos/upload";

function multipartPdf() {
  return {
    arquivo: { name: "documento.pdf", mimeType: "application/pdf", buffer: PDF_DE_TESTE },
  };
}

// ---------------------------------------------------------------------------
// A. SEMPRE
// ---------------------------------------------------------------------------
test.describe("CSRF em profundidade: pedido de fora do site nao passa", () => {
  for (const rota of ROTAS_JSON) {
    test(`${rota} recusa Sec-Fetch-Site de fora e Origin de outro site`, async ({ request }) => {
      for (const site of ["cross-site", "same-site", "none"]) {
        const r = await request.post(rota, {
          headers: { "content-type": "application/json", "sec-fetch-site": site },
          data: {},
        });
        expect(r.status(), `${rota} com Sec-Fetch-Site: ${site}`).toBe(403);
      }
      const r = await request.post(rota, {
        headers: { "content-type": "application/json", origin: "https://site-malicioso.example" },
        data: {},
      });
      expect(r.status(), `${rota} com Origin de outro site`).toBe(403);
    });

    test(`${rota} recusa corpo que nao e JSON`, async ({ request }) => {
      const r = await request.post(rota, {
        headers: { "content-type": "text/plain", "sec-fetch-site": "same-origin" },
        data: "{}",
      });
      expect(r.status(), await r.text()).toBe(415);
    });
  }

  test(`${UPLOAD} recusa Sec-Fetch-Site de fora`, async ({ request }) => {
    for (const site of ["cross-site", "same-site", "none"]) {
      const r = await request.post(UPLOAD, {
        headers: { "sec-fetch-site": site },
        multipart: multipartPdf(),
      });
      expect(r.status(), `upload com Sec-Fetch-Site: ${site}`).toBe(403);
    }
  });

  test("o fetch do proprio site passa da conferencia de origem e para na sessao", async ({ page }) => {
    // O navegador manda `same-origin` sozinho. Sem sessão, a recusa que
    // aparece tem de ser a de sessão (401), não a de origem (403).
    await page.goto("/");
    const status = await page.evaluate(async () => {
      const r = await fetch("/api/admin/set-access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target_user_id: "00000000-0000-0000-0000-000000000000", new_role: "vet" }),
      });
      return r.status;
    });
    expect(status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// B. SÓ NO PROJETO DE TESTE
// ---------------------------------------------------------------------------

async function contextoComSessao(browser: Browser, conta: ContaDescartavel): Promise<BrowserContext> {
  const cookies = await capturarSessao(browser, conta, `conta descartavel ${conta.nome}`);
  const contexto = await browser.newContext({ baseURL: BASE_URL });
  await contexto.addCookies(cookies);
  return contexto;
}

const DO_SITE = { "content-type": "application/json", "sec-fetch-site": "same-origin" };

test.describe("set-access e limite de upload, contra o vetria-e2e", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });
  test.skip(!ATIVO && !EXIGIR, SEM_ALVO_DE_TESTE);

  let master: ContaDescartavel;
  let alvo: ContaDescartavel;
  let vet: ContaDescartavel;
  let ctxMaster: BrowserContext;
  let ctxAlvo: BrowserContext;
  let ctxVet: BrowserContext;
  let reqMaster: APIRequestContext;

  test.beforeAll(async ({ browser }) => {
    falharSeExigir(!ATIVO, SEM_ALVO_DE_TESTE);
    if (!ATIVO) return;
    test.setTimeout(240_000);
    await varrerDescartaveisAntigas(60);

    master = await criarContaDescartavel("tutor", "QA Master Descartavel");
    alvo = await criarContaDescartavel("tutor", "QA Alvo Descartavel");
    vet = await criarContaDescartavel("vet", "QA Vet Limite");

    // Preparação: a conta vira master direto no banco (ver o topo do arquivo).
    const { error } = await clienteDeServico()
      .from("profiles")
      .update({ role: "admin", admin_level: "master", admin_team: "none" })
      .eq("id", master.id);
    if (error) throw new Error(`promover master de teste: ${error.code}: ${error.message}`);

    ctxMaster = await contextoComSessao(browser, master);
    ctxAlvo = await contextoComSessao(browser, alvo);
    ctxVet = await contextoComSessao(browser, vet);
    reqMaster = ctxMaster.request;
  });

  test.afterAll(async () => {
    await ctxMaster?.close().catch(() => {});
    await ctxAlvo?.close().catch(() => {});
    await ctxVet?.close().catch(() => {});
    if (!ATIVO) return;
    await apagarContasDaRodada();
  });

  test("set-access: conta que nao e master recebe 403 e nada muda", async () => {
    const r = await ctxAlvo.request.post("/api/admin/set-access", {
      headers: DO_SITE,
      data: { target_user_id: alvo.id, new_admin_level: "master" },
    });
    expect(r.status(), await r.text()).toBe(403);
    const depois = await lerPerfil(alvo.id);
    expect(depois.role).toBe("tutor");
    expect(depois.admin_level ?? "none").toBe("none");
  });

  test("set-access: fora da lista fechada e 400, sem mensagem tecnica", async () => {
    const invalidos: Record<string, unknown>[] = [
      { target_user_id: "nao-e-uuid", new_role: "vet" },
      { new_role: "vet" },
      { target_user_id: alvo.id, new_role: "admin" },
      { target_user_id: alvo.id, new_role: "superuser" },
      { target_user_id: alvo.id, new_admin_level: "god" },
      { target_user_id: alvo.id, new_role: "tutor", new_admin_level: "none", new_admin_team: "ops" },
      { target_user_id: alvo.id, new_admin_level: "admin", new_admin_team: "diretoria" },
    ];
    for (const corpo of invalidos) {
      const r = await reqMaster.post("/api/admin/set-access", { headers: DO_SITE, data: corpo });
      expect(r.status(), JSON.stringify(corpo)).toBe(400);
      const json = (await r.json()) as Record<string, unknown>;
      expect(Object.keys(json)).toEqual(["error"]);
    }
    const depois = await lerPerfil(alvo.id);
    expect(depois.role).toBe("tutor");
  });

  test("set-access: o master nao altera a propria conta", async () => {
    const r = await reqMaster.post("/api/admin/set-access", {
      headers: DO_SITE,
      data: { target_user_id: master.id, new_role: "tutor" },
    });
    expect(r.status(), await r.text()).toBe(409);
    const depois = await lerPerfil(master.id);
    expect(depois.role).toBe("admin");
    expect(depois.admin_level).toBe("master");
  });

  test("set-access: virar vet comeca em incomplete, com trilha de quem mudou", async () => {
    expect((await lerPerfil(alvo.id)).status, "o responsavel nasce active").toBe("active");

    const r = await reqMaster.post("/api/admin/set-access", {
      headers: DO_SITE,
      data: { target_user_id: alvo.id, new_role: "vet" },
    });
    expect(r.status(), await r.text()).toBe(200);

    const depois = await lerPerfil(alvo.id);
    expect(depois.role).toBe("vet");
    expect(depois.status, "vet herdou o active do responsavel").toBe("incomplete");
    expect(depois.admin_level).toBe("none");

    const { data: trilha, error } = await clienteDeServico()
      .from("audit_logs")
      .select("actor_id, acao, alvo_tipo, detalhe")
      .eq("alvo_id", alvo.id)
      .eq("acao", "acesso_alterado")
      .order("created_at", { ascending: false })
      .limit(1);
    expect(error).toBeNull();
    expect(trilha?.length, "a troca de acesso nao entrou em audit_logs").toBe(1);
    expect(trilha?.[0].actor_id, "a trilha nao diz quem mudou").toBe(master.id);
    expect(trilha?.[0].alvo_tipo).toBe("profiles");

    // Repetir o mesmo destino não escreve nada.
    const de_novo = await reqMaster.post("/api/admin/set-access", {
      headers: DO_SITE,
      data: { target_user_id: alvo.id, new_role: "vet" },
    });
    expect(de_novo.status()).toBe(200);
    expect(await de_novo.json()).toEqual({ ok: true, alterado: false });
  });

  test("set-access: promover a master e rebaixar de novo, havendo outro master", async () => {
    const promove = await reqMaster.post("/api/admin/set-access", {
      headers: DO_SITE,
      data: { target_user_id: alvo.id, new_role: "admin", new_admin_level: "master", new_admin_team: "ops" },
    });
    expect(promove.status(), await promove.text()).toBe(200);
    const promovido = await lerPerfil(alvo.id);
    expect(promovido.role).toBe("admin");
    expect(promovido.admin_level).toBe("master");

    const rebaixa = await reqMaster.post("/api/admin/set-access", {
      headers: DO_SITE,
      data: { target_user_id: alvo.id, new_role: "tutor" },
    });
    expect(rebaixa.status(), await rebaixa.text()).toBe(200);
    const rebaixado = await lerPerfil(alvo.id);
    expect(rebaixado.role).toBe("tutor");
    expect(rebaixado.admin_level).toBe("none");
  });

  test("upload: o sexto envio na mesma hora e 429, e nada novo sobe", async () => {
    // Quatro objetos semeados na janela; o quinto vai pela rota e passa.
    const s = clienteDeServico();
    for (let i = 0; i < 4; i++) {
      const { error } = await s.storage
        .from("documentos")
        .upload(`${vet.id}/qa-e2e-limite-${i}-${randomUUID().slice(0, 8)}.pdf`, PDF_DE_TESTE, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (error) throw new Error(`semear objeto ${i}: ${error.message}`);
    }

    const quinto = await ctxVet.request.post(UPLOAD, {
      headers: { "sec-fetch-site": "same-origin" },
      multipart: multipartPdf(),
    });
    expect(quinto.status(), await quinto.text()).toBe(200);

    const sexto = await ctxVet.request.post(UPLOAD, {
      headers: { "sec-fetch-site": "same-origin" },
      multipart: multipartPdf(),
    });
    expect(sexto.status(), await sexto.text()).toBe(429);
    const corpo = (await sexto.json()) as { erro?: string };
    expect(corpo.erro).toMatch(/5 documentos na última hora/);

    const { data } = await s.storage.from("documentos").list(vet.id, { limit: 100 });
    expect((data ?? []).filter((o) => o.id).length, "o envio recusado deixou objeto no bucket").toBe(5);
  });
});
