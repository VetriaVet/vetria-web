import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Clock,
  ExternalLink,
  FilePen,
  Info,
  RotateCw,
  UserRoundX,
} from "lucide-react";
import type { StatusUsuario } from "@/lib/auth/status";

// A tela `/perfil` do painel (vet e estabelecimento): a PRÉVIA do perfil
// público, só leitura (F4/S7, E5). A prévia em si é o componente da página
// pública (`components/publico/Perfil.tsx`), que chega pronto em `children`.
// Aqui fica só o que é do painel: o estado da conta, o que falta, e o caminho
// para mudar alguma coisa.
//
// ⚠️ NÃO HÁ EDITOR AQUI. A edição do perfil é a T-019 (F6/S11, DL-056). O
// formulário que morava nesta tela não lia o banco nem salvava, e foi tirado:
// ele fazia a pessoa achar que estava mudando o perfil. Quem está na fila muda
// os dados pelo cadastro (`/onboarding`, DL-046); quem já está no ar, por
// enquanto, pelo email do suporte.
//
// Status que chegam aqui: `pending_validation` e `active` (ESPERANDO_OU_ATIVO,
// matriz §4). O reprovado volta para `incomplete` e é mandado para o cadastro
// pelo middleware antes de ver esta tela; por isso não há ramo para ele.

const EMAIL_DO_SUPORTE = "contato@vetriabrasil.com.br";

const botaoPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-pill bg-principal px-5 py-2.5 text-[14px] font-semibold text-white no-underline transition hover:bg-principal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2";

const linkDeTexto =
  "inline-flex items-center gap-1 rounded-sm font-semibold text-principal underline underline-offset-4 hover:text-principal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40";

type Tipo = "vet" | "clinic";

type Estado =
  | { estado: "ok"; slug: string | null; faltando: string[] }
  | { estado: "sem_perfil" }
  | { estado: "erro" };

const TEXTOS: Record<
  Tipo,
  { titulo: string; sub: string; base: string; publico: string; onboarding: string }
> = {
  vet: {
    titulo: "Meu perfil público",
    sub: "Veja exatamente o que os responsáveis encontram quando abrem o seu perfil na Vetria.",
    base: "/app/veterinario/perfil",
    publico: "/veterinario/",
    onboarding: "/app/veterinario/onboarding",
  },
  clinic: {
    titulo: "Perfil público do estabelecimento",
    sub: "Veja exatamente o que os responsáveis encontram quando abrem o perfil do estabelecimento na Vetria.",
    base: "/app/estabelecimento/perfil",
    publico: "/estabelecimento/",
    onboarding: "/app/estabelecimento/onboarding",
  },
};

