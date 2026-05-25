import type { Metadata } from "next";
import Image from "next/image";
import { Check, Clock, ChevronRight, Info, Crown, type LucideIcon } from "lucide-react";

// Roadmap vivo da Vetria — rota isolada (não linkada na navegação; acessível
// por link direto). noindex pra não ser indexada. Status REAL do projeto, não
// o desenhado: a casca visual de todo o produto está pronta (marco da Sprint 2),
// mas a persistência de dados / estados / busca dependem do backend (próximas).
// Para manter VIVO: editar o array SPRINTS + a data ATUALIZADO abaixo.

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Onde estamos e para onde vamos. Evolução da plataforma Vetria.",
  robots: { index: false, follow: false },
};

const ATUALIZADO = "25 de maio de 2026";

type Status = "done" | "doing" | "todo";

type Sprint = {
  num: string;
  title: string;
  goal: string;
  status: Status;
  items: { label: string; status: Status }[];
  result: string;
  warn?: string;
};

const SPRINTS: Sprint[] = [
  {
    num: "Sprint 1",
    title: "Base técnica, autenticação e RBAC",
    status: "done",
    goal: "Erguer o alicerce: contas, papéis e a estrutura de painéis que sustenta tudo o que vem depois.",
    items: [
      { label: "Estrutura técnica e deploy contínuo", status: "done" },
      { label: "Login e cadastro (e-mail + Google)", status: "done" },
      { label: "Controle de acesso por papel (RBAC)", status: "done" },
      { label: "Painéis isolados (tutor, vet, clínica)", status: "done" },
      { label: "Painel administrativo funcional", status: "done" },
      {
        label: "Recuperação de senha + emails reais no domínio oficial",
        status: "done",
      },
    ],
    result:
      "Base de entrada sólida e no ar (vetriabrasil.com.br): contas, login, recuperação de senha e papéis funcionando de verdade.",
  },
  {
    num: "Sprint 2",
    title: "Identidade visual e onboarding",
    status: "doing",
    goal: "Dar ao produto a cara final (da landing aos painéis) e transformar usuários genéricos em veterinários, clínicas e tutores com identidade própria.",
    items: [
      {
        label:
          "Design system v2 e casca visual de todo o produto (landing, tutor, vet, clínica, admin)",
        status: "done",
      },
      { label: "Home pública do consumidor", status: "done" },
      {
        label: "Telas de onboarding do vet, da clínica e do tutor",
        status: "done",
      },
      {
        label:
          "Salvar os dados do onboarding no banco (CRMV, especialidade, bio, endereço)",
        status: "doing",
      },
      {
        label: "Estados do usuário (incompleto, em validação, ativo)",
        status: "todo",
      },
      {
        label: "Bloqueio: vet e clínica só aparecem na busca após validação",
        status: "todo",
      },
    ],
    result:
      "A Vetria deixa de ser um sistema com login e ganha a cara e a base de um marketplace real.",
  },
  {
    num: "Sprint 3",
    title: "Perfis públicos e base de busca",
    status: "todo",
    goal: "Permitir que tutores encontrem veterinários e clínicas: a conexão entre quem oferece e quem procura.",
    items: [
      { label: "Página pública do veterinário", status: "todo" },
      { label: "Página pública da clínica", status: "todo" },
      { label: "Busca por cidade e especialidade", status: "todo" },
      { label: "Listagem só de perfis ativos e validados", status: "todo" },
    ],
    result: "Nasce a conexão entre oferta (vet/clínica) e demanda (tutor).",
  },
  {
    num: "Sprint 4",
    title: "Sistema de agendamento",
    status: "todo",
    goal: "O coração do produto: marcação de consultas entre tutor e profissional.",
    items: [
      { label: "Agenda do veterinário (dias e horários)", status: "todo" },
      { label: "Tutor escolhe horário e marca consulta", status: "todo" },
      { label: "Vet vê sua agenda; tutor vê suas consultas", status: "todo" },
      { label: "Gestão de status das consultas", status: "todo" },
    ],
    result: "O produto começa a gerar valor real e recorrente.",
  },
  {
    num: "Sprint 5",
    title: "Experiência e retenção",
    status: "todo",
    goal: "Fazer o usuário voltar: recursos que criam hábito e fidelidade.",
    items: [
      { label: "Tutor: favoritos, histórico e avaliações", status: "todo" },
      { label: "Vet: dashboard com métricas simples", status: "todo" },
      { label: "Clínica: gestão de equipe (básico)", status: "todo" },
    ],
    result:
      "Usuários engajados e recorrentes, não só visitantes de passagem.",
  },
  {
    num: "Sprint 6",
    title: "Monetização",
    status: "todo",
    goal: "Começar a faturar, quando já existe base de usuários e valor entregue.",
    items: [
      {
        label: "Vet premium (destaque na busca, mais visibilidade)",
        status: "todo",
      },
      {
        label: "Clínica premium (múltiplos vets, agenda avançada)",
        status: "todo",
      },
      { label: "Comissão por consulta (futuro)", status: "todo" },
    ],
    warn: "Pagamentos (Stripe) entram somente nesta fase.",
    result:
      "A plataforma passa a gerar receita sobre uma base já consolidada.",
  },
  {
    num: "Sprint 7",
    title: "Escala e diferencial competitivo",
    status: "todo",
    goal: "Criar vantagem competitiva e abrir novas frentes de crescimento.",
    items: [
      { label: "Chat entre tutor e veterinário", status: "todo" },
      { label: "Telemedicina", status: "todo" },
      { label: "IA de triagem", status: "todo" },
      { label: "Notificações inteligentes", status: "todo" },
      { label: "Aplicativo mobile", status: "todo" },
    ],
    result:
      "A Vetria se diferencia e se prepara para escalar nacionalmente.",
  },
];

