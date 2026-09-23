// O cliente das LEITURAS PÚBLICAS (busca e perfil público, F4).
//
// ⚠️ POR QUE UM CLIENTE ANÔNIMO, E NÃO O `createClient` de `./server.ts`.
//
// O cliente de `./server.ts` carrega a sessão de quem está navegando. Com ela,
// o Postgres soma por OU todas as policies de SELECT que valem para aquele
// usuário, e não só a pública:
//   · `vet_profiles_select_own` / `clinic_profiles_select_own`: o dono lê a
//     própria linha em QUALQUER status;
//   · `*_select_admin` (0002) e a leitura do admin da 0004: admin lê a fila.
// Resultado, se a busca usasse a sessão: um veterinário em
// `pending_validation` se veria na busca e abriria a própria "página
// pública"; um admin veria a fila inteira misturada nos resultados. A matriz
// (06-PERMISSOES §3, regra 2) diz que a busca mostra SÓ `role` certo E
// `active`, para todo mundo.
//
// Com este cliente a requisição chega ao PostgREST como `anon`, e a ÚNICA
// policy que se aplica é `*_select_publico` = `perfil_esta_ativo(id, role)`.
// A visibilidade é decidida pelo Postgres, e a aplicação não tem filtro de
// status nenhum para esquecer.
//
// Sem cookie, sem sessão, sem `service_role`: a chave é a anônima, a mesma
// que já está no bundle público. `server-only` não protege segredo aqui; ele
// garante que a consulta da busca rode no servidor (o HTML sai pronto, e a
// regra de "quais colunas" fica num lugar só, `lib/busca` e
// `lib/perfil-publico`).
//
// `connection()` marca a renderização como de requisição. Sem isso o Next
// pode guardar o HTML de `/veterinario/[slug]` depois da primeira visita, e
// uma conta suspensa continuaria no ar pelo cache, que é a regra de
// visibilidade contornada por fora do banco.
import "server-only";
import { connection } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export async function createPublicClient(): Promise<SupabaseClient> {
  await connection();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) {
    // Quem chama trata como "indisponível" (lib/publico/disponibilidade.ts).
    throw new ClientePublicoSemConfiguracao();
  }

  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export class ClientePublicoSemConfiguracao extends Error {
  constructor() {
    super("NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY ausente");
    this.name = "ClientePublicoSemConfiguracao";
  }
}
