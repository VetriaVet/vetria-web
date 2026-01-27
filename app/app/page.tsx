import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export default async function AppHome() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile?.role) redirect("/login");

  // 🔁 Onboarding obrigatório
  if (!profile.onboarding_completed) {
    if (profile.role === "tutor") redirect("/app/tutor/onboarding");
    if (profile.role === "vet") redirect("/app/vet/onboarding");
    if (profile.role === "clinic") redirect("/app/clinic/onboarding");
  }

  // ✅ Usuário já onboarded
  if (profile.role === "tutor") redirect("/app/tutor");
  if (profile.role === "vet") redirect("/app/vet");
  if (profile.role === "clinic") redirect("/app/clinic");
  if (profile.role === "admin") redirect("/admin");

  redirect("/login");
}
