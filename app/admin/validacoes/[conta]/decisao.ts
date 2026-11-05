// T-024 — o contrato entre o formulário de decisão e a Server Action.
//
// Arquivo separado porque um módulo `"use server"` só pode exportar funções
// assíncronas: constante e tipo compartilhados com o Client Component moram
// aqui. Os limites valem nos dois lados, e O QUE VALE é o do servidor; o do
// formulário é conveniência (contador e botão desabilitado).

export type Decisao = "aprovar" | "reprovar";

export type ResultadoDecisao = { ok: false; mensagem: string };

/** Motivo curto demais ("não", "x") é o laço mudo do R-051 com outra roupa. */
export const MOTIVO_MINIMO = 10;
export const MOTIVO_MAXIMO = 1000;

/** T-066 / DL-080 item 4: a frase da recusa, a mesma na tela e na Action. */
export const APROVAR_SEM_WHATSAPP =
  "Esta conta não pode ser aprovada: falta um WhatsApp com DDD no cadastro. Sem ele, quem encontra o perfil na busca não consegue chamar. Reprove pedindo o número: a pessoa volta ao cadastro, informa o WhatsApp e envia de novo.";

/** O motivo pronto para a reprova por falta de WhatsApp. O admin pode editar. */
export const MOTIVO_SUGERIDO_SEM_WHATSAPP =
  "Falta o WhatsApp com DDD no seu cadastro. É por ele que os responsáveis falam com você. Informe o número e envie o cadastro de novo.";
