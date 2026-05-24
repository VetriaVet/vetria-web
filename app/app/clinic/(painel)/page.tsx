import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

// Dashboard clínica — casca fiel ao produto, mesma linguagem do painel vet.
// Estrutura institucional (equipe, métricas, ativação) pensada pras próximas
// fases, com estados honestos "em breve" até o backend real (migration 029:
// clinic_profiles + equipe; busca Sprint 3; planos Sprint 6). Sem mock.
// Pontos de integração marcados com // TODO. Card de plano/cobrança fica de
// fora de propósito — pré-anunciar preço é Sprint 6.

export default async function ClinicPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "clinic") redirect("/app");

  // Nome via user_metadata (profiles não tem nome da clínica — DL-019).
  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const rawName =
    meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "sua clínica";
  const displayName = rawName.trim();

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const completo = profile.onboarding_completed;

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting card */}
      <section className="rounded-2xl bg-principal text-white p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/60 mb-2">
            {hoje}
          </div>
          <h1 className="font-bold text-[26px] sm:text-[30px] leading-tight mb-2">
            Bem-vindo, {displayName}.
          </h1>
          <p className="text-[15px] text-white/80 leading-relaxed max-w-lg">
            {completo
              ? "O cadastro da clínica está completo. Em breve seu perfil entra na busca pública da Vetria."
              : "Complete o cadastro da clínica para que tutores possam encontrar sua equipe na Vetria."}
          </p>
        </div>
        {completo ? (
          <Link
            href="/app/clinic/perfil"
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-pill bg-fundo-claro text-principal px-6 py-3 font-semibold text-sm hover:bg-white transition no-underline"
          >
            Editar perfil
            <ArrowRightIcon />
          </Link>
        ) : (
          <Link
            href="/app/clinic/onboarding"
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-pill bg-fundo-claro text-principal px-6 py-3 font-semibold text-sm hover:bg-white transition no-underline"
          >
            Completar cadastro
            <ArrowRightIcon />
          </Link>
        )}
      </section>

      {/* Busca — visual/preparada (// TODO: busca real na fase pesada) */}
      <div className="bg-white rounded-pill border border-gray-200 flex items-center gap-3 pl-5 pr-3 py-2.5 max-w-xl">
        <span className="text-corpo-texto/60 shrink-0">
          <SearchIcon />
        </span>
        <input
          type="text"
          disabled
          placeholder="Buscar contatos e equipe..."
          className="flex-1 bg-transparent text-[14px] text-titulo placeholder:text-corpo-texto/60 outline-none disabled:cursor-not-allowed"
        />
        <span className="text-[11px] uppercase tracking-wider text-corpo-texto/50 shrink-0">
          em breve
        </span>
      </div>

      {/* Stats — estrutura pronta; valores chegam com a busca pública (Sprint 3) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TODO: ligar a métricas reais quando o perfil público existir */}
        <StatCard icon={<EyeIcon />} label="Visualizações" />
        <StatCard icon={<MessageIcon />} label="Contatos" />
        <StatCard icon={<UsersIcon />} label="Equipe ativa" />
        <StatCard icon={<StarIcon />} label="Avaliações" />
      </section>

      {/* Grid principal */}
      <section className="grid lg:grid-cols-3 gap-6">
        {/* Coluna esquerda (2/3): equipe + atividade */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <h2 className="font-bold text-lg text-titulo mb-1">
              Equipe profissional
            </h2>
            <p className="text-[13px] text-corpo-texto mb-5">
              Os veterinários vinculados à clínica.
            </p>

            {/* TODO: lista real da equipe (clinic_profiles + vínculos) — migration 029 */}
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-fundo-claro text-corpo-texto flex items-center justify-center">
                <UsersIcon />
              </div>
              <p className="font-semibold text-titulo mb-1">Monte sua equipe</p>
              <p className="text-[13px] text-corpo-texto leading-relaxed max-w-sm mx-auto">
                Em breve você poderá cadastrar e validar os veterinários da
                clínica, cada um com seu CRMV e especialidade.
              </p>
            </div>

            <Link
              href="/app/clinic/equipe"
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-corpo-texto py-3 text-sm font-medium hover:border-principal hover:text-principal transition no-underline"
            >
              <PlusIcon />
              Gerenciar equipe
            </Link>
          </Card>

          <Card>
            <h2 className="font-bold text-lg text-titulo mb-1">
              Atividade recente
            </h2>
            <p className="text-[13px] text-corpo-texto mb-5">
              Movimentações no perfil da clínica
            </p>

            {/* TODO: feed real (contatos, avaliações, equipe) — Sprint 3+ */}
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-fundo-claro text-corpo-texto flex items-center justify-center">
                <InboxIcon />
              </div>
              <p className="font-semibold text-titulo mb-1">
                Nenhuma atividade ainda
              </p>
              <p className="text-[13px] text-corpo-texto leading-relaxed max-w-sm mx-auto">
                Assim que tutores interagirem com o perfil da clínica, as
                movimentações aparecem aqui.
              </p>
            </div>
          </Card>
        </div>

        {/* Coluna direita (1/3): pipeline de ativação */}
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="font-bold text-lg text-titulo mb-1">
              Ativação do perfil
            </h2>
            <p className="text-[13px] text-corpo-texto mb-5">
              As etapas até a clínica ficar visível na busca pública.
            </p>

            {/* Pipeline = fluxo real de status do CONTEXT §4.3
                (incomplete → pending_validation → active). Hoje derivado de
                onboarding_completed; liga ao campo `status` na migration 029. */}
            <ol className="flex flex-col gap-4 mb-6">
              <StepItem
                title="Cadastro da clínica"
                desc="Dados institucionais e CNPJ"
                state={completo ? "done" : "current"}
              />
              <StepItem
                title="Validação dos dados"
                desc="Análise da equipe Vetria"
                state="soon"
              />
              <StepItem
                title="Clínica ativa na busca"
                desc="Visível para tutores"
                state="soon"
              />
            </ol>

            {completo ? (
              <Link
                href="/app/clinic/perfil"
                className="w-full inline-flex items-center justify-center gap-2 rounded-pill bg-principal text-white py-3 font-semibold text-sm hover:bg-[#142E33] transition no-underline"
              >
                Editar perfil
                <ArrowRightIcon />
              </Link>
            ) : (
              <Link
                href="/app/clinic/onboarding"
                className="w-full inline-flex items-center justify-center gap-2 rounded-pill bg-principal text-white py-3 font-semibold text-sm hover:bg-[#142E33] transition no-underline"
              >
                Completar cadastro
                <ArrowRightIcon />
              </Link>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="w-9 h-9 rounded-lg bg-fundo-destaque text-principal flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-[13px] text-corpo-texto mb-1">{label}</div>
      <div className="text-2xl font-bold text-titulo/30">—</div>
      <div className="text-xs text-corpo-texto/70 mt-1">Em breve</div>
    </div>
  );
}

type StepState = "done" | "current" | "soon";

function StepItem({
  title,
  desc,
  state,
}: {
  title: string;
  desc: string;
  state: StepState;
}) {
  const marker =
    state === "done" ? (
      <span className="w-6 h-6 rounded-full bg-principal text-white flex items-center justify-center shrink-0">
        <CheckIcon />
      </span>
    ) : state === "current" ? (
      <span className="w-6 h-6 rounded-full border-2 border-principal bg-white shrink-0" />
    ) : (
      <span className="w-6 h-6 rounded-full border-2 border-gray-200 bg-white shrink-0" />
    );

  return (
    <li className="flex items-start gap-3">
      {marker}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium text-sm ${
              state === "soon" ? "text-corpo-texto" : "text-titulo"
            }`}
          >
            {title}
          </span>
          {state === "soon" && (
            <span className="text-[10px] uppercase tracking-wider rounded-pill bg-fundo-claro text-corpo-texto px-2 py-0.5">
              Em breve
            </span>
          )}
        </div>
        <div className="text-[12px] text-corpo-texto/80">{desc}</div>
      </div>
    </li>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.5 2.8a.6.6 0 0 1 1 0l2.4 5 5.4.8a.6.6 0 0 1 .3 1l-3.9 3.8.9 5.4a.6.6 0 0 1-.9.6l-4.8-2.5-4.8 2.5a.6.6 0 0 1-.9-.6l.9-5.4L2.4 9.6a.6.6 0 0 1 .3-1l5.4-.8z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5v14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
