import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Search,
  CalendarClock,
  Star,
  PawPrint,
  type LucideIcon,
} from "lucide-react";

// Dashboard do tutor (lado B2C/humano — hero claro, não o card verde do B2B).
// Blocos sem backend usam estado GHOST (DL-034); nada de mock (DL-020) — os
// pets de exemplo "Mel/Pingo" foram removidos. // TODO marca integrações.

export default async function TutorHome() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "tutor") redirect("/app");

  // Onboarding obrigatório também por aqui (além do guard de /app).
  if (!profile.onboarding_completed) redirect("/app/responsavel/onboarding");

  // Nome do greeting: profiles não tem full_name; usamos user_metadata
  // (Google OAuth traz nome) com fallback pro prefixo do email.
  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const rawName =
    meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "responsável";
  const firstName = rawName.trim().split(" ")[0];
  const displayName =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting hero */}
      <section className="rounded-2xl bg-fundo-claro p-8 sm:p-10">
        <div className="mb-4 text-5xl leading-none" aria-hidden="true">
          👋
        </div>
        <h1 className="mb-2 text-[28px] font-bold leading-tight tracking-tight text-titulo sm:text-[32px]">
          Oi <span className="text-principal">{displayName}</span>
        </h1>
        <p className="mb-6 max-w-xl text-[15px] leading-relaxed text-corpo-texto">
          Aqui você acompanha a saúde dos seus animais, encontra novos
          profissionais e mantém tudo organizado em um só lugar.
        </p>

        {/* Busca — visual por enquanto. TODO: busca real (Sprint 3) */}
        <div className="flex max-w-xl items-center gap-3 rounded-pill bg-white py-2 pl-5 pr-2 shadow-sm">
          <Search size={18} className="shrink-0 text-corpo-texto/60" />
          <input
            type="text"
            disabled
            placeholder="Buscar veterinário, especialidade ou estabelecimento..."
            className="flex-1 bg-transparent text-[14px] text-titulo outline-none placeholder:text-corpo-texto/60 disabled:cursor-not-allowed"
          />
        </div>
      </section>

      {/* Quick actions — informativos por ora. TODO: rotas de destino */}
      <section className="grid gap-4 md:grid-cols-3">
        <QuickAction
          icon={Search}
          title="Buscar profissional"
          desc="Encontre veterinários e estabelecimentos verificados perto de você."
        />
        <QuickAction
          icon={CalendarClock}
          title="Meus agendamentos"
          desc="Veja consultas passadas e próximas em um só lugar."
        />
        <QuickAction
          icon={Star}
          title="Minhas avaliações"
          desc="Compartilhe sua experiência depois do atendimento."
        />
      </section>

      {/* Próximas consultas + Meus pets */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-neutro-border p-6">
          <h2 className="mb-1 text-xl font-bold text-titulo">
            Próximas consultas
          </h2>
          <p className="mb-5 text-[13px] text-corpo-texto">
            Suas consultas marcadas pela Vetria.
          </p>

          {/* TODO: agendamentos reais (fase de backend) */}
          <EmptyState
            icon={CalendarClock}
            title="Tudo tranquilo por enquanto"
            description="Quando você marcar uma consulta, ela aparece aqui, com data, profissional e lembrete. Por ora, é só buscar um profissional e agendar."
          />
        </Card>

        <Card className="border-neutro-border p-6">
          <h2 className="mb-1 text-xl font-bold text-titulo">Meus animais</h2>
          <p className="mb-5 text-[13px] text-corpo-texto">
            O perfil de saúde de cada um dos seus animais.
          </p>

          {/* TODO: captura/edição de pets real — sem mock (DL-020) */}
          <EmptyState
            icon={PawPrint}
            title="Nenhum animal cadastrado ainda"
            description="Você poderá cadastrar seus animais (espécie, raça, idade) pra agilizar agendamentos e manter o histórico de saúde reunido aqui."
          />
        </Card>
      </section>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  desc,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Card className="border-neutro-border p-6">
      <div className="flex flex-col gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-fundo-destaque text-principal">
          <Icon size={20} />
        </span>
        <div className="text-[15px] font-semibold text-titulo">{title}</div>
        <p className="text-[13px] leading-relaxed text-corpo-texto">{desc}</p>
      </div>
    </Card>
  );
}
