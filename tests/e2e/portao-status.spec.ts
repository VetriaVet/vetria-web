import { test, expect, type Cookie } from "@playwright/test";
import { credencialVet, SEM_CREDENCIAL } from "../apoio/credenciais";
import {
  BASE_VET,
  DESTINO_VET,
  aplicarSessao,
  capturarSessao,
  medirDestinoDeApp,
  rotaExata,
} from "../apoio/sessao";

// Camada 3 da suíte: O PORTÃO, MEDIDO DE FORA.
//
// Este arquivo é `docs/06-PERMISSOES.md` §2 e §4 conferidos contra o produto
// rodando, com sessão real e cookie real. Até hoje o portão de status (T-016,
// R-038) não tinha teste nenhum — e ele é o item 4 do DoD da F3, e leva o
// R-001 junto.
//
// ⚠️ SE ESTE ARQUIVO E A MATRIZ DIVERGIREM, O ARQUIVO ESTÁ ERRADO.
// A matriz só muda por decisão registrada em `docs/05-DECISOES.md`. Teste que
// grava o comportamento errado "porque é o que o código faz hoje" é pior que
// não ter teste: ele passa a defender o defeito.
//
// ⚠️ A conta de teste é a MESMA de `login.spec.ts`: uma conta `vet` criada à
// mão, reutilizada, em `pending_validation` desde 31/08. A suíte não cria
// conta em produção (card da T-003, "Não fazer") e **nada aqui escreve**: são
// só navegações. Por isso este arquivo pode rodar mil vezes sem queimar nada.
//
// ⚠️ Relação com `login.spec.ts`: lá o isolamento entre painéis é afirmado na
// forma fraca ("não fica em /app/estabelecimento"). Aqui ele é afirmado na
// forma forte: o destino EXATO. A forma forte pega o dia em que quem erra a
// porta for despachado para um lugar errado em vez de ser despachado para
// lugar nenhum.

const credencial = credencialVet();

// Nomes das rotas do painel do vet que a matriz §4 bloqueia para quem está na
// fila de validação. `""` é o dashboard.
const BLOQUEADAS_PARA_QUEM_ESPERA = [
  { rota: BASE_VET, nome: "dashboard" },
  { rota: `${BASE_VET}/contatos`, nome: "contatos" },
  { rota: `${BASE_VET}/plano`, nome: "plano" },
  { rota: `${BASE_VET}/agenda`, nome: "agenda" },
  { rota: `${BASE_VET}/avaliacoes`, nome: "avaliacoes" },
];

