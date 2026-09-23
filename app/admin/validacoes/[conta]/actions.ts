"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  TEMPO_LIMITE_MS,
  enviarEmailDeValidacao,
  type ResultadoDoEmail,
} from "@/lib/email/validacao";
import { ROLES_DA_FILA, ehUuid, texto } from "../fila";
import {
  MOTIVO_MAXIMO,
  MOTIVO_MINIMO,
  type Decisao,
  type ResultadoDecisao,
} from "./decisao";

// T-024 — APROVAR E REPROVAR. É o item 3 do DoD da F3.
//
// Padrão da casa (DL-012): o Server Component lê, esta Action muta, o Client
// Form interage.
//
// O que ela faz, na ordem, e por quê:
//   1. `requireAdmin()` no SERVIDOR. O `middleware.ts` já barra quem não é
//      admin por prefixo de rota, mas o id de uma Server Action está no bundle
//      e um POST direto não passa pelo prefixo. A autorização mora aqui.
//   2. valida a entrada (o cliente não é fonte de verdade)
//   3. relê a conta COM A SESSÃO DO ADMIN, sob RLS, e exige
//      `status = 'pending_validation'` (matriz §5, linha de 23/09, DL-061)
//   4. muda o status PELA RPC `admin_definir_status` e por mais nada
//   5. relê o status para confirmar que a mudança aconteceu (DL-011)
//   6. manda o email. Falha de email NÃO desfaz a decisão
//   7. redireciona para a fila dizendo o que aconteceu, inclusive com o email
//
// ⚠️ `profiles.status` NUNCA É ESCRITO DAQUI. Nem por `update`, nem por
// `service_role`. A escrita é da RPC `admin_definir_status` (0002 §8.1), que
// é SECURITY DEFINER, confere `is_admin()` dentro do banco, recusa alvo que
// não seja `vet`/`clinic`, exige master para mexer em `suspended` e grava
// `audit_logs` na MESMA transação, com `actor_id = auth.uid()`. É por isso
// que a chamada usa a sessão do admin: com `service_role`, `auth.uid()` é
// nulo, `is_admin()` falha e a trilha perderia o autor.
//
// ⚠️ A TRILHA NÃO É DUPLICADA AQUI. A RPC já escreve
// `acao = 'definir_status'`, `alvo_id`, `detalhe = {de, para, motivo}` e
// `created_at`. Um segundo `insert` daqui seria a mesma ação contada duas
// vezes, e trilha com linha duplicada é trilha em que ninguém confia.
//
// ⚠️ `service_role` APARECE EM UM LUGAR SÓ: ler o email de login da conta em
// `auth.users`, que nenhuma policy expõe (e não deve expor). É leitura de uma
// coluna, de uma conta, depois de a decisão estar gravada.
//
// ⚠️ DL-016 — nenhum `redirect()` deste arquivo está dentro de `try/catch`.
// O `try/catch` do email vive dentro de `enviarEmailDeValidacao`, que não
// redireciona.

type DetalheDoBanco = { message: string; code?: string };

// SEC-056, clonado: sem `details`, que carrega a linha inteira do Postgres.
function registrarErro(contexto: string, detalhe: DetalheDoBanco) {
  console.error(`[admin/validacoes/decidir] ${contexto}`, {
    message: detalhe.message,
    code: detalhe.code,
  });
}

function erro(mensagem: string): ResultadoDecisao {
  return { ok: false, mensagem };
}

const NAO_ESTA_NA_FILA =
  "Esta conta não está mais na fila de validação, então nada foi alterado. Outra pessoa pode ter decidido antes. Volte para a fila para ver a situação atual.";

