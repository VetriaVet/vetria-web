import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import AdminEmptyScreen from "../AdminEmptyScreen";

export const metadata = { title: "Validações" };

export default async function AdminValidacoesPage() {
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

  // TODO: fila real de validação de CRMV/CNPJ (migration 029/031 + status)
  return (
    <AdminEmptyScreen
      title="Validações"
      heading="Nenhuma validação pendente"
      desc="Quando vets e clínicas enviarem seus documentos, as solicitações de validação de CRMV/CNPJ aparecem aqui pra aprovação."
    />
  );
}
