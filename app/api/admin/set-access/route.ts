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

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { target_user_id, new_role, new_admin_level, new_admin_team } = payload ?? {};

    if (!target_user_id || !new_role) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

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
    // T-014 — `unknown` obriga a estreitar antes de ler `.message`/`.stack`.
    // ⚠️ O CORPO DESTA RESPOSTA NÃO MUDOU, e isso é de propósito: o card da
    // T-014 é de tipo, não de comportamento. O `stack` continua saindo daqui
    // para o cliente, e isso é o R-037 — leia antes de copiar este bloco.
    const erro = e instanceof Error ? e : null;
    return NextResponse.json(
      { error: erro?.message ?? "server error", stack: erro?.stack ?? null },
      { status: 500 }
    );
  }
}
