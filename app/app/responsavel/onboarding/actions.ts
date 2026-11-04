"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// A conclusão do onboarding do responsável. Saiu de dentro de `page.tsx`
// (revisão de 04/11/2026) porque Server Action é endpoint público: o fato de
// a PÁGINA ter conferido `role === 'tutor'` antes de renderizar não protege
// a ACTION, que pode ser chamada direto, por qualquer conta logada, com o id
// dela. Então a action confere sessão e role por conta própria.
//
// ⚠️ DL-016: nenhum `redirect()` aqui dentro está em try/catch.
// ⚠️ Log sem `details` nem `hint` (SEC-056): só `code`.

export async function completeOnboarding(formData: FormData): Promise<void> {
  // TODO: persistir dados do animal (formData.get('petName'), petSpecies,
  //       petAge, petWeight, cidade) quando o schema permitir. Por enquanto o
  //       FormData chega e é ignorado; a action só marca
  //       onboarding_completed=true.
  void formData;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: perfil, error: erroPerfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string | null }>();

  if (erroPerfil) {
    console.error("[completeOnboarding] leitura do perfil falhou", { code: erroPerfil.code });
    redirect("/app/responsavel/onboarding?error=update_failed");
  }

  // Rota em português, role em inglês (DL-043): este onboarding é do `tutor`.
  if (perfil?.role !== "tutor") {
    redirect("/app");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id)
    .eq("role", "tutor")
    .select("id");

  if (error) {
    console.error("[completeOnboarding] update error", { code: error.code });
    redirect("/app/responsavel/onboarding?error=update_failed");
  }

  if (!data || data.length === 0) {
    console.error("[completeOnboarding] update returned 0 rows", { userId: user.id });
    redirect("/app/responsavel/onboarding?error=no_rows_affected");
  }

  redirect("/app/responsavel");
}
