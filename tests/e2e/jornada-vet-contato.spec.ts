import { randomUUID } from "node:crypto";
import { test, expect, type Browser, type Cookie, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { alvoEhTeste, conferirCookiesDoAlvo, exigirAlvoDeTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";
import { BUSCA_LIGADA, conferirSemContatoNoHtml, marcaDeRodada } from "../apoio/busca";
import {
  BOTAO_WHATSAPP,
  CONTATO_LIGADO,
  NO_MESMO_SITE,
  ROTA_CONTATO,
  baseDoSlug,
  contatosDe,
  digitos,
  pedidoDeContato,
  whatsappDeTeste,
  whatsappFormatado,
} from "../apoio/contato";
import { credencialAdmin, credencialTutor, SEM_ADMIN, SEM_TUTOR } from "../apoio/credenciais";
import { abrirFormulario, irParaPasso, passoAtual } from "../apoio/formulario";
import { EXIGIR, falharSeExigir } from "../apoio/pulo";
import {
  PDF_DE_TESTE,
  anotarEmailParaLimpar,
  apagarContasDaRodada,
  clienteDoUsuario,
  decisoesNaTrilha,
  emailDescartavel,
  idPorEmail,
  lerPerfil,
  lerSlugDoVet,
  senhaDescartavel,
  varrerDescartaveisAntigas,
} from "../apoio/servico";
import {
  BASE_URL,
  BASE_VET,
  DESTINO_VET,
  alertaDeErro,
  capturarSessao,
  destinoDeApp,
  rotaExata,
} from "../apoio/sessao";

// T-043 · A JORNADA QUE O ELBER TESTOU À MÃO EM 04/11/2026, AGORA NO CI.
//
//   cadastro de veterinário pela tela → login → onboarding com WhatsApp →
//   documento → enviar para aprovação → (fila: nada público ainda) → admin
//   aprova em /admin/validacoes → aparece em /buscar → cartão → perfil público
//   /veterinario/[slug] → "Chamar no WhatsApp" revela o número → a linha está
//   em `contatos` → o segundo toque em 24 h não duplica → o profissional lê a
//   contagem dele pelo PostgREST e NÃO lê `anon_id` (42501) → ninguém chama
//   `registrar_contato` com a chave do navegador.
//
// UM teste só, de propósito: é uma história, e cada passo depende do anterior
// (a mesma conta atravessa `incomplete → pending_validation → active`, que só
// acontece uma vez). Quebrar em testes menores criaria dependência de ordem,
// que a casa proíbe.
//
// ⚠️ ESCREVE NO BANCO: só roda no `vetria-e2e` (`E2E_ALVO=teste`, DL-064). A
// conta nasce pela TELA com email descartável (`+e2e-d-`), anotado ANTES do
// clique, e o `afterAll` apaga a conta e, pelo `on delete cascade`, os
// contatos dela. Rodada que morreu no meio é varrida na seguinte (60 min).
// Duas rodadas seguidas não se enxergam: nome, CRMV e WhatsApp são aleatórios.
//
// ⚠️ SÓ É REGISTRADO com `CONTATO_ABERTO_PARA_TESTE=1` e `E2E_BUSCA_LIGADA=1`
// (o CI liga os dois). Sem eles o botão não existe e a busca diz "abre em
// breve": o que vale nesse caso é `busca-publica.spec.ts` e a parte A de
// `contato-rota.spec.ts`, que amarram os interruptores ao estado real do alvo.
//
// ⚠️ T-046 (em paralelo): o WhatsApp passa a ser obrigatório no onboarding. O
// teste preenche o campo `#wpp` em QUALQUER passo em que ele aparecer, então
// continua valendo se a T-046 mudar o campo de passo.
//
// O que NÃO se mede aqui (ver o handoff da T-043): email de confirmação e de
// aprovação (o CI não tem RESEND_API_KEY; no vetria-e2e a confirmação é
// automática), login com Google (desligado no banco de teste), as telas de
// contatos da T-042 (ainda casca) e o vínculo do contato anônimo à conta nova
// (`vincular_contatos_do_visitante` existe na 0006, mas o app ainda não chama).

const ATIVO = alvoEhTeste();
const ROTA_ONB_VET = `${BASE_VET}/onboarding`;
const ROTA_FILA = "/admin/validacoes";

/** Preenche o WhatsApp se o campo estiver neste passo (T-046 pode movê-lo). */
async function preencherWhatsappSeVisivel(page: Page, whatsapp: string): Promise<boolean> {
  const campo = page.locator("#wpp");
  if (!(await campo.isVisible())) return false;
  await campo.fill(whatsapp);
  return true;
}

async function contextoCom(browser: Browser, cookies: Cookie[], largura = 1280) {
  const contexto = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: largura, height: largura < 500 ? 812 : 900 },
  });
  if (cookies.length > 0) await contexto.addCookies(cookies);
  const page = await contexto.newPage();
  return { page, contexto, fechar: () => contexto.close().catch(() => {}) };
}

