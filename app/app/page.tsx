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
    if (profile.role === "tutor") redirect("/app/responsavel/onboarding");
    if (profile.role === "vet") redirect("/app/veterinario/onboarding");
    if (profile.role === "clinic") redirect("/app/estabelecimento/onboarding");
  }

  // ✅ Usuário já onboarded
  if (profile.role === "tutor") redirect("/app/responsavel");
  if (profile.role === "vet") redirect("/app/veterinario");
  if (profile.role === "clinic") redirect("/app/estabelecimento");
  if (profile.role === "admin") redirect("/admin");

  redirect("/login");
}
