import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export default async function AppHome() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile?.role) {
    // fallback seguro: se der ruim, manda pro login (ou uma página de erro)
    redirect("/login");
  }

  switch (profile.role) {
    case "tutor":
      redirect("/app/tutor");
    case "vet":
      redirect("/app/vet");
    case "clinic":
      redirect("/app/clinic");
    case "admin":
      redirect("/admin");
    default:
      redirect("/login");
  }
}