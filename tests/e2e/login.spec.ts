import { test, expect } from "@playwright/test";
import { credencialVet, SEM_CREDENCIAL } from "../apoio/credenciais";

// Camada 2: o primeiro teste que exige credencial.
//
// É o item de DoD do card da T-003: "login com credencial de teste → chega no
// painel certo". Cobre o caminho que TODO usuário do produto atravessa e que
// nenhum outro teste alcança: sessão real, cookie real, `middleware.ts` real,
// e o roteamento por role de `app/app/page.tsx`.
//
// ⚠️ A conta de teste é criada UMA VEZ, à mão, com role `vet`, e reutilizada.
// A suíte não cria conta em produção: o card proíbe, e com razão. Conta órfã
// em produção vira dado pessoal sem dono na hora da exportação da F6.

const credencial = credencialVet();

test.describe("login com credencial real", () => {
  // Pular é diferente de passar. Sem os secrets, estes testes aparecem como
  // "skipped" com o motivo escrito, e não como suíte verde mentindo.
  test.skip(credencial === null, SEM_CREDENCIAL);

  test("senha errada recusa e nao cria sessao", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(credencial!.email);
    await page.locator("#password").fill("senha-propositalmente-errada-000");
    await page.getByRole("button", { name: /fazer login/i }).click();

    // A tela mostra o erro do Supabase no <p role="alert">.
    await expect(page.getByRole("alert")).toBeVisible();

    // E a porta continua trancada: o que importa não é a mensagem, é que
    // nenhuma sessão nasceu.
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("credencial certa entra e cai no painel do veterinario", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(credencial!.email);
    await page.locator("#password").fill(credencial!.senha);
    await page.getByRole("button", { name: /fazer login/i }).click();

    // `/app` é só o roteador por role: ele redireciona e não renderiza nada.
    // A conta de teste é `vet`, então o destino legítimo é o painel do
    // veterinário OU o onboarding dele, dependendo do estado do cadastro.
    //
    // ⚠️ Rota em português, role em inglês (DL-043). O que se espera na URL é
    // `/app/veterinario`, nunca `/app/vet`.
    await expect(page).toHaveURL(/\/app\/veterinario(\/|$)/, { timeout: 20_000 });

    // Isolamento entre painéis: uma conta `vet` não entra no painel de outra
    // persona nem no admin. Isso é a matriz de `docs/06-PERMISSOES.md`, e é o
    // item 7 do DoD da F3 (R-001). Hoje o guard que segura isso é o
    // `requirePainel` das páginas, não o middleware: se alguém mexer nele, é
    // aqui que a queda aparece.
    await page.goto("/app/estabelecimento");
    await expect(page).not.toHaveURL(/\/app\/estabelecimento(\/|$)/);

    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/admin(\/|$)/);
  });
});
