import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import LogoutButton from "../../LogoutButton";
import TutorOnboardingForm from "./TutorOnboardingForm";
import { completeOnboarding } from "./actions";

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
  if (profile.onboarding_completed) redirect("/app/responsavel");

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-titulo mb-2 tracking-tight">
        Vamos conhecer seu animal
      </h1>
      <p className="text-corpo-texto text-base mb-8 max-w-xl">
        Esses dados ajudam a gente a recomendar veterinários e estabelecimentos
        adequados pro seu companheiro.
      </p>

      <TutorOnboardingForm action={completeOnboarding} />

      <div className="mt-8">
        <LogoutButton />
      </div>
    </div>
  );
}
