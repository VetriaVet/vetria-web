// Os contratos da busca pública (F4/S6, capacidade E4).
//
// Tudo o que sai daqui é tão público quanto a linha de `vet_profiles` /
// `clinic_profiles` que a policy `*_select_publico` libera para `anon`. Não há
// campo de `perfil_privado` em lugar nenhum destes tipos, nem `id` interno: o
// profissional é identificado pelo par (tipo, slug), que é o endereço público
// dele (DL-067).
import type { Falha } from "@/lib/publico/disponibilidade";

export const MODOS_DE_ATENDIMENTO = ["presencial", "domiciliar", "teleorientacao"] as const;
export type ModoDeAtendimento = (typeof MODOS_DE_ATENDIMENTO)[number];

export const TIPOS_DE_PERFIL = ["veterinario", "estabelecimento"] as const;
/** Como aparece na URL (`?tipo=`). O role do banco é `vet` / `clinic` (DL-043). */
export type TipoNaUrl = (typeof TIPOS_DE_PERFIL)[number];

export const POR_PAGINA = 20;
/**
 * Teto de página. A lista "todos" junta duas tabelas e, para cada página N,
 * lê as N × 20 primeiras linhas de cada uma. Página 25 = 500 linhas por
 * tabela, que é o limite que aceitamos pagar por requisição anônima.
 */
export const PAGINA_MAXIMA = 25;
export const TERMO_MAXIMO = 80;

/** O que a URL pediu, já higienizado. Nenhum campo aqui foi conferido no banco. */
export type PedidoDeBusca = {
  /** Texto livre (`?q=`), até 80 caracteres. */
  termo: string | null;
  /** `?cidade=`: o slug de `cidades` (`goiania-go`) ou o nome digitado. */
  cidade: string | null;
  /** `?uf=`, duas letras maiúsculas. */
  uf: string | null;
  /** `?especialidade=`: slug de `especialidades`. Só veterinário. */
  especialidade: string | null;
  /** `?servico=`: slug de `servicos`. Só estabelecimento. */
  servico: string | null;
  /** `?atendimento=`. Só veterinário: estabelecimento não tem esses campos. */
  atendimento: ModoDeAtendimento | null;
  /** `?tipo=`. Ausente = os dois. */
  tipo: TipoNaUrl | null;
  /** `?pagina=`, de 1 a PAGINA_MAXIMA. */
  pagina: number;
};

export type ItemDeLista = { nome: string; slug: string };

export type CidadeResolvida = { nome: string; uf: string; slug: string; chave: string };

/** O que a busca de fato aplicou, com os nomes para a tela mostrar. */
export type FiltrosAplicados = {
  termo: string | null;
  cidade: CidadeResolvida | null;
  uf: string | null;
  especialidade: ItemDeLista | null;
  servico: ItemDeLista | null;
  atendimento: ModoDeAtendimento | null;
  /** Quais tabelas entraram. Pelo menos um dos dois é `true` em `ok`. */
  incluiVeterinarios: boolean;
  incluiEstabelecimentos: boolean;
};

/**
 * Por que a busca voltou vazia sem nem consultar os perfis. A tela transforma
 * isto em frase; a busca não inventa resultado para "ajudar".
 */
export type Aviso =
  | "cidade_desconhecida" //    nenhuma cidade com esse nome (na UF, se veio UF)
  | "cidade_ambigua" //         o nome existe em mais de uma UF e não veio UF
  | "especialidade_desconhecida"
  | "servico_desconhecido"
  | "filtros_incompativeis"; // ex.: especialidade (vet) junto com serviço (estab.)

export type CartaoDeVeterinario = {
  tipo: "vet";
  slug: string;
  /** `/veterinario/<slug>`. Rota em português, role em inglês (DL-043). */
  href: string;
  nome: string | null;
  /** Rótulo já traduzido ("Médico(a) Veterinário(a)"), ou nulo. */
  titulo: string | null;
  especialidades: string[];
  cidade: string | null;
  uf: string | null;
  bairro: string | null;
  atendimento: Record<ModoDeAtendimento, boolean>;
};

export type CartaoDeEstabelecimento = {
  tipo: "clinic";
  slug: string;
  /** `/estabelecimento/<slug>`. */
  href: string;
  nome: string | null;
  servicos: string[];
  cidade: string | null;
  uf: string | null;
};

export type Cartao = CartaoDeVeterinario | CartaoDeEstabelecimento;

export type ResultadoDaBusca =
  | {
      estado: "ok";
      itens: Cartao[];
      total: number;
      pagina: number;
      porPagina: number;
      totalDePaginas: number;
      filtros: FiltrosAplicados;
      /** Vazio quando a busca rodou de verdade. */
      avisos: Aviso[];
    }
  | { estado: Falha };

export type OpcoesDaBusca =
  | { estado: "ok"; especialidades: ItemDeLista[]; servicos: ItemDeLista[] }
  | { estado: Falha };

export type SugestoesDeCidade =
  | { estado: "ok"; cidades: CidadeResolvida[] }
  | { estado: Falha };
