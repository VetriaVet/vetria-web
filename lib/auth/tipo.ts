// T-064 / DL-080 item 2: a conta criada sem tipo (Google, ou o cadastro pelo
// `/login`) ainda pode escolher o tipo?
//
// A resposta espelha a regra do banco (`escolher_tipo_de_conta`, 0009): conta
// `tutor`, ativa, sem nível de admin, com o cadastro de responsável NÃO
// concluído e `tipo_escolhido_em` nulo. Quem decide de verdade é a função do
// banco; esta leitura só escolhe para onde mandar a pessoa. Espelhar a regra
// inteira é o que impede o laço: se esta função dissesse "pode" para uma conta
// que o banco recusa, `/app` mandaria para a escolha e a escolha falharia para
// sempre.
//
// ⚠️ FALHA = "NÃO PODE". Erro de leitura, linha ausente ou a coluna ainda não
// existir (a `0009` não aplicada no banco, código 42703) devolvem `false`, e a
// pessoa segue o caminho de antes (responsável). Uma tela de escolha que
// aparece sem o banco saber recebê-la é pior do que nenhuma.
//
// Leitura com a SESSÃO do dono (policy `profiles_select_own`), nunca
// `service_role`.
import "server-only";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export async function podeEscolherTipo(supabase: Supabase, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, status, admin_level, onboarding_completed, tipo_escolhido_em")
    .eq("id", userId)
    .maybeSingle<{
      role: string | null;
      status: string | null;
      admin_level: string | null;
      onboarding_completed: boolean | null;
      tipo_escolhido_em: string | null;
    }>();

  if (error) {
    // 42703 = coluna inexistente: a 0009 ainda não está neste banco. Esperado
    // em produção até o "pode aplicar"; não é falha para alarmar.
    if (error.code !== "42703") {
      console.error("[auth/tipo] leitura falhou", { code: error.code });
    }
    return false;
  }
  if (!data) return false;

  const nascimentoSemTipo =
    data.tipo_escolhido_em === null &&
    data.role === "tutor" &&
    data.status === "active" &&
    (data.admin_level ?? "none") === "none" &&
    !data.onboarding_completed;
  if (!nascimentoSemTipo) return false;

  // A última metade da regra do banco: sem perfil de veterinário nem de
  // estabelecimento (só acontece se o master trocou o role e depois destrocou).
  // Só chega aqui a conta que nasceu sem tipo, então as duas leituras são raras.
  const [vet, clinic] = await Promise.all([
    supabase.from("vet_profiles").select("id", { count: "exact", head: true }).eq("id", userId),
    supabase.from("clinic_profiles").select("id", { count: "exact", head: true }).eq("id", userId),
  ]);
  if (vet.error || clinic.error) {
    console.error("[auth/tipo] leitura dos perfis falhou", {
      code: vet.error?.code ?? clinic.error?.code,
    });
    return false;
  }
  return (vet.count ?? 0) === 0 && (clinic.count ?? 0) === 0;
}
