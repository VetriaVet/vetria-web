// Campos do onboarding do estabelecimento — módulo compartilhado entre o Client
// Form (que desenha) e a Server Action (que valida e grava).
//
// Gêmeo de `app/app/veterinario/onboarding/campos.ts`, e gêmeo de propósito:
// `estado`, `cidade` e `servicos` são FACETAS DE BUSCA (F4/S6) e vivem em
// `clinic_profiles`, que é tabela de leitura pública. Lista que só existe no
// cliente é lista que o servidor não aplica.
//
// ⚠️ R-039 / SEC-060 — esta lista NÃO é a última linha de defesa.
// A policy `clinic_profiles_update_own` pina só `id` e `slug`: o dono alcança
// as mesmas colunas por PATCH direto no PostgREST, com a anon key que está no
// bundle. Desde a `0004` (T-027, que absorveu a T-017) o banco tem CHECK com a
// MESMA regra, e é o CHECK que vale:
//   UFS           → clinic_profiles_estado_valido
//   LIMITES       → clinic_profiles_textos_teto (nome fantasia, endereço,
//                   cidade, sobre) e clinic_profiles_cep_formato (8 dígitos)
//   MAX_SERVICOS  → clinic_profiles_servicos_teto
//   (site)        → clinic_profiles_site_http
// MUDOU AQUI, MUDA LÁ (migration nova, 🔴). A pertença de `servicos` à lista
// é da T-028 (tabela de apoio).
//
// ⚠️ DOIS PAYLOADS SEPARADOS, e continua sendo assim.
// `cnpj`, `razao_social` e `responsavel_tecnico` são dados de `clinic` e a
// guarda `trg_perfil_privado_dado_de_estabelecimento` (SEC-044) levanta exceção
// se aparecerem na linha de uma conta `vet`. Nunca compartilhe objeto genérico
// entre este payload e o do veterinário.
//
// ⚠️ `site` NÃO está aqui, e isso é decisão registrada da T-007.
// A coluna `clinic_profiles.site` existe e a `0003:1301` a declara "PÚBLICA por
// decisão. É vitrine". O formulário nunca teve campo para ela, e a T-007 optou
// por NÃO criar o campo: a coluna vira link em página pública na F4/S7 e hoje
// aceitava `javascript:` e `data:` sem nenhuma validação de esquema. Desde a
// `0004` o banco recusa (CHECK `clinic_profiles_site_http`: só http/https,
// host não vazio). Quem for acrescentar o campo: validar o esquema NO SERVIDOR
// com a mesma regra, antes de gravar, para a pessoa ouvir o erro em português
// e não um 23514.

export const STEPS = [
  { n: 1, title: "Dados do estabelecimento", desc: "Razão social, CNPJ" },
  { n: 2, title: "Localização", desc: "Endereço e cidade" },
  { n: 3, title: "Perfil público", desc: "Sobre, serviços, contato" },
  { n: 4, title: "Validação", desc: "Documentos" },
] as const;

type Opcao = { value: string; label: string };

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;

export const ESTADOS: Opcao[] = UFS.map((uf) => ({ value: uf, label: uf }));

export const SERVICOS = [
  "Emergência 24h", "Internação", "Centro cirúrgico", "Laboratório",
  "Diagnóstico por imagem", "Vacinação", "Banho & tosa", "Pet shop", "Farmácia",
] as const;

// Teto do array, aplicado ANTES de qualquer varredura (mesma correção SEC-058
// do onboarding do veterinário). Aqui a lista inteira é aceitável, então o teto
// é o tamanho dela.
export const MAX_SERVICOS = SERVICOS.length;

export const LIMITES = {
  nomeFantasia: 120,
  razaoSocial: 160,
  cnpj: 18,
  responsavelTecnico: 120,
  endereco: 200,
  cep: 12,
  cidade: 80,
  sobre: 600,
  whatsapp: 24,
} as const;

// O que o Client Form manda pro servidor. Tudo string ou string[]: precisa ser
// serializável pra atravessar a fronteira da Server Action.
export type ClinicOnboardingPayload = {
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  responsavelTecnico: string;
  endereco: string;
  cep: string;
  cidade: string;
  estado: string;
  sobre: string;
  servicos: string[];
  whatsapp: string;
};

// O que a página lê do banco e devolve pro formulário, pra ele abrir preenchido
// em vez de apagar o que a pessoa já tinha gravado.
export type ClinicOnboardingInicial = ClinicOnboardingPayload;

export const VAZIO: ClinicOnboardingInicial = {
  nomeFantasia: "",
  razaoSocial: "",
  cnpj: "",
  responsavelTecnico: "",
  endereco: "",
  cep: "",
  cidade: "",
  estado: "",
  sobre: "",
  servicos: [],
  whatsapp: "",
};

// A Server Action devolve erro como VALOR, nunca como exceção: o cliente
// precisa mostrar a mensagem na tela, e envolver a chamada em try/catch
// engoliria o NEXT_REDIRECT do caminho de sucesso (DL-016).
export type ResultadoOnboarding = { ok: false; mensagem: string };
