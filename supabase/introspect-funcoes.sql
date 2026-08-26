-- ============================================================
-- RODADA 2 — SOMENTE LEITURA. Não altera nada.
--
-- Truque: o corpo das funções volta QUEBRADO EM UMA LINHA POR ROW,
-- em vez de um texto gigante numa célula só. Assim o print não corta.
--
-- Rode UMA POR VEZ. O editor do Supabase mostra só o resultado da última.
-- ============================================================


-- ############################################################
-- QUERY 1 — A CRÍTICA: quem pode executar cada função
-- Resultado esperado: poucas linhas. Olhe a linha de
-- `admin_set_user_access`. Se disser "PUBLIC PODE EXECUTAR",
-- qualquer usuário logado consegue chamá-la por RPC.
-- ############################################################

select p.proname                                   as funcao,
       case when p.prosecdef then 'DEFINER ⚠️' else 'invoker' end as security,
       coalesce(array_to_string(p.proacl, '  |  '),
                '>>> PUBLIC PODE EXECUTAR (padrão) <<<')          as quem_executa
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.prosecdef desc, p.proname;


-- ############################################################
-- QUERY 2 — o corpo das 2 funções de admin, linha por linha
-- Procuro: existe um `if not is_master_admin() then raise exception`
-- (ou equivalente) LOGO NO COMEÇO? Se não existir, é furo crítico.
-- ############################################################

select p.proname as funcao,
       l.n       as linha,
       l.txt     as codigo
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral unnest(string_to_array(pg_get_functiondef(p.oid), chr(10)))
     with ordinality as l(txt, n)
where n.nspname = 'public'
  and p.proname in ('admin_set_user_access', 'admin_list_profiles')
order by p.proname, l.n;


-- ############################################################
-- QUERY 3 — o corpo das funções de checagem, linha por linha
-- Procuro: as duas são iguais? Qual é a canônica? (risco R-005)
-- ############################################################

select p.proname as funcao,
       l.n       as linha,
       l.txt     as codigo
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral unnest(string_to_array(pg_get_functiondef(p.oid), chr(10)))
     with ordinality as l(txt, n)
where n.nspname = 'public'
  and p.proname in ('is_master_admin', 'is_admin_master', 'current_user_role')
order by p.proname, l.n;


-- ############################################################
-- QUERY 4 — texto completo das policies de profiles
-- Procuro: o que as duas policies de UPDATE quase homônimas
-- permitem de fato, e se alguma deixa o usuário mexer no
-- próprio `role` ou `admin_level`.
-- ############################################################

select policyname,
       cmd,
       coalesce(qual, '(sem USING)')            as using_expr,
       coalesce(with_check, '(sem WITH CHECK)') as check_expr
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by cmd, policyname;
