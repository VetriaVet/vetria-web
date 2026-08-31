import { defineConfig, devices } from "@playwright/test";

// T-003 — rede de segurança da F3. Ver docs/03-TAREFAS.md e R-003.
//
// Por que existe: são 13 semanas mexendo em código que JÁ está em produção,
// e a S2 é exatamente a semana em que o banco entra por baixo de telas que
// já estão no ar. Sem isto, regressão vira descoberta do cliente.
//
// ⚠️ Regra do projeto: `vetria-qa` escreve SÓ em `tests/`. Um teste nunca
// conserta o produto — ele acusa. Se um teste falhar, o conserto é do dono
// do arquivo de produção, não daqui.

const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

// Só sobe servidor local quando o alvo É o servidor local. Apontar a suíte
// pra uma URL de preview da Vercel (E2E_BASE_URL) não pode subir um `next
// start` inútil por cima.
const ALVO_LOCAL = BASE_URL.includes("127.0.0.1") || BASE_URL.includes("localhost");

export default defineConfig({
  testDir: "./tests/e2e",

  // ⚠️ `fullyParallel` fica DESLIGADO de propósito. Os testes com credencial
  // usam a MESMA conta de teste; em paralelo, um logout derruba a sessão do
  // outro e a falha some no dia seguinte. Ver R-003.
  fullyParallel: false,
  workers: 1,

  // Ninguém commita `test.only` sem perceber.
  forbidOnly: !!process.env.CI,

  // Retry só no CI, e só uma vez: retry local esconde teste instável de quem
  // acabou de escrevê-lo, que é quem consegue consertar.
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Roda contra o build de produção, não contra o `next dev`. O `dev` não
  // reproduz Server Action minificada, nem cache, nem o comportamento real
  // do middleware, e é justamente aí que a T-006 e a T-007 vivem.
  //
  // No CI o build já rodou no passo anterior do workflow, então aqui só sobe.
  // Local, constrói antes, pra ninguém testar um `.next` de três dias atrás.
  webServer: ALVO_LOCAL
    ? {
        command: process.env.CI ? "npm run start" : "npm run build && npm run start",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
        stdout: "pipe",
        stderr: "pipe",
      }
    : undefined,
});
