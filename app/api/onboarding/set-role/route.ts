import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { corpoEhJson, pedidoDoProprioSite } from "@/lib/http/origem";

// POST /api/onboarding/set-role · a conta sem tipo escolhe o próprio tipo,
// uma vez só. Revisão de 04/11/2026:
//   · pedido do próprio site e corpo JSON (CSRF em profundidade);
//   · nada de `error.message` nem `e.message` na resposta (só `code` no log);
//   · a escrita leva `.is("role", null)`: a checagem "ainda não tem tipo" e a
//     gravação viram UMA condição no banco, e dois cliques simultâneos não
//     gravam dois tipos. Zero linha alterada é 409, nunca sucesso.

const ALLOWED = new Set(["tutor", "vet", "clinic"]);

const FALHA = "Não foi possível salvar agora. Tente de novo em alguns instantes.";

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

    if (typeof role !== "string" || !ALLOWED.has(role)) {
      return erro(400, "Tipo de conta inválido.");
    }

    // Só permite setar role se ainda estiver vazio (anti-troca via client).
    // A leitura dá a resposta certa ao caso comum; a cláusula `.is` na
    // escrita é quem fecha a corrida.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string | null }>();

    if (profile?.role) {
      return erro(409, "O tipo desta conta já foi escolhido.");
    }

    const { data: gravado, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", user.id)
      .is("role", null)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      console.error("[api/onboarding/set-role] escrita falhou", { code: error.code });
      return erro(400, FALHA);
    }
    if (!gravado) {
      return erro(409, "O tipo desta conta já foi escolhido.");
    }

    if (role === "tutor") {
      // TODO(T-042 / PR #33): ligar aqui o vínculo dos contatos feitos como
      // visitante (`lib/contato/vincular.ts`), que ainda não está na main.
      // Quando a PR #33 entrar: `await vincularContatosDoVisitante(user.id)`,
      // num try/catch próprio, sem deixar a falha dele derrubar a escolha de tipo, que já foi
      // gravada (logar só `code`).
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error("[api/onboarding/set-role] erro nao tratado", {
      name: e instanceof Error ? e.name : "desconhecido",
    });
    return erro(500, FALHA);
  }
}
