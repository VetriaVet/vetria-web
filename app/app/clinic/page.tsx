import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export default async function ClinicPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "clinic") redirect("/app");

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Painel Clínica • Vetria</h1>

      <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        {!profile.onboarding_completed ? (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Complete o cadastro da clínica</h2>
            <a
              href="/app/clinic/onboarding"
              style={{
                display: "inline-block",
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                textDecoration: "none",
              }}
            >
              Iniciar onboarding →
            </a>
          </>
        ) : (
          <p>Onboarding completo ✅</p>
        )}
      </div>
    </div>
  );
}
