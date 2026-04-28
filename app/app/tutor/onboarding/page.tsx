import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import LogoutButton from "../../LogoutButton";
import TutorOnboardingForm from "./TutorOnboardingForm";

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

  async function completeOnboarding(formData: FormData) {
    "use server";

    // TODO: persistir dados do pet (formData.get('petName'), petSpecies,
    //       petAge, petWeight, cidade) quando schema permitir — depende de
    //       migration futura criando tabela `pets` ou campo JSON em
    //       profiles. Por enquanto FormData chega aqui mas é ignorado;
    //       a action apenas marca onboarding_completed=true.
    void formData;

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) redirect("/login");

    await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    redirect("/app/tutor");
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-titulo mb-2 tracking-tight">
        Vamos conhecer seu pet
      </h1>
      <p className="text-corpo-texto text-base mb-8 max-w-xl">
        Esses dados ajudam a gente a recomendar veterinários e clínicas
        adequados pro seu companheiro.
      </p>

      <TutorOnboardingForm action={completeOnboarding} />

      <div className="mt-8">
        <LogoutButton />
      </div>
    </div>
  );
}
