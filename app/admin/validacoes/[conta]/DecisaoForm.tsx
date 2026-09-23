"use client";

import { useState, useTransition } from "react";
import {
  MOTIVO_MAXIMO,
  MOTIVO_MINIMO,
  type Decisao,
  type ResultadoDecisao,
} from "./decisao";

// T-024 — OS DOIS BOTÕES QUE FALTAVAM NA FILA.
//
// Isto é interação e mais nada. Quem decide se a pessoa pode decidir, se a
// conta está na fila, se o motivo basta e o que vai para o banco é a Server
// Action (`./actions.ts`). O botão desabilitado e o contador daqui são
// conveniência: um POST direto na Action passa por cima deles e cai nas
// mesmas regras do servidor.
//
// Aprovar pede um segundo clique de confirmação: a aprovação libera o painel
// na hora e dispara email, e um clique errado no lugar errado não se desfaz
// sozinho (admin comum não tem como suspender, matriz §5).
//
// DL-016: nenhum try/catch em volta da Action. O sucesso termina em
// `redirect()` do servidor; a falha volta como VALOR.

type Props = {
  conta: string;
  temDocumento: boolean;
  action: (entrada: {
    conta: string;
    decisao: Decisao;
    motivo: string;
  }) => Promise<ResultadoDecisao | void>;
};

export default function DecisaoForm({ conta, temDocumento, action }: Props) {
  const [isPending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoAprovacao, setConfirmandoAprovacao] = useState(false);
  const [motivo, setMotivo] = useState("");

  const tamanhoMotivo = motivo.trim().length;
  const motivoValido =
    tamanhoMotivo >= MOTIVO_MINIMO && tamanhoMotivo <= MOTIVO_MAXIMO;

  function enviar(decisao: Decisao) {
    setErro(null);
    startTransition(async () => {
      const r = await action({ conta, decisao, motivo });
      if (r && r.ok === false) {
        setErro(r.mensagem);
        setConfirmandoAprovacao(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* APROVAR */}
      <div className="flex flex-col gap-2">
        <div className="font-semibold text-[13px] text-white">Aprovar</div>
        <p className="text-[12px] text-white/50 m-0">
          A conta passa a ativa, o painel completo é liberado na hora e a pessoa
          recebe o email de aprovação.
        </p>
        {!temDocumento && (
          <p className="text-[12px] text-amber-200/90 m-0">
            Atenção: esta conta não enviou documento. Aprove só se você conferiu
            o registro por outro meio.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {confirmandoAprovacao ? (
            <>
              <button
                type="button"
                onClick={() => enviar("aprovar")}
                disabled={isPending}
                aria-busy={isPending}
                className="cursor-pointer rounded-pill bg-emerald-400 text-[#0F1F22] font-semibold text-[13px] px-4 py-2 hover:bg-emerald-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Aprovando..." : "Confirmar aprovação"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoAprovacao(false)}
                disabled={isPending}
                className="cursor-pointer rounded-pill border border-white/20 text-white/80 text-[13px] px-4 py-2 hover:bg-white/[0.06] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setErro(null);
                setConfirmandoAprovacao(true);
              }}
              disabled={isPending}
              className="cursor-pointer rounded-pill bg-white text-[#0F1F22] font-semibold text-[13px] px-4 py-2 hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Aprovar esta conta
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-white/[0.06]" />

      {/* REPROVAR */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="motivo-reprova"
          className="font-semibold text-[13px] text-white"
        >
          Reprovar e devolver ao cadastro
        </label>
        <p className="text-[12px] text-white/50 m-0">
          A conta volta para o cadastro. O motivo abaixo aparece para a pessoa
          quando ela entrar e vai no email. Escreva o que ela precisa corrigir.
        </p>
        {/* SEC-101 — o motivo vai para `profiles.status_motivo`, para
            `audit_logs` e para a caixa de entrada da pessoa. Dado privado
            colado aqui se espalha por três lugares que não foram feitos para
            guardá-lo. */}
        <p className="text-[12px] text-amber-200/80 m-0">
          Não cole no motivo o conteúdo do documento, CPF, CNPJ nem dado de
          outra pessoa. Diga o que corrigir, sem repetir o dado.
        </p>
        <textarea
          id="motivo-reprova"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={MOTIVO_MAXIMO}
          rows={4}
          disabled={isPending}
          placeholder="Ex.: o número do CRMV não confere com o documento enviado. Envie a carteira do CRMV com o número legível."
          className="w-full rounded-md bg-black/20 border border-white/10 px-3 py-2.5 text-[13px] text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none resize-y"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-white/40">
            {tamanhoMotivo < MOTIVO_MINIMO
              ? `Mínimo de ${MOTIVO_MINIMO} caracteres.`
              : `${tamanhoMotivo} / ${MOTIVO_MAXIMO}`}
          </span>
          <button
            type="button"
            onClick={() => enviar("reprovar")}
            disabled={isPending || !motivoValido}
            aria-busy={isPending}
            title={
              motivoValido
                ? undefined
                : "Escreva o motivo da reprova para continuar."
            }
            className="cursor-pointer rounded-pill border border-red-400/40 text-red-200 font-semibold text-[13px] px-4 py-2 hover:bg-red-500/[0.1] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Enviando..." : "Reprovar com este motivo"}
          </button>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md border border-red-500/30 bg-red-500/[0.08] p-4 text-[13px] text-red-200"
        >
          {erro}
        </div>
      )}
    </div>
  );
}
