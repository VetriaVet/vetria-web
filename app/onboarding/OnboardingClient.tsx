"use client";

import { useState } from "react";

type Role = "tutor" | "vet" | "clinic";

const ROLES: Array<{
  role: Role;
  emoji: string;
  title: string;
  desc: string;
}> = [
  {
    role: "tutor",
    emoji: "🐶",
    title: "Sou responsável",
    desc: "Encontre profissionais perto de você, agende consultas e cuide melhor do seu animal.",
  },
  {
    role: "vet",
    emoji: "🩺",
    title: "Sou veterinário",
    desc: "Crie seu perfil profissional, seja encontrado por responsáveis e organize sua agenda.",
  },
  {
    role: "clinic",
    emoji: "🏥",
    title: "Sou um estabelecimento veterinário",
    desc: "Cadastre seu estabelecimento, gerencie sua equipe e fortaleça sua marca regional.",
  },
];

export default function OnboardingClient() {
  const [loading, setLoading] = useState<Role | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function chooseRole(role: Role) {
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
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-titulo mb-3 tracking-tight">
        Como você quer usar a Vetria?
      </h1>
      <p className="text-corpo-texto text-base mb-10 max-w-xl">
        Escolha seu perfil. Cada um tem um painel próprio com ferramentas
        específicas.
      </p>

      <div className="grid md:grid-cols-3 gap-4">
        {ROLES.map(({ role, emoji, title, desc }) => {
          const isActive = loading === role;
          const isDisabled = loading !== null && !isActive;

          return (
            <button
              key={role}
              type="button"
              onClick={() => chooseRole(role)}
              disabled={loading !== null}
              aria-busy={isActive}
              className={`rounded-2xl border-2 border-gray-200 bg-white p-8 text-left w-full transition-all hover:border-principal hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-principal/40 ${
                isDisabled
                  ? "opacity-50 cursor-not-allowed pointer-events-none"
                  : ""
              }`}
            >
              <span className="text-5xl mb-4 block" aria-hidden="true">
                {emoji}
              </span>
              <h2 className="text-titulo font-bold text-xl mb-2">{title}</h2>
              <p className="text-corpo-texto text-sm leading-relaxed">
                {isActive ? "Carregando..." : desc}
              </p>
            </button>
          );
        })}
      </div>

      {msg && (
        <p role="alert" className="text-red-600 font-medium text-sm mt-6">
          {msg}
        </p>
      )}
    </div>
  );
}
