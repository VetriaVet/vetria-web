import { test, expect, type Cookie } from "@playwright/test";
import { credencialTutor, SEM_TUTOR } from "../apoio/credenciais";
import { aplicarSessao, capturarSessao } from "../apoio/sessao";
import { garantirResponsavelNoPainel, PAINEL_RESPONSAVEL } from "../apoio/responsavel";
import { EXIGIR, falharSeExigir, pularOuFalhar } from "../apoio/pulo";
import { alvoEhTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";

// T-052 (QA-002): o responsável logado chega à busca a partir do painel.
//
// Só navega. A única escrita é preparação: se a conta fixa ainda não concluiu
// o onboarding do responsável, `garantirResponsavelNoPainel` conclui pela tela
// (uma vez na vida da conta). Roda SÓ com `E2E_ALVO=teste`: faz
// login, e o `.env.local` das máquinas de desenvolvimento aponta para
// produção. Login de teste em produção não entra nesta suíte (DL-064).

const credencial = alvoEhTeste() ? credencialTutor() : null;
const MOTIVO = alvoEhTeste() ? SEM_TUTOR : SEM_ALVO_DE_TESTE;

test.describe("o responsavel logado chega a /buscar pelo painel", () => {
  test.skip(credencial === null && !EXIGIR, MOTIVO);

  let sessao: Cookie[] = [];
  let destino = "";

  test.beforeAll(async ({ browser }) => {
    falharSeExigir(credencial === null, MOTIVO);
    if (!credencial) return;
    test.setTimeout(120_000);
    sessao = await capturarSessao(browser, credencial, "E2E_TUTOR_EMAIL");
    destino = await garantirResponsavelNoPainel(browser, sessao);
  });

  test.beforeEach(async ({ page }) => {
    // O `beforeAll` já concluiu o onboarding se faltava. Se mesmo assim o
    // painel não abre, dizer por quê, não passar calado.
    pularOuFalhar(
      destino !== PAINEL_RESPONSAVEL,
      `a conta E2E_TUTOR_* foi para ${destino || "(nada)"}, nao para ${PAINEL_RESPONSAVEL}, mesmo depois de tentar concluir o onboarding`
    );
    await aplicarSessao(page, sessao);
    await page.goto(PAINEL_RESPONSAVEL);
  });

  test("o campo de busca do painel envia o termo e a cidade para /buscar", async ({ page }) => {
    const busca = page.getByRole("search", { name: /buscar veterin/i });
    await busca.getByLabel("O que você procura").fill("dermatologia");
    await busca.getByLabel("Cidade").fill("Goiânia");
    await busca.getByRole("button", { name: "Buscar" }).click();

    await page.waitForURL((url) => url.pathname === "/buscar");
    const url = new URL(page.url());
    expect(url.searchParams.get("q")).toBe("dermatologia");
    expect(url.searchParams.get("cidade")).toBe("Goiânia");
  });

  test("o cartao Buscar profissional leva a /buscar", async ({ page }) => {
    await page.getByRole("link", { name: /buscar profissional/i }).click();
    await expect(page).toHaveURL(/\/buscar$/);
  });

  test("o menu do responsavel tem Buscar", async ({ page }) => {
    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Buscar", exact: true })
      .first()
      .click();
    await expect(page).toHaveURL(/\/buscar$/);
  });
});
