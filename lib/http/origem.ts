import "server-only";

// CSRF EM PROFUNDIDADE PARA AS ROTAS QUE MUDAM ESTADO (revisão de 04/11/2026).
//
// A primeira porta contra CSRF é o cookie de sessão `SameSite=Lax` do
// `@supabase/ssr`: um POST disparado de outro site não leva a sessão. Esta é
// a segunda, pelo cabeçalho `Sec-Fetch-Site`, que o NAVEGADOR escreve e que
// JavaScript de página nenhuma consegue forjar.
//
// Dois modos, e a diferença é só o que fazer quando o cabeçalho NÃO veio:
//
//   · "estrito" (o de `/api/contato`, R-057): sem `same-origin`, recusa.
//     Inclusive cliente que não é navegador (curl, script).
//
//   · "navegador": recusa todo pedido que o navegador marcou como vindo de
//     fora (`cross-site`, `same-site`, `none`). Quando o cabeçalho não veio,
//     confere o `Origin`, se houver, contra o `Host`. Pedido sem nenhum dos
//     dois não é de navegador e, portanto, não carrega a sessão de uma vítima:
//     é o caso em que CSRF não existe. É a política "Fetch Metadata" do OWASP.
//
// Por que as rotas de sessão estão no modo "navegador" e não no estrito: a
// suíte E2E chama essas rotas por `page.request`, que não escreve
// `Sec-Fetch-Site`, e parte desses testes está em arquivos de PRs abertas.
// Virar o modo para "estrito" é trocar uma palavra nas rotas, depois que os
// testes passarem a mandar o cabeçalho.

export type ModoDeOrigem = "estrito" | "navegador";

export function pedidoDoProprioSite(req: Request, modo: ModoDeOrigem): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site !== null) return site === "same-origin";
  if (modo === "estrito") return false;

  const origem = req.headers.get("origin");
  if (origem === null) return true;

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origem).host === host;
  } catch {
    return false;
  }
}

/** Corpo declarado como JSON. `application/json; charset=utf-8` também vale. */
export function corpoEhJson(req: Request): boolean {
  const tipo = (req.headers.get("content-type") ?? "").toLowerCase();
  return tipo.startsWith("application/json");
}
