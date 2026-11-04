import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// T-055: avaliações estão fora da entrega de 25/11 (docs/00-ESCOPO.md). A
// página prometia avaliar "depois de uma consulta marcada pela Vetria", e a
// Vetria não marca consulta. A rota fica para não quebrar link antigo: o
// mesmo guard de antes roda primeiro e quem passa volta para o painel.
//
// ⚠️ `redirect()` fora de try/catch (DL-016).

export default async function TutorAvaliacoesPage() {
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

  redirect("/app/responsavel");
}
