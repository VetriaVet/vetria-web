// Regra única de senha da Vetria (T-034). Espelha o que o Supabase Auth de
// produção exige desde 23/09/2026: mínimo 8 caracteres, com pelo menos uma
// letra minúscula, uma maiúscula e um número. Toda tela que cria ou troca
// senha valida AQUI antes de chamar o Supabase, pra pessoa ler o que falta em
// português em vez do erro cru do servidor.
//
// As classes são ASCII de propósito: o Supabase só conta a-z, A-Z e 0-9. Uma
// senha com "É" como única maiúscula passaria aqui se usássemos \p{Lu} e seria
// recusada lá.
//
// Se a configuração do Supabase mudar, mude aqui e no texto de ajuda juntos.

export const SENHA_MINIMO = 8;

export const SENHA_AJUDA =
  "Mínimo de 8 caracteres, com letra maiúscula, letra minúscula e número.";

export const SENHA_PLACEHOLDER = "Crie uma senha";

/** Lista, em português, o que ainda falta na senha. Vazia = senha aceita. */
export function faltasDaSenha(senha: string): string[] {
  const faltas: string[] = [];
  if (senha.length < SENHA_MINIMO) faltas.push(`pelo menos ${SENHA_MINIMO} caracteres`);
  if (!/[a-z]/.test(senha)) faltas.push("uma letra minúscula");
  if (!/[A-Z]/.test(senha)) faltas.push("uma letra maiúscula");
  if (!/[0-9]/.test(senha)) faltas.push("um número");
  return faltas;
}

/** Mensagem pronta pra tela, ou null quando a senha atende a regra. */
export function validarSenha(senha: string): string | null {
  const faltas = faltasDaSenha(senha);
  if (faltas.length === 0) return null;
  return `Sua senha precisa ter ${juntar(faltas)}.`;
}

function juntar(itens: string[]): string {
  if (itens.length === 1) return itens[0];
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}