const concluidas = SPRINTS.filter((s) => s.status === "done").length;
const emAndamento = SPRINTS.find((s) => s.status === "doing");

const segColor: Record<Status, string> = {
  done: "bg-success",
  doing: "bg-warning",
  todo: "bg-neutro-border",
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-neutro-bg-alt">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutro-border-soft bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-8 px-6 py-4">
          <Image
            src="/vetria/logo-vetria-fundo-claro.svg"
            alt="Vetria"
            width={178}
            height={29}
            className="h-7 w-auto"
            priority
          />
          <div className="hidden items-center gap-2 text-[12px] text-text-muted sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Atualizado em {ATUALIZADO}
            {emAndamento ? ` · ${emAndamento.num} em andamento` : ""}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto mt-10 max-w-5xl px-6">
        <div className="overflow-hidden rounded-3xl bg-fundo-claro p-10 sm:p-14">
          <span className="mb-6 inline-flex items-center gap-2 rounded-pill border border-neutro-border-soft bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-principal">
            Roadmap do produto
          </span>
          <h1 className="max-w-2xl text-[32px] font-bold leading-[1.08] tracking-tight text-titulo sm:text-[46px]">
            Onde estamos e <span className="text-principal">para onde vamos.</span>
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-corpo-texto">
            Este é o mapa de evolução da Vetria, do alicerce técnico ao
            marketplace completo. Cada sprint entrega uma camada de valor real e
            desbloqueia a próxima.
          </p>
          <div className="mt-7 inline-flex items-center gap-2.5 rounded-md bg-white px-5 py-3.5 text-[14px] font-medium text-titulo shadow-sm">
            <ChevronRight size={18} className="text-principal" />
            Princípio:{" "}
            <b className="font-semibold text-principal">
              cada sprint desbloqueia a próxima. Não se pula etapa.
            </b>
          </div>
        </div>
      </section>

      {/* Como ler */}
      <div className="mx-auto mt-5 max-w-5xl px-6">
        <div className="flex items-start gap-3 rounded-md border border-[#CDEDE4] bg-fundo-destaque px-5 py-4 text-[13px] leading-relaxed text-principal-deep">
          <Info size={18} className="mt-0.5 shrink-0 text-principal" />
          <div>
            <b className="font-semibold">Como ler este roadmap:</b> verde =
            concluído e em produção · amarelo = em andamento agora · cinza =
            planejado. Cada bloco lista os entregáveis daquela fase e o resultado
            que ela destrava para o produto.
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="mx-auto mt-7 max-w-5xl px-6">
        <div className="rounded-2xl border border-neutro-border bg-white p-6 sm:px-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-titulo">
              Progresso geral
            </h2>
            <span className="text-[13px] text-corpo-texto">
              <b className="text-[15px] text-principal">{concluidas}</b> de{" "}
              {SPRINTS.length} sprints concluídas · produto visualmente completo
              (todas as telas no ar)
            </span>
          </div>
          <div className="flex gap-[3px] overflow-hidden rounded-pill">
            {SPRINTS.map((s) => (
              <div
                key={s.num}
                className={`h-2.5 flex-1 rounded-pill ${segColor[s.status]}`}
                title={`${s.num} · ${s.status}`}
              />
            ))}
          </div>
          <div className="mt-3.5 flex flex-wrap gap-5">
            <Legend color="bg-success" label="Concluído" />
            <Legend color="bg-warning" label="Em andamento" />
            <Legend color="bg-neutro-border" label="Planejado" />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mx-auto mb-20 mt-10 max-w-5xl px-6">
        <ol className="relative">
          {SPRINTS.map((s, i) => (
            <SprintCard key={s.num} sprint={s} last={i === SPRINTS.length - 1} />
          ))}
        </ol>
      </div>

      {/* Footer */}
      <footer className="bg-principal px-6 py-10 text-center text-white/85">
        <div className="mx-auto max-w-5xl">
          <p className="text-[13px]">
            <b className="text-white">Vetria</b> · Roadmap de evolução do produto
          </p>
          <p className="mt-2 text-[12px] text-white/55">
            Cada sprint constrói sobre a anterior. As próximas fases ganham vida
            conforme a base amadurece.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-corpo-texto">
      <span className={`h-2.5 w-2.5 rounded-[3px] ${color}`} />
      {label}
    </span>
  );
}

