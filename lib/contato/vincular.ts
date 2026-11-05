// T-042 · O HISTÓRICO VAI COM A CONTA NOVA (DL-071 D10, 0006 §6).
//
// Quem clicou em "Chamar no WhatsApp" sem conta ganhou o cookie
// `vetria_visitante` (D2, `app/api/contato/route.ts`). Quando essa pessoa CRIA
// conta de responsável no mesmo navegador, os contatos dos últimos 30 dias
// daquele cookie passam para a conta e aparecem em "Seus contatos".
//
// Onde é chamado: só na CONFIRMAÇÃO DO CADASTRO (o primeiro momento em que a
// conta nova tem sessão neste navegador): `app/auth/confirm/actions.ts` para
// os links `signup`/`email`, e `app/auth/callback/route.ts` para os links
// antigos. NUNCA num login qualquer (D10: num computador compartilhado, quem
// entrasse na própria conta levaria o histórico de quem usou a máquina antes).
//
// O banco confere sozinho o que importa (0006 §6): a conta é `tutor`, foi
// criada nas últimas 24 horas (data de `auth.users`, que ninguém escreve), e
// só linhas SEM `user_id` dos últimos 30 dias. Chamar a mais não rouba nada.
//
// Esta função NUNCA lança e NUNCA atrasa a entrada da pessoa: o vínculo é
// bônus. Falhou, a conta segue criada e o log leva só o `code` do erro, sem
// cookie e sem id.
import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** O mesmo nome que `app/api/contato/route.ts` grava. */
export const COOKIE_DO_VISITANTE = "vetria_visitante";

/** Só o UUID v4 minúsculo que `randomUUID()` gera (o mesmo da rota). */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Devolve quantos contatos foram vinculados (0 em qualquer outro caso). */
export async function vincularContatosDoVisitante(userId: string | null | undefined): Promise<number> {
  if (!userId) return 0;
  try {
    const anonId = (await cookies()).get(COOKIE_DO_VISITANTE)?.value;
    if (!anonId || !UUID_V4.test(anonId)) return 0;

    const { data, error } = await createAdminClient().rpc("vincular_contatos_do_visitante", {
      p_user_id: userId,
      p_anon_id: anonId,
    });
    if (error) {
      console.error("[contato/vincular] vincular_contatos_do_visitante falhou", { code: error.code });
      return 0;
    }
    return typeof data === "number" ? data : 0;
  } catch {
    console.error("[contato/vincular] falhou antes do banco");
    return 0;
  }
}
