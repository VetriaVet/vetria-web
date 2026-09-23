// T-035 — AS MÁSCARAS DE CAMPO, NUM LUGAR SÓ.
//
// Cada máscara tem três partes, e a separação é o ponto:
//   · `limpar`   o que a pessoa digitou → o VALOR que vai para o servidor
//                (só dígitos onde o banco pede dígitos);
//   · `formatar` o valor limpo → o que aparece no campo ("(62) 99265-3278");
//   · `validar`  o valor limpo → mensagem em português, ou null se está certo.
//
// ⚠️ ISTO É CONVENIÊNCIA DE TELA, NÃO REGRA. A regra que vale é a da Server
// Action e a do CHECK do banco (0004). A máscara existe para a pessoa não
// errar, e nunca pode ser MAIS FROUXA que o servidor: se aceitar aqui algo que
// a Action recusa, a pessoa só descobre no passo 4. Pode ser mais estrita onde
// o erro é certo (dígito verificador, DDD que não existe).
//
// ⚠️ A máscara é só visual. O valor enviado continua no formato que a Action
// espera: CRMV com 1 a 6 dígitos (zero à esquerda preservado), CEP com 8
// dígitos, WhatsApp e telefone com DDD + número sem o 55, CNPJ com 14
// caracteres sem pontuação.
//
// Módulo puro, sem React e sem dependência: roda no cliente e no servidor.

export type NomeMascara =
  | "cpf"
  | "cnpj"
  | "crmv"
  | "telefone"
  | "cep"
  | "email"
  | "site";

export type Mascara = {
  /** Texto digitado ou colado → valor que vai para o servidor. */
  limpar: (texto: string) => string;
  /** Valor limpo → texto que aparece no campo. */
  formatar: (valor: string) => string;
  /** Valor limpo → mensagem de erro em português, ou null. Vazio é null:
   *  campo obrigatório é decisão de quem usa, não da máscara. */
  validar: (valor: string) => string | null;
  /** Caractere que conta como informação (o resto é pontuação da máscara).
   *  Usado para manter o cursor no lugar enquanto a pontuação aparece. */
  significativo: RegExp;
  /** Tratamento extra do texto COLADO antes de entrar no campo. */
  aoColar?: (texto: string) => string;
  inputMode: "numeric" | "tel" | "email" | "url" | "text";
  type: "text" | "tel";
  autoComplete: string;
  /** Tamanho máximo do texto JÁ FORMATADO. */
  maxLength: number;
  placeholder: string;
};

export const somenteDigitos = (s: string) => s.replace(/\D+/g, "");

function todosIguais(s: string) {
  return /^(.)\1*$/.test(s);
}

// ---------------------------------------------------------------------------
// CPF: 000.000.000-00, com dígito verificador
// ---------------------------------------------------------------------------

export function cpfValido(d: string): boolean {
  if (!/^\d{11}$/.test(d) || todosIguais(d)) return false;
  const dv = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(d.slice(0, 9), 10) === Number(d[9]) && dv(d.slice(0, 10), 11) === Number(d[10]);
}

const cpf: Mascara = {
  limpar: (t) => somenteDigitos(t).slice(0, 11),
  formatar: (v) => {
    const d = somenteDigitos(v).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  },
  validar: (v) => {
    if (!v) return null;
    if (v.length !== 11) return "O CPF tem 11 números. Confira se faltou algum.";
    if (!cpfValido(v)) return "Esse CPF não existe. Confira os números.";
    return null;
  },
  significativo: /\d/,
  inputMode: "numeric",
  type: "text",
  autoComplete: "off",
  maxLength: 14,
  placeholder: "000.000.000-00",
};

// ---------------------------------------------------------------------------
// CNPJ: 00.000.000/0000-00, com dígito verificador
// ---------------------------------------------------------------------------
// ⚠️ Aceita LETRA nas 12 primeiras posições, como a Action: o CNPJ
// alfanumérico da Receita vale desde julho de 2026 ("12 letras ou números +
// 2 dígitos"). O cálculo do dígito é o mesmo para os dois formatos: cada
// caractere vale (código ASCII − 48), então "0".."9" valem 0..9 e "A" vale 17.
// Recusar letra aqui recusaria um estabelecimento novo e legítimo.

