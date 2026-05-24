"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { Button } from "../../../components/ui/Button";
import { createClient } from "@/lib/supabase/browser";

// Funil B2B / empresarial — acessado pelas landings de profissionais (não pelo fluxo do tutor).
// Cadastro da clínica (TASK-006). signUp LIGADO (padrão /login, role=clinic no
// metadata → trigger grava o role, migration 0001). Email confirmation ON (DL-009).
// Após confirmar e logar → /app/clinic/onboarding.

const FEATURES = [
  "Perfil da clínica na busca pública",
  "Equipe de veterinários vinculada",
  "Gestão centralizada de contatos",
];

export default function CadastroClinicaPage() {
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
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
    if (senha.length < 8) return setMsg({ tipo: "erro", texto: "A senha precisa ter ao menos 8 caracteres." });
    if (senha !== confirmar) return setMsg({ tipo: "erro", texto: "As senhas não conferem." });
    if (!termos) return setMsg({ tipo: "erro", texto: "Você precisa aceitar os termos de uso." });

    setLoading(true);
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { full_name: nomeFantasia, cnpj, cidade, role: "clinic" },
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) return setMsg({ tipo: "erro", texto: error.message });
    setMsg({
      tipo: "ok",
      texto:
        "Conta criada! Enviamos um email de confirmação — confirme pra ativar e fazer login.",
    });
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center justify-between max-w-5xl mx-auto w-full px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
          <Image src="/vetria/logo-square.png" alt="Vetria" width={32} height={32} className="rounded-md" />
          <span className="text-titulo font-bold text-xl">Vetria</span>
        </Link>
        <Link href="/login" className="text-principal font-medium text-sm hover:underline">
          Entrar →
        </Link>
      </header>

      <div className="flex-1 grid lg:grid-cols-2 max-w-5xl mx-auto w-full">
        <aside className="hidden lg:flex flex-col justify-center bg-principal text-white rounded-2xl m-6 p-10">
          <div className="text-4xl mb-6" aria-hidden="true">🏥</div>
          <h2 className="font-bold text-2xl leading-tight mb-6">
            Fortaleça a marca da sua clínica.
          </h2>
          <ul className="flex flex-col gap-4">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-[15px] text-white/90">
                <span className="w-6 h-6 rounded-full bg-fundo-destaque text-principal flex items-center justify-center shrink-0">
                  <CheckIcon />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-[420px]">
            <h1 className="font-bold text-[26px] leading-tight tracking-tight text-titulo mb-1">
              Criar conta de clínica
            </h1>
            <p className="text-[15px] text-corpo-texto mb-8">
              Depois você completa o cadastro institucional e validamos os dados.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="nomeFantasia">Nome da clínica</Label>
                <Input id="nomeFantasia" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} required placeholder="Nome fantasia" />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="contato@clinica.com.br" autoComplete="email" />
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
                <input type="checkbox" checked={termos} onChange={(e) => setTermos(e.target.checked)} className="mt-0.5 w-4 h-4 accent-principal shrink-0" />
                <span>
                  Aceito os <a href="#" className="text-blue-600 hover:underline">termos de uso</a> e a{" "}
                  <a href="#" className="text-blue-600 hover:underline">política de privacidade</a>.
                </span>
              </label>

              <Button type="submit" loading={loading} className="mt-2">
                Criar conta
              </Button>

              {msg && (
                <p role={msg.tipo === "erro" ? "alert" : undefined} className={`text-sm font-medium ${msg.tipo === "erro" ? "text-red-600" : "text-principal"}`}>
                  {msg.texto}
                </p>
              )}
            </form>

            <p className="text-center text-sm text-corpo-texto mt-6">
              Já tem conta?{" "}
              <Link href="/login" className="text-blue-600 font-medium hover:underline">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
