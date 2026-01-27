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
  return NextResponse.json(
    { error: error.message, details: (error as any).details, hint: (error as any).hint, code: (error as any).code },
    { status: 400 }
  );
}

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "server error", stack: e?.stack ?? null },
      { status: 500 }
    );
  }
}