export async function decidirValidacao(entrada: {
  conta: unknown;
  decisao: unknown;
  motivo: unknown;
}): Promise<ResultadoDecisao | void> {
  // -------------------------------------------------------------------------
  // 1. AUTORIZAÇÃO (redireciona quem não é admin; fora de try/catch)
  // -------------------------------------------------------------------------
  const sessao = await requireAdmin();

  // -------------------------------------------------------------------------
  // 2. ENTRADA
  // -------------------------------------------------------------------------
  const conta = typeof entrada?.conta === "string" ? entrada.conta : "";
  if (!ehUuid(conta)) return erro("Conta inválida.");

  const decisao: Decisao | null =
    entrada?.decisao === "aprovar"
      ? "aprovar"
      : entrada?.decisao === "reprovar"
        ? "reprovar"
        : null;
  if (!decisao) return erro("Decisão inválida.");

  // Quebras de linha do admin ficam; espaço nas pontas sai.
  const motivoBruto =
    typeof entrada?.motivo === "string" ? entrada.motivo.trim() : "";

  let motivo: string | null = null;
  if (decisao === "reprovar") {
    // R-051: reprova sem motivo é o laço mudo. A pessoa recebe o formulário
    // de volta, não sabe o que corrigir, reenvia igual, e a fila recicla.
    if (motivoBruto.length < MOTIVO_MINIMO) {
      return erro(
        `Escreva o motivo da reprova, com pelo menos ${MOTIVO_MINIMO} caracteres. É ele que a pessoa vai ler para saber o que corrigir.`
      );
    }
    if (motivoBruto.length > MOTIVO_MAXIMO) {
      return erro(
        `O motivo passa de ${MOTIVO_MAXIMO} caracteres. Resuma o que precisa ser corrigido.`
      );
    }
    motivo = motivoBruto;
  }

  // -------------------------------------------------------------------------
  // 3. A CONTA ESTÁ NA FILA? (sessão do admin, sob RLS)
  // -------------------------------------------------------------------------
  const supabase = await createClient();

  const { data: alvo, error: erroAlvo } = await supabase
    .from("profiles")
    .select("id, role, status, full_name")
    .eq("id", conta)
    .in("role", ROLES_DA_FILA)
    .maybeSingle<{
      id: string;
      role: string;
      status: string;
      full_name: string | null;
    }>();

  if (erroAlvo) {
    registrarErro("leitura da conta", erroAlvo);
    return erro(
      "Não foi possível ler esta conta agora, então nada foi alterado. Tente de novo em alguns instantes."
    );
  }

  // Conta inexistente, invisível para este admin ou fora de `vet`/`clinic`.
  if (!alvo) return erro(NAO_ESTA_NA_FILA);

  // ⚠️ DL-061 / matriz §5: decisão só sobre quem está na fila. A RPC aceita
  // qualquer status de origem (menos `suspended` para admin comum), então
  // esta conferência é da aplicação. Ver o Resultado da T-024: fechar isso
  // dentro do banco pede migration e ficou registrado, não feito.
  if (alvo.status !== "pending_validation") return erro(NAO_ESTA_NA_FILA);

  // -------------------------------------------------------------------------
  // 4. A MUDANÇA, PELA RPC E SÓ POR ELA
  // -------------------------------------------------------------------------
  const novoStatus = decisao === "aprovar" ? "active" : "incomplete";

  const { error: erroRpc } = await supabase.rpc("admin_definir_status", {
    target_user_id: conta,
    novo_status: novoStatus,
    // Aprovar grava `null` em `status_motivo`, e isso é o certo: o motivo de
    // uma reprova anterior não pode continuar aparecendo para quem foi aprovado.
    motivo,
  });

  if (erroRpc) {
    registrarErro("rpc admin_definir_status", erroRpc);
    return erro(
      "O banco recusou a decisão, então nada foi alterado. Tente de novo em alguns instantes." +
        (erroRpc.code ? ` (código ${erroRpc.code})` : "")
    );
  }

  // -------------------------------------------------------------------------
  // 5. CONFIRMAÇÃO (DL-011: não confie na ausência de erro)
  // -------------------------------------------------------------------------
  const { data: depois } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", conta)
    .maybeSingle<{ status: string }>();

  if (depois?.status !== novoStatus) {
    console.error("[admin/validacoes/decidir] status não confirmado", {
      contaId: conta,
      esperado: novoStatus,
      lido: depois?.status ?? null,
    });
    return erro(
      "A decisão foi enviada, mas o status lido de volta não confere. Volte para a fila e confira antes de decidir de novo."
    );
  }

  console.log("[admin/validacoes/decidir] decisão gravada", {
    contaId: conta,
    adminId: sessao.userId,
    para: novoStatus,
  });

  // -------------------------------------------------------------------------
  // 6. O EMAIL. A decisão já está gravada; daqui para baixo, nada a desfaz.
  // -------------------------------------------------------------------------
  const email = await avisarPorEmail({
    conta,
    role: alvo.role,
    fullName: alvo.full_name,
    decisao,
    motivo,
    supabase,
  });

  revalidatePath("/admin/validacoes");
  revalidatePath(`/admin/validacoes/${conta}`);

  // -------------------------------------------------------------------------
  // 7. DE VOLTA PARA A FILA. A URL leva só valores de lista fechada: nada de
  //    nome, email ou motivo na barra de endereço.
  // -------------------------------------------------------------------------
  const feito = decisao === "aprovar" ? "aprovado" : "reprovado";
  redirect(`/admin/validacoes?decisao=${feito}&email=${email}`);
}

