import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { corpoEhJson, pedidoDoProprioSite } from "@/lib/http/origem";

// POST /api/admin/set-access · o master troca o tipo de conta e o nível de
// admin de OUTRA conta. Revisão de segurança de 04/11/2026.
//
// A escrita sai por `service_role` (a policy `profiles_update_own` pina
// `role`, `admin_level` e `admin_team`, e não existe policy que deixe o master
// escrever o profile de terceiro). Como `service_role` ignora RLS inteira,
// TODA a autorização está aqui, e é por isso que cada regra abaixo é lista
// fechada e cada recusa sai ANTES da escrita:
//
//   1. Pedido do próprio site e corpo JSON (CSRF em profundidade).
//   2. Sessão por `getUser()` (nunca `getSession()`: o cookie sozinho não
//      prova nada) e chamador com `role = 'admin'` E `admin_level = 'master'`.
//      Só então o corpo é lido (T-015 / R-037: quem não é master não chega
//      perto do parser).
//   3. `target_user_id` uuid, e diferente do próprio chamador: o master não
//      troca a própria conta por aqui (nem se rebaixa sem querer).
//   4. Destino em lista fechada: ou um tipo de conta (`tutor`, `vet`,
//      `clinic`, com `admin_level = 'none'`), ou um nível de admin (`admin`,
//      `master`, que leva `role = 'admin'`). `admin_team` também é lista
//      fechada, o enum do banco.
//   5. Rebaixar um master só se sobrar pelo menos um.
//   6. Virar `vet` ou `clinic` é começar do zero: `status = 'incomplete'`.
//      Sem isto, um responsável `active` virado vet herdava `active` e
//      aparecia na busca sem documento e sem validação (matriz §3, regra 1).
//   7. A trilha em `audit_logs`, ANTES da escrita, com `actor_id` explícito
//      (com `service_role` o `auth.uid()` é nulo; mesmo padrão de
//      `/api/documentos/abrir`). Sem trilha, sem troca.
//
// ⚠️ A RPC `admin_set_user_access` existe no banco, mas o corpo dela NÃO está
// versionado (0000 §3.7 só a descreve). Esta rota não depende dela.
//
// ⚠️ Corrida conhecida: dois masters rebaixando um ao outro ao mesmo tempo
// passam os dois na contagem do passo 5. Fechar isso exige a contagem e a
// escrita na mesma transação, ou seja, função no banco (🔴, migration).
//
// Respostas de erro genéricas, em português, na chave `error` (é a que
// `app/admin/AdminPanel.tsx` lê). No log, só `code`.

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const ROLES_DE_CONTA = ["tutor", "vet", "clinic"] as const;
const NIVEIS_DE_ADMIN = ["none", "admin", "master"] as const;
const EQUIPES = ["none", "support", "sales", "ops", "finance", "compliance"] as const;

type RoleDeConta = (typeof ROLES_DE_CONTA)[number];
type NivelDeAdmin = (typeof NIVEIS_DE_ADMIN)[number];
type Equipe = (typeof EQUIPES)[number];

type PerfilDeAcesso = {
  role: string | null;
  admin_level: string | null;
  admin_team: string | null;
  status: string | null;
};

type Destino = {
  role: RoleDeConta | "admin";
  admin_level: NivelDeAdmin;
  admin_team: Equipe;
};

function naLista<T extends string>(lista: readonly T[], v: unknown): v is T {
  return typeof v === "string" && (lista as readonly string[]).includes(v);
}

function erro(status: number, mensagem: string) {
  return NextResponse.json({ error: mensagem }, { status });
}

const PEDIDO_INVALIDO = "Pedido inválido.";
const FALHA = "Não foi possível alterar o acesso agora. Tente de novo em alguns instantes.";

/**
 * Lê o destino do corpo. Duas formas, e só duas:
 *   { new_role: 'tutor' | 'vet' | 'clinic' }                  → conta comum
 *   { new_admin_level: 'admin' | 'master', new_admin_team? }  → admin
 * `new_role: 'admin'` é aceito SÓ junto de um nível de admin, porque é o que
 * o painel manda hoje; sozinho, ou com nível `none`, é pedido inválido.
 */
function lerDestino(corpo: Record<string, unknown>): Destino | null {
  const { new_role, new_admin_level, new_admin_team } = corpo;

  if (new_admin_level !== undefined && !naLista(NIVEIS_DE_ADMIN, new_admin_level)) return null;
  if (new_admin_team !== undefined && new_admin_team !== null && !naLista(EQUIPES, new_admin_team)) {
    return null;
  }

  const virandoAdmin = new_admin_level === "admin" || new_admin_level === "master";

  if (virandoAdmin) {
    if (new_role !== undefined && new_role !== "admin") return null;
    return {
      role: "admin",
      admin_level: new_admin_level,
      admin_team: naLista(EQUIPES, new_admin_team) ? new_admin_team : "none",
    };
  }

  if (!naLista(ROLES_DE_CONTA, new_role)) return null;
  // Conta comum não tem equipe de admin.
  if (naLista(EQUIPES, new_admin_team) && new_admin_team !== "none") return null;
  return { role: new_role, admin_level: "none", admin_team: "none" };
}

