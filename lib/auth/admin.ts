import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// T-023 — O GUARD DAS PÁGINAS DE `/admin`, NUM LUGAR SÓ.
//
// Gêmeo de `lib/auth/painel.ts`, e nasce pelo mesmo motivo que ele nasceu: a
// autorização estava copiada em cada página, e cópia diverge em silêncio. As
// quatro páginas de `/admin` repetiam o mesmo `select role` seguido de
// `if (profile.role !== "admin") redirect("/app")`, e **nenhuma delas
// conferia `admin_level`**.
//
// ⚠️ R-054 / SEC-078 — É ISSO QUE ESTE ARQUIVO CONSERTA.
// A matriz §2 de `docs/06-PERMISSOES.md` dá ❌ a admin comum em
// `/admin/usuarios`, e ❌ ali significa, por escrito, "bloqueado no servidor".
// O que separava admin de master naquela tela era um `? :` de renderização:
// não vazava dado (o `AdminPanel` estava dentro do ramo `isMaster`), mas não
// havia autorização ali para alguém mexer. No dia em que um segundo bloco
// nascesse fora do ramo, o vazamento apareceria sem ninguém ter tocado em
// autorização nenhuma. Agora a decisão é um `redirect()` antes do primeiro
// byte de HTML.
//
// ⚠️ `master` NÃO é um `role` (DL-045 / R-002). É `role = 'admin'` **mais**
// `admin_level = 'master'`. O enum `admin_level` é ('none','admin','master') —
// `comum` não existe, e foi confirmado por introspecção em 26/08.
//
// ⚠️ DL-016 — nenhum `redirect()` deste arquivo pode ser envolvido em
// `try/catch` por quem chamar: o `NEXT_REDIRECT` é uma exceção, e engoli-la
// faz o redirect sumir sem erro visível.

type LinhaAdmin = {
  role: string;
  admin_level: string | null;
  admin_team: string | null;
};

export type SessaoAdmin = {
  userId: string;
  email: string;
  /** ⚠️ Cru, podendo ser `null`. O enum tem `'none'`, e há linha em produção
   *  com NULL porque `/api/admin/set-access` escreve NULL onde a RPC escreve
   *  `'none'` (R-012). Normalizar aqui esconderia a divergência de quem olha
   *  a tela; quem decide é `ehMaster`, que não depende disso. */
  adminLevel: string | null;
  adminTeam: string | null;
  /** `role = 'admin'` **e** `admin_level = 'master'`. A matriz §5 em uma linha. */
  ehMaster: boolean;
};

async function carregarSessaoAdmin(): Promise<SessaoAdmin> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, admin_level, admin_team")
    .eq("id", user.id)
    .single<LinhaAdmin>();

  // Lista de permitidos, nunca de negados (SEC-052): linha ausente, role
  // desconhecida ou erro de leitura não entram. Errar fechado.
  if (!perfil || perfil.role !== "admin") redirect("/app");

  return {
    userId: user.id,
    email: user.email ?? "",
    adminLevel: perfil.admin_level,
    adminTeam: perfil.admin_team,
    ehMaster: perfil.admin_level === "master",
  };
}

/**
 * Exige `role = 'admin'`. É o portão de `/admin`, `/admin/validacoes`,
 * `/admin/moderacao` e `/admin/conteudo` — as quatro linhas da matriz §2 em
 * que admin comum tem ✅.
 *
 * O `middleware.ts` já barra quem não é `admin` por prefixo de rota; isto é
 * defesa em profundidade na página, exatamente como `requirePainel` é para os
 * painéis profissionais (DL-046).
 */
export async function requireAdmin(): Promise<SessaoAdmin> {
  return carregarSessaoAdmin();
}

/**
 * Exige `role = 'admin'` **e** `admin_level = 'master'`. É o portão de
 * `/admin/usuarios`, e é a linha da matriz §2 que o R-054 registrou como
 * divergente do código.
 *
 * Quem não é master vai para `/app`, que é o roteador e devolve o admin ao
 * `/admin` dele. Não há laço: `/app` não tem restrição de role e
 * `app/app/page.tsx` manda `admin` para `/admin`, que renderiza.
 */
export async function requireMaster(): Promise<SessaoAdmin> {
  const sessao = await carregarSessaoAdmin();
  if (!sessao.ehMaster) redirect("/app");
  return sessao;
}
