"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/browser";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

// Recuperar senha (TASK-007b): chama resetPasswordForEmail e manda o link pra
// /auth/callback?next=/recuperar-senha/nova (a callback cria a sessão e leva à
// tela de nova senha). Mostra sucesso genérico SEM revelar se o email existe
// (boa prática anti-enumeração). A entrega depende do Resend com domínio.

export default function RecuperarSenhaPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    // Erro é só logado, não exibido — mostramos sucesso genérico de qualquer jeito.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/recuperar-senha/nova`,
    });
    if (error) console.error("[recuperar-senha] resetPasswordForEmail", error);
    setLoading(false);
    setEnviado(true);
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 justify-center w-full mb-10 no-underline"
        >
          <Image
            src="/vetria/logo-vetria-fundo-claro.svg"
            alt="Vetria"
            width={178}
            height={29}
            className="h-7 w-auto"
          />
        </Link>

        <div className="rounded-2xl border border-gray-200 p-8 sm:p-10">
          {!enviado ? (
            <>
              <h1 className="font-bold text-[26px] leading-tight tracking-tight text-titulo mb-2">
                Recuperar senha
              </h1>
              <p className="text-[15px] text-corpo-texto leading-relaxed mb-8">
                Digite seu email cadastrado e enviaremos um link pra você criar
                uma nova senha.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="seuemail@exemplo.com"
                  />
                </div>
                <Button type="submit" className="mt-2" loading={loading}>
                  Enviar link de recuperação
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-fundo-destaque text-principal flex items-center justify-center">
                <MailCheckIcon />
              </div>
              <h2 className="font-bold text-xl text-titulo mb-2">
                Email enviado
              </h2>
              <p className="text-[14px] text-corpo-texto leading-relaxed mb-6">
                Se esse email estiver cadastrado na Vetria, você vai receber um
                link pra criar uma nova senha em alguns minutos. Verifique a
                caixa de entrada e a pasta de spam.
              </p>
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-pill bg-principal text-white py-3.5 font-semibold text-[15px] hover:bg-[#142E33] transition no-underline"
              >
                Voltar pro login
              </Link>
            </div>
          )}

          {!enviado && (
            <p className="text-center text-sm text-corpo-texto mt-6">
              Lembrou a senha?{" "}
              <Link
                href="/login"
                className="text-blue-600 font-medium hover:underline"
              >
                Voltar pro login
              </Link>
            </p>
          )}
        </div>

        <p className="text-center text-xs text-corpo-texto/60 mt-6">
          © Vetria 2026
        </p>
      </div>
    </main>
  );
}

function MailCheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      <path d="m16 19 2 2 4-4" />
    </svg>
  );
}
