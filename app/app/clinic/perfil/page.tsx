import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import ClinicProfileForm from "./ClinicProfileForm";

export const metadata = {
  title: "Perfil da clínica",
};

export default async function ClinicPerfilPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "clinic") redirect("/app");

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const displayName = (meta.full_name ?? meta.name ?? "").trim();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-2xl text-titulo">Perfil da clínica</h1>
        <p className="text-[14px] text-corpo-texto mt-1 max-w-2xl">
          Tudo que aparece no perfil público da clínica pra tutores. Mantenha
          atualizado pra receber mais contatos.
        </p>
      </div>

      <ClinicProfileForm initialName={displayName} />
    </div>
  );
}
