import Link from "next/link";
import { requirePainel } from "@/lib/auth/painel";
import { SO_ATIVO } from "@/lib/auth/status";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ArrowRight,
  MessageCircle,
  Check,
} from "lucide-react";

// Dashboard vet — casca fiel ao produto. Os blocos que dependem de backend
// (contatos recebidos) usam estados GHOST (DL-034): mostram o
// esqueleto do conteúdo + texto honesto do que vai aparecer, sem inventar
// número (DL-020). Pontos de integração marcados com // TODO.

// ⚠️ T-016 — QUEM CHEGA AQUI ESTÁ `active`, E SÓ.
// A matriz §4 põe o dashboard na coluna "Bloqueado" de `incomplete` e de
// `pending_validation`. Antes, o guard lia só `role`: quem concluía o
// onboarding caía nesta tela como se estivesse aprovado, porque
// `concluir_onboarding_profissional()` grava `onboarding_completed = true` no
// mesmo `update` em que move o status (`0002_nucleo.sql:753-755`). Agora ele é
// devolvido para `/aguardando`.
//
// Consequência direta no que esta página mostra: `onboarding_completed` saiu
// do `select` e saiu da renderização. Ela era a coluna do R-040, escrita pelo
// próprio usuário, e nenhuma decisão de servidor depende dela aqui.

export default async function VetPage() {
  const { user } = await requirePainel("vet", SO_ATIVO);

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

  // O CTA parou de mentir. Ele dizia "Completar cadastro" e apontava para o
  // onboarding sempre que `onboarding_completed` fosse falso — inclusive para
  // quem já estava na fila. Quem chega nesta página está `active`: o cadastro
  // está completo E validado, e a única ação honesta é editar o perfil.
  const ctaHref = "/app/veterinario/perfil";
  // Sem editor ainda (T-019): o botão leva à prévia, e diz isso.
  const ctaLabel = "Ver meu perfil público";

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
            Seu cadastro profissional está validado. Em breve seu perfil entra
            na busca pública da Vetria.
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

      {/* Grid principal */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Coluna esquerda (2/3): contatos recebidos. T-055 tirou daqui a
            agenda, as avaliações, os salvos e as visualizações: nada disso
            entra na entrega de 25/11. A contagem real chega na T-042. */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="border-neutro-border p-6">
            <h2 className="mb-1 text-lg font-bold text-titulo">
              Contatos recebidos
            </h2>
            <p className="mb-5 text-[13px] text-corpo-texto">
              Responsáveis que chamaram você pelo seu perfil
            </p>

            {/* TODO (T-042): contagem e lista reais dos contatos */}
            <EmptyState
              icon={MessageCircle}
              ghost={3}
              title="Nenhum contato ainda"
              description="Seus contatos aparecem aqui quando um responsável chamar você pelo seu perfil na Vetria, com a data e o canal usado."
            />

            <Link
              href="/app/veterinario/contatos"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutro-border py-3 text-sm font-medium text-corpo-texto no-underline transition hover:border-principal hover:text-principal"
            >
              Ver contatos recebidos
              <ArrowRight size={14} aria-hidden />
            </Link>
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

            {/* Pipeline = o fluxo de status da matriz §4
                (incomplete → pending_validation → active). Não é mais derivado
                de `onboarding_completed`: o portão só deixa `active` chegar
                aqui, então os dois primeiros passos ESTÃO feitos. O terceiro
                continua "em breve" porque a busca pública é a F4, e dizer o
                contrário seria inventar tela. As outras duas etapas do fluxo
                têm página própria: `/onboarding` e `/aguardando`. */}
            <ol className="mb-6 flex flex-col gap-4">
              <StepItem
                title="Cadastro profissional"
                desc="Dados, CRMV e especialidades"
                state="done"
              />
              <StepItem
                title="Validação do CRMV"
                desc="Concluída pela equipe Vetria"
                state="done"
              />
              <StepItem
                title="Perfil ativo na busca"
                desc="Visível para responsáveis"
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
