import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell, { type ShellSection } from "@/components/app/AppShell";

// Shell premium do painel da clínica (DL-032). Mesmo padrão do vet, com nav
// própria (Equipe). Route group `(painel)` mantém o onboarding fora da sidebar
// (DL-025). URL inalterada (`/app/clinic`...).

const SECTIONS: ShellSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/app/clinic", icon: "dashboard" },
      { label: "Perfil da clínica", href: "/app/clinic/perfil", icon: "building" },
      { label: "Equipe", href: "/app/clinic/equipe", icon: "users" },
      { label: "Contatos recebidos", icon: "message", soon: true },
      { label: "Agenda", icon: "calendar", soon: true },
      { label: "Avaliações", icon: "star", soon: true },
    ],
  },
  {
    title: "Conta",
    items: [
      { label: "Meu plano", icon: "crown", soon: true },
      { label: "Configurações", icon: "settings", soon: true },
      { label: "Ajuda", icon: "help", soon: true },
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
  const name = (meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "Clínica").trim();
  const initial = name.charAt(0).toUpperCase();

  return (
    <AppShell
      sections={SECTIONS}
      homeHref="/app/clinic"
      user={{ name, meta: "Clínica", initial }}
    >
      {children}
    </AppShell>
  );
}
