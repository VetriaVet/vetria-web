// As listas da busca (tabelas de apoio da `0005`, leitura pública, DL-068).
//
// ⚠️ DEPENDE DA 0005. Antes dela, `especialidades`, `servicos` e `cidades` não
// existem, o PostgREST responde PGRST205, e tudo aqui devolve
// `{ estado: "indisponivel" }`. É esse o sinal que a `/buscar` usa para dizer
// "A busca abre em breve" em vez de cair.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/publico";
import { classificarErro, registrarFalha } from "@/lib/publico/disponibilidade";
import { chaveDeNome } from "@/lib/publico/normalizar";
import type {
  CidadeResolvida,
  ItemDeLista,
  OpcoesDaBusca,
  SugestoesDeCidade,
} from "./tipos";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Especialidades e serviços, na ordem da tabela (a mesma do formulário). */
export async function carregarOpcoesDaBusca(): Promise<OpcoesDaBusca> {
  try {
    const supabase = await createPublicClient();
    const [esp, serv] = await Promise.all([
      supabase.from("especialidades").select("nome, slug").order("ordem"),
      supabase.from("servicos").select("nome, slug").order("ordem"),
    ]);
    const erro = esp.error ?? serv.error;
    if (erro) {
      const falha = classificarErro(erro);
      registrarFalha("busca/opcoes", falha, erro);
      return { estado: falha };
    }
    return {
      estado: "ok",
      especialidades: (esp.data ?? []) as ItemDeLista[],
      servicos: (serv.data ?? []) as ItemDeLista[],
    };
  } catch (erro) {
    const falha = classificarErro(erro);
    registrarFalha("busca/opcoes", falha, erro);
    return { estado: falha };
  }
}

/**
 * Autocompletar de cidade: até `limite` municípios cuja chave começa com a
 * chave do que foi digitado ("goian" → Goianápolis, Goiandira, Goianésia,
 * Goiânia...). Usa `idx_cidades_chave_prefixo`. Menos de 2 letras úteis
 * devolve lista vazia sem consultar.
 *
 * Ainda não tem rota: quem ligar o autocompletar na tela (S6) expõe isto por
 * Route Handler ou Server Action. É leitura de lista pública; não há dado de
 * ninguém aqui.
 */
export async function sugerirCidades(
  digitado: string,
  uf: string | null = null,
  limite = 10
): Promise<SugestoesDeCidade> {
  const chave = chaveDeNome(digitado).slice(0, 80);
  if (chave.length < 2) return { estado: "ok", cidades: [] };

  try {
    const supabase = await createPublicClient();
    let consulta = supabase
      .from("cidades")
      .select("nome, uf, slug, chave")
      .like("chave", `${chave}%`)
      .order("chave")
      .order("uf")
      .limit(Math.min(Math.max(limite, 1), 20));
    if (uf) consulta = consulta.eq("uf", uf);

    const { data, error } = await consulta;
    if (error) {
      const falha = classificarErro(error);
      registrarFalha("busca/cidades", falha, error);
      return { estado: falha };
    }
    return { estado: "ok", cidades: (data ?? []) as CidadeResolvida[] };
  } catch (erro) {
    const falha = classificarErro(erro);
    registrarFalha("busca/cidades", falha, erro);
    return { estado: falha };
  }
}

export type CidadeLida =
  | { estado: "ok"; cidade: CidadeResolvida }
  | { estado: "desconhecida" }
  | { estado: "ambigua" };

/**
 * Transforma o `?cidade=` numa cidade da lista do IBGE.
 *   1. Se parece slug (`goiania-go`), procura pelo slug.
 *   2. Senão (ou se não achou), procura pela chave do nome ("Goiânia",
 *      "goiania"), na UF se ela veio. O mesmo nome em duas UFs sem UF
 *      informada é `ambigua`: a busca não escolhe por quem pesquisa.
 * Erro do banco sobe (quem chama já está dentro de try/catch).
 */
export async function lerCidade(
  supabase: SupabaseClient,
  texto: string,
  uf: string | null
): Promise<CidadeLida> {
  const minusculo = texto.trim().toLowerCase();

  if (SLUG.test(minusculo) && minusculo.length <= 130) {
    const { data, error } = await supabase
      .from("cidades")
      .select("nome, uf, slug, chave")
      .eq("slug", minusculo)
      .maybeSingle();
    if (error) throw error;
    if (data) return { estado: "ok", cidade: data as CidadeResolvida };
  }

  const chave = chaveDeNome(texto);
  if (!chave) return { estado: "desconhecida" };

  let consulta = supabase
    .from("cidades")
    .select("nome, uf, slug, chave")
    .eq("chave", chave)
    .limit(2);
  if (uf) consulta = consulta.eq("uf", uf);

  const { data, error } = await consulta;
  if (error) throw error;
  if (!data || data.length === 0) return { estado: "desconhecida" };
  if (data.length > 1) return { estado: "ambigua" };
  return { estado: "ok", cidade: data[0] as CidadeResolvida };
}

/** Um item de `especialidades` / `servicos` pelo slug da URL. */
export async function lerItemDeLista(
  supabase: SupabaseClient,
  tabela: "especialidades" | "servicos",
  slug: string
): Promise<ItemDeLista | null> {
  if (!SLUG.test(slug) || slug.length > 60) return null;
  const { data, error } = await supabase
    .from(tabela)
    .select("nome, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as ItemDeLista | null) ?? null;
}
