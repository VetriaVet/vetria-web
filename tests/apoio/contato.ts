// APOIO DA T-043: o contato pelo WhatsApp visto de fora (rota, banco, tela).
//
// Os specs da T-040 e da T-041 (`contato-rota.spec.ts`, `contato-botao.spec.ts`)
// têm cópias locais de parte disto. Ficaram como estão de propósito: mexer
// neles agora, com a T-042 e a T-046 abertas em paralelo, só gera conflito.
// Spec novo usa daqui.

import type { APIResponse } from "@playwright/test";
import { clienteDeServico } from "./servico";

export const CONTATO_LIGADO = process.env.CONTATO_ABERTO_PARA_TESTE === "1";

export const ROTA_CONTATO = "/api/contato";
export const NO_MESMO_SITE = { "content-type": "application/json", "sec-fetch-site": "same-origin" };
export const BOTAO_WHATSAPP = "Chamar no WhatsApp";
export const COOKIE_DO_VISITANTE = "vetria_visitante";

/** Dígitos aleatórios (CRMV, WhatsApp de teste). */
export function digitos(n: number): string {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

/** Um celular de teste de Palmas (DDD 63), 11 dígitos, sem o 55. Não é de ninguém
 *  conhecido: é aleatório a cada rodada, e só vive no banco de teste. */
export function whatsappDeTeste(): string {
  return `639${digitos(8)}`;
}

/** Como a tela mostra o número revelado: (63) 91234-5678. */
export function whatsappFormatado(n: string): string {
  return n.length === 11
    ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
    : `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
}

export function pedidoDeContato(slug: string, tipo = "vet") {
  return { alvo: { tipo, slug }, origem: { cidade: null, especialidade: null }, canal: "whatsapp" };
}

/** Os `Set-Cookie` do cookie do visitante, crus. */
export function cookiesDoVisitante(r: APIResponse): string[] {
  return r
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie" && h.value.startsWith(`${COOKIE_DO_VISITANTE}=`))
    .map((h) => h.value);
}

export function valorDoCookie(cru: string): string {
  return cru.split(";")[0].split("=")[1] ?? "";
}

export type LinhaDeContato = {
  profissional_id: string;
  user_id: string | null;
  anon_id: string | null;
  canal: string;
};

/** O que o banco gravou (service_role do TESTE: prova, não atalho). */
export async function contatosDe(profissionalId: string): Promise<LinhaDeContato[]> {
  const { data, error } = await clienteDeServico()
    .from("contatos")
    .select("profissional_id, user_id, anon_id, canal")
    .eq("profissional_id", profissionalId);
  if (error) throw new Error(`contatosDe: ${error.code}: ${error.message}`);
  return (data ?? []) as LinhaDeContato[];
}

/** O slug que a 0005 gera a partir do nome (DL-067), sem o sufixo de colisão. */
export function baseDoSlug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
