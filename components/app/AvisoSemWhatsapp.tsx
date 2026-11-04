import Link from "next/link";
import { ArrowRight, CircleAlert, Mail } from "lucide-react";

// T-046 / DL-071 D9: o aviso para o profissional sem WhatsApp.
//
// Perfil sem WhatsApp aparece na busca e não gera contato: o botão do perfil
// público some (`sem_whatsapp` em `/api/contato`) e o profissional acha que a
// Vetria não funciona (R-036 item 1). Desde a T-046 o onboarding não conclui
// sem número, mas quem foi aprovado ANTES pode estar no ar sem ele.
//
// Quem decide se o aviso aparece é o Server Component, lendo a linha do próprio
// dono (`lib/contato/semWhatsapp.ts`). Este componente só desenha, e não recebe
// o número: o aviso precisa de um sim ou não, nunca do dado.
//
// ⚠️ O caminho de correção depende do status, e é por isso que há duas versões:
//   · `active` não alcança `/onboarding` (matriz §4, `lib/auth/status.ts`), e
//     o editor do perfil é a T-019, que não existe. Hoje o único caminho honesto
//     é o email do suporte, o mesmo que `PreviaDoPerfil` já oferece a quem está
//     no ar. Apontar o link para o onboarding seria um link que volta para o
//     painel sem explicar nada.
//   · `pending_validation` alcança o cadastro (DL-046) e corrige por lá.

const EMAIL_DO_SUPORTE = "contato@vetriabrasil.com.br";

const botao =
  "inline-flex items-center justify-center gap-2 rounded-pill bg-principal px-5 py-2.5 text-[14px] font-semibold text-white no-underline transition hover:bg-principal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2";

type Tipo = "vet" | "clinic";

const TEXTOS: Record<
  Tipo,
  { ativo: string; naFila: string; onboarding: string; assunto: string }
> = {
  vet: {
    ativo:
      "Seu perfil aparece na busca, mas sem WhatsApp ninguém consegue te chamar. Complete seu contato.",
    naFila:
      "Falta o seu WhatsApp. Sem ele, ninguém consegue te chamar quando o perfil entrar na busca. Complete seu contato.",
    onboarding: "/app/veterinario/onboarding",
    assunto: "Incluir meu WhatsApp no perfil",
  },
  clinic: {
    ativo:
      "O perfil do estabelecimento aparece na busca, mas sem WhatsApp ninguém consegue chamar vocês. Complete o contato.",
    naFila:
      "Falta o WhatsApp do estabelecimento. Sem ele, ninguém consegue chamar vocês quando o perfil entrar na busca. Complete o contato.",
    onboarding: "/app/estabelecimento/onboarding",
    assunto: "Incluir o WhatsApp do estabelecimento no perfil",
  },
};

export function AvisoSemWhatsapp({
  tipo,
  podeRever,
}: {
  tipo: Tipo;
  /** O status alcança `/onboarding` pela matriz §4 (`pending_validation`). */
  podeRever: boolean;
}) {
  const t = TEXTOS[tipo];
  const mailto = `mailto:${EMAIL_DO_SUPORTE}?subject=${encodeURIComponent(t.assunto)}`;

  return (
    <div
      role="status"
      data-aviso="sem-whatsapp"
      className="flex gap-3 rounded-2xl bg-warning-soft p-4 sm:p-5"
    >
      <span className="mt-0.5 shrink-0 text-warning" aria-hidden>
        <CircleAlert size={20} />
      </span>
      <div className="min-w-0 text-[14px] leading-relaxed text-corpo-texto">
        <p className="font-semibold text-titulo">{podeRever ? t.naFila : t.ativo}</p>
        {podeRever ? (
          <>
            <p className="mt-0.5">
              O WhatsApp fica no passo 3 do cadastro.
            </p>
            <Link href={t.onboarding} className={`${botao} mt-3`}>
              Completar meu contato
              <ArrowRight size={16} aria-hidden />
            </Link>
          </>
        ) : (
          <>
            <p className="mt-0.5">
              Por enquanto, quem já está com o perfil no ar completa o contato com a equipe Vetria:
              escreva para <span className="font-medium text-titulo">{EMAIL_DO_SUPORTE}</span> com o
              número de WhatsApp, com DDD.
            </p>
            <a href={mailto} className={`${botao} mt-3`}>
              <Mail size={16} aria-hidden />
              Enviar meu WhatsApp para a equipe
            </a>
          </>
        )}
      </div>
    </div>
  );
}
