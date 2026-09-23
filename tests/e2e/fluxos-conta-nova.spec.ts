import { test, expect, type Browser, type Cookie, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { credencialAdmin, SEM_ADMIN } from "../apoio/credenciais";
import {
  BASE_URL,
  BASE_VET,
  DESTINO_VET,
  alertaDeErro,
  aplicarSessao,
  capturarSessao,
  destinoDeApp,
  rotaExata,
} from "../apoio/sessao";
import { abrirFormulario, irParaPasso } from "../apoio/formulario";
import { EXIGIR, falharSeExigir } from "../apoio/pulo";
import { alvoEhTeste, exigirAlvoDeTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";
import {
  PDF_DE_TESTE,
  anotarEmailParaLimpar,
  apagarContasDaRodada,
  clienteDeServico,
  clienteDoUsuario,
  criarContaDescartavel,
  decisoesNaTrilha,
  emailDescartavel,
  idPorEmail,
  lerPerfil,
  semearVetNaFila,
  senhaDescartavel,
  varrerDescartaveisAntigas,
  type ContaDescartavel,
} from "../apoio/servico";

// Camada 6 da suíte: O QUE SÓ SE PROVA COM CONTA NOVA (T-029, itens 1 e 3 do
// DoD da F3).
//
// ⚠️ ESTE ARQUIVO ESCREVE, E POR ISSO SÓ RODA NO PROJETO DE TESTE (DL-064).
// Sem `E2E_ALVO=teste` tudo aqui PULA com o motivo escrito (ou FALHA, com
// `E2E_EXIGIR_FILA=1`). Com `E2E_ALVO=teste` e a URL de produção, ESTOURA
// antes de qualquer escrita (`alvo.ts`).
//
// Por que conta nova: `incomplete → pending_validation` e `pending_validation
// → active` só acontecem UMA VEZ por conta. Cada teste que atravessa uma
// dessas portas gasta uma conta, criada na hora e apagada no `afterAll`
// (`servico.ts`). Conta que sobra de rodada morta é varrida no `beforeAll` da
// rodada seguinte, se tiver mais de 60 minutos.
//
// O que NÃO é asserção aqui, de propósito: o email de aprovação e de reprova.
// O CI não tem RESEND_API_KEY, e a tela diz isso ("o envio está desligado
// neste ambiente"). O email continua provado à mão (T-024, 23/09). A asserção
// é o `status` no banco e o painel em que a pessoa cai.

const ROTA_ONB_VET = `${BASE_VET}/onboarding`;
const BASE_CLINIC = "/app/estabelecimento";
const ROTA_ONB_CLINIC = `${BASE_CLINIC}/onboarding`;
const ROTA_FILA = "/admin/validacoes";

const ATIVO = alvoEhTeste();

function sufixo(): string {
  return Date.now().toString(36);
}

/** Uma página num contexto próprio, já com a sessão de outra pessoa. É o
 *  segundo navegador do teste (o admin num, o profissional no outro). */
async function paginaCom(browser: Browser, cookies: Cookie[]) {
  const contexto = await browser.newContext({ baseURL: BASE_URL });
  const page = await contexto.newPage();
  await aplicarSessao(page, cookies);
  return { page, fechar: () => contexto.close().catch(() => {}) };
}

/** Sai pela tela, pelo botão "Sair" do painel, e prova que a sessão acabou. */
async function sairPelaTela(page: Page) {
  const sair = page.getByRole("button", { name: /^sair$/i }).filter({ visible: true }).first();
  await expect(sair, "nao ha botao Sair visivel nesta tela").toBeVisible();
  await expect(async () => {
    await sair.click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 5_000 });
  }).toPass({ timeout: 30_000 });

  await page.goto("/app");
  await expect(page, "depois de sair, /app ainda abriu: a sessao nao acabou").toHaveURL(/\/login$/);
}

async function subirDocumentoPelaTela(page: Page) {
  await page.locator("#documento").setInputFiles({
    name: "crmv-teste.pdf",
    mimeType: "application/pdf",
    buffer: PDF_DE_TESTE,
  });
  await page.getByRole("button", { name: /^enviar documento$/i }).click();
  await expect(
    page.getByText(/documento recebido em/i),
    "o envio do documento pela tela nao terminou com 'Documento recebido em'"
  ).toBeVisible({ timeout: 30_000 });
}

