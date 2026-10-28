"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// SEC-112: "Não é a sua conta? Sair". Encerra a sessão que o link acabou de
// abrir e manda para o login. Roda no servidor para os cookies da sessão
// saírem na mesma resposta. DL-016: `redirect()` fora de `try/catch`.
export async function sairDaContaDoLink() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth/confirm/entrou] signOut falhou", {
      code: error.code ?? null,
      status: error.status ?? null,
    });
  }
  redirect("/login");
}
