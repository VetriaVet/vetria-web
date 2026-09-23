import type { Metadata } from "next";

// ⚠️ O INTERRUPTOR DO GOOGLE PARA AS PÁGINAS PÚBLICAS DA F4.
//
// `false` até o portão de abertura (DL-063) fechar e alguém decidir, por
// escrito em `05-DECISOES.md`, abrir a busca e os perfis ao público. Até lá
// `/buscar`, `/veterinario/[slug]` e `/estabelecimento/[slug]` saem com
// `noindex, nofollow`: são contas de teste e profissionais que ainda não
// sabem que estão numa vitrine.
//
// O plano (01-PLANO §F4/S7) quer o perfil "indexável pelo Google" no DoD da
// F4. Virar `true` é UMA linha, num commit que cite o DL.
//
// Conta que não está `active` nem chega a ter página (404, pela RLS), então o
// "noindex automático em quem não está active" do plano é o próprio 404.
export const PAGINAS_PUBLICAS_INDEXAVEIS = false;

export function robotsDaPaginaPublica(): Metadata["robots"] {
  return PAGINAS_PUBLICAS_INDEXAVEIS
    ? { index: true, follow: true }
    : { index: false, follow: false };
}

/**
 * A página de resultados nunca é indexada, nem depois da abertura: cada
 * combinação de filtro é uma URL, e o Google trata isso como conteúdo
 * duplicado. Os links para os perfis podem ser seguidos depois da abertura.
 */
export function robotsDaBusca(): Metadata["robots"] {
  return { index: false, follow: PAGINAS_PUBLICAS_INDEXAVEIS };
}
