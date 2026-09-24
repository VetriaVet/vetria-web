import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, BadgeCheck, CircleAlert, MessageCircle, RotateCw, SearchX } from "lucide-react";
import { CONTATO_PELO_SITE_ABERTO } from "@/lib/perfil-publico/contato";
import { Avatar } from "./CartaoDeProfissional";
import { CascaPublica, classeDoLinkPrincipal, classeDoLinkSecundario } from "./CascaPublica";

// As peças do perfil público (/veterinario/[slug] e /estabelecimento/[slug]).
// As duas páginas usam a MESMA moldura: o que muda é o conteúdo, e um
// conserto aqui vale para as duas (R-017, clone herda defeito).
//
// ⚠️ Nada de telefone nem WhatsApp em lugar nenhum daqui (DL-047). O bloco de
// contato só conhece o texto; o número, quando existir, vem do servidor no
// clique (S8).

// Selo "Verificado pela Vetria" (DL-070). Vale para TODO perfil que aparece:
// a RLS só devolve conta `active`, e só chega a `active` quem passou pela
// validação (CRMV do vet; CNPJ e documento do estabelecimento). O texto diz
// exatamente isso e nada além: não promete nada sobre o atendimento.
const O_QUE_A_VETRIA_CONFERIU: Record<"vet" | "clinic", string> = {
  vet: "A equipe Vetria conferiu o registro profissional (CRMV) deste veterinário antes de colocar o perfil no ar.",
  clinic: "A equipe Vetria conferiu o CNPJ e o documento deste estabelecimento antes de colocar o perfil no ar.",
};

const linkDeVolta =
  "inline-flex items-center gap-1.5 rounded-sm text-[13px] font-medium text-corpo-texto no-underline transition hover:text-principal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40";

export function MolduraDoPerfil({
  tipo,
  nome,
  subtitulo,
  detalhes,
  principal,
  lateral,
}: {
  tipo: "vet" | "clinic";
  nome: string | null;
  subtitulo?: string | null;
  /** Linhas curtas embaixo do nome (local, registro, site). */
  detalhes: ReactNode;
  principal: ReactNode;
  lateral: ReactNode;
}) {
  return (
    <CascaPublica>
      <section className="border-b border-neutro-border bg-fundo-claro">
        <div className="mx-auto max-w-5xl px-5 pb-8 pt-5 sm:pb-10">
          <Link href="/buscar" className={linkDeVolta}>
            <ArrowLeft size={15} aria-hidden />
            Buscar outros profissionais
          </Link>

          <div className="mt-6 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Avatar tipo={tipo} nome={nome} tamanho="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="inline-flex rounded-pill bg-white px-3 py-1 text-[12px] font-medium text-principal shadow-sm">
                  {tipo === "vet" ? "Veterinário" : "Estabelecimento veterinário"}
                </p>
                <p
                  aria-describedby="selo-verificado-explicacao"
                  className="inline-flex items-center gap-1.5 rounded-pill bg-principal px-3 py-1 text-[12px] font-medium text-white"
                >
                  <BadgeCheck size={14} aria-hidden />
                  Verificado pela Vetria
                </p>
              </div>
              <h1
                className={`mt-2.5 break-words text-[28px] leading-tight tracking-tight sm:text-[36px] ${
                  nome ? "text-titulo" : "text-corpo-texto"
                }`}
              >
                {nome ?? "Nome não informado"}
              </h1>
              {subtitulo && <p className="mt-1 text-[15px] text-corpo-texto">{subtitulo}</p>}
              <div className="mt-3 flex flex-col gap-2 text-[14px] text-corpo-texto sm:flex-row sm:flex-wrap sm:gap-x-5">
                {detalhes}
              </div>
              <p
                id="selo-verificado-explicacao"
                className="mt-3 max-w-xl text-[13px] leading-relaxed text-corpo-texto"
              >
                {O_QUE_A_VETRIA_CONFERIU[tipo]}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-5 px-5 py-8 sm:py-10 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">{principal}</div>
        <aside className="lg:sticky lg:top-20">{lateral}</aside>
      </div>
    </CascaPublica>
  );
}

