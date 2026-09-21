import { createClient } from "@/lib/supabase/server";

// T-023 — TODA LEITURA DA FILA DE VALIDAÇÃO MORA NESTE ARQUIVO.
//
// Por que um módulo separado e não duas páginas com `select` dentro: a lista e
// o detalhe leem as MESMAS quatro tabelas com regras diferentes de exposição,
// e o jeito de isso divergir em silêncio é cada página ter a própria consulta.
// Aqui dá para auditar a superfície inteira num arquivo só — que é a pergunta
// que o `vetria-seguranca` vai fazer: "quais colunas de terceiro esta task
// passou a ler, e quais delas chegam no HTML?".
//
// ⚠️ NADA DE `service_role` AQUI. A leitura é do admin, com a sessão dele,
// sob RLS. As policies que sustentam isto já existem desde a `0002` e não
// precisaram de uma linha de SQL nova:
//   · `profiles_select_admin`        (0002:628) — `is_admin() and role in ('vet','clinic')`
//   · `vet_profiles_select_admin`    (0002:506)
//   · `clinic_profiles_select_admin` (0002:540)
//   · `perfil_privado_select_admin`  (0002:564)
// As quatro usam `is_admin()`, que é `SECURITY DEFINER` + `SET search_path`
// (DL-014/015) e vale para admin comum E master. Ou seja: **admin comum e
// master enxergam exatamente a mesma fila**, que é o que a matriz §5 manda
// ("Ver fila de validação: ✅ / ✅"). O que os separa é `/admin/usuarios`.
//
// ⚠️ O FILTRO DE VISIBILIDADE RODA NO POSTGRES, não aqui e nunca no cliente.
// `status = 'pending_validation'` e `role in ('vet','clinic')` são cláusulas
// da consulta, e a segunda é redundante de propósito: para admin comum a
// própria policy já a impõe, mas o master lê a base inteira por
// `profiles_select_all_master` (0000:168). Sem a cláusula, a fila do master
// seria outra fila — e uma regra que muda de resultado conforme quem olha é
// exatamente o tipo de defeito que ninguém percebe até valer dinheiro.

export type RoleProfissional = "vet" | "clinic";

export const ROLES_DA_FILA: readonly RoleProfissional[] = ["vet", "clinic"];

/** DL-043: rota em português, role em inglês. Aqui só a exibição é traduzida;
 *  o valor no banco continua `vet` e `clinic`. */
export const PERSONA_LABEL: Record<RoleProfissional, string> = {
  vet: "Veterinário",
  clinic: "Estabelecimento",
};

export const POR_PAGINA = 20;

// ---------------------------------------------------------------------------
// O LOG DE ERRO — E O QUE ELE NÃO ACEITA
// ---------------------------------------------------------------------------
// ⚠️ SEC-056, clonado de propósito de `app/app/*/onboarding/actions.ts`:
// o tipo abaixo NÃO tem `details`, e não é esquecimento. O campo DETAIL do
// Postgres vem como `Failing row contains (<uuid>, <whatsapp>, <cnpj>, ...)`:
// é a LINHA INTEIRA, com o dado que `perfil_privado` existe para proteger.
// Isso iria para o log da Vercel, que está fora do alcance da rotina de
// exportação e exclusão da F6 (mesmo padrão do R-024). `code` e `message`
// bastam para depurar.
//
// ⚠️ Quem clonar isto: não acrescente `details` de volta "só pra depurar".
// E nesta tela o risco é maior que nas Actions, porque aqui as linhas são de
// TERCEIROS: CNPJ, razão social, responsável técnico e WhatsApp de gente que
// não é quem está olhando.
type DetalheDoBanco = { message: string; code?: string };

function registrarErro(contexto: string, detalhe: DetalheDoBanco) {
  console.error(`[admin/validacoes] ${contexto}`, {
    message: detalhe.message,
    code: detalhe.code,
  });
}

/** Mensagem para a tela. Nunca ecoa o erro do banco: o admin não precisa do
 *  texto do Postgres, e o texto do Postgres às vezes carrega dado da linha. */
