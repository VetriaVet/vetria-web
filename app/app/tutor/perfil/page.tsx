import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import TutorProfileForm from "./TutorProfileForm";

export const metadata = {
  title: "Meu perfil",
};

export default async function TutorPerfilPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "tutor") redirect("/app");

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const displayName = (meta.full_name ?? meta.name ?? "").trim();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-bold text-2xl text-titulo">Meu perfil</h1>
        <p className="text-[14px] text-corpo-texto mt-1">
          Suas informações e os pets da sua família.
        </p>
      </div>

      <TutorProfileForm initialName={displayName} email={user.email ?? ""} />
    </div>
  );
}
