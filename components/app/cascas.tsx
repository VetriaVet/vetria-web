import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  MessageCircle,
  CalendarDays,
  Star,
  Crown,
  Lock,
  Bell,
  Mail,
  type LucideIcon,
} from "lucide-react";

// Conteúdos casca compartilhados pelos painéis vet/clínica (DL-034). Páginas
// finas por papel só fazem o guard (requirePainel) e renderizam estes blocos.
// Ghost onde ensina (contatos, avaliações); empty seco onde acalma (agenda).

function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-titulo">{title}</h1>
      <p className="mt-1 max-w-2xl text-[14px] text-corpo-texto">{sub}</p>
    </div>
  );
}

/* ---------------- Contatos recebidos (ghost) ---------------- */
export function ContatosCasca() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Contatos recebidos"
        sub="Tutores que entraram em contato a partir do seu perfil."
      />
      <EmptyState
        icon={MessageCircle}
        ghost={3}
        title="Nenhum contato ainda"
        description="Quando um tutor falar com você pelo perfil, aparece aqui — com nome, mensagem e data. Você responde direto pelo WhatsApp ou telefone."
      />
    </div>
  );
}

/* ---------------- Agenda (empty seco) ---------------- */
export function AgendaCasca() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Agenda" sub="Seus horários e agendamentos pela Vetria." />
      <EmptyState
        icon={CalendarDays}
        title="A agenda chega em breve"
        description="Você poderá definir horários de atendimento e receber agendamentos diretos pela Vetria. Por enquanto, o contato com tutores é pelo WhatsApp."
      />
    </div>
  );
}

/* ---------------- Avaliações (ghost) ---------------- */
export function AvaliacoesCasca() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Avaliações"
        sub="O que os tutores dizem sobre o seu atendimento."
      />
      <EmptyState
        icon={Star}
        ghost={2}
        title="Nenhuma avaliação ainda"
        description="Depois de atender tutores pela Vetria, as avaliações deles aparecem aqui — nota e comentário. Avaliações ajudam novos tutores a confiar em você."
      />
    </div>
  );
}

/* ---------------- Meu plano (sem preço) ---------------- */
export function PlanoCasca() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Meu plano" sub="Seu plano e cobrança na Vetria." />

      <div className="rounded-2xl border border-principal/25 bg-fundo-destaque p-6">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-principal">
          <Crown size={15} />
          Plano atual
        </div>
        <h2 className="text-xl font-bold text-titulo">Gratuito · beta</h2>
        <p className="mt-1 text-[14px] leading-relaxed text-corpo-texto">
          Durante o beta da Vetria, todos os recursos disponíveis estão
          liberados sem custo. Você não será cobrado por nada agora.
        </p>
      </div>

      <EmptyState
        icon={Crown}
        title="Planos pagos em breve"
        description="Estamos definindo os planos da Vetria. Quando lançarmos, as opções e os valores aparecem aqui pra você escolher — nada de cobrança surpresa antes disso."
      />
    </div>
  );
}

/* ---------------- Configurações ---------------- */
export function ConfiguracoesCasca({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title="Configurações" sub="Gerencie sua conta e preferências." />

      <SettingsCard title="Conta">
        <ReadField label="Nome de exibição" value={name || "—"} />
        <ReadField label="Email" value={email} note="Não editável por aqui" />
      </SettingsCard>

      <SettingsCard title="Segurança">
        <ActionRow
          icon={Lock}
          label="Trocar senha"
          desc="Atualize a senha de acesso à sua conta."
          soon
        />
      </SettingsCard>

      <SettingsCard title="Notificações">
        <ActionRow
          icon={Bell}
          label="Novos contatos por email"
          desc="Aviso quando um tutor entrar em contato."
          soon
        />
        <ActionRow
          icon={Mail}
          label="Resumo semanal"
          desc="Um email com o movimento do seu perfil."
          soon
        />
      </SettingsCard>
    </div>
  );
}

function SettingsCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutro-border bg-white p-6">
      <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-corpo-texto">
        {title}
      </h2>
      <div className="flex flex-col divide-y divide-neutro-border-soft">
        {children}
      </div>
    </section>
  );
}

function ReadField({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="text-[13px] text-corpo-texto">{label}</div>
        <div className="truncate font-medium text-titulo">{value}</div>
      </div>
      {note && (
        <span className="shrink-0 text-[11px] uppercase tracking-wider text-corpo-texto/50">
          {note}
        </span>
      )}
    </div>
  );
}

function ActionRow({
  icon: Icon,
  label,
  desc,
  soon,
}: {
  icon: LucideIcon;
  label: string;
  desc: string;
  soon?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fundo-claro text-corpo-texto">
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-titulo">{label}</div>
        <div className="text-[12px] text-corpo-texto">{desc}</div>
      </div>
      {soon && (
        <span className="shrink-0 rounded-pill bg-fundo-claro px-2.5 py-1 text-[10px] uppercase tracking-wider text-corpo-texto">
          Em breve
        </span>
      )}
    </div>
  );
}

/* ---------------- Ajuda ---------------- */
const FAQS: { q: string; a: string }[] = [
  {
    q: "Como meu perfil entra na busca pública?",
    a: "Depois de completar o cadastro e ter o CRMV validado pela equipe Vetria, seu perfil fica ativo e visível para tutores na busca.",
  },
  {
    q: "Quanto custa usar a Vetria?",
    a: "Durante o beta, o uso é gratuito. Planos pagos serão anunciados com antecedência — você não será cobrado sem aviso.",
  },
  {
    q: "Como os tutores entram em contato comigo?",
    a: "Por enquanto, pelo WhatsApp ou telefone do seu perfil. Agendamento direto pela plataforma chega em breve.",
  },
  {
    q: "Quanto tempo leva a validação do CRMV?",
    a: "Em média até 48h úteis. Você recebe um email assim que o perfil for aprovado.",
  },
];

export function AjudaCasca() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title="Ajuda" sub="Dúvidas frequentes e como falar com o suporte." />

      <div className="flex flex-col gap-3">
        {FAQS.map((f) => (
          <details
            key={f.q}
            className="group rounded-2xl border border-neutro-border bg-white p-5"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-titulo marker:content-none">
              {f.q}
              <span className="text-corpo-texto transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-[14px] leading-relaxed text-corpo-texto">
              {f.a}
            </p>
          </details>
        ))}
      </div>

      <div className="rounded-2xl bg-fundo-claro p-6">
        <h3 className="font-semibold text-titulo">Não achou o que procurava?</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-corpo-texto">
          Fale com a gente em{" "}
          <a
            href="mailto:contato@vetriapet.com.br"
            className="font-medium text-principal underline underline-offset-2"
          >
            contato@vetriapet.com.br
          </a>{" "}
          — respondemos em até 24h úteis.
        </p>
      </div>
    </div>
  );
}