const ERRO_GENERICO =
  "Não foi possível carregar a fila agora. Tente de novo em alguns instantes.";

// ---------------------------------------------------------------------------
// A LISTA
// ---------------------------------------------------------------------------

/** O que a LISTA mostra. Repare no que não está aqui: nem CNPJ, nem razão
 *  social, nem responsável técnico, nem WhatsApp, nem telefone, nem o caminho
 *  do documento. A matriz §5 deixa o admin ver essas quatro coisas, e elas
 *  aparecem no DETALHE, uma conta por vez — não em vinte linhas de HTML de uma
 *  vez só. Ver `docs/06-PERMISSOES.md` §3, regra 3. */
export type ItemDaFila = {
  id: string;
  role: RoleProfissional;
  /** `nome_exibicao` (vet) ou `nome_fantasia` (estabelecimento), com
   *  `profiles.full_name` de reserva. Pode ser nulo: o cadastro pode ter
   *  chegado incompleto, e a tela diz isso em vez de inventar um nome. */
  nome: string | null;
  /** CRMV do veterinário, já formatado. Nulo para estabelecimento: o
   *  identificador dele é o CNPJ, que é PRIVADO por decisão (DL-053). */
  registro: string | null;
  local: string | null;
  criadoEm: string;
  atualizadoEm: string;
  /** ⚠️ ESTADO DE PRIMEIRA CLASSE (SEC-088). Nulo = concluiu o onboarding sem
   *  enviar documento, o que hoje é alcançável: a obrigatoriedade é regra de
   *  tela (o botão fica `disabled`) e nenhuma das duas Server Actions confere
   *  documento. Enquanto a T-022 não for decidida, a fila recebe esses
   *  cadastros e precisa mostrá-los como são. */
  documentoEnviadoEm: string | null;
};

export type ResultadoDaFila = {
  itens: ItemDaFila[];
  total: number;
  erro: string | null;
};

