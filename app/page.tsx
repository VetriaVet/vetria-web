import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/EmptyState";
import {
  ChevronRight,
  Building2,
  Home as HomeIcon,
  Video,
  Search,
  ArrowRight,
  ShieldCheck,
  Star,
  CalendarCheck,
  MessageCircle,
  BarChart3,
  Dog,
  Stethoscope,
  BadgeCheck,
  Mail,
  type LucideIcon,
} from "lucide-react";

// Home pública (landing do consumidor) — fiel ao vetria-visualizador-v2.html.
// Honesto (DL-020/DL-034): a busca fica desabilitada (módulo de busca é fase
// futura) e "Novos perfis" usa cards GHOST (sem profissional inventado).
// Deslogado vê a Home; logado vai direto pro painel (/app).

export default async function Home() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) redirect("/app");

  return (
    <div className="bg-white">
      <PublicHeader />
      <Hero />
      <Categories />
      <ComoFunciona />
      <NovosPerfis />
      <Confianca />
      <VetCta />
      <Blog />
      <PublicFooter />
    </div>
  );
}

/* ---------------- Header ---------------- */
function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutro-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Image
            src="/vetria/logo-vetria-fundo-claro.svg"
            alt="Vetria"
            width={178}
            height={29}
            className="h-7 w-auto"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 text-[14px] font-medium text-corpo-texto md:flex">
          <Link href="/" className="text-principal no-underline">
            Início
          </Link>
          <a href="#como-funciona" className="no-underline hover:text-principal">
            Como funciona
          </a>
          <a href="#vet-cta" className="no-underline hover:text-principal">
            Sou veterinário
          </a>
          <a href="#blog" className="no-underline hover:text-principal">
            Blog
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-pill border-[1.5px] border-principal px-4 py-2 text-[13px] font-semibold text-principal no-underline transition hover:bg-principal hover:text-white"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="hidden rounded-pill bg-principal px-4 py-2 text-[13px] font-semibold text-white no-underline transition hover:bg-principal-deep sm:inline-block"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Hero + busca ---------------- */
function Hero() {
  const tabs = [
    { icon: Building2, label: "Presencial", active: true },
    { icon: HomeIcon, label: "Domiciliar", active: false },
    { icon: Video, label: "Online", active: false },
  ];
  return (
    <section className="border-b border-neutro-border bg-fundo-claro">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-pill bg-white px-3 py-1.5 text-[12px] text-corpo-texto shadow-sm">
            <strong className="font-semibold text-principal">News</strong>
            Estamos de cara nova
            <ChevronRight size={14} />
          </span>

          <h1 className="text-[34px] font-bold leading-[1.08] tracking-tight text-titulo sm:text-[44px]">
            Encontre o veterinário certo para{" "}
            <span className="text-principal">o seu pet.</span>{" "}
            <span aria-hidden>🐶</span>
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-corpo-texto">
            Busque{" "}
            <strong className="font-semibold text-titulo">
              profissionais e clínicas veterinárias verificados
            </strong>
            , compare especialidades, veja disponibilidade e entre em contato
            com confiança.
          </p>

          {/* Busca — desabilitada (módulo de busca é fase futura) */}
          <div className="mt-7 rounded-2xl bg-white p-3 shadow-md">
            <div className="mb-3 flex gap-2">
              {tabs.map((t) => (
                <span
                  key={t.label}
                  className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[13px] font-medium ${
                    t.active
                      ? "bg-principal text-white"
                      : "bg-neutro-bg-alt text-corpo-texto"
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                disabled
                placeholder="Especialidade, serviço ou tipo de animal"
                className="flex-1 rounded-pill border border-neutro-border bg-neutro-bg-alt/50 px-4 py-3 text-[14px] text-titulo outline-none placeholder:text-corpo-texto/60 disabled:cursor-not-allowed"
              />
              <input
                disabled
                placeholder="Cidade ou região"
                className="flex-1 rounded-pill border border-neutro-border bg-neutro-bg-alt/50 px-4 py-3 text-[14px] text-titulo outline-none placeholder:text-corpo-texto/60 disabled:cursor-not-allowed sm:max-w-[40%]"
              />
              <span className="inline-flex items-center justify-center gap-2 rounded-pill bg-principal/40 px-6 py-3 text-[14px] font-semibold text-white">
                Pesquisar
                <ArrowRight size={16} />
              </span>
            </div>
            <p className="mt-2 pl-1 text-[11px] uppercase tracking-wider text-corpo-texto/50">
              Busca em breve
            </p>
          </div>
        </div>

        {/* Painel decorativo (sem foto stock — honesto) */}
        <div className="hidden aspect-[4/3] items-center justify-center rounded-3xl bg-principal lg:flex">
          <Dog size={120} strokeWidth={1} className="text-white/30" />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Categorias (chips visuais) ---------------- */
function Categories() {
  const rows = [
    [
      "Clínica geral",
      "Emergência 24h",
      "Cardiologia",
      "Dermatologia",
      "Exóticos",
      "Domiciliar",
      "Teleorientação",
    ],
    [
      "Castração",
      "Vacinação",
      "Exames laboratoriais",
      "Exames de imagem",
      "Ultrassom",
      "Cirurgias",
      "Raio-X",
    ],
  ];
  return (
    <section className="border-b border-neutro-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6">
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            {row.map((c) => (
              <span
                key={c}
                className="rounded-pill border border-neutro-border bg-neutro-bg-alt/50 px-3.5 py-1.5 text-[13px] text-corpo-texto"
              >
                {c}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Como funciona ---------------- */
function ComoFunciona() {
  const steps: { icon: LucideIcon; title: string; desc: string }[] = [
    {
      icon: Search,
      title: "Busque",
      desc: "Encontre veterinários por especialidade e localização.",
    },
    {
      icon: BarChart3,
      title: "Compare",
      desc: "Veja avaliações, especialidade, valores e disponibilidade.",
    },
    {
      icon: MessageCircle,
      title: "Entre em contato",
      desc: "Fale direto com o profissional ou agende online.",
    },
    {
      icon: Star,
      title: "Avalie",
      desc: "Compartilhe sua experiência após o atendimento.",
    },
  ];
  return (
    <section id="como-funciona" className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-[28px] font-bold tracking-tight text-titulo sm:text-[32px]">
          Cuidar do seu pet ficou{" "}
          <span className="text-principal">mais simples.</span>
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-[15px] text-corpo-texto">
          Em 4 passos você encontra o veterinário certo, agenda e ainda avalia o
          atendimento.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-neutro-border p-6"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fundo-destaque text-principal">
                <s.icon size={22} />
              </span>
              <div className="mb-1 font-semibold text-titulo">{s.title}</div>
              <p className="text-[13px] leading-relaxed text-corpo-texto">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Novos perfis (GHOST — sem perfil fake) ---------------- */
function NovosPerfis() {
  return (
    <section className="border-y border-neutro-border bg-neutro-bg-alt/40">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-[24px] font-bold tracking-tight text-titulo sm:text-[28px]">
          Novos perfis na Vetria
        </h2>
        <p className="mt-1 text-[14px] text-corpo-texto">
          Os primeiros veterinários e clínicas verificados aparecem aqui assim
          que forem validados.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutro-border bg-white p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="mt-2 h-2.5 w-4/5" />
              <Skeleton className="mt-5 h-9 w-full rounded-pill" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Confiança ---------------- */
function Confianca() {
  const cards: { icon: LucideIcon; title: string; desc: string }[] = [
    {
      icon: ShieldCheck,
      title: "Profissionais verificados",
      desc: "CRMV validado e dados conferidos.",
    },
    {
      icon: Star,
      title: "Avaliações reais",
      desc: "Opiniões de tutores após contato ou atendimento.",
    },
    {
      icon: CalendarCheck,
      title: "Disponibilidade visível",
      desc: "Veja dias e horários antes de entrar em contato.",
    },
    {
      icon: MessageCircle,
      title: "Contato direto",
      desc: "WhatsApp, telefone ou agendamento online.",
    },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-[13px] text-corpo-texto">Porque confiar na Vetria?</p>
        <h2 className="mb-8 mt-1 text-[28px] font-bold tracking-tight text-titulo sm:text-[32px]">
          Confiança vem de{" "}
          <span className="text-principal">informação clara.</span>
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-neutro-border p-6"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fundo-destaque text-principal">
                <c.icon size={24} />
              </span>
              <div className="mb-1 font-semibold text-titulo">{c.title}</div>
              <p className="text-[13px] leading-relaxed text-corpo-texto">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA B2B (vet/clínica) ---------------- */
function VetCta() {
  return (
    <section id="vet-cta" className="bg-white pb-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="overflow-hidden rounded-3xl bg-principal px-8 py-12 sm:px-12">
          <span className="inline-block rounded-pill bg-white/15 px-3 py-1 text-[12px] font-medium text-white">
            Vetria para profissionais
          </span>
          <h2 className="mt-4 max-w-2xl text-[26px] font-bold leading-tight text-white sm:text-[32px]">
            Você é veterinário ou clínica?
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">
            Crie seu perfil profissional na Vetria e seja encontrado por tutores
            que realmente buscam o seu tipo de atendimento.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/cadastro/vet"
              className="inline-flex items-center gap-2 rounded-pill bg-white px-6 py-3 text-[14px] font-semibold text-principal no-underline transition hover:bg-fundo-claro"
            >
              Sou veterinário
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/cadastro/clinica"
              className="inline-flex items-center gap-2 rounded-pill border border-white/40 px-6 py-3 text-[14px] font-semibold text-white no-underline transition hover:bg-white/10"
            >
              Tenho uma clínica
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Blog (conteúdo — em breve) ---------------- */
function Blog() {
  const posts: { icon: LucideIcon; tag: string; title: string }[] = [
    {
      icon: Dog,
      tag: "Comportamento",
      title:
        "Meu pet está estranho: quando é hora de procurar um veterinário?",
    },
    {
      icon: Stethoscope,
      tag: "Especialidades",
      title:
        "Emergência, clínica geral ou especialista: como escolher o atendimento certo",
    },
    {
      icon: BadgeCheck,
      tag: "Confiança",
      title:
        "Como saber se um veterinário é confiável e qualificado para cuidar do seu pet",
    },
  ];
  return (
    <section id="blog" className="border-t border-neutro-border bg-neutro-bg-alt/40">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-[28px] font-bold tracking-tight text-titulo sm:text-[32px]">
          Cuidar começa com <span className="text-principal">informação</span>
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] text-corpo-texto">
          Conteúdos criados por profissionais para ajudar você a entender,
          prevenir e agir no momento certo pela saúde do seu pet.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {posts.map((p) => (
            <div
              key={p.title}
              className="overflow-hidden rounded-2xl border border-neutro-border bg-white"
            >
              <div className="flex h-40 items-center justify-center bg-fundo-claro text-principal/40">
                <p.icon size={56} strokeWidth={1.25} />
              </div>
              <div className="p-5">
                <span className="rounded-pill bg-fundo-destaque px-2.5 py-1 text-[11px] font-medium text-principal">
                  {p.tag}
                </span>
                <h3 className="mt-3 text-[15px] font-semibold leading-snug text-titulo">
                  {p.title}
                </h3>
                <span className="mt-3 inline-block text-[12px] uppercase tracking-wider text-corpo-texto/50">
                  Em breve
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function PublicFooter() {
  return (
    <footer className="bg-principal-deep text-white">
      <div className="mx-auto max-w-6xl px-5 py-14">
        {/* Newsletter (desabilitado — sem backend) */}
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-white/[0.06] p-7 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Mail size={24} />
            <h3 className="text-[18px] font-semibold leading-tight">
              Receba novidades exclusivas no seu e-mail
            </h3>
          </div>
          <div className="flex w-full max-w-md gap-2">
            <input
              disabled
              type="email"
              placeholder="Digite seu e-mail"
              className="flex-1 rounded-pill border border-white/15 bg-white/5 px-4 py-2.5 text-[14px] text-white outline-none placeholder:text-white/40 disabled:cursor-not-allowed"
            />
            <span className="inline-flex items-center gap-2 rounded-pill bg-white/40 px-5 py-2.5 text-[13px] font-semibold text-principal">
              Cadastrar
            </span>
          </div>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Image
                src="/vetria/logo-vetria-fundo-escuro.svg"
                alt="Vetria"
                width={178}
                height={29}
                className="h-7 w-auto"
              />
            </div>
            <p className="text-[13px] leading-relaxed text-white/70">
              <strong className="mb-1.5 block text-white">Fale conosco</strong>
              contato@vetriabrasil.com.br
            </p>
          </div>

          <FooterCol
            title="Para tutores"
            links={[
              { label: "Entrar / Criar conta", href: "/login" },
              { label: "Como funciona", href: "#como-funciona" },
              { label: "Blog Vetria", href: "#blog" },
            ]}
          />
          <FooterCol
            title="Área B2B"
            links={[
              { label: "Sou veterinário", href: "/cadastro/vet" },
              { label: "Tenho uma clínica", href: "/cadastro/clinica" },
              { label: "Como funciona", href: "#vet-cta" },
            ]}
          />

          <div>
            <h5 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-white/80">
              Siga-nos
            </h5>
            <ul className="flex flex-col gap-2.5">
              {["Instagram", "Facebook", "YouTube", "LinkedIn"].map((s) => (
                <li key={s}>
                  <span className="text-[13px] text-white/70">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-[12px] text-white/50">
          Vetria · © 2026 Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h5 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-white/80">
        {title}
      </h5>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[13px] text-white/70 no-underline transition hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
