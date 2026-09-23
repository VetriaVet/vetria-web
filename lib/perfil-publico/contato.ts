// A INTERFACE do evento de contato (DL-047, matriz §6). Só os tipos.
//
// ⚠️ O QUE ESTE ARQUIVO NÃO FAZ, e por quê: não lê telefone, não grava em
// `contatos`, não monta link de WhatsApp. O registro do contato é a F4/S8, e
// o que ele precisa ainda não está decidido por escrito:
//   · o cookie `anon_id` (nome, duração, onde é criado);
//   · como o servidor lê `perfil_privado.whatsapp` de OUTRA pessoa (hoje só
//     o dono e o admin leem; o caminho óbvio é uma função SECURITY DEFINER
//     que grava o contato E devolve o número na mesma transação, ou a rota
//     com `service_role`; qualquer um dos dois é 🔴);
//   · o limite de cliques por visitante (raspagem pelo próprio evento).
//
// O que JÁ está decidido e amarra a S8 (DL-047):
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
        | "indisponivel"; //    a S8 ainda não existe, ou o banco não respondeu
    };

/**
 * Enquanto for `false`, a tela mostra que o contato "abre em breve" e não
 * desenha botão que não faz nada. Vira `true` no commit que ligar a rota da
 * S8, e só então.
 */
export const CONTATO_PELO_SITE_ABERTO = false;