// ---------------------------------------------------------------------------

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Descobre o endereço e o nome e manda o email. NUNCA lança: qualquer falha
 * vira `"falhou"` (ou `"desligado"`, sem chave do Resend) e vai para o log
 * sem o endereço.
 */
async function avisarPorEmail(p: {
  conta: string;
  role: string;
  fullName: string | null;
  decisao: Decisao;
  motivo: string | null;
  supabase: Supabase;
}): Promise<ResultadoDoEmail> {
  try {
    const nome = await lerNomeDeExibicao(p.supabase, p.conta, p.role, p.fullName);

    // O email de LOGIN, em `auth.users`. Não é `perfil_privado.email_contato`:
    // aquele é o contato que o profissional quer mostrar (e hoje nem tem campo
    // em tela), este é o endereço que a pessoa confirmou ao se cadastrar e que
    // já recebe os emails de autenticação.
    //
    // ⚠️ SEC-100 — com teto de tempo, o MESMO do envio ao Resend. A decisão
    // já está gravada e o admin está parado na tela esperando o `redirect`:
    // um Auth lento não pode segurá-lo sem prazo. Estourou, vira "falhou".
    const ESGOTOU = Symbol("esgotou");
    let relogio: ReturnType<typeof setTimeout> | undefined;
    const resposta = await Promise.race([
      createAdminClient().auth.admin.getUserById(p.conta),
      new Promise<typeof ESGOTOU>((resolver) => {
        relogio = setTimeout(() => resolver(ESGOTOU), TEMPO_LIMITE_MS);
      }),
    ]).finally(() => clearTimeout(relogio));

    if (resposta === ESGOTOU) {
      console.error("[admin/validacoes/decidir] tempo esgotado lendo o email de destino", {
        contaId: p.conta,
      });
      return "falhou";
    }

    const { data, error } = resposta;
    const para = data?.user?.email ?? null;

    if (error || !para) {
      console.error("[admin/validacoes/decidir] email de destino indisponível", {
        contaId: p.conta,
        code: error?.code ?? error?.status ?? null,
      });
      return "falhou";
    }

    return await enviarEmailDeValidacao({
      contaId: p.conta,
      para,
      nome,
      decisao: p.decisao === "aprovar" ? "aprovado" : "reprovado",
      motivo: p.motivo,
    });
  } catch (e) {
    console.error("[admin/validacoes/decidir] falha inesperada no email", {
      contaId: p.conta,
      erro: e instanceof Error ? e.name : "desconhecido",
    });
    return "falhou";
  }
}

async function lerNomeDeExibicao(
  supabase: Supabase,
  conta: string,
  role: string,
  fullName: string | null
): Promise<string | null> {
  if (role === "vet") {
    const { data } = await supabase
      .from("vet_profiles")
      .select("nome_exibicao")
      .eq("id", conta)
      .maybeSingle<{ nome_exibicao: string | null }>();
    return texto(data?.nome_exibicao) ?? texto(fullName);
  }

  const { data } = await supabase
    .from("clinic_profiles")
    .select("nome_fantasia")
    .eq("id", conta)
    .maybeSingle<{ nome_fantasia: string | null }>();
  return texto(data?.nome_fantasia) ?? texto(fullName);
}
