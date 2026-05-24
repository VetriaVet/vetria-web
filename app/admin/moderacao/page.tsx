import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import AdminEmptyScreen from "../AdminEmptyScreen";

export const metadata = { title: "Moderação" };

export default async function AdminModeracaoPage() {
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

  // TODO: fila de conteudo reportado (avaliacoes = Sprint 5)
  return (
    <AdminEmptyScreen
      title="Moderação"
      heading="Nada pra moderar"
      desc="Avaliações e conteúdos reportados por usuários aparecem aqui pra revisão. Por enquanto, não há nada na fila."
    />
  );
}
