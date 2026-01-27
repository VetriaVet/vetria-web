import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export default async function VetPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "vet") redirect("/app");

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Painel Veterinário • Vetria</h1>
      <p style={{ marginTop: 6, opacity: 0.8 }}>
        Status do perfil: <b>{profile.onboarding_completed ? "Completo" : "Incompleto"}</b>
      </p>

      <div style={{ marginTop: 16, border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        {!profile.onboarding_completed ? (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Complete seu perfil para aparecer na Vetria</h2>
            <p style={{ marginTop: 6, opacity: 0.85 }}>
              Leva menos de 3 minutos. Sem isso, seu perfil não fica visível.
            </p>
            <a
              href="/app/vet/onboarding"
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
          <>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Tudo certo ✅</h2>
            <p style={{ marginTop: 6, opacity: 0.85 }}>
              Próximo passo: ativar seu plano para receber demanda.
            </p>
            <a
              href="/app/vet/plan"
              style={{
                display: "inline-block",
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                textDecoration: "none",
              }}
            >
              Ver planos →
            </a>
          </>
        )}
      </div>
    </div>
  );
}