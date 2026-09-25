"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/browser";
import { CampoSenha } from "@/components/ui/CampoSenha";
import { validarSenha, SENHA_AJUDA, SENHA_PLACEHOLDER } from "@/lib/auth/senha";
import { traduzirErroAuth } from "@/lib/auth/erros";
import { mascararEmail } from "@/lib/auth/link-do-email";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";

// Definir nova senha (TASK-007b). O link do email passa por /auth/callback, que
// troca o code por uma sessão de recuperação e redireciona pra cá. Com a sessão
// ativa, updateUser({ password }) grava a nova senha. Sem sessão (link expirado
// ou aberto direto), mostra estado de link inválido.

export default function NovaSenhaPage() {
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // SEC-112 e SEC-120: a conta em que o link abriu, com o email inteiro. O link de recuperação
  // não fica preso ao navegador que o pediu; se alguém mandar o link da
  // própria conta, a pessoa vê aqui que não é a dela e sai.
  const [conta, setConta] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setValid(!!data.user);
      setConta(mascararEmail(data.user?.email));
      setChecking(false);
    });
  }, [supabase]);

  async function sair() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const faltaNaSenha = validarSenha(password);
    if (faltaNaSenha) return setMsg(faltaNaSenha);
    if (password !== confirm) {
      return setMsg("As senhas não coincidem.");
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setMsg(traduzirErroAuth(error));
    setDone(true);
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
          {checking ? (
            <p className="text-center text-[14px] text-corpo-texto">
              Validando o link...
            </p>
          ) : done ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-fundo-destaque text-principal flex items-center justify-center">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <h2 className="font-bold text-xl text-titulo mb-2">
                Senha alterada
              </h2>
              <p className="text-[14px] text-corpo-texto leading-relaxed mb-6">
                Sua nova senha está pronta. Você já pode acessar a Vetria.
              </p>
              <Link
                href="/app"
                className="inline-flex w-full items-center justify-center rounded-pill bg-principal text-white py-3.5 font-semibold text-[15px] hover:bg-principal-deep transition no-underline"
              >
                Ir para a Vetria
              </Link>
            </div>
          ) : !valid ? (
            <div className="text-center">
              <h1 className="font-bold text-[22px] leading-tight text-titulo mb-2">
                Link inválido ou expirado
              </h1>
              <p className="text-[14px] text-corpo-texto leading-relaxed mb-6">
                O link de recuperação expira por segurança. Solicite um novo pra
                criar sua senha.
              </p>
              <Link
                href="/recuperar-senha"
                className="inline-flex w-full items-center justify-center rounded-pill bg-principal text-white py-3.5 font-semibold text-[15px] hover:bg-principal-deep transition no-underline"
              >
                Solicitar novo link
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-bold text-[26px] leading-tight tracking-tight text-titulo mb-2">
                Criar nova senha
              </h1>
              <p className="text-[15px] text-corpo-texto leading-relaxed mb-8">
                {conta ? (
                  <>
                    Escolha uma senha nova para a conta{" "}
                    <strong
                      className="font-semibold text-titulo"
                      data-testid="conta-do-link"
                    >
                      {conta}
                    </strong>
                    .{" "}
                    <button
                      type="button"
                      onClick={sair}
                      className="font-semibold text-principal hover:underline cursor-pointer"
                    >
                      Não é a sua conta? Sair
                    </button>
                  </>
                ) : (
                  "Escolha uma senha nova para acessar a Vetria."
                )}
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="password">Nova senha</Label>
                  <CampoSenha
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder={SENHA_PLACEHOLDER}
                    ajuda={SENHA_AJUDA}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm">Confirmar nova senha</Label>
                  <CampoSenha
                    id="confirm"
                    name="confirm"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                  />
                </div>

                {msg && (
                  <p className="text-[13px] text-error" role="alert">
                    {msg}
                  </p>
                )}

                <Button type="submit" className="mt-2" loading={loading}>
                  Salvar nova senha
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-corpo-texto/60 mt-6">
          © Vetria 2026
        </p>
      </div>
    </main>
  );
}
