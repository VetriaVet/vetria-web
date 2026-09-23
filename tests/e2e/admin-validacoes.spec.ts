import { randomUUID } from "node:crypto";
import { test, expect, type Cookie } from "@playwright/test";
import {
  credencialAdmin,
  credencialClinic,
  credencialTutor,
  credencialVet,
  SEM_ADMIN,
  SEM_CLINIC,
  SEM_CREDENCIAL,
  SEM_TUTOR,
} from "../apoio/credenciais";
import {
  aplicarSessao,
  capturarSessao,
  medirDestinoDeApp,
  rotaExata,
} from "../apoio/sessao";
import { EXIGIR, falharSeExigir } from "../apoio/pulo";
import { alvoEhTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";

// Camada 5 da suíte: A FILA DE VALIDAÇÃO (T-023 + T-024), E O QUE DÁ PARA
// PROVAR DELA SEM MUDAR NADA EM PRODUÇÃO.
//
// Escrito pelo `vetria-qa` em 23/09/2026, no dia em que a T-024 foi provada em
// tela. Revisto no mesmo dia para o DL-064 (projeto Supabase de teste).
//
//   ⚠️ NENHUM TESTE AQUI ESCREVE. Nenhum aprova, nenhum reprova, nenhum
//   conclui onboarding, nenhum sobe arquivo. Tudo é navegação ou pedido que o
//   servidor recusa ANTES de tocar tabela, bucket ou `audit_logs`. Por isso
//   este arquivo roda nos DOIS alvos (produção e `vetria-e2e`).
//
//   ⚠️ A EXCEÇÃO É DE CREDENCIAL, NÃO DE ESCRITA: os blocos do admin e do
//   estabelecimento só rodam com `E2E_ALVO=teste`. Os testes não escrevem,
//   mas uma credencial de admin no CI de produção aprova qualquer conta pela
//   tela (card da T-029, "Não fazer").
//
// O que escreve (a aprovação e a reprova de verdade, a persistência do item 1
// numa conta nova, a conclusão sem documento) mora em
// `fluxos-conta-nova.spec.ts`, e só roda no projeto de teste.
//
// Os uuids "que não existem" são `randomUUID()` (v4, 122 bits aleatórios): a
// chance de colidir com uma conta real é desprezível, e um uuid fixo escrito
// aqui viraria, um dia, o id de alguém.

const ROTA_FILA = "/admin/validacoes";

// ---------------------------------------------------------------------------
// 1. VISITANTE — sem credencial, roda em toda máquina
// ---------------------------------------------------------------------------

test.describe("a fila de validacao nao aceita visitante", () => {
  // `publico.spec.ts` já prova `/admin`. Aqui é a rota que carrega dado privado
  // de terceiro (CNPJ, WhatsApp, documento) e o detalhe por uuid, que é onde
  // um `matcher` mal editado deixaria a porta aberta sem nenhuma tela quebrar.
  for (const rota of [ROTA_FILA, `${ROTA_FILA}/${randomUUID()}`]) {
    test(`visitante sem sessao em ${rota.replace(/[0-9a-f-]{36}$/, "<uuid>")} cai no login`, async ({
      page,
    }) => {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("POST em /api/documentos/abrir com dono de terceiro e sem sessao devolve 401", async ({
    request,
  }) => {
    // O teste irmão em `publico.spec.ts` manda corpo vazio. Este manda o
    // formato que o admin usa (`{ dono: <uuid> }`): a recusa por falta de
    // sessão tem que vir antes de o corpo ser sequer interpretado.
    const resposta = await request.post("/api/documentos/abrir", {
      headers: { "Content-Type": "application/json" },
      data: { dono: randomUUID() },
    });
    expect(resposta.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 2. CONTA VET — qualquer status. Não depende de a conta estar na fila
// ---------------------------------------------------------------------------
// ⚠️ Estes testes NÃO usam `exigirContaNaFila()`, de propósito: valem para vet
// em `incomplete`, `pending_validation` ou `active`. É a parte da cobertura que
// sobrevive ao dia em que alguém aprova ou reprova a conta de teste (o que
// aconteceu em 23/09, na prova da T-024).

test.describe("a conta vet nao alcanca a fila de validacao", () => {
  const credencial = credencialVet();
  test.skip(credencial === null && !EXIGIR, SEM_CREDENCIAL);

  let sessao: Cookie[] = [];
  let destino = "";

  test.beforeAll(async ({ browser }) => {
    falharSeExigir(credencial === null, SEM_CREDENCIAL);
    if (!credencial) return;
    test.setTimeout(120_000);
    sessao = await capturarSessao(browser, credencial, "E2E_VET_EMAIL");
    destino = await medirDestinoDeApp(browser, sessao);
  });

  test.beforeEach(async ({ page }) => {
    await aplicarSessao(page, sessao);
  });

  test("vet digitando /admin/validacoes e o detalhe volta ao proprio painel", async ({
    page,
  }) => {
    // Matriz §2: validar é do admin. Profissional que abre a fila vê o CNPJ e
    // o WhatsApp dos concorrentes, e o detalhe tem o botão de aprovar.
    for (const rota of [ROTA_FILA, `${ROTA_FILA}/${randomUUID()}`]) {
      await page.goto(rota);
      await expect(page, `rota ${rota}`).toHaveURL(rotaExata(destino));
    }
  });

  test("vet pedindo o documento de outra conta recebe 403, sem URL assinada", async ({
    page,
  }) => {
    // `app/api/documentos/abrir/route.ts`: `!ehProprio && !ehAdmin` recusa
    // ANTES de ler a linha do alvo, antes da trilha e antes de assinar. Não
    // escreve nada (só um `console.warn` no log do servidor).
    //
    // A rota está FORA do `matcher` do middleware (SEC-079). Se este teste
    // cair, um profissional lê o documento de identidade de outro com um POST.
    const resposta = await page.request.post("/api/documentos/abrir", {
      headers: { "Content-Type": "application/json" },
      data: { dono: randomUUID() },
    });

    expect(resposta.status(), await resposta.text()).toBe(403);
    const corpo = (await resposta.json()) as { erro?: string; url?: string };
    expect(corpo.url, "a recusa devolveu uma URL assinada").toBeUndefined();
    expect(corpo.erro).toMatch(/não tem acesso/i);
  });

  test("dono que nao e uuid e recusado com 400, sem erro tecnico", async ({
    page,
  }) => {
    // O corpo aceita no máximo o uuid do dono; o caminho no bucket nunca vem
    // do cliente (passo 3 da rota). Lixo no campo não pode virar consulta.
    const resposta = await page.request.post("/api/documentos/abrir", {
      headers: { "Content-Type": "application/json" },
      data: { dono: "../outra-pessoa/documento.pdf" },
    });

    expect(resposta.status(), await resposta.text()).toBe(400);
    const corpo = (await resposta.json()) as { erro?: string };
    expect(corpo.erro).toBe("Pedido inválido.");
  });
});

// ---------------------------------------------------------------------------
// 3. CONTA TUTOR — item 4 do DoD ao pé da letra, automatizado
// ---------------------------------------------------------------------------
// O item 4 foi fechado em 23/09 por passada MANUAL do Elber. O teste que o
// automatiza só navega; ele espera o secret E2E_TUTOR_*.

test.describe("o responsavel nao entra no painel do profissional nem no admin", () => {
  const credencial = credencialTutor();
  test.skip(credencial === null && !EXIGIR, SEM_TUTOR);

  let sessao: Cookie[] = [];
  let destino = "";

  test.beforeAll(async ({ browser }) => {
    falharSeExigir(credencial === null, SEM_TUTOR);
    if (!credencial) return;
    test.setTimeout(120_000);
    sessao = await capturarSessao(browser, credencial, "E2E_TUTOR_EMAIL");
    destino = await medirDestinoDeApp(browser, sessao);
  });

  test.beforeEach(async ({ page }) => {
    await aplicarSessao(page, sessao);
  });

  test("/app despacha o responsavel para o painel dele", async () => {
    // `/app/responsavel` ou `/app/responsavel/onboarding`, conforme a conta já
    // concluiu ou não o onboarding do responsável (`app/app/page.tsx`).
    expect(destino).toMatch(/^\/app\/responsavel(\/onboarding)?$/);
  });

  test("responsavel digitando rotas de vet, estabelecimento e admin volta ao proprio painel", async ({
    page,
  }) => {
    for (const rota of [
      "/app/veterinario",
      "/app/veterinario/onboarding",
      "/app/veterinario/aguardando",
      "/app/estabelecimento",
      "/admin",
      ROTA_FILA,
    ]) {
      await page.goto(rota);
      await expect(page, `rota ${rota}`).toHaveURL(rotaExata(destino));
    }
  });
});

// ---------------------------------------------------------------------------
// 4. CONTA ADMIN COMUM — só leitura, e só no projeto de teste
// ---------------------------------------------------------------------------
// ⚠️ E2E_ADMIN_* só existe no `vetria-e2e` (DL-064). Os testes abaixo não
// escrevem, mas a credencial de admin no CI de produção aprovaria qualquer
// conta pela tela. Sem `E2E_ALVO=teste`, o bloco inteiro pula (ou falha, com
// `E2E_EXIGIR_FILA=1`), mesmo que alguém crie o secret por engano.

const credencialAdminDeTeste = alvoEhTeste() ? credencialAdmin() : null;
const MOTIVO_SEM_ADMIN = alvoEhTeste() ? SEM_ADMIN : SEM_ALVO_DE_TESTE;

test.describe("a fila de validacao, vista pelo admin comum (so leitura)", () => {
  const credencial = credencialAdminDeTeste;
  test.skip(credencial === null && !EXIGIR, MOTIVO_SEM_ADMIN);

  let sessao: Cookie[] = [];

  test.beforeAll(async ({ browser }) => {
    falharSeExigir(credencial === null, MOTIVO_SEM_ADMIN);
    if (!credencial) return;
    test.setTimeout(120_000);
    sessao = await capturarSessao(browser, credencial, "E2E_ADMIN_EMAIL");
  });

  test.beforeEach(async ({ page }) => {
    await aplicarSessao(page, sessao);
  });

  test("a fila abre e renderiza, vazia ou nao", async ({ page }) => {
    const resposta = await page.goto(ROTA_FILA);
    expect(resposta?.status()).toBe(200);
    await expect(page).toHaveURL(rotaExata(ROTA_FILA));
    await expect(
      page.getByRole("heading", { level: 1, name: /^valida[cç][oõ]es$/i })
    ).toBeVisible();
  });

  test("detalhe de uuid que nao existe da 404, e nao uma tela vazia", async ({
    page,
  }) => {
    // `carregarCadastro` devolve `null` para cinco casos com a mesma resposta
    // (uuid lixo, conta inexistente, fora da fila, fora de vet/clinic, RLS),
    // e a página vira `notFound()`. É a mesma porta que fecha o dossiê de quem
    // já foi decidido (DL-061), então um uuid aleatório a exercita sem tocar
    // em conta nenhuma.
    const resposta = await page.goto(`${ROTA_FILA}/${randomUUID()}`);
    expect(resposta?.status()).toBe(404);
    await expect(page.getByText(/página não encontrada/i)).toBeVisible();
  });

  test("detalhe com id que nao e uuid da 404 antes de ir ao banco", async ({
    page,
  }) => {
    const resposta = await page.goto(`${ROTA_FILA}/nao-e-um-uuid`);
    expect(resposta?.status()).toBe(404);
    await expect(page.getByText(/página não encontrada/i)).toBeVisible();
  });

  test("admin pedindo documento de conta fora da fila recebe 404, sem URL", async ({
    page,
  }) => {
    // SEC-097(a): o admin só abre documento ENQUANTO HÁ VALIDAÇÃO. A recusa
    // vem antes da trilha em `audit_logs` e antes de assinar, então isto não
    // escreve linha de auditoria.
    const resposta = await page.request.post("/api/documentos/abrir", {
      headers: { "Content-Type": "application/json" },
      data: { dono: randomUUID() },
    });

    expect(resposta.status(), await resposta.text()).toBe(404);
    const corpo = (await resposta.json()) as { erro?: string; url?: string };
    expect(corpo.url).toBeUndefined();
    expect(corpo.erro).toMatch(/não está na fila/i);
  });

  test("admin nao entra nos paineis profissionais", async ({ page }) => {
    for (const rota of ["/app/veterinario", "/app/estabelecimento", "/app/responsavel"]) {
      await page.goto(rota);
      await expect(page, `rota ${rota}`).toHaveURL(rotaExata("/admin"));
    }
  });
});

// ---------------------------------------------------------------------------
// 5. CONTA ESTABELECIMENTO — só navega, só no projeto de teste
// ---------------------------------------------------------------------------
// Matriz §2: `/app/veterinario/**` é do `vet`, `/admin` é do `admin`. Até
// 23/09 nenhum teste logava como `clinic`: o isolamento era provado só de um
// lado. A conta pode estar em qualquer status (a do `vetria-e2e` nasce
// `incomplete`, sem `clinic_profiles`): o destino é medido, não suposto.

const credencialClinicDeTeste = alvoEhTeste() ? credencialClinic() : null;
const MOTIVO_SEM_CLINIC = alvoEhTeste() ? SEM_CLINIC : SEM_ALVO_DE_TESTE;

test.describe("o estabelecimento nao entra no painel do veterinario nem no admin", () => {
  const credencial = credencialClinicDeTeste;
  test.skip(credencial === null && !EXIGIR, MOTIVO_SEM_CLINIC);

  let sessao: Cookie[] = [];
  let destino = "";

  test.beforeAll(async ({ browser }) => {
    falharSeExigir(credencial === null, MOTIVO_SEM_CLINIC);
    if (!credencial) return;
    test.setTimeout(120_000);
    sessao = await capturarSessao(browser, credencial, "E2E_CLINIC_EMAIL");
    destino = await medirDestinoDeApp(browser, sessao);
  });

  test.beforeEach(async ({ page }) => {
    await aplicarSessao(page, sessao);
  });

  test("/app despacha o estabelecimento para um destino do painel dele", async () => {
    expect(destino).toMatch(/^\/app\/estabelecimento(\/(onboarding|aguardando|bloqueado))?$/);
  });

  test("estabelecimento digitando rotas de vet, responsavel e admin volta ao proprio destino", async ({
    page,
  }) => {
    for (const rota of [
      "/app/veterinario",
      "/app/veterinario/onboarding",
      "/app/veterinario/aguardando",
      "/app/responsavel",
      "/admin",
      ROTA_FILA,
      `${ROTA_FILA}/${randomUUID()}`,
    ]) {
      await page.goto(rota);
      await expect(page, `rota ${rota}`).toHaveURL(rotaExata(destino));
    }
  });
});

// Os esqueletos que moravam aqui ("fluxos que precisam de conta nova") viraram
// teste de verdade em `fluxos-conta-nova.spec.ts` (T-029).
