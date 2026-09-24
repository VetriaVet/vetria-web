// O CLIENTE DE SERVIÇO DA SUÍTE — só existe no projeto de TESTE.
//
// ⚠️ DL-064: a `service_role` do projeto `vetria-e2e` é secret do CI; a de
// produção, NUNCA. Este arquivo é o único lugar de `tests/` que cria cliente
// com ela, e ele só cria depois de `exigirAlvoDeTeste()` conferir o alvo (ver
// `alvo.ts`). Não há outro caminho: quem precisar de escrita privilegiada
// passa por aqui.
//
// Para que ela serve, e para que NÃO serve:
//   SERVE  para PREPARAR o estado no começo (conta vet fixa na fila, com
//          documento; conta descartável por rodada) e para LIMPAR no fim. E
//          para LER o banco depois de uma ação, porque o que a tela diz não é
//          prova de que o banco mudou.
//   NÃO SERVE para fazer o que o produto deveria fazer. Aprovar, reprovar,
//          concluir onboarding e subir documento pelo produto são feitos pela
//          TELA ou pela API com a sessão do usuário. A `service_role` escreve
//          `profiles.status` em dois lugares: `garantirVetFixoNaFila`, que é
//          preparação (devolver a conta fixa ao estado de partida), e
//          `suspenderNoLugarDoMaster` (F4), cuja exceção está escrita nela.
//
// ⚠️ Nenhuma função daqui imprime chave, senha ou token. As mensagens de erro
// levam o `code` e a `message` do Supabase, que não carregam segredo.

import { createHash, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { exigirAlvoDeTeste } from "./alvo";
import type { Credencial } from "./credenciais";

// ---------------------------------------------------------------------------
// CLIENTES
// ---------------------------------------------------------------------------

let servico: SupabaseClient | null = null;

export function clienteDeServico(): SupabaseClient {
  if (servico) return servico;
  const alvo = exigirAlvoDeTeste();
  servico = createClient(alvo.url, alvo.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return servico;
}

/** Cliente com a sessão de um usuário, pela chave anon: é o que um navegador
 *  (ou um atacante com DevTools) tem na mão. Sob RLS, como no produto. */
export async function clienteDoUsuario(
  credencial: Credencial
): Promise<{ cliente: SupabaseClient; id: string }> {
  const alvo = exigirAlvoDeTeste();
  const cliente = createClient(alvo.url, alvo.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await cliente.auth.signInWithPassword({
    email: credencial.email,
    password: credencial.senha,
  });
  if (error || !data.user) {
    throw new Error(
      `clienteDoUsuario: login pela API recusado (${error?.code ?? error?.status ?? "sem usuario"}: ${error?.message ?? ""}).`
    );
  }
  return { cliente, id: data.user.id };
}

// ---------------------------------------------------------------------------
// CONTAS DESCARTÁVEIS
// ---------------------------------------------------------------------------
// O endereço é derivado do email da conta vet fixa (secret), com uma marca que
// nenhuma conta fixa tem: `+e2e-d-`. É por essa marca que a varredura acha o
// lixo de rodada que morreu no meio. Nenhum email é enviado para esse
// endereço: "Confirm email" está desligado no vetria-e2e, `createUser` com
// `email_confirm: true` não manda nada, e o CI não tem RESEND_API_KEY.

export const MARCA_DESCARTAVEL = "+e2e-d-";

function baseDoEmail(): { local: string; dominio: string } {
  const base = process.env.E2E_EMAIL_DESCARTAVEL_BASE?.trim() || process.env.E2E_VET_EMAIL?.trim();
  if (!base || !base.includes("@")) {
    throw new Error(
      "emailDescartavel: sem E2E_EMAIL_DESCARTAVEL_BASE nem E2E_VET_EMAIL para derivar o endereco da conta descartavel."
    );
  }
  const [localBruto, dominio] = base.split("@");
  return { local: localBruto.split("+")[0], dominio };
}

export function emailDescartavel(tipo: string): string {
  const { local, dominio } = baseDoEmail();
  const sufixo = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
  return `${local}${MARCA_DESCARTAVEL}${tipo}-${sufixo}@${dominio}`;
}

/** Senha que passa na regra da T-034 (8+, maiúscula, minúscula, número). */
export function senhaDescartavel(): string {
  return `QaE2e${randomBytes(6).toString("hex")}9x`;
}

export type ContaDescartavel = Credencial & { id: string; nome: string };

const criadasNestaRodada = new Set<string>();
const emailsNestaRodada = new Set<string>();

/** Anota um email ANTES de a conta existir (cadastro pela tela), para o
 *  `afterAll` apagar mesmo se o teste morrer entre o clique e a leitura do id. */
export function anotarEmailParaLimpar(email: string): void {
  emailsNestaRodada.add(email.toLowerCase());
}

export async function criarContaDescartavel(
  role: "vet" | "clinic" | "tutor",
  nome: string
): Promise<ContaDescartavel> {
  const email = emailDescartavel(role);
  const senha = senhaDescartavel();
  anotarEmailParaLimpar(email);

  const { data, error } = await clienteDeServico().auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    // O trigger `handle_new_user` lê `role` e `full_name` daqui, igual ao
    // cadastro pela tela. `admin` nunca passa (cai em `tutor`).
    user_metadata: { role, full_name: nome },
  });
  if (error || !data.user) {
    throw new Error(`criarContaDescartavel: ${error?.code ?? error?.status ?? "?"}: ${error?.message ?? "sem usuario"}`);
  }
  criadasNestaRodada.add(data.user.id);
  return { id: data.user.id, email, senha, nome };
}

async function listarUsuarios() {
  const todos: { id: string; email?: string; created_at: string }[] = [];
  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await clienteDeServico().auth.admin.listUsers({
      page: pagina,
      perPage: 200,
    });
    if (error) throw new Error(`listarUsuarios: ${error.code ?? error.status}: ${error.message}`);
    todos.push(...data.users);
    if (data.users.length < 200) break;
  }
  return todos;
}

