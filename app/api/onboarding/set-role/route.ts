import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { corpoEhJson, pedidoDoProprioSite } from "@/lib/http/origem";
import { vincularContatosDoVisitante } from "@/lib/contato/vincular";

// POST /api/onboarding/set-role · a conta sem tipo escolhe o próprio tipo,
// uma vez só.
//
// Revisão de 04/11/2026 (continua valendo):
//   · pedido do próprio site e corpo JSON (CSRF em profundidade);
//   · nada de `error.message` nem `e.message` na resposta (só `code` no log).
//
// T-064 / DL-080 item 2 (05/11/2026): A ESCRITA PASSOU PARA O BANCO.
// Antes, esta rota fazia `update profiles set role` com `.is("role", null)`,
// e isso nunca gravava: `role` é NOT NULL com default `tutor` e o trigger
// sempre preenche. Agora quem grava é `escolher_tipo_de_conta` (0009),
// SECURITY DEFINER, sobre a própria conta (`auth.uid()`), que confere tudo
// numa transação com a linha travada: lista fechada (nunca `admin`), tipo
// ainda não escolhido, conta no estado de nascimento sem tipo. Esta rota não
// decide nada além de traduzir o código de erro para a frase.
//
// Os códigos (contrato com a 0009):
//   42501  sem sessão no banco          → 401
//   22023  tipo fora da lista            → 400
//   55000  já escolhido, ou conta que não pode mais escolher → 409
//   P0002  conta sem linha em profiles   → 409
//   PGRST202 / 42883  a função não existe (a 0009 não está neste banco) → 503

const ALLOWED = new Set(["tutor", "vet", "clinic"]);

const FALHA = "Não foi possível salvar agora. Tente de novo em alguns instantes.";
const JA_ESCOLHIDO = "O tipo desta conta já foi escolhido.";

function erro(status: number, mensagem: string) {
  return NextResponse.json({ error: mensagem }, { status });
}

export async function POST(req: Request) {
  try {
    if (!pedidoDoProprioSite(req, "navegador")) {
      return erro(403, "Pedido recusado.");
    }
    if (!corpoEhJson(req)) {
      return erro(415, "Pedido inválido.");
    }

    const supabase = await createClient();

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      return erro(401, "Sua sessão expirou. Entre de novo.");
    }

    const body = (await req.json().catch(() => ({}))) as { role?: unknown };
    const role = body?.role;

    // A lista também mora no banco; aqui ela só poupa uma ida até lá.
    if (typeof role !== "string" || !ALLOWED.has(role)) {
      return erro(400, "Tipo de conta inválido.");
    }

    const { error } = await supabase.rpc("escolher_tipo_de_conta", { p_role: role });

    if (error) {
      console.error("[api/onboarding/set-role] escolha recusada", { code: error.code });
      if (error.code === "55000" || error.code === "P0002") return erro(409, JA_ESCOLHIDO);
      if (error.code === "22023") return erro(400, "Tipo de conta inválido.");
      if (error.code === "42501") return erro(401, "Sua sessão expirou. Entre de novo.");
      if (error.code === "PGRST202" || error.code === "42883") {
        return erro(503, "A escolha do tipo de conta ainda não está disponível. Tente de novo mais tarde.");
      }
      return erro(400, FALHA);
    }

    // T-063 / T-042 (D10): quem escolheu ser responsável leva os contatos que
    // fez como visitante neste navegador. A função nunca lança; o banco só
    // vincula conta `tutor` criada nas últimas 24 horas.
    if (role === "tutor") {
      await vincularContatosDoVisitante(user.id);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[api/onboarding/set-role] erro nao tratado", {
      name: e instanceof Error ? e.name : "desconhecido",
    });
    return erro(500, FALHA);
  }
}
