import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import AdminPanel from "../AdminPanel";

export const metadata = {
  title: "Usuários",
};

// Gestão de usuários — ferramenta funcional de RBAC (AdminPanel), só pra master.
// Lógica preservada da Sprint 1 (TASK-021).
export default async function AdminUsuariosPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, admin_level")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/app");

  const isMaster = profile.admin_level === "master";

  return (
    <div>
      <header className="bg-[#0F1F22]/90 backdrop-blur border-b border-white/[0.06] px-6 py-4 sticky top-0 z-10">
        <h1 className="font-bold text-lg text-white">Usuários & permissões</h1>
      </header>

      <div className="p-6 max-w-[1280px] mx-auto">
        {isMaster ? (
          <div className="rounded-md border border-white/[0.06] bg-[#1A2A2D] overflow-hidden">
            <div className="px-[18px] py-3.5 border-b border-white/[0.06]">
              <div className="font-bold text-sm text-white">Todos os usuários</div>
              <div className="text-[12px] text-white/50">
                Gerencie role e nível de acesso dos usuários da plataforma.
              </div>
            </div>
            <AdminPanel />
          </div>
        ) : (
          <div className="rounded-md border border-white/[0.06] bg-[#1A2A2D] p-6 text-[13px] text-white/70">
            Você é <b className="text-white">admin</b> (acesso limitado). Apenas{" "}
            <b className="text-white">master</b> pode alterar permissões de usuários.
          </div>
        )}
      </div>
    </div>
  );
}