test.describe("portao de status e de role, contra a conta vet real", () => {
  // Pular é diferente de passar. Sem os secrets, estes testes aparecem como
  // "skipped" com o motivo escrito. Desde 16/09 o pré-voo do `ci.yml` recusa o
  // job quando eles faltam, então no CI isto não volta a acontecer em silêncio.
  test.skip(credencial === null, SEM_CREDENCIAL);

  let sessao: Cookie[] = [];

  // O caminho para onde `/app` despacha esta conta. É o status da conta lido
  // de fora, sem tocar o banco.
  let destino = "";

  test.beforeAll(async ({ browser }) => {
    if (!credencial) return;
    // O hook herda o `timeout: 30_000` do config, e ele faz duas navegações
    // reais contra o Supabase. Sem folga, o hook estoura ANTES da mensagem de
    // erro útil de `capturarSessao` e o relatório mostra só "hook timeout".
    test.setTimeout(120_000);
    sessao = await capturarSessao(browser, credencial);
    destino = await medirDestinoDeApp(browser, sessao);
  });

  test.beforeEach(async ({ page }) => {
    await aplicarSessao(page, sessao);
  });

  /**
   * As asserções da matriz §4 para `pending_validation` só fazem sentido
   * contra uma conta `pending_validation`. Se o admin aprovar a conta de
   * teste amanhã, o certo não é a suíte ficar vermelha (não há defeito
   * nenhum) nem ficar verde calada (aí some a cobertura, que é o R-053).
   *
   * O certo é PULAR DIZENDO O QUE FOI OBSERVADO. Quem ler o relatório vê o
   * destino medido e sabe exatamente o que precisa fazer para a cobertura
   * voltar: devolver a conta de teste para a fila.
   */
  function exigirContaNaFila() {
    test.skip(
      destino !== DESTINO_VET.pending_validation,
      `a conta de teste nao esta em pending_validation: /app despachou para "${destino}". ` +
        `A prova da matriz §4 para quem espera validacao NAO rodou. ` +
        `Devolva a conta de teste para a fila (status pending_validation) para reativar esta cobertura.`
    );
  }

  // -------------------------------------------------------------------------
  // O que vale para QUALQUER status — estes nunca pulam
  // -------------------------------------------------------------------------

  test("/app nunca renderiza: despacha para um destino legitimo do painel vet", async () => {
    // `/app` é o roteador (`app/app/page.tsx`) e ninguém fica nele. Os quatro
    // destinos abaixo são `destinoPorStatus()` inteiro: se um dia aparecer um
    // quinto caminho aqui, ou é status novo no enum sem decisão escrita, ou é
    // laço de redirect nascendo.
    expect(destino).not.toBe("/app");
    expect(Object.values(DESTINO_VET)).toContain(destino);
  });

  test("a conta vet nao entra no painel do estabelecimento nem no admin", async ({
    page,
  }) => {
    // Matriz §2: `/app/estabelecimento/**` é do `clinic` e de mais ninguém;
    // `/admin` é do `admin`. Isolamento de role aqui não é tema de segurança,
    // é o modelo de negócio: é a razão de existir de dois planos pagos.
    //
    // O destino esperado é o MESMO de `/app`, porque o middleware manda quem
    // erra a porta para `/app`, que sabe o lugar certo de cada persona.
    for (const rota of [
      "/app/estabelecimento",
      "/app/estabelecimento/onboarding",
      "/admin",
      "/admin/usuarios",
    ]) {
      await page.goto(rota);
      await expect(page, `rota ${rota}`).toHaveURL(rotaExata(destino));
    }
  });

  // -------------------------------------------------------------------------
  // A matriz §4 para `pending_validation` — o item 4 do DoD da F3
  // -------------------------------------------------------------------------

  test("quem espera validacao cai em /aguardando ao entrar em /app", async () => {
    exigirContaNaFila();
    expect(destino).toBe(DESTINO_VET.pending_validation);
  });

  test("/aguardando abre e diz que o cadastro esta em validacao", async ({
    page,
  }) => {
    exigirContaNaFila();
    await page.goto(`${BASE_VET}/aguardando`);
    await expect(page).toHaveURL(rotaExata(DESTINO_VET.pending_validation));

    // Não basta a URL parar aqui: a tela tem que ter renderizado. Uma cadeia
    // de redirect que termina num 500 também "para" na URL certa.
    await expect(
      page.getByText(/estamos validando seu cadastro/i)
    ).toBeVisible();
  });

  for (const { rota, nome } of BLOQUEADAS_PARA_QUEM_ESPERA) {
    test(`quem espera validacao nao alcanca ${nome} e volta para /aguardando`, async ({
      page,
    }) => {
      exigirContaNaFila();

      // ⚠️ O gesto que importa é este: a rota é DIGITADA, não clicada. O que
      // segurava isso antes da T-016 era o menu não mostrar o link, e menu não
      // é guard. A matriz é explícita: bloqueado **no servidor**, não escondido
      // no menu.
      await page.goto(rota);
      await expect(page).toHaveURL(rotaExata(DESTINO_VET.pending_validation));
    });
  }

  test("/perfil abre para quem espera validacao (excecao da matriz §4)", async ({
    page,
  }) => {
    exigirContaNaFila();

    // DL-046, com todas as letras: "enquanto espera, ele edita o perfil".
    // Esta é a promessa que faz a fila de validação ser tolerável, e ela é a
    // primeira coisa que some se alguém apertar o portão sem ler a matriz.
    await page.goto(`${BASE_VET}/perfil`);
    await expect(page).toHaveURL(rotaExata(`${BASE_VET}/perfil`));
  });

  test("/configuracoes abre para quem espera validacao", async ({ page }) => {
    exigirContaNaFila();
    await page.goto(`${BASE_VET}/configuracoes`);
    await expect(page).toHaveURL(rotaExata(`${BASE_VET}/configuracoes`));
  });

  test("/onboarding continua alcancavel para quem espera validacao", async ({
    page,
  }) => {
    exigirContaNaFila();

    // Matriz §4 + DL-046. Hoje o editor de `/perfil` é casca e este formulário
    // é a única superfície de edição que existe de verdade: fechar esta porta
    // prende na fila quem digitou o CRMV errado.
    await page.goto(`${BASE_VET}/onboarding`);
    await expect(page).toHaveURL(rotaExata(`${BASE_VET}/onboarding`));
  });

  test("/bloqueado devolve quem nao esta suspenso, e sem laco de redirect", async ({
    page,
  }) => {
    exigirContaNaFila();

    // `/bloqueado` é o sumidouro do portão: recebe `suspended` e qualquer
    // status que `destinoPorStatus()` não saiba classificar. Quem NÃO está
    // suspenso tem que sair de lá — e sair UMA vez, não ficar quicando.
    // Se este teste travar por timeout, o laço nasceu.
    await page.goto(`${BASE_VET}/bloqueado`);
    await expect(page).toHaveURL(rotaExata(DESTINO_VET.pending_validation));
  });

  test("/ajuda abre para quem espera validacao (DL-058)", async ({ page }) => {
    exigirContaNaFila();

    // ✅ O `fixme` SAIU EM 16/09/2026, e a ordem foi a certa.
    //
    // O `vetria-qa` escreveu este teste marcado como pendência porque a matriz
    // já dizia uma coisa (`docs/06-PERMISSOES.md` §4, DL-058: `/ajuda` alcança
    // `pending_validation`) e o código ainda dizia outra. Ele NÃO gravou o
    // comportamento de então, e essa foi a decisão certa: teste que afirma o
    // que o código faz hoje vira defensor do defeito amanhã.
    //
    // O código foi alinhado logo depois, nos três lugares que precisavam
    // concordar: `lib/auth/status.ts` (`ajuda: ESPERANDO_OU_ATIVO` no
    // `ALCANCE_POR_SEGMENTO`, que é o portão do middleware) e as duas páginas
    // `(painel)/ajuda/page.tsx`, que pediam `SO_ATIVO` no `requirePainel`.
    // Portão e página têm que dizer a mesma coisa, senão o middleware libera e
    // a página tranca.
    await page.goto(`${BASE_VET}/ajuda`);
    await expect(page).toHaveURL(rotaExata(`${BASE_VET}/ajuda`));
  });
});