export async function idPorEmail(email: string): Promise<string | null> {
  const alvo = email.toLowerCase();
  const achado = (await listarUsuarios()).find((u) => u.email?.toLowerCase() === alvo);
  return achado?.id ?? null;
}

/**
 * Apaga a conta inteira: objetos do bucket, linha de `profiles` (que leva
 * junto `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais` e
 * `contatos` pelo `on delete cascade`) e o usuário do Auth.
 *
 * ⚠️ `profiles` NÃO tem FK para `auth.users` (0000 §2): apagar só o usuário do
 * Auth deixaria a linha órfã. Por isso a ordem é esta.
 *
 * O que fica, de propósito: as linhas de `audit_logs` com `alvo_id` desta
 * conta. A trilha não se apaga (0002 §11), nem no banco de teste.
 */
export async function apagarConta(id: string): Promise<void> {
  const s = clienteDeServico();

  const { data: objetos } = await s.storage.from("documentos").list(id, { limit: 100 });
  if (objetos && objetos.length > 0) {
    const { error } = await s.storage
      .from("documentos")
      .remove(objetos.map((o) => `${id}/${o.name}`));
    if (error) throw new Error(`apagarConta(storage): ${error.message}`);
  }

  const { error: erroPerfil } = await s.from("profiles").delete().eq("id", id);
  if (erroPerfil) throw new Error(`apagarConta(profiles): ${erroPerfil.code}: ${erroPerfil.message}`);

  const { error: erroAuth } = await s.auth.admin.deleteUser(id);
  if (erroAuth && erroAuth.status !== 404) {
    throw new Error(`apagarConta(auth): ${erroAuth.code ?? erroAuth.status}: ${erroAuth.message}`);
  }
  criadasNestaRodada.delete(id);
}

/** O `afterAll` de todo arquivo que cria conta. Não para no primeiro erro:
 *  tenta apagar todas e só no fim diz o que não conseguiu. */
export async function apagarContasDaRodada(): Promise<void> {
  const falhas: string[] = [];

  for (const email of [...emailsNestaRodada]) {
    try {
      const id = await idPorEmail(email);
      if (id) criadasNestaRodada.add(id);
      emailsNestaRodada.delete(email);
    } catch (e) {
      falhas.push(e instanceof Error ? e.message : String(e));
    }
  }

  for (const id of [...criadasNestaRodada]) {
    try {
      await apagarConta(id);
    } catch (e) {
      falhas.push(e instanceof Error ? e.message : String(e));
    }
  }

  if (falhas.length > 0) {
    throw new Error(
      `apagarContasDaRodada: ${falhas.length} conta(s) nao foram apagadas; a proxima rodada varre as com mais de 60 min. ${falhas.join(" | ")}`
    );
  }
}

