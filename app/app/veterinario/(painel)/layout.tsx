import { requirePainel } from "@/lib/auth/painel";
import { ESPERANDO_OU_ATIVO } from "@/lib/auth/status";
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

// ⚠️ O guard do layout é o piso, não o teto: nenhuma página deste grupo é
// alcançável por `incomplete` (a tela dele é `/onboarding`, que fica FORA do
// grupo) nem por `suspended` (a dele é `/bloqueado`, também fora). O portão
// fino, tela a tela, continua em cada `page.tsx` — layout em Next não é
// garantia de guard de página, e a matriz §4 distingue `/aguardando`,
// `/perfil` e `/configuracoes` do resto do painel.

export default async function VetPainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, name: nomeDaSessao } = await requirePainel(
    "vet",
    ESPERANDO_OU_ATIVO
  );

  const name = (
    nomeDaSessao || user.email?.split("@")[0] || "Veterinário"
  ).trim();
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
