import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import LogoutButton from "../LogoutButton";

export default async function TutorHome() {
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

  // Se quiser forçar onboarding também por aqui:
  if (!profile.onboarding_completed) redirect("/app/tutor/onboarding");

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Painel do Tutor</h1>
      <p>Em breve: busca, favoritos, histórico, perfil.</p>

      <div style={{ marginTop: 16 }}>
        <LogoutButton />
      </div>
    </div>
  );
}
