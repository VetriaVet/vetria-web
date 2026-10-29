import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

// T-055: a moderação era a fila de avaliações e conteúdo reportado, e as duas
// coisas estão fora da entrega de 25/11 (docs/00-ESCOPO.md). Saiu do menu e
// do painel do admin. A rota fica, com o mesmo guard (matriz §2), e devolve
// para o painel. ⚠️ `redirect()` fora de try/catch (DL-016).

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

  redirect("/admin");
}
