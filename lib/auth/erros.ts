// Tradução dos erros do Supabase Auth para português (T-034). Lugar único:
// nenhuma tela de autenticação mostra `error.message` cru.
//
// Ordem: primeiro o `code` (AuthApiError.code, estável entre versões), depois
// a mensagem em inglês como rede de segurança (versões antigas do GoTrue e
// erros sem code). O fallback NUNCA esconde que deu erro: diz que não foi
// possível e pede nova tentativa. O erro original vai pro console, pra quem
// for investigar.

import { SENHA_AJUDA } from "./senha";

type ErroAuth = {
  code?: string | null;
  message?: string | null;
  status?: number | null;
  name?: string | null;
};

const SENHA_FRACA = `Essa senha não é aceita. ${SENHA_AJUDA}`;
const SENHA_VAZADA =
  "Essa senha aparece em listas de senhas vazadas na internet. Escolha outra.";
const EMAIL_JA_CADASTRADO =
  "Já existe uma conta com este email. Entre pelo login ou use \"Esqueceu sua senha?\".";
const CREDENCIAIS = "Email ou senha incorretos. Confira e tente de novo.";
const EMAIL_NAO_CONFIRMADO =
  "Seu email ainda não foi confirmado. Abra o link que enviamos no cadastro (confira também o spam).";
const LIMITE_EMAIL =
  "Enviamos muitos emails em pouco tempo. Aguarde alguns minutos e tente de novo.";
const LIMITE_TENTATIVAS =
  "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
const FALHA_ENVIO_EMAIL =
  "Não conseguimos enviar o email agora. Tente de novo em alguns minutos.";
const LINK_EXPIRADO =
  "Este link expirou ou já foi usado. Peça um novo para continuar.";
const MESMA_SENHA = "A nova senha precisa ser diferente da senha atual.";
const SESSAO_EXPIRADA =
  "Sua sessão expirou. Peça um novo link de recuperação para trocar a senha.";
const EMAIL_INVALIDO = "Esse email não parece válido. Confira se digitou certo.";
const CADASTRO_FECHADO = "Os cadastros estão fechados no momento.";
const CONTA_BLOQUEADA = "Esta conta está bloqueada. Fale com a equipe da Vetria.";
const VERIFICACAO_ROBO =
  "Não conseguimos confirmar a verificação de segurança. Recarregue a página e tente de novo.";
const SEM_CONEXAO =
  "Não conseguimos falar com a Vetria agora. Confira sua internet e tente de novo.";
export const ERRO_GENERICO =
  "Não foi possível concluir agora. Tente de novo em instantes.";

const POR_CODIGO: Record<string, string> = {
  weak_password: SENHA_FRACA,
  user_already_exists: EMAIL_JA_CADASTRADO,
  email_exists: EMAIL_JA_CADASTRADO,
  identity_already_exists: EMAIL_JA_CADASTRADO,
  invalid_credentials: CREDENCIAIS,
  email_not_confirmed: EMAIL_NAO_CONFIRMADO,
  provider_email_needs_verification: EMAIL_NAO_CONFIRMADO,
  over_email_send_rate_limit: LIMITE_EMAIL,
  over_request_rate_limit: LIMITE_TENTATIVAS,
  otp_expired: LINK_EXPIRADO,
  flow_state_expired: LINK_EXPIRADO,
  flow_state_not_found: LINK_EXPIRADO,
  bad_code_verifier: LINK_EXPIRADO,
  same_password: MESMA_SENHA,
  session_not_found: SESSAO_EXPIRADA,
  session_expired: SESSAO_EXPIRADA,
  reauthentication_needed: SESSAO_EXPIRADA,
  email_address_invalid: EMAIL_INVALIDO,
  email_address_not_authorized: FALHA_ENVIO_EMAIL,
  signup_disabled: CADASTRO_FECHADO,
  email_provider_disabled: CADASTRO_FECHADO,
  user_banned: CONTA_BLOQUEADA,
  captcha_failed: VERIFICACAO_ROBO,
  request_timeout: SEM_CONEXAO,
};

/** Traduz qualquer erro do Supabase Auth para uma frase em português. */
export function traduzirErroAuth(erro: ErroAuth | null | undefined): string {
  if (!erro) return ERRO_GENERICO;
  console.error("[auth]", {
    code: erro.code ?? null,
    status: erro.status ?? null,
    message: erro.message ?? null,
  });

  const msg = (erro.message ?? "").toLowerCase();
  const code = erro.code ?? "";

  // weak_password tem dois motivos: regra de caracteres ou senha vazada.
  if (code === "weak_password" || msg.includes("password should") || msg.includes("password is known")) {
    if (msg.includes("known") || msg.includes("pwned") || msg.includes("leaked")) return SENHA_VAZADA;
    return SENHA_FRACA;
  }

  if (code && POR_CODIGO[code]) return POR_CODIGO[code];

  // Rede de segurança pela mensagem.
  if (msg.includes("invalid login credentials")) return CREDENCIAIS;
  if (msg.includes("email not confirmed")) return EMAIL_NAO_CONFIRMADO;
  if (msg.includes("already registered") || msg.includes("already exists")) return EMAIL_JA_CADASTRADO;
  if (msg.includes("error sending") || msg.includes("sending email")) return FALHA_ENVIO_EMAIL;
  if (msg.includes("email rate limit")) return LIMITE_EMAIL;
  if (msg.includes("rate limit") || msg.includes("too many") || msg.includes("for security purposes")) return LIMITE_TENTATIVAS;
  if (msg.includes("expired") || msg.includes("invalid flow state") || msg.includes("code verifier")) return LINK_EXPIRADO;
  if (msg.includes("different from the old password")) return MESMA_SENHA;
  if (msg.includes("auth session missing")) return SESSAO_EXPIRADA;
  if (msg.includes("invalid format") || msg.includes("unable to validate email")) return EMAIL_INVALIDO;
  if (msg.includes("signups not allowed")) return CADASTRO_FECHADO;
  if (msg.includes("failed to fetch") || msg.includes("network") || erro.status === 0) return SEM_CONEXAO;
  if (erro.status === 429) return LIMITE_TENTATIVAS;

  return ERRO_GENERICO;
}

/** Códigos que o /auth/callback coloca em /login?msg=... */
export function traduzirMsgDoCallback(msg: string | null): string | null {
  if (msg === "auth_error") return LINK_EXPIRADO;
  if (msg === "missing_code")
    return "O link está incompleto. Abra de novo o link do email ou entre com sua senha.";
  return null;
}
