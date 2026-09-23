"use client";

import {
  InputHTMLAttributes,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Input } from "./Input";
import {
  MASCARAS,
  SITE_PREFIXO,
  completarSite,
  type NomeMascara,
} from "@/lib/campos/mascaras";

interface CampoMascaradoProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type" | "defaultValue"
  > {
  id: string;
  mascara: NomeMascara;
  /** O valor LIMPO (o que vai para o servidor), nunca o formatado. */
  valor: string;
  onValor: (valor: string) => void;
  /** Texto de ajuda sob o campo, ligado por aria-describedby. */
  ajuda?: string;
}

// T-035 — campo com máscara. Usa o Input da casa, então a aparência é a mesma
// dos outros campos (e o Input continua intacto para quem não usa máscara).
//
// Como funciona: o pai guarda o valor LIMPO; o campo mostra o valor FORMATADO.
// Todo caractere digitado ou colado passa por `limpar`, então letra no CRMV,
// traço no CEP ou espaço no email simplesmente não entram.
//
// O erro aparece depois que a pessoa sai do campo (não no meio da digitação),
// e já na abertura se o valor salvo antes estiver fora da regra.
export function CampoMascarado({
  id,
  mascara,
  valor,
  onValor,
  ajuda,
  placeholder,
  onBlur,
  onFocus,
  ...props
}: CampoMascaradoProps) {
  const m = MASCARAS[mascara];
  const ref = useRef<HTMLInputElement>(null);
  const cursor = useRef<number | null>(null);
  const [tocado, setTocado] = useState(valor !== "");

  const exibido = m.formatar(valor);
  const erro = tocado ? m.validar(valor) : null;

  const erroId = `${id}-erro`;
  const ajudaId = ajuda ? `${id}-ajuda` : undefined;
  const describedBy =
    [props["aria-describedby"], ajudaId, erro ? erroId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  // Depois que a pontuação da máscara entra ou sai, o cursor volta para
  // depois do mesmo caractere de informação em que estava.
  useLayoutEffect(() => {
    const el = ref.current;
    if (cursor.current === null || !el || document.activeElement !== el) return;
    const alvo = cursor.current;
    cursor.current = null;
    let contados = 0;
    let pos = 0;
    while (pos < el.value.length && contados < alvo) {
      if (m.significativo.test(el.value[pos])) contados++;
      pos++;
    }
    el.setSelectionRange(pos, pos);
  });

  function contarAte(texto: string, fim: number) {
    let n = 0;
    for (let i = 0; i < fim && i < texto.length; i++)
      if (m.significativo.test(texto[i])) n++;
    return n;
  }

  function aplicar(texto: string, posCursor: number) {
    const novo = m.limpar(texto);
    cursor.current = Math.min(contarAte(texto, posCursor), novo.length);
    onValor(novo);
  }

  function aoMudar(e: React.ChangeEvent<HTMLInputElement>) {
    let texto = e.target.value;
    let pos = e.target.selectionStart ?? texto.length;
    const tipo = (e.nativeEvent as InputEvent).inputType;

    // Apagar só a pontuação ("(62) |9" + Backspace apaga o ")") não mudaria o
    // valor e o campo pareceria travado. Nesse caso apaga o caractere de
    // informação mais próximo, na direção da tecla.
    if (
      (tipo === "deleteContentBackward" || tipo === "deleteContentForward") &&
      m.limpar(texto) === m.limpar(exibido) &&
      texto.length < exibido.length
    ) {
      if (tipo === "deleteContentBackward") {
        let i = pos - 1;
        while (i >= 0 && !m.significativo.test(texto[i])) i--;
        if (i >= 0) {
          texto = texto.slice(0, i) + texto.slice(i + 1);
          pos = i;
        }
      } else {
        let i = pos;
        while (i < texto.length && !m.significativo.test(texto[i])) i++;
        if (i < texto.length) texto = texto.slice(0, i) + texto.slice(i + 1);
      }
    }
    aplicar(texto, pos);
  }

  // Colar passa pela mesma limpeza. É tratado à parte porque o `maxLength`
  // do navegador cortaria o texto colado ANTES da limpeza: "+55 (62)
  // 99265-3278" viraria "+55 (62) 99265-".
  function aoColar(e: React.ClipboardEvent<HTMLInputElement>) {
    const colado = e.clipboardData.getData("text");
    if (!colado) return;
    e.preventDefault();
    const el = e.currentTarget;
    const ini = el.selectionStart ?? el.value.length;
    const fim = el.selectionEnd ?? el.value.length;
    const trecho = m.aoColar ? m.aoColar(colado) : colado;
    const texto = el.value.slice(0, ini) + trecho + el.value.slice(fim);
    aplicar(texto, ini + trecho.length);
  }

  function aoFocar(e: React.FocusEvent<HTMLInputElement>) {
    // Site: sugere o começo do endereço, com o cursor já depois dele.
    if (mascara === "site" && valor === "") {
      cursor.current = SITE_PREFIXO.length;
      onValor(SITE_PREFIXO);
    }
    onFocus?.(e);
  }

  function aoSair(e: React.FocusEvent<HTMLInputElement>) {
    if (mascara === "site") {
      const completo = completarSite(valor);
      if (completo !== valor) onValor(completo);
    }
    setTocado(true);
    onBlur?.(e);
  }

  return (
    <>
      <Input
        {...props}
        ref={ref}
        id={id}
        type={m.type}
        inputMode={m.inputMode}
        autoComplete={props.autoComplete ?? m.autoComplete}
        autoCapitalize={mascara === "cnpj" ? "characters" : "none"}
        autoCorrect="off"
        spellCheck={false}
        maxLength={Math.max(m.maxLength, exibido.length)}
        placeholder={placeholder ?? m.placeholder}
        value={exibido}
        onChange={aoMudar}
        onPaste={aoColar}
        onFocus={aoFocar}
        onBlur={aoSair}
        aria-invalid={erro ? true : undefined}
        aria-describedby={describedBy}
        className={
          erro
            ? "border-red-300! focus:border-red-400! focus:ring-red-200!"
            : undefined
        }
      />
      {ajuda && (
        <p id={ajudaId} className="text-[12px] text-corpo-texto/70 mt-1.5 px-5 leading-relaxed">
          {ajuda}
        </p>
      )}
      {/* Sempre no DOM, para o leitor de tela anunciar quando o erro surgir. */}
      <p
        id={erroId}
        aria-live="polite"
        className={erro ? "text-[13px] text-red-700 mt-1.5 px-5 leading-snug" : "sr-only"}
      >
        {erro}
      </p>
    </>
  );
}
