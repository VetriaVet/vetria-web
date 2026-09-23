// Como a busca e o perfil público sabem que a `0005` ainda não está no banco.
//
// A página não pergunta ao catálogo "a 0005 foi aplicada?". Ela faz a
// consulta de verdade e lê o ERRO que o PostgREST devolve quando a consulta
// cita algo que não existe:
//
//   · tabela que não existe (`especialidades`, `servicos`, `cidades`):
//       PGRST205 "Could not find the table ... in the schema cache"
//       (PostgREST 12.2+); 42P01 "relation does not exist" (versões antigas)
//   · coluna que não existe (`busca`):
//       42703 "column ... does not exist"
//   · função ou relação que não existe no cache: PGRST202, PGRST200
//
// Qualquer desses vira `indisponivel` ("A busca abre em breve"). Qualquer
// OUTRO erro (rede, tempo esgotado, permissão) vira `erro`: a página diz que
// não conseguiu agora, e também não cai. Nenhum dos dois derruba a página com
// 500, e nenhum dos dois inventa resultado.
//
// A mesma regra cobre o build: as rotas públicas renderizam por requisição
// (`connection()` em `lib/supabase/publico.ts`), então o `next build` não
// consulta o banco, e sem as variáveis do Supabase a consulta nem sai
// (`ClientePublicoSemConfiguracao` → `indisponivel`).
import { ClientePublicoSemConfiguracao } from "@/lib/supabase/publico";

export type Falha = "indisponivel" | "erro";

const CODIGOS_DE_OBJETO_AUSENTE = new Set([
  "PGRST205", // tabela fora do cache do PostgREST
  "PGRST202", // função fora do cache
  "PGRST200", // relação fora do cache
  "42P01", //    undefined_table
  "42703", //    undefined_column
  "42883", //    undefined_function
]);

type ErroDoPostgrest = { code?: string | null; message?: string | null };

export function classificarErro(erro: unknown): Falha {
  if (erro instanceof ClientePublicoSemConfiguracao) return "indisponivel";
  const codigo = (erro as ErroDoPostgrest | null)?.code ?? "";
  if (CODIGOS_DE_OBJETO_AUSENTE.has(codigo)) return "indisponivel";
  return "erro";
}

/**
 * Registro no log do servidor, sem dado de quem navega (nada de termo de
 * busca, nada de slug). Serve para distinguir, na Vercel, "0005 não aplicada"
 * de "o banco caiu".
 */
export function registrarFalha(onde: string, falha: Falha, erro: unknown): void {
  const codigo = (erro as ErroDoPostgrest | null)?.code ?? "sem-codigo";
  console.error(`[${onde}] ${falha} (${codigo})`);
}
