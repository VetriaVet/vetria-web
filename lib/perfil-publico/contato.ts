// A INTERFACE do evento de contato (DL-047, matriz §6). Só os tipos e a
// constante que liga o botão. Este arquivo vai para o navegador (o perfil
// público importa a constante): NADA de servidor aqui.
//
// Quem implementa (T-040, 28/10/2026):
//   · a rota `POST /api/contato` (`app/api/contato/route.ts`), que valida o
//     pedido, cria o cookie `vetria_visitante` no primeiro clique (DL-071 D2)
//     e chama `registrar_contato` da 0006 pelo cliente de serviço;
//   · a função `registrar_contato` (0006, T-039), que grava a linha em
//     `contatos` e SÓ ENTÃO devolve o número, na mesma transação (D1);
//   · `lib/contato/porta.ts`, que diz se a rota está aberta neste servidor.
//
// O que amarra tudo (DL-047):
//   1. O número NUNCA vai no HTML, nem na resposta da busca, nem no perfil.
//      As páginas públicas só conhecem o `AlvoDoContato` abaixo.
//   2. O clique é POST no servidor; o servidor grava em `contatos` e SÓ ENTÃO
//      devolve o número. Sem conta, sem pedir nada antes.
//   3. O número é o de `lib/contato/whatsapp.ts`: dígitos, DDD + número, sem
//      o `55`. Quem monta o `wa.me` acrescenta o `55`.

/** Quem a pessoa quer contatar, pelo endereço público. Nunca por `id`. */
export type AlvoDoContato = {
  /** Role do banco (DL-043): `vet` ou `clinic`. */
  tipo: "vet" | "clinic";
  slug: string;
};

/** De onde o contato veio, para `contatos.origem_*` (a métrica do profissional). */
export type OrigemDoContato = {
  /** `cidades.slug` da busca que levou ao perfil, se houve. */
  cidade: string | null;
  /** `especialidades.slug` ou `servicos.slug`, se houve. */
  especialidade: string | null;
};

export type PedidoDeContato = {
  alvo: AlvoDoContato;
  origem: OrigemDoContato;
  canal: "whatsapp";
};

/** O que o POST da S8 devolve. `whatsapp` só existe DEPOIS do registro gravado. */
export type RespostaDoContato =
  | { ok: true; whatsapp: string }
  | {
      ok: false;
      motivo:
        | "nao_encontrado" //   slug inexistente ou conta que saiu do ar
        | "sem_whatsapp" //     o profissional não informou número
        | "muitas_tentativas"
        | "verificacao_recusada" // o Turnstile não confirmou (SEC-120): a tela pede para recarregar
        | "indisponivel"; //    rota fechada, pedido de fora do site, ou o banco não respondeu
    };

/**
 * Enquanto for `false`, a tela mostra que o contato "abre em breve" e não
 * desenha botão que não faz nada, E a rota `POST /api/contato` fica fechada
 * em produção (responde `indisponivel` sem gravar nada). Vira `true` no commit
 * da T-041 que liga o botão, e só depois da 0006 em produção.
 *
 * ⚠️ Sozinha ela não abre a rota: `lib/contato/porta.ts` exige também
 * `TURNSTILE_NO_CONTATO = true` (SEC-120 a). Ligar só esta deixa o botão na
 * tela e a rota respondendo `indisponivel`.
 */
export const CONTATO_PELO_SITE_ABERTO = false;
