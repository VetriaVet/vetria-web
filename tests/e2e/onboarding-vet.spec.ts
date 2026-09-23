import { test, expect, type Cookie, type Page } from "@playwright/test";
import { credencialVet, SEM_CREDENCIAL } from "../apoio/credenciais";
import {
  BASE_VET,
  DESTINO_VET,
  aplicarSessao,
  capturarSessao,
  alertaDeErro,
  rotaExata,
} from "../apoio/sessao";
import {
  abrirFormulario,
  adulterarProximaAction,
  botaoContinuar,
  contarServerActions,
  irParaPasso,
} from "../apoio/formulario";
import { EXIGIR, falharSeExigir, pularOuFalhar } from "../apoio/pulo";
import { alvoEhTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";
import { clienteDeServico, garantirVetFixoNaFila, idPorEmail } from "../apoio/servico";

// Camada 4 da suíte: A PERSISTÊNCIA DO ONBOARDING, MEDIDA E NÃO AFIRMADA.
//
// Isto é o R-033: *"a persistência do onboarding continua sem teste: a prova
// da T-006 foi manual"*.
//
// ---------------------------------------------------------------------------
// O DESENHO: A CONTA FIXA, EM `pending_validation`
// ---------------------------------------------------------------------------
// A conta vet de teste (`E2E_VET_EMAIL`) está em `pending_validation`, e a
// matriz §4 (DL-046) diz que quem espera validação CONTINUA EDITANDO. Nesse
// estado `salvarOnboardingVet` faz o upsert em `vet_profiles` e em
// `perfil_privado` e NÃO chama a RPC da conclusão. O caminho de escrita e o de
// releitura são os da T-006, e são repetíveis para sempre.
//
// A primeira conclusão (`incomplete → pending_validation`) com conta NOVA é o
// `fluxos-conta-nova.spec.ts` (T-029), e só roda no projeto de teste.
//
// ---------------------------------------------------------------------------
// OS DOIS ALVOS (DL-064)
// ---------------------------------------------------------------------------
// · Produção (CI de hoje): a conta fixa é a "QA E2E NAO APROVAR". As travas de
//   `exigirModoRevisao` e `exigirDocumentoEnviado` PULAM com o motivo escrito
//   se ela não estiver em revisão ou não tiver documento.
// · Teste (`E2E_ALVO=teste`): o `beforeAll` devolve a conta fixa à fila, com
//   documento, antes de tudo (`garantirVetFixoNaFila`). Lá as travas não
//   deveriam disparar nunca, e com `E2E_EXIGIR_FILA=1` elas FALHAM.
//
// ---------------------------------------------------------------------------
// ⚠️ 23/09/2026 — AS MÁSCARAS DA T-035 MUDARAM ONDE A RECUSA ACONTECE
// ---------------------------------------------------------------------------
// CRMV e WhatsApp viraram `CampoMascarado`: letra não entra, e valor fora da
// regra DESABILITA o "Continuar" com o motivo no rodapé. As especialidades
// passaram a recusar a quinta no próprio chip. Consequência para este arquivo:
//
//   · Digitar "nao e um telefone" no WhatsApp deixa o campo VAZIO, e WhatsApp
//     vazio é aceito (é opcional). O teste antigo contava com a recusa do
//     servidor, e com a máscara ele passaria a GRAVAR a cidade marcadora na
//     conta real. Ele saiu. A recusa agora é provada NA TELA, e com a prova de
//     que nenhuma Server Action foi disparada (`contarServerActions`).
//   · A prova de que o servidor continua recusando quando a tela é contornada
//     ficou, mas só com valor que o BANCO também recusa (CHECK da `0004`):
//     CRMV com letra e cinco especialidades. Se um dia a Action regredir, o
//     CHECK recusa o upsert inteiro e nada é gravado, nem em produção.
//   · O que o banco NÃO guarda por CHECK (WhatsApp em `perfil_privado`, cidade
//     em branco) só é provado contornando a tela no projeto de TESTE: em
//     produção, uma regressão da Action gravaria o lixo na conta real.
//
// ---------------------------------------------------------------------------
// A INTERTRAVA, E ELA É A PARTE MAIS IMPORTANTE DESTE ARQUIVO
// ---------------------------------------------------------------------------
// ⚠️ Se a conta estiver em `incomplete`, clicar em "Concluir cadastro" com
// dados válidos dispara a RPC e QUEIMA A CONTA. NENHUM teste daqui clica no
// submit sem antes conferir que o formulário está em modo "revisão".

const credencial = credencialVet();

const ROTA_ONBOARDING = `${BASE_VET}/onboarding`;

// Só o que o `campos.ts` do vet já declara. Duplicar aqui é de propósito:
// teste que importa a constante do produto não descobre quando o produto muda
// a constante por engano.
const ESPECIALIDADES_EM_TELA = [
  "Clínica geral", "Cardiologia", "Dermatologia", "Oftalmologia",
  "Ortopedia", "Cirurgia", "Anestesiologia", "Oncologia",
  "Animais exóticos", "Felinos", "Equinos", "Comportamento",
];

const SO_NO_PROJETO_DE_TESTE =
  "contorna a tela com um valor que o banco NAO recusa por CHECK: se a Action regredir, o valor seria gravado. " +
  "So roda no projeto de teste. " + SEM_ALVO_DE_TESTE;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

async function abrirOnboarding(page: Page) {
  await abrirFormulario(page, ROTA_ONBOARDING, rotaExata(ROTA_ONBOARDING));
}

function chip(page: Page, nome: string) {
  // O chip principal ganha o selo "principal" no nome acessível; por isso a
  // âncora é só no começo.
  return page.getByRole("button", { name: new RegExp(`^${nome}`) }).first();
}

/** A INTERTRAVA: só passa adiante se o formulário estiver em modo "revisão". */
async function exigirModoRevisao(page: Page) {
  const emRevisao = await page
    .getByRole("heading", { level: 1, name: /está em valida/i })
    .isVisible();

  pularOuFalhar(
    !emRevisao,
    "a conta de teste NAO esta em pending_validation: o onboarding abriu em modo 'novo'. " +
      "Submeter aqui chamaria concluir_onboarding_profissional(), que so roda uma vez, e QUEIMARIA a conta de teste. " +
      "A prova de persistencia NAO rodou. Devolva a conta para pending_validation para reativar esta cobertura."
  );
}

/**
 * A SEGUNDA TRAVA (T-008): sem documento, o botão do passo 4 nasce
 * desabilitado. Antes de pular, cobra da tela que o botão desabilitado diga
 * por quê.
 */
async function exigirDocumentoEnviado(page: Page) {
  await irParaPasso(page, 4);

  const botao = page.getByRole("button", { name: /^salvar alterações$/i });
  await expect(
    botao,
    "o botao do passo 4 nao e 'Salvar alteracoes': o formulario nao esta em modo revisao e este teste NAO pode submeter"
  ).toBeVisible();

  const desabilitado = await botao.isDisabled();

  if (desabilitado) {
    await expect(
      page.getByText(/falta enviar o documento/i),
      "o botao de concluir esta desabilitado e o rodape NAO diz por que: botao morto sem motivo na tela"
    ).toBeVisible();
  }

  pularOuFalhar(
    desabilitado,
    "a conta de teste vet ainda NAO tem documento enviado, entao a T-008 mantem 'Salvar alteracoes' desabilitado e a prova de persistencia NAO rodou. " +
      "Em producao: destrave uma vez, a mao (passo 4, enviar um PDF de 1 pagina). No projeto de teste o beforeAll faz isso sozinho."
  );
}

/** Clica em salvar no passo 4, conferindo a trava do documento antes. */
async function salvar(page: Page) {
  await exigirDocumentoEnviado(page);
  await page.getByRole("button", { name: /^salvar alterações$/i }).click();
}

async function lerBairro(page: Page): Promise<string> {
  await abrirOnboarding(page);
  await irParaPasso(page, 2);
  return page.locator("#bairro").inputValue();
}

async function salvarBairro(page: Page, valor: string) {
  await abrirOnboarding(page);
  await exigirModoRevisao(page);
  await irParaPasso(page, 2);
  await page.locator("#bairro").fill(valor);
  await salvar(page);

  // Para quem está na fila, o destino da Action é `/aguardando` — de quebra, a
  // prova de que a Action não manda para o painel quem não foi aprovado (R-050).
  await expect(page).toHaveURL(rotaExata(DESTINO_VET.pending_validation), {
    timeout: 30_000,
  });
}

/** As especialidades marcadas agora, lidas do `aria-pressed` (T-035). */
function chipsMarcados(page: Page) {
  return page.locator('button[aria-pressed="true"]');
}

// ---------------------------------------------------------------------------
// OS TESTES
// ---------------------------------------------------------------------------

test.describe("persistencia do onboarding do veterinario (R-033)", () => {
  test.skip(credencial === null && !EXIGIR, SEM_CREDENCIAL);

  let sessao: Cookie[] = [];

  test.beforeAll(async ({ browser }) => {
    falharSeExigir(credencial === null, SEM_CREDENCIAL);
    if (!credencial) return;
    test.setTimeout(120_000);
    // No projeto de teste, a conta fixa volta à fila com documento antes de
    // tudo. Em produção nada é escrito aqui.
    if (alvoEhTeste()) await garantirVetFixoNaFila(credencial);
    sessao = await capturarSessao(browser, credencial);
  });

  test.beforeEach(async ({ page }) => {
    await aplicarSessao(page, sessao);
  });

  test("o formulario abre com o que o servidor gravou, e nao vazio", async ({
    page,
  }) => {
    // Zero escrita. É o lado da LEITURA: o que está no banco volta para a tela.
    await abrirOnboarding(page);
    await exigirModoRevisao(page);

    // ⚠️ Nenhum valor esperado está escrito aqui: o que se afirma é a FORMA.
    await expect(page.locator("#nome")).not.toHaveValue("");
    // R-059 / CHECK `vet_profiles_crmv_formato`: só algarismos, até 6.
    expect(
      await page.locator("#crmv").inputValue(),
      "o CRMV gravado nao e so algarismos (R-059)"
    ).toMatch(/^\d{1,6}$/);
    expect(
      await page.locator("#uf").inputValue(),
      "a UF do CRMV gravada nao e uma UF"
    ).toMatch(/^[A-Z]{2}$/);

    await irParaPasso(page, 2);
    await expect(page.locator("#cidade")).not.toHaveValue("");
    expect(
      await page.locator("#estado").inputValue(),
      "a UF de atendimento gravada nao e uma UF"
    ).toMatch(/^[A-Z]{2}$/);

    await irParaPasso(page, 3);
    // ⚠️ T-035: o campo agora MOSTRA o número formatado pela máscara, e a
    // máscara formata qualquer coisa que tenha dígito. Pela tela já não dá
    // para provar que o BANCO guarda só dígitos (R-041 / SEC-062). A tela
    // prova a forma exibida; o banco é lido abaixo, quando o alvo permite.
    expect(
      await page.locator("#wpp").inputValue(),
      "o whatsapp exibido nao esta no formato da mascara"
    ).toMatch(/^(\(\d{2}\) \d{4,5}-\d{4})?$/);

    if (alvoEhTeste() && credencial) {
      const id = await idPorEmail(credencial.email);
      const { data } = await clienteDeServico()
        .from("perfil_privado")
        .select("whatsapp")
        .eq("id", id!)
        .maybeSingle<{ whatsapp: string | null }>();
      expect(
        data?.whatsapp ?? "",
        "o whatsapp GRAVADO nao esta normalizado em digitos (R-041)"
      ).toMatch(/^(\d{10,11})?$/);
    }
  });

  test("o que foi salvo continua la depois de sair e voltar", async ({
    page,
  }) => {
    // ⚠️ ESTE É O TESTE QUE FECHA O R-033 NA CONTA FIXA. Ele escreve de
    // verdade e lê de volta numa visita nova.
    //
    // `bairro`: opcional e livre (nenhum valor quebra validação), fora dos
    // campos que o trigger de revalidação vigia, e a conta não aparece em
    // busca nenhuma. O original é restaurado no fim, mesmo se a asserção cair.
    test.setTimeout(180_000);

    // PRÉ-VOO antes de qualquer escrita, para o `skip` não disparar no meio do
    // try/finally.
    await abrirOnboarding(page);
    await exigirModoRevisao(page);
    await exigirDocumentoEnviado(page);

    const original = await lerBairro(page);
    const marcador = `QA E2E ${Date.now()}`;

    let escreveu = false;
    try {
      escreveu = true;
      await salvarBairro(page, marcador);

      expect(
        await lerBairro(page),
        "o valor salvo nao voltou do banco na visita seguinte"
      ).toBe(marcador);
    } finally {
      if (escreveu) {
        await salvarBairro(page, original);
        expect(
          await lerBairro(page),
          "o valor original nao foi restaurado: a conta de teste ficou com sujeira de teste"
        ).toBe(original);
      }
    }
  });

  // -------------------------------------------------------------------------
  // T-035 — A RECUSA NA TELA, E A PROVA DE QUE NADA SAIU DO NAVEGADOR
  // -------------------------------------------------------------------------
  // Nenhum destes clica em salvar. O que se prova é que a tela segura o valor
  // errado ANTES do passo 4, e que zero Server Action foi disparada.

  test("whatsapp com letra nao entra, e 0800 segura o Continuar com o motivo", async ({
    page,
  }) => {
    const actions = contarServerActions(page);
    await abrirOnboarding(page);
    await irParaPasso(page, 3);

    const wpp = page.locator("#wpp");

    // Letra não entra. Era o "nao e um telefone" do teste antigo: com a
    // máscara, o campo fica vazio, e vazio é aceito (opcional). Por isso este
    // teste NÃO submete nada.
    await wpp.fill("nao e um telefone");
    await expect(wpp, "a mascara deixou letra entrar no WhatsApp").toHaveValue("");

    // 0800 não recebe mensagem no WhatsApp. A máscara formata os dígitos e
    // acusa o problema embaixo do campo quando a pessoa sai dele.
    await wpp.fill("0800 123 4567");
    await wpp.blur();
    await expect(page.locator("#wpp-erro")).toContainText(/0800/);
    await expect(wpp).toHaveAttribute("aria-invalid", "true");

    // O passo não avança, e o motivo está na tela (rodapé), não só no title.
    await expect(botaoContinuar(page)).toBeDisabled();
    await expect(page.getByText(/confira o whatsapp para continuar/i)).toBeVisible();

    expect(actions(), "a tela disparou Server Action com o WhatsApp invalido").toBe(0);
  });

  test("DDD que nao existe tambem segura o Continuar", async ({ page }) => {
    const actions = contarServerActions(page);
    await abrirOnboarding(page);
    await irParaPasso(page, 3);

    const wpp = page.locator("#wpp");
    await wpp.fill("(20) 99999-9999");
    await wpp.blur();
    await expect(page.locator("#wpp-erro")).toContainText(/DDD não existe/i);
    await expect(botaoContinuar(page)).toBeDisabled();

    expect(actions()).toBe(0);
  });

  test("CRMV com a sigla do estado: a letra nao entra no campo", async ({
    page,
  }) => {
    // R-059: "GO-0155" foi o que a fila mostrou em 23/09. Com a máscara, a
    // sigla e o hífen simplesmente não entram.
    const actions = contarServerActions(page);
    await abrirOnboarding(page);

    const crmv = page.locator("#crmv");
    // 6 caracteres, e não "GO-0155" (7): o campo tem `maxLength` 6, e um
    // `fill` maior que isso seria cortado pelo navegador antes da máscara,
    // provando outra coisa.
    await crmv.fill("GO-155");
    await expect(crmv, "a mascara deixou letra ou hifen entrar no CRMV").toHaveValue("155");

    // Zero à esquerda é informação ("05107" é CRMV real): não pode sumir.
    await crmv.fill("05107");
    await expect(crmv).toHaveValue("05107");

    expect(actions()).toBe(0);
  });

  test("o chip recusa a quinta especialidade na hora, com o aviso", async ({
    page,
  }) => {
    // R-060: antes, a tela deixava marcar 12 e só o passo 4 avisava. Agora a
    // quinta não entra e o aviso aparece no ato.
    const actions = contarServerActions(page);
    await abrirOnboarding(page);

    // Desmarca o que o banco trouxe, para partir de zero sem saber o que era.
    const marcados = chipsMarcados(page);
    while ((await marcados.count()) > 0) {
      await marcados.first().click();
    }
    await expect(marcados).toHaveCount(0);

    for (const esp of ESPECIALIDADES_EM_TELA.slice(0, 4)) {
      await chip(page, esp).click();
    }
    // A quinta está com `aria-disabled`, e o Playwright espera "habilitado"
    // antes de clicar. Uma pessoa clica mesmo assim, e é esse clique que tem
    // que ser recusado com o aviso: por isso `force`.
    await chip(page, ESPECIALIDADES_EM_TELA[4]).click({ force: true });

    await expect(marcados, "o chip deixou marcar mais de 4").toHaveCount(4);
    await expect(chip(page, ESPECIALIDADES_EM_TELA[4])).toHaveAttribute("aria-pressed", "false");
    await expect(chip(page, ESPECIALIDADES_EM_TELA[4])).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByText(/limite de 4 atingido/i).first()).toBeVisible();
    await expect(page.getByText(/^4 de 4$/).first()).toBeVisible();

    // Nada foi salvo: a troca de especialidade é só estado de tela até o
    // passo 4, e este teste não chega lá.
    expect(actions()).toBe(0);
  });

  // -------------------------------------------------------------------------
  // CONTORNANDO A TELA — o servidor continua sendo a regra que vale
  // -------------------------------------------------------------------------
  // ⚠️ Só com valor que o BANCO TAMBÉM recusa por CHECK (0004). Se a Action
  // regredir, o CHECK recusa o upsert de `vet_profiles` inteiro, e a Action
  // nunca chega ao upsert de `perfil_privado`. Nada é gravado, nem em produção.

  test("contornando a mascara, o servidor recusa CRMV com letra e nada muda", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await abrirOnboarding(page);
    await exigirModoRevisao(page);
    const crmvOriginal = await page.locator("#crmv").inputValue();

    const adulteracao = await adulterarProximaAction(page, ROTA_ONBOARDING, (p) => {
      p.crmv = "GO-0155";
    });
    await salvar(page);

    await expect(alertaDeErro(page)).toContainText(/algarismos/i);
    expect(
      adulteracao.adulterou(),
      `o pedido nao foi adulterado: ${adulteracao.motivoDeFalha() ?? "nenhuma Server Action saiu"}`
    ).toBe(true);
    await expect(page).toHaveURL(rotaExata(ROTA_ONBOARDING));

    // A prova do "não gravou", numa visita nova.
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await abrirOnboarding(page);
    await expect(
      page.locator("#crmv"),
      "a recusa do servidor gravou o CRMV adulterado"
    ).toHaveValue(crmvOriginal);
  });

  test("contornando o chip, o servidor recusa cinco especialidades e nada muda", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await abrirOnboarding(page);
    await exigirModoRevisao(page);
    const antes = await chipsMarcados(page).count();

    const adulteracao = await adulterarProximaAction(page, ROTA_ONBOARDING, (p) => {
      p.especialidades = ESPECIALIDADES_EM_TELA.slice(0, 5);
    });
    await salvar(page);

    await expect(alertaDeErro(page)).toContainText(/no máximo 4 especialidades/i);
    expect(
      adulteracao.adulterou(),
      `o pedido nao foi adulterado: ${adulteracao.motivoDeFalha() ?? "nenhuma Server Action saiu"}`
    ).toBe(true);
    await expect(page).toHaveURL(rotaExata(ROTA_ONBOARDING));

    await page.unrouteAll({ behavior: "ignoreErrors" });
    await abrirOnboarding(page);
    await expect(chipsMarcados(page)).toHaveCount(antes);
  });

  // Só no projeto de teste: o banco não tem CHECK que segure estes dois.

  test("contornando a mascara, o servidor recusa 0800 no WhatsApp (so no projeto de teste)", async ({
    page,
  }) => {
    pularOuFalhar(!alvoEhTeste(), SO_NO_PROJETO_DE_TESTE);
    test.setTimeout(120_000);
    await abrirOnboarding(page);
    await exigirModoRevisao(page);

    const adulteracao = await adulterarProximaAction(page, ROTA_ONBOARDING, (p) => {
      p.whatsapp = "0800 123 4567";
    });
    await salvar(page);

    // A mensagem explica o PORQUÊ: 0800 não recebe mensagem no WhatsApp.
    await expect(alertaDeErro(page)).toContainText(/0800/);
    expect(adulteracao.adulterou(), adulteracao.motivoDeFalha() ?? "").toBe(true);
    await expect(page).toHaveURL(rotaExata(ROTA_ONBOARDING));
  });

  test("o servidor recusa cadastro sem cidade (so no projeto de teste)", async ({
    page,
  }) => {
    // `cidade` é faceta da busca da F4/S6: perfil aprovado sem cidade é perfil
    // que nenhum filtro encontra. A tela não segura cidade em branco (o
    // "Continuar" do passo 2 só olha a forma de atendimento), então isto chega
    // ao servidor pela tela mesmo. Não há CHECK de cidade vazia: se a Action
    // regredir, a cidade em branco seria gravada. Por isso só no teste.
    pularOuFalhar(!alvoEhTeste(), SO_NO_PROJETO_DE_TESTE);
    await abrirOnboarding(page);
    await exigirModoRevisao(page);
    await irParaPasso(page, 2);
    await page.locator("#cidade").fill("   ");
    await salvar(page);

    await expect(alertaDeErro(page)).toContainText(/informe a cidade/i);
    await expect(page).toHaveURL(rotaExata(ROTA_ONBOARDING));
  });

  // -------------------------------------------------------------------------
  // T-008 — A ROTA DE UPLOAD RECUSA PELO QUE O ARQUIVO É, NÃO PELO QUE ELE DIZ
  // -------------------------------------------------------------------------
  // ⚠️ ESTES TESTES NÃO ESCREVEM NADA. A detecção de tipo é o passo 4 da rota,
  // e o objeto só vai para o bucket no passo 7.
  //
  // Vão por `page.request` (mesmos cookies do contexto), e não pela tela: o
  // que se prova é o caminho de quem NÃO passa por tela. A rota está fora do
  // `matcher` do `middleware.ts` (SEC-079).
  test.describe("a rota de upload recusa pela assinatura magica", () => {
    test("txt renomeado para .pdf e recusado, e nada sobe", async ({ page }) => {
      const resposta = await page.request.post("/api/documentos/upload", {
        multipart: {
          arquivo: {
            name: "carteira-crmv.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from(
              "isto aqui e um arquivo de texto comum, so o nome e que diz pdf\n",
              "utf8"
            ),
          },
        },
      });

      expect(resposta.status(), await resposta.text()).toBe(415);

      const corpo = (await resposta.json()) as { erro?: string };
      expect(corpo.erro).toMatch(/formato não aceito/i);
      expect(corpo.erro).toMatch(/PDF, JPG, PNG ou WEBP/i);
    });

    test("svg e recusado mesmo se disser que e pdf (R-004)", async ({
      page,
    }) => {
      // `dangerouslyAllowSVG` está ligado (DL-040), e quem abre o documento é
      // o ADMIN. O nome e o `content-type` mentem de propósito, os dois.
      const resposta = await page.request.post("/api/documentos/upload", {
        multipart: {
          arquivo: {
            name: "documento.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from(
              '<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>',
              "utf8"
            ),
          },
        },
      });

      expect(resposta.status(), await resposta.text()).toBe(415);
    });

    test("arquivo vazio e recusado antes de qualquer escrita", async ({
      page,
    }) => {
      const resposta = await page.request.post("/api/documentos/upload", {
        multipart: {
          arquivo: {
            name: "vazio.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from("", "utf8"),
          },
        },
      });

      expect(resposta.status(), await resposta.text()).toBe(400);
    });
  });
});
