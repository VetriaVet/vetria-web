import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function supabaseAdmin() {
  return createClient(URL, SERVICE, { auth: { persistSession: false } });
}

// T-015 / R-037 — o corpo que esta rota aceita. Espelha o `SetAccessPayload`
// de `app/admin/AdminPanel.tsx`, que é quem chama.
type CorpoSetAccess = {
  target_user_id?: unknown;
  new_role?: unknown;
  new_admin_level?: unknown;
  new_admin_team?: unknown;
};

export async function POST(req: Request) {
  try {
    // ⚠️ T-015 / R-037 — A ORDEM DESTE BLOCO É A CORREÇÃO. NÃO REORDENE.
    //
    // Antes, a primeira linha dentro do `try` era `await req.json()`, e o
    // `catch` do fim devolvia o `stack` do servidor. Como a sessão só era
    // conferida 18 linhas abaixo, um POST com JSON malformado e SEM COOKIE
    // NENHUM caía no `catch` e recebia o stack trace de volta: caminho absoluto
    // dos arquivos no runtime, estrutura de módulos e versão de framework, na
    // rota que troca role de qualquer conta do sistema.
    //
    // Agora: sessão, autorização, e só então o corpo. Quem não é `master` nunca
    // chega perto do parser, e o `catch` não devolve mais `stack`.
    const cookieStore = await cookies();
    const supabase = createServerClient(URL, ANON, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    });

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 401 });

    const userId = authData?.user?.id ?? null;
    if (!userId) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

    const { data: me } = await supabase
      .from("profiles")
      .select("admin_level")
      .eq("id", userId)
      .single();

    if (me?.admin_level !== "master") {
      return NextResponse.json({ error: "not authorized" }, { status: 403 });
    }

    // Só agora o corpo. O `try` interno é estreito de propósito: JSON inválido
    // é erro do cliente (400), não falha de servidor, e não tem por que
    // atravessar o `catch` geral lá embaixo.
    let corpo: CorpoSetAccess;
    try {
      corpo = ((await req.json()) ?? {}) as CorpoSetAccess;
    } catch {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const target_user_id =
      typeof corpo.target_user_id === "string" ? corpo.target_user_id : null;
    const new_role = typeof corpo.new_role === "string" ? corpo.new_role : null;
    const new_admin_level =
      typeof corpo.new_admin_level === "string" ? corpo.new_admin_level : null;
    const new_admin_team =
      typeof corpo.new_admin_team === "string" ? corpo.new_admin_team : null;

    if (!target_user_id || !new_role) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const isAdmin = new_role === "admin";

const updateData = isAdmin
  ? {
      role: "admin",
      admin_level: new_admin_level ?? "admin",
      admin_team: new_admin_team ?? null,
    }
  : {
      role: new_role,
      admin_level: null,
      admin_team: null,
    };

const { error } = await admin
  .from("profiles")
  .update(updateData)
  .eq("id", target_user_id);

    if (error) {
      // T-014 — os três `as any` saíram. `error` já é `PostgrestError`, que
      // declara `details`, `hint` e `code`: o cast não estava contornando
      // tipo faltando, estava só apagando o que já existia.
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    // T-015 / R-037 — o `stack` SAIU da resposta. Ele ia para o navegador de
    // quem chamou e entregava caminho de arquivo e estrutura interna.
    // O rastro não se perdeu: ele foi para o log do servidor, que é onde
    // sempre devia ter estado. Mesmo formato de `set-role`, que já era o certo.
    console.error("[api/admin/set-access] erro nao tratado", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
