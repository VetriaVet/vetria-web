// O PONTO DE VERIFICAÇÃO DO TURNSTILE NO CLIQUE DE CONTATO (DL-071 D4, SEC-120 a).
//
// ⚠️ ESTADO EM 28/10/2026: PRONTO E DESLIGADO. A chave do Turnstile ainda não
// existe (o Elber cria na sessão A, T-031), e o widget na tela é da T-041.
// Enquanto `TURNSTILE_NO_CONTATO = false`, `conferirTurnstile` responde
// "desligado" sem chamar ninguém.
//
// ⚠️ A auditoria da 0006 (SEC-120) fez do Turnstile CRITÉRIO DE ACEITE para
// ligar o contato em produção. Isso não depende de disciplina: `lib/contato/
// porta.ts` só abre a rota com `CONTATO_PELO_SITE_ABERTO = true` SE esta
// constante também for `true`. Ligar uma sem a outra deixa a rota fechada.
//
// Como ligar (T-031 + T-041, nesta ordem):
//   1. o Elber cria o widget no painel da Cloudflare e põe a chave SECRETA em
//      `TURNSTILE_SECRET_KEY` na Vercel (🔴 .env, nunca com `NEXT_PUBLIC_`);
//   2. a T-041 desenha o widget invisível no botão e manda o token no corpo do
//      POST, no campo `turnstile`;
//   3. só então esta constante vira `true`, no mesmo commit que liga o botão.
//
// Falha FECHADA: ligado e sem chave, ou a Cloudflare sem responder, é recusa.
// Um captcha que deixa passar quando cai não é captcha.
//
// O IP do visitante NÃO é mandado para a Cloudflare (o `remoteip` é opcional):
// o projeto não trata IP (DL-047 alternativa c).
import "server-only";

export const TURNSTILE_NO_CONTATO = false;

const VERIFICAR = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TEMPO_MAXIMO_MS = 5_000;
/** Token do Turnstile tem até 2048 caracteres pela documentação da Cloudflare. */
const TOKEN_MAXIMO = 2_048;

export type ResultadoDoTurnstile = "desligado" | "ok" | "recusado" | "indisponivel";

export async function conferirTurnstile(token: unknown): Promise<ResultadoDoTurnstile> {
  if (!TURNSTILE_NO_CONTATO) return "desligado";

  if (typeof token !== "string" || token.length === 0 || token.length > TOKEN_MAXIMO) {
    return "recusado";
  }

  const segredo = process.env.TURNSTILE_SECRET_KEY;
  if (!segredo) {
    console.error("[contato/turnstile] TURNSTILE_SECRET_KEY ausente com o Turnstile ligado");
    return "indisponivel";
  }

  try {
    const corpo = new URLSearchParams({ secret: segredo, response: token });
    const r = await fetch(VERIFICAR, {
      method: "POST",
      body: corpo,
      signal: AbortSignal.timeout(TEMPO_MAXIMO_MS),
      cache: "no-store",
    });
    if (!r.ok) {
      console.error("[contato/turnstile] siteverify respondeu fora de 2xx", { status: r.status });
      return "indisponivel";
    }
    const dados = (await r.json()) as { success?: unknown };
    return dados.success === true ? "ok" : "recusado";
  } catch (e) {
    console.error("[contato/turnstile] siteverify sem resposta", {
      nome: e instanceof Error ? e.name : "desconhecido",
    });
    return "indisponivel";
  }
}
