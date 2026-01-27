import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

const ALLOWED = new Set(["tutor", "vet", "clinic"]);

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const role = body?.role;

    if (!ALLOWED.has(role)) {
      return NextResponse.json({ error: "invalid role" }, { status: 400 });
    }

    // Só permite setar role se ainda estiver vazio (anti-troca via client)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role) {
      return NextResponse.json({ error: "role already set" }, { status: 409 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "server error" },
      { status: 500 }
    );
  }
}
