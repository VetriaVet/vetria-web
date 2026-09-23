// Credenciais da suíte E2E — de onde vêm e por que não vêm de arquivo.
//
// ⚠️ REGRA DA T-003, e ela não é burocracia: usuário de teste NÃO vem de
// `.env` commitado. Vem de secret do GitHub, injetado como variável de
// ambiente. `.env*` está no `.gitignore` desde o começo do projeto, mas a
// tentação aqui é real ("é só uma conta de teste") e o custo de errar é uma
// credencial válida de produção no histórico do git, que não sai mais de lá.
//
// As duas chaves públicas do Supabase (URL e ANON) também entram por secret,
// mesmo sendo públicas por desenho: elas viajam no bundle do navegador.
//
// ⚠️ DL-064 (23/09/2026): a `SUPABASE_SERVICE_ROLE_KEY` DO PROJETO DE TESTE
// (`vetria-e2e`) passa a ser secret do CI, para criar e apagar conta a cada
// rodada. A de PRODUÇÃO, nunca: ela ignora RLS inteira, e um workflow
// comprometido com ela na mão lê a base toda. Quem usa a chave é só
// `servico.ts`, depois de `alvo.ts` conferir que o alvo não é produção.

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

// ---------------------------------------------------------------------------
// 23/09/2026 — as contas que o item 5 do DoD da F3 ainda precisa (R-033)
// ---------------------------------------------------------------------------
// Cada uma é OPCIONAL no código: sem o secret, o teste que depende dela PULA
// dizendo qual secret falta. Mas "opcional no código" não é "opcional no CI":
// o pré-voo do `ci.yml` só cobra E2E_VET_*. Enquanto ele não cobrar estas
// também, o teste que depende delas pula em silêncio no CI, que é o R-053
// outra vez. Quem acrescentar o secret no GitHub acrescenta a linha no `env:`
// e no pré-voo do `ci.yml` junto (arquivo fora de `tests/`, não é do QA).
// Desde 23/09, com `E2E_EXIGIR_FILA=1` esse pulo vira FALHA (`pulo.ts`).

/** Conta `admin` COMUM (`admin_level = 'admin'`), nunca a do Elber, nunca
 *  master. ⚠️ SÓ NO PROJETO DE TESTE (DL-064): com ela na mão a tela aprova
 *  qualquer conta. Os testes que a usam exigem `E2E_ALVO=teste`. */
export function credencialAdmin(): Credencial | null {
  const email = ler("E2E_ADMIN_EMAIL");
  const senha = ler("E2E_ADMIN_SENHA");
  if (!email || !senha) return null;
  return { email, senha };
}

/** Conta `tutor` (responsável). Só navega; não escreve nada. */
export function credencialTutor(): Credencial | null {
  const email = ler("E2E_TUTOR_EMAIL");
  const senha = ler("E2E_TUTOR_SENHA");
  if (!email || !senha) return null;
  return { email, senha };
}

export const SEM_ADMIN =
  "sem E2E_ADMIN_EMAIL / E2E_ADMIN_SENHA no ambiente: conta admin COMUM de teste, separada da do Elber (ver R-033)";

export const SEM_TUTOR =
  "sem E2E_TUTOR_EMAIL / E2E_TUTOR_SENHA no ambiente: conta responsavel (role tutor) de teste (ver R-033)";

/** Conta `clinic` de teste. Só navega (isolamento de painel). Pode estar em
 *  qualquer status: o teste mede o destino antes de afirmar. */
export function credencialClinic(): Credencial | null {
  const email = ler("E2E_CLINIC_EMAIL");
  const senha = ler("E2E_CLINIC_SENHA");
  if (!email || !senha) return null;
  return { email, senha };
}

export const SEM_CLINIC =
  "sem E2E_CLINIC_EMAIL / E2E_CLINIC_SENHA no ambiente: conta estabelecimento (role clinic) de teste, so no projeto de teste (DL-064)";
