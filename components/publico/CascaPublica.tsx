import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";

// A casca das páginas públicas da F4 (/buscar, /veterinario/[slug],
// /estabelecimento/[slug]). Mesmo cabeçalho da Home em versão curta: a pessoa
// chega por link de WhatsApp e precisa reconhecer a marca e achar a busca.
// Fundo creme (nunca branco puro); cards e campos em branco por cima.
//
// Nenhum link aqui aponta para rota que não existe: /, /buscar, /login,
// /cadastro/veterinario e /cadastro/estabelecimento.

export function CascaPublica({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-fundo-claro-soft">
      <header className="sticky top-0 z-30 border-b border-neutro-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <Link
            href="/"
            className="flex items-center rounded-sm no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2"
          >
            <Image
              src="/vetria/logo-vetria-fundo-claro.svg"
              alt="Vetria, ir para o início"
              width={178}
              height={29}
              className="h-6 w-auto sm:h-7"
              priority
            />
          </Link>

          <nav aria-label="Principal" className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/buscar"
              className="inline-flex items-center gap-1.5 rounded-pill px-3 py-2 text-[13px] font-medium text-corpo-texto no-underline transition hover:text-principal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40"
            >
              <Search size={15} aria-hidden />
              Buscar
            </Link>
            <Link
              href="/login"
              className="rounded-pill border-[1.5px] border-principal px-4 py-2 text-[13px] font-semibold text-principal no-underline transition hover:bg-principal hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-neutro-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-[13px] text-corpo-texto sm:flex-row sm:items-center sm:justify-between">
          <p>Vetria · © 2026 Todos os direitos reservados</p>
          <nav aria-label="Para profissionais" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/cadastro/veterinario" className="no-underline hover:text-principal">
              Sou veterinário
            </Link>
            <Link href="/cadastro/estabelecimento" className="no-underline hover:text-principal">
              Tenho um estabelecimento veterinário
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Botão-link verde (pill) das páginas públicas. Só para rota que existe. */
export const classeDoLinkPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-pill bg-principal px-6 py-3 text-[14px] font-semibold text-white no-underline transition hover:bg-principal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2";

/** Link secundário (contorno), mesmo desenho do "Entrar" do cabeçalho. */
export const classeDoLinkSecundario =
  "inline-flex items-center justify-center gap-2 rounded-pill border-[1.5px] border-principal bg-white px-5 py-2.5 text-[13px] font-semibold text-principal no-underline transition hover:bg-principal hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2";
