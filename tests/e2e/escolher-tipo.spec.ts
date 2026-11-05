import { test, expect, type Browser, type Page } from "@playwright/test";
import {
  BASE_URL,
  DESTINO_VET,
  aplicarSessao,
  capturarSessao,
  destinoDeApp,
  rotaExata,
} from "../apoio/sessao";
import { esperarHidratacao } from "../apoio/formulario";
import { EXIGIR, falharSeExigir } from "../apoio/pulo";
import { alvoEhTeste, exigirAlvoDeTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";
import {
  anotarEmailParaLimpar,
  apagarContasDaRodada,
  clienteDeServico,
  clienteDoUsuario,
  criarContaDescartavel,
  criarContaSemTipo,
  emailDescartavel,
  idPorEmail,
  lerPerfil,
  lerTipoEscolhido,
  senhaDescartavel,
  varrerDescartaveisAntigas,
  type ContaDescartavel,
} from "../apoio/servico";
import { ONBOARDING_RESPONSAVEL } from "../apoio/responsavel";

// T-064 / DL-080 item 2: A CONTA CRIADA SEM TIPO ESCOLHE O TIPO, UMA VEZ SÓ.
//
// A conta do Google não manda `role`; o cadastro pelo `/login` também não.
// Desde a 0009 essas contas nascem `tutor`, `active` e com
// `tipo_escolhido_em` nulo, e `/app` as manda para `/onboarding`, onde
// escolhem responsável, veterinário ou estabelecimento. Quem grava é
// `escolher_tipo_de_conta`, no banco.
//
// O Google está desligado no `vetria-e2e`. A conta "do Google" é criada pelo
// Auth admin sem `role` no metadata (`criarContaSemTipo`), que é como o Google
// a deixa; o caminho do `/login` é provado pela tela de verdade.
//
// O que se prova:
//   · a conta sem tipo cai na escolha, escolhe, e vai para o painel certo;
//   · escolhido o tipo, nem a tela, nem a rota, nem a função deixam trocar;
//   · `admin` nunca é aceito, nem pela rota nem pela função;
//   · conta que nasceu com tipo nunca vê a escolha;
//   · o dono não zera a marca por PATCH para escolher de novo.
//
// ⚠️ ESCREVE, e por isso só roda no projeto de teste (DL-064).

const ATIVO = alvoEhTeste();
const ESCOLHA = "/onboarding";
const DO_SITE = { "content-type": "application/json", "sec-fetch-site": "same-origin" };

function sufixo(): string {
  return Date.now().toString(36);
}

async function entrar(browser: Browser, page: Page, conta: ContaDescartavel) {
  const sessao = await capturarSessao(browser, conta, `conta descartavel ${conta.nome}`);
  await aplicarSessao(page, sessao);
}

async function quantasEscolhasNaTrilha(id: string): Promise<number> {
  const { count, error } = await clienteDeServico()
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("alvo_id", id)
    .eq("acao", "escolher_tipo");
  if (error) throw new Error(`quantasEscolhasNaTrilha: ${error.code}: ${error.message}`);
  return count ?? 0;
}

test.skip(!ATIVO && !EXIGIR, SEM_ALVO_DE_TESTE);

test.beforeAll(async () => {
  falharSeExigir(!ATIVO, SEM_ALVO_DE_TESTE);
  if (!ATIVO) return;
  test.setTimeout(120_000);
  exigirAlvoDeTeste();
  await varrerDescartaveisAntigas(60);
});

test.afterAll(async () => {
  if (!ATIVO) return;
  test.setTimeout(120_000);
  await apagarContasDaRodada();
});

test.describe("a conta sem tipo escolhe o tipo, uma vez so", () => {
  test("conta como a do Google: cai na escolha, escolhe veterinario e vai para o cadastro de veterinario", async ({
    browser,
    page,
  }) => {
    test.setTimeout(180_000);
    const conta = await criarContaSemTipo(`QA E2E Google ${sufixo()}`);

    // Como nasceu: responsável ativo, sem tipo escolhido.
    const antes = await lerPerfil(conta.id);
    expect(antes.role).toBe("tutor");
    expect(antes.status).toBe("active");
    expect(await lerTipoEscolhido(conta.id)).toBeNull();

    await entrar(browser, page, conta);
    expect(await destinoDeApp(page)).toBe(ESCOLHA);
    // O cadastro de responsável também manda para a escolha.
    await page.goto(ONBOARDING_RESPONSAVEL);
    await expect(page).toHaveURL(rotaExata(ESCOLHA));

    await expect(page.getByRole("heading", { level: 1, name: /como você quer usar a vetria/i })).toBeVisible();
    await expect(page.getByText(/feita uma vez só/i)).toBeVisible();
    await esperarHidratacao(page);
    await page.getByRole("button", { name: /sou veterinário/i }).click();
    await page.waitForURL((url) => url.pathname === DESTINO_VET.incomplete, { timeout: 30_000 });

    // O banco: vet, incomplete (passa pela validação como qualquer um), com a
    // marca e uma linha na trilha.
    const depois = await lerPerfil(conta.id);
    expect(depois.role).toBe("vet");
    expect(depois.status).toBe("incomplete");
    expect(depois.admin_level ?? "none").toBe("none");
    expect(await lerTipoEscolhido(conta.id)).not.toBeNull();
    expect(await quantasEscolhasNaTrilha(conta.id)).toBe(1);

    // A escolha não abre de novo.
    await page.goto(ESCOLHA);
    await expect(page).toHaveURL(rotaExata(DESTINO_VET.incomplete));

    // Nem a rota troca o tipo (409), nem a função (55000).
    const r = await page.request.post("/api/onboarding/set-role", { headers: DO_SITE, data: { role: "clinic" } });
    expect(r.status(), await r.text()).toBe(409);
    const { cliente } = await clienteDoUsuario(conta);
    try {
      const { error } = await cliente.rpc("escolher_tipo_de_conta", { p_role: "tutor" });
      expect(error?.code, "a funcao deixou trocar o tipo ja escolhido").toBe("55000");
    } finally {
      await cliente.auth.signOut({ scope: "local" }).catch(() => {});
    }
    expect((await lerPerfil(conta.id)).role).toBe("vet");
    expect(await quantasEscolhasNaTrilha(conta.id)).toBe(1);
  });

  test("escolher responsavel leva ao cadastro de responsavel", async ({ browser, page }) => {
    test.setTimeout(180_000);
    const conta = await criarContaSemTipo(`QA E2E Google Resp ${sufixo()}`);
    await entrar(browser, page, conta);
    await page.goto(ESCOLHA);
    await esperarHidratacao(page);
    await page.getByRole("button", { name: /sou responsável/i }).click();
    await page.waitForURL((url) => url.pathname === ONBOARDING_RESPONSAVEL, { timeout: 30_000 });

    const depois = await lerPerfil(conta.id);
    expect(depois.role).toBe("tutor");
    expect(depois.status).toBe("active");
    expect(await lerTipoEscolhido(conta.id)).not.toBeNull();
  });

  test("admin nunca e aceito, nem pela rota nem pela funcao, e a conta continua sem tipo", async ({
    browser,
    page,
  }) => {
    test.setTimeout(150_000);
    const conta = await criarContaSemTipo(`QA E2E Google Admin ${sufixo()}`);
    await entrar(browser, page, conta);
    await page.goto(ESCOLHA);

    for (const role of ["admin", "master", "", null]) {
      const r = await page.request.post("/api/onboarding/set-role", { headers: DO_SITE, data: { role } });
      expect(r.status(), `role ${String(role)}`).toBe(400);
    }

    const { cliente } = await clienteDoUsuario(conta);
    try {
      for (const p_role of ["admin", "ADMIN", "vet "]) {
        const { error } = await cliente.rpc("escolher_tipo_de_conta", { p_role });
        expect(error?.code, `p_role ${p_role}`).toBe("22023");
      }
      // O dono não escreve a marca nem o role pela API (policy da 0009).
      await cliente.from("profiles").update({ tipo_escolhido_em: new Date().toISOString() }).eq("id", conta.id);
      await cliente.from("profiles").update({ role: "admin" }).eq("id", conta.id);
    } finally {
      await cliente.auth.signOut({ scope: "local" }).catch(() => {});
    }

    const depois = await lerPerfil(conta.id);
    expect(depois.role).toBe("tutor");
    expect(depois.admin_level ?? "none").toBe("none");
    expect(await lerTipoEscolhido(conta.id)).toBeNull();
    expect(await quantasEscolhasNaTrilha(conta.id)).toBe(0);
  });

  test("conta que nasceu com tipo nunca ve a escolha, e nao zera a marca para escolher de novo", async ({
    browser,
    page,
  }) => {
    test.setTimeout(150_000);
    const conta = await criarContaDescartavel("tutor", `QA E2E Com Tipo ${sufixo()}`);
    expect(await lerTipoEscolhido(conta.id)).not.toBeNull();

    await entrar(browser, page, conta);
    expect(await destinoDeApp(page)).toBe(ONBOARDING_RESPONSAVEL);
    await page.goto(ESCOLHA);
    await expect(page).toHaveURL(rotaExata(ONBOARDING_RESPONSAVEL));

    const r = await page.request.post("/api/onboarding/set-role", { headers: DO_SITE, data: { role: "vet" } });
    expect(r.status(), await r.text()).toBe(409);

    const { cliente } = await clienteDoUsuario(conta);
    try {
      // PATCH da marca para nulo: a policy recusa (ou não altera linha).
      await cliente.from("profiles").update({ tipo_escolhido_em: null }).eq("id", conta.id);
      expect(await lerTipoEscolhido(conta.id), "o dono zerou a marca e pode escolher de novo").not.toBeNull();
      const { error } = await cliente.rpc("escolher_tipo_de_conta", { p_role: "vet" });
      expect(error?.code).toBe("55000");
    } finally {
      await cliente.auth.signOut({ scope: "local" }).catch(() => {});
    }
    expect((await lerPerfil(conta.id)).role).toBe("tutor");
  });

  test("conta sem tipo que ja concluiu o cadastro de responsavel nao escolhe mais", async () => {
    // Quem contornou a escolha e concluiu como responsável já escolheu na
    // prática. A tela não oferece (sem laço) e a função recusa.
    test.setTimeout(120_000);
    const conta = await criarContaSemTipo(`QA E2E Google Concluiu ${sufixo()}`);
    const { cliente } = await clienteDoUsuario(conta);
    try {
      const { error: erroMarca } = await cliente
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", conta.id);
      expect(erroMarca).toBeNull();
      const { error } = await cliente.rpc("escolher_tipo_de_conta", { p_role: "vet" });
      expect(error?.code).toBe("55000");
    } finally {
      await cliente.auth.signOut({ scope: "local" }).catch(() => {});
    }
    expect((await lerPerfil(conta.id)).role).toBe("tutor");
  });

  test("cadastro pelo /login, sem tipo, pela tela: cai na escolha", async ({ page }) => {
    // O caminho real sem Google: o modo "Criar conta" do `/login` não manda
    // `role`. No `vetria-e2e` o email é confirmado sozinho e a sessão volta na
    // hora (`app/login/page.tsx`).
    test.setTimeout(180_000);
    const email = emailDescartavel("login");
    const senha = senhaDescartavel();
    anotarEmailParaLimpar(email);

    await page.goto(`${BASE_URL}/login`);
    // O "Cadastre-se" só troca o modo depois da hidratação: repete até trocar.
    await expect(async () => {
      await page.getByRole("button", { name: /^cadastre-se$/i }).click({ timeout: 2_000 });
      await expect(page.getByText("Crie sua conta.")).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(senha);
    await page.getByRole("button", { name: /^criar conta$/i }).click();

    await page.waitForURL((url) => url.pathname === ESCOLHA, { timeout: 30_000 });
    const id = await idPorEmail(email);
    expect(id).not.toBeNull();
    expect(await lerTipoEscolhido(id!)).toBeNull();
    await expect(page.getByRole("button", { name: /sou um estabelecimento veterinário/i })).toBeVisible();
  });
});