type LinhaPerfil = {
  id: string;
  role: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

type VetDaLista = {
  id: string;
  nome_exibicao: string | null;
  crmv: string | null;
  crmv_uf: string | null;
  cidade: string | null;
  estado: string | null;
};

type ClinicDaLista = {
  id: string;
  nome_fantasia: string | null;
  cidade: string | null;
  estado: string | null;
};

type DocumentoDaLista = {
  id: string;
  documento_enviado_em: string | null;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

// As três leituras de complemento da lista. Cada uma devolve array vazio em
// caso de erro, e o erro vai para o log do servidor: a fila continua na tela
// com o que deu para ler. Perder o nome de exibição de uma linha não pode
// apagar a fila inteira da cara de quem precisa trabalhar nela.
async function lerVetsDaLista(supabase: Supabase, ids: string[]) {
  if (ids.length === 0) return [] as VetDaLista[];
  const { data, error } = await supabase
    .from("vet_profiles")
    .select("id, nome_exibicao, crmv, crmv_uf, cidade, estado")
    .in("id", ids);
  if (error) {
    registrarErro("leitura de vet_profiles", error);
    return [] as VetDaLista[];
  }
  return (data ?? []) as VetDaLista[];
}

async function lerClinicsDaLista(supabase: Supabase, ids: string[]) {
  if (ids.length === 0) return [] as ClinicDaLista[];
  const { data, error } = await supabase
    .from("clinic_profiles")
    .select("id, nome_fantasia, cidade, estado")
    .in("id", ids);
  if (error) {
    registrarErro("leitura de clinic_profiles", error);
    return [] as ClinicDaLista[];
  }
  return (data ?? []) as ClinicDaLista[];
}

// ⚠️ SÓ `documento_enviado_em`. `perfil_privado` é a tabela do WhatsApp, do
// CNPJ e do caminho do documento; pedir `*` aqui traria tudo isso para a lista
// sem necessidade nenhuma. A coluna pedida é um carimbo de tempo, e responde a
// única pergunta que a LISTA faz: tem documento para o admin abrir, ou não tem?
async function lerDocumentosDaLista(supabase: Supabase, ids: string[]) {
  if (ids.length === 0) return [] as DocumentoDaLista[];
  const { data, error } = await supabase
    .from("perfil_privado")
    .select("id, documento_enviado_em")
    .in("id", ids);
  if (error) {
    registrarErro("leitura de perfil_privado", error);
    return [] as DocumentoDaLista[];
  }
  return (data ?? []) as DocumentoDaLista[];
}

export async function carregarFila(pagina: number): Promise<ResultadoDaFila> {
  const supabase = await createClient();

  const primeiro = (pagina - 1) * POR_PAGINA;
  const ultimo = primeiro + POR_PAGINA - 1;

  const {
    data: perfis,
    count,
    error,
  } = await supabase
    .from("profiles")
    .select("id, role, full_name, created_at, updated_at", { count: "exact" })
    .eq("status", "pending_validation")
    .in("role", ROLES_DA_FILA)
    // Quem espera há mais tempo aparece primeiro. `updated_at` é o carimbo que
    // `concluir_onboarding_profissional()` move ao pôr a conta na fila
    // (`0002:753-756`) — e é por isso que a coluna na tela se chama
    // "atualizado em", e não "entrou na fila em": uma edição posterior do
    // cadastro move este carimbo também, e a tela não vai afirmar o que o dado
    // não sustenta.
    .order("updated_at", { ascending: true })
    .range(primeiro, ultimo);

  if (error) {
    // ⚠️ `?pagina=90` numa fila de 3 pessoas NÃO é erro de servidor.
    // O `range()` vira um header `Range` e o PostgREST responde **416** quando
    // o começo do intervalo passa do fim da coleção — que chega aqui como
    // `PGRST103`. Tratar isso como falha pintaria uma caixa vermelha de erro
    // para quem só digitou um número grande na barra de endereço. Aqui vira
    // "esta página está vazia, a fila não está", e quem diz o tamanho da fila
    // é uma contagem sem corpo (`head: true`).
    if (error.code === "PGRST103") {
      const { count: totalReal } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_validation")
        .in("role", ROLES_DA_FILA);

      return { itens: [], total: totalReal ?? 0, erro: null };
    }

    registrarErro("leitura da fila", error);
    return { itens: [], total: 0, erro: ERRO_GENERICO };
  }

  const linhas = (perfis ?? []) as LinhaPerfil[];
  const total = count ?? linhas.length;

  if (linhas.length === 0) {
    return { itens: [], total, erro: null };
  }

  const idsVet = linhas.filter((l) => l.role === "vet").map((l) => l.id);
  const idsClinic = linhas.filter((l) => l.role === "clinic").map((l) => l.id);
  const ids = linhas.map((l) => l.id);

  // Três consultas por `in (…)` em cima dos ids DESTA PÁGINA. Não é a base
  // inteira, e não é uma consulta por linha.
  const [vets, clinics, documentos] = await Promise.all([
    lerVetsDaLista(supabase, idsVet),
    lerClinicsDaLista(supabase, idsClinic),
    lerDocumentosDaLista(supabase, ids),
  ]);

  const porIdVet = new Map(vets.map((v) => [v.id, v]));
  const porIdClinic = new Map(clinics.map((c) => [c.id, c]));
  const porIdPrivado = new Map(documentos.map((p) => [p.id, p]));

  const itens: ItemDaFila[] = linhas.map((linha) => {
    const role: RoleProfissional = linha.role === "vet" ? "vet" : "clinic";
    const vet = porIdVet.get(linha.id);
    const clinic = porIdClinic.get(linha.id);
    const privado = porIdPrivado.get(linha.id);

    const nome =
      (role === "vet" ? vet?.nome_exibicao : clinic?.nome_fantasia) ??
      linha.full_name ??
      null;

    return {
      id: linha.id,
      role,
      nome: texto(nome),
      registro: role === "vet" ? formatarCrmv(vet?.crmv, vet?.crmv_uf) : null,
      local: formatarLocal(
        role === "vet" ? vet?.cidade : clinic?.cidade,
        role === "vet" ? vet?.estado : clinic?.estado
      ),
      criadoEm: linha.created_at,
      atualizadoEm: linha.updated_at,
      documentoEnviadoEm: privado?.documento_enviado_em ?? null,
    };
  });

  return { itens, total, erro: null };
}

// ---------------------------------------------------------------------------
// O DETALHE
// ---------------------------------------------------------------------------

export type LinhaVet = {
  nome_exibicao: string | null;
  titulo: string | null;
  crmv: string | null;
  crmv_uf: string | null;
  especialidades: string[] | null;
  experiencia: string | null;
  bio: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  atende_presencial: boolean | null;
  atende_domiciliar: boolean | null;
  atende_teleorientacao: boolean | null;
};

export type LinhaClinic = {
  nome_fantasia: string | null;
  endereco: string | null;
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  sobre: string | null;
  servicos: string[] | null;
  site: string | null;
};

/** ⚠️ O CONTEÚDO DESTE TIPO É DADO PRIVADO (DL-053 / matriz §3).
 *  A matriz §5 dá ao admin e ao master o direito de VER isto na fila de
 *  validação, e é só por isso que ele é lido aqui: sem CNPJ e sem CRMV não há
 *  o que validar. O que continua valendo:
 *  · nunca vai para log (ver `registrarErro` acima)
 *  · nunca vai para URL
 *  · nunca vira link `wa.me` no HTML — o WhatsApp aparece como TEXTO, e o
 *    evento de contato do DL-047 não tem nada a ver com esta tela.
 *  · `documento_path` NÃO está aqui: o caminho do objeto no bucket nunca
 *    chega ao navegador. A rota `/api/documentos/abrir` lê o caminho da
 *    tabela por conta própria e só devolve a URL assinada. */
export type LinhaPrivada = {
  whatsapp: string | null;
  telefone: string | null;
  email_contato: string | null;
  razao_social: string | null;
  cnpj: string | null;
  responsavel_tecnico: string | null;
  documento_enviado_em: string | null;
  documento_tamanho: number | null;
  documento_hash: string | null;
};

export type Cadastro = {
  id: string;
  role: RoleProfissional;
  fullName: string | null;
  status: string;
  statusMotivo: string | null;
  criadoEm: string;
  atualizadoEm: string;
  vet: LinhaVet | null;
  clinic: LinhaClinic | null;
  privado: LinhaPrivada | null;
  /** Houve erro ao ler o complemento (perfil profissional ou privado). O
   *  detalhe continua renderizando o que conseguiu, dizendo que faltou algo:
   *  tela em branco no meio de uma decisão é pior que tela incompleta. */
  erroParcial: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ehUuid(valor: string): boolean {
  return UUID.test(valor);
}

/**
 * Carrega uma conta da fila. Devolve `null` quando não há linha visível para
 * quem pede — e "não visível" cobre três casos de uma vez, de propósito:
 * a conta não existe, a conta é de um responsável ou de outro admin (a policy
 * `profiles_select_admin` não a entrega ao admin comum), ou o uuid é lixo.
 * Quem chama transforma isso em `notFound()`.
 */
export async function carregarCadastro(id: string): Promise<Cadastro | null> {
  if (!ehUuid(id)) return null;

  const supabase = await createClient();

  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, status, status_motivo, created_at, updated_at")
    .eq("id", id)
    .in("role", ROLES_DA_FILA)
    .maybeSingle<{
      id: string;
      role: string;
      full_name: string | null;
      status: string;
      status_motivo: string | null;
      created_at: string;
      updated_at: string;
    }>();

  if (error) {
    registrarErro("leitura do cadastro", error);
    return null;
  }

  if (!perfil) return null;

  const role: RoleProfissional = perfil.role === "vet" ? "vet" : "clinic";

  const [vet, clinic, privado] = await Promise.all([
    role === "vet" ? lerVet(supabase, id) : Promise.resolve(vazio<LinhaVet>()),
    role === "clinic" ? lerClinic(supabase, id) : Promise.resolve(vazio<LinhaClinic>()),
    lerPrivado(supabase, id),
  ]);

  let erroParcial: string | null = null;

  if (vet.falhou || clinic.falhou) {
    erroParcial = "Não foi possível ler os dados do cadastro.";
  }

  if (privado.falhou) {
    erroParcial = erroParcial
      ? "Não foi possível ler parte deste cadastro."
      : "Não foi possível ler os dados de identificação e contato.";
  }

  return {
    id: perfil.id,
    role,
    fullName: texto(perfil.full_name),
    status: perfil.status,
    statusMotivo: texto(perfil.status_motivo),
    criadoEm: perfil.created_at,
    atualizadoEm: perfil.updated_at,
    vet: vet.linha,
    clinic: clinic.linha,
    privado: privado.linha,
    erroParcial,
  };
}

type Complemento<T> = { linha: T | null; falhou: boolean };

function vazio<T>(): Complemento<T> {
  return { linha: null, falhou: false };
}

async function lerVet(supabase: Supabase, id: string): Promise<Complemento<LinhaVet>> {
  const { data, error } = await supabase
    .from("vet_profiles")
    .select(
      "nome_exibicao, titulo, crmv, crmv_uf, especialidades, experiencia, bio, cidade, estado, bairro, atende_presencial, atende_domiciliar, atende_teleorientacao"
    )
    .eq("id", id)
    .maybeSingle<LinhaVet>();
  if (error) {
    registrarErro("leitura do perfil do veterinário", error);
    return { linha: null, falhou: true };
  }
  return { linha: data ?? null, falhou: false };
}

async function lerClinic(supabase: Supabase, id: string): Promise<Complemento<LinhaClinic>> {
  const { data, error } = await supabase
    .from("clinic_profiles")
    .select("nome_fantasia, endereco, cep, cidade, estado, sobre, servicos, site")
    .eq("id", id)
    .maybeSingle<LinhaClinic>();
  if (error) {
    registrarErro("leitura do perfil do estabelecimento", error);
    return { linha: null, falhou: true };
  }
  return { linha: data ?? null, falhou: false };
}

async function lerPrivado(supabase: Supabase, id: string): Promise<Complemento<LinhaPrivada>> {
  // ⚠️ `documento_path` NÃO está nesta lista, e a ausência é deliberada: o
  // caminho do objeto no bucket não tem por que chegar ao navegador. Quem
  // precisa dele é `/api/documentos/abrir`, que o lê da própria tabela.
  const { data, error } = await supabase
    .from("perfil_privado")
    .select(
      "whatsapp, telefone, email_contato, razao_social, cnpj, responsavel_tecnico, documento_enviado_em, documento_tamanho, documento_hash"
    )
    .eq("id", id)
    .maybeSingle<LinhaPrivada>();
  if (error) {
    registrarErro("leitura dos dados privados", error);
    return { linha: null, falhou: true };
  }
  return { linha: data ?? null, falhou: false };
}

// ---------------------------------------------------------------------------
// FORMATAÇÃO
// ---------------------------------------------------------------------------

/** String vazia é ausência de dado, não dado. Sem isto a tela mostra um campo
 *  em branco como se estivesse preenchido. */
export function texto(valor: string | null | undefined): string | null {
  const limpo = (valor ?? "").trim();
  return limpo.length > 0 ? limpo : null;
}

export function formatarCrmv(
  crmv: string | null | undefined,
  uf: string | null | undefined
): string | null {
  const numero = texto(crmv);
  const estado = texto(uf);
  if (!numero) return null;
  return estado ? `CRMV-${estado} ${numero}` : `CRMV ${numero}`;
}

export function formatarLocal(
  cidade: string | null | undefined,
  estado: string | null | undefined
): string | null {
  const c = texto(cidade);
  const e = texto(estado);
  if (c && e) return `${c} / ${e}`;
  return c ?? e ?? null;
}

// Fuso fixo de Brasília: o servidor da Vercel roda em UTC, e "aprovado às
// 3h da manhã" é a mesma confusão que faz um admin achar que a fila está
// parada. O rótulo na tela diz qual é o fuso.
const FORMATO_DATA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatarDataHora(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return FORMATO_DATA.format(data);
}

export function formatarTamanho(bytes: number | null): string | null {
  if (bytes === null || bytes === undefined || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
