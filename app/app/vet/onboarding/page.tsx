import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export default async function VetOnboardingPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "vet") redirect("/app");

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Onboarding Vet • Vetria</h1>
      <p style={{ marginTop: 8, opacity: 0.85 }}>
        Placeholder do formulário. Próximo passo: salvar dados e marcar onboarding_completed.
      </p>
    </div>
  );
}
