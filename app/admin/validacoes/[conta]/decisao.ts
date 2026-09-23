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
