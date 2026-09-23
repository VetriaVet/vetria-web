// A URL de `/buscar` é o contrato público da busca: a Home, os links
// compartilhados e as LPs da F5 montam esta URL. Mudar nome de parâmetro
// quebra link que já está no WhatsApp de alguém.
//
//   /buscar?q=&cidade=&uf=&especialidade=&servico=&atendimento=&tipo=&pagina=
//
// Tudo que vem da URL é entrada de estranho: aqui só se higieniza (tamanho,
// formato, lista fechada). O que é conferido contra o banco (a cidade, o
// slug da especialidade) é conferido em `buscar.ts`.
import { UFS } from "@/app/app/veterinario/onboarding/campos";
import {
  MODOS_DE_ATENDIMENTO,
  PAGINA_MAXIMA,
  TERMO_MAXIMO,
  TIPOS_DE_PERFIL,
  type ModoDeAtendimento,
  type PedidoDeBusca,
  type TipoNaUrl,
} from "./tipos";

type ParametrosDaUrl = Record<string, string | string[] | undefined>;

function um(valor: string | string[] | undefined): string | null {
  const v = Array.isArray(valor) ? valor[0] : valor;
  if (typeof v !== "string") return null;
  // Colapsa espaço e tira caractere de controle; vazio vira nulo.
  const semControle = Array.from(v, (c) => {
    const n = c.charCodeAt(0);
    return n < 32 || n === 127 ? " " : c;
  }).join("");
  const limpo = semControle.replace(/\s+/g, " ").trim();
  return limpo === "" ? null : limpo;
}

function slugOuNulo(valor: string | null, max: number): string | null {
  if (!valor) return null;
  const v = valor.toLowerCase();
  return v.length <= max && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ? v : null;
}

export function lerPedidoDeBusca(sp: ParametrosDaUrl): PedidoDeBusca {
  const termo = um(sp.q);
  const cidade = um(sp.cidade);
  const ufBruta = um(sp.uf)?.toUpperCase() ?? null;
  const atendimento = um(sp.atendimento);
  const tipo = um(sp.tipo);
  const pagina = Number.parseInt(um(sp.pagina) ?? "1", 10);

  return {
    termo: termo ? termo.slice(0, TERMO_MAXIMO) : null,
    cidade: cidade ? cidade.slice(0, 130) : null,
    uf: ufBruta && (UFS as readonly string[]).includes(ufBruta) ? ufBruta : null,
    especialidade: slugOuNulo(um(sp.especialidade), 60),
    servico: slugOuNulo(um(sp.servico), 60),
    atendimento: (MODOS_DE_ATENDIMENTO as readonly string[]).includes(atendimento ?? "")
      ? (atendimento as ModoDeAtendimento)
      : null,
    tipo: (TIPOS_DE_PERFIL as readonly string[]).includes(tipo ?? "")
      ? (tipo as TipoNaUrl)
      : null,
    pagina:
      Number.isFinite(pagina) && pagina >= 1 ? Math.min(pagina, PAGINA_MAXIMA) : 1,
  };
}

/** A URL de `/buscar` para um pedido, com mudanças (ex.: `{ pagina: 2 }`). */
export function urlDaBusca(pedido: PedidoDeBusca, mudancas: Partial<PedidoDeBusca> = {}): string {
  const p = { ...pedido, ...mudancas };
  const qs = new URLSearchParams();
  if (p.termo) qs.set("q", p.termo);
  if (p.cidade) qs.set("cidade", p.cidade);
  if (p.uf) qs.set("uf", p.uf);
  if (p.especialidade) qs.set("especialidade", p.especialidade);
  if (p.servico) qs.set("servico", p.servico);
  if (p.atendimento) qs.set("atendimento", p.atendimento);
  if (p.tipo) qs.set("tipo", p.tipo);
  if (p.pagina > 1) qs.set("pagina", String(p.pagina));
  const s = qs.toString();
  return s ? `/buscar?${s}` : "/buscar";
}
