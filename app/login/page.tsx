"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { AuthShell } from "@/components/ui/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) return setMsg(error.message);
    window.location.href = "/app";
  }

  async function signUp() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) return setMsg(error.message);
    setMsg("Conta criada. Confirme o email e depois faça login.");
  }

  async function loginWithGoogle() {
    setMsg(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });

    if (error) setMsg(error.message);
  }

  return (
    <AuthShell
      title="É bom te ver de novo..."
      subtitle="Entre com seu email ou continue com Google."
      footer={<>© Vetria 2026</>}
    >
      <form onSubmit={signIn} className="grid gap-4">
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          name="password"
          type="password"
          label="Senha"
          placeholder="Digite sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button type="submit" size="lg" block disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>

        <div className="flex items-center gap-3 text-xs text-corpo-texto my-1">
          <div className="flex-1 h-px bg-corpo-texto/15" />
          ou
          <div className="flex-1 h-px bg-corpo-texto/15" />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          block
          onClick={loginWithGoogle}
          disabled={loading}
        >
          Continuar com Google
        </Button>

        <Button
          type="button"
          variant="ghost"
          block
          onClick={signUp}
          disabled={loading}
        >
          Ainda não tem conta? Criar conta
        </Button>

        {msg && (
          <p className="text-sm text-center text-corpo-texto mt-1">{msg}</p>
        )}
      </form>
    </AuthShell>
  );
}
