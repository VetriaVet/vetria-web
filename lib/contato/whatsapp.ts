// O WhatsApp normalizado para dígitos, num lugar só.
//
// ⚠️ POR QUE ESTE ARQUIVO EXISTE, e vale ler antes de mexer.
//
// R-041 / SEC-062 pedia normalização nos DOIS onboardings. A T-007 escreveu a
// função dentro de `estabelecimento/onboarding/actions.ts` e o veterinário
// ficou sem — e ninguém percebeu, porque não havia teste e porque os dois
// arquivos são gêmeos que ninguém lê lado a lado.
//
// O defeito só apareceu em 20/09/2026, na prova em tela do Elber: a mesma
// consulta devolveu `62992653278` para o estabelecimento e `62 992653278`,
// COM ESPAÇO, para o veterinário. Dois formatos para o mesmo número, na mesma
// coluna, escritos por dois caminhos que deveriam ser idênticos.
//
// É o R-017 de novo: clone herda defeito com a mesma facilidade com que herda
// correção. A lição não é "copiar com mais cuidado", é **não copiar**. Por isso
// a função saiu dos dois arquivos e mora aqui.
//
// ⚠️ CONTRATO DO QUE FICA GRAVADO, para quem escrever a rota de contato da F4:
// dígitos, DDD + número, SEM o código do país. O `55` é acrescentado por quem
// monta o `wa.me`, não por quem grava. Guardar sem o `55` é o que faz o campo
// reabrir legível na tela do próprio dono.
//
// Pelo DL-047 é este valor que o servidor devolve no evento de contato e que
// conta como lead entregue. Normalizar depois de existir base gravada em três
// formatos custa muito mais do que normalizar na escrita.
//
// O que isto NÃO é: verificação de posse. Ninguém confirmou que o número é de
// quem o digitou. Código por SMS está fora dos 3 meses.

export type WhatsappNormalizado =
  | { ok: true; valor: string }
  | { ok: false; motivo: string };

export function normalizarWhatsapp(
  bruto: string,
  passo = "Passo 3"
): WhatsappNormalizado {
  let d = bruto.replace(/\D+/g, "");

  // `+55 63 ...` e `55 63 ...` chegam com o código do país colado.
  //
  // ⚠️ O corte só acontece com 12 ou 13 dígitos, e isso é de propósito: o DDD
  // 55 é de Santa Maria/RS. `55999999999` tem 11 dígitos e passa inteiro, sem
  // ser mutilado.
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) {
    d = d.slice(2);
  }

  if (d.startsWith("0")) {
    return {
      ok: false,
      motivo: `${passo}: o WhatsApp precisa ser um número com DDD. Números 0800 e 0300 não recebem mensagem no WhatsApp.`,
    };
  }

  if (d.length !== 10 && d.length !== 11) {
    return {
      ok: false,
      motivo: `${passo}: informe o WhatsApp com DDD, no formato (00) 00000-0000. Só o número, sem ramal.`,
    };
  }

  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { ok: false, motivo: `${passo}: o DDD do WhatsApp não é válido.` };
  }

  return { ok: true, valor: d };
}
