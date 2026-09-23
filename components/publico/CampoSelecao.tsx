import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

// O `Select` de components/ui tem o placeholder DESABILITADO (é de formulário
// de cadastro: escolher é obrigatório). Filtro de busca é o contrário: "Todas"
// é uma escolha válida e precisa poder voltar. Mesmo desenho do pill, com a
// primeira opção selecionável e valor vazio. As classes seguem as do
// `Select`/`Input` de components/ui (pill creme, foco branco com anel verde).

type Opcao = { value: string; label: string };

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  opcoes: Opcao[];
  /** Texto da opção vazia ("Todas as especialidades"). */
  todas: string;
}

const classe =
  "w-full appearance-none rounded-pill border border-transparent bg-fundo-claro/40 py-3.5 pl-5 pr-11 text-[15px] text-titulo transition focus:border-principal focus:bg-white focus:outline-none focus:ring-2 focus:ring-principal/20 cursor-pointer";

export function CampoSelecao({ opcoes, todas, className = "", ...props }: Props) {
  return (
    <div className="relative">
      <select className={[classe, className].filter(Boolean).join(" ")} {...props}>
        <option value="">{todas}</option>
        {opcoes.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-corpo-texto"
      />
    </div>
  );
}

/** O mesmo pill do `Input` de components/ui, para o campo que precisa de ARIA própria. */
export const classeDoCampoDeTexto =
  "w-full rounded-pill border border-transparent bg-fundo-claro/40 px-5 py-3.5 text-[15px] text-titulo placeholder:text-corpo-texto/60 transition focus:border-principal focus:bg-white focus:outline-none focus:ring-2 focus:ring-principal/20";
