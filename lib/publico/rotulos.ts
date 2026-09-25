// Os valores curtos que o banco grava ("mv", "5a10") viram o texto que a
// pessoa lê, a partir da MESMA lista que o formulário e o CHECK da 0004 usam.
// Valor fora da lista (não deveria existir desde a 0004) vira nulo, e a tela
// omite: melhor faltar um rótulo do que mostrar "mv" para um responsável.
import { EXPERIENCIA, TITULOS } from "@/app/app/veterinario/onboarding/campos";

export function rotuloDoTitulo(valor: string | null): string | null {
  return TITULOS.find((t) => t.value === valor)?.label ?? null;
}

export function rotuloDaExperiencia(valor: string | null): string | null {
  return EXPERIENCIA.find((e) => e.value === valor)?.label ?? null;
}
