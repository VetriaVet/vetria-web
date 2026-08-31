// Credenciais da suíte E2E — de onde vêm e por que não vêm de arquivo.
//
// ⚠️ REGRA DA T-003, e ela não é burocracia: usuário de teste NÃO vem de
// `.env` commitado. Vem de secret do GitHub, injetado como variável de
// ambiente. `.env*` está no `.gitignore` desde o começo do projeto, mas a
// tentação aqui é real ("é só uma conta de teste") e o custo de errar é uma
// credencial válida de produção no histórico do git, que não sai mais de lá.
//
// As duas chaves públicas do Supabase (URL e ANON) também entram por secret,
// mesmo sendo públicas por desenho: elas viajam no bundle do navegador. O que
// NUNCA entra no CI é a `SUPABASE_SERVICE_ROLE_KEY` — ela ignora RLS inteira,
// e um workflow comprometido com ela na mão lê a base toda.

export type Credencial = { email: string; senha: string };

function ler(nome: string): string | undefined {
  const v = process.env[nome];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

// Conta de teste com role `vet`. Criada uma vez, à mão, e reutilizada:
// a suíte não cria conta em produção (ver "Não fazer" no card da T-003).
export function credencialVet(): Credencial | null {
  const email = ler("E2E_VET_EMAIL");
  const senha = ler("E2E_VET_SENHA");
  if (!email || !senha) return null;
  return { email, senha };
}

// Frase única de motivo, pra falha de configuração não se disfarçar de
// "teste passou". Um teste pulado tem que dizer por que foi pulado.
export const SEM_CREDENCIAL =
  "sem E2E_VET_EMAIL / E2E_VET_SENHA no ambiente: crie os secrets no GitHub (ver README, secao Testes)";
