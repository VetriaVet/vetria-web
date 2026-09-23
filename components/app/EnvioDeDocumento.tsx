"use client";

import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";

// T-008 — O PASSO 4 DO ONBOARDING DEIXA DE SER UM AVISO.
//
// Um componente só, usado pelas DUAS personas profissionais (veterinário e
// estabelecimento), porque a regra é a mesma nos dois lados e duas cópias
// divergem. O que muda entre elas é texto, e texto vem por prop.
//
// ⚠️ O QUE ESTE ARQUIVO NÃO FAZ, E NÃO PODE PASSAR A FAZER:
//   · não fala com o Storage. Nenhum token de escrita chega ao cliente
//     (SEC-036 / DL-051): o arquivo vai por POST para `/api/documentos/upload`,
//     que é rota nossa, e é lá que o tipo real, o tamanho, o caminho e o hash
//     são decididos;
//   · não escolhe o nome do arquivo. O nome que o usuário escolheu não chega
//     ao caminho nem sanitizado (`0003` §3);
//   · não decide se o arquivo vale. As checagens daqui são conveniência, para
//     a pessoa não subir 30 MB e esperar. A regra que vale é a do servidor.
//
// O `accept` e o teto em MB abaixo são espelho das quatro listas da `0003`
// §2.c. Se elas mudarem, estas duas linhas mudam junto, e mesmo assim quem
// barra continua sendo o servidor.

const LIMITE_BYTES = 10485760;
const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

// Data com fuso fixo, de propósito: este componente é renderizado no servidor
// e hidratado no cliente, e `toLocaleString` sem `timeZone` produz textos
// diferentes nos dois lados.
const FORMATO_DATA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function formatarEnvio(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return FORMATO_DATA.format(d);
}

type RespostaUpload = {
  ok?: boolean;
  erro?: string;
  enviadoEm?: string | null;
};

type RespostaAbrir = {
  ok?: boolean;
  erro?: string;
  url?: string;
  validadeSegundos?: number;
};

function mensagemPorStatus(status: number): string {
  // O 413 aqui costuma vir da plataforma, antes da rota rodar, e nesse caso a
  // resposta não é JSON nenhum. Dizer "tente um arquivo menor" é a única coisa
  // honesta a dizer.
  if (status === 413)
    return "O arquivo é grande demais para o envio. Tente uma foto menor ou um PDF mais leve.";
  if (status === 401)
    return "Sua sessão expirou. Entre de novo e envie o documento.";
  return "O envio não foi concluído. Tente de novo em alguns instantes.";
}