/**
 * Apaga conta descartável de rodada que morreu sem limpar (runner cancelado,
 * timeout do job). Só toca endereço com a marca `+e2e-d-`, e só se for mais
 * velha que `minutos`: uma rodada de outro branch rodando agora não perde as
 * contas dela.
 */
export async function varrerDescartaveisAntigas(minutos = 60): Promise<number> {
  const limite = Date.now() - minutos * 60_000;
  const velhas = (await listarUsuarios()).filter(
    (u) =>
      u.email?.toLowerCase().includes(MARCA_DESCARTAVEL) &&
      new Date(u.created_at).getTime() < limite
  );
  for (const u of velhas) await apagarConta(u.id);
  return velhas.length;
}

// ---------------------------------------------------------------------------
// DOCUMENTO
// ---------------------------------------------------------------------------
// A rota de upload decide o tipo pelos 5 primeiros bytes (`%PDF-`). Um PDF de
// uma linha basta: o que se testa é o caminho, não o conteúdo.

export const PDF_DE_TESTE = Buffer.from(
  "%PDF-1.4\n% documento de teste da suite E2E da Vetria, sem dado de ninguem\n%%EOF\n",
  "utf8"
);

/**
 * Sobe um documento para a conta e grava as três colunas, como a rota de
 * upload faz (0003 §2.b: o objeto é escrito com service_role). O carimbo de
 * `documento_enviado_em` é do trigger, não daqui.
 *
 * Só para PREPARAR conta. O teste do item 1 sobe o documento pela TELA.
 */
export async function subirDocumentoDeTeste(id: string): Promise<string> {
  const s = clienteDeServico();
  const caminho = `${id}/qa-e2e-${Date.now().toString(36)}.pdf`;

  const { error: erroUpload } = await s.storage
    .from("documentos")
    .upload(caminho, PDF_DE_TESTE, { contentType: "application/pdf", upsert: false });
  if (erroUpload) throw new Error(`subirDocumentoDeTeste(storage): ${erroUpload.message}`);

  const { error } = await s.from("perfil_privado").upsert(
    {
      id,
      documento_path: caminho,
      documento_hash: createHash("sha256").update(PDF_DE_TESTE).digest("hex"),
      documento_tamanho: PDF_DE_TESTE.length,
    },
    { onConflict: "id" }
  );
  if (error) throw new Error(`subirDocumentoDeTeste(perfil_privado): ${error.code}: ${error.message}`);
  return caminho;
}

async function documentoExisteNoBucket(id: string, caminho: string | null): Promise<boolean> {
  if (!caminho) return false;
  const { data } = await clienteDeServico().storage.from("documentos").list(id, { limit: 100 });
  const nome = caminho.slice(id.length + 1);
  return (data ?? []).some((o) => o.name === nome);
}

// ---------------------------------------------------------------------------
// LEITURAS (a prova de que o banco mudou, e não só a tela)
// ---------------------------------------------------------------------------

export type PerfilLido = {
  role: string;
  status: string;
  onboarding_completed: boolean;
  status_motivo: string | null;
  admin_level: string | null;
};

export async function lerPerfil(id: string): Promise<PerfilLido> {
  const { data, error } = await clienteDeServico()
    .from("profiles")
    .select("role, status, onboarding_completed, status_motivo, admin_level")
    .eq("id", id)
    .single<PerfilLido>();
  if (error || !data) throw new Error(`lerPerfil: ${error?.code}: ${error?.message}`);
  return data;
}

