// Sessão compartilhada da suíte E2E — e por que ela é compartilhada.
//
// ⚠️ A conta de teste é UMA SÓ, criada à mão, e a suíte NÃO cria conta em
// produção (regra do card da T-003, "Não fazer"). Se cada teste fizesse o seu
// próprio `signInWithPassword`, uma rodada de 12 testes bateria 12 vezes no
// endpoint `/token` do Supabase com o mesmo email, mais os retries do CI. O
// limite de requisição do Supabase é por IP, e o IP do GitHub Actions é
// compartilhado com o mundo inteiro: quando ele estourar, a suíte vai ficar
// vermelha por 429 e alguém vai gastar meio dia procurando o bug que não
// existe.
//
// Então o login acontece UMA VEZ por arquivo de teste, num contexto
// descartável, e o que é reaproveitado são os COOKIES — não a página. Cada
// teste continua recebendo o `page` normal do Playwright, com contexto
// próprio e isolado; ele só nasce já com a sessão dentro. Os testes continuam
// independentes de ordem, que é a regra da casa.
//
// ⚠️ Nada aqui escreve credencial em arquivo. Ver `tests/apoio/credenciais.ts`.

import type { Browser, Cookie, Page } from "@playwright/test";
import type { Credencial } from "./credenciais";
import { conferirCookiesDoAlvo } from "./alvo";

// ⚠️ Espelha o `BASE_URL` de `playwright.config.ts`, e espelha de propósito:
// os helpers abaixo abrem uma página FORA das fixtures do Playwright (é o que
// permite logar uma vez só), e essa página não herda o `baseURL` do projeto.
// Se alguém mudar o padrão no config, mude aqui também.
export const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

// ---------------------------------------------------------------------------
// ROTAS — em português, sempre (DL-043)
// ---------------------------------------------------------------------------
// `profiles.role` é `vet` / `clinic` / `tutor`; a URL é `/app/veterinario` e
// `/app/estabelecimento`. Nunca `/app/vet`.

export const BASE_VET = "/app/veterinario";

/** Os quatro destinos legítimos de um profissional `vet`, um por status.
 *  É `destinoPorStatus()` de `lib/auth/status.ts` lido de fora do código. */
export const DESTINO_VET = {
  incomplete: `${BASE_VET}/onboarding`,
  pending_validation: `${BASE_VET}/aguardando`,
  active: BASE_VET,
  bloqueado: `${BASE_VET}/bloqueado`,
} as const;

/** Regex ancorada no fim, para `expect(page).toHaveURL()`.
 *  `/app/veterinario` não casa com `/app/veterinario/aguardando`, que é
 *  exatamente a distinção que o portão de status faz. */
