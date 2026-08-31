import { test, expect } from "@playwright/test";

// Camada 1 da suíte: o que dá pra afirmar SEM credencial nenhuma.
//
// Estes testes rodam em qualquer máquina e em qualquer CI que tenha as duas
// chaves públicas do Supabase. Eles cobrem a coisa mais barata e mais
// esquecida do projeto: as portas continuam trancadas e as telas continuam
// subindo.
//
// ⚠️ Regra do card: "não escrever teste de tela que ainda é casca". Nada
// aqui toca /admin/validacoes, editor de perfil, agenda ou busca. Só o que
// já é real hoje.

test.describe("portas trancadas (middleware)", () => {
  // Este é o teste mais valioso do arquivo. O `middleware.ts` é o que separa
  // visitante de usuário logado, e o R-001 registra que ele AINDA NÃO isola
  // painel por role. O que ele já faz — barrar quem não tem sessão — passa a
  // ter prova, pra ninguém quebrar isso ao consertar o R-001.
  for (const rota of [
    "/app",
    "/app/veterinario",
    "/app/veterinario/onboarding",
    "/app/estabelecimento",
    "/app/responsavel",
    "/admin",
  ]) {
    test(`visitante sem sessao em ${rota} cai no login`, async ({ page }) => {
      await page.goto(rota);
      await expect(page).toHaveURL(/\/login$/);
    });
  }
});

test.describe("telas publicas sobem", () => {
  test("home responde 200", async ({ page }) => {
    const resposta = await page.goto("/");
    expect(resposta?.status()).toBe(200);
  });

  test("login desenha os campos e o botao do Google", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /entrar com google/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /fazer login/i })
    ).toBeVisible();
  });

  test("login alterna para cadastro e volta", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /^cadastre-se$/i }).click();
    await expect(
      page.getByRole("button", { name: /criar conta/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /^faça login$/i }).click();
    await expect(
      page.getByRole("button", { name: /fazer login/i })
    ).toBeVisible();
  });

  test("os tres funis de cadastro respondem", async ({ page }) => {
    for (const rota of [
      "/cadastro",
      "/cadastro/responsavel",
      "/cadastro/veterinario",
      "/cadastro/estabelecimento",
    ]) {
      const resposta = await page.goto(rota);
      expect(resposta?.status(), `rota ${rota}`).toBe(200);
    }
  });

  test("recuperar senha responde", async ({ page }) => {
    const resposta = await page.goto("/recuperar-senha");
    expect(resposta?.status()).toBe(200);
  });
});

test.describe("roadmap", () => {
  // O /roadmap é a janela dos donos e é a única rota que promete coisa pra
  // fora. Duas garantias: ela sobe, e ela NÃO é indexada. O `noindex` foi
  // decisão explícita (DL-039) e some sem ninguém notar num refactor de
  // metadata.
  test("sobe e continua noindex", async ({ page }) => {
    const resposta = await page.goto("/roadmap");
    expect(resposta?.status()).toBe(200);

    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute("content", /noindex/);
  });
});

test.describe("marca", () => {
  // DL-038: sem travessão em texto visível ao usuário. É regra de copy do
  // projeto inteiro e a única forma de ela sobreviver a 13 semanas é uma
  // prova automática. Verifica a home, que é a tela de maior tráfego.
  test("a home nao tem travessao no texto visivel", async ({ page }) => {
    await page.goto("/");
    const texto = await page.locator("body").innerText();
    expect(texto, "travessao (em dash) encontrado no texto visivel").not.toContain("\u2014");
  });
});
