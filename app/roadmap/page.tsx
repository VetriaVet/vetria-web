import type { Metadata } from "next";
import Image from "next/image";
import { Check, Clock, ChevronRight, Info, Crown } from "lucide-react";

// Roadmap vivo da Vetria — rota isolada (não linkada na navegação; acessível
// por link direto). noindex pra não ser indexada. É a janela dos donos pro
// andamento real: mostra o que já está em produção, o que está sendo feito
// agora e o que ficou conscientemente FORA da janela de entrega (status
// "later"). Alinhado a docs/01-PLANO.md e docs/00-ESCOPO.md.
//
// REGRA VIVA: ressincronizar a cada fechamento de fase (vetria-escriba).
// Editar o array SPRINTS + a data ATUALIZADO. Nunca prometer aqui o que o
// escopo congelado não contempla.

export const metadata: Metadata = {
  title: "Roadmap",
  description: "Onde estamos e para onde vamos. Evolução da plataforma Vetria.",
  robots: { index: false, follow: false },
};

const ATUALIZADO = "26 de agosto de 2026";
const ENTREGA = "25 de novembro de 2026";

type Status = "done" | "doing" | "todo" | "later";

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
    num: "Sprint 1 · concluída",
    title: "Base técnica, autenticação e RBAC",
    status: "done",
    goal: "Erguer o alicerce: contas, papéis e a estrutura de painéis que sustenta tudo o que vem depois.",
    items: [
      { label: "Estrutura técnica e deploy contínuo", status: "done" },
      { label: "Login e cadastro (e-mail + Google)", status: "done" },
      { label: "Controle de acesso por papel (RBAC)", status: "done" },
      { label: "Painéis isolados (responsável, veterinário, estabelecimento)", status: "done" },
      { label: "Painel administrativo funcional", status: "done" },
      { label: "Recuperação de senha + emails reais no domínio oficial", status: "done" },
    ],
    result:
      "Base de entrada sólida e no ar (vetriabrasil.com.br): contas, login, recuperação de senha e papéis funcionando de verdade.",
  },
  {
    num: "Sprint 2 · concluída",
    title: "Identidade visual e camada de entrada",
    status: "done",
    goal: "Dar ao produto a cara final, da página inicial aos painéis, e deixar a porta de entrada funcionando ponta a ponta no domínio oficial.",
    items: [
      {
        label:
          "Design system e todas as telas do produto (página inicial, responsável, veterinário, estabelecimento, admin)",
        status: "done",
      },
      { label: "Página inicial pública do consumidor", status: "done" },
      { label: "Telas de onboarding das três personas", status: "done" },
      { label: "Marca oficial aplicada em todas as telas", status: "done" },
      { label: "Emails transacionais com identidade Vetria", status: "done" },
      { label: "Domínio oficial no ar com email verificado", status: "done" },
    ],
    result:
      "A Vetria deixa de ser um sistema com login e ganha a cara de um marketplace real. Todas as telas navegáveis, prontas para receber os dados.",
  },
  {
    num: "Fase 3 · até 22 de setembro",
    title: "O produto passa a guardar dados",
    status: "doing",
    goal: "Sair da casca. Tudo o que o profissional preenche passa a ser guardado, e o admin passa a validar de verdade quem entra na plataforma. Desde 26 de agosto a base de dados está de pé e o cofre dos documentos também: falta as telas passarem a escrever neles.",
    items: [
      { label: "Estrutura de dados dos perfis profissionais", status: "done" },
      { label: "Onboarding que guarda o que foi preenchido", status: "doing" },
      { label: "Envio de documento para validação (CRMV, CNPJ)", status: "todo" },
      { label: "Estados do profissional: incompleto, em validação, ativo", status: "todo" },
      { label: "Fila de validação real no painel do admin", status: "todo" },
      { label: "Aprovação e reprovação com aviso por email", status: "todo" },
      { label: "Isolamento reforçado entre os painéis", status: "todo" },
      { label: "Testes automáticos dos fluxos críticos", status: "todo" },
    ],
    result:
      "O profissional se cadastra, preenche o perfil, envia o documento e é aprovado por uma pessoa. A partir daqui a plataforma tem dados reais.",
  },
  {
    num: "Fase 4 · até 20 de outubro",
    title: "Busca, perfil público e contato",
    status: "todo",
    goal: "O momento em que a Vetria começa a girar: o responsável encontra o profissional certo e fala com ele.",
    items: [
      { label: "Busca por cidade, especialidade e tipo de atendimento", status: "todo" },
      { label: "Só profissionais validados aparecem na busca", status: "todo" },
      { label: "Página pública do veterinário", status: "todo" },
      { label: "Página pública do estabelecimento", status: "todo" },
      { label: "Páginas preparadas para o Google encontrar", status: "todo" },
      { label: "Contato direto por WhatsApp", status: "todo" },
      { label: "Cada contato recebido fica registrado para o profissional", status: "todo" },
    ],
    result:
      "O marketplace passa a funcionar. E o profissional passa a ver quantos contatos recebeu, que é exatamente o valor que ele contrata.",
  },
  {
    num: "Fase 5 · até 3 de novembro",
    title: "Páginas de venda",
    status: "todo",
    goal: "Montar o funil comercial: páginas que explicam o valor e páginas que apresentam os planos.",
    items: [
      { label: "Página para veterinários", status: "todo" },
      { label: "Página para clínicas e hospitais", status: "todo" },
      { label: "Página para empresas pet e agrovet", status: "todo" },
      { label: "Três páginas de planos e preços", status: "todo" },
    ],
    warn: "Os planos aparecem como vitrine. A cobrança entra depois da entrega.",
    result:
      "O caminho completo existe: o profissional descobre a Vetria, entende o valor, vê os planos e se cadastra.",
  },
  {
    num: "Fase 6 · até 17 de novembro",
    title: "Segurança, privacidade e qualidade",
    status: "todo",
    goal: "O que separa um sistema que funciona na demonstração de um sistema que pode receber gente de verdade.",
    items: [
      { label: "Auditoria completa de acesso aos dados", status: "todo" },
      { label: "LGPD: consentimento, exportação e exclusão de dados", status: "todo" },
      { label: "Termos de uso e política de privacidade", status: "todo" },
      { label: "Varredura de qualidade em todos os fluxos", status: "todo" },
      { label: "Velocidade das páginas públicas", status: "todo" },
      { label: "Acessibilidade e telas de erro", status: "todo" },
    ],
    result:
      "A plataforma passa a tratar o dado de quem confia nela com o cuidado que ele merece.",
  },
  {
    num: "Entrega · 25 de novembro",
    title: "MVP no ar, pronto para receber usuários",
    status: "todo",
    goal: "Semana reservada para acabamento e para a apresentação. Nada novo é planejado aqui, de propósito.",
    items: [
      { label: "Correção do que ficou pendente", status: "todo" },
      { label: "Relatório de entrega", status: "todo" },
      { label: "Apresentação", status: "todo" },
    ],
    result:
      "A Vetria recebendo os primeiros profissionais e os primeiros responsáveis de verdade.",
  },
  {
    num: "Depois da entrega",
    title: "O que ficou conscientemente fora",
    status: "later",
    goal: "Não é esquecimento nem falta de capacidade. É o que garante que tudo acima seja entregue de verdade, no prazo. Cada item entra quando a base sustentar.",
    items: [
      { label: "Cobrança recorrente dos planos", status: "later" },
      { label: "Avaliações dos responsáveis e moderação", status: "later" },
      { label: "Agendamento de consultas", status: "later" },
      { label: "Favoritos", status: "later" },
      { label: "Equipe do estabelecimento", status: "later" },
      { label: "Mapa com raio de busca", status: "later" },
      { label: "Chat, telemedicina e aplicativo", status: "later" },
    ],
    result:
      "Um produto pequeno que funciona vale mais que um produto grande que não fica pronto. Estes itens entram sobre uma base já validada por uso real.",
  },
];

