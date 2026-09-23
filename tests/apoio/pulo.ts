// PULO COM MOTIVO, E O MODO EM QUE PULO VIRA FALHA.
//
// ⚠️ R-053, duas vezes: a suíte ficou verde com teste pulando em silêncio. Na
// primeira (15/09) faltava credencial; na segunda (23/09) a conta de teste
// tinha sido aprovada e 16 testes passaram a pular.
//
// Localmente, pular com o motivo escrito é o certo: quem roda na própria
// máquina lê o motivo. No CI ninguém lê. Por isso `E2E_EXIGIR_FILA=1` (card da
// T-029, parte A) transforma todo pulo DE ESTADO OU DE CONFIGURAÇÃO em falha:
//   · falta credencial
//   · o alvo não é o projeto de teste
//   · a conta de teste não está no estado que o teste precisa
//
// O nome da variável é o do card e ficou por isso; o alcance é "nenhum pulo".

import { test } from "@playwright/test";

export const EXIGIR = process.env.E2E_EXIGIR_FILA === "1";

/**
 * Dentro de um teste ou de um `beforeEach`: pula com o motivo, ou falha com o
 * mesmo motivo quando `E2E_EXIGIR_FILA=1`.
 */
export function pularOuFalhar(condicao: boolean, motivo: string): void {
  if (!condicao) return;
  if (EXIGIR) {
    throw new Error(`E2E_EXIGIR_FILA=1: este teste PULARIA, e neste modo pulo e falha. Motivo: ${motivo}`);
  }
  test.skip(true, motivo);
}

/**
 * Para `beforeAll`. O `test.skip` de nível de `describe` já cuida do modo
 * normal (`test.skip(faltou && !EXIGIR, motivo)`); aqui só se falha, e só no
 * modo exigente, antes de qualquer teste do bloco rodar.
 */
export function falharSeExigir(condicao: boolean, motivo: string): void {
  if (condicao && EXIGIR) {
    throw new Error(`E2E_EXIGIR_FILA=1: este bloco PULARIA, e neste modo pulo e falha. Motivo: ${motivo}`);
  }
}