// ---------------------------------------------------------------------------
// PREPARO E LIMPEZA — valem para o arquivo inteiro
// ---------------------------------------------------------------------------

test.skip(!ATIVO && !EXIGIR, SEM_ALVO_DE_TESTE);

test.beforeAll(async () => {
  falharSeExigir(!ATIVO, SEM_ALVO_DE_TESTE);
  if (!ATIVO) return;
  test.setTimeout(120_000);
  // Estoura aqui, antes de qualquer escrita, se o alvo não for o de teste.
  exigirAlvoDeTeste();
  await varrerDescartaveisAntigas(60);
});

test.afterAll(async () => {
  if (!ATIVO) return;
  test.setTimeout(120_000);
  await apagarContasDaRodada();
});

// ---------------------------------------------------------------------------
// ITEM 1 DO DoD — o que se digita no onboarding persiste e reaparece
// ---------------------------------------------------------------------------

test.describe("item 1: cadastro novo, onboarding, documento, fila, sair e voltar", () => {
  test("veterinario: cadastro pela tela ate a fila, e depois de sair e entrar os dados estao la", async ({
    browser,
    page,
  }) => {
    test.setTimeout(300_000);

    const nome = `QA E2E Cadastro ${sufixo()}`;
    const email = emailDescartavel("vet");
    const senha = senhaDescartavel();
    const bairro = `Bairro QA ${sufixo()}`;
    const bio = "Bio de teste da suite E2E da Vetria.";
    // Anotado ANTES do clique: se o teste morrer entre o cadastro e a leitura
    // do id, o `afterAll` ainda apaga a conta pelo email.
    anotarEmailParaLimpar(email);

    // --- 1. Cadastro pela rota, como o usuário faz -------------------------
    await page.goto("/cadastro/veterinario");
    // Prova de hidratação: o olho da senha (T-034) só troca o `type` depois
    // que o React plugou os handlers. Antes disso, "Criar conta" faria um
    // submit nativo e a tela recarregaria vazia.
    await expect(async () => {
      await page.getByRole("button", { name: /mostrar senha/i }).first().click();
      await expect(page.locator("#senha")).toHaveAttribute("type", "text", { timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
    await page.getByRole("button", { name: /ocultar senha/i }).first().click();

    await page.locator("#nome").fill(nome);
    await page.locator("#email").fill(email);
    await page.locator("#senha").fill(senha);
    await page.locator("#confirmar").fill(senha);
    await page.locator("#cidade").fill("Palmas, TO");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: /^criar conta$/i }).click();

    try {
      await expect(page.getByRole("heading", { name: /confirme seu email/i })).toBeVisible({
        timeout: 30_000,
      });
    } catch {
      const alerta = await alertaDeErro(page).innerText({ timeout: 2_000 }).catch(() => "");
      throw new Error(`o cadastro pela tela nao terminou. Mensagem na tela: "${alerta.trim() || "(nenhuma)"}"`);
    }

    const id = await idPorEmail(email);
    expect(id, "o cadastro disse que deu certo e a conta nao existe no Auth").not.toBeNull();
    // O trigger `handle_new_user` leu `role` do metadata: vet nasce incomplete.
    const nascido = await lerPerfil(id!);
    expect(nascido.role).toBe("vet");
    expect(nascido.status).toBe("incomplete");

    // --- 2. Login de verdade (o cadastro deixou sessão; ela é jogada fora) -
    await page.context().clearCookies();
    const sessao = await capturarSessao(browser, { email, senha }, "conta descartavel do item 1");
    await aplicarSessao(page, sessao);
    expect(await destinoDeApp(page)).toBe(DESTINO_VET.incomplete);

    // --- 3. Onboarding, modo "novo" -----------------------------------------
    await abrirFormulario(page, ROTA_ONB_VET, rotaExata(ROTA_ONB_VET));
    await expect(page.getByRole("heading", { level: 1, name: /vamos configurar/i })).toBeVisible();
    // O nome do cadastro chega pelo metadata e abre preenchido.
    await expect(page.locator("#nome")).toHaveValue(nome);

    await page.locator("#titulo").selectOption("mv");
    await page.locator("#crmv").fill("54321");
    await page.locator("#uf").selectOption("SP");
    await page.getByRole("button", { name: /^Clínica geral/ }).click();
    await page.getByRole("button", { name: /^Felinos/ }).click();
    await page.locator("#exp").selectOption("3a5");

    await irParaPasso(page, 2);
    await page.locator("#cidade").fill("Palmas");
    await page.locator("#estado").selectOption("TO");
    await page.locator("#bairro").fill(bairro);
    await page.getByRole("button", { name: /^Presencial/ }).click();
    await page.getByRole("button", { name: /^Teleorienta/ }).click();

    await irParaPasso(page, 3);
    await page.locator("#bio").fill(bio);
    await page.locator("#wpp").fill("11987654321");

    await irParaPasso(page, 4);
    const concluir = page.getByRole("button", { name: /^concluir cadastro$/i });
    // Sem documento, o botão nasce desabilitado e o rodapé diz por quê.
    await expect(concluir).toBeDisabled();
    await expect(page.getByText(/falta enviar o documento/i)).toBeVisible();

    await subirDocumentoPelaTela(page);
    await expect(concluir).toBeEnabled();
    await concluir.click();

    // A primeira conclusão: `incomplete → pending_validation`, pela RPC.
    await expect(page).toHaveURL(rotaExata(DESTINO_VET.pending_validation), { timeout: 30_000 });
    await expect(page.getByText(/estamos validando seu cadastro/i)).toBeVisible();

    // --- 4. O banco, e não a tela ------------------------------------------
    const naFila = await lerPerfil(id!);
    expect(naFila.status).toBe("pending_validation");
    expect(naFila.onboarding_completed).toBe(true);

    const s = clienteDeServico();
    const { data: vet } = await s.from("vet_profiles").select("*").eq("id", id!).single();
    expect(vet).toMatchObject({
      nome_exibicao: nome,
      titulo: "mv",
      crmv: "54321",
      crmv_uf: "SP",
      especialidades: ["Clínica geral", "Felinos"],
      experiencia: "3a5",
      cidade: "Palmas",
      estado: "TO",
      bairro,
      bio,
      atende_presencial: true,
      atende_domiciliar: false,
      atende_teleorientacao: true,
      // O dono nunca escreve o próprio slug (SEC-008).
      slug: null,
    });
    const { data: privado } = await s
      .from("perfil_privado")
      .select("whatsapp, documento_path, documento_enviado_em")
      .eq("id", id!)
      .single<{ whatsapp: string | null; documento_path: string | null; documento_enviado_em: string | null }>();
    // R-041: gravado só em dígitos, mesmo com a tela mostrando "(11) 98765-4321".
    expect(privado?.whatsapp).toBe("11987654321");
    expect(privado?.documento_path ?? "").toMatch(new RegExp(`^${id}/[A-Za-z0-9_-]+\\.pdf$`));
    expect(privado?.documento_enviado_em).not.toBeNull();

    // --- 5. Sair e voltar ---------------------------------------------------
    await sairPelaTela(page);
    const deNovo = await capturarSessao(browser, { email, senha }, "conta descartavel do item 1");
    await page.context().clearCookies();
    await aplicarSessao(page, deNovo);
    expect(await destinoDeApp(page)).toBe(DESTINO_VET.pending_validation);

    // O onboarding abre em modo revisão, com o que o SERVIDOR gravou.
    await abrirFormulario(page, ROTA_ONB_VET, rotaExata(ROTA_ONB_VET));
    await expect(page.getByRole("heading", { level: 1, name: /está em valida/i })).toBeVisible();
    await expect(page.locator("#nome")).toHaveValue(nome);
    await expect(page.locator("#titulo")).toHaveValue("mv");
    await expect(page.locator("#crmv")).toHaveValue("54321");
    await expect(page.locator("#uf")).toHaveValue("SP");
    await expect(page.locator("#exp")).toHaveValue("3a5");
    // A primeira marcada é a principal, e a ordem sobreviveu ao banco.
    await expect(page.getByRole("button", { name: /^Clínica geral\s*principal$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Felinos$/ })).toHaveAttribute("aria-pressed", "true");

    await irParaPasso(page, 2);
    await expect(page.locator("#cidade")).toHaveValue("Palmas");
    await expect(page.locator("#estado")).toHaveValue("TO");
    await expect(page.locator("#bairro")).toHaveValue(bairro);

    await irParaPasso(page, 3);
    await expect(page.locator("#bio")).toHaveValue(bio);
    await expect(page.locator("#wpp")).toHaveValue("(11) 98765-4321");

    await irParaPasso(page, 4);
    await expect(page.getByText(/documento recebido em/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^salvar alterações$/i })).toBeEnabled();
  });

  test("estabelecimento: onboarding ate a fila, e numa visita nova os dados estao la", async ({
    browser,
    page,
  }) => {
    // O cadastro pela tela já é provado no teste do vet; aqui a conta nasce
    // pelo Auth (`createUser`), e o que se prova é o onboarding da T-007.
    test.setTimeout(240_000);

    const conta = await criarContaDescartavel("clinic", `QA E2E Estab ${sufixo()}`);
    const nomeFantasia = `Estabelecimento QA ${sufixo()}`;

    const sessao = await capturarSessao(browser, conta, "conta descartavel clinic");
    await aplicarSessao(page, sessao);
    expect(await destinoDeApp(page)).toBe(ROTA_ONB_CLINIC);

    await abrirFormulario(page, ROTA_ONB_CLINIC, rotaExata(ROTA_ONB_CLINIC));
    await expect(page.getByRole("heading", { level: 1, name: /vamos cadastrar/i })).toBeVisible();

    await page.locator("#nf").fill(nomeFantasia);
    await page.locator("#rs").fill("Razao Social QA E2E Ltda");
    // CNPJ de exemplo com dígito verificador válido. Não é de ninguém.
    await page.locator("#cnpj").fill("11222333000181");
    await page.locator("#resp").fill("Responsavel QA");

    await irParaPasso(page, 2);
    await page.locator("#end").fill("Rua de Teste, 100");
    await page.locator("#cep").fill("77001000");
    await page.locator("#cid").fill("Palmas");
    await page.locator("#uf").selectOption("TO");

    await irParaPasso(page, 3);
    await page.locator("#sobre").fill("Texto sobre de teste da suite E2E.");
    await page.getByRole("button", { name: /^Vacinação/ }).click();
    await page.locator("#wpp").fill("11987654321");

    await irParaPasso(page, 4);
    await subirDocumentoPelaTela(page);
    await page.getByRole("button", { name: /^concluir cadastro$/i }).click();
    await expect(page).toHaveURL(rotaExata(`${BASE_CLINIC}/aguardando`), { timeout: 30_000 });

    // O banco.
    const perfil = await lerPerfil(conta.id);
    expect(perfil.status).toBe("pending_validation");
    const s = clienteDeServico();
    const { data: clinic } = await s.from("clinic_profiles").select("*").eq("id", conta.id).single();
    expect(clinic).toMatchObject({
      nome_fantasia: nomeFantasia,
      endereco: "Rua de Teste, 100",
      cep: "77001000",
      cidade: "Palmas",
      estado: "TO",
      servicos: ["Vacinação"],
      slug: null,
    });
    // Desde a 0003 os dados de identificação moram em `perfil_privado`.
    const { data: privado } = await s
      .from("perfil_privado")
      .select("cnpj, razao_social, responsavel_tecnico, whatsapp, documento_enviado_em")
      .eq("id", conta.id)
      .single();
    expect(privado).toMatchObject({
      cnpj: "11222333000181",
      razao_social: "Razao Social QA E2E Ltda",
      responsavel_tecnico: "Responsavel QA",
      whatsapp: "11987654321",
    });
    expect(privado?.documento_enviado_em).not.toBeNull();

    // Visita nova: contexto novo, Server Component novo, `select` novo.
    const outra = await paginaCom(browser, sessao);
    try {
      await abrirFormulario(outra.page, ROTA_ONB_CLINIC, rotaExata(ROTA_ONB_CLINIC));
      await expect(outra.page.getByRole("heading", { level: 1, name: /está em valida/i })).toBeVisible();
      await expect(outra.page.locator("#nf")).toHaveValue(nomeFantasia);
      expect((await outra.page.locator("#cnpj").inputValue()).replace(/\D/g, "")).toBe("11222333000181");
      await irParaPasso(outra.page, 2);
      expect((await outra.page.locator("#cep").inputValue()).replace(/\D/g, "")).toBe("77001000");
      await expect(outra.page.locator("#cid")).toHaveValue("Palmas");
    } finally {
      await outra.fechar();
    }
  });
});

// ---------------------------------------------------------------------------
// ITEM 3 DO DoD — o admin comum aprova ou reprova, e a conta muda de painel
// ---------------------------------------------------------------------------

const credencialAdminDeTeste = ATIVO ? credencialAdmin() : null;

test.describe("item 3: o admin comum decide pela tela e a conta muda de painel", () => {
  test.skip(ATIVO && credencialAdminDeTeste === null && !EXIGIR, SEM_ADMIN);

  let sessaoAdmin: Cookie[] = [];

  test.beforeAll(async ({ browser }) => {
    falharSeExigir(ATIVO && credencialAdminDeTeste === null, SEM_ADMIN);
    if (!credencialAdminDeTeste) return;
    test.setTimeout(120_000);
    sessaoAdmin = await capturarSessao(browser, credencialAdminDeTeste, "E2E_ADMIN_EMAIL");
  });

  test.beforeEach(async ({ page }) => {
    await aplicarSessao(page, sessaoAdmin);
  });

  async function abrirDetalhe(page: Page, conta: ContaDescartavel) {
    await page.goto(ROTA_FILA);
    const linha = page.locator(`a[href="${ROTA_FILA}/${conta.id}"]`);
    await expect(
      linha,
      "a conta nova nao aparece na primeira pagina da fila (sobra de rodada anterior empurrando?)"
    ).toBeVisible();
    await linha.click();
    await expect(page).toHaveURL(rotaExata(`${ROTA_FILA}/${conta.id}`));
    await expect(page.getByRole("heading", { level: 1, name: conta.nome })).toBeVisible();
  }

  test("aprovar: a conta vira active, sai da fila e o profissional entra no dashboard", async ({
    browser,
    page,
  }) => {
    test.setTimeout(240_000);
    const conta = await semearVetNaFila(`QA E2E Aprovar ${sufixo()}`);

    await abrirDetalhe(page, conta);

    // O documento abre por URL assinada, do bucket do projeto de TESTE.
    await page.getByRole("button", { name: /^liberar o documento$/i }).click();
    const link = page.getByRole("link", { name: /abrir documento em uma aba nova/i });
    await expect(link).toBeVisible();
    expect(await link.getAttribute("href")).toContain(`${exigirAlvoDeTeste().ref}.supabase.co`);

    // Aprovar pede confirmação.
    await page.getByRole("button", { name: /^aprovar esta conta$/i }).click();
    await page.getByRole("button", { name: /^confirmar aprovação$/i }).click();
    await expect(page).toHaveURL(/\/admin\/validacoes\?decisao=aprovado&email=(enviado|falhou|desligado)$/, {
      timeout: 30_000,
    });
    await expect(page.getByRole("status").filter({ hasText: /conta aprovada/i })).toBeVisible();

    // O banco: status, motivo limpo, UMA linha de trilha.
    const depois = await lerPerfil(conta.id);
    expect(depois.status).toBe("active");
    expect(depois.status_motivo).toBeNull();
    expect(await decisoesNaTrilha(conta.id)).toBe(1);

    // DL-061: o dossiê de quem já foi decidido não abre mais.
    const detalhe = await page.goto(`${ROTA_FILA}/${conta.id}`);
    expect(detalhe?.status()).toBe(404);

    // O profissional, no navegador dele.
    const sessaoVet = await capturarSessao(browser, conta, "conta descartavel aprovada");
    const vet = await paginaCom(browser, sessaoVet);
    try {
      expect(await destinoDeApp(vet.page)).toBe(DESTINO_VET.active);
      // Quem foi aprovado não volta a ler "estamos validando".
      await vet.page.goto(DESTINO_VET.pending_validation);
      await expect(vet.page).toHaveURL(rotaExata(BASE_VET));
    } finally {
      await vet.fechar();
    }
  });

  test("reprovar: exige motivo, devolve ao onboarding e o motivo aparece para a pessoa", async ({
    browser,
    page,
  }) => {
    test.setTimeout(240_000);
    const conta = await semearVetNaFila(`QA E2E Reprovar ${sufixo()}`);
    const motivo = "O numero do CRMV nao confere com o documento enviado. Envie a carteira legivel.";

    await abrirDetalhe(page, conta);

    const reprovar = page.getByRole("button", { name: /^reprovar com este motivo$/i });
    const campo = page.locator("#motivo-reprova");

    // R-051: motivo curto não passa.
    await campo.fill("curto");
    await expect(reprovar).toBeDisabled();

    await campo.fill(motivo);
    await expect(reprovar).toBeEnabled();
    await reprovar.click();
    await expect(page).toHaveURL(/\/admin\/validacoes\?decisao=reprovado&email=(enviado|falhou|desligado)$/, {
      timeout: 30_000,
    });
    await expect(page.getByRole("status").filter({ hasText: /cadastro devolvido/i })).toBeVisible();

    const depois = await lerPerfil(conta.id);
    expect(depois.status).toBe("incomplete");
    expect(depois.onboarding_completed).toBe(false);
    expect(depois.status_motivo).toBe(motivo);
    expect(await decisoesNaTrilha(conta.id)).toBe(1);

    const sessaoVet = await capturarSessao(browser, conta, "conta descartavel reprovada");
    const vet = await paginaCom(browser, sessaoVet);
    try {
      expect(await destinoDeApp(vet.page)).toBe(DESTINO_VET.incomplete);
      await expect(vet.page.getByText(/devolveu seu cadastro para ajuste/i)).toBeVisible();
      await expect(vet.page.getByText(motivo)).toBeVisible();
    } finally {
      await vet.fechar();
    }
  });

  test("duas abas: aprovar numa e reprovar na outra nao decide duas vezes", async ({
    page,
  }) => {
    // SEC-099: a segunda decisão sobre a mesma conta é recusada com frase
    // legível, e a trilha tem UMA linha, não duas.
    test.setTimeout(180_000);
    const conta = await semearVetNaFila(`QA E2E Duas Abas ${sufixo()}`);

    const segunda = await page.context().newPage();
    try {
      await abrirDetalhe(page, conta);
      await segunda.goto(`${ROTA_FILA}/${conta.id}`);
      await expect(segunda.getByRole("heading", { level: 1, name: conta.nome })).toBeVisible();

      await page.getByRole("button", { name: /^aprovar esta conta$/i }).click();
      await page.getByRole("button", { name: /^confirmar aprovação$/i }).click();
      await expect(page).toHaveURL(/decisao=aprovado/, { timeout: 30_000 });

      await expect(async () => {
        await segunda.locator("#motivo-reprova").fill("Reprova tardia vinda da outra aba.");
        await segunda.getByRole("button", { name: /^reprovar com este motivo$/i }).click();
        await expect(alertaDeErro(segunda)).toContainText(/não está mais na fila/i, { timeout: 5_000 });
      }).toPass({ timeout: 30_000 });

      expect((await lerPerfil(conta.id)).status).toBe("active");
      expect(await decisoesNaTrilha(conta.id)).toBe(1);
    } finally {
      await segunda.close().catch(() => {});
    }
  });
});

// ---------------------------------------------------------------------------
// O BANCO RECUSA, PELA API, O QUE A TELA ESCONDE
// ---------------------------------------------------------------------------
// Estes não abrem navegador: usam a chave anon e a sessão da própria conta,
// que é exatamente o que alguém com DevTools tem. A tela desabilita o botão;
// quem vale é o banco (matriz, regra 1: `status` nunca é escrito pelo próprio
// usuário).

test.describe("o banco recusa pela API o que a tela esconde", () => {
  async function vetNovoComPerfil(): Promise<{ conta: ContaDescartavel; cliente: SupabaseClient }> {
    const conta = await criarContaDescartavel("vet", `QA E2E API ${sufixo()}`);
    const { cliente } = await clienteDoUsuario(conta);
    const { error } = await cliente.from("vet_profiles").upsert(
      {
        id: conta.id,
        nome_exibicao: conta.nome,
        crmv: "12345",
        crmv_uf: "SP",
        cidade: "Palmas",
        estado: "TO",
        atende_presencial: true,
      },
      { onConflict: "id" }
    );
    if (error) throw new Error(`vetNovoComPerfil: ${error.code}: ${error.message}`);
    return { conta, cliente };
  }

  test("o proprio usuario nao escreve status, role nem admin_level", async () => {
    const { conta, cliente } = await vetNovoComPerfil();

    // Cada tentativa separada: um update com as três colunas seria recusado
    // pela primeira e não provaria as outras duas.
    await cliente.from("profiles").update({ status: "active" }).eq("id", conta.id);
    await cliente.from("profiles").update({ role: "clinic" }).eq("id", conta.id);
    await cliente.from("profiles").update({ admin_level: "master" }).eq("id", conta.id);

    const depois = await lerPerfil(conta.id);
    expect(depois.status, "o profissional se marcou active sozinho: aparece na busca sem validacao").toBe("incomplete");
    expect(depois.role).toBe("vet");
    expect(depois.admin_level ?? "none").toBe("none");
  });

  test("concluir pela RPC sem documento e recusado (55000) e a conta continua incomplete", async () => {
    // SEC-088(a) / SEC-098: o botão nasce desabilitado, mas a RPC é chamável
    // direto pelo PostgREST.
    const { conta, cliente } = await vetNovoComPerfil();
    const { error } = await cliente.rpc("concluir_onboarding_profissional");
    expect(error?.code, "a RPC pos na fila uma conta sem documento").toBe("55000");
    expect((await lerPerfil(conta.id)).status).toBe("incomplete");
  });

  test("documento inventado na coluna, sem objeto no bucket, tambem e recusado", async () => {
    // SEC-098 variante 2: o dono escreve as três colunas do documento com
    // valores que passam no CHECK, apontando para um arquivo que não existe.
    // Se a escrita for recusada antes, melhor ainda; o que se afirma é a RPC.
    const { conta, cliente } = await vetNovoComPerfil();
    await cliente.from("perfil_privado").upsert(
      {
        id: conta.id,
        documento_path: `${conta.id}/inventado.pdf`,
        documento_hash: "a".repeat(64),
        documento_tamanho: 1234,
      },
      { onConflict: "id" }
    );
    const { error } = await cliente.rpc("concluir_onboarding_profissional");
    expect(error?.code, "a RPC aceitou documento que so existe na coluna").toBe("55000");
    expect((await lerPerfil(conta.id)).status).toBe("incomplete");
  });

  test("o profissional nao chama admin_definir_status, nem sobre si mesmo", async () => {
    const { conta, cliente } = await vetNovoComPerfil();
    const { error } = await cliente.rpc("admin_definir_status", {
      target_user_id: conta.id,
      novo_status: "active",
      motivo: null,
    });
    expect(error?.code).toBe("42501");
    expect((await lerPerfil(conta.id)).status).toBe("incomplete");
  });

  test("o admin comum nao aprova conta fora da fila (DL-061)", async () => {
    // Pula (ou falha) sozinho se não houver admin: o resto do bloco não precisa dele.
    test.skip(credencialAdminDeTeste === null && !EXIGIR, SEM_ADMIN);
    falharSeExigir(credencialAdminDeTeste === null, SEM_ADMIN);

    const { conta } = await vetNovoComPerfil();
    const { cliente: admin } = await clienteDoUsuario(credencialAdminDeTeste!);
    const { error } = await admin.rpc("admin_definir_status", {
      target_user_id: conta.id,
      novo_status: "active",
      motivo: null,
    });
    expect(error?.code, "o admin aprovou quem nunca entrou na fila").toBe("55000");
    expect((await lerPerfil(conta.id)).status).toBe("incomplete");
    expect(await decisoesNaTrilha(conta.id)).toBe(0);
  });
});
