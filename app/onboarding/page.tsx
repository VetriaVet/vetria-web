import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Se já tem role, não deixa voltar pro onboarding
  if (profile?.role) redirect("/app");

  return <OnboardingClient />;
}
