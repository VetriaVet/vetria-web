import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell, { type ShellSection } from "@/components/app/AppShell";

// Shell premium do painel da clínica (DL-032). Mesmo padrão do vet, com nav
// própria (Equipe). Route group `(painel)` mantém o onboarding fora da sidebar
// (DL-025). URL inalterada (`/app/estabelecimento`...).

const SECTIONS: ShellSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/app/estabelecimento", icon: "dashboard" },
      { label: "Perfil do estabelecimento", href: "/app/estabelecimento/perfil", icon: "building" },
      { label: "Equipe", href: "/app/estabelecimento/equipe", icon: "users" },
      { label: "Contatos recebidos", href: "/app/estabelecimento/contatos", icon: "message" },
      { label: "Agenda", href: "/app/estabelecimento/agenda", icon: "calendar" },
      { label: "Avaliações", href: "/app/estabelecimento/avaliacoes", icon: "star" },
    ],
  },
  {
    title: "Conta",
    items: [
      { label: "Meu plano", href: "/app/estabelecimento/plano", icon: "crown" },
      { label: "Configurações", href: "/app/estabelecimento/configuracoes", icon: "settings" },
      { label: "Ajuda", href: "/app/estabelecimento/ajuda", icon: "help" },
    ],
  },
];

export default async function ClinicPainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "clinic") redirect("/app");

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const name = (meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "Estabelecimento").trim();
  const initial = name.charAt(0).toUpperCase();

  return (
    <AppShell
      sections={SECTIONS}
      homeHref="/app/estabelecimento"
      user={{ name, meta: "Estabelecimento", initial }}
    >
      {children}
    </AppShell>
  );
}
