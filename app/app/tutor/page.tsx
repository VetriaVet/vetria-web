import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { Card } from "../../../components/ui/Card";

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
  if (!profile.onboarding_completed) redirect("/app/tutor/onboarding");

  // Nome do greeting: profiles não tem full_name; usamos user_metadata
  // (Google OAuth traz nome) com fallback pro prefixo do email.
  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const rawName =
    meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "tutor";
  const firstName = rawName.trim().split(" ")[0];
  const displayName =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting hero */}
      <section className="bg-fundo-claro rounded-2xl p-8 sm:p-10">
        <div className="text-5xl mb-4 leading-none" aria-hidden="true">
          👋
        </div>
        <h1 className="font-bold text-[28px] sm:text-[32px] leading-tight tracking-tight text-titulo mb-2">
          Oi <span className="text-principal">{displayName}</span>
        </h1>
        <p className="text-[15px] text-corpo-texto leading-relaxed max-w-xl mb-6">
          Aqui você acompanha a saúde dos seus pets, encontra novos
          profissionais e mantém tudo organizado em um só lugar.
        </p>

        {/* Busca — visual por enquanto. TODO: busca real (Sprint 3) */}
        <div className="bg-white rounded-pill shadow-sm flex items-center gap-3 pl-5 pr-2 py-2 max-w-xl">
          <span className="text-corpo-texto/60 shrink-0">
            <SearchIcon />
          </span>
          <input
            type="text"
            disabled
            placeholder="Buscar veterinário, especialidade ou clínica..."
            className="flex-1 bg-transparent text-[14px] text-titulo placeholder:text-corpo-texto/60 outline-none disabled:cursor-not-allowed"
          />
        </div>
      </section>

      {/* Quick actions — estáticos por ora. TODO: rotas de destino */}
      <section className="grid md:grid-cols-3 gap-4">
        <QuickAction
          icon={<SearchIcon />}
          title="Buscar profissional"
          desc="Encontre vets e clínicas verificadas perto de você."
        />
        <QuickAction
          icon={<CalendarIcon />}
          title="Meus agendamentos"
          desc="Veja consultas passadas e próximas em um só lugar."
        />
        <QuickAction
          icon={<StarIcon />}
          title="Minhas avaliações"
          desc="Compartilhe sua experiência depois do atendimento."
        />
      </section>

      {/* Próximas consultas + Meus pets */}
      <section className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-bold text-xl text-titulo mb-1">
            Próximas consultas
          </h2>
          <p className="text-[13px] text-corpo-texto mb-6">
            Você não tem nenhuma consulta agendada.
          </p>

          <div className="text-center py-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-fundo-destaque text-principal flex items-center justify-center">
              <CalendarIcon />
            </div>
            <p className="font-semibold text-titulo mb-1.5">
              Tudo tranquilo por enquanto
            </p>
            <p className="text-[13px] text-corpo-texto leading-relaxed max-w-xs mx-auto">
              Quando precisar, é só buscar um profissional e agendar.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="font-bold text-xl text-titulo mb-4">Meus pets</h2>

          {/* TODO: integrar com banco — dados de exemplo até a captura real de pets */}
          <div className="flex flex-col gap-3">
            <PetItem emoji="🐶" name="Mel" meta="Yorkshire · 9 anos · Fêmea" />
            <PetItem emoji="🐱" name="Pingo" meta="SRD · 4 anos · Macho" />
          </div>
        </Card>
      </section>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <span className="w-11 h-11 rounded-xl bg-fundo-destaque text-principal flex items-center justify-center">
          {icon}
        </span>
        <div className="font-semibold text-[15px] text-titulo">{title}</div>
        <p className="text-[13px] text-corpo-texto leading-relaxed">{desc}</p>
      </div>
    </Card>
  );
}

function PetItem({
  emoji,
  name,
  meta,
}: {
  emoji: string;
  name: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-fundo-claro/50">
      <span
        className="w-9 h-9 rounded-full bg-fundo-destaque flex items-center justify-center text-lg shrink-0"
        aria-hidden="true"
      >
        {emoji}
      </span>
      <div className="min-w-0">
        <div className="font-semibold text-sm text-titulo">{name}</div>
        <div className="text-xs text-corpo-texto">{meta}</div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11.5 2.8a.6.6 0 0 1 1 0l2.4 5 5.4.8a.6.6 0 0 1 .3 1l-3.9 3.8.9 5.4a.6.6 0 0 1-.9.6l-4.8-2.5-4.8 2.5a.6.6 0 0 1-.9-.6l.9-5.4L2.4 9.6a.6.6 0 0 1 .3-1l5.4-.8z" />
    </svg>
  );
}
