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

export async function GET() {
  try {
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
    const email = authData?.user?.email ?? null;

    if (!userId) {
      return NextResponse.json(
        { error: "not authenticated", debug: { userId, email } },
        { status: 401 }
      );
    }

    const { data: me, error: meErr } = await supabase
      .from("profiles")
      .select("admin_level, role")
      .eq("id", userId)
      .single();

    if (meErr) {
      return NextResponse.json(
        { error: meErr.message, debug: { userId, email } },
        { status: 400 }
      );
    }

    if (me?.admin_level !== "master") {
      return NextResponse.json(
        { error: "not authorized", debug: { userId, email, admin_level: me?.admin_level, role: me?.role } },
        { status: 403 }
      );
    }

    // ✅ LISTA DIRETO COM SERVICE ROLE (sem RPC)
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("profiles")
      .select("id, role, admin_level, admin_team, onboarding_completed, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message, debug: { userId, email, admin_level: me.admin_level } },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: data ?? [], debug: { userId, email, admin_level: me.admin_level } });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "server error", stack: e?.stack ?? null },
      { status: 500 }
    );
  }
}
