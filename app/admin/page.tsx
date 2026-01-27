import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import AdminPanel from "./AdminPanel";

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

  if (error || !profile?.role) {
  redirect("/onboarding");
}

  const isMaster = profile.admin_level === "master";

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin • Vetria</h1>

      <p style={{ marginTop: 6 }}>
        level: <b>{profile.admin_level ?? "-"}</b> • team:{" "}
        <b>{profile.admin_team ?? "-"}</b>
      </p>

      {!isMaster && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #ddd",
            borderRadius: 10,
          }}
        >
          Você é <b>admin</b> (acesso limitado). Apenas <b>master</b> pode
          alterar permissões.
        </div>
      )}

      <hr style={{ margin: "16px 0" }} />

      {isMaster ? (
        <AdminPanel />
      ) : (
        <p style={{ opacity: 0.7 }}>
          Entre em contato com um administrador master para alterações de usuários.
        </p>
      )}
    </div>
  );
}
