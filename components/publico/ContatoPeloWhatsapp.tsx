"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { CircleAlert, Copy, Check, ExternalLink, MessageCircle, RotateCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AlvoDoContato, PedidoDeContato, RespostaDoContato } from "@/lib/perfil-publico/contato";

// T-041 · O BOTÃO "CHAMAR NO WHATSAPP" DO PERFIL PÚBLICO (DL-047, DL-071).
//
// O que amarra este arquivo:
//   1. O número NÃO está no HTML. Ele só existe no navegador depois que o
//      `POST /api/contato` respondeu `{ ok: true, whatsapp }`, e o servidor só
//      responde isso depois de gravar a linha em `contatos` (D1).
//   2. Dois toques, de propósito (desenho §1 item 3): o primeiro revela o
//      número, o segundo abre o WhatsApp. Abrir janela depois de um `await` é
//      bloqueado pelo Safari do iPhone, e quem está no computador sem WhatsApp
//      precisa do número à vista. Nada abre sozinho.
//   3. Sem pedir nome, conta ou qualquer dado antes do número. O convite para
//      criar conta vem DEPOIS, com "Agora não" visível (matriz §6.3: convite,
//      nunca portão).
//   4. Turnstile (D4, T-031): o widget ainda não existe. `pedirTokenDoTurnstile`
//      é o ponto onde o token entra no corpo (`turnstile`). Hoje devolve nulo e
//      não carrega script de terceiro nenhum.

/** D7: curta, e diz ao profissional de onde veio o cliente. */
const MENSAGEM_PADRAO = "Olá! Encontrei seu perfil na Vetria e gostaria de mais informações.";

/** O formato que o gerador de slug produz (DL-067); o resto vira nulo. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** O contrato de `lib/contato/whatsapp.ts`: DDD + número, sem o 55. */
const WHATSAPP = /^\d{10,11}$/;

type Falha = Extract<RespostaDoContato, { ok: false }>["motivo"];

type Estado =
  | { fase: "inicial" }
  | { fase: "enviando" }
  | { fase: "revelado"; whatsapp: string }
  | { fase: "falhou"; motivo: Falha };

/**
 * O ponto do Turnstile (T-031). Quando o widget invisível existir, ele roda
 * aqui e devolve o token, que vai no campo `turnstile` do corpo. Até lá: nulo,
 * e a rota não exige (TURNSTILE_NO_CONTATO = false em lib/contato/turnstile.ts).
 */
async function pedirTokenDoTurnstile(): Promise<string | null> {
  return null;
}

/** A origem da busca, se o endereço do perfil a trouxer. Fora do formato, nula. */
function origemDaUrl(): PedidoDeContato["origem"] {
  const busca = new URLSearchParams(window.location.search);
  const ler = (chave: string) => {
    const v = busca.get(chave);
    return v && v.length <= 120 && SLUG.test(v) ? v : null;
  };
  return { cidade: ler("cidade"), especialidade: ler("especialidade") };
}

/** A resposta só vale se tiver exatamente o formato combinado. */
function lerResposta(dado: unknown): RespostaDoContato | null {
  if (typeof dado !== "object" || dado === null) return null;
  const d = dado as Record<string, unknown>;
  if (d.ok === true && typeof d.whatsapp === "string" && WHATSAPP.test(d.whatsapp)) {
    return { ok: true, whatsapp: d.whatsapp };
  }
  const motivos: Falha[] = [
    "nao_encontrado",
    "sem_whatsapp",
    "muitas_tentativas",
    "verificacao_recusada",
    "indisponivel",
  ];
  if (d.ok === false && motivos.includes(d.motivo as Falha)) {
    return { ok: false, motivo: d.motivo as Falha };
  }
  return null;
}

/** `63991234567` vira `(63) 99123-4567`; `6332145678` vira `(63) 3214-5678`. */
export function formatarWhatsapp(d: string): string {
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  const corte = resto.length === 9 ? 5 : 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}

const classeDoBotaoSecundario =
  "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-pill border-[1.5px] border-principal bg-white px-5 py-2.5 text-[14px] font-semibold text-principal transition hover:bg-principal hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2";

const classeDoLinkWhatsapp =
  "inline-flex min-h-[51px] w-full items-center justify-center gap-2 rounded-pill bg-principal px-6 py-3.5 text-[15px] font-semibold text-white no-underline transition hover:bg-principal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2";

