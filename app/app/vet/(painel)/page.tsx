import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { EmptyState, GhostRow, Skeleton } from "@/components/ui/EmptyState";
import {
  ArrowRight,
  Eye,
  MessageCircle,
  Star,
  Bookmark,
  Search,
  Inbox,
  CalendarDays,
  Check,
  type LucideIcon,
} from "lucide-react";

// Dashboard vet — casca fiel ao produto. Os blocos que dependem de backend
// (atividade, agenda, métricas) usam estados GHOST (DL-034): mostram o
// esqueleto do conteúdo + texto honesto do que vai aparecer, sem inventar
// número (DL-020). Pontos de integração marcados com // TODO.

export default async function VetPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "vet") redirect("/app");

  // Nome via user_metadata (profiles não tem full_name — DL-019).
  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const rawName =
    meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "doutor(a)";
  const firstName = rawName.trim().split(" ")[0];
  const displayName =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const completo = profile.onboarding_completed;
  const ctaHref = completo ? "/app/vet/perfil" : "/app/vet/onboarding";
  const ctaLabel = completo ? "Editar perfil" : "Completar cadastro";

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting card */}
      <section className="flex flex-col gap-6 rounded-2xl bg-principal p-8 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/60">
            {hoje}
          </div>
          <h1 className="mb-2 text-[26px] font-bold leading-tight sm:text-[30px]">
            Olá, {displayName}.
          </h1>
          <p className="max-w-lg text-[15px] leading-relaxed text-white/80">
            {completo
              ? "Seu cadastro profissional está completo. Em breve seu perfil entra na busca pública da Vetria."
              : "Complete seu cadastro profissional para que tutores possam te encontrar na Vetria."}
          </p>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-pill bg-fundo-claro px-6 py-3 text-sm font-semibold text-principal no-underline transition hover:bg-white"
        >
          {ctaLabel}
          <ArrowRight size={16} />
        </Link>
      </section>

      {/* Busca — preparada (// TODO: busca real na fase pesada) */}
      <div className="flex max-w-xl items-center gap-3 rounded-pill border border-neutro-border bg-white py-2.5 pl-5 pr-3">
        <Search size={18} className="shrink-0 text-corpo-texto/60" />
        <input
          type="text"
          disabled
          placeholder="Buscar contatos e avaliações..."
          className="flex-1 bg-transparent text-[14px] text-titulo outline-none placeholder:text-corpo-texto/60 disabled:cursor-not-allowed"
        />
        <span className="shrink-0 text-[11px] uppercase tracking-wider text-corpo-texto/50">
          em breve
        </span>
      </div>

      {/* Stats — valor fantasma até a busca pública (Sprint 3) */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* TODO: ligar a métricas reais quando o perfil público existir */}
        <StatCard icon={Eye} label="Visualizações" />
        <StatCard icon={MessageCircle} label="Contatos recebidos" />
        <StatCard icon={Star} label="Avaliações" />
        <StatCard icon={Bookmark} label="Salvos por tutores" />
      </section>

      {/* Grid principal */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Coluna esquerda (2/3): atividade + agenda */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="border-neutro-border p-6">
            <h2 className="mb-1 text-lg font-bold text-titulo">
              Atividade recente
            </h2>
            <p className="mb-5 text-[13px] text-corpo-texto">
              Movimentações no seu perfil
            </p>

            {/* TODO: feed real (contatos, avaliações, visualizações) — Sprint 3+ */}
            <EmptyState
              icon={Inbox}
              ghost={3}
              title="Nenhuma atividade ainda"
              description="Quando tutores visualizarem ou entrarem em contato com seu perfil, as movimentações aparecem aqui — cada uma com nome, tipo e data."
            />
          </Card>

          <Card className="border-neutro-border p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-titulo">
                  Próximos atendimentos
                </h2>
                <p className="text-[13px] text-corpo-texto">Agenda da semana</p>
              </div>
              <span className="rounded-pill bg-fundo-destaque px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-principal">
                Em breve
              </span>
            </div>

            <EmptyState
              icon={CalendarDays}
              preview={
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 [mask-image:linear-gradient(to_bottom,black,transparent)]">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl border border-neutro-border-soft bg-neutro-bg-alt/40 p-3"
                    >
                      <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              }
              title="A agenda chega em breve"
              description="Você poderá organizar horários e receber agendamentos diretos pela Vetria. Por enquanto, tutores entram em contato pelo WhatsApp."
            />
          </Card>
        </div>

        {/* Coluna direita (1/3): pipeline de ativação do perfil */}
        <div className="flex flex-col gap-6">
          <Card className="border-neutro-border p-6">
            <h2 className="mb-1 text-lg font-bold text-titulo">
              Ativação do perfil
            </h2>
            <p className="mb-5 text-[13px] text-corpo-texto">
              As etapas até seu perfil ficar visível na busca pública.
            </p>

            {/* Pipeline = fluxo real de status do CONTEXT §4.3
                (incomplete → pending_validation → active). Hoje derivado de
                onboarding_completed; liga ao campo `status` na migration 029. */}
            <ol className="mb-6 flex flex-col gap-4">
              <StepItem
                title="Cadastro profissional"
                desc="Dados, CRMV e especialidades"
                state={completo ? "done" : "current"}
              />
              <StepItem
                title="Validação do CRMV"
                desc="Análise da equipe Vetria"
                state="soon"
              />
              <StepItem
                title="Perfil ativo na busca"
                desc="Visível para tutores"
                state="soon"
              />
            </ol>

            <Link
              href={ctaHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-principal py-3 text-sm font-semibold text-white no-underline transition hover:bg-principal-deep"
            >
              {ctaLabel}
              <ArrowRight size={16} />
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="rounded-2xl border border-neutro-border bg-white p-5">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-fundo-destaque text-principal">
        <Icon size={18} />
      </div>
      <div className="mb-2 text-[13px] text-corpo-texto">{label}</div>
      <Skeleton className="h-7 w-12" />
      <div className="mt-2 text-xs text-corpo-texto/70">Em breve</div>
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
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-principal text-white">
        <Check size={14} strokeWidth={3} />
      </span>
    ) : state === "current" ? (
      <span className="h-6 w-6 shrink-0 rounded-full border-2 border-principal bg-white" />
    ) : (
      <span className="h-6 w-6 shrink-0 rounded-full border-2 border-neutro-border bg-white" />
    );

  return (
    <li className="flex items-start gap-3">
      {marker}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              state === "soon" ? "text-corpo-texto" : "text-titulo"
            }`}
          >
            {title}
          </span>
          {state === "soon" && (
            <span className="rounded-pill bg-fundo-claro px-2 py-0.5 text-[10px] uppercase tracking-wider text-corpo-texto">
              Em breve
            </span>
          )}
        </div>
        <div className="text-[12px] text-corpo-texto/80">{desc}</div>
      </div>
    </li>
  );
}
