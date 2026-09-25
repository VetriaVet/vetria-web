"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { destinoDoErroDoLink } from "@/lib/auth/erros";
import {
  destinoDoLink,
  fluxoDoTipo,
  lerTipoDoLink,
  lerTokenHash,
  TELA_DA_CONTA_CONFIRMADA,
} from "@/lib/auth/link-do-email";

// T-036 — o clique em "Continuar" da página /auth/confirm.
//
// É AQUI, e não no GET da página, que o `token_hash` é gasto. O `verifyOtp`
// roda no servidor, com o client de cookies: a sessão nasce neste navegador,
// qualquer que seja o navegador que pediu o email. Não há `code_verifier`
// envolvido, então abrir o link em outro aparelho funciona.
//
// Tudo o que chega pelo formulário é relido e revalidado: o formulário é
// HTML, e HTML o cliente escreve como quiser.
//
// ⚠️ DL-016: nenhum `redirect()` fica dentro de `try/catch`. O `verifyOtp`
// devolve o erro no retorno (não lança), então não há `try` aqui.
export async function confirmarLinkDoEmail(formData: FormData) {
  const tipo = lerTipoDoLink(formData.get("type"));
  const tokenHash = lerTokenHash(formData.get("token_hash"));

  if (!tipo || !tokenHash) {
    redirect(
      destinoDoErroDoLink({ error: "invalid_request" }, fluxoDoTipo(tipo)) ??
        "/login?msg=missing_code"
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: tipo,
    token_hash: tokenHash,
  });

  if (error) {
    // Nunca o token no log: ele é a credencial de uso único da pessoa.
    console.error("[auth/confirm] verifyOtp recusou o link", {
      tipo,
      code: error.code ?? null,
      status: error.status ?? null,
      message: error.message,
    });
    redirect(
      destinoDoErroDoLink(
        { error: "access_denied", error_code: error.code ?? "otp_invalid" },
        fluxoDoTipo(tipo)
      ) ?? "/login?msg=auth_error"
    );
  }

  const destino = destinoDoLink(tipo, formData.get("next"));
  console.log("[auth/confirm] link verificado", { tipo, destino });

  // SEC-112: a recuperação de senha já para numa tela (a de nova senha), que
  // mostra a conta. Os demais passam pela tela "Você entrou como <email da conta>"
  // antes do destino, para a pessoa perceber se o link era de outra conta.
  if (tipo === "recovery") redirect(destino);
  redirect(
    `${TELA_DA_CONTA_CONFIRMADA}?next=${encodeURIComponent(destino)}`
  );
}
