// T-016 — O PORTÃO DE STATUS, EM CÓDIGO, E NUM LUGAR SÓ.
//
// Este arquivo é a matriz §4 de `docs/06-PERMISSOES.md` traduzida em dado.
// Ele não fala com o banco, não importa `next/headers` e não tem efeito
// colateral nenhum — de propósito: o `middleware.ts` roda no Edge e precisa
// importar daqui, e `lib/auth/painel.ts` (Server Component, com cookie e
// sessão) importa daqui também. Uma tabela, dois consumidores.
//
// ⚠️ SE ESTE ARQUIVO E A MATRIZ DIVERGIREM, O ARQUIVO ESTÁ ERRADO.
// A matriz só muda por decisão registrada em `docs/05-DECISOES.md`.
//
// A matriz §4, na íntegra:
//
//   | status             | alcança                                        | bloqueado          |
//   |--------------------|------------------------------------------------|--------------------|
//   | incomplete         | /onboarding                                    | todo o painel      |
//   | pending_validation | /aguardando, /perfil, /configuracoes, /ajuda   | o resto do painel  |
//   | active             | painel completo                                | —                  |
//   | suspended          | tela de bloqueio com motivo                    | todo o resto       |
//
// ⚠️ `/ajuda` entrou na linha de `pending_validation` pelo **DL-058**
// (16/09/2026), e esta tabela ficou um tempo sem ele enquanto o mapa lá
// embaixo já tinha (SEC-090). Se você mudar `ALCANCE_POR_SEGMENTO`, mude esta
// tabela no mesmo gesto: ela se apresenta como fonte, e um arquivo que se
// contradiz consigo mesmo a 130 linhas de distância ensina errado quem chegar
// depois. A ordem continua sendo matriz primeiro, código depois.
//
// E o DL-046 diz onde o bloqueio mora: *"o bloqueio vive no `middleware.ts`
// por prefixo de rota, não espalhado por página, justamente pra não depender
// de disciplina humana (é a lição do R-001)"*. É por isso que o portão está em
// DOIS lugares e não em um: o `middleware.ts` é o portão (pega inclusive a
// página que alguém esquecer de guardar amanhã), e `requirePainel` é defesa em
// profundidade na página (pega o dia em que alguém mexer no `matcher`).

// ---------------------------------------------------------------------------
// TIPOS
// ---------------------------------------------------------------------------

/** As duas roles que passam por validação. DL-043: rota em português, role em
 *  inglês. `profiles.role` é `vet` e `clinic`; a URL é `/app/veterinario` e
 *  `/app/estabelecimento`. Não renomeie o enum. */
export type RoleProfissional = "vet" | "clinic";

/** Os quatro valores do enum `public.user_status`
 *  (`supabase/migrations/0002_nucleo.sql:135-140`). */
export type StatusUsuario =
  | "incomplete"
  | "pending_validation"
  | "active"
  | "suspended";

// ---------------------------------------------------------------------------
// OS CONJUNTOS PERMITIDOS — LISTA DE PERMITIDOS, NUNCA DE NEGADOS (SEC-052)
// ---------------------------------------------------------------------------
// ⚠️ O padrão é o mesmo de `app/app/veterinario/onboarding/page.tsx` e do
// `actions.ts` do estabelecimento, e o motivo é o mesmo: no dia em que a S4 ou
// a F6 acrescentar `rejected` ou `deleted` ao enum `user_status`, o valor novo
// precisa nascer BARRADO até alguém decidir o contrário. Com lista de negados,
// ele entraria em tudo por padrão, sem ninguém editar arquivo nenhum e sem
// nada falhar. É a diferença entre errar fechado e errar aberto.

/** `/onboarding`: quem ainda não concluiu, e quem está na fila e quer corrigir
 *  (DL-046 — enquanto espera, ele edita). Igual ao guard que a T-006 já
 *  escreveu na própria página. */
export const ONBOARDING: readonly StatusUsuario[] = [
  "incomplete",
  "pending_validation",
];

