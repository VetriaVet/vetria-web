"use client";

import { useState, useSyncExternalStore } from "react";

type Role = "tutor" | "vet" | "clinic";

// T-064: os nomes da tela são os nomes legais (responsável, veterinário,
// estabelecimento); o valor enviado é o role do banco (DL-043).
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
    desc: "Encontre veterinários e estabelecimentos perto de você e fale com eles pelo WhatsApp.",
  },
  {
    role: "vet",
    emoji: "🩺",
    title: "Sou veterinário",
    desc: "Crie seu perfil profissional e seja encontrado por responsáveis. Seu cadastro passa pela validação da equipe.",
  },
  {
    role: "clinic",
    emoji: "🏥",
    title: "Sou um estabelecimento veterinário",
    desc: "Cadastre seu estabelecimento e seja encontrado na sua região. O cadastro passa pela validação da equipe.",
  },
];

const FALHA = "Não foi possível salvar agora. Tente de novo em alguns instantes.";

// Verdadeiro só depois da hidratação (o mesmo recurso dos onboardings).
const semAssinatura = () => () => {};

export default function OnboardingClient() {
  const [loading, setLoading] = useState<Role | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const hidratado = useSyncExternalStore(semAssinatura, () => true, () => false);

  async function chooseRole(role: Role) {
    setMsg(null);
    setLoading(role);

    let res: Response;
    try {
      res = await fetch("/api/onboarding/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
    } catch {
      setMsg("Sem conexão com a internet. Confira e tente de novo.");
      setLoading(null);
      return;
    }

    const json = (await res.json().catch(() => ({}))) as { error?: unknown };

    // 409: o tipo já foi escolhido (outra aba, ou o segundo clique). Segue
    // para `/app` como no sucesso: ele sabe o destino certo.
    if (!res.ok && res.status !== 409) {
      setMsg(typeof json.error === "string" ? json.error : FALHA);
      setLoading(null);
      return;
    }

    // T-014: `assign()` em vez de `window.location.href = ...`. Navegação com
    // recarga completa: o tipo acabou de mudar no banco e o servidor precisa
    // reler antes de decidir o painel.
    window.location.assign("/app");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-16" data-hidratado={hidratado ? "sim" : "nao"}>
      <h1 className="text-3xl font-bold text-titulo mb-3 tracking-tight">
        Como você quer usar a Vetria?
      </h1>
      <p className="text-corpo-texto text-base mb-10 max-w-xl">
        Escolha o tipo da sua conta. Cada um tem um painel próprio. Essa escolha
        é feita uma vez só e não pode ser trocada depois.
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
                {isActive ? "Salvando..." : desc}
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
