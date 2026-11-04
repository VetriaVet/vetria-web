import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/admin/profiles · a lista de contas do painel do master.
//
// Revisão de 04/11/2026: saiu o objeto `debug` (devolvia id, email,
// `admin_level` e `role` de quem chamou, inclusive na recusa) e saíram as
// mensagens cruas do Supabase (`authErr.message`, `error.message`). Erro é
// genérico, em português, na chave `error` (a que `AdminPanel.tsx` lê); no
// log, só `code`.

const FALHA = "Não foi possível carregar a lista agora. Tente de novo em alguns instantes.";

function erro(status: number, mensagem: string) {
  return NextResponse.json({ error: mensagem }, { status });
}

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;
    if (!userId) {
      return erro(401, "Sua sessão expirou. Entre de novo.");
    }

    const { data: me, error: meErr } = await supabase
      .from("profiles")
      .select("admin_level, role")
      .eq("id", userId)
      .maybeSingle<{ admin_level: string | null; role: string | null }>();

    if (meErr) {
      console.error("[api/admin/profiles] leitura do chamador falhou", { code: meErr.code });
      return erro(502, FALHA);
    }

    if (me?.role !== "admin" || me?.admin_level !== "master") {
      return erro(403, "Você não tem permissão para ver esta lista.");
    }

    // Lista com service_role: não há policy que deixe o master ler tudo com
    // as colunas abaixo sem passar pela RLS de cada tabela.
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, role, admin_level, admin_team, onboarding_completed, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/admin/profiles] listagem falhou", { code: error.code });
      return erro(502, FALHA);
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (e: unknown) {
    // T-015 / R-037: nada do erro vai para a resposta.
    console.error("[api/admin/profiles] erro nao tratado", {
      name: e instanceof Error ? e.name : "desconhecido",
    });
    return erro(500, FALHA);
  }
}
