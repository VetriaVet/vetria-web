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

  if (!profile || profile.role !== "admin" || profile.admin_level !== "master") redirect("/app");

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin • Vetria</h1>
      <p style={{ marginTop: 6 }}>
        level: <b>{profile.admin_level}</b> • team: <b>{profile.admin_team}</b>
      </p>

      <hr style={{ margin: "16px 0" }} />

      <AdminPanel />
    </div>
  );
}
