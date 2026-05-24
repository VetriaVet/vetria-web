import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Helper de auth dos painéis vet/clínica: garante sessão + role correto e
// devolve o user (com nome/email já resolvidos). Centraliza o guard repetido
// nas páginas de casca do route group (painel).
export async function requirePainel(role: "vet" | "clinic") {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== role) redirect("/app");

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const name = (meta.full_name ?? meta.name ?? "").trim();
  return { user, name, email: user.email ?? "" };
}
