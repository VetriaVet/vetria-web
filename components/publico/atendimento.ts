import { Building2, Home, Video, type LucideIcon } from "lucide-react";
import { MODOS_DE_ATENDIMENTO, type ModoDeAtendimento } from "@/lib/busca/tipos";

// Como cada forma de atendimento aparece para o responsável. Um lugar só para
// a busca, o cartão e o perfil falarem igual.

export const ATENDIMENTO: Record<ModoDeAtendimento, { rotulo: string; icone: LucideIcon }> = {
  presencial: { rotulo: "Presencial", icone: Building2 },
  domiciliar: { rotulo: "Domiciliar", icone: Home },
  teleorientacao: { rotulo: "Teleorientação", icone: Video },
};

/** Os modos ligados, na ordem da lista. */
export function modosLigados(atendimento: Record<ModoDeAtendimento, boolean>): ModoDeAtendimento[] {
  return MODOS_DE_ATENDIMENTO.filter((m) => atendimento[m]);
}

/** "Bairro, Cidade, UF" sem vírgula sobrando quando falta um pedaço. */
export function juntarLocal(...partes: (string | null | undefined)[]): string {
  return partes
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p))
    .join(", ");
}

/** Iniciais de um nome real (nunca de nome inventado). Nulo sem nome. */
export function iniciais(nome: string | null): string | null {
  if (!nome) return null;
  const palavras = nome
    .replace(/^(dra?\.?|dr\(a\)\.?)\s+/i, "")
    .split(/\s+/)
    .filter((p) => /^[\p{L}]/u.test(p));
  if (palavras.length === 0) return null;
  const primeira = palavras[0][0];
  const ultima = palavras.length > 1 ? palavras[palavras.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}
