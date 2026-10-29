// A conta fixa de responsável (E2E_TUTOR_*) no painel, e não no onboarding.
//
// O onboarding do responsável é de mão única: a action marca
// `onboarding_completed = true` e dali em diante `/app` despacha para
// `/app/responsavel`. Uma conta fixa recém-criada no vetria-e2e ainda não
// passou por ele, e todo teste que precisa do painel morreria com "conclua o
// onboarding dela à mão". Em vez de trava manual, o helper conclui pela TELA,
// como um responsável de verdade faria (nada de `service_role` aqui).
//
// Quem depende do estado "onboarding pendente" desta conta: ninguém.
// `admin-validacoes.spec.ts` aceita os dois destinos de propósito.

import { expect, type Browser, type Cookie } from "@playwright/test";
import { BASE_URL, medirDestinoDeApp } from "./sessao";

export const PAINEL_RESPONSAVEL = "/app/responsavel";
export const ONBOARDING_RESPONSAVEL = `${PAINEL_RESPONSAVEL}/onboarding`;

/**
 * Mede para onde `/app` despacha a sessão; se for o onboarding do
 * responsável, preenche e envia o formulário e mede de novo. Devolve o
 * destino final (o chamador decide o que fazer se não for o painel).
 */
export async function garantirResponsavelNoPainel(
  browser: Browser,
  cookies: Cookie[]
): Promise<string> {
  const destino = await medirDestinoDeApp(browser, cookies);
  if (destino !== ONBOARDING_RESPONSAVEL) return destino;

  const contexto = await browser.newContext({ baseURL: BASE_URL });
  try {
    await contexto.addCookies(cookies);
    const page = await contexto.newPage();
    await page.goto(ONBOARDING_RESPONSAVEL);

    await page.getByLabel("Nome do animal").fill("QA E2E Animal");
    await page.getByLabel("Espécie").selectOption("cao");
    await page.getByLabel("Idade aproximada").selectOption("adulto");
    await page.getByLabel("Peso aproximado").selectOption("medio");
    await page.getByLabel("Cidade onde mora").fill("Palmas, TO");
    await page.getByRole("button", { name: /concluir onboarding/i }).click();

    // Estado, não relógio: a action redireciona para o painel no sucesso e de
    // volta ao onboarding com `?error=` na falha.
    await page.waitForURL(
      (url) => url.pathname === PAINEL_RESPONSAVEL || url.searchParams.has("error"),
      { timeout: 30_000 }
    );
    const final = new URL(page.url());
    expect(
      final.pathname,
      `o onboarding do responsavel nao concluiu (error=${final.searchParams.get("error") ?? "?"})`
    ).toBe(PAINEL_RESPONSAVEL);
  } finally {
    await contexto.close().catch(() => {});
  }

  return medirDestinoDeApp(browser, cookies);
}
