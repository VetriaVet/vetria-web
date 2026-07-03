import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import VetOnboardingForm from "./VetOnboardingForm";

export const metadata = {
  title: "Configurar perfil profissional",
};

export default async function VetOnboardingPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "vet") redirect("/app");
  if (profile.onboarding_completed) redirect("/app/veterinario");

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const displayName = (meta.full_name ?? meta.name ?? "").trim();

  // Server Action: por enquanto só marca onboarding_completed (lógica
  // preservada da Sprint 1). A captura real dos dados do multi-step depende
  // de vet_profiles (migration 031 — TASK-031, vermelha). Logs DL-011.
  async function completeOnboarding() {
    "use server";

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) redirect("/login");

    console.log("[vet/onboarding] complete:start", { userId: user.id });

    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id)
      .select();

    if (error) {
      console.error("[vet/onboarding] complete:error", {
        message: error.message,
        code: error.code,
      });
      redirect("/app/veterinario/onboarding?error=1");
    }

    console.log("[vet/onboarding] complete:done", { userId: user.id });
    redirect("/app/veterinario/aguardando");
  }

  return <VetOnboardingForm initialName={displayName} action={completeOnboarding} />;
}
