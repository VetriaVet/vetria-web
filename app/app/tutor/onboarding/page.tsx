import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import LogoutButton from "../../LogoutButton";

export default async function TutorOnboardingPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "tutor") redirect("/app");
  if (profile.onboarding_completed) redirect("/app/tutor");

  async function completeOnboarding() {
    "use server";

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) redirect("/login");

    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    redirect("/app");
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Onboarding Tutor</h1>
      <p style={{ marginTop: 8, opacity: 0.85 }}>
        Placeholder. Depois colocamos nome, cidade e preferências.
      </p>

      <form action={completeOnboarding} style={{ marginTop: 16 }}>
        <button style={{ padding: "10px 12px", borderRadius: 10 }}>
          Concluir onboarding
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <LogoutButton />
      </div>
    </div>
  );
}
