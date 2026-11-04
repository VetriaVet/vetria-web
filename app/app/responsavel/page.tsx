import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Search, UserRound, ArrowRight, type LucideIcon } from "lucide-react";

// Painel do responsável (lado B2C/humano: hero claro, não o card verde do B2B).
// T-052 (QA-002): a busca do painel leva a /buscar e os atalhos são links.
// Saíram os blocos que prometiam o que não entra até 25/11 (agendamentos,
// avaliações, cadastro de animais): o painel mostra só o que existe (DL-020).

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
      <section className="rounded-2xl bg-fundo-claro p-6 sm:p-10">
        <div className="mb-4 text-5xl leading-none" aria-hidden="true">
          👋
        </div>
        <h1 className="mb-2 text-[28px] font-bold leading-tight tracking-tight text-titulo sm:text-[32px]">
          Oi <span className="text-principal">{displayName}</span>
        </h1>
        <p className="mb-6 max-w-xl text-[15px] leading-relaxed text-corpo-texto">
          Encontre veterinários e estabelecimentos verificados pela Vetria,
          compare especialidades e veja como cada um atende.
        </p>

        {/* T-052: GET puro para /buscar, com os mesmos campos da home (q e
            cidade, contrato de lib/busca/pedido.ts). Funciona sem JavaScript. */}
        <form
          action="/buscar"
          method="get"
          role="search"
          aria-label="Buscar veterinários e estabelecimentos"
          className="flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-3 shadow-sm sm:flex-row"
        >
          <label htmlFor="painel-busca-q" className="sr-only">
            O que você procura
          </label>
          <div className="relative flex-1">
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-corpo-texto/60"
            />
            <input
              id="painel-busca-q"
              name="q"
              type="search"
              maxLength={80}
              placeholder="Especialidade, serviço ou nome"
              className="w-full rounded-pill border border-neutro-border bg-neutro-bg-alt/50 py-3 pl-10 pr-4 text-[14px] text-titulo outline-none transition placeholder:text-corpo-texto/60 focus:border-principal focus:bg-white focus:ring-2 focus:ring-principal/20"
            />
          </div>
          <label htmlFor="painel-busca-cidade" className="sr-only">
            Cidade
          </label>
          <input
            id="painel-busca-cidade"
            name="cidade"
            type="text"
            maxLength={60}
            autoComplete="address-level2"
            placeholder="Cidade"
            className="rounded-pill border border-neutro-border bg-neutro-bg-alt/50 px-4 py-3 text-[14px] text-titulo outline-none transition placeholder:text-corpo-texto/60 focus:border-principal focus:bg-white focus:ring-2 focus:ring-principal/20 sm:w-[34%]"
          />
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill bg-principal px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-principal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2"
          >
            <Search size={16} aria-hidden />
            Buscar
          </button>
        </form>
      </section>

      {/* Atalhos: só rotas que existem (nunca linka 404). */}
      <section className="grid gap-4 md:grid-cols-2">
        <QuickAction
          href="/buscar"
          icon={Search}
          title="Buscar profissional"
          desc="Veja veterinários e estabelecimentos verificados, por especialidade, serviço e cidade."
        />
        <QuickAction
          href="/app/responsavel/perfil"
          icon={UserRound}
          title="Meu perfil"
          desc="Seus dados na Vetria: nome, email, telefone e cidade."
        />
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Card
      as="link"
      href={href}
      interactive
      hoverable
      className="group border-neutro-border p-6 no-underline"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fundo-destaque text-principal">
          <Icon size={20} aria-hidden />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-[15px] font-semibold text-titulo group-hover:text-principal">
            {title}
            <ArrowRight
              size={15}
              aria-hidden
              className="transition group-hover:translate-x-0.5"
            />
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-corpo-texto">
            {desc}
          </p>
        </div>
      </div>
    </Card>
  );
}
