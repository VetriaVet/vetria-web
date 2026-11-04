// T-042 · AS LEITURAS DE `contatos` PARA AS TELAS (DL-047, DL-071 D6, R-074).
//
// Duas telas leem daqui:
//   · "Contatos recebidos" do veterinário e do estabelecimento
//     (`/app/veterinario/contatos`, `/app/estabelecimento/contatos` e o cartão
//     do painel inicial);
//   · "Seus contatos" do responsável (`/app/responsavel/historico`).
//
// O que amarra este arquivo:
//   1. TODA leitura de `contatos` sai pela SESSÃO de quem está na tela
//      (`lib/supabase/server.ts`), nunca pelo `service_role`. Quem decide quais
//      linhas voltam são as policies da 0002 (`contatos_select_profissional`,
//      `contatos_select_responsavel`): o profissional A não alcança a linha do
//      B porque o Postgres não devolve, não porque a tela filtrou.
//   2. As colunas são pedidas PELO NOME. Desde a 0006 (§3) `authenticated` só
//      tem SELECT em `id, profissional_id, canal, origem_cidade,
//      origem_especialidade, created_at`. `select('*')` devolve 42501, e
//      `anon_id`/`user_id` não aparecem em nenhuma consulta daqui (D6: o
//      profissional não sabe quem clicou).
//   3. O filtro por `profissional_id` no painel do profissional NÃO é
//      segurança, é sentido: a policy do responsável (`user_id = auth.uid()`)
//      também vale para um veterinário que chamou outro profissional, e esse
//      contato que ELE fez não é um contato que ele RECEBEU.
//   4. O nome do profissional, em "Seus contatos", vem pelo cliente ANÔNIMO
//      (`lib/supabase/publico.ts`): só volta quem está `active`, pela mesma
//      policy da busca. Quem saiu do ar aparece como "perfil não disponível",
//      sem nome e sem link.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/publico";
import { classificarErro, registrarFalha } from "@/lib/publico/disponibilidade";

/** Quantas linhas a lista mostra. A contagem não tem esse teto. */
export const LIMITE_DA_LISTA = 50;

const FUSO = "America/Sao_Paulo";
const DIA_MS = 24 * 60 * 60 * 1000;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type ContatoRecebido = {
  id: string;
  quando: string;
  canal: string;
  /** "Veio de uma busca por Clínica geral em Goiânia (GO)" ou "Acesso direto ao seu perfil". */
  origem: string;
};

export type ContatosRecebidos =
  | {
      estado: "ok";
      ultimos30Dias: number;
      noMes: number;
      /** "novembro", para a frase do número. */
      nomeDoMes: string;
      lista: ContatoRecebido[];
    }
  | { estado: "erro" };

export type ContatoFeito = {
  id: string;
  quando: string;
  canal: string;
  /** Nulo quando o perfil saiu do ar (ou nunca foi encontrado). */
  perfil: { tipo: "vet" | "clinic"; nome: string; href: string } | null;
};

export type SeusContatos = { estado: "ok"; lista: ContatoFeito[] } | { estado: "erro" };

type LinhaDeContato = {
  id: string;
  profissional_id: string;
  canal: string;
  origem_cidade: string | null;
  origem_especialidade: string | null;
  created_at: string;
};

const COLUNAS_DO_PROFISSIONAL = "id, canal, origem_cidade, origem_especialidade, created_at";
const COLUNAS_DO_RESPONSAVEL = "id, profissional_id, canal, created_at";

// ---------------------------------------------------------------------------
// DATAS (sempre no horário de Brasília, que é o do produto)
// ---------------------------------------------------------------------------

/** Meia-noite do dia 1 do mês corrente em Brasília, como instante ISO. O Brasil
 *  não tem horário de verão desde 2019: o deslocamento é -03:00 o ano todo. */
function inicioDoMes(agora: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(agora);
  const ano = partes.find((p) => p.type === "year")?.value ?? String(agora.getUTCFullYear());
  const mes = partes.find((p) => p.type === "month")?.value ?? "01";
  return new Date(`${ano}-${mes}-01T00:00:00-03:00`).toISOString();
}

