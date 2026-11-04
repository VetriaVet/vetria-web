// QUANDO A ROTA `POST /api/contato` PODE REGISTRAR UM CONTATO (T-040).
//
// Um lugar só para a pergunta "a porta do número está aberta neste servidor?".
// A rota consulta isto ANTES de criar cookie, ler sessão ou chamar o banco:
// fechada, ela não grava nada e responde `indisponivel`, que é a verdade.
//
// Abre em DOIS casos, e só nesses:
//
//   1. PRODUÇÃO: `CONTATO_PELO_SITE_ABERTO = true` (lib/perfil-publico/contato.ts)
//      E `TURNSTILE_NO_CONTATO = true` (lib/contato/turnstile.ts). É a SEC-120
//      (a) da auditoria da 0006 escrita em código: ligar o botão sem o captcha
//      conferido no servidor deixa a rota FECHADA, em vez de aberta para robô.
//
//   2. TESTE: `CONTATO_ABERTO_PARA_TESTE=1` no ambiente do servidor, e o
//      servidor NÃO está falando com o banco de produção. É o que deixa a suíte
//      E2E provar a rota contra o `vetria-e2e` antes de o botão existir. As
//      três travas, cada uma pega um engano diferente:
//        · a variável explícita (sem ela, nada abre);
//        · `VERCEL_ENV` diferente de `production` (deploy de produção nunca
//          entra em modo de teste, nem com a variável posta por engano);
//        · o projeto Supabase da URL não é o de produção. Local, o build lê o
//          `.env.local`, que aponta para produção: a variável sozinha não
//          abre a porta contra o banco de verdade. ⚠️ `NEXT_PUBLIC_*` é
//          EMBUTIDA no build: a URL conferida aqui é a mesma que o cliente de
//          serviço usa (`lib/supabase/admin.ts`), que é o que importa. Medido
//          em 28/10: build com a URL de produção + a variável ligada = porta
//          fechada, sem chamada ao banco.
//
// ⚠️ O ref de produção é o mesmo de `tests/apoio/alvo.ts`. Não é segredo
// (viaja no bundle, dentro de NEXT_PUBLIC_SUPABASE_URL). Se o projeto de
// produção mudar, mude nos dois lugares.
import "server-only";
import { CONTATO_PELO_SITE_ABERTO } from "@/lib/perfil-publico/contato";
import { TURNSTILE_NO_CONTATO } from "@/lib/contato/turnstile";

const REF_PRODUCAO = "gdqnnrozbxrtaaquarnd";

export type EstadoDaPorta =
  | { aberta: false }
  | { aberta: true; modo: "producao" | "teste"; exigeTurnstile: boolean };

function refDaUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const achado = new URL(url).hostname.match(/^([a-z0-9]{20})\.supabase\.co$/);
    return achado ? achado[1] : null;
  } catch {
    return null;
  }
}

function modoDeTesteLiberado(): boolean {
  if (process.env.CONTATO_ABERTO_PARA_TESTE !== "1") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  const ref = refDaUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  return ref !== null && ref !== REF_PRODUCAO;
}

export function estadoDaPorta(): EstadoDaPorta {
  if (CONTATO_PELO_SITE_ABERTO && TURNSTILE_NO_CONTATO) {
    return { aberta: true, modo: "producao", exigeTurnstile: true };
  }
  if (modoDeTesteLiberado()) {
    return { aberta: true, modo: "teste", exigeTurnstile: TURNSTILE_NO_CONTATO };
  }
  return { aberta: false };
}