/** Quantas decisões (`definir_status`) a trilha tem para esta conta. */
export async function decisoesNaTrilha(id: string): Promise<number> {
  const { count, error } = await clienteDeServico()
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("alvo_id", id)
    .eq("acao", "definir_status");
  if (error) throw new Error(`decisoesNaTrilha: ${error.code}: ${error.message}`);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// ESTADO DE PARTIDA
// ---------------------------------------------------------------------------

/** O `vet_profiles` que a conta fixa tem no começo de toda rodada. Valores
 *  dentro de cada CHECK da `0004` e das listas de `campos.ts`. */
const VET_FIXO = {
  nome_exibicao: "QA E2E Vet Fixo",
  titulo: "mv",
  crmv: "12345",
  crmv_uf: "SP",
  especialidades: ["Clínica geral"],
  experiencia: "1a3",
  bio: null,
  cidade: "Palmas",
  estado: "TO",
  bairro: null,
  // Ao menos um modo: sem isso o passo 2 do onboarding não avança e os testes
  // de `onboarding-vet.spec.ts` morrem com "Continuar desabilitado".
  atende_presencial: true,
  atende_domiciliar: false,
  atende_teleorientacao: false,
};

let vetFixoPreparado: Promise<void> | null = null;

/**
 * Devolve a conta vet FIXA (`E2E_VET_EMAIL`) ao estado de partida:
 * `pending_validation`, `vet_profiles` completo e documento no bucket.
 *
 * É o que tira do caminho as duas travas manuais de `onboarding-vet.spec.ts`
 * ("devolva a conta para a fila", "envie um documento à mão") e o
 * `exigirContaNaFila()` de `portao-status.spec.ts`. Idempotente, e roda uma
 * vez por processo de worker.
 *
 * ⚠️ É o único `update` de `profiles.status` com `service_role` da suíte, e é
 * PREPARAÇÃO. Nunca aprova: `active` só se alcança pela tela do admin, com
 * conta descartável.
 */
export function garantirVetFixoNaFila(credencial: Credencial): Promise<void> {
  if (!vetFixoPreparado) {
    vetFixoPreparado = preparar(credencial).catch((e) => {
      vetFixoPreparado = null;
      throw e;
    });
  }
  return vetFixoPreparado;
}

async function preparar(credencial: Credencial): Promise<void> {
  const s = clienteDeServico();
  const id = await idPorEmail(credencial.email);
  if (!id) {
    throw new Error(
      "garantirVetFixoNaFila: a conta de E2E_VET_EMAIL nao existe no projeto de teste. Crie em Authentication > Add user (ver o relatorio da T-029)."
    );
  }

  const perfil = await lerPerfil(id);
  if (perfil.role !== "vet") {
    // Não troca role: role errado é conta errada no secret, não estado a
    // consertar. Trocar em silêncio esconderia o engano.
    throw new Error(`garantirVetFixoNaFila: a conta de E2E_VET_EMAIL tem role '${perfil.role}', e precisa ser 'vet'.`);
  }

  const { error: erroVet } = await s
    .from("vet_profiles")
    .upsert({ id, ...VET_FIXO }, { onConflict: "id" });
  if (erroVet) throw new Error(`garantirVetFixoNaFila(vet_profiles): ${erroVet.code}: ${erroVet.message}`);

  const { data: privado } = await s
    .from("perfil_privado")
    .select("documento_path")
    .eq("id", id)
    .maybeSingle<{ documento_path: string | null }>();

  if (!(await documentoExisteNoBucket(id, privado?.documento_path ?? null))) {
    await subirDocumentoDeTeste(id);
  }

  const { error: erroStatus } = await s
    .from("profiles")
    .update({ status: "pending_validation", onboarding_completed: true, status_motivo: null })
    .eq("id", id);
  if (erroStatus) throw new Error(`garantirVetFixoNaFila(profiles): ${erroStatus.code}: ${erroStatus.message}`);

  const depois = await lerPerfil(id);
  if (depois.status !== "pending_validation") {
    throw new Error(`garantirVetFixoNaFila: status lido depois do update e '${depois.status}'.`);
  }
}

/**
 * Uma conta vet NOVA, já na fila, pelo caminho do produto: os dados gravados
 * com a sessão DELA (sob RLS), o documento como a rota grava, e a entrada na
 * fila pela RPC `concluir_onboarding_profissional()`, chamada por ELA. Nenhum
 * `update` de status com `service_role`.
 *
 * É a matéria-prima do item 3: cada decisão de admin gasta uma conta, porque
 * `pending_validation → active` só acontece uma vez.
 */
export async function semearVetNaFila(
  nome: string,
  // F4 (busca): a conta que vai aparecer na busca precisa de especialidade,
  // cidade e CRMV próprios, senão todo teste acha todo mundo. Opcional: sem
  // isto, é a conta de sempre.
  dados: Partial<typeof VET_FIXO> = {},
  // O contato PRIVADO (perfil_privado), escrito pelo dono sob RLS, como a
  // tela faria. Existe para o teste provar que ele NÃO sai no HTML público
  // (DL-047). Escrito antes da fila: whatsapp não é dado vigiado pela
  // revalidação (0002 §5), mas assim nem a dúvida existe.
  privado: { whatsapp?: string; telefone?: string } = {}
): Promise<ContaDescartavel> {
  const conta = await criarContaDescartavel("vet", nome);
  const { cliente } = await clienteDoUsuario(conta);

  const { error: erroVet } = await cliente
    .from("vet_profiles")
    .upsert({ id: conta.id, ...VET_FIXO, ...dados, nome_exibicao: nome }, { onConflict: "id" })
    .select("id")
    .single();
  if (erroVet) throw new Error(`semearVetNaFila(vet_profiles): ${erroVet.code}: ${erroVet.message}`);

  await subirDocumentoDeTeste(conta.id);

  if (privado.whatsapp || privado.telefone) {
    const { error: erroPrivado } = await cliente
      .from("perfil_privado")
      .update({ whatsapp: privado.whatsapp ?? null, telefone: privado.telefone ?? null })
      .eq("id", conta.id)
      .select("id")
      .single();
    if (erroPrivado) {
      throw new Error(`semearVetNaFila(perfil_privado): ${erroPrivado.code}: ${erroPrivado.message}`);
    }
  }

  const { error: erroRpc } = await cliente.rpc("concluir_onboarding_profissional");
  if (erroRpc) throw new Error(`semearVetNaFila(rpc): ${erroRpc.code}: ${erroRpc.message}`);

  const perfil = await lerPerfil(conta.id);
  if (perfil.status !== "pending_validation") {
    throw new Error(`semearVetNaFila: a conta nova ficou em '${perfil.status}', e nao na fila.`);
  }
  await cliente.auth.signOut().catch(() => {});
  return conta;
}

// ---------------------------------------------------------------------------
// F4 — BUSCA E PERFIL PÚBLICO (só fazem sentido depois da 0005)
// ---------------------------------------------------------------------------

/**
 * Aprova pela RPC `admin_definir_status`, com a sessão do ADMIN DE TESTE
 * (cliente anon + login, sob RLS), que é exatamente o que a Server Action da
 * tela faz por baixo. Nenhum `service_role` aqui: a aprovação é do produto.
 * Depois da 0005, é esta transição que faz o slug nascer (trigger
 * `trg_profiles_slug_ao_ativar`).
 */
export async function aprovarPelaRpc(admin: SupabaseClient, id: string): Promise<void> {
  const { error } = await admin.rpc("admin_definir_status", {
    target_user_id: id,
    novo_status: "active",
    motivo: null,
  });
  if (error) throw new Error(`aprovarPelaRpc: ${error.code}: ${error.message}`);
  const depois = await lerPerfil(id);
  if (depois.status !== "active") {
    throw new Error(`aprovarPelaRpc: a RPC nao reclamou, e o status lido e '${depois.status}'.`);
  }
}

/** O slug gravado no banco (leitura com service_role: prova, não atalho). */
export async function lerSlugDoVet(id: string): Promise<string | null> {
  const { data, error } = await clienteDeServico()
    .from("vet_profiles")
    .select("slug")
    .eq("id", id)
    .single<{ slug: string | null }>();
  if (error) throw new Error(`lerSlugDoVet: ${error.code}: ${error.message}`);
  return data.slug;
}

/**
 * Suspende a conta com `service_role`, NO LUGAR DO MASTER.
 *
 * ⚠️ É a segunda escrita de `profiles.status` com `service_role` da suíte, e a
 * exceção está escrita aqui de propósito. Suspender exige `master` (0004,
 * SEC-005), e a conta admin de teste é COMUM, por regra (R-033: nunca a do
 * Elber, nunca master). O que o teste que usa isto prova NÃO é a suspensão
 * (essa é da tela do master, e não é deste arquivo): é que uma conta que SAI
 * de `active` some da busca e do perfil na requisição seguinte, sem cache.
 * Para isso interessa o estado do banco, não quem o escreveu.
 */
export async function suspenderNoLugarDoMaster(id: string): Promise<void> {
  const { error } = await clienteDeServico()
    .from("profiles")
    .update({ status: "suspended", status_motivo: "Suspensa pela suite E2E (teste de cache da busca)." })
    .eq("id", id);
  if (error) throw new Error(`suspenderNoLugarDoMaster: ${error.code}: ${error.message}`);
  const depois = await lerPerfil(id);
  if (depois.status !== "suspended") {
    throw new Error(`suspenderNoLugarDoMaster: status lido depois do update e '${depois.status}'.`);
  }
}
