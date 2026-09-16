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

// Camada 4 da suíte: A PERSISTÊNCIA DO ONBOARDING, MEDIDA E NÃO AFIRMADA.
//
// Isto é o R-033, que está aberto desde 28/08: *"a persistência do onboarding
// continua sem teste: a prova da T-006 foi manual"*. Enquanto for manual, ela
// depende de uma pessoa com o computador na frente, e essa pessoa vira o
// gargalo de toda task de onboarding.
//
// ---------------------------------------------------------------------------
// O DESENHO, E POR QUE ELE NÃO É O QUE O CARD DA T-003 IMAGINAVA
// ---------------------------------------------------------------------------
// O teste que a T-003 pediu era "cadastro de vet → onboarding preenchido →
// sair e voltar → o dado está lá". Ele precisa de CONTA NOVA a cada rodada,
// porque `concluir_onboarding_profissional()` só tira alguém de `incomplete`
// UMA VEZ. E conta nova em produção é proibida (card da T-003, "Não fazer"):
// conta órfã vira dado pessoal sem dono na hora da exportação da F6. As duas
// saídas conhecidas do R-033 são caras: `service_role` dentro do CI (que o
// `ci.yml` promete por escrito que nunca vai acontecer) ou um segundo projeto
// Supabase para manter em sincronia.
//
// ⚠️ ESTE ARQUIVO TOMA UM TERCEIRO CAMINHO: prova a persistência SEM criar
// conta e SEM passar pela transição que só acontece uma vez.
//
// A conta de teste já está em `pending_validation` desde 31/08, e a matriz §4
// (DL-046) diz que quem espera validação CONTINUA EDITANDO o cadastro. Nesse
// estado, `salvarOnboardingVet` faz o upsert em `vet_profiles` e em
// `perfil_privado` e **não chama a RPC** (`actions.ts`: a chamada é
// condicionada a `status === 'incomplete'`). Ou seja: o caminho de ESCRITA e o
// de RELEITURA são exatamente os mesmos da T-006, e são repetíveis para
// sempre. O que fica de fora é só a transição `incomplete → pending_validation`
// em si.
//
// O que isso prova, de verdade:
//   · o formulário abre com o que o SERVIDOR gravou, e não com o que o cliente
//     lembrava (a releitura de `vet_profiles` + `perfil_privado`)
//   · um valor escrito hoje volta do banco na próxima visita (o ciclo completo
//     Client Form → Server Action → Postgres → Server Component → tela)
//   · as validações de servidor recusam SEM GRAVAR NADA
//
// O que isso NÃO prova, e está dito em voz alta para ninguém confundir teste
// verde com cobertura:
//   · a primeira conclusão (`incomplete → pending_validation`, a RPC e o
//     redirect para `/aguardando` vindo de `incomplete`)
//   · qualquer coisa do onboarding do ESTABELECIMENTO (T-007): não existe
//     conta `clinic` de teste, e a conta `vet` é barrada por role antes de
//     chegar no formulário. CNPJ, UF e serviços continuam sem cobertura
//
// ---------------------------------------------------------------------------
// ⚠️ 16/09/2026 — A T-008 ACRESCENTOU UMA SEGUNDA DEPENDÊNCIA DE ESTADO
// ---------------------------------------------------------------------------
// O passo 4 deixou de ser aviso: o botão de concluir/salvar agora nasce
// DESABILITADO enquanto `perfil_privado.documento_enviado_em` for nulo. A conta
// de teste nunca enviou documento, então **todo teste que submete o formulário
// depende de um envio manual, feito uma vez**. Enquanto ele não existir, os
// testes pulam com o motivo escrito (ver `exigirDocumentoEnviado`), e nunca
// por timeout mudo.
//
// A suíte NÃO envia documento por conta própria, e isso é decisão: o bucket é
// o de produção e cada rodada deixaria um objeto novo lá, que é precisamente o
// órfão que a varredura da T-008 existe para caçar.
//
// O que NÃO depende do envio, e por isso roda desde já: as recusas da rota de
// upload por assinatura mágica (último `describe` deste arquivo). Elas
// acontecem no passo 4 da rota, ANTES do passo 7, então não escrevem byte
// nenhum no bucket.
//
// ---------------------------------------------------------------------------
// A INTERTRAVA, E ELA É A PARTE MAIS IMPORTANTE DESTE ARQUIVO
// ---------------------------------------------------------------------------
// ⚠️ Se a conta de teste estiver em `incomplete`, clicar em "Concluir
// cadastro" com dados VÁLIDOS dispara a RPC e QUEIMA A CONTA: ela nunca mais
// volta para `incomplete` sem um `update` manual no banco, e este arquivo
// nunca mais passa. Um teste que só passa na primeira execução é pior que
// nenhum teste.
//
// Por isso NENHUM teste daqui clica no botão de submit sem antes conferir que
// o formulário está em modo "revisão" — que é o modo que o
// `app/app/veterinario/onboarding/page.tsx` monta quando o status é
// `pending_validation`. Se não estiver, o teste PULA, dizendo por quê.

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