export async function POST(req: Request) {
  try {
    // 1) só do próprio site, e só JSON
    if (!pedidoDoProprioSite(req, "navegador")) {
      return erro(403, "Pedido recusado.");
    }
    if (!corpoEhJson(req)) {
      return erro(415, PEDIDO_INVALIDO);
    }

    // 2) sessão e autorização, antes do corpo
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const atorId = authData?.user?.id ?? null;
    if (!atorId) {
      return erro(401, "Sua sessão expirou. Entre de novo.");
    }

    const { data: eu, error: erroEu } = await supabase
      .from("profiles")
      .select("role, admin_level")
      .eq("id", atorId)
      .maybeSingle<{ role: string | null; admin_level: string | null }>();

    if (erroEu) {
      console.error("[api/admin/set-access] leitura do chamador falhou", { code: erroEu.code });
      return erro(502, FALHA);
    }
    if (eu?.role !== "admin" || eu?.admin_level !== "master") {
      return erro(403, "Você não tem permissão para alterar acessos.");
    }

    // 3) o corpo
    let corpo: unknown;
    try {
      corpo = await req.json();
    } catch {
      return erro(400, PEDIDO_INVALIDO);
    }
    if (typeof corpo !== "object" || corpo === null || Array.isArray(corpo)) {
      return erro(400, PEDIDO_INVALIDO);
    }
    const campos = corpo as Record<string, unknown>;

    const alvoId =
      typeof campos.target_user_id === "string" && UUID.test(campos.target_user_id)
        ? campos.target_user_id
        : null;
    if (!alvoId) {
      return erro(400, PEDIDO_INVALIDO);
    }
    if (alvoId === atorId) {
      return erro(409, "Você não pode alterar o acesso da sua própria conta.");
    }

    // 4) lista fechada
    const destino = lerDestino(campos);
    if (!destino) {
      return erro(400, PEDIDO_INVALIDO);
    }

    const admin = createAdminClient();

    const { data: alvo, error: erroAlvo } = await admin
      .from("profiles")
      .select("role, admin_level, admin_team, status")
      .eq("id", alvoId)
      .maybeSingle<PerfilDeAcesso>();

    if (erroAlvo) {
      console.error("[api/admin/set-access] leitura do alvo falhou", { code: erroAlvo.code });
      return erro(502, FALHA);
    }
    if (!alvo) {
      return erro(404, "Conta não encontrada.");
    }

    const nivelAtual = alvo.admin_level ?? "none";
    const equipeAtual = alvo.admin_team ?? "none";
    if (
      alvo.role === destino.role &&
      nivelAtual === destino.admin_level &&
      equipeAtual === destino.admin_team
    ) {
      // Nada muda: nada é escrito, nem a trilha, nem o status.
      return NextResponse.json({ ok: true, alterado: false });
    }

    // 5) nunca zero master
    const alvoEhMaster = alvo.role === "admin" && nivelAtual === "master";
    if (alvoEhMaster && destino.admin_level !== "master") {
      const { count, error: erroConta } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("admin_level", "master");

      if (erroConta || count === null) {
        console.error("[api/admin/set-access] contagem de masters falhou", {
          code: erroConta?.code ?? "sem-contagem",
        });
        return erro(502, FALHA);
      }
      if (count <= 1) {
        return erro(409, "Esta é a última conta master. Promova outra antes de rebaixar esta.");
      }
    }

    // 6) o status que acompanha a troca
    const viraProfissional =
      (destino.role === "vet" || destino.role === "clinic") && alvo.role !== destino.role;
    const atualizacao: Record<string, string> = {
      role: destino.role,
      admin_level: destino.admin_level,
      admin_team: destino.admin_team,
    };
    if (viraProfissional) {
      atualizacao.status = "incomplete";
    }

    // 7) a trilha, antes da escrita
    const { error: erroTrilha } = await admin.from("audit_logs").insert({
      actor_id: atorId,
      acao: "acesso_alterado",
      alvo_tipo: "profiles",
      alvo_id: alvoId,
      detalhe: {
        de: {
          role: alvo.role,
          admin_level: nivelAtual,
          admin_team: equipeAtual,
          status: alvo.status,
        },
        para: {
          role: destino.role,
          admin_level: destino.admin_level,
          admin_team: destino.admin_team,
          status: viraProfissional ? "incomplete" : alvo.status,
        },
      },
    });

    if (erroTrilha) {
      console.error("[api/admin/set-access] trilha nao gravada, acesso nao alterado", {
        code: erroTrilha.code,
      });
      return erro(502, FALHA);
    }

    const { data: gravado, error: erroEscrita } = await admin
      .from("profiles")
      .update(atualizacao)
      .eq("id", alvoId)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (erroEscrita || !gravado) {
      console.error("[api/admin/set-access] escrita falhou depois da trilha", {
        code: erroEscrita?.code ?? "sem-linha",
      });
      return erro(502, FALHA);
    }

    return NextResponse.json({ ok: true, alterado: true });
  } catch (e: unknown) {
    // T-015 / R-037: nada do erro vai para a resposta.
    console.error("[api/admin/set-access] erro nao tratado", {
      name: e instanceof Error ? e.name : "desconhecido",
    });
    return erro(500, FALHA);
  }
}