export function rotaExata(rota: string): RegExp {
  return new RegExp(`${rota.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

// ---------------------------------------------------------------------------
// ⚠️ O ALERTA DE ERRO, E A ARMADILHA DO `getByRole("alert")`
// ---------------------------------------------------------------------------
// MEDIDO em 16/09/2026, contra o build de produção rodando local:
//
//   pagina de /login SEM erro  → getByRole("alert") resolve a 1 elemento
//   pagina de /login COM erro  → getByRole("alert") resolve a 2 elementos
//
// O elemento a mais não é do produto: é o `<div role="alert" aria-live=
// "assertive" id="__next-route-announcer__">` que o App Router do Next injeta
// em TODA página para anunciar mudança de rota a leitor de tela. Ele é vazio.
//
// Consequência prática, e ela não é teórica: `expect(page.getByRole("alert"))`
// estoura com "strict mode violation: resolved to 2 elements" assim que o erro
// de verdade aparece. Ou seja, o teste quebra EXATAMENTE no caso que ele foi
// escrito para cobrir, e passa despercebido enquanto ele estiver pulando por
// falta de credencial.
//
// A saída é filtrar por conteúdo: o anunciador de rota é vazio, o alerta do
// produto nunca é. Não usa o `id` do Next de propósito, que é detalhe interno
// e some numa versão futura sem aviso.
export function alertaDeErro(page: Page) {
  return page.getByRole("alert").filter({ hasText: /\S/ });
}

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------

/**
 * Faz login de verdade, pela tela de `/login`, e devolve os cookies da sessão.
 *
 * Login real e não injeção de token de propósito: o que interessa provar é o
 * cookie que o `@supabase/ssr` escreve e que o `middleware.ts` lê. Token
 * fabricado por teste prova o teste, não o produto.
 */
export async function capturarSessao(
  browser: Browser,
  credencial: Credencial,
  // Qual secret está sendo usado, só para a mensagem de erro. Desde 23/09 há
  // mais de uma conta de teste, e "E2E_VET_EMAIL" fixo mandaria quem lê o
  // relatório conferir o secret errado.
  rotulo = "E2E_VET_EMAIL"
): Promise<Cookie[]> {
  const contexto = await browser.newContext({ baseURL: BASE_URL });
  const page = await contexto.newPage();

  try {
    await page.goto(`${BASE_URL}/login`);
    await page.locator("#email").fill(credencial.email);
    await page.locator("#password").fill(credencial.senha);
    await page.getByRole("button", { name: /fazer login/i }).click();

    // `app/login/page.tsx` faz `window.location.href = "/app"` no sucesso, e
    // `/app` é só o roteador: ele redireciona no servidor. Espera-se ESTADO
    // (saiu do /login), nunca relógio.
    try {
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
        timeout: 30_000,
      });
    } catch {
      // ⚠️ Sem isto, secret com senha errada ou conta não confirmada vira um
      // timeout cru de 30s num hook, e quem abrir o relatório do CI não tem
      // como saber que o problema é a credencial. A tela já sabe o motivo: ela
      // está escrito no `<p role="alert">`. Leve o motivo junto.
      const alerta = await alertaDeErro(page)
        .innerText({ timeout: 3_000 })
        .catch(() => "");
      throw new Error(
        `capturarSessao: o login com ${rotulo} nao saiu de /login em 30s. ` +
          `Mensagem na tela: "${alerta.trim() || "(nenhuma)"}". ` +
          `Confira o secret: senha trocada, conta nao confirmada ou email errado.`
      );
    }

    const cookies = await contexto.cookies();
    // DL-064: com E2E_ALVO=teste, o cookie de sessao tem que ser do projeto
    // de teste. E a unica prova de para onde o SERVIDOR Next esta falando.
    conferirCookiesDoAlvo(cookies.map((c) => c.name));
    return cookies;
  } finally {
    // O `close()` pode estourar quando o hook que chamou isto já estourou por
    // timeout e o Playwright derrubou o browser. Engolir aqui é o certo: senão
    // o erro do fechamento esconde o erro de verdade.
    await contexto.close().catch(() => {});
  }
}

/** Planta a sessão capturada num contexto novo, antes do primeiro `goto`. */
export async function aplicarSessao(page: Page, cookies: Cookie[]) {
  if (cookies.length === 0) {
    throw new Error(
      "aplicarSessao: nenhum cookie de sessao foi capturado. O login falhou antes deste teste."
    );
  }
  await page.context().addCookies(cookies);
}

/**
 * Para onde `/app` despacha esta conta. É a leitura, de fora, de
 * `destinoPorStatus()`: o caminho devolvido diz o `status` da conta sem que o
 * teste precise tocar o banco. (Desde o DL-064 a suíte usa a
 * `SUPABASE_SERVICE_ROLE_KEY` do projeto de TESTE, e só dele, em
 * `servico.ts`; a de produção, nunca. Ler o status de fora continua sendo o
 * jeito que funciona nos dois alvos.)
 */
export async function destinoDeApp(page: Page): Promise<string> {
  await page.goto("/app");
  await page.waitForURL((url) => url.pathname !== "/app", { timeout: 30_000 });
  return new URL(page.url()).pathname;
}

/** O mesmo, num contexto descartável: serve pro `beforeAll` descobrir o estado
 *  da conta antes de decidir o que dá pra provar contra ela. */
export async function medirDestinoDeApp(
  browser: Browser,
  cookies: Cookie[]
): Promise<string> {
  const contexto = await browser.newContext({ baseURL: BASE_URL });
  try {
    await contexto.addCookies(cookies);
    const page = await contexto.newPage();
    return await destinoDeApp(page);
  } finally {
    await contexto.close().catch(() => {});
  }
}