// ---------------------------------------------------------------------------
// HELPERS DO FORMULÁRIO
// ---------------------------------------------------------------------------

function passo(page: Page, n: number) {
  return page.getByText(new RegExp(`Passo ${n} de 4`));
}

/** Em qual passo o formulário está agora, lido da própria tela. */
async function passoAtual(page: Page): Promise<number> {
  const texto = await page.getByText(/Passo \d de 4/).innerText();
  const achado = texto.match(/Passo (\d) de 4/);
  if (!achado) throw new Error(`nao consegui ler o passo atual em "${texto}"`);
  return Number(achado[1]);
}

/**
 * Avança um passo por vez, e só clica enquanto ainda estiver no passo de
 * origem.
 *
 * ⚠️ O `toPass` não é frescura: o formulário é Client Component e o clique
 * que chega antes da hidratação não faz nada — o React ainda não plugou o
 * `onClick`. Sem retry, isso vira teste que falha um dia por semana e ninguém
 * consegue reproduzir. Esperar ESTADO (o passo mudou), nunca relógio.
 */
async function avancar(page: Page, de: number) {
  await expect(async () => {
    if (await passo(page, de).isVisible()) {
      const botao = page.getByRole("button", { name: /^continuar$/i });
      await expect(
        botao,
        "o botao Continuar esta desabilitado: no passo 2 isso significa que nenhuma forma de atendimento esta marcada no cadastro gravado"
      ).toBeEnabled();
      await botao.click();
    }
    await expect(passo(page, de + 1)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 25_000 });
}

/** Avança do passo em que a tela ESTÁ até o alvo. Ler o passo atual em vez de
 *  supor que ele é 1 é o que deixa `salvar()` ser chamado de qualquer lugar. */
async function irParaPasso(page: Page, alvo: number) {
  let atual = await passoAtual(page);
  while (atual < alvo) {
    await avancar(page, atual);
    atual += 1;
  }
}

async function voltarParaPasso(page: Page, alvo: number) {
  let atual = await passoAtual(page);
  while (atual > alvo) {
    await page.getByRole("button", { name: /^voltar$/i }).click();
    await expect(passo(page, atual - 1)).toBeVisible();
    atual -= 1;
  }
}

/**
 * Abre o onboarding já hidratado e no passo 1.
 *
 * A ida ao passo 2 e a volta existem por um motivo só: quando o passo muda, o
 * React provou que está vivo. Depois disso, qualquer clique do teste é clique
 * de verdade.
 */
async function abrirOnboarding(page: Page) {
  await page.goto(ROTA_ONBOARDING);
  await expect(page).toHaveURL(rotaExata(ROTA_ONBOARDING));
  await expect(passo(page, 1)).toBeVisible();
  await avancar(page, 1);
  await voltarParaPasso(page, 1);
}

/**
 * A INTERTRAVA. Só passa adiante se o formulário estiver em modo "revisão".
 *
 * O sinal é o h1 da barra lateral, que o `page.tsx` escolhe a partir do
 * `status`. Em modo "novo" (conta `incomplete`), submeter dados válidos chama
 * a RPC que só roda uma vez.
 */
async function exigirModoRevisao(page: Page) {
  const emRevisao = await page
    .getByRole("heading", { level: 1, name: /está em valida/i })
    .isVisible();

  test.skip(
    !emRevisao,
    "a conta de teste NAO esta em pending_validation: o onboarding abriu em modo 'novo'. " +
      "Submeter aqui chamaria concluir_onboarding_profissional(), que so roda uma vez, e QUEIMARIA a conta de teste. " +
      "A prova de persistencia NAO rodou. Devolva a conta para pending_validation para reativar esta cobertura."
  );
}

/**
 * A SEGUNDA TRAVA, que a T-008 criou: sem documento no bucket, o botão do
 * passo 4 nasce DESABILITADO.
 *
 * ⚠️ Por que isto é um `skip` e não uma falha: a conta de teste nunca enviou
 * documento (o bucket está vazio desde que foi criado), e fazer o teste enviar
 * um a cada rodada deixaria um objeto novo no bucket de PRODUÇÃO por execução
 * — virando exatamente o lixo que a varredura de órfãos da T-008 existe para
 * caçar. A suíte não pode ser fábrica de ruído.
 *
 * ⚠️ Por que também não é um `click()` seco: `click()` num botão desabilitado
 * espera 30s e falha com "element is not enabled", que não diz NADA sobre
 * documento. Timeout mudo é o pior relatório possível.
 *
 * Antes de pular, ela cobra uma coisa da tela, e essa asserção roda mesmo no
 * caminho de skip: **botão desabilitado tem que dizer por quê.** Botão morto
 * sem explicação é usuário clicando de novo e achando que o produto travou.
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

  test.skip(
    desabilitado,
    "a conta de teste vet ainda NAO tem documento enviado, entao a T-008 mantem 'Salvar alteracoes' desabilitado e a prova de persistencia NAO rodou. " +
      "Destrave uma vez, a mao, com a conta de teste: abrir /app/veterinario/onboarding, passo 4, enviar um PDF ou JPG qualquer de 1 pagina. " +
      "Depois disso vale para sempre, e nenhuma rodada da suite escreve objeto no bucket."
  );
}

/** Clica em salvar no passo 4, conferindo as duas travas antes. */
async function salvar(page: Page) {
  // A trava do modo revisão (não queimar a conta) é conferida por
  // `exigirModoRevisao` no começo de cada teste; a do documento é aqui, porque
  // ela só é visível no passo 4.
  await exigirDocumentoEnviado(page);
  await page.getByRole("button", { name: /^salvar alterações$/i }).click();
}

async function lerBairro(page: Page): Promise<string> {
  await abrirOnboarding(page);
  await irParaPasso(page, 2);
  return page.locator("#bairro").inputValue();
}

/** Escreve um valor em `bairro` e salva, esperando o redirect do servidor. */
async function salvarBairro(page: Page, valor: string) {
  await abrirOnboarding(page);
  await exigirModoRevisao(page);
  await irParaPasso(page, 2);
  await page.locator("#bairro").fill(valor);
  await salvar(page);

  // O passo 6 da Action relê `profiles.status` e despacha. Para quem está na
  // fila, o destino é `/aguardando` — e isso é, de quebra, a prova de que a
  // Action não manda para o painel quem ainda não foi aprovado (R-050).
  await expect(page).toHaveURL(rotaExata(DESTINO_VET.pending_validation), {
    timeout: 30_000,
  });
}

// ---------------------------------------------------------------------------
// OS TESTES
// ---------------------------------------------------------------------------

test.describe("persistencia do onboarding do veterinario (R-033)", () => {
  test.skip(credencial === null, SEM_CREDENCIAL);

  let sessao: Cookie[] = [];

  test.beforeAll(async ({ browser }) => {
    if (!credencial) return;
    // Ver a nota igual em `portao-status.spec.ts`: o hook herda o timeout de
    // 30s do config e precisa de folga para o login real.
    test.setTimeout(120_000);
    sessao = await capturarSessao(browser, credencial);
  });

  test.beforeEach(async ({ page }) => {
    await aplicarSessao(page, sessao);
  });

  test("o formulario abre com o que o servidor gravou, e nao vazio", async ({
    page,
  }) => {
    // Zero escrita. Este é o teste que prova o lado da LEITURA: a linha que a
    // T-006 gravou em 31/08 continua no banco e continua voltando para a tela.
    // Antes da T-006 este formulário era uma porta de mão única: abria vazio,
    // e quem voltasse para corrigir salvava vazio por cima do resto.
    await abrirOnboarding(page);
    await exigirModoRevisao(page);

    // ⚠️ Nenhum valor esperado está escrito aqui, e não é descuido: o conteúdo
    // da conta de teste é dado de uma pessoa e não entra em arquivo versionado.
    // O que se afirma é a FORMA.
    await expect(page.locator("#nome")).not.toHaveValue("");
    await expect(page.locator("#crmv")).not.toHaveValue("");
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
    // R-041 / SEC-062: o WhatsApp é gravado NORMALIZADO, só dígitos, DDD +
    // número, sem o código do país. É esse contrato que a rota de contato da
    // F4 vai consumir para montar o `wa.me`. Se um dia voltar `(63) 9...`
    // daqui, a normalização caiu e a base começou a guardar três formatos para
    // o mesmo número.
    expect(
      await page.locator("#wpp").inputValue(),
      "o whatsapp gravado nao esta normalizado em digitos"
    ).toMatch(/^(\d{10,11})?$/);
  });

  test("o que foi salvo continua la depois de sair e voltar", async ({
    page,
  }) => {
    // ⚠️ ESTE É O TESTE QUE FECHA O R-033. Ele escreve de verdade, no banco de
    // verdade, e lê de volta numa visita nova.
    //
    // O campo escolhido é `bairro`, e a escolha tem três razões:
    //   · é opcional e livre, então nenhum valor quebra validação
    //   · NÃO está entre os campos que `revalidar_ao_mudar_dado_sensivel()`
    //     vigia (CRMV, UF, nome de exibição): escrever nele não mexe no status
    //     de ninguém
    //   · a conta está em `pending_validation` e não aparece em busca nenhuma,
    //     então o valor não chega a olho de usuário em momento nenhum
    //
    // O valor original é restaurado no fim, inclusive quando a asserção falha.
    test.setTimeout(180_000);

    // ⚠️ PRÉ-VOO, e ele vem ANTES de qualquer escrita, de propósito.
    // As duas travas (modo revisão e documento enviado) pulam o teste. Se elas
    // fossem conferidas lá dentro do `salvarBairro`, o `skip` dispararia no
    // meio do try/finally e a limpeza tentaria rodar em cima de um teste que
    // nem começou.
    await abrirOnboarding(page);
    await exigirModoRevisao(page);
    await exigirDocumentoEnviado(page);

    const original = await lerBairro(page);
    const marcador = `QA E2E ${Date.now()}`;

    // ⚠️ A bandeira sobe ANTES da escrita, não depois. Se o `salvarBairro`
    // estourar no meio, a gravação pode ter acontecido mesmo assim (o redirect
    // é o último passo da Action). Limpar à toa é barato; deixar sujeira na
    // conta de teste, não.
    let escreveu = false;
    try {
      escreveu = true;
      await salvarBairro(page, marcador);

      // Sair e voltar de verdade: navegação nova, Server Component novo,
      // `select` novo no Postgres. Não é estado de React sobrevivendo.
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

  test("validacao do servidor recusa e NAO grava nada", async ({ page }) => {
    // O par que importa: a Action recusa E não deixa rastro. As validações
    // rodam ANTES dos dois upserts (`actions.ts`), então uma recusa tem que
    // ser totalmente estéril. Se um dia alguém mover uma validação para
    // depois da primeira escrita, este teste é quem conta.
    test.setTimeout(120_000);

    await abrirOnboarding(page);
    await exigirModoRevisao(page);

    await irParaPasso(page, 2);
    const cidadeOriginal = await page.locator("#cidade").inputValue();
    await page.locator("#cidade").fill("Cidade que nao deve ser gravada");

    await irParaPasso(page, 3);
    await page.locator("#wpp").fill("nao e um telefone");

    await salvar(page);

    // A mensagem aparece para o usuário, com todas as letras, e o formulário
    // continua na tela com o que foi digitado (nada é perdido).
    await expect(alertaDeErro(page)).toContainText(/whatsapp/i);
    await expect(page).toHaveURL(rotaExata(ROTA_ONBOARDING));

    // E a prova do "não gravou": a cidade alterada NÃO chegou ao banco.
    await abrirOnboarding(page);
    await irParaPasso(page, 2);
    await expect(
      page.locator("#cidade"),
      "a recusa do servidor gravou parte do formulario antes de recusar"
    ).toHaveValue(cidadeOriginal);
  });

  test("o servidor recusa 0800 como whatsapp, com motivo legivel", async ({
    page,
  }) => {
    await abrirOnboarding(page);
    await exigirModoRevisao(page);
    await irParaPasso(page, 3);
    await page.locator("#wpp").fill("0800 123 4567");
    await salvar(page);

    // A mensagem explica o PORQUÊ, e não só que recusou. 0800 não recebe
    // mensagem no WhatsApp, e o número seria um lead entregue a lugar nenhum.
    await expect(alertaDeErro(page)).toContainText(/0800/);
    await expect(page).toHaveURL(rotaExata(ROTA_ONBOARDING));
  });

  test("o servidor recusa cadastro sem cidade", async ({ page }) => {
    // `cidade` é faceta da busca da F4/S6. Perfil aprovado sem cidade é perfil
    // que nenhum filtro encontra: o profissional paga e não aparece.
    await abrirOnboarding(page);
    await exigirModoRevisao(page);
    await irParaPasso(page, 2);
    await page.locator("#cidade").fill("   ");
    await salvar(page);

    await expect(alertaDeErro(page)).toContainText(/informe a cidade/i);
    await expect(page).toHaveURL(rotaExata(ROTA_ONBOARDING));
  });

  test("o servidor recusa mais especialidades do que a tela promete", async ({
    page,
  }) => {
    // ⚠️ A tela promete "1 principal e até 3 secundárias" e NÃO impede marcar
    // mais: `toggleEsp` não tem teto. Quem for consertar isso no cliente:
    // a regra que vale continua sendo a do servidor (SEC-058), e este teste
    // continua valendo, porque o payload da Action é alcançável sem a tela.
    await abrirOnboarding(page);
    await exigirModoRevisao(page);

    // Alternar as 12 deixa `12 - n` marcadas, e `n` é no máximo 4 (o servidor
    // nunca deixou gravar mais). Logo sobram pelo menos 8, que é mais que o
    // teto, sem o teste precisar saber o que já estava marcado.
    for (const esp of ESPECIALIDADES_EM_TELA) {
      await page
        .getByRole("button", { name: new RegExp(`^${esp}`) })
        .first()
        .click();
    }

    await salvar(page);
    await expect(alertaDeErro(page)).toContainText(
      /no máximo 4 especialidades/i
    );
    await expect(page).toHaveURL(rotaExata(ROTA_ONBOARDING));
  });

  // -------------------------------------------------------------------------
  // T-008 — A ROTA DE UPLOAD RECUSA PELO QUE O ARQUIVO É, NÃO PELO QUE ELE DIZ
  // -------------------------------------------------------------------------
  // ⚠️ ESTES TESTES NÃO ESCREVEM NADA, e isso é a razão de existirem aqui.
  // A detecção de tipo é o passo 4 de `app/api/documentos/upload/route.ts`, e
  // o objeto só vai para o bucket no passo 7. Recusa no passo 4 = nenhum byte
  // no Storage, nenhuma linha em `perfil_privado`, nada para varrer depois.
  //
  // Vão por `page.request`, que usa o mesmo pote de cookies do contexto, e não
  // pela tela: o `<input type=file>` só aceita o que estiver no `accept`, e o
  // que precisa ser provado é justamente o caminho de quem NÃO passa por tela.
  // A rota está fora do `matcher` do `middleware.ts` (SEC-079): um POST direto
  // aqui não tem portão nenhum na frente, e é assim que ela seria atacada.
  test.describe("a rota de upload recusa pela assinatura magica", () => {
    test("txt renomeado para .pdf e recusado, e nada sobe", async ({ page }) => {
      // O caso clássico: extensão e `content-type` dizem PDF, os bytes dizem
      // texto. Quem manda são os bytes.
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
      // Erro honesto: diz o que aceita, em português, sem vazar nada técnico.
      expect(corpo.erro).toMatch(/formato não aceito/i);
      expect(corpo.erro).toMatch(/PDF, JPG, PNG ou WEBP/i);
    });

    test("svg e recusado mesmo se disser que e pdf (R-004)", async ({
      page,
    }) => {
      // ⚠️ Este é o que mais importa dos dois. `dangerouslyAllowSVG` está
      // ligado no `next.config.ts` (DL-040, necessário para a logo), e quem
      // abre o documento enviado é o ADMIN, dentro do painel de maior
      // privilégio do sistema. SVG é documento executável: um `<script>` dentro
      // dele roda na sessão de quem abre.
      //
      // O nome e o `content-type` mentem de propósito, os dois ao mesmo tempo:
      // o que se prova é que nenhum dos dois é consultado.
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
