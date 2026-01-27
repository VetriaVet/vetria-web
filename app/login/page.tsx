"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/browser";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return setMsg(error.message);
    window.location.href = "/app";
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return setMsg(error.message);
    setMsg("Conta criada. Confirme o email e depois faça login.");
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Vetria • Login</h1>

      <form onSubmit={signIn} style={{ display: "grid", gap: 10, marginTop: 16 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, border: "1px solid #333", borderRadius: 8 }}
        />
        <input
          placeholder="senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, border: "1px solid #333", borderRadius: 8 }}
        />

        <button type="submit" style={{ padding: 10, borderRadius: 8 }}>
          Entrar
        </button>

        <button type="button" onClick={signUp} style={{ padding: 10, borderRadius: 8 }}>
          Criar conta
        </button>

        {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
      </form>
    </div>
  );
}