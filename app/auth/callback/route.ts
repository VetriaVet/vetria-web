import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Fluxos como recuperação de senha mandam ?next=/caminho: após estabelecer a
  // sessão, redirecionamos pra lá (ex.: tela de definir nova senha).
  const next = searchParams.get("next");

  console.log("[auth/callback] handler invoked", {
    hasCode: !!code,
    codePrefix: code?.substring(0, 12) ?? null,
    origin,
  });

  if (!code) {
    return NextResponse.redirect(`${origin}/login?msg=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed", {
      message: error.message,
      status: error.status,
      name: error.name,
      code: error.code ?? null,
    });
    return NextResponse.redirect(`${origin}/login?msg=auth_error`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error(
      "[auth/callback] getUser returned null after successful exchange"
    );
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // next interno (ex.: /recuperar-senha/nova) tem prioridade. Valida que é
  // caminho relativo seguro (evita open redirect).
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    console.log("[auth/callback] success → next", { userId: user.id, next });
    return NextResponse.redirect(`${origin}${next}`);
  }

  console.log("[auth/callback] success", {
    userId: user.id,
    hasRole: !!profile?.role,
    destination: profile?.role ? "/app" : "/onboarding",
  });

  return NextResponse.redirect(
    `${origin}${profile?.role ? "/app" : "/onboarding"}`
  );
}