/** "a, b e c" */
function listar(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

function Aviso({
  tom,
  icone,
  children,
  role,
}: {
  tom: "info" | "ok" | "atencao" | "erro";
  icone: ReactNode;
  children: ReactNode;
  role?: "status" | "alert";
}) {
  const { fundo, cor } = {
    info: { fundo: "bg-fundo-destaque", cor: "text-principal" },
    ok: { fundo: "bg-success-soft", cor: "text-success" },
    atencao: { fundo: "bg-warning-soft", cor: "text-warning" },
    erro: { fundo: "bg-error-soft", cor: "text-error" },
  }[tom];
  return (
    <div role={role} className={`flex gap-3 rounded-2xl p-4 sm:p-5 ${fundo}`}>
      <span className={`mt-0.5 shrink-0 ${cor}`} aria-hidden>
        {icone}
      </span>
      <div className="min-w-0 text-[14px] leading-relaxed text-corpo-texto">{children}</div>
    </div>
  );
}

export function PreviaDoPerfil({
  tipo,
  status,
  podeRever,
  carregada,
  children,
}: {
  tipo: Tipo;
  status: StatusUsuario;
  /** O status alcança `/onboarding` pela matriz §4 (lista de `lib/auth/status.ts`). */
  podeRever: boolean;
  carregada: Estado;
  /** A prévia desenhada com o componente da página pública. */
  children: ReactNode;
}) {
  const t = TEXTOS[tipo];
  const ativo = status === "active";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-titulo">{t.titulo}</h1>
        <p className="mt-1 max-w-2xl text-[14px] text-corpo-texto">{t.sub}</p>
      </div>

      {carregada.estado === "erro" && (
        <Aviso tom="erro" role="alert" icone={<CircleAlert size={20} />}>
          <p className="font-semibold text-titulo">Não conseguimos carregar a prévia agora.</p>
          <p className="mt-0.5">A falha foi do nosso lado. Tente de novo em alguns instantes.</p>
          <Link href={t.base} className={`${botaoPrincipal} mt-3`}>
            <RotateCw size={16} aria-hidden />
            Tentar de novo
          </Link>
        </Aviso>
      )}

      {carregada.estado === "sem_perfil" && (
        <div className="rounded-2xl border border-neutro-border bg-white p-6 text-center sm:p-8">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-fundo-claro text-corpo-texto">
            <UserRoundX size={22} aria-hidden />
          </span>
          <h2 className="text-[18px] font-bold text-titulo">Ainda não há dados para mostrar</h2>
          {podeRever ? (
            <>
              <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-relaxed text-corpo-texto">
                A prévia é montada com o que você preenche no cadastro, e o cadastro ainda não foi
                salvo até o fim.
              </p>
              <Link href={t.onboarding} className={`${botaoPrincipal} mt-5`}>
                Ir para o cadastro
                <ArrowRight size={16} aria-hidden />
              </Link>
            </>
          ) : (
            <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-relaxed text-corpo-texto">
              Não encontramos os dados do perfil desta conta. Escreva para{" "}
              <a href={`mailto:${EMAIL_DO_SUPORTE}`} className={linkDeTexto}>
                {EMAIL_DO_SUPORTE}
              </a>{" "}
              que a gente resolve.
            </p>
          )}
        </div>
      )}

      {carregada.estado === "ok" && (
        <>
          {/* O estado da conta, antes da prévia: quem abre esta tela precisa
              saber primeiro se o responsável já está vendo isto ou não. */}
          {!ativo && (
            <Aviso tom="info" role="status" icone={<Clock size={20} />}>
              <p className="font-semibold text-titulo">
                É assim que o seu perfil vai aparecer depois da validação.
              </p>
              <p className="mt-0.5">Ainda não está visível para os responsáveis.</p>
            </Aviso>
          )}

          {ativo && carregada.slug && (
            <Aviso tom="ok" role="status" icone={<CircleCheck size={20} />}>
              <p className="font-semibold text-titulo">
                {tipo === "vet"
                  ? "Seu perfil está no ar e aparece na busca."
                  : "O perfil do estabelecimento está no ar e aparece na busca."}
              </p>
              <p className="mt-0.5">
                Endereço público:{" "}
                <span className="break-all font-medium text-titulo">
                  {t.publico}
                  {carregada.slug}
                </span>
              </p>
              <Link
                href={`${t.publico}${carregada.slug}`}
                target="_blank"
                rel="noopener"
                className={`${botaoPrincipal} mt-3`}
              >
                Abrir meu perfil público
                <ExternalLink size={15} aria-hidden />
                <span className="sr-only">(abre em outra aba)</span>
              </Link>
            </Aviso>
          )}

          {ativo && !carregada.slug && (
            <Aviso tom="atencao" role="status" icone={<CircleAlert size={20} />}>
              <p className="font-semibold text-titulo">
                A conta foi aprovada, mas o endereço público ainda não foi criado.
              </p>
              <p className="mt-0.5">
                Por isso o perfil ainda não abre para os responsáveis. Escreva para{" "}
                <a href={`mailto:${EMAIL_DO_SUPORTE}`} className={linkDeTexto}>
                  {EMAIL_DO_SUPORTE}
                </a>{" "}
                que a gente resolve.
              </p>
            </Aviso>
          )}

          {carregada.faltando.length > 0 && (
            <Aviso tom="atencao" icone={<CircleAlert size={20} />}>
              <p className="font-semibold text-titulo">Ainda falta: {listar(carregada.faltando)}.</p>
              <p className="mt-0.5">
                {ativo
                  ? "O perfil aparece sem essas informações. Perfis completos passam mais confiança a quem procura atendimento."
                  : podeRever
                    ? "Sem essas informações o perfil fica incompleto. Você pode completar agora, pelo cadastro."
                    : "Sem essas informações o perfil fica incompleto."}
              </p>
            </Aviso>
          )}

          <section aria-labelledby="titulo-da-previa" className="flex flex-col gap-2">
            <h2
              id="titulo-da-previa"
              className="text-[12px] font-semibold uppercase tracking-wider text-corpo-texto"
            >
              Prévia: como o responsável vê
            </h2>
            <div className="overflow-hidden rounded-2xl border border-neutro-border shadow-sm">
              {children}
            </div>
          </section>

          <Aviso tom="info" icone={<Info size={20} />}>
            <p className="font-semibold text-titulo">Quer mudar alguma informação?</p>
            {podeRever ? (
              <>
                <p className="mt-0.5">
                  Tudo o que aparece aqui vem do seu cadastro. Mude pelo cadastro, e a prévia mostra a
                  versão nova assim que você salvar. Mudar os dados que a equipe está conferindo pode
                  fazer a validação recomeçar.
                </p>
                <Link href={t.onboarding} className={`${linkDeTexto} mt-2`}>
                  <FilePen size={15} aria-hidden />
                  Rever e corrigir o cadastro
                </Link>
              </>
            ) : (
              <p className="mt-0.5">
                A edição do perfil pelo painel ainda não está disponível. Se precisar corrigir algo
                agora, escreva para{" "}
                <a href={`mailto:${EMAIL_DO_SUPORTE}`} className={linkDeTexto}>
                  {EMAIL_DO_SUPORTE}
                </a>
                .
              </p>
            )}
          </Aviso>
        </>
      )}
    </div>
  );
}
