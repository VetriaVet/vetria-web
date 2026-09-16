import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { destinoPorStatus } from "../../lib/auth/status";

// `/app` é o roteador: ninguém fica aqui, todo mundo é despachado.
//
// ⚠️ T-016 (R-040 / SEC-061 e R-050 / SEC-071) — ELE PASSOU A ROTEAR POR
// `profiles.status`, E NÃO POR `onboarding_completed`.
//
// O que estava errado: `concluir_onboarding_profissional()` escreve
// `status = 'pending_validation'` E `onboarding_completed = true` no MESMO
// `update` (`0002_nucleo.sql:753-755`). Como a linha 20 deste arquivo olhava
// só `onboarding_completed`, quem acabava de entrar na fila era despachado
// para o painel, como se estivesse aprovado. A rota `/aguardando` existia e
// ninguém chegava nela pelo caminho normal.
//
// E `onboarding_completed` não serve como sinal de autorização: a policy
// `profiles_update_own_safe_fields` pina `role`, `admin_level`, `admin_team`,
// `status` e `status_motivo` — e **não pina `onboarding_completed`**. O próprio
// dono escreve a coluna pelo PostgREST com o token da sessão dele. `status`,
// não: a §3 da matriz é explícita em que ele nunca é escrito pelo usuário.
// Rotear pelo que o usuário escreve é rotear pelo que o usuário quiser.
//
// O destino de cada status é `destinoPorStatus()`, a mesma tabela que o
// `middleware.ts` e o `requirePainel` aplicam. Se este arquivo divergisse
// deles, o usuário seria mandado para uma porta que o portão fecha na cara
// dele, e isso é laço de redirect.

export default async function AppHome() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, onboarding_completed")
    .eq("id", user.id)
    .single<{
      role: string;
      status: string;
      onboarding_completed: boolean | null;
    }>();

  if (!profile?.role) redirect("/login");

  // 🔁 Profissional: o status manda, e ele é escrito só pelo admin.
  if (profile.role === "vet" || profile.role === "clinic") {
    redirect(destinoPorStatus(profile.role, profile.status));
  }

  // 🔁 Responsável: a matriz §4 se chama "O portão de status (vet e
  // estabelecimento)" e não vale para ele — responsável nasce `active` e não
  // passa por validação nenhuma. Aqui `onboarding_completed` continua sendo o
  // sinal, e continua podendo, porque para o responsável ele é exatamente o
  // que diz ser: autodeclaração de tela, sem benefício atrás. Ninguém entra na
  // busca, ninguém alcança dado de terceiro e nenhum plano é liberado por ela.
  if (profile.role === "tutor") {
    if (!profile.onboarding_completed) redirect("/app/responsavel/onboarding");
    redirect("/app/responsavel");
  }

  // Admin (e master, que é `admin` + `admin_level`, DL-045) também nasce
  // `active` e não passa por validação.
  if (profile.role === "admin") redirect("/admin");

  redirect("/login");
}