export function cnpjValido(c: string): boolean {
  if (!/^[A-Z0-9]{12}\d{2}$/.test(c) || todosIguais(c)) return false;
  const valor = (ch: string) => ch.charCodeAt(0) - 48;
  const dv = (base: string) => {
    const pesos =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += valor(base[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const dv1 = dv(c.slice(0, 12));
  const dv2 = dv(c.slice(0, 12) + dv1);
  return dv1 === Number(c[12]) && dv2 === Number(c[13]);
}

function limparCnpj(t: string): string {
  const bruto = t.toUpperCase().replace(/[^A-Z0-9]+/g, "");
  // Posições 1 a 12 aceitam letra e número; 13 e 14 são os dígitos.
  let saida = "";
  for (const ch of bruto) {
    if (saida.length >= 14) break;
    if (saida.length >= 12 && !/\d/.test(ch)) continue;
    saida += ch;
  }
  return saida;
}

const cnpj: Mascara = {
  limpar: limparCnpj,
  formatar: (v) => {
    const c = limparCnpj(v);
    if (c.length <= 2) return c;
    if (c.length <= 5) return `${c.slice(0, 2)}.${c.slice(2)}`;
    if (c.length <= 8) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5)}`;
    if (c.length <= 12)
      return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8)}`;
    return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
  },
  validar: (v) => {
    if (!v) return null;
    if (v.length !== 14) return "O CNPJ tem 14 caracteres. Confira se faltou algum.";
    if (!cnpjValido(v)) return "Esse CNPJ não existe. Confira os números.";
    return null;
  },
  significativo: /[0-9A-Za-z]/,
  // Texto e não numérico: o teclado numérico do celular esconde as letras do
  // CNPJ alfanumérico. `autoCapitalize` cuida das maiúsculas.
  inputMode: "text",
  type: "text",
  autoComplete: "off",
  maxLength: 18,
  placeholder: "00.000.000/0000-00",
};

// ---------------------------------------------------------------------------
// CRMV: só o NÚMERO, de 1 a 6 dígitos (R-059, CHECK vet_profiles_crmv_formato)
// ---------------------------------------------------------------------------
// ⚠️ Zero à esquerda é informação: "05107" é um CRMV real e vai assim, como
// texto. Nada aqui converte para número.

const crmv: Mascara = {
  limpar: (t) => somenteDigitos(t).slice(0, 6),
  // Sem pontuação. Não tira nada: um valor antigo com a sigla da UF dentro
  // ("GO-0155") aparece como está, com o erro embaixo, em vez de ser
  // "consertado" em silêncio.
  formatar: (v) => v,
  validar: (v) => {
    if (!v) return null;
    if (!/^\d{1,6}$/.test(v))
      return "Use só os números do CRMV, até 6, sem a sigla do estado. O estado vai no campo ao lado.";
    return null;
  },
  significativo: /\d/,
  inputMode: "numeric",
  type: "text",
  autoComplete: "off",
  maxLength: 6,
  placeholder: "Ex: 12345",
};

// ---------------------------------------------------------------------------
// TELEFONE e WHATSAPP: (00) 00000-0000 ou (00) 0000-0000, com DDD que existe
// ---------------------------------------------------------------------------
// O que vai para o servidor: DDD + número, só dígitos, sem o 55. É o contrato
// de `lib/contato/whatsapp.ts`, e a Action normaliza de novo.

export const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35,
  37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64,
  65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88,
  89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

const telefone: Mascara = {
  limpar: (t) => somenteDigitos(t).slice(0, 11),
  formatar: (v) => {
    const d = somenteDigitos(v).slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  },
  validar: (v) => {
    const d = somenteDigitos(v);
    if (!d) return null;
    if (d.startsWith("0"))
      return "Comece pelo DDD, sem o zero. Números 0800 e 0300 não servem.";
    if (d.length < 10) return "Falta número. Use o DDD e o número, como (62) 99999-9999.";
    if (!DDDS.has(Number(d.slice(0, 2)))) return "Esse DDD não existe. Confira os dois primeiros números.";
    if (d.length === 11 && d[2] !== "9") return "Celular com DDD tem 9 depois do DDD, como (62) 99999-9999.";
    return null;
  },
  significativo: /\d/,
  // "+55 62 99999-9999" colado: o 55 do país sai. Só com 12 ou 13 dígitos,
  // como na Action, porque 55 também é DDD (Santa Maria/RS).
  aoColar: (t) => {
    const d = somenteDigitos(t);
    return (d.length === 12 || d.length === 13) && d.startsWith("55") ? d.slice(2) : t;
  },
  inputMode: "tel",
  type: "tel",
  autoComplete: "tel-national",
  maxLength: 15,
  placeholder: "(00) 00000-0000",
};

// ---------------------------------------------------------------------------
// CEP: 00000-000 (CHECK clinic_profiles_cep_formato: 8 dígitos)
// ---------------------------------------------------------------------------

const cep: Mascara = {
  limpar: (t) => somenteDigitos(t).slice(0, 8),
  formatar: (v) => {
    const d = somenteDigitos(v).slice(0, 8);
    return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
  },
  validar: (v) => {
    const d = somenteDigitos(v);
    if (!d) return null;
    if (d.length !== 8) return "O CEP tem 8 números, como 77000-000.";
    return null;
  },
  significativo: /\d/,
  inputMode: "numeric",
  type: "text",
  autoComplete: "postal-code",
  maxLength: 9,
  placeholder: "00000-000",
};

// ---------------------------------------------------------------------------
// EMAIL: sem espaço, em minúsculas, com formato conferido
// ---------------------------------------------------------------------------

export const EMAIL_FORMATO =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;

const email: Mascara = {
  limpar: (t) => t.replace(/\s+/g, "").toLowerCase().slice(0, 254),
  formatar: (v) => v,
  validar: (v) => {
    if (!v) return null;
    if (!v.includes("@")) return "Falta o @ no email. Exemplo: nome@email.com.br";
    if (!EMAIL_FORMATO.test(v)) return "Esse email não parece completo. Exemplo: nome@email.com.br";
    return null;
  },
  significativo: /\S/,
  inputMode: "email",
  type: "text",
  autoComplete: "email",
  maxLength: 254,
  placeholder: "nome@email.com.br",
};

// ---------------------------------------------------------------------------
// SITE: http ou https (CHECK clinic_profiles_site_http, até 300 caracteres)
// ---------------------------------------------------------------------------
// O campo sugere "https://" ao receber o foco (ver CampoMascarado) e, se a
// pessoa escrever só "www.site.com.br", o prefixo entra ao sair do campo.

export const SITE_PREFIXO = "https://";

const SITE_FORMATO =
  /^https?:\/\/[^\s"<>\\/?#]+\.[^\s"<>\\/?#]+([/?#][^\s"<>\\]*)?$/i;

export function completarSite(v: string): string {
  const t = v.trim();
  if (!t || t === SITE_PREFIXO || t === "http://") return "";
  return /^https?:\/\//i.test(t) ? t : `${SITE_PREFIXO}${t}`;
}

const site: Mascara = {
  limpar: (t) => t.replace(/\s+/g, "").slice(0, 300),
  formatar: (v) => v,
  validar: (v) => {
    if (!v || v === SITE_PREFIXO) return null;
    if (!SITE_FORMATO.test(completarSite(v)))
      return "Esse endereço não parece um site. Exemplo: https://www.seuestabelecimento.com.br";
    return null;
  },
  significativo: /\S/,
  inputMode: "url",
  type: "text",
  autoComplete: "url",
  maxLength: 300,
  placeholder: "https://www.seuestabelecimento.com.br",
};

export const MASCARAS: Record<NomeMascara, Mascara> = {
  cpf,
  cnpj,
  crmv,
  telefone,
  cep,
  email,
  site,
};

/** Atalho para quem precisa só saber se o campo está certo (ex.: travar o
 *  "Continuar" do passo). Vazio é válido: obrigatoriedade é de quem chama. */
export function erroDoCampo(nome: NomeMascara, valor: string): string | null {
  return MASCARAS[nome].validar(valor);
}
