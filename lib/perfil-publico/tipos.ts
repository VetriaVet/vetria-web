// Os contratos do perfil público (F4/S7, capacidade E5).
//
// Tão público quanto a linha que `*_select_publico` libera para `anon`. Sem
// `id`, sem nada de `perfil_privado`, sem `endereco`/`cep` do
// estabelecimento (R-032 sem decisão: endereço de quem é MEI pode ser a
// casa da pessoa).
import type { Falha } from "@/lib/publico/disponibilidade";
import type { ModoDeAtendimento } from "@/lib/busca/tipos";
import type { AlvoDoContato } from "./contato";

export type PerfilDeVeterinario = {
  tipo: "vet";
  slug: string;
  /** `/veterinario/<slug>`. */
  href: string;
  nome: string | null;
  /** Rótulo já traduzido, ou nulo. */
  titulo: string | null;
  /**
   * CRMV e UF de inscrição. É o registro público do conselho, e o que dá
   * confiança ao responsável; a tela decide se mostra. Nulo se faltar metade.
   */
  crmv: { numero: string; uf: string } | null;
  /** Rótulo já traduzido ("5 a 10 anos"), ou nulo. */
  experiencia: string | null;
  bio: string | null;
  especialidades: string[];
  cidade: string | null;
  uf: string | null;
  bairro: string | null;
  atendimento: Record<ModoDeAtendimento, boolean>;
  /** O que o botão de contato manda para o servidor (S8). Nunca o número. */
  contato: AlvoDoContato;
};

export type PerfilDeEstabelecimento = {
  tipo: "clinic";
  slug: string;
  /** `/estabelecimento/<slug>`. */
  href: string;
  nome: string | null;
  sobre: string | null;
  servicos: string[];
  cidade: string | null;
  uf: string | null;
  /**
   * Só `http://` ou `https://` com host, conferido aqui (a 0004 põe a mesma
   * regra no banco). Qualquer outra coisa (`javascript:`, texto solto) vira
   * nulo. Link para fora: a tela usa `rel="nofollow noopener noreferrer"`.
   */
  site: string | null;
  contato: AlvoDoContato;
};

export type PerfilPublico = PerfilDeVeterinario | PerfilDeEstabelecimento;

/**
 * O que a tela DESENHA, sem o endereço: nome, textos, rótulos, local. A página
 * pública e a prévia do dono (a tela `/perfil` do painel) usam exatamente estes campos,
 * saídos da mesma transformação (`carregar.ts`), para que a prévia mostre o
 * que o responsável vai ver e nada diferente.
 */
export type ConteudoDoVeterinario = Omit<PerfilDeVeterinario, "slug" | "href" | "contato">;
export type ConteudoDoEstabelecimento = Omit<
  PerfilDeEstabelecimento,
  "slug" | "href" | "contato"
>;

export type PerfilCarregado<P extends PerfilPublico> =
  | { estado: "ok"; perfil: P }
  /** Slug inválido, inexistente, ou conta que não está `active` (a RLS esconde). */
  | { estado: "nao_encontrado" }
  | { estado: Falha };