/** Uma linha de detalhe com ícone, embaixo do nome. */
export function Detalhe({ icone, children }: { icone: ReactNode; children: ReactNode }) {
  return (
    <p className="flex items-start gap-1.5">
      <span className="mt-0.5 shrink-0 text-principal" aria-hidden>
        {icone}
      </span>
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

export function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  const id = `secao-${titulo.toLowerCase().normalize("NFD").replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-neutro-border bg-white p-5 sm:p-6">
      <h2 id={id} className="text-[17px] font-bold text-titulo">
        {titulo}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Texto livre escrito pelo profissional: quebras de linha mantidas, nada de HTML. */
export function TextoLivre({ texto }: { texto: string }) {
  return (
    <p className="whitespace-pre-line break-words text-[15px] leading-relaxed text-corpo-texto">
      {texto}
    </p>
  );
}

export function Etiquetas({ itens, rotulo }: { itens: string[]; rotulo: string }) {
  return (
    <ul aria-label={rotulo} className="flex flex-wrap gap-2">
      {itens.map((i) => (
        <li
          key={i}
          className="rounded-pill bg-fundo-destaque px-3 py-1.5 text-[13px] font-medium text-principal"
        >
          {i}
        </li>
      ))}
    </ul>
  );
}

/**
 * O contato, enquanto a S8 não existe: diz que abre em breve e NÃO desenha
 * botão. Botão que não faz nada é promessa falsa com cara de função.
 */
export function BlocoDeContato({ tipo }: { tipo: "vet" | "clinic" }) {
  const quem = tipo === "vet" ? "este veterinário" : "este estabelecimento";
  return (
    <section
      aria-labelledby="titulo-contato"
      className="rounded-2xl border border-neutro-border bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 id="titulo-contato" className="text-[17px] font-bold text-titulo">
        Contato
      </h2>
      <div className="mt-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fundo-destaque text-principal">
          <MessageCircle size={19} aria-hidden />
        </span>
        {CONTATO_PELO_SITE_ABERTO ? (
          // S8: o botão entra aqui, com a rota que registra o contato e só
          // então devolve o número (DL-047). Até lá esta ponta não é usada.
          <p className="text-[14px] leading-relaxed text-corpo-texto">
            Fale com {quem} pelo WhatsApp.
          </p>
        ) : (
          <div>
            <p className="text-[15px] font-semibold text-titulo">
              O contato pelo WhatsApp abre em breve.
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-corpo-texto">
              Quando abrir, você vai poder chamar {quem} direto desta página.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/** O banco não respondeu. Não é 404: o perfil pode existir. */
export function PerfilComErro({ tentarDeNovo }: { tentarDeNovo: string }) {
  return (
    <CascaPublica>
      <div className="mx-auto max-w-xl px-5 py-16">
        <div role="alert" className="rounded-2xl border border-error/30 bg-white p-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error-soft text-error">
            <CircleAlert size={22} aria-hidden />
          </span>
          <h1 className="text-[20px] font-bold text-titulo">Não conseguimos abrir este perfil agora</h1>
          <p className="mx-auto mt-1.5 max-w-sm text-[14px] leading-relaxed text-corpo-texto">
            A falha foi do nosso lado. Tente de novo em alguns instantes.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href={tentarDeNovo} className={classeDoLinkPrincipal}>
              <RotateCw size={16} aria-hidden />
              Tentar de novo
            </Link>
            <Link href="/buscar" className={classeDoLinkSecundario}>
              Ir para a busca
            </Link>
          </div>
        </div>
      </div>
    </CascaPublica>
  );
}

/**
 * Slug que não existe OU conta que não está no ar: a mesma frase para os
 * dois, de propósito. Dizer "está em análise" contaria a um estranho que a
 * conta existe.
 */
export function PerfilNaoEncontrado() {
  return (
    <CascaPublica>
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-fundo-claro text-corpo-texto">
          <SearchX size={26} aria-hidden />
        </span>
        <h1 className="text-[24px] font-bold text-titulo">Este perfil não está disponível</h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-corpo-texto">
          O endereço pode ter sido digitado errado, ou o perfil não está mais no ar.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/buscar" className={classeDoLinkPrincipal}>
            Buscar profissionais
          </Link>
          <Link href="/" className={classeDoLinkSecundario}>
            Voltar ao início
          </Link>
        </div>
      </div>
    </CascaPublica>
  );
}
