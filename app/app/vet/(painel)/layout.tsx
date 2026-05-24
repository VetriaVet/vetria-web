import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell, { type ShellSection } from "@/components/app/AppShell";

// Shell premium do painel veterinário (DL-032). Route group `(painel)` =
// só as telas de painel ganham a sidebar; o onboarding (fora do grupo) fica
// sem sidebar, evitando sidebar dupla (DL-025). A URL não muda (`/app/vet`...).

const SECTIONS: ShellSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/app/vet", icon: "dashboard" },
      { label: "Meu perfil", href: "/app/vet/perfil", icon: "user" },
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
      homeHref="/app/vet"
      user={{ name, meta: "Veterinário(a)", initial }}
    >
      {children}
    </AppShell>
  );
}
