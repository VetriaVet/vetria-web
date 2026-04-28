"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    if (isSignup) {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${siteUrl}/auth/callback` },
      });
      setLoading(false);
      if (error) return setMsg(error.message);
      setMsg("✅ Conta criada. Confirme o email e depois faça login.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return setMsg(error.message);
    window.location.href = "/app";
  }

  async function loginWithGoogle() {
    setMsg(null);
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) setMsg(error.message);
  }

  function toggleMode() {
    setMode(isSignup ? "login" : "signup");
    setMsg(null);
  }

  const isError = msg !== null && !msg.startsWith("✅");

  return (
    <main className="min-h-screen grid md:grid-cols-2 bg-white">
      <aside className="relative hidden md:block">
        <Image
          src="/vetria/vet-portrait.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
      </aside>

      <section className="flex flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-[420px] flex flex-col">
          <a
            href="/"
            className="inline-flex items-center gap-2.5 mb-12 no-underline"
          >
            <Image
              src="/vetria/logo-square.png"
              alt="Vetria"
              width={36}
              height={36}
              className="rounded-md"
            />
            <span className="font-extrabold text-[26px] uppercase tracking-[0.02em] leading-none text-principal">
              Vetria
            </span>
          </a>

          <h1 className="font-bold text-[28px] leading-tight tracking-tight text-titulo mb-2">
            {isSignup ? "Crie sua conta." : "É bom te ver de novo."}
          </h1>
          <p className="text-[15px] text-corpo-texto mb-8">
            {isSignup
              ? "Comece em segundos com email ou Google."
              : "Entre na sua conta ou crie uma nova."}
          </p>

          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full rounded-pill bg-titulo text-white py-3.5 px-6 inline-flex items-center justify-center gap-3 font-medium hover:bg-black/90 disabled:opacity-60 transition"
          >
            <GoogleIcon />
            {isSignup ? "Cadastrar com Google" : "Entrar com Google"}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-corpo-texto text-xs uppercase tracking-wider">
              ou com email
            </span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="text-titulo font-medium text-sm mb-1.5 block"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full rounded-pill bg-fundo-claro/40 border border-transparent px-5 py-3.5 text-[15px] text-titulo placeholder:text-corpo-texto/60 focus:bg-white focus:border-principal focus:ring-2 focus:ring-principal/20 focus:outline-none transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="text-titulo font-medium text-sm"
                >
                  Senha
                </label>
                {!isSignup && (
                  <a
                    href="#"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Esqueceu sua senha?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={
                    isSignup ? "new-password" : "current-password"
                  }
                  placeholder="Insira sua senha"
                  className="w-full rounded-pill bg-fundo-claro/40 border border-transparent px-5 py-3.5 pr-12 text-[15px] text-titulo placeholder:text-corpo-texto/60 focus:bg-white focus:border-principal focus:ring-2 focus:ring-principal/20 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-corpo-texto hover:text-titulo transition"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full rounded-pill bg-principal text-white py-3.5 font-semibold text-[15px] hover:bg-[#142E33] transition disabled:opacity-50 mt-2"
            >
              {loading
                ? isSignup
                  ? "Criando conta..."
                  : "Entrando..."
                : isSignup
                  ? "Criar conta"
                  : "Fazer login"}
            </button>

            {msg && (
              <p
                role={isError ? "alert" : undefined}
                className={`font-medium text-sm mt-1 ${
                  isError ? "text-red-600" : "text-principal"
                }`}
              >
                {msg}
              </p>
            )}
          </form>

          <p className="text-center text-sm text-corpo-texto mt-8">
            {isSignup ? "Já tem conta? " : "Ainda não tem conta? "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 font-medium hover:underline"
            >
              {isSignup ? "Faça login" : "Cadastre-se"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