/** `/aguardando`: só quem está de fato esperando. Um `active` nesta tela leria
 *  "estamos validando seu cadastro" depois de já ter sido aprovado. */
export const SO_ESPERANDO: readonly StatusUsuario[] = ["pending_validation"];

/** `/perfil` e `/configuracoes`: as duas telas que o DL-046 promete a quem
 *  está na fila, mais o painel ativo. */
export const ESPERANDO_OU_ATIVO: readonly StatusUsuario[] = [
  "pending_validation",
  "active",
];

/** Todo o resto do painel: dashboard, contatos, agenda, avaliações, plano,
 *  ajuda e equipe. A coluna "Bloqueado" da matriz para `pending_validation`. */
export const SO_ATIVO: readonly StatusUsuario[] = ["active"];

/** `/bloqueado`: a tela de bloqueio com motivo. Ver `ehDestinoDeBloqueio()`
 *  abaixo — esta rota é o SUMIDOURO do portão e recebe mais do que `suspended`. */
export const SO_SUSPENSO: readonly StatusUsuario[] = ["suspended"];

// ---------------------------------------------------------------------------
// R-001 — ISOLAMENTO DE ROLE POR PREFIXO DE ROTA
// ---------------------------------------------------------------------------
// Matriz §2: `/app/responsavel/**` é do responsável e de mais ninguém;
// `/app/veterinario/**` do vet; `/app/estabelecimento/**` do estabelecimento;
// `/admin` do admin. Isolamento de role aqui não é tema de segurança, é o
// modelo de negócio: cada conta compra um benefício diferente.
//
// `master` NÃO é role (DL-045 / R-002): é `role = 'admin'` +
// `admin_level = 'master'`. Por isso `/admin` pede `admin` e o nível é conferido
// dentro das rotas `/api/admin/*`, que a T-015 já fez.

const ROLES_POR_PREFIXO: { prefixo: string; permitidas: readonly string[] }[] = [
  { prefixo: "/app/responsavel", permitidas: ["tutor"] },
  { prefixo: "/app/veterinario", permitidas: ["vet"] },
  { prefixo: "/app/estabelecimento", permitidas: ["clinic"] },
  { prefixo: "/admin", permitidas: ["admin"] },
];

/**
 * Quais roles alcançam este caminho. `null` = o caminho não é de nenhuma
 * persona específica (`/app`, que é o roteador, e qualquer coisa fora dos
 * prefixos acima) e o portão de role não se aplica.
 */
export function rolesPermitidas(pathname: string): readonly string[] | null {
  const achado = ROLES_POR_PREFIXO.find(
    (r) => pathname === r.prefixo || pathname.startsWith(`${r.prefixo}/`)
  );
  return achado ? achado.permitidas : null;
}

// ---------------------------------------------------------------------------
// R-038 — O PORTÃO DE STATUS POR ROTA
// ---------------------------------------------------------------------------

const PAINEL_POR_PREFIXO: { prefixo: string; role: RoleProfissional }[] = [
  { prefixo: "/app/veterinario", role: "vet" },
  { prefixo: "/app/estabelecimento", role: "clinic" },
];

/** Segmento logo depois do prefixo do painel → quem alcança.
 *  O que NÃO estiver aqui cai no padrão, que é `active` e mais ninguém. */
