"use client";

import { useEffect, useState } from "react";

// T-023 — O BOTÃO QUE ABRE O DOCUMENTO. É só isto: um POST para a rota que a
// T-008 já colocou em produção.
//
// ⚠️ NENHUMA ROTA NOVA DE LEITURA FOI ESCRITA, e não pode ser escrita.
// `/api/documentos/abrir` já faz, nesta ordem: confere a sessão, exige que
// quem pede seja o DONO ou um admin, lê o `documento_path` da tabela (o
// caminho NUNCA vem do cliente, que é o "deputado confuso" da SEC-003), grava
// `audit_logs` com `actor_id` explícito ANTES de emitir qualquer URL (SEC-040)
// e só então assina por 60 segundos. Uma segunda rota seria uma segunda
// chance de errar tudo isso.
//
// ⚠️ O corpo carrega o uuid do dono, e mais nada. Nada de CNPJ, telefone ou
// caminho de arquivo em corpo, query string ou URL.
//
// ⚠️ O documento NÃO é embutido nesta página: nem `<img>`, nem `<iframe>`,
// nem `next/image`. Abre em aba nova. `dangerouslyAllowSVG` está ligado no
// `next.config.ts` por causa da logo (DL-040 / R-004), e arquivo vindo de
// usuário não passa por `next/image` neste projeto. O bucket aceita quatro
// MIME (pdf, jpg, png, webp) e o CHECK da `0002` recusa `.svg` e `.html` no
// caminho justamente porque o admin é quem abre o arquivo, na sessão de maior
// privilégio do sistema (SEC-026).
//
// Por que o link aparece em vez de o botão abrir a aba sozinho: a URL só
// existe depois do `await`, e navegador bloqueia `window.open` fora do gesto
// do usuário. Um clique que às vezes não abre nada é pior que dois cliques que
// sempre funcionam. De quebra, a validade de 60 segundos fica visível na tela,
// que é a verdade sobre o que aquele link é.

type Props = {
  /** uuid do DONO do documento. É o único campo que a rota aceita no corpo. */
  dono: string;
  /** Já sabemos, pelo servidor, que não há documento. O botão nem aparece. */
  temDocumento: boolean;
};

const MENSAGEM_PADRAO =
  "Não foi possível abrir o documento agora. Tente de novo em alguns instantes.";

export default function BotaoDocumento({ dono, temDocumento }: Props) {
  const [pedindo, setPedindo] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [restam, setRestam] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    if (restam <= 0) {
      // O link morreu do lado do servidor. Some da tela junto, senão vira um
      // botão que devolve erro sem explicar por quê.
      setUrl(null);
      setAviso("O link expirou. Peça um novo para abrir de novo.");
      return;
    }

    const t = setTimeout(() => setRestam((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [url, restam]);

  async function pedir() {
    setPedindo(true);
    setAviso(null);
    setUrl(null);

    try {
      const res = await fetch("/api/documentos/abrir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dono }),
        cache: "no-store",
      });

      // ⚠️ A resposta de 409 traz `caminho` no corpo, e ele NÃO é renderizado:
      // caminho de objeto no bucket não tem por que aparecer em tela. Só o
      // campo `erro` chega ao HTML.
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        erro?: string;
        validadeSegundos?: number;
      };

      if (!res.ok || !json.url) {
        setAviso(json.erro ?? MENSAGEM_PADRAO);
        return;
      }

      setRestam(
        typeof json.validadeSegundos === "number" && json.validadeSegundos > 0
          ? json.validadeSegundos
          : 60
      );
      setUrl(json.url);
    } catch {
      setAviso(MENSAGEM_PADRAO);
    } finally {
      setPedindo(false);
    }
  }

  if (!temDocumento) {
    return (
      <p className="text-[13px] text-amber-200/90 m-0">
        Esta conta concluiu o cadastro sem enviar documento. Não há o que abrir.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-pill bg-white text-[#0F1F22] font-semibold text-[13px] px-4 py-2 no-underline hover:bg-white/90 transition"
        >
          Abrir documento em uma aba nova ({restam}s)
        </a>
      ) : (
        <button
          type="button"
          onClick={pedir}
          disabled={pedindo}
          className="rounded-pill border border-white/20 text-white font-semibold text-[13px] px-4 py-2 hover:bg-white/[0.06] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pedindo ? "Liberando..." : "Liberar o documento"}
        </button>
      )}

      <p className="text-[12px] text-white/40 m-0">
        O link vale 60 segundos e cada abertura fica registrada na trilha de
        auditoria, com a sua conta.
      </p>

      {aviso && (
        <p role="status" className="text-[12px] text-amber-200/90 m-0">
          {aviso}
        </p>
      )}
    </div>
  );
}