function nomeDoMes(agora: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, month: "long" }).format(agora);
}

/** "04/11/2026 às 18:03" */
export function formatarQuando(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const data = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
  const hora = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${data} às ${hora}`;
}

function rotuloDoCanal(canal: string): string {
  return canal === "whatsapp" ? "WhatsApp" : "Outro canal";
}

// ---------------------------------------------------------------------------
// "CONTATOS RECEBIDOS" (veterinário e estabelecimento)
// ---------------------------------------------------------------------------

/** Os nomes da origem (`cidades`, `especialidades`/`servicos`), lista pública. */
async function nomesDaOrigem(
  tipo: "vet" | "clinic",
  linhas: LinhaDeContato[]
): Promise<{ cidades: Map<string, string>; especialidades: Map<string, string> }> {
  const cidades = new Map<string, string>();
  const especialidades = new Map<string, string>();

  const slugsDeCidade = [
    ...new Set(linhas.map((l) => l.origem_cidade).filter((s): s is string => !!s && SLUG.test(s))),
  ];
  const slugsDeEspecialidade = [
    ...new Set(
      linhas.map((l) => l.origem_especialidade).filter((s): s is string => !!s && SLUG.test(s))
    ),
  ];
  if (slugsDeCidade.length === 0 && slugsDeEspecialidade.length === 0) {
    return { cidades, especialidades };
  }

  // A origem é enfeite da linha: se as listas falharem, a linha continua, só
  // sem o nome. O contato não some por causa disso.
  try {
    const publico = await createPublicClient();
    const tabela = tipo === "vet" ? "especialidades" : "servicos";
    const [ci, es] = await Promise.all([
      slugsDeCidade.length
        ? publico.from("cidades").select("slug, nome, uf").in("slug", slugsDeCidade)
        : Promise.resolve({ data: [], error: null }),
      slugsDeEspecialidade.length
        ? publico.from(tabela).select("slug, nome").in("slug", slugsDeEspecialidade)
        : Promise.resolve({ data: [], error: null }),
    ]);
    for (const c of (ci.data ?? []) as { slug: string; nome: string; uf: string }[]) {
      cidades.set(c.slug, `${c.nome} (${c.uf})`);
    }
    for (const e of (es.data ?? []) as { slug: string; nome: string }[]) {
      especialidades.set(e.slug, e.nome);
    }
    if (ci.error) registrarFalha("contatos/origem-cidade", classificarErro(ci.error), ci.error);
    if (es.error) registrarFalha("contatos/origem-especialidade", classificarErro(es.error), es.error);
  } catch (erro) {
    registrarFalha("contatos/origem", classificarErro(erro), erro);
  }
  return { cidades, especialidades };
}

function fraseDaOrigem(
  tipo: "vet" | "clinic",
  cidade: string | null,
  especialidade: string | null
): string {
  if (especialidade && cidade) return `Veio de uma busca por ${especialidade} em ${cidade}`;
  if (especialidade) return `Veio de uma busca por ${especialidade}`;
  if (cidade) return `Veio de uma busca em ${cidade}`;
  return tipo === "vet" ? "Acesso direto ao seu perfil" : "Acesso direto ao perfil do estabelecimento";
}

export async function carregarContatosRecebidos(
  profissionalId: string,
  tipo: "vet" | "clinic",
  /** Quantas linhas da lista (o cartão do painel inicial pede 3). */
  limite = LIMITE_DA_LISTA
): Promise<ContatosRecebidos> {
  const agora = new Date();
  const desde30 = new Date(agora.getTime() - 30 * DIA_MS).toISOString();
  const desdeOMes = inicioDoMes(agora);

  try {
    const supabase = await createClient();
    const contar = (desde: string) =>
      supabase
        .from("contatos")
        .select("id", { count: "exact", head: true })
        .eq("profissional_id", profissionalId)
        .gte("created_at", desde);

    const [trinta, mes, lista] = await Promise.all([
      contar(desde30),
      contar(desdeOMes),
      supabase
        .from("contatos")
        .select(COLUNAS_DO_PROFISSIONAL)
        .eq("profissional_id", profissionalId)
        .order("created_at", { ascending: false })
        .limit(Math.min(Math.max(limite, 1), LIMITE_DA_LISTA)),
    ]);

    const erro = trinta.error ?? mes.error ?? lista.error;
    if (erro) {
      registrarFalha("contatos/recebidos", classificarErro(erro), erro);
      return { estado: "erro" };
    }

    const linhas = (lista.data ?? []) as LinhaDeContato[];
    const nomes = await nomesDaOrigem(tipo, linhas);

    return {
      estado: "ok",
      ultimos30Dias: trinta.count ?? 0,
      noMes: mes.count ?? 0,
      nomeDoMes: nomeDoMes(agora),
      lista: linhas.map((l) => ({
        id: l.id,
        quando: formatarQuando(l.created_at),
        canal: rotuloDoCanal(l.canal),
        origem: fraseDaOrigem(
          tipo,
          l.origem_cidade ? (nomes.cidades.get(l.origem_cidade) ?? null) : null,
          l.origem_especialidade ? (nomes.especialidades.get(l.origem_especialidade) ?? null) : null
        ),
      })),
    };
  } catch (erro) {
    registrarFalha("contatos/recebidos", classificarErro(erro), erro);
    return { estado: "erro" };
  }
}

// ---------------------------------------------------------------------------
// "SEUS CONTATOS" (responsável)
// ---------------------------------------------------------------------------

type PerfilAtivo = { tipo: "vet" | "clinic"; nome: string; href: string };

/** Nome e endereço de quem ainda está `active`, pelo cliente anônimo. */
async function perfisAtivos(ids: string[]): Promise<Map<string, PerfilAtivo>> {
  const achados = new Map<string, PerfilAtivo>();
  if (ids.length === 0) return achados;

  const publico = await createPublicClient();
  const [vets, estabs] = await Promise.all([
    publico.from("vet_profiles").select("id, slug, nome_exibicao").in("id", ids),
    publico.from("clinic_profiles").select("id, slug, nome_fantasia").in("id", ids),
  ]);
  const erro = vets.error ?? estabs.error;
  if (erro) throw erro;

  for (const v of (vets.data ?? []) as { id: string; slug: string | null; nome_exibicao: string | null }[]) {
    if (v.slug && SLUG.test(v.slug)) {
      achados.set(v.id, {
        tipo: "vet",
        nome: v.nome_exibicao?.trim() || "Veterinário",
        href: `/veterinario/${v.slug}`,
      });
    }
  }
  for (const c of (estabs.data ?? []) as { id: string; slug: string | null; nome_fantasia: string | null }[]) {
    if (c.slug && SLUG.test(c.slug)) {
      achados.set(c.id, {
        tipo: "clinic",
        nome: c.nome_fantasia?.trim() || "Estabelecimento",
        href: `/estabelecimento/${c.slug}`,
      });
    }
  }
  return achados;
}

export async function carregarSeusContatos(responsavelId: string): Promise<SeusContatos> {
  try {
    const supabase = await createClient();
    // `neq` pelo mesmo motivo do item 3 lá em cima, ao contrário: o que a
    // pessoa RECEBEU (se um dia tiver perfil profissional) não é o que ela FEZ.
    const { data, error } = await supabase
      .from("contatos")
      .select(COLUNAS_DO_RESPONSAVEL)
      .neq("profissional_id", responsavelId)
      .order("created_at", { ascending: false })
      .limit(LIMITE_DA_LISTA);
    if (error) {
      registrarFalha("contatos/seus", classificarErro(error), error);
      return { estado: "erro" };
    }

    const linhas = (data ?? []) as Pick<LinhaDeContato, "id" | "profissional_id" | "canal" | "created_at">[];
    const perfis = await perfisAtivos([...new Set(linhas.map((l) => l.profissional_id))]);

    return {
      estado: "ok",
      lista: linhas.map((l) => ({
        id: l.id,
        quando: formatarQuando(l.created_at),
        canal: rotuloDoCanal(l.canal),
        perfil: perfis.get(l.profissional_id) ?? null,
      })),
    };
  } catch (erro) {
    registrarFalha("contatos/seus", classificarErro(erro), erro);
    return { estado: "erro" };
  }
}
