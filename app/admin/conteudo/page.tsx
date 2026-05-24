import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import AdminEmptyScreen from "../AdminEmptyScreen";

export const metadata = { title: "Conteúdo" };

export default async function AdminConteudoPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") redirect("/app");

  // TODO: gestao de especialidades/textos/materiais (backend futuro)
  return (
    <AdminEmptyScreen
      title="Conteúdo"
      heading="Gestão de conteúdo em breve"
      desc="Especialidades, textos institucionais e materiais educativos da plataforma serão gerenciados por aqui."
    />
  );
}
