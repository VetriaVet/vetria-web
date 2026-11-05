// T-046 / DL-071 D9: o profissional está sem WhatsApp que o contato consiga
// entregar?
//
// A leitura é com a SESSÃO do dono (`lib/supabase/server.ts`), pela policy
// `perfil_privado_select_own`. Nunca `service_role`: quem decide que a linha é
// dele é o Postgres, e o `.eq("id", ...)` só escolhe qual linha pedir.
//
// ⚠️ Devolve um booleano e mais nada. O número não sai daqui: quem desenha o
// aviso precisa de sim ou não, e o número no payload do painel seria dado a
// mais circulando sem motivo.
//
// Falha de leitura devolve `false` (sem aviso), com log: um aviso falso de
// "você está sem WhatsApp" para quem tem número assusta mais do que ajuda, e a
// falha fica registrada no servidor.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { temWhatsappValido } from "./whatsapp";

export async function estaSemWhatsapp(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfil_privado")
    .select("whatsapp")
    .eq("id", userId)
    .maybeSingle<{ whatsapp: string | null }>();

  if (error) {
    console.error("[contato/sem-whatsapp] leitura falhou", {
      userId,
      code: error.code,
    });
    return false;
  }

  // Sem linha em `perfil_privado` é o mesmo que sem número.
  return !temWhatsappValido(data?.whatsapp);
}