export default function EnvioDeDocumento({
  enviadoEmInicial,
  onEnviado,
  descricao,
  exemplos,
}: {
  enviadoEmInicial: string | null;
  onEnviado: (enviadoEm: string | null) => void;
  descricao: string;
  exemplos: string;
}) {
  const [enviadoEm, setEnviadoEm] = useState<string | null>(enviadoEmInicial);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [urlTemporaria, setUrlTemporaria] = useState<string | null>(null);
  const [abrindo, setAbrindo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const quando = formatarEnvio(enviadoEm);

  function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    setErro(null);
    setUrlTemporaria(null);
    const f = e.target.files?.[0] ?? null;

    if (f && f.size > LIMITE_BYTES) {
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
      setErro(
        "O arquivo passa de 10 MB. Envie uma foto menor ou um PDF mais leve."
      );
      return;
    }

    setArquivo(f);
  }

  async function enviar() {
    if (!arquivo || enviando) return;
    setErro(null);
    setUrlTemporaria(null);
    setEnviando(true);

    try {
      const corpo = new FormData();
      corpo.append("arquivo", arquivo);

      const resposta = await fetch("/api/documentos/upload", {
        method: "POST",
        body: corpo,
      });

      const dados = (await resposta
        .json()
        .catch(() => null)) as RespostaUpload | null;

      // ⚠️ SÓ É SUCESSO SE O SERVIDOR DISSER QUE A LINHA FOI GRAVADA. A rota
      // nunca responde `ok` sem ter gravado `documento_path`, `documento_hash`
      // e `documento_tamanho`, e este `if` é o lado de cá dessa promessa: a
      // pessoa não pode sair desta tela achando que enviou quando não enviou.
      if (!resposta.ok || !dados?.ok) {
        setErro(dados?.erro ?? mensagemPorStatus(resposta.status));
        return;
      }

      const quandoFoi = dados.enviadoEm ?? null;
      setEnviadoEm(quandoFoi);
      setArquivo(null);
      if (inputRef.current) inputRef.current.value = "";
      onEnviado(quandoFoi);
    } catch {
      setErro(
        "O envio não foi concluído, e pode ter sido a conexão. Confira a internet e tente de novo."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function conferir() {
    if (abrindo) return;
    setErro(null);
    setUrlTemporaria(null);
    setAbrindo(true);

    try {
      const resposta = await fetch("/api/documentos/abrir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      const dados = (await resposta
        .json()
        .catch(() => null)) as RespostaAbrir | null;

      if (!resposta.ok || !dados?.url) {
        setErro(
          dados?.erro ??
            "Não foi possível abrir o documento agora. Tente de novo em alguns instantes."
        );
        return;
      }

      setUrlTemporaria(dados.url);
    } catch {
      setErro("Não foi possível abrir o documento agora. Tente de novo.");
    } finally {
      setAbrindo(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 p-6 mb-4">
      {quando ? (
        <div className="mb-5 rounded-xl bg-fundo-destaque p-4">
          <p className="text-[13px] text-titulo font-semibold mb-0.5">
            Documento recebido em {quando}.
          </p>
          <p className="text-[12px] text-corpo-texto leading-relaxed">
            Está guardado em área privada e só a equipe de validação da Vetria
            abre. Se enviar outro, o novo passa a valer e o cadastro volta para
            a fila de conferência.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={conferir}
              disabled={abrindo}
              className="rounded-pill border border-principal text-principal px-4 py-2 text-[13px] font-medium hover:bg-white transition disabled:opacity-50"
            >
              {abrindo ? "Abrindo..." : "Conferir o que foi enviado"}
            </button>
            {urlTemporaria && (
              <a
                href={urlTemporaria}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold text-principal underline underline-offset-2"
              >
                Abrir o documento (o link vale 1 minuto)
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-corpo-texto leading-relaxed mb-4">
          {descricao}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-[13px] font-medium text-titulo">
          {quando ? "Enviar outro documento" : "Documento"}
        </p>
        {/* T-035 — o botão nativo de arquivo fala a língua do NAVEGADOR
            ("Choose file", "No file chosen"). O input continua aqui, fora da
            vista mas no teclado e no leitor de tela; o que aparece é o label
            dele, desenhado como botão, sempre em português. `peer` leva o foco
            do input para o anel visível do label. */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            id="documento"
            name="documento"
            type="file"
            accept={ACCEPT}
            onChange={escolher}
            disabled={enviando}
            aria-describedby="documento-escolhido"
            className="peer sr-only"
          />
          <label
            htmlFor="documento"
            className="inline-flex items-center gap-2 rounded-pill bg-fundo-destaque px-4 py-2 text-[13px] font-medium text-principal cursor-pointer hover:bg-gray-100 transition peer-focus-visible:ring-2 peer-focus-visible:ring-principal/40 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
          >
            <Paperclip size={15} aria-hidden="true" />
            {arquivo ? "Trocar arquivo" : "Escolher arquivo"}
          </label>
          <span
            id="documento-escolhido"
            aria-live="polite"
            className="min-w-0 truncate text-[13px] text-corpo-texto"
          >
            {arquivo ? arquivo.name : "Nenhum arquivo escolhido"}
          </span>
        </div>
        <p className="text-[12px] text-corpo-texto/70 leading-relaxed">
          {exemplos} PDF, JPG, PNG ou WEBP, até 10 MB. O arquivo é renomeado
          pelo servidor e nunca aparece no perfil público.
        </p>

        <div>
          <button
            type="button"
            onClick={enviar}
            disabled={!arquivo || enviando}
            aria-busy={enviando}
            className="rounded-pill bg-principal text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#142E33] transition disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Enviar documento"}
          </button>
        </div>
      </div>

      {erro && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-800 leading-relaxed"
        >
          {erro}
        </div>
      )}
    </div>
  );
}
