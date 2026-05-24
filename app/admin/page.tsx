import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import AdminPanel from "./AdminPanel";

export const metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, admin_level, admin_team")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/app");

  const isMaster = profile.admin_level === "master";

  return (
    <div>
      <header className="bg-[#0F1F22]/90 backdrop-blur border-b border-white/[0.06] px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="font-bold text-lg text-white">Dashboard administrativo</h1>
        <span className="text-[12px] text-white/50">
          level: <b className="text-white/80">{profile.admin_level ?? "-"}</b> · team:{" "}
          <b className="text-white/80">{profile.admin_team ?? "-"}</b>
        </span>
      </header>

      <div className="p-6 max-w-[1280px] mx-auto">
        {!isMaster && (
          <div className="rounded-md border border-white/[0.06] bg-[#1A2A2D] p-4 text-[13px] text-white/70 mb-5">
            Você é <b className="text-white">admin</b> (acesso limitado). Apenas{" "}
            <b className="text-white">master</b> pode alterar permissões de usuários.
          </div>
        )}

        {isMaster ? (
          <div className="rounded-md border border-white/[0.06] bg-[#1A2A2D] overflow-hidden">
            <div className="px-[18px] py-3.5 border-b border-white/[0.06]">
              <div className="font-bold text-sm text-white">Usuários & permissões</div>
              <div className="text-[12px] text-white/50">
                Gerencie role e nível de acesso dos usuários da plataforma.
              </div>
            </div>
            <AdminPanel />
          </div>
        ) : (
          <p className="text-white/60 text-sm">
            Entre em contato com um administrador master para alterações de usuários.
          </p>
        )}
      </div>
    </div>
  );
}
