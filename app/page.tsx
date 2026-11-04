import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { destinoDoErroDoLink } from "@/lib/auth/erros";
import { CartaoDeProfissional } from "@/components/publico/CartaoDeProfissional";
import { buscarProfissionais } from "@/lib/busca/buscar";
import type { Cartao } from "@/lib/busca/tipos";
import {
  Building2,
  Home as HomeIcon,
  Video,
  Search,
  ArrowRight,
  ShieldCheck,
  MessageCircle,
  BarChart3,
  ClipboardList,
  Dog,
  Stethoscope,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

// Home pública (landing do consumidor) — fiel ao vetria-visualizador-v2.html.
// Honesto (DL-020/DL-034): a home promete só o que existe em 25/11 (buscar,
// comparar especialidade e forma de atendimento, falar pelo WhatsApp). Agenda,
// avaliações, valores e disponibilidade estão fora do escopo (T-054).
// "Perfis na Vetria" lê os perfis ativos pelo mesmo caminho anônimo da
// /buscar; sem perfil, mostra um vazio honesto, nunca skeleton eterno.
// Deslogado vê a Home; logado vai direto pro painel (/app).

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Link de email que falhou (expirado, já usado) cai aqui com ?error=... do
  // Supabase quando o redirectTo não é aceito. Sem isto a pessoa via a home
  // sem nenhuma explicação.
  const sp = await searchParams;
  const um = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v ?? null;
  const destinoDoErro = destinoDoErroDoLink({
    error: um(sp.error),
    error_code: um(sp.error_code),
  });
  if (destinoDoErro) redirect(destinoDoErro);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (userData.user) redirect("/app");

  // Mesma leitura anônima da /buscar (o Postgres decide quem é visível).
  // Falha ou banco sem a 0005 caem no vazio honesto da seção.
  const vitrine = await buscarProfissionais({
    termo: null,
    cidade: null,
    uf: null,
    especialidade: null,
    servico: null,
    atendimento: null,
    tipo: null,
    pagina: 1,
  });
  const perfis = vitrine.estado === "ok" ? vitrine.itens.slice(0, 4) : [];

  return (
    <div className="bg-white">
      <PublicHeader />
      <Hero />
      <Categories />
      <ComoFunciona />
      <PerfisNaVetria perfis={perfis} />
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
          <a href="#vet-cta" className="no-underline hover:text-principal">
            Sou estabelecimento
          </a>
          <a href="#blog" className="no-underline hover:text-principal">
            Informativos
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
  // As abas viram o filtro `atendimento` da /buscar. "Todos" é o padrão:
  // qualquer aba marcada tira os estabelecimentos da lista (só veterinário
  // tem forma de atendimento), então nenhuma delas pode vir marcada sozinha.
  const tabs = [
    { icon: null, label: "Todos", valor: "" },
    { icon: Building2, label: "Presencial", valor: "presencial" },
    { icon: HomeIcon, label: "Domiciliar", valor: "domiciliar" },
    { icon: Video, label: "Online", valor: "teleorientacao" },
  ];
  return (
    <section className="border-b border-neutro-border bg-fundo-claro">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-pill bg-white px-3 py-1.5 text-[12px] text-corpo-texto shadow-sm">
            <strong className="font-semibold text-principal">Novidade</strong>
            Estamos de cara nova
          </span>

          <h1 className="text-[34px] font-bold leading-[1.08] tracking-tight text-titulo sm:text-[44px]">
            Encontre o veterinário certo para{" "}
            <span className="text-principal">o seu animal.</span>{" "}
            <span aria-hidden>🐶</span>
          </h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-corpo-texto">
            Busque{" "}
            <strong className="font-semibold text-titulo">
              profissionais e estabelecimentos veterinários verificados
            </strong>
            , compare especialidades e formas de atendimento e fale direto com o
            profissional pelo WhatsApp.
          </p>

          {/* Busca: formulário GET para /buscar, no contrato de lib/busca/pedido.ts.
              Funciona sem JavaScript. O texto livre procura em nome,
              especialidade, serviço, cidade e apresentação do perfil. */}
          <form
            action="/buscar"
            method="get"
            role="search"
            aria-label="Buscar veterinários e estabelecimentos"
            className="mt-7 rounded-2xl bg-white p-3 shadow-md"
          >
            <fieldset className="mb-3">
              <legend className="sr-only">Forma de atendimento</legend>
              <div className="flex flex-wrap gap-2">
                {tabs.map((t) => (
                  <label
                    key={t.label}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill bg-neutro-bg-alt px-3 py-1.5 text-[13px] font-medium text-corpo-texto transition has-[:checked]:bg-principal has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-principal/40 has-[:focus-visible]:ring-offset-1"
                  >
                    <input
                      type="radio"
                      name="atendimento"
                      value={t.valor}
                      defaultChecked={t.valor === ""}
                      className="sr-only"
                    />
                    {t.icon && <t.icon size={14} aria-hidden />}
                    {t.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="home-busca-q" className="sr-only">
                O que você procura
              </label>
              <input
                id="home-busca-q"
                name="q"
                type="search"
                maxLength={80}
                placeholder="Nome, especialidade ou serviço"
                className="flex-1 rounded-pill border border-neutro-border bg-neutro-bg-alt/50 px-4 py-3 text-[14px] text-titulo outline-none transition placeholder:text-corpo-texto/60 focus:border-principal focus:bg-white focus:ring-2 focus:ring-principal/20"
              />
              <label htmlFor="home-busca-cidade" className="sr-only">
                Cidade
              </label>
              <input
                id="home-busca-cidade"
                name="cidade"
                type="text"
                maxLength={60}
                autoComplete="address-level2"
                placeholder="Cidade ou região"
                className="flex-1 rounded-pill border border-neutro-border bg-neutro-bg-alt/50 px-4 py-3 text-[14px] text-titulo outline-none transition placeholder:text-corpo-texto/60 focus:border-principal focus:bg-white focus:ring-2 focus:ring-principal/20 sm:max-w-[40%]"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-pill bg-principal px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-principal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2"
              >
                Pesquisar
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </form>
        </div>

        {/* Painel decorativo (sem foto stock — honesto) */}
        <div className="hidden aspect-[4/3] items-center justify-center rounded-3xl bg-principal lg:flex">
          <Dog size={120} strokeWidth={1} className="text-white/30" />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Categorias (atalhos para a busca) ---------------- */
// Cada chip é um filtro que a /buscar entende: slug de `especialidades` ou de
// `servicos` (seed da 0005) ou uma forma de atendimento. Item que não é filtro
// real não entra aqui, para não levar a uma busca que ignora o pedido.
function Categories() {
  const chips: { label: string; href: string }[] = [
    { label: "Clínica geral", href: "/buscar?especialidade=clinica-geral" },
    { label: "Emergência 24h", href: "/buscar?servico=emergencia-24h" },
    { label: "Cardiologia", href: "/buscar?especialidade=cardiologia" },
    { label: "Dermatologia", href: "/buscar?especialidade=dermatologia" },
    { label: "Animais exóticos", href: "/buscar?especialidade=animais-exoticos" },
    { label: "Felinos", href: "/buscar?especialidade=felinos" },
    { label: "Domiciliar", href: "/buscar?atendimento=domiciliar" },
    { label: "Teleorientação", href: "/buscar?atendimento=teleorientacao" },
    { label: "Cirurgia", href: "/buscar?especialidade=cirurgia" },
    { label: "Vacinação", href: "/buscar?servico=vacinacao" },
    { label: "Laboratório", href: "/buscar?servico=laboratorio" },
    { label: "Diagnóstico por imagem", href: "/buscar?servico=diagnostico-por-imagem" },
    { label: "Internação", href: "/buscar?servico=internacao" },
  ];
  return (
    <section className="border-b border-neutro-border bg-white">
      <nav aria-label="Atalhos da busca" className="mx-auto max-w-6xl px-5 py-6">
        <ul className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <li key={c.label}>
              <Link
                href={c.href}
                className="inline-block rounded-pill border border-neutro-border bg-neutro-bg-alt/50 px-3.5 py-1.5 text-[13px] text-corpo-texto no-underline transition hover:border-principal hover:text-principal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
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
      desc: "Veja especialidades, cidade e forma de atendimento de cada perfil.",
    },
    {
      icon: MessageCircle,
      title: "Entre em contato",
      desc: "Fale direto com o profissional pelo WhatsApp.",
    },
  ];
  return (
    <section id="como-funciona" className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-[28px] font-bold tracking-tight text-titulo sm:text-[32px]">
          Cuidar do seu animal ficou{" "}
          <span className="text-principal">mais simples.</span>
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-[15px] text-corpo-texto">
          Em 3 passos você encontra o veterinário certo e fala direto com ele.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
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

/* ---------------- Perfis na Vetria (dado real ou vazio honesto) ---------------- */
function PerfisNaVetria({ perfis }: { perfis: Cartao[] }) {
  return (
    <section className="border-y border-neutro-border bg-neutro-bg-alt/40">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-[24px] font-bold tracking-tight text-titulo sm:text-[28px]">
          Perfis na Vetria
        </h2>

        {perfis.length > 0 ? (
          <>
            <p className="mt-1 text-[14px] text-corpo-texto">
              Veterinários e estabelecimentos conferidos pela equipe Vetria.
            </p>
            <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {perfis.map((c) => (
                <li key={`${c.tipo}-${c.slug}`}>
                  <CartaoDeProfissional cartao={c} />
                </li>
              ))}
            </ul>
            <Link
              href="/buscar"
              className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-principal no-underline underline-offset-4 hover:underline"
            >
              Ver todos na busca
              <ArrowRight size={16} aria-hidden />
            </Link>
          </>
        ) : (
          <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-corpo-texto">
            Os primeiros veterinários e estabelecimentos aparecem aqui assim que a
            equipe Vetria conferir os documentos de cada um.
          </p>
        )}
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
      icon: ClipboardList,
      title: "Informação clara",
      desc: "Especialidades, cidade e forma de atendimento em cada perfil.",
    },
    {
      icon: MessageCircle,
      title: "Contato direto",
      desc: "Você fala com o profissional pelo WhatsApp, sem intermediário.",
    },
  ];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-[13px] text-corpo-texto">Por que confiar na Vetria?</p>
        <h2 className="mb-8 mt-1 text-[28px] font-bold tracking-tight text-titulo sm:text-[32px]">
          Confiança vem de{" "}
          <span className="text-principal">informação clara.</span>
        </h2>

        <div className="grid gap-5 sm:grid-cols-3">
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

/* ---------------- CTA para profissionais ---------------- */
function VetCta() {
  return (
    <section id="vet-cta" className="bg-white pb-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="overflow-hidden rounded-3xl bg-principal px-8 py-12 sm:px-12">
          <span className="inline-block rounded-pill bg-white/15 px-3 py-1 text-[12px] font-medium text-white">
            Vetria para profissionais
          </span>
          <h2 className="mt-4 max-w-2xl text-[26px] font-bold leading-tight text-white sm:text-[32px]">
            Você é veterinário ou estabelecimento veterinário?
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">
            Crie seu perfil profissional na Vetria e seja encontrado por responsáveis
            que realmente buscam o seu tipo de atendimento.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/cadastro/veterinario"
              className="inline-flex items-center gap-2 rounded-pill bg-white px-6 py-3 text-[14px] font-semibold text-principal no-underline transition hover:bg-fundo-claro"
            >
              Sou veterinário
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/cadastro/estabelecimento"
              className="inline-flex items-center gap-2 rounded-pill border border-white/40 px-6 py-3 text-[14px] font-semibold text-white no-underline transition hover:bg-white/10"
            >
              Tenho um estabelecimento veterinário
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
        "Meu animal está estranho: quando é hora de procurar um veterinário?",
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
        "Como saber se um veterinário é confiável e qualificado para cuidar do seu animal",
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
          prevenir e agir no momento certo pela saúde do seu animal.
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
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
            title="Para responsáveis"
            links={[
              { label: "Entrar", href: "/login" },
              { label: "Criar conta", href: "/cadastro/responsavel" },
              { label: "Como funciona", href: "#como-funciona" },
              { label: "Informativos", href: "#blog" },
            ]}
          />
          <FooterCol
            title="Para profissionais"
            links={[
              { label: "Sou veterinário", href: "/cadastro/veterinario" },
              { label: "Tenho um estabelecimento veterinário", href: "/cadastro/estabelecimento" },
              { label: "Como funciona", href: "#vet-cta" },
            ]}
          />
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
