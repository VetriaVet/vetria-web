// Campos do onboarding do veterinário — módulo compartilhado entre o Client
// Form (que desenha) e a Server Action (que valida e grava).
//
// Por que existe: `titulo`, `experiencia`, `crmv_uf`, `estado` e
// `especialidades` são FACETAS DE BUSCA (F4/S6) e vivem em `vet_profiles`,
// que é tabela de leitura pública. Se a lista de valores só existir no
// cliente, o servidor aceita qualquer string e a busca herda lixo. A lista
// mora aqui, e a Server Action valida contra ela.
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
