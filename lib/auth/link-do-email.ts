// T-036 — as regras do link que chega por email, num lugar só.
//
// O link novo dos templates do Supabase é
//   {{ .SiteURL }}/auth/confirm?token_hash=...&type=...&next=...
// e quem o abre pode ser qualquer navegador, em qualquer aparelho: o
// `token_hash` é verificado no SERVIDOR por `verifyOtp`, sem depender do
// `code_verifier` que o fluxo PKCE grava no navegador que pediu o email.
//
// Três coisas moram aqui, e as três são decisão de servidor:
//   1. a lista FECHADA de tipos que aceitamos (o que vier fora dela é recusado)
//   2. a regra anti open redirect do `next` (a mesma do /auth/callback)
//   3. para onde cada tipo leva quando dá certo, e que fluxo de erro ele usa

import type { EmailOtpType } from "@supabase/supabase-js";

/** Os únicos valores de `type` que o /auth/confirm aceita. */
export const TIPOS_DO_LINK = [
  "recovery",
  "signup",
  "email",
  "email_change",
  // `invite` e `magiclink` ficam de fora (SEC-113): nenhum template os usa, e
  // aceitá-los deixaria trocar `type=recovery` por `magiclink` na URL e fugir
  // da tela de nova senha.
] as const satisfies readonly EmailOtpType[];

export type TipoDoLink = (typeof TIPOS_DO_LINK)[number];

/** `null` quando o valor não está na lista fechada. */
export function lerTipoDoLink(valor: unknown): TipoDoLink | null {
  if (typeof valor !== "string") return null;
  return (TIPOS_DO_LINK as readonly string[]).includes(valor)
    ? (valor as TipoDoLink)
    : null;
}

/**
 * O `token_hash` é opaco para nós (hoje, hexadecimal com prefixo `pkce_`
 * opcional). A checagem é só de forma, para não levar lixo ao Supabase nem
 * ao HTML: letras, números, `_` e `-`, até 256 caracteres. Quem decide se ele
 * vale é o `verifyOtp`.
 */
export function lerTokenHash(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  return /^[A-Za-z0-9_-]{1,256}$/.test(valor) ? valor : null;
}

/**
 * Caminho interno seguro, ou `null`. É a regra anti open redirect do projeto:
 * começa com UMA barra, sem `//` e sem barra invertida (o navegador trata
 * `/\evil.com` como `//evil.com`), sem espaço nem caractere de controle (o
 * parser de URL descarta tab e quebra de linha, e `/\t/evil.com` vira
 * `//evil.com`), e, conferido pelo próprio parser, continua no mesmo host.
 * Devolve o caminho JÁ NORMALIZADO pelo parser, e é esse que se usa.
 */
export function caminhoInternoSeguro(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  if (valor.length === 0 || valor.length > 512) return null;
  if (!valor.startsWith("/") || valor.startsWith("//")) return null;
  if (/[\\\s\u0000-\u001f\u007f]/.test(valor)) return null;
  try {
    const base = "https://vetria.invalid";
    const url = new URL(valor, base);
    if (url.origin !== base) return null;
    const caminho = `${url.pathname}${url.search}${url.hash}`;
    // A normalização pode FABRICAR o `//`: `/..//evil.com` vira `//evil.com`,
    // que num cabeçalho Location é outro site. Confere de novo depois dela.
    if (!caminho.startsWith("/") || caminho.startsWith("//")) return null;
    return caminho;
  } catch {
    return null;
  }
}

/** Qual tela de erro cada tipo usa (ver `destinoDoErroDoLink`). */
export type FluxoDoLink = "senha" | "confirmacao" | "outro";

export function fluxoDoTipo(tipo: TipoDoLink | null): FluxoDoLink {
  if (tipo === "recovery") return "senha";
  if (tipo === "signup" || tipo === "email") {
    return "confirmacao";
  }
  return "outro";
}

/** Tela de definir a senha nova: o único destino do link de recuperação. */
export const DESTINO_DA_RECUPERACAO = "/recuperar-senha/nova";

/**
 * SEC-112: a tela que mostra em qual conta a pessoa entrou depois do link.
 * O link com `token_hash` não fica preso ao navegador que o pediu: alguém pode
 * mandar o link da PRÓPRIA conta e a vítima entrar nela sem perceber. Por isso
 * a confirmação de email passa por esta tela antes do destino.
 */
export const TELA_DA_CONTA_CONFIRMADA = "/auth/confirm/entrou";

/**
 * Email mascarado para mostrar na tela: primeira letra, `***` e o domínio
 * inteiro (`ana@gmail.com` vira `a***@gmail.com`). Dá para a pessoa reconhecer
 * a própria conta sem expor o endereço a quem olha a tela por cima do ombro.
 * `null` quando não há email utilizável.
 */
export function mascararEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const arroba = email.lastIndexOf("@");
  if (arroba < 1 || arroba === email.length - 1) return null;
  const primeira = Array.from(email.slice(0, arroba))[0];
  return `${primeira}***${email.slice(arroba)}`;
}

/**
 * Para onde o link leva depois de verificado.
 * - `recovery` vai SEMPRE para a tela de nova senha, qualquer que seja o
 *   `next`: o link existe para isso, e não há motivo para ele abrir outra porta.
 * - os demais respeitam o `next` se ele for caminho interno seguro, e senão vão
 *   para `/app`, que despacha por role e status (o mesmo roteador do login).
 */
export function destinoDoLink(tipo: TipoDoLink, next: unknown): string {
  if (tipo === "recovery") return DESTINO_DA_RECUPERACAO;
  return caminhoInternoSeguro(next) ?? "/app";
}
