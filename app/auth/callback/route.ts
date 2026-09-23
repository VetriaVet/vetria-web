import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { destinoDoErroDoLink } from "@/lib/auth/erros";

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

  // Link de recuperação de senha: se falhar, a pessoa volta para pedir outro
  // em /recuperar-senha, não para o login.
  const fluxoDeSenha = !!next && next.startsWith("/recuperar-senha");

  if (!code) {
    // O Supabase manda ?error=...&error_code=otp_expired quando o link venceu
    // ou já foi usado (não há code para trocar).
    const destino = destinoDoErroDoLink(
      {
        error: searchParams.get("error"),
        error_code: searchParams.get("error_code"),
      },
      fluxoDeSenha
    );
    if (destino) {
      console.error("[auth/callback] link recusado pelo Supabase", {
        error: searchParams.get("error"),
        errorCode: searchParams.get("error_code"),
      });
      return NextResponse.redirect(`${origin}${destino}`);
    }
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
    return NextResponse.redirect(
      `${origin}${fluxoDeSenha ? "/recuperar-senha?erro=link_expirado" : "/login?msg=auth_error"}`
    );
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
