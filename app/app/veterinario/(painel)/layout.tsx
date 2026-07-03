import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell, { type ShellSection } from "@/components/app/AppShell";

// Shell premium do painel veterinário (DL-032). Route group `(painel)` =
// só as telas de painel ganham a sidebar; o onboarding (fora do grupo) fica
// sem sidebar, evitando sidebar dupla (DL-025). A URL não muda (`/app/veterinario`...).

const SECTIONS: ShellSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/app/veterinario", icon: "dashboard" },
      { label: "Meu perfil", href: "/app/veterinario/perfil", icon: "user" },
      { label: "Contatos recebidos", href: "/app/veterinario/contatos", icon: "message" },
      { label: "Agenda", href: "/app/veterinario/agenda", icon: "calendar" },
      { label: "Avaliações", href: "/app/veterinario/avaliacoes", icon: "star" },
    ],
  },
  {
    title: "Conta",
    items: [
      { label: "Meu plano", href: "/app/veterinario/plano", icon: "crown" },
      { label: "Configurações", href: "/app/veterinario/configuracoes", icon: "settings" },
      { label: "Ajuda", href: "/app/veterinario/ajuda", icon: "help" },
    ],
  },
];

export default async function VetPainelLayout({
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
  if (!profile || profile.role !== "vet") redirect("/app");

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const name = (meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "Veterinário").trim();
  const initial = name.charAt(0).toUpperCase();

  return (
    <AppShell
      sections={SECTIONS}
      homeHref="/app/veterinario"
      user={{ name, meta: "Veterinário(a)", initial }}
    >
      {children}
    </AppShell>
  );
}
