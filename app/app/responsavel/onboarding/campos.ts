// T-065 / DL-080 item 3: as listas do onboarding do responsável, num lugar só.
//
// Arquivo separado porque um módulo `"use server"` só exporta funções
// assíncronas: o formulário (cliente) e a Action (servidor) leem as MESMAS
// listas daqui. O que vale é a conferência do servidor; a do formulário é
// conveniência. Uma segunda cópia das listas é como o R-039 nasceu.
//
// O que fica gravado em `animais` é o CÓDIGO (`cao`, `adulto`, `medio`), não o
// rótulo: rótulo muda de texto, código não.

export type Opcao = { value: string; label: string };

export const ESPECIES: Opcao[] = [
  { value: "cao", label: "Cão" },
  { value: "gato", label: "Gato" },
  { value: "outro", label: "Outro" },
];

export const IDADES: Opcao[] = [
  { value: "filhote", label: "Filhote (0-1 ano)" },
  { value: "jovem", label: "Jovem (1-3 anos)" },
  { value: "adulto", label: "Adulto (3-7 anos)" },
  { value: "senior", label: "Idoso (7+ anos)" },
];

export const PESOS: Opcao[] = [
  { value: "pequeno", label: "Pequeno (até 10kg)" },
  { value: "medio", label: "Médio (10-25kg)" },
  { value: "grande", label: "Grande (25kg+)" },
];

export const LIMITES = { nome: 60, cidade: 80 } as const;

export type DadosDoAnimal = {
  nome: string;
  especie: string;
  idade: string;
  peso: string;
  cidade: string;
};

export type Validacao =
  | { ok: true; dados: DadosDoAnimal }
  | { ok: false; mensagem: string };

function campo(valor: FormDataEntryValue | null): string {
  // Espaço repetido vira um; quebra de linha e tab também. Campo de uma linha.
  return typeof valor === "string" ? valor.replace(/\s+/g, " ").trim() : "";
}

function naLista(lista: Opcao[], valor: string): boolean {
  return lista.some((o) => o.value === valor);
}

/** A conferência do servidor. Nada do que chega do navegador é confiável. */
export function validarAnimal(formData: FormData): Validacao {
  const nome = campo(formData.get("petName"));
  const especie = campo(formData.get("petSpecies"));
  const idade = campo(formData.get("petAge"));
  const peso = campo(formData.get("petWeight"));
  const cidade = campo(formData.get("cidade"));

  if (!nome) return { ok: false, mensagem: "Informe o nome do animal." };
  if (nome.length > LIMITES.nome) {
    return { ok: false, mensagem: `O nome do animal passa de ${LIMITES.nome} caracteres.` };
  }
  if (!naLista(ESPECIES, especie)) return { ok: false, mensagem: "Escolha a espécie do animal." };
  if (!naLista(IDADES, idade)) return { ok: false, mensagem: "Escolha a idade aproximada." };
  if (!naLista(PESOS, peso)) return { ok: false, mensagem: "Escolha o peso aproximado." };
  if (cidade.length < 2) return { ok: false, mensagem: "Informe a cidade onde você mora." };
  if (cidade.length > LIMITES.cidade) {
    return { ok: false, mensagem: `A cidade passa de ${LIMITES.cidade} caracteres.` };
  }

  return { ok: true, dados: { nome, especie, idade, peso, cidade } };
}
