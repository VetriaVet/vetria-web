"use client";

import { useState } from "react";

export default function OnboardingClient() {
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function chooseRole(role: "tutor" | "vet" | "clinic") {
    setMsg(null);
    setLoading(role);

    try {
      const res = await fetch("/api/onboarding/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json.error ?? "Erro ao salvar role");
        setLoading(null);
        return;
      }

      window.location.href = "/app";
    } catch (e: any) {
      setMsg(e?.message ?? "Erro ao salvar role");
      setLoading(null);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Bem-vindo à Vetria</h1>
      <p style={{ marginTop: 6, opacity: 0.8 }}>
        Como você quer usar a Vetria?
      </p>

      <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <button
          onClick={() => chooseRole("tutor")}
          disabled={!!loading}
          style={btn}
        >
          {loading === "tutor" ? "Salvando..." : "Sou Tutor"}
        </button>

        <button
          onClick={() => chooseRole("vet")}
          disabled={!!loading}
          style={btn}
        >
          {loading === "vet" ? "Salvando..." : "Sou Veterinário"}
        </button>

        <button
          onClick={() => chooseRole("clinic")}
          disabled={!!loading}
          style={btn}
        >
          {loading === "clinic" ? "Salvando..." : "Sou Clínica"}
        </button>

        {msg && <p style={{ marginTop: 8, color: "#b00020" }}>{msg}</p>}
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ddd",
  fontWeight: 700,
  cursor: "pointer",
};