function cartaoDe(page: Page, nome: string) {
  return page.locator('a[href^="/veterinario/"]').filter({ hasText: nome });
}

if (CONTATO_LIGADO && BUSCA_LIGADA) {
  test.describe("Jornada completa: cadastro de veterinario ate o numero revelado no perfil publico", () => {
    test.skip(!ATIVO && !EXIGIR, SEM_ALVO_DE_TESTE);

    const credencialDoAdmin = credencialAdmin();
    const credencialDoTutor = credencialTutor();

    test.beforeAll(async () => {
      falharSeExigir(!ATIVO, SEM_ALVO_DE_TESTE);
      if (!ATIVO) return;
      test.setTimeout(120_000);
      // Estoura aqui, antes de qualquer escrita, se o alvo não for o de teste.
      exigirAlvoDeTeste();
      falharSeExigir(credencialDoAdmin === null, SEM_ADMIN);
      falharSeExigir(credencialDoTutor === null, SEM_TUTOR);
      await varrerDescartaveisAntigas(60);
    });

    test.afterAll(async () => {
      if (!ATIVO) return;
      test.setTimeout(120_000);
      await apagarContasDaRodada();
    });

    test("cadastro, onboarding com WhatsApp, fila, aprovacao pela tela, busca, perfil e numero revelado", async ({
      browser,
      page,
      request,
    }) => {
      test.skip(credencialDoAdmin === null && !EXIGIR, SEM_ADMIN);
      test.skip(credencialDoTutor === null && !EXIGIR, SEM_TUTOR);
      test.setTimeout(420_000);

      const marca = marcaDeRodada();
      const nome = `QA E2E Jornada ${marca[0].toUpperCase()}${marca.slice(1)}`;
      const email = emailDescartavel("vet");
      const senha = senhaDescartavel();
      const whatsapp = whatsappDeTeste();
      const crmv = `${1 + Math.floor(Math.random() * 9)}${digitos(5)}`;
      // Antes do clique: se o teste morrer entre o cadastro e a leitura do id,
      // o `afterAll` ainda apaga a conta pelo email.
      anotarEmailParaLimpar(email);

      // =====================================================================
      // 1. CADASTRO PELA TELA
      // =====================================================================
      await test.step("cadastro em /cadastro/veterinario", async () => {
        await page.goto("/cadastro/veterinario");
        // Hidratação: o olho da senha só troca o `type` depois do React.
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
          await expect(page.getByRole("heading", { name: /confirme seu email/i })).toBeVisible({ timeout: 30_000 });
        } catch {
          const alerta = await alertaDeErro(page).innerText({ timeout: 2_000 }).catch(() => "");
          throw new Error(`o cadastro pela tela nao terminou. Mensagem na tela: "${alerta.trim() || "(nenhuma)"}"`);
        }
      });

      const id = await idPorEmail(email);
      expect(id, "o cadastro disse que deu certo e a conta nao existe no Auth").not.toBeNull();
      const nascido = await lerPerfil(id!);
      expect(nascido.role).toBe("vet");
      expect(nascido.status).toBe("incomplete");

      // =====================================================================
      // 2. LOGIN PELA TELA (como quem confirmou o email e voltou)
      // =====================================================================
      await test.step("login pelo link 'Ja confirmei'", async () => {
        // Em produção quem chega aqui não tem sessão (a confirmação é por
        // email). No vetria-e2e o signUp já devolve sessão; ela é jogada fora
        // para o login ser o de verdade.
        await page.context().clearCookies();
        await page.getByRole("link", { name: /já confirmei, ir pro login/i }).click();
        await expect(page).toHaveURL(/\/login(\?|$)/);
        await page.locator("#email").fill(email);
        await page.locator("#password").fill(senha);
        await page.getByRole("button", { name: /fazer login/i }).click();
        await expect(page).toHaveURL(rotaExata(DESTINO_VET.incomplete), { timeout: 30_000 });
      });
      const sessaoVet = await page.context().cookies();
      // DL-064: o cookie de sessão tem de ser do projeto de TESTE.
      conferirCookiesDoAlvo(sessaoVet.map((c) => c.name));

      // =====================================================================
      // 3. ONBOARDING, COM WHATSAPP, ATÉ A FILA
      // =====================================================================
      await test.step("onboarding em 4 passos, com WhatsApp e documento", async () => {
        await abrirFormulario(page, ROTA_ONB_VET, rotaExata(ROTA_ONB_VET));
        await expect(page.locator("#nome")).toHaveValue(nome);
        let preencheuWhatsapp = false;

        await page.locator("#titulo").selectOption("mv");
        await page.locator("#crmv").fill(crmv);
        await page.locator("#uf").selectOption("TO");
        await page.getByRole("button", { name: /^Clínica geral/ }).click();
        await page.locator("#exp").selectOption("3a5");
        preencheuWhatsapp ||= await preencherWhatsappSeVisivel(page, whatsapp);

        await irParaPasso(page, 2);
        await page.locator("#cidade").fill("Palmas");
        await page.locator("#estado").selectOption("TO");
        await page.getByRole("button", { name: /^Presencial/ }).click();
        preencheuWhatsapp ||= await preencherWhatsappSeVisivel(page, whatsapp);

        await irParaPasso(page, 3);
        await page.locator("#bio").fill("Bio da jornada E2E da Vetria.");
        preencheuWhatsapp ||= await preencherWhatsappSeVisivel(page, whatsapp);

        await irParaPasso(page, 4);
        preencheuWhatsapp ||= await preencherWhatsappSeVisivel(page, whatsapp);
        expect(preencheuWhatsapp, "o campo de WhatsApp (#wpp) nao apareceu em nenhum dos 4 passos").toBe(true);
        expect(await passoAtual(page)).toBe(4);

        await page.locator("#documento").setInputFiles({
          name: "crmv-jornada.pdf",
          mimeType: "application/pdf",
          buffer: PDF_DE_TESTE,
        });
        await page.getByRole("button", { name: /^enviar documento$/i }).click();
        await expect(page.getByText(/documento recebido em/i)).toBeVisible({ timeout: 30_000 });

        const concluir = page.getByRole("button", { name: /^concluir cadastro$/i });
        await expect(concluir).toBeEnabled();
        await concluir.click();
        await expect(page).toHaveURL(rotaExata(DESTINO_VET.pending_validation), { timeout: 30_000 });
        await expect(page.getByText(/estamos validando seu cadastro/i)).toBeVisible();
      });

      const naFila = await lerPerfil(id!);
      expect(naFila.status).toBe("pending_validation");
      expect(await lerSlugDoVet(id!), "conta na fila ja tem endereco publico").toBeNull();

      // =====================================================================
      // 4. NA FILA: NADA PÚBLICO AINDA, E A PRÉVIA É SÓ DA DONA
      // =====================================================================
      await test.step("pending_validation: fora da busca, sem perfil, sem contato; a previa e so da dona", async () => {
        const visitante = await contextoCom(browser, []);
        try {
          await visitante.page.goto(`/buscar?q=${marca}`);
          await expect(cartaoDe(visitante.page, nome), "conta na fila apareceu na busca").toHaveCount(0);
          const perfil = await visitante.page.goto(`/veterinario/${baseDoSlug(nome)}-palmas-to`);
          expect(perfil?.status(), "a conta na fila ja tem pagina publica").toBe(404);
          await expect(visitante.page.getByRole("button", { name: BOTAO_WHATSAPP })).toHaveCount(0);
        } finally {
          await visitante.fechar();
        }

        // A rota também não acha (o banco confere `active`), e nada é gravado.
        const r = await request.post(ROTA_CONTATO, {
          headers: NO_MESMO_SITE,
          data: pedidoDeContato(`${baseDoSlug(nome)}-palmas-to`),
        });
        expect(r.status()).toBe(404);
        expect(await r.text()).not.toContain(whatsapp.slice(-8));
        expect(await contatosDe(id!)).toHaveLength(0);

        // T-038: a dona vê a prévia, sem botão e sem o número.
        await page.goto(`${BASE_VET}/perfil`);
        await expect(page).toHaveURL(rotaExata(`${BASE_VET}/perfil`));
        await expect(page.getByText("Prévia: como o responsável vê")).toBeVisible();
        await expect(page.getByText(nome).first()).toBeVisible();
        await expect(page.getByRole("button", { name: BOTAO_WHATSAPP })).toHaveCount(0);
        expect((await page.content()).includes(whatsapp.slice(-8)), "o numero saiu na previa").toBe(false);

        // T-038: outra conta (responsável) que digita o endereço da prévia
        // cai no painel dela, e não vê nada da dona.
        const sessaoTutor = await capturarSessao(browser, credencialDoTutor!, "E2E_TUTOR_EMAIL");
        const tutor = await contextoCom(browser, sessaoTutor);
        try {
          await tutor.page.goto(`${BASE_VET}/perfil`);
          await tutor.page.waitForURL((url) => !url.pathname.startsWith(BASE_VET), { timeout: 30_000 });
          expect(new URL(tutor.page.url()).pathname).toMatch(/^\/app\/responsavel/);
          expect((await tutor.page.content()).includes(nome), "o responsavel viu a previa de outra conta").toBe(false);
        } finally {
          await tutor.fechar();
        }
      });

      // =====================================================================
      // 5. O ADMIN APROVA PELA TELA
      // =====================================================================
      await test.step("admin aprova em /admin/validacoes", async () => {
        const sessaoAdmin = await capturarSessao(browser, credencialDoAdmin!, "E2E_ADMIN_EMAIL");
        const admin = await contextoCom(browser, sessaoAdmin);
        try {
          await admin.page.goto(ROTA_FILA);
          const linha = admin.page.locator(`a[href="${ROTA_FILA}/${id}"]`);
          await expect(
            linha,
            "a conta nova nao aparece na primeira pagina da fila (sobra de rodada anterior empurrando?)"
          ).toBeVisible();
          await linha.click();
          await expect(admin.page).toHaveURL(rotaExata(`${ROTA_FILA}/${id}`));
          await expect(admin.page.getByRole("heading", { level: 1, name: nome })).toBeVisible();

          await admin.page.getByRole("button", { name: /^aprovar esta conta$/i }).click();
          await admin.page.getByRole("button", { name: /^confirmar aprovação$/i }).click();
          await expect(admin.page).toHaveURL(/\/admin\/validacoes\?decisao=aprovado&email=(enviado|falhou|desligado)$/, {
            timeout: 30_000,
          });
          await expect(admin.page.getByRole("status").filter({ hasText: /conta aprovada/i })).toBeVisible();
        } finally {
          await admin.fechar();
        }

        const aprovado = await lerPerfil(id!);
        expect(aprovado.status).toBe("active");
        expect(await decisoesNaTrilha(id!)).toBe(1);

        // A dona, com a sessão que já tinha, entra no painel.
        expect(await destinoDeApp(page)).toBe(DESTINO_VET.active);
      });

      const slug = await lerSlugDoVet(id!);
      expect(slug, "a aprovacao nao gerou o slug (0005)").not.toBeNull();
      expect(slug!).toMatch(new RegExp(`^${baseDoSlug(nome)}-palmas-to(-\\d+)?$`));
      const rotaPerfil = `/veterinario/${slug}`;

      // =====================================================================
      // 6. O VISITANTE, NO CELULAR: BUSCA → CARTÃO → PERFIL → NÚMERO
      // =====================================================================
      const visitante = await contextoCom(browser, [], 375);
      try {
        await test.step("busca pelo formulario de /buscar e abre o perfil pelo cartao", async () => {
          const v = visitante.page;
          await v.goto("/buscar");
          await v.locator("#busca-termo").fill(marca);
          await v.getByRole("search").getByRole("button", { name: /^buscar$/i }).click();
          await v.waitForURL((url) => url.pathname === "/buscar" && url.searchParams.get("q") === marca);
          const cartao = cartaoDe(v, nome);
          await expect(cartao, "a conta aprovada nao apareceu na busca").toHaveCount(1);
          await expect(cartao).toHaveAttribute("href", rotaPerfil);
          await cartao.click();
          await v.waitForURL((url) => url.pathname === rotaPerfil);
          await expect(v.getByRole("heading", { level: 1, name: nome })).toBeVisible();
          await expect(v.getByText("Verificado pela Vetria", { exact: true })).toBeVisible();
          const largura = await v.evaluate(() => document.documentElement.scrollWidth);
          expect(largura, "o perfil rola para o lado em 375 px").toBeLessThanOrEqual(375);
        });

        await test.step("o HTML do perfil e da busca nao tem o numero (DL-047)", async () => {
          await conferirSemContatoNoHtml(request, visitante.page, rotaPerfil, [whatsapp]);
          await conferirSemContatoNoHtml(request, visitante.page, `/buscar?q=${marca}`, [whatsapp]);
          expect(await contatosDe(id!)).toHaveLength(0);
        });

        await test.step("o toque revela o numero e grava UMA linha em contatos", async () => {
          const v = visitante.page;
          await v.goto(rotaPerfil);
          await v.getByRole("button", { name: BOTAO_WHATSAPP }).click();
          await expect(v.getByText(whatsappFormatado(whatsapp), { exact: true })).toBeVisible();
          await expect(v.getByRole("link", { name: /Abrir no WhatsApp/ })).toHaveAttribute(
            "href",
            new RegExp(`^https://wa\\.me/55${whatsapp}\\?text=`)
          );
          const linhas = await contatosDe(id!);
          expect(linhas, "o toque mostrou o numero e nao gravou a linha").toHaveLength(1);
          expect(linhas[0]).toMatchObject({ profissional_id: id, user_id: null, canal: "whatsapp" });
          expect(linhas[0].anon_id, "a linha nasceu sem anon_id (R-076)").not.toBeNull();

          const cookie = (await visitante.contexto.cookies()).find((c) => c.name === "vetria_visitante");
          expect(cookie?.value, "o navegador nao guardou o cookie do visitante").toBe(linhas[0].anon_id);
        });

        await test.step("o mesmo visitante de novo em 24 h ve o numero e nao conta 2 (D5)", async () => {
          const v = visitante.page;
          await v.reload();
          await v.getByRole("button", { name: BOTAO_WHATSAPP }).click();
          await expect(v.getByText(whatsappFormatado(whatsapp), { exact: true })).toBeVisible();
          expect(await contatosDe(id!), "o segundo toque em 24 h duplicou a linha").toHaveLength(1);
        });

        await test.step("depois do toque, o HTML servido continua sem o numero", async () => {
          await conferirSemContatoNoHtml(request, visitante.page, rotaPerfil, [whatsapp]);
        });
      } finally {
        await visitante.fechar();
      }

      // =====================================================================
      // 7. O BANCO, PELA API, COMO UM ATACANTE COM DEVTOOLS
      // =====================================================================
      await test.step("o profissional le a contagem 1, e anon_id/user_id dao 42501", async () => {
        const { cliente } = await clienteDoUsuario({ email, senha });
        try {
          const { data, error } = await cliente
            .from("contatos")
            .select("id, profissional_id, canal, created_at")
            .eq("profissional_id", id!);
          expect(error, `o profissional nao leu os proprios contatos: ${error?.message}`).toBeNull();
          expect(data ?? []).toHaveLength(1);

          for (const coluna of ["anon_id", "user_id"]) {
            const r = await cliente.from("contatos").select(coluna).eq("profissional_id", id!);
            expect(r.error?.code, `o profissional leu ${coluna} pelo PostgREST (R-074)`).toBe("42501");
          }

          // Nem o profissional chama a função que grava e devolve o número.
          const rpc = await cliente.rpc("registrar_contato", {
            p_tipo: "vet",
            p_slug: slug,
            p_user_id: null,
            p_anon_id: randomUUID(),
          });
          expect(rpc.error, "um logado chamou registrar_contato direto pelo PostgREST").not.toBeNull();
          expect(JSON.stringify(rpc.data ?? null)).not.toContain(whatsapp.slice(-8));
        } finally {
          await cliente.auth.signOut().catch(() => {});
        }
      });

      await test.step("rpc/registrar_contato com a chave anon e recusado e nao grava", async () => {
        const alvo = exigirAlvoDeTeste();
        const anon = createClient(alvo.url, alvo.anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const rpc = await anon.rpc("registrar_contato", {
          p_tipo: "vet",
          p_slug: slug,
          p_user_id: null,
          p_anon_id: randomUUID(),
        });
        expect(rpc.error, "a chave anon (que esta no bundle) chamou registrar_contato").not.toBeNull();
        expect(["42501", "PGRST202"], `codigo inesperado: ${rpc.error?.code}`).toContain(rpc.error?.code);
        expect(JSON.stringify(rpc.data ?? null)).not.toContain(whatsapp.slice(-8));

        const leitura = await anon.from("contatos").select("id").eq("profissional_id", id!);
        expect(leitura.data ?? [], "a chave anon leu contatos").toHaveLength(0);

        expect(await contatosDe(id!), "alguma chamada direta gravou contato").toHaveLength(1);
      });

      // A dona continua entrando no painel (nada acima mexeu no status).
      const final = await contextoCom(browser, sessaoVet);
      try {
        expect(await destinoDeApp(final.page)).toBe(DESTINO_VET.active);
      } finally {
        await final.fechar();
      }
    });
  });
}
