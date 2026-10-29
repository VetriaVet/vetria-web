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

// Dashboard clínica — casca, mesma linguagem do painel vet. Blocos sem backend
// (contatos recebidos) usam estado GHOST (DL-034): esqueleto + texto
// honesto, sem mock (DL-020). Card de plano/cobrança fica de fora de propósito
// (Sprint 6). Pontos de integração marcados com // TODO.

// ⚠️ T-016 — QUEM CHEGA AQUI ESTÁ `active`, E SÓ. Gêmea do dashboard do
// veterinário, mesmo motivo: a matriz §4 põe o dashboard na coluna "Bloqueado"
// de `incomplete` e de `pending_validation`.
//
// É esta a tela que recebia, indevidamente, o estabelecimento que acabava de
// concluir o onboarding da T-007 (R-050 / SEC-071). Agora ele vai para
// `/aguardando`, que é o que o card sempre disse que deveria acontecer.

export default async function ClinicPage() {
  const { user } = await requirePainel("clinic", SO_ATIVO);

  // Nome via user_metadata (profiles não tem nome da clínica — DL-019).
  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const rawName =
    meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "seu estabelecimento";
  const displayName = rawName.trim();

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // O CTA parou de mentir: quem chega aqui está validado, e a única ação
  // honesta é editar o perfil. Ver a gêmea do veterinário.
  const ctaHref = "/app/estabelecimento/perfil";
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
            Bem-vindo, {displayName}.
          </h1>
          <p className="max-w-lg text-[15px] leading-relaxed text-white/80">
            O cadastro do estabelecimento está validado. Em breve seu perfil
            entra na busca pública da Vetria.
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
            equipe, as avaliações e as visualizações: nada disso entra na
            entrega de 25/11. A contagem real chega na T-042. */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="border-neutro-border p-6">
            <h2 className="mb-1 text-lg font-bold text-titulo">
              Contatos recebidos
            </h2>
            <p className="mb-5 text-[13px] text-corpo-texto">
              Responsáveis que chamaram o estabelecimento pelo perfil
            </p>

            {/* TODO (T-042): contagem e lista reais dos contatos */}
            <EmptyState
              icon={MessageCircle}
              ghost={3}
              title="Nenhum contato ainda"
              description="Os contatos aparecem aqui quando um responsável chamar o estabelecimento pelo perfil na Vetria, com a data e o canal usado."
            />

            <Link
              href="/app/estabelecimento/contatos"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutro-border py-3 text-sm font-medium text-corpo-texto no-underline transition hover:border-principal hover:text-principal"
            >
              Ver contatos recebidos
              <ArrowRight size={14} aria-hidden />
            </Link>
          </Card>
        </div>

        {/* Coluna direita (1/3): pipeline de ativação */}
        <div className="flex flex-col gap-6">
          <Card className="border-neutro-border p-6">
            <h2 className="mb-1 text-lg font-bold text-titulo">
              Ativação do perfil
            </h2>
            <p className="mb-5 text-[13px] text-corpo-texto">
              As etapas até o estabelecimento ficar visível na busca pública.
            </p>

            {/* Pipeline = o fluxo de status da matriz §4
                (incomplete → pending_validation → active). O portão só deixa
                `active` chegar aqui, então os dois primeiros passos ESTÃO
                feitos; o terceiro segue "em breve" porque a busca pública é a
                F4. As outras duas etapas têm página própria: `/onboarding` e
                `/aguardando`. */}
            <ol className="mb-6 flex flex-col gap-4">
              <StepItem
                title="Cadastro do estabelecimento"
                desc="Dados institucionais e CNPJ"
                state="done"
              />
              <StepItem
                title="Validação dos dados"
                desc="Concluída pela equipe Vetria"
                state="done"
              />
              <StepItem
                title="Estabelecimento ativo na busca"
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