const ALCANCE_POR_SEGMENTO: Record<string, readonly StatusUsuario[]> = {
  onboarding: ONBOARDING,
  aguardando: SO_ESPERANDO,
  perfil: ESPERANDO_OU_ATIVO,
  configuracoes: ESPERANDO_OU_ATIVO,
  bloqueado: SO_SUSPENSO,
  // ⚠️ DL-058 (16/09/2026) — `/ajuda` alcança quem espera validação.
  //
  // Esta linha ALARGA permissão, então ela só existe porque a matriz mudou
  // PRIMEIRO: `docs/06-PERMISSOES.md` §4 passou a listar `/ajuda` em "Alcança"
  // para `pending_validation`. A ordem importa e não é burocracia — quando o
  // código anda na frente da matriz, a matriz deixa de ser fonte única e vira
  // documentação de intenção.
  //
  // O motivo de produto: quem está esperando validação é justamente quem tem
  // pergunta, e a tela é FAQ mais email de suporte, sem nada de painel.
  //
  // `incomplete` e `suspended` continuam FORA, de propósito: o caminho de quem
  // está incompleto é o onboarding, e `/bloqueado` precisa ser terminal, senão
  // o suspenso entra em laço de redirect. `ContaBloqueada.tsx` já põe o email
  // de contato na tela dele.
  ajuda: ESPERANDO_OU_ATIVO,
};

/** Dashboard, contatos, agenda, avaliações, plano, equipe — e qualquer página
 *  nova que alguém acrescente amanhã sem mexer neste arquivo. Padrão fechado:
 *  a página nova nasce protegida. */
const ALCANCE_PADRAO = SO_ATIVO;

/**
 * O portão de status deste caminho, se ele for de painel profissional.
 * `null` para `/app`, `/app/responsavel/**` e `/admin/**`: a matriz §4 se chama
 * "O portão de status (vet e estabelecimento)" e vale só para esses dois.
 *
 * ⚠️ Responsável e admin NASCEM `active` (`0002_nucleo.sql:796-797`, e a §10.1
 * migrou os que já existiam). Aplicar a eles a lista de permitidos dos
 * profissionais não os protegeria de nada e trancaria gente que deve entrar.
 */
export function portaoDeStatus(
  pathname: string
): { role: RoleProfissional; permitidos: readonly StatusUsuario[] } | null {
  const painel = PAINEL_POR_PREFIXO.find(
    (p) => pathname === p.prefixo || pathname.startsWith(`${p.prefixo}/`)
  );
  if (!painel) return null;

  const resto = pathname.slice(painel.prefixo.length).replace(/^\//, "");
  const segmento = resto.split("/")[0] ?? "";

  return {
    role: painel.role,
    permitidos: ALCANCE_POR_SEGMENTO[segmento] ?? ALCANCE_PADRAO,
  };
}

/** A raiz do painel de cada role. DL-043 mora aqui: é o único lugar do portão
 *  que traduz role (inglês) em rota (português). */
export function basePainel(role: RoleProfissional): string {
  return role === "vet" ? "/app/veterinario" : "/app/estabelecimento";
}

/**
 * Para onde vai quem NÃO alcança a rota pedida — e para onde `/app` manda um
 * profissional. É a mesma tabela lida na direção contrária: cada status tem um
 * único lugar legítimo.
 *
 * ⚠️ O `default` é deliberado e é a metade que fecha o padrão: um valor novo no
 * enum não cai no painel, cai na tela de bloqueio. Errar fechado.
 */
export function destinoPorStatus(
  role: RoleProfissional,
  status: string
): string {
  const base = basePainel(role);
  switch (status) {
    case "incomplete":
      return `${base}/onboarding`;
    case "pending_validation":
      return `${base}/aguardando`;
    case "active":
      return base;
    default:
      return `${base}/bloqueado`;
  }
}

/**
 * `/bloqueado` é o SUMIDOURO do portão: recebe `suspended` e também qualquer
 * status que o `destinoPorStatus` não saiba classificar.
 *
 * ⚠️ Sem esta função haveria LAÇO DE REDIRECT: um status desconhecido é mandado
 * para `/bloqueado` pelo `destinoPorStatus` e seria recusado lá pela lista
 * `SO_SUSPENSO`, que o mandaria para `/bloqueado` de novo. O `middleware.ts`
 * evita o laço comparando o destino com o caminho atual; a página usa esta
 * função. As duas defesas dizem a mesma coisa.
 */
export function ehStatusDeBloqueio(status: string): boolean {
  return (
    status !== "incomplete" &&
    status !== "pending_validation" &&
    status !== "active"
  );
}
