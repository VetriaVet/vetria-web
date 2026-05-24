import Link from "next/link";
import Image from "next/image";
import { createClient } from "../../lib/supabase/server";
import AppHeaderNav from "./AppHeaderNav";

// Navegação contextual por role. Inclui APENAS rotas que já existem hoje
// (não linka 404). Telas internas (perfil/historico/avaliacoes/equipe/
// aguardando) entram aqui conforme forem criadas em tasks futuras.
const NAV_BY_ROLE: Record<string, { href: string; label: string }[]> = {
  tutor: [
    { href: "/app/tutor", label: "Início" },
    { href: "/app/tutor/perfil", label: "Perfil" },
    { href: "/app/tutor/historico", label: "Histórico" },
    { href: "/app/tutor/avaliacoes", label: "Avaliações" },
  ],
  vet: [
    { href: "/app/vet", label: "Painel" },
    { href: "/app/vet/perfil", label: "Meu perfil" },
  ],
  clinic: [
    { href: "/app/clinic", label: "Painel" },
    { href: "/app/clinic/equipe", label: "Equipe" },
    { href: "/app/clinic/perfil", label: "Perfil" },
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

  // Os guards das pages /app/* já redirecionam quem não tem sessão.
  // Aqui tratamos role ausente de forma defensiva: header mínimo, sem quebrar.
  let navLinks: { href: string; label: string }[] = [];
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role) {
      navLinks = NAV_BY_ROLE[profile.role] ?? [];
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-[980px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/app"
            className="inline-flex items-center gap-2.5 no-underline"
          >
            <Image
              src="/vetria/logo-square.png"
              alt="Vetria"
              width={32}
              height={32}
              className="rounded-md"
            />
            <span className="text-titulo font-bold text-xl">Vetria</span>
          </Link>

          <AppHeaderNav nav={navLinks} />
        </div>
      </header>

      <main className="max-w-[980px] mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
