// A busca pública (F4/S6, capacidade E4), no servidor.
//
// ⚠️ QUEM DECIDE QUEM APARECE É O POSTGRES, NÃO ESTE ARQUIVO.
// A consulta sai pelo cliente anônimo (`lib/supabase/publico.ts`), então a
// única policy de leitura que vale é `*_select_publico` =
// `perfil_esta_ativo(id, role)`: role certo E `status = 'active'` (matriz §3,
// regra 2; DL-048). Não existe `.eq("status", "active")` aqui, de propósito:
// filtro de visibilidade na aplicação é filtro que alguém esquece. Os filtros
// abaixo são de RELEVÂNCIA (cidade, especialidade, texto), não de permissão.
//
// O único filtro que parece de visibilidade é `slug is not null`, e não é: é
// "tem endereço público". Conta ativa sem slug (R-065, antes da 0005) não tem
// página para onde o cartão levar, então não entra na lista.
//
// ⚠️ SÓ COLUNA PÚBLICA NO `select`. Nada de `perfil_privado` (que o `anon`
// nem lê), nada de `id`, nada de `endereco`/`cep` do estabelecimento
// (R-032 sem decisão). Coluna nova aqui é decisão de exposição: passa pela
// matriz antes.
//
// ⚠️ DEPENDE DA 0005: `especialidades`, `servicos`, `cidades`, a coluna
// `busca` e o `slug` preenchido. Sem ela, devolve `indisponivel`
// (lib/publico/disponibilidade.ts explica como é detectado).
import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/publico";
import { classificarErro, registrarFalha } from "@/lib/publico/disponibilidade";
import { padraoDaChave, semAcento } from "@/lib/publico/normalizar";
import { rotuloDoTitulo } from "@/lib/publico/rotulos";
import { lerCidade, lerItemDeLista } from "./opcoes";
import {
  PAGINA_MAXIMA,
  POR_PAGINA,
  type Aviso,
  type Cartao,
  type CartaoDeEstabelecimento,
  type CartaoDeVeterinario,
  type FiltrosAplicados,
  type PedidoDeBusca,
  type ResultadoDaBusca,
} from "./tipos";

const COLUNAS_VET =
  "slug, nome_exibicao, titulo, especialidades, cidade, estado, bairro, atende_presencial, atende_domiciliar, atende_teleorientacao";
const COLUNAS_ESTAB = "slug, nome_fantasia, servicos, cidade, estado";

type LinhaVet = {
  slug: string;
  nome_exibicao: string | null;
  titulo: string | null;
  especialidades: string[] | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  atende_presencial: boolean;
  atende_domiciliar: boolean;
  atende_teleorientacao: boolean;
};

type LinhaEstab = {
  slug: string;
  nome_fantasia: string | null;
  servicos: string[] | null;
  cidade: string | null;
  estado: string | null;
};

/**
 * Busca profissionais visíveis ao público.
 *
 * Ordenação (estável, a mesma em toda página): nome em ordem alfabética, e o
 * `slug` (único por tabela) desempata. Sem "relevância" do full-text: o
 * PostgREST não ordena por `ts_rank` sem função no banco, e ordem que muda
 * conforme o termo é assunto para quando houver função de busca (S6).
 * "Todos" junta veterinários e estabelecimentos pela mesma regra.
 */
