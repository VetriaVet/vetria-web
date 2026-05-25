"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { Button } from "../../../components/ui/Button";
import { createClient } from "@/lib/supabase/browser";

// Funil HUMANO / consumidor — entrada direta do tutor (também alvo de `/cadastro`).
// Cadastro do tutor (TASK-004). signUp LIGADO (mesmo padrão do /login): cria a
// conta com role=tutor no metadata → o trigger handle_new_user grava o role
// (migration 0001). Email confirmation ON (DL-009): confirma o email antes de logar.

export default function CadastroTutorPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cidade, setCidade] = useState("");
  const [termos, setTermos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (senha.length < 8) {
      setMsg({ tipo: "erro", texto: "A senha precisa ter ao menos 8 caracteres." });
      return;
    }
    if (senha !== confirmar) {
      setMsg({ tipo: "erro", texto: "As senhas não conferem." });
      return;
    }
    if (!termos) {
      setMsg({ tipo: "erro", texto: "Você precisa aceitar os termos de uso." });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { full_name: nome, cidade, role: "tutor" },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) return setMsg({ tipo: "erro", texto: error.message });
    setMsg({
      tipo: "ok",
      texto:
        "Conta criada! Enviamos um email de confirmação. Confirme pra ativar e fazer login.",
    });
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <PublicHeader />

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[460px]">
          <div className="mb-6">
            <span className="text-4xl" aria-hidden="true">🐶</span>
            <h1 className="font-bold text-[26px] leading-tight tracking-tight text-titulo mt-3 mb-1">
              Criar conta de tutor
            </h1>
            <p className="text-[15px] text-corpo-texto">
              Pra encontrar profissionais e cuidar melhor do seu pet.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Seu nome" autoComplete="name" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
            </div>
            <div>
              <Label htmlFor="confirmar">Confirmar senha</Label>
              <Input id="confirmar" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required placeholder="Repita a senha" autoComplete="new-password" />
            </div>
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} required placeholder="Ex: Palmas, TO" />
            </div>

            <label className="flex items-start gap-2.5 text-[13px] text-corpo-texto cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={termos}
                onChange={(e) => setTermos(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-principal shrink-0"
              />
              <span>
                Aceito os <a href="#" className="text-blue-600 hover:underline">termos de uso</a> e a{" "}
                <a href="#" className="text-blue-600 hover:underline">política de privacidade</a>.
              </span>
            </label>

            <Button type="submit" loading={loading} className="mt-2">
              Criar conta
            </Button>

            {msg && (
              <p
                role={msg.tipo === "erro" ? "alert" : undefined}
                className={`text-sm font-medium ${msg.tipo === "erro" ? "text-red-600" : "text-principal"}`}
              >
                {msg.texto}
              </p>
            )}
          </form>

          <p className="text-center text-sm text-corpo-texto mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function PublicHeader() {
  return (
    <header className="flex items-center justify-between max-w-5xl mx-auto w-full px-6 py-5">
      <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
        <Image src="/vetria/logo-vetria-fundo-claro.svg" alt="Vetria" width={178} height={29} className="h-7 w-auto" />
      </Link>
      <div className="flex items-center gap-2">
        <span className="text-corpo-texto text-sm hidden sm:inline">Já tem conta?</span>
        <Link href="/login" className="text-principal font-medium text-sm hover:underline">
          Entrar →
        </Link>
      </div>
    </header>
  );
}
