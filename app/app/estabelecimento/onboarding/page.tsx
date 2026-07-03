import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import ClinicOnboardingForm from "./ClinicOnboardingForm";

export const metadata = {
  title: "Configurar cadastro do estabelecimento",
};

export default async function ClinicOnboardingPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "clinic") redirect("/app");
  if (profile.onboarding_completed) redirect("/app/estabelecimento");

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const displayName = (meta.full_name ?? meta.name ?? "").trim();

  // Server Action: só marca onboarding_completed (lógica preservada). Captura
  // real dos dados depende de clinic_profiles (migration 031). Logs DL-011.
  async function completeOnboarding() {
    "use server";

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) redirect("/login");

    console.log("[clinic/onboarding] complete:start", { userId: user.id });

    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id)
      .select();

    if (error) {
      console.error("[clinic/onboarding] complete:error", {
        message: error.message,
        code: error.code,
      });
      redirect("/app/estabelecimento/onboarding?error=1");
    }

    console.log("[clinic/onboarding] complete:done", { userId: user.id });
    redirect("/app/estabelecimento/aguardando");
  }

  return (
    <ClinicOnboardingForm initialName={displayName} action={completeOnboarding} />
  );
}
