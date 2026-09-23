// Campos do onboarding do veterinário — módulo compartilhado entre o Client
// Form (que desenha) e a Server Action (que valida e grava).
//
// Por que existe: `titulo`, `experiencia`, `crmv_uf`, `estado` e
// `especialidades` são FACETAS DE BUSCA (F4/S6) e vivem em `vet_profiles`,
// que é tabela de leitura pública. Se a lista de valores só existir no
// cliente, o servidor aceita qualquer string e a busca herda lixo. A lista
// mora aqui, e a Server Action valida contra ela.
//
// ⚠️ T-027 / R-039 — A ACTION NÃO É O ÚNICO ESCRITOR, E ESTA LISTA NÃO É A
// ÚLTIMA LINHA. O dono alcança `vet_profiles` por PATCH direto no PostgREST
// (medido em 23/09: `estado='ZZ'` gravado). Desde a `0004` o banco tem CHECK
// com a MESMA regra de cada lista abaixo, e é o CHECK que vale:
//   UFS          → vet_profiles_crmv_uf_valida, vet_profiles_estado_valido
//   TITULOS      → vet_profiles_titulo_lista
//   EXPERIENCIA  → vet_profiles_experiencia_lista
//   CRMV_NUMERO  → vet_profiles_crmv_formato
//   LIMITES      → vet_profiles_textos_teto (nome, cidade, bairro, bio)
//   MAX_ESPECIALIDADES → vet_profiles_especialidades_teto
// MUDOU AQUI, MUDA LÁ (migration nova, 🔴), e vice-versa. Se esta lista
// crescer sozinha, a pessoa preenche certo e o banco recusa com um 23514.
//   ESPECIALIDADES → tabela `public.especialidades` (0005, T-028, DL-068): o
//                    seed é CÓPIA desta lista, na mesma ordem, e o trigger
//                    `trg_vet_profiles_especialidades_da_lista` recusa item
//                    que não esteja na tabela. Item novo = migration + esta
//                    linha, no mesmo commit. Esta lista continua sendo a fonte
//                    da TELA até a busca (S6) ler a tabela.
//
// ⚠️ Não confundir com os campos do estabelecimento (T-007): `cnpj`,
// `razao_social` e `responsavel_tecnico` são dados de `clinic` e a guarda
// `trg_perfil_privado_dado_de_estabelecimento` (SEC-044) levanta exceção se
// aparecerem numa linha de conta `vet`. Este arquivo não os menciona de
// propósito, e o payload do vet não deve ganhar spread de objeto genérico
// compartilhado com o do estabelecimento.

export const STEPS = [
  { n: 1, title: "Dados profissionais", desc: "CRMV, especialidades" },
  { n: 2, title: "Localização & atendimento", desc: "Cidade, modos" },
  { n: 3, title: "Perfil público", desc: "Foto, bio, contato" },
  { n: 4, title: "Validação", desc: "Documentos do CRMV" },
] as const;

type Opcao = { value: string; label: string };

export const TITULOS: Opcao[] = [
  { value: "mv", label: "Médico(a) Veterinário(a)" },
  { value: "dr", label: "Doutor(a) em Veterinária" },
  { value: "me", label: "Mestre em Veterinária" },
  { value: "esp", label: "Especialista" },
];

export const EXPERIENCIA: Opcao[] = [
  { value: "lt1", label: "Menos de 1 ano" },
  { value: "1a3", label: "1 a 3 anos" },
  { value: "3a5", label: "3 a 5 anos" },
  { value: "5a10", label: "5 a 10 anos" },
  { value: "gt10", label: "Mais de 10 anos" },
];

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;

export const ESTADOS: Opcao[] = UFS.map((uf) => ({ value: uf, label: uf }));

export const ESPECIALIDADES = [
  "Clínica geral", "Cardiologia", "Dermatologia", "Oftalmologia",
  "Ortopedia", "Cirurgia", "Anestesiologia", "Oncologia",
  "Animais exóticos", "Felinos", "Equinos", "Comportamento",
] as const;

// A tela do passo 1 promete "1 principal e até 3 secundárias".
export const MAX_ESPECIALIDADES = 4;

// ⚠️ R-059 — o NÚMERO do CRMV: só algarismos, de 1 a 6. A UF tem campo
// próprio. É a MESMA regra do CHECK `vet_profiles_crmv_formato` da `0004`:
// '^[0-9]{1,6}$'. A fila mostrou em 23/09 "CRMV-AL GO-0155": a sigla de uma
// UF dentro do número e outra UF no campo da UF. Cada campo, sozinho, tinha
// passado pela validação que existia.
export const CRMV_NUMERO = /^[0-9]{1,6}$/;

/**
 * Normaliza o que a pessoa digitou no campo do número do CRMV e confere com
 * `CRMV_NUMERO`. Tira espaço e ponto de milhar ("12.345", "12 345"), porque
 * são formatação e não informação. NÃO tira letra nem hífen: "GO-0155" é a
 * sigla de uma UF dentro do número, e quem decide qual UF vale é a pessoa,
 * no campo ao lado, não o servidor adivinhando.
 */
export function normalizarCrmv(
  bruto: string
): { ok: true; valor: string } | { ok: false; motivo: string } {
  const valor = bruto.replace(/[\s.]+/g, "");
  if (!CRMV_NUMERO.test(valor)) {
    return {
      ok: false,
      motivo:
        "Passo 1: o número do CRMV tem só algarismos, até 6, sem a sigla do estado. O estado vai no campo ao lado. Exemplo: 12345.",
    };
  }
  return { ok: true, valor };
}

export const LIMITES = {
  nome: 120,
  crmv: 20,
  cidade: 80,
  bairro: 200,
  bio: 500,
  whatsapp: 24,
} as const;

// O que o Client Form manda pro servidor. Tudo string ou boolean: precisa ser
// serializável pra atravessar a fronteira da Server Action.
export type VetOnboardingPayload = {
  nome: string;
  titulo: string;
  crmv: string;
  crmvUf: string;
  especialidades: string[];
  experiencia: string;
  cidade: string;
  estado: string;
  bairro: string;
  atendePresencial: boolean;
  atendeDomiciliar: boolean;
  atendeTeleorientacao: boolean;
  bio: string;
  whatsapp: string;
};

// O que a página lê do banco e devolve pro formulário, pra ele abrir
// preenchido em vez de apagar o que a pessoa já tinha gravado.
export type VetOnboardingInicial = VetOnboardingPayload;

export const VAZIO: VetOnboardingInicial = {
  nome: "",
  titulo: "",
  crmv: "",
  crmvUf: "",
  especialidades: [],
  experiencia: "",
  cidade: "",
  estado: "",
  bairro: "",
  atendePresencial: false,
  atendeDomiciliar: false,
  atendeTeleorientacao: false,
  bio: "",
  whatsapp: "",
};

// A Server Action devolve erro como VALOR, nunca como exceção: o cliente
// precisa mostrar a mensagem na tela, e envolver a chamada em try/catch
// engoliria o NEXT_REDIRECT do caminho de sucesso (DL-016).
export type ResultadoOnboarding = { ok: false; mensagem: string };
