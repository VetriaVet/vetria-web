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

test.describe("as rotas de documento nao aceitam visitante (T-008 / SEC-079)", () => {
  // ⚠️ O `matcher` do `middleware.ts` é `["/app/:path*", "/admin/:path*"]`, e
  // `/api/documentos/*` está FORA dele. Ou seja: o portão de rota que protege
  // as telas não passa nem perto destas duas rotas, e elas conferem sessão por
  // conta própria. É o tipo de proteção que se apaga num refactor sem ninguém
  // perceber, porque nenhuma tela quebra quando ela some.
  //
  // Sem credencial nenhuma, então roda em toda máquina e em todo CI.
  test("POST em /api/documentos/upload sem sessao devolve 401", async ({
    request,
  }) => {
    const resposta = await request.post("/api/documentos/upload", {
      multipart: {
        arquivo: {
          name: "qualquer.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4 nem chega a ser lido\n", "utf8"),
        },
      },
    });

    // 401 ANTES de ler um byte do corpo: o arquivo acima tem assinatura de PDF
    // válida de propósito, para que a recusa não possa ser confundida com a
    // recusa de tipo. Quem barra aqui é a falta de sessão.
    expect(resposta.status()).toBe(401);
  });

  test("POST em /api/documentos/abrir sem sessao devolve 401", async ({
    request,
  }) => {
    const resposta = await request.post("/api/documentos/abrir", {
      headers: { "Content-Type": "application/json" },
      data: {},
    });

    // Esta é a rota que devolve URL assinada do documento de validação. Um 200
    // aqui para visitante seria a base inteira de documentos de identidade
    // acessível a quem soubesse o caminho.
    expect(resposta.status()).toBe(401);
  });
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
