import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VetProfileForm from "./VetProfileForm";

export const metadata = {
  title: "Meu perfil",
};

export default async function VetPerfilPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "vet") redirect("/app");

  // Nome real (user_metadata) pra pré-preencher o "nome de exibição" (DL-019).
  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const displayName = (meta.full_name ?? meta.name ?? "").trim();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-2xl text-titulo">
          Meu perfil profissional
        </h1>
        <p className="text-[14px] text-corpo-texto mt-1 max-w-2xl">
          Tudo que aparece no seu perfil público pra tutores. Mantenha
          atualizado pra receber mais contatos.
        </p>
      </div>

      <VetProfileForm initialName={displayName} />
    </div>
  );
}
