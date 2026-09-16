import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  basePainel,
  destinoPorStatus,
  ehStatusDeBloqueio,
  type RoleProfissional,
  type StatusUsuario,
} from "@/lib/auth/status";

// Helper de auth dos painéis vet/estabelecimento.
//
// ⚠️ T-016 (R-038 / SEC-059) — ELE PASSOU A LER `profiles.status`.
// Antes esta função selecionava exatamente UMA coluna, `role`, e nenhuma das
// 8 páginas do painel lia `status`. A matriz §4 de `docs/06-PERMISSOES.md` diz
// que `incomplete` alcança só `/onboarding` e que `pending_validation` alcança
// só `/aguardando`, `/perfil` e `/configuracoes` — e que o resto é bloqueado
// **no servidor, não escondido no menu**. O que sustentava isso até hoje era o
// `redirect()` do fim da Server Action, que é sugestão de navegação, não guard:
// um vet em `pending_validation` digitava `/app/veterinario/contatos` na barra
// de endereço e a página renderizava, sem devtools e sem ferramenta nenhuma.
//
// `role` e `status` vêm no MESMO `select`: é a mesma linha, e duas idas ao
// banco por página seria pagar dobrado por metade da resposta.

type LinhaPerfil = {
  role: string;
  status: string;
};

type LinhaPerfilComMotivo = LinhaPerfil & {
  status_motivo: string | null;
};

function nomeDaSessao(metadata: unknown): string {
  const meta = (metadata ?? {}) as { full_name?: string; name?: string };
  return (meta.full_name ?? meta.name ?? "").trim();
}

/**
 * Garante sessão + role + **status** e devolve o usuário.
 *
 * @param statusPermitidos LISTA DE PERMITIDOS, nunca de negados (SEC-052).
 *   Use as constantes de `lib/auth/status.ts` — elas são a matriz §4, e são as
 *   mesmas que o `middleware.ts` aplica por prefixo de rota. Passar a lista
 *   explicitamente é de propósito: quem escrever a próxima página é obrigado a
 *   dizer quem entra nela, em vez de herdar um padrão que ninguém leu.
 */
export async function requirePainel(
  role: RoleProfissional,
  statusPermitidos: readonly StatusUsuario[]
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single<LinhaPerfil>();

  if (!profile || profile.role !== role) redirect("/app");

  // O portão. `as readonly string[]` porque `profile.status` chega do banco
  // como string e o dia em que ele NÃO for um dos quatro valores conhecidos é
  // exatamente o dia em que esta comparação precisa falhar, e não passar.
  if (!(statusPermitidos as readonly string[]).includes(profile.status)) {
    redirect(destinoPorStatus(role, profile.status));
  }

  const name = nomeDaSessao(user.user_metadata);
  return {
    user,
    name,
    email: user.email ?? "",
    status: profile.status as StatusUsuario,
  };
}

/**
 * Guard da tela de bloqueio. É o inverso do `requirePainel`: em vez de uma
 * lista de permitidos, ela deixa passar quem NÃO tem outro destino legítimo.
 *
 * ⚠️ Por que não é `requirePainel(role, SO_SUSPENSO)`: `/bloqueado` é o
 * sumidouro do portão. Se um status futuro chegar aqui pelo `destinoPorStatus`
 * e for recusado por uma lista fixa, o redirect vira laço. Aqui a decisão é
 * tomada comparando o destino do usuário com esta própria página, que é a
 * única forma de a porta de saída não apontar para si mesma.
 *
 * Devolve `status_motivo`, que é dado real da linha do próprio usuário, lido
 * pela policy `profiles_select_own`. Sem isto a tela seria bloqueio sem motivo,
 * e o motivo é justamente o que a matriz §4 exige dela.
 */
export async function requireContaBloqueada(role: RoleProfissional) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, status_motivo")
    .eq("id", user.id)
    .single<LinhaPerfilComMotivo>();

  if (!profile || profile.role !== role) redirect("/app");

  if (!ehStatusDeBloqueio(profile.status)) {
    redirect(destinoPorStatus(role, profile.status));
  }

  return {
    user,
    name: nomeDaSessao(user.user_metadata),
    email: user.email ?? "",
    status: profile.status as StatusUsuario,
    motivo: profile.status_motivo?.trim() || null,
    base: basePainel(role),
  };
}