// "later" e o que ficou fora da janela de entrega: nao conta no progresso.
const ENTREGAVEIS = SPRINTS.filter((s) => s.status !== "later");
const concluidas = ENTREGAVEIS.filter((s) => s.status === "done").length;
const emAndamento = SPRINTS.find((s) => s.status === "doing");

const segColor: Record<Status, string> = {
  done: "bg-success",
  doing: "bg-warning",
  todo: "bg-neutro-border",
  later: "bg-neutro-border-soft",
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
            marketplace funcionando. Cada etapa entrega uma camada de valor real
            e desbloqueia a próxima.
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-corpo-texto">
            A entrega do MVP está marcada para <b className="text-titulo">{ENTREGA}</b>,
            com escopo fechado. O último bloco desta página mostra, sem rodeio, o
            que ficou de fora dessa janela e por quê.
          </p>
          <div className="mt-7 inline-flex items-center gap-2.5 rounded-md bg-white px-5 py-3.5 text-[14px] font-medium text-titulo shadow-sm">
            <ChevronRight size={18} className="text-principal" />
            Princípio:{" "}
            <b className="font-semibold text-principal">
              cada etapa desbloqueia a próxima. Não se pula etapa.
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
            planejado para esta entrega · tracejado = fora desta entrega,
            adiado de propósito. Cada bloco lista os entregáveis daquela etapa e
            o resultado que ela destrava para o produto.
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
              {ENTREGAVEIS.length} etapas concluídas · todas as telas no ar,
              agora ligando os dados reais
            </span>
          </div>
          <div className="flex gap-[3px] overflow-hidden rounded-pill">
            {ENTREGAVEIS.map((s) => (
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
            <Legend color="bg-neutro-border-soft" label="Fora desta entrega" />
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
            Cada etapa constrói sobre a anterior. Página atualizada a cada
            fechamento de fase, com o andamento real e não com o planejado.
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
  later: "border-neutro-border-soft bg-neutro-bg-alt text-transparent",
};

const badgeStyle: Record<Status, string> = {
  done: "bg-success-soft text-success",
  doing: "bg-warning-soft text-warning",
  todo: "border border-neutro-border bg-neutro-bg-alt text-text-muted",
  later: "border border-dashed border-neutro-border bg-transparent text-text-muted",
};

const badgeLabel: Record<Status, string> = {
  done: "Concluída",
  doing: "Em andamento",
  todo: "Planejado",
  later: "Fora desta entrega",
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
