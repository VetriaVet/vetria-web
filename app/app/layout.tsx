import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../lib/supabase/server";
import AppHeaderNav from "./AppHeaderNav";

// Layout raiz de `/app` — escolhe o "chrome" por role (DL-032):
//   • tutor  → HEADER topo clean (lado humano, rápido — DL-026)
//   • vet/clínica → passthrough: a sidebar vem do route group `(painel)`
//     (e os onboardings, fora do grupo, têm chrome próprio). Aqui não
//     renderizamos header nem o container centralizado pra não brigar com
//     a sidebar shell.
// Nav do header (tutor): inclui APENAS rotas que já existem (nunca linka 404).
const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  tutor: [
    { href: "/app/tutor", label: "Início" },
    { href: "/app/tutor/perfil", label: "Perfil" },
    { href: "/app/tutor/historico", label: "Histórico" },
    { href: "/app/tutor/avaliacoes", label: "Avaliações" },
  ],
  admin: [{ href: "/admin", label: "Admin" }],
  master: [{ href: "/admin", label: "Admin" }],
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  let role: string | undefined;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? undefined;
  }

  // vet/clínica: o chrome é a sidebar do route group (painel) ou o próprio
  // onboarding. Layout raiz só repassa os filhos.
  if (role === "vet" || role === "clinic") {
    return <>{children}</>;
  }

  // tutor (e fallback defensivo): header topo + container centralizado.
  const navLinks = role ? NAV_BY_ROLE[role] ?? [] : [];
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-[980px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/app"
            className="inline-flex items-center gap-2.5 no-underline"
          >
            <Image
              src="/vetria/logo-vetria-fundo-claro.svg"
              alt="Vetria"
              width={178}
              height={29}
              className="h-7 w-auto"
              priority
            />
          </Link>

          <AppHeaderNav nav={navLinks} />
        </div>
      </header>

      <main className="max-w-[980px] mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
