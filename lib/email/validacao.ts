import "server-only";

// T-024 — OS DOIS EMAILS DA VALIDAÇÃO: aprovado, e reprovado com o motivo.
//
// São os templates `email-templates/05-perfil-aprovado.html` e
// `06-perfil-ajuste.html`, portados para código. Por que não ler o `.html` do
// disco: na Vercel, arquivo fora do grafo de import não tem garantia de estar
// no bundle da função, e email que some em produção sem erro é exatamente o
// defeito que ninguém percebe. O `.html` continua sendo a referência visual.
//
// ⚠️ O QUE MUDOU EM RELAÇÃO AOS TEMPLATES, DE PROPÓSITO:
//   · o aprovado dizia "tutores podem encontrar você na busca". A busca é a
//     F4 e não existe hoje: a frase agora diz o que é verdade (o painel está
//     liberado) e o que ainda vai acontecer (a busca, quando abrir).
//   · "tutores" e "clínicas" viraram "responsáveis" e "estabelecimentos"
//     (nomenclatura legal do projeto). Rótulo de role no banco não muda.
//   · o reprovado passa a trazer O MOTIVO, que é a razão de ele existir
//     (R-051: reprova sem motivo é laço mudo).
//
// ⚠️ ENVIO POR `fetch` NA API HTTP DO RESEND, SEM SDK. A única dependência
// nova autorizada pelo DL-061 é `server-only`; o SDK seria outra, para uma
// chamada POST com JSON.
//
// ⚠️ ESTA FUNÇÃO NUNCA LANÇA. Quem a chama acabou de mudar o status de alguém
// pela RPC, e falha de email não pode desfazer nem esconder essa mudança. Ela
// devolve o que aconteceu e quem chama decide o que dizer ao admin.
//
// ⚠️ NADA DE ENDEREÇO NO LOG. O destinatário é dado pessoal de terceiro; o log
// da Vercel está fora do alcance da rotina de exclusão da F6 (mesmo padrão do
// R-024 e da SEC-056). O log leva o uuid da conta e o código do erro.

export type ResultadoDoEmail = "enviado" | "falhou" | "desligado";

type Entrada = {
  /** uuid da conta, só para o log. Nunca o endereço. */
  contaId: string;
  para: string;
  nome: string | null;
  decisao: "aprovado" | "reprovado";
  motivo: string | null;
};

const REMETENTE = "Vetria <contato@vetriabrasil.com.br>";
const RESPONDER_PARA = "contato@vetriabrasil.com.br";
const SITE = "https://vetriabrasil.com.br";

/** Tempo máximo esperando o Resend. A Server Action segura o admin na tela
 *  enquanto isto roda, e o status JÁ mudou: não vale travar a tela por um
 *  provedor lento. */
export const TEMPO_LIMITE_MS = 8000;

export async function enviarEmailDeValidacao(
  entrada: Entrada
): Promise<ResultadoDoEmail> {
  const chave = process.env.RESEND_API_KEY;

  // Sem chave, o email está DESLIGADO, e isso é estado, não erro: a decisão
  // do admin vale do mesmo jeito. A tela diz ao admin que o email não saiu.
  if (!chave) {
    console.warn("[email/validacao] RESEND_API_KEY ausente, email não enviado", {
      contaId: entrada.contaId,
      decisao: entrada.decisao,
    });
    return "desligado";
  }

  const { assunto, html, texto } =
    entrada.decisao === "aprovado"
      ? montarAprovado(entrada.nome)
      : montarReprovado(entrada.nome, entrada.motivo ?? "");

  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMETENTE,
        to: [entrada.para],
        reply_to: RESPONDER_PARA,
        subject: assunto,
        html,
        text: texto,
      }),
      cache: "no-store",
      signal: controle.signal,
    });

    if (!resposta.ok) {
      // O corpo do erro do Resend pode ecoar o destinatário. Só o status HTTP
      // e o `name` do erro vão para o log.
      const corpo = (await resposta.json().catch(() => ({}))) as {
        name?: string;
      };
      console.error("[email/validacao] Resend recusou", {
        contaId: entrada.contaId,
        decisao: entrada.decisao,
        status: resposta.status,
        erro: corpo.name,
      });
      return "falhou";
    }

    console.log("[email/validacao] enviado", {
      contaId: entrada.contaId,
      decisao: entrada.decisao,
    });
    return "enviado";
  } catch (e) {
    console.error("[email/validacao] falha de rede ou tempo esgotado", {
      contaId: entrada.contaId,
      decisao: entrada.decisao,
      erro: e instanceof Error ? e.name : "desconhecido",
    });
    return "falhou";
  } finally {
    clearTimeout(relogio);
  }
}