export async function buscarProfissionais(pedido: PedidoDeBusca): Promise<ResultadoDaBusca> {
  try {
    const supabase = await createPublicClient();

    // A sonda de prontidão vai junto com a leitura dos filtros: uma ida só.
    // Se a 0005 não entrou, `especialidades` não existe e tudo para aqui.
    const [sonda, cidadeLida, especialidade, servico] = await Promise.all([
      supabase.from("especialidades").select("slug").limit(1),
      pedido.cidade ? lerCidade(supabase, pedido.cidade, pedido.uf) : null,
      pedido.especialidade ? lerItemDeLista(supabase, "especialidades", pedido.especialidade) : null,
      pedido.servico ? lerItemDeLista(supabase, "servicos", pedido.servico) : null,
    ]);
    if (sonda.error) throw sonda.error;

    const avisos: Aviso[] = [];
    if (cidadeLida?.estado === "desconhecida") avisos.push("cidade_desconhecida");
    if (cidadeLida?.estado === "ambigua") avisos.push("cidade_ambigua");
    if (pedido.especialidade && !especialidade) avisos.push("especialidade_desconhecida");
    if (pedido.servico && !servico) avisos.push("servico_desconhecido");

    // Especialidade e tipo de atendimento só existem no veterinário; serviço,
    // só no estabelecimento. Pedir um filtro de um lado tira o outro lado da
    // lista, em vez de ignorar o filtro e mostrar quem não bate.
    const incluiVeterinarios = pedido.tipo !== "estabelecimento" && !pedido.servico;
    const incluiEstabelecimentos =
      pedido.tipo !== "veterinario" && !pedido.especialidade && !pedido.atendimento;
    if (!incluiVeterinarios && !incluiEstabelecimentos) avisos.push("filtros_incompativeis");

    const cidade = cidadeLida?.estado === "ok" ? cidadeLida.cidade : null;
    const termoNormalizado = pedido.termo ? semAcento(pedido.termo) : null;

    const filtros: FiltrosAplicados = {
      termo: termoNormalizado && /[a-z0-9]/.test(termoNormalizado) ? pedido.termo : null,
      cidade,
      uf: cidade?.uf ?? pedido.uf,
      especialidade: especialidade ?? null,
      servico: servico ?? null,
      atendimento: pedido.atendimento,
      incluiVeterinarios,
      incluiEstabelecimentos,
    };

    const pagina = Math.min(Math.max(pedido.pagina, 1), PAGINA_MAXIMA);
    if (avisos.length > 0) {
      return {
        estado: "ok", itens: [], total: 0, pagina, porPagina: POR_PAGINA,
        totalDePaginas: 0, filtros, avisos,
      };
    }

    const padraoCidade = cidade ? padraoDaChave(cidade.chave) : null;
    const termo = filtros.termo ? termoNormalizado : null;
    const inicio = (pagina - 1) * POR_PAGINA;

    const consultaVet = (colunas: string, head = false) => {
      let q = supabase
        .from("vet_profiles")
        .select(colunas, { count: "exact", head })
        .not("slug", "is", null);
      if (filtros.uf) q = q.eq("estado", filtros.uf);
      if (padraoCidade) q = q.filter("cidade", "match", padraoCidade);
      if (filtros.especialidade) q = q.filter("especialidades", "cs", literalDeArray(filtros.especialidade.nome));
      if (filtros.atendimento) q = q.eq(`atende_${filtros.atendimento}`, true);
      if (termo) q = q.textSearch("busca", termo, { config: "portuguese", type: "plain" });
      return q
        .order("nome_exibicao", { ascending: true, nullsFirst: false })
        .order("slug", { ascending: true });
    };

    const consultaEstab = (colunas: string, head = false) => {
      let q = supabase
        .from("clinic_profiles")
        .select(colunas, { count: "exact", head })
        .not("slug", "is", null);
      if (filtros.uf) q = q.eq("estado", filtros.uf);
      if (padraoCidade) q = q.filter("cidade", "match", padraoCidade);
      if (filtros.servico) q = q.filter("servicos", "cs", literalDeArray(filtros.servico.nome));
      if (termo) q = q.textSearch("busca", termo, { config: "portuguese", type: "plain" });
      return q
        .order("nome_fantasia", { ascending: true, nullsFirst: false })
        .order("slug", { ascending: true });
    };

    let itens: Cartao[];
    let total: number;

    if (incluiVeterinarios && incluiEstabelecimentos) {
      // Paginação sobre DUAS tabelas: lê as `inicio + POR_PAGINA` primeiras
      // de cada uma, intercala pela regra de ordem e corta a página. A
      // intercalação só compara as cabeças das duas listas, então a página N
      // é sempre a continuação exata da N-1 (nada repete, nada some).
      const fim = inicio + POR_PAGINA - 1;
      const [vets, estabs] = await Promise.all([
        consultaVet(COLUNAS_VET).range(0, fim),
        consultaEstab(COLUNAS_ESTAB).range(0, fim),
      ]);
      if (vets.error) throw vets.error;
      if (estabs.error) throw estabs.error;
      const a = ((vets.data ?? []) as unknown as LinhaVet[]).map(cartaoDeVeterinario);
      const b = ((estabs.data ?? []) as unknown as LinhaEstab[]).map(cartaoDeEstabelecimento);
      itens = intercalar(a, b).slice(inicio, inicio + POR_PAGINA);
      total = (vets.count ?? 0) + (estabs.count ?? 0);
    } else if (incluiVeterinarios) {
      const r = await paginaDeUmaTabela(
        () => consultaVet(COLUNAS_VET).range(inicio, inicio + POR_PAGINA - 1),
        () => consultaVet(COLUNAS_VET, true)
      );
      itens = (r.linhas as unknown as LinhaVet[]).map(cartaoDeVeterinario);
      total = r.total;
    } else {
      const r = await paginaDeUmaTabela(
        () => consultaEstab(COLUNAS_ESTAB).range(inicio, inicio + POR_PAGINA - 1),
        () => consultaEstab(COLUNAS_ESTAB, true)
      );
      itens = (r.linhas as unknown as LinhaEstab[]).map(cartaoDeEstabelecimento);
      total = r.total;
    }

    return {
      estado: "ok",
      itens,
      total,
      pagina,
      porPagina: POR_PAGINA,
      totalDePaginas: Math.min(Math.ceil(total / POR_PAGINA), PAGINA_MAXIMA),
      filtros,
      avisos: [],
    };
  } catch (erro) {
    const falha = classificarErro(erro);
    registrarFalha("busca", falha, erro);
    return { estado: falha };
  }
}

