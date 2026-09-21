import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  destinoPorStatus,
  portaoDeStatus,
  rolesPermitidas,
} from "@/lib/auth/status";

// T-016 — o portão de role (R-001) e o portão de status (R-038) passam a
// existir aqui, por PREFIXO DE ROTA.
//
// É o que o DL-046 decidiu, com todas as letras: *"o bloqueio vive no
// `middleware.ts` por prefixo de rota, não espalhado por página, justamente
// pra não depender de disciplina humana (é a lição do R-001)"*. Uma página
// nova que alguém esqueça de guardar já nasce coberta; uma página guardada
// continua guardada mesmo que alguém mexa no `matcher` daqui.
//
// A tabela que este arquivo aplica NÃO mora aqui: mora em `lib/auth/status.ts`,
// que é a matriz §4 de `docs/06-PERMISSOES.md` em dado, e é o mesmo módulo que
// `requirePainel` usa nas páginas. Um lugar só, dois consumidores — para os
// dois não divergirem em silêncio, que é o defeito que este projeto já pagou
// para aprender (SEC-060).

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ⚠️ SEC-076 (16/09/2026) — o redirect PRECISA levar os cookies do `response`.
  //
  // O `setAll` acima escreve em `response` o par de tokens que o `getUser()`
  // renova quando o access token expirou. Um `NextResponse.redirect()` novo
  // nasce sem esses cookies, e o navegador fica com o refresh token ANTIGO,
  // que acabou de ser rotacionado do lado do Supabase. Com detecção de reuso
  // ligada, a renovação seguinte é recusada e a sessão cai.
  //
  // O defeito é herdado (o middleware antigo tinha os mesmos dois redirects),
  // mas a T-016 o amplifica: antes o redirect era exceção, agora é o fluxo
  // NORMAL de todo profissional em `incomplete`, `pending_validation` ou
  // `suspended`, em toda navegação. Quem espera validação passaria a ser
  // deslogado sozinho.
  const irPara = (destino: string) => {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    const redirecionamento = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirecionamento.cookies.set(cookie);
    }
    return redirecionamento;
  };

  // 1) Rotas que exigem login
  const isProtected = pathname.startsWith("/app") || pathname.startsWith("/admin");
  if (isProtected && !user) {
    return irPara("/login");
  }

  if (!user) return response;

  // 2) Este caminho pertence a alguma persona?
  //    `null` = não (`/app`, que é o roteador). Sem restrição, sem consulta:
  //    o middleware roda em TODA requisição destes prefixos, e ir ao banco
  //    quando não há decisão a tomar é custo puro.
  const roles = rolesPermitidas(pathname);
  if (!roles) return response;

  // Uma consulta, as três colunas que o portão usa. `role` e `status` são a
  // mesma linha: separar em dois `select` seria pagar duas idas ao banco por
  // requisição para responder metade da pergunta cada vez.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single<{ role: string; status: string }>();

  // 3) ISOLAMENTO DE ROLE — R-001, item 4 do DoD da F3.
  //    Lista de permitidos: role desconhecida, ou linha ausente, não entra.
  //    Quem erra a porta vai para `/app`, que é o roteador e sabe o destino
  //    certo de cada persona. `/app` não tem restrição de role, então não há
  //    laço: um `tutor` em `/app/veterinario` vai para `/app` e de lá para
  //    `/app/responsavel`.
  if (!profile || !roles.includes(profile.role)) {
    return irPara("/app");
  }

  // 4) PORTÃO DE STATUS — R-038 / matriz §4.
  //    Só existe para `vet` e `clinic`: responsável e admin nascem `active` e
  //    não passam por validação (`0002_nucleo.sql:796-797`).
  const portao = portaoDeStatus(pathname);
  if (portao && !(portao.permitidos as readonly string[]).includes(profile.status)) {
    const destino = destinoPorStatus(portao.role, profile.status);

    // ⚠️ A comparação exata é o que impede LAÇO DE REDIRECT, e ela é a razão
    // de o destino ser calculado antes de qualquer decisão. `/bloqueado` é o
    // sumidouro do portão: um status que o enum ganhe amanhã é mandado para lá
    // pelo `destinoPorStatus` e seria recusado lá pela lista `SO_SUSPENSO`.
    // Quando o destino É a página atual, deixa passar: a página tem o próprio
    // guard (`requireContaBloqueada`) e ela é terminal por definição.
    if (destino !== pathname) {
      return irPara(destino);
    }
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
