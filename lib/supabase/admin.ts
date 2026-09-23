// ⚠️ R-058 / SEC-089 / DL-061 item 3 — ESTE MÓDULO NUNCA VAI PARA O NAVEGADOR.
// `server-only` transforma "a chave de `service_role` nunca vai pro cliente"
// de disciplina em ERRO DE BUILD: se um Client Component importar este
// arquivo, direta ou indiretamente, `next build` falha. Não remova esta linha
// para "fazer compilar": o erro está dizendo que a chave mais sensível do
// projeto ia parar num bundle público.
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server only
  return createClient(url, key, { auth: { persistSession: false } });
}