// ---------------------------------------------------------------------------

type Resposta = {
  data: unknown[] | null;
  error: PostgrestError | null;
  count: number | null;
};

/**
 * Uma página de uma tabela só. Pedir uma faixa além do fim faz o PostgREST
 * responder 416 (PGRST103) em vez de lista vazia; aí conta sem trazer linha,
 * para a tela poder dizer "esta página não existe, são N resultados".
 */
async function paginaDeUmaTabela(
  pagina: () => PromiseLike<Resposta>,
  soContagem: () => PromiseLike<Resposta>
): Promise<{ linhas: unknown[]; total: number }> {
  const r = await pagina();
  if (!r.error) return { linhas: r.data ?? [], total: r.count ?? 0 };
  if (r.error.code !== "PGRST103") throw r.error;

  const contagem = await soContagem();
  if (contagem.error) throw contagem.error;
  return { linhas: [], total: contagem.count ?? 0 };
}

/** `{"Banho & tosa"}`: literal de array do Postgres, com aspas escapadas. */
function literalDeArray(item: string): string {
  return `{"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"}`;
}

const COLACAO = new Intl.Collator("pt-BR", { sensitivity: "base" });

function antes(a: Cartao, b: Cartao): boolean {
  // nome nulo vai para o fim, como `nullsFirst: false` no banco
  if (a.nome === null && b.nome !== null) return false;
  if (a.nome !== null && b.nome === null) return true;
  const porNome = COLACAO.compare(a.nome ?? "", b.nome ?? "");
  if (porNome !== 0) return porNome < 0;
  if (a.tipo !== b.tipo) return a.tipo === "vet";
  return a.slug < b.slug;
}

function intercalar(a: Cartao[], b: Cartao[]): Cartao[] {
  const saida: Cartao[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    // empate fica com `a`: a ordem não depende de qual lista chegou antes
    if (!antes(b[j], a[i])) saida.push(a[i++]);
    else saida.push(b[j++]);
  }
  while (i < a.length) saida.push(a[i++]);
  while (j < b.length) saida.push(b[j++]);
  return saida;
}

function cartaoDeVeterinario(l: LinhaVet): CartaoDeVeterinario {
  return {
    tipo: "vet",
    slug: l.slug,
    href: `/veterinario/${l.slug}`,
    nome: l.nome_exibicao,
    titulo: rotuloDoTitulo(l.titulo),
    especialidades: l.especialidades ?? [],
    cidade: l.cidade,
    uf: l.estado,
    bairro: l.bairro,
    atendimento: {
      presencial: l.atende_presencial,
      domiciliar: l.atende_domiciliar,
      teleorientacao: l.atende_teleorientacao,
    },
  };
}

function cartaoDeEstabelecimento(l: LinhaEstab): CartaoDeEstabelecimento {
  return {
    tipo: "clinic",
    slug: l.slug,
    href: `/estabelecimento/${l.slug}`,
    nome: l.nome_fantasia,
    servicos: l.servicos ?? [],
    cidade: l.cidade,
    uf: l.estado,
  };
}
