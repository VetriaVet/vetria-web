import { requirePainel } from "@/lib/auth/painel";
import { ESPERANDO_OU_ATIVO } from "@/lib/auth/status";
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

// Mesmo piso da gêmea do veterinário: `incomplete` e `suspended` não alcançam
// nenhuma página deste grupo, e as telas deles ficam fora dele. O portão fino
// continua tela a tela.

export default async function ClinicPainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, name: nomeDaSessao } = await requirePainel(
    "clinic",
    ESPERANDO_OU_ATIVO
  );

  const name = (
    nomeDaSessao || user.email?.split("@")[0] || "Estabelecimento"
  ).trim();
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