// ---------------------------------------------------------------------------
// CONTEÚDO
// ---------------------------------------------------------------------------

/** O motivo é texto escrito pelo admin e o nome é texto escrito pelo dono da
 *  conta. Os dois entram no HTML ESCAPADOS, sempre. */
function escapar(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function saudacao(nome: string | null): string {
  const limpo = (nome ?? "").trim();
  return limpo ? `Olá, ${limpo}` : "Olá";
}

function montarAprovado(nome: string | null) {
  const assunto = "Seu cadastro foi aprovado na Vetria";
  const abertura = saudacao(nome);

  const texto = [
    `${abertura}!`,
    "",
    "Validamos seu cadastro e sua conta está ativa na Vetria. O painel completo já está liberado para você.",
    "Quando a busca da Vetria abrir ao público, é por ela que os responsáveis vão encontrar o seu perfil.",
    "",
    `Entrar no painel: ${SITE}/app`,
    "",
    "Qualquer dúvida, é só responder este email ou escrever para contato@vetriabrasil.com.br.",
  ].join("\n");

  const html = layout({
    preheader: "Seu cadastro foi validado e o painel está liberado.",
    titulo: `${escapar(abertura)}!`,
    paragrafos: [
      "Validamos seu cadastro e sua conta está ativa na Vetria. O painel completo já está liberado para você.",
      "Quando a busca da Vetria abrir ao público, é por ela que os responsáveis vão encontrar o seu perfil.",
    ],
    botao: { rotulo: "Entrar no painel", href: `${SITE}/app` },
    faixa: {
      fundo: "#EAFAF5",
      cor: "#1E4349",
      html: "<strong>Dica:</strong> perfis completos, com bio e especialidades, ajudam o responsável a escolher.",
    },
  });

  return { assunto, html, texto };
}

function montarReprovado(nome: string | null, motivo: string) {
  const assunto = "Seu cadastro na Vetria precisa de um ajuste";
  const abertura = saudacao(nome);

  const texto = [
    `${abertura},`,
    "",
    "Analisamos seu cadastro na Vetria e ele precisa de um ajuste antes de ser aprovado.",
    "",
    "O que a equipe apontou:",
    motivo,
    "",
    "Entre na sua conta, corrija o que foi apontado e conclua o cadastro de novo. Ele volta para a fila de validação.",
    "",
    `Revisar meu cadastro: ${SITE}/app`,
    "",
    "Qualquer dúvida, é só responder este email ou escrever para contato@vetriabrasil.com.br.",
  ].join("\n");

  // `white-space:pre-line` preserva as quebras de linha que o admin digitou,
  // sem transformar o motivo em HTML: ele entra escapado.
  const blocoMotivo =
    `<strong style="display:block; margin:0 0 6px 0; color:#1A1A1A;">O que a equipe apontou</strong>` +
    `<span style="white-space:pre-line;">${escapar(motivo)}</span>`;

  const html = layout({
    preheader: "Seu cadastro precisa de um ajuste antes de ser aprovado.",
    titulo: `${escapar(abertura)},`,
    paragrafos: [
      "Analisamos seu cadastro na Vetria e ele precisa de um ajuste antes de ser aprovado.",
    ],
    destaque: blocoMotivo,
    paragrafosDepois: [
      "Entre na sua conta, corrija o que foi apontado e conclua o cadastro de novo. Ele volta para a fila de validação.",
    ],
    botao: { rotulo: "Revisar meu cadastro", href: `${SITE}/app` },
    faixa: {
      fundo: "#F5F0E1",
      cor: "#4A6064",
      html:
        'Qualquer dúvida, é só responder este email ou falar com a gente em <a href="mailto:contato@vetriabrasil.com.br" style="color:#1E4349; font-weight:600; text-decoration:underline;">contato@vetriabrasil.com.br</a>.',
    },
  });

  return { assunto, html, texto };
}

// ---------------------------------------------------------------------------
// O ESQUELETO, igual ao dos templates versionados (tabelas + CSS inline)
// ---------------------------------------------------------------------------

const FONTE = "'Inter',Arial,Helvetica,sans-serif";

type Layout = {
  preheader: string;
  /** Já escapado por quem chama. */
  titulo: string;
  /** Texto fixo, escrito aqui. Nunca dado de usuário. */
  paragrafos: string[];
  /** HTML montado aqui, com o dado de usuário já escapado. */
  destaque?: string;
  paragrafosDepois?: string[];
  botao: { rotulo: string; href: string };
  faixa: { fundo: string; cor: string; html: string };
};

function paragrafo(t: string): string {
  return `<p style="margin:0 0 16px 0; font-family:${FONTE}; font-size:16px; line-height:26px; color:#4A6064;">${t}</p>`;
}

function layout(l: Layout): string {
  const destaque = l.destaque
    ? `<tr><td class="px" style="padding:0 48px 16px 48px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFF7E6; border:1px solid #F1D9A6; border-radius:14px;">
          <tr><td style="padding:18px 20px; font-family:${FONTE}; font-size:15px; line-height:24px; color:#4A6064;">${l.destaque}</td></tr>
        </table>
      </td></tr>`
    : "";

  const depois = (l.paragrafosDepois ?? []).length
    ? `<tr><td class="px" style="padding:0 48px 0 48px;">${(l.paragrafosDepois ?? []).map(paragrafo).join("")}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<style>
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 24px !important; padding-right: 24px !important; }
    .btn-a { display: block !important; }
  }
  a { color: #1E4349; }
</style>
</head>
<body style="margin:0; padding:0; background-color:#FAF6EC;">
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#FAF6EC; opacity:0;">${l.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAF6EC;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#FFFFFF; border-radius:20px; overflow:hidden;">
  <tr><td class="px" align="left" style="padding:36px 48px 0 48px;">
    <img src="${SITE}/vetria/logo-square.png" width="48" alt="Vetria" style="display:block; border:0; height:auto; border-radius:50%;">
  </td></tr>
  <tr><td class="px" style="padding:28px 48px 8px 48px;">
    <h1 style="margin:0 0 16px 0; font-family:${FONTE}; font-size:28px; line-height:34px; font-weight:700; letter-spacing:-0.02em; color:#1A1A1A;">${l.titulo}</h1>
    ${l.paragrafos.map(paragrafo).join("")}
  </td></tr>
  ${destaque}
  ${depois}
  <tr><td class="px" align="left" style="padding:12px 48px 8px 48px;">
    <a class="btn-a" href="${l.botao.href}" target="_blank" style="background-color:#1E4349; border-radius:999px; color:#FFFFFF; display:inline-block; font-family:${FONTE}; font-size:15px; font-weight:600; line-height:52px; text-align:center; text-decoration:none; width:240px;">${l.botao.rotulo}</a>
  </td></tr>
  <tr><td class="px" style="padding:20px 48px 36px 48px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${l.faixa.fundo}; border-radius:14px;">
      <tr><td style="padding:18px 20px;">
        <p style="margin:0; font-family:${FONTE}; font-size:14px; line-height:22px; color:${l.faixa.cor};">${l.faixa.html}</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background-color:#F5F0E1; padding:0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td class="px" align="center" style="padding:32px 48px;">
        <img src="${SITE}/vetria/logo-email.png" width="132" alt="Vetria" style="display:inline-block; border:0; height:auto; margin:0 0 10px 0;">
        <p style="margin:0 0 14px 0; font-family:${FONTE}; font-size:14px; line-height:20px; color:#4A6064;">Veterinários e estabelecimentos de confiança.</p>
        <p style="margin:0 0 14px 0; font-family:${FONTE}; font-size:14px; line-height:20px; color:#4A6064;">
          <a href="mailto:contato@vetriabrasil.com.br" style="color:#1E4349; text-decoration:none;">contato@vetriabrasil.com.br</a>
          &nbsp;·&nbsp;
          <a href="${SITE}" target="_blank" style="color:#1E4349; text-decoration:none;">vetriabrasil.com.br</a>
        </p>
        <p style="margin:0 0 8px 0; font-family:${FONTE}; font-size:12px; line-height:18px; color:#8FA0A2;">Este é um email automático sobre a validação do seu cadastro.</p>
        <p style="margin:0; font-family:${FONTE}; font-size:12px; line-height:18px; color:#8FA0A2;">© 2026 Vetria. Todos os direitos reservados.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
