"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MailCheck } from "lucide-react";
import { Input } from "../../../components/ui/Input";
import { Label } from "../../../components/ui/Label";
import { Button } from "../../../components/ui/Button";
import { CampoSenha } from "../../../components/ui/CampoSenha";
import { validarSenha, SENHA_AJUDA, SENHA_PLACEHOLDER } from "@/lib/auth/senha";
import { traduzirErroAuth } from "@/lib/auth/erros";
import { createClient } from "@/lib/supabase/browser";

// Funil HUMANO / consumidor — entrada direta do tutor (também alvo de `/cadastro`).
// Cadastro do tutor (TASK-004). signUp LIGADO (mesmo padrão do /login): cria a
// conta com role=tutor no metadata → o trigger handle_new_user grava o role
// (migration 0001). Email confirmation ON (DL-009): confirma o email antes de logar.
//
// Deu certo → o formulário SAI e entra o estado de confirmação (mesma tela).
// Não redirecionamos pro /login: a conta nasce sem email confirmado, e o
// Supabase recusaria a senha recém-criada com "Email not confirmed".

// Tempo que o check do botão fica visível antes da troca de estado.
const PAUSA_DO_CHECK = 900;

export default function CadastroTutorPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [cidade, setCidade] = useState("");
  const [termos, setTermos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [criada, setCriada] = useState(false);
  const [confirmacao, setConfirmacao] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "erro" | "ok"; texto: string } | null>(null);

  const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const faltaNaSenha = validarSenha(senha);
    if (faltaNaSenha) {
      setMsg({ tipo: "erro", texto: faltaNaSenha });
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
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { full_name: nome, cidade, role: "tutor" },
        emailRedirectTo: `${siteUrl()}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) return setMsg({ tipo: "erro", texto: traduzirErroAuth(error) });
    setCriada(true);
    setTimeout(() => setConfirmacao(true), PAUSA_DO_CHECK);
  }

  async function handleReenviar() {
    setMsg(null);
    setReenviando(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
    });
    setReenviando(false);

    if (error) return setMsg({ tipo: "erro", texto: traduzirErroAuth(error) });
    setMsg({
      tipo: "ok",
      texto: "Enviamos de novo. Confira a caixa de entrada e o spam.",
    });
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <PublicHeader />

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[460px]">
          {confirmacao ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-fundo-destaque text-principal flex items-center justify-center">
                <MailCheck size={28} strokeWidth={2} aria-hidden="true" />
              </div>
              <h1 className="font-bold text-[26px] leading-tight tracking-tight text-titulo mb-3">
                Confirme seu email
              </h1>
              <p className="text-[14px] text-corpo-texto leading-relaxed">
                Enviamos um link de ativação para
              </p>
              <p className="text-[15px] font-semibold text-titulo break-all mb-4">
                {email}
              </p>
              <p className="text-[14px] text-corpo-texto leading-relaxed mb-6">
                Abra a mensagem e clique no link pra ativar sua conta. Se não
                estiver na caixa de entrada, olhe no spam.
              </p>

              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-pill bg-principal text-white py-3.5 font-semibold text-[15px] hover:bg-principal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2 transition no-underline"
              >
                Já confirmei, ir pro login
              </Link>

              <p className="text-sm text-corpo-texto mt-5">
                Não chegou?{" "}
                <button
                  type="button"
                  onClick={handleReenviar}
                  disabled={reenviando}
                  aria-busy={reenviando || undefined}
                  className="text-blue-600 font-medium hover:underline disabled:opacity-60 disabled:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 rounded-sm"
                >
                  {reenviando ? "Reenviando..." : "Reenviar email"}
                </button>
              </p>

              <MensagemReservada msg={msg} />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <span className="text-4xl" aria-hidden="true">🐶</span>
                <h1 className="font-bold text-[26px] leading-tight tracking-tight text-titulo mt-3 mb-1">
                  Criar conta de responsável
                </h1>
                <p className="text-[15px] text-corpo-texto">
                  Pra encontrar profissionais e cuidar melhor do seu animal.
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
                  <CampoSenha id="senha" value={senha} onChange={(e) => setSenha(e.target.value)} required placeholder={SENHA_PLACEHOLDER} autoComplete="new-password" ajuda={SENHA_AJUDA} />
                </div>
                <div>
                  <Label htmlFor="confirmar">Confirmar senha</Label>
                  <CampoSenha id="confirmar" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} required placeholder="Repita a senha" autoComplete="new-password" />
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

                <Button type="submit" loading={loading} success={criada} collapse className="mt-2">
                  Criar conta
                </Button>

                {/* Altura reservada: o botão encolhe pra disco e a mensagem
                    aparece logo abaixo. Sem a reserva, o layout pula duas vezes. */}
                <MensagemReservada msg={msg} />
              </form>

              <p className="text-center text-sm text-corpo-texto mt-6">
                Já tem conta?{" "}
                <Link href="/login" className="text-blue-600 font-medium hover:underline">
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function MensagemReservada({
  msg,
}: {
  msg: { tipo: "erro" | "ok"; texto: string } | null;
}) {
  return (
    <div className="min-h-[22px] mt-2">
      {msg && (
        <p
          role={msg.tipo === "erro" ? "alert" : "status"}
          className={`text-sm font-medium ${msg.tipo === "erro" ? "text-red-600" : "text-principal"}`}
        >
          {msg.texto}
        </p>
      )}
    </div>
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