export function ContatoPeloWhatsapp({
  alvo,
  convidarParaConta,
}: {
  alvo: AlvoDoContato;
  /** Falso quando já há sessão no navegador: não faz sentido "crie sua conta". */
  convidarParaConta: boolean;
}) {
  const [estado, setEstado] = useState<Estado>({ fase: "inicial" });
  const [copiado, setCopiado] = useState<"nao" | "sim" | "falhou">("nao");
  const [convite, setConvite] = useState(convidarParaConta);
  const numeroRef = useRef<HTMLParagraphElement>(null);

  const deQuem = alvo.tipo === "vet" ? "deste veterinário" : "deste estabelecimento";
  const Quem = alvo.tipo === "vet" ? "Este veterinário" : "Este estabelecimento";

  async function chamar() {
    if (estado.fase === "enviando") return;
    setEstado({ fase: "enviando" });
    setCopiado("nao");

    let proximo: Estado;
    try {
      const turnstile = await pedirTokenDoTurnstile();
      const corpo: PedidoDeContato & { turnstile?: string } = {
        alvo,
        origem: origemDaUrl(),
        canal: "whatsapp",
        ...(turnstile ? { turnstile } : {}),
      };
      const r = await fetch("/api/contato", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(corpo),
        credentials: "same-origin",
        cache: "no-store",
      });
      const resposta = lerResposta(await r.json().catch(() => null));
      if (!resposta) proximo = { fase: "falhou", motivo: "indisponivel" };
      else if (resposta.ok) proximo = { fase: "revelado", whatsapp: resposta.whatsapp };
      else proximo = { fase: "falhou", motivo: resposta.motivo };
    } catch {
      // Sem rede, ou a rota não respondeu: para quem está na tela, é a mesma coisa.
      proximo = { fase: "falhou", motivo: "indisponivel" };
    }

    setEstado(proximo);
    if (proximo.fase === "revelado") {
      // O foco vai para o número: quem usa teclado ou leitor de tela continua
      // dali para "Abrir no WhatsApp", sem voltar ao topo.
      requestAnimationFrame(() => numeroRef.current?.focus());
    }
  }

  async function copiar(whatsapp: string) {
    try {
      await navigator.clipboard.writeText(formatarWhatsapp(whatsapp));
      setCopiado("sim");
    } catch {
      setCopiado("falhou");
    }
  }

  // O que o leitor de tela anuncia. A região existe desde o primeiro desenho
  // (região criada junto com o texto não é lida por todos os leitores); as
  // falhas, além disso, saem em `role="alert"`.
  const anuncio =
    estado.fase === "enviando"
      ? "Buscando o número."
      : estado.fase === "revelado"
        ? `WhatsApp ${deQuem}:${formatarWhatsapp(estado.whatsapp)}.`
        : estado.fase === "falhou" && estado.motivo === "sem_whatsapp"
          ? `${Quem} ainda não informou um WhatsApp para contato.`
          : "";

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {anuncio}
      </p>
      {desenhar()}
    </>
  );

  function desenhar(): ReactNode {
  // ---- REVELADO -----------------------------------------------------------
  if (estado.fase === "revelado") {
    const link = `https://wa.me/55${estado.whatsapp}?text=${encodeURIComponent(MENSAGEM_PADRAO)}`;
    return (
      <div className="mt-4">
        <div className="rounded-xl bg-fundo-destaque px-4 py-3.5">
          <p className="text-[13px] font-medium text-corpo-texto">WhatsApp {deQuem}</p>
          <p
            ref={numeroRef}
            tabIndex={-1}
            className="mt-0.5 rounded-sm text-[22px] font-bold tracking-tight text-titulo tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40"
          >
            {formatarWhatsapp(estado.whatsapp)}
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <a href={link} target="_blank" rel="noopener noreferrer" className={classeDoLinkWhatsapp}>
            <MessageCircle size={18} aria-hidden />
            Abrir no WhatsApp
            <ExternalLink size={14} aria-hidden className="opacity-80" />
            <span className="sr-only">(abre em outra aba)</span>
          </a>
          <button type="button" onClick={() => copiar(estado.whatsapp)} className={classeDoBotaoSecundario}>
            {copiado === "sim" ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
            {copiado === "sim" ? "Número copiado" : "Copiar número"}
          </button>
          <p aria-live="polite" className="min-h-0 text-[12px] leading-relaxed text-corpo-texto">
            {copiado === "falhou" && "Não foi possível copiar. Selecione o número acima e copie."}
          </p>
        </div>

        <p className="mt-1 text-[12px] leading-relaxed text-corpo-texto">
          A mensagem já vai escrita: &ldquo;{MENSAGEM_PADRAO}&rdquo; Você pode mudar antes de enviar.
        </p>

        {convite && (
          <div className="mt-4 border-t border-neutro-border pt-4">
            <p className="text-[14px] font-semibold text-titulo">Quer acompanhar seus contatos?</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-corpo-texto">
              Crie sua conta de responsável e encontre aqui quem você já chamou.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href="/cadastro/responsavel"
                className="inline-flex items-center gap-1.5 rounded-pill bg-white px-4 py-2 text-[13px] font-semibold text-principal no-underline ring-1 ring-principal transition hover:bg-principal hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2"
              >
                <UserPlus size={15} aria-hidden />
                Criar minha conta
              </Link>
              <button
                type="button"
                onClick={() => setConvite(false)}
                className="rounded-pill px-3 py-2 text-[13px] font-medium text-corpo-texto transition hover:text-principal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40"
              >
                Agora não
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- ESTADOS EM QUE O BOTÃO SAI DA TELA -----------------------------------
  if (estado.fase === "falhou" && estado.motivo === "sem_whatsapp") {
    // D9: sem número, sem botão. Dizer a verdade, sem culpar ninguém.
    return (
      <p className="mt-4 rounded-xl bg-neutro-bg-alt px-4 py-3 text-[14px] leading-relaxed text-corpo-texto">
        {Quem} ainda não informou um WhatsApp para contato.
      </p>
    );
  }

  if (estado.fase === "falhou" && estado.motivo === "nao_encontrado") {
    return (
      <div role="alert" className="mt-4 rounded-xl bg-neutro-bg-alt px-4 py-3">
        <p className="text-[14px] font-semibold text-titulo">Este perfil não está mais disponível.</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-corpo-texto">
          Ele pode ter saído do ar há pouco. Procure outro profissional na busca.
        </p>
        <Link
          href="/buscar"
          className="mt-2 inline-flex rounded-sm text-[13px] font-semibold text-principal underline underline-offset-4 hover:text-principal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40"
        >
          Ir para a busca
        </Link>
      </div>
    );
  }

  // ---- INICIAL, ENVIANDO E AS FALHAS QUE DEIXAM TENTAR DE NOVO ---------------
  const enviando = estado.fase === "enviando";
  const falha = estado.fase === "falhou" ? estado.motivo : null;

  return (
    <div className="mt-4">
      {falha === "verificacao_recusada" ? (
        <Button onClick={() => window.location.reload()}>
          <RotateCw size={17} aria-hidden />
          Recarregar a página
        </Button>
      ) : (
        <Button onClick={chamar} loading={enviando} aria-describedby="contato-transparencia">
          <MessageCircle size={18} aria-hidden />
          Chamar no WhatsApp
        </Button>
      )}

      {falha && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-error-soft px-3.5 py-3">
          <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0 text-error" />
          <p className="text-[13px] leading-relaxed text-titulo">{TEXTO_DA_FALHA[falha]}</p>
        </div>
      )}

      {/* D2: a transparência do cookie, uma linha sob o botão. */}
      <p id="contato-transparencia" className="mt-3 text-[12px] leading-relaxed text-corpo-texto">
        Registramos este contato para o profissional saber quantas pessoas o procuraram e para evitar
        abuso.
      </p>
    </div>
  );
  }
}

// `sem_whatsapp` e `nao_encontrado` têm tela própria (o botão sai); o texto
// aqui é só para o tipo ficar completo.
const TEXTO_DA_FALHA: Record<Falha, string> = {
  sem_whatsapp: "Este perfil ainda não informou um WhatsApp para contato.",
  nao_encontrado: "Este perfil não está mais disponível.",
  muitas_tentativas:
    "Você abriu muitos contatos em pouco tempo. Espere alguns minutos e tente de novo.",
  verificacao_recusada:
    "Não conseguimos confirmar o seu acesso. Recarregue a página e toque em Chamar no WhatsApp de novo.",
  indisponivel:
    "Não conseguimos mostrar o número agora. A falha foi do nosso lado. Tente de novo em alguns instantes.",
};