const dotStyle: Record<Status, string> = {
  done: "border-success bg-success text-white",
  doing: "border-warning bg-warning text-white",
  todo: "border-neutro-border bg-white text-transparent",
};

const badgeStyle: Record<Status, string> = {
  done: "bg-success-soft text-success",
  doing: "bg-warning-soft text-warning",
  todo: "border border-neutro-border bg-neutro-bg-alt text-text-muted",
};

const badgeLabel: Record<Status, string> = {
  done: "Concluída",
  doing: "Em andamento",
  todo: "Planejado",
};

function StatusIcon({ status, size = 12 }: { status: Status; size?: number }) {
  if (status === "done") return <Check size={size} strokeWidth={3} />;
  if (status === "doing") return <Clock size={size} strokeWidth={2.5} />;
  return null;
}

function SprintCard({ sprint, last }: { sprint: Sprint; last: boolean }) {
  const s = sprint;
  return (
    <li className="relative pb-7 pl-14">
      {/* linha vertical */}
      {!last && (
        <span className="absolute left-[19px] top-2 bottom-[-8px] w-0.5 bg-neutro-border" />
      )}
      {/* dot */}
      <span
        className={`absolute left-2 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border-[3px] ${dotStyle[s.status]}`}
      >
        <StatusIcon status={s.status} />
      </span>

      <div
        className={`rounded-2xl border bg-white p-7 transition ${
          s.status === "doing"
            ? "border-warning shadow-[0_0_0_3px_var(--color-warning-soft)]"
            : "border-neutro-border"
        }`}
      >
        <div className="mb-1 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-text-muted">
              {s.num}
            </div>
            <h3 className="text-[21px] font-bold leading-tight tracking-tight text-titulo">
              {s.title}
            </h3>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${badgeStyle[s.status]}`}
          >
            <StatusIcon status={s.status} />
            {badgeLabel[s.status]}
          </span>
        </div>

        <p className="mb-5 max-w-2xl text-[14px] text-corpo-texto">{s.goal}</p>

        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {s.items.map((it) => (
            <li key={it.label} className="flex items-start gap-2.5 py-1">
              <span
                className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
                  it.status === "done"
                    ? "bg-success-soft text-success"
                    : it.status === "doing"
                      ? "bg-warning-soft text-warning"
                      : "border border-neutro-border bg-neutro-bg-alt text-transparent"
                }`}
              >
                <StatusIcon status={it.status} size={11} />
              </span>
              <span
                className={`text-[13.5px] leading-snug ${
                  it.status === "done" ? "text-titulo" : "text-corpo-texto"
                }`}
              >
                {it.label}
              </span>
            </li>
          ))}
        </ul>

        {s.warn && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-pill bg-warning-soft px-3 py-1.5 text-[11px] font-semibold text-warning">
            <Crown size={12} />
            {s.warn}
          </div>
        )}

        <div className="mt-[18px] flex items-start gap-2.5 border-t border-dashed border-neutro-border pt-4 text-[13px] text-corpo-texto">
          <Check size={16} className="mt-0.5 shrink-0 text-principal" strokeWidth={2.5} />
          <span>
            <b className="text-titulo">Resultado:</b> {s.result}
          </span>
        </div>
      </div>
    </li>
  );
}
