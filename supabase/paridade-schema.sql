-- ============================================================================
-- PARIDADE DE SCHEMA — SOMENTE LEITURA (SEC-139, 04/11/2026)
--
-- Pergunta que este arquivo responde: o vetria-e2e e PRODUÇÃO têm o MESMO
-- schema? Sem isso, um teste verde no vetria-e2e não prova nada sobre
-- produção (foi assim que a FK profiles_id_fkey faltou no teste: R-079).
--
-- Não altera nada. Nenhum INSERT, UPDATE, DELETE, DDL ou SET. Não lê linha de
-- tabela de usuário: só catálogo (pg_*), storage.buckets e pg_publication.
-- Nenhum id, nome, e-mail ou telefone sai na tela.
--
-- COMO USAR (o mesmo arquivo nos dois bancos, e compare):
--   npm run banco -- teste    supabase/paridade-schema.sql
--   npm run banco -- producao supabase/paridade-schema.sql
--
--   As consultas 1 a 12, uma por categoria. Cada uma devolve UMA linha:
--     categoria · itens (quantos) · impressao (md5 da lista ordenada)
--   Mesma impressão nos dois bancos = a categoria é idêntica, item por item.
--   Impressão diferente = rode a LISTA daquela categoria nos dois:
--   a consulta 10N lista os itens da consulta N (a 3 diverge? rode a 103):
--     npm run banco -- teste    supabase/paridade-schema.sql --so 103
--     npm run banco -- producao supabase/paridade-schema.sql --so 103
--   e compare os dois arquivos salvos em supabase/backups/.
--   Rodando o arquivo inteiro (sem --so), saem as 12 impressões e depois as
--   12 listas: compare primeiro as impressões, no topo da saída.
--   Só uma impressão: --so N (por exemplo --so 1 para as constraints).
--
-- REGRAS DE MONTAGEM (para a impressão não mentir):
--   · ordem por `collate "C"`: a ordem não depende da collation de cada banco;
--   · cada bloco 10N repete LITERALMENTE o `with itens` do bloco N. Mudou um,
--     mude o outro igual, senão a lista deixa de explicar a impressão;
--   · nomes de tipo e de tabela saem pelo search_path da sessão. O
--     `npm run banco` entra com o mesmo papel (postgres) nos dois projetos,
--     então o texto sai igual. Rodando pelo SQL Editor, rode nos dois também.
--   · funções: a impressão usa o md5 do corpo SEM ESPAÇO (padrão da 0004). O
--     corpo inteiro está no `introspect-funcoes.sql`. Funções que pertencem a
--     extensão ficam de fora (a versão da extensão está na CONSULTA 8).
--   · grants: além de anon e authenticated, entra PUBLIC, porque o que é
--     concedido a PUBLIC vale para os dois.
--
-- DIFERENÇAS JÁ CONHECIDAS (não são achado novo; ver o cabeçalho do
-- `montar-vetria-e2e.sql`):
--   · funções: `admin_list_profiles` e `admin_set_user_access` só existem em
--     produção (corpo nunca versionado);
--   · extensões e default ACLs podem diferir pela versão do projeto Supabase;
--   · triggers de auth: o vetria-e2e é um projeto mais novo, e o Supabase pode
--     ter triggers próprios diferentes.
--   Qualquer outra diferença é achado: anote e leve ao vetria-backend.
-- ============================================================================

-- CONSULTA 1 — impressão: constraints de public (f, c, u, x) com definicao
with itens(item) as (
  select n.nspname || '.' || c.relname || ' | ' || k.conname || ' | ' || k.contype::text
         || ' | ' || pg_get_constraintdef(k.oid)
    from pg_constraint k
    join pg_class c on c.oid = k.conrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and k.contype in ('f', 'c', 'u', 'x')
)
select '1 constraints de public (f, c, u, x) com definicao' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;

-- CONSULTA 2 — impressão: policies de public e storage
with itens(item) as (
  select p.schemaname || '.' || p.tablename || ' | ' || p.policyname || ' | ' || p.permissive
         || ' | ' || array_to_string(array(select r::text from unnest(p.roles) r order by 1), ',')
         || ' | ' || p.cmd
         || ' | using: ' || coalesce(p.qual, '-')
         || ' | check: ' || coalesce(p.with_check, '-')
    from pg_policies p
   where p.schemaname in ('public', 'storage')
)
select '2 policies de public e storage' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;

-- CONSULTA 3 — impressão: funcoes de public: assinatura, seguranca, config e corpo sem espaco
with itens(item) as (
  select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
         || ' -> ' || coalesce(pg_get_function_result(p.oid), '-')
         || ' | ' || l.lanname
         || ' | ' || case when p.prosecdef then 'DEFINER' else 'INVOKER' end
         || ' | ' || p.provolatile::text
         || ' | ' || coalesce(array_to_string(array(select x from unnest(p.proconfig) x order by 1), ','), '-')
         || ' | corpo sem espaco ' || md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_language l on l.oid = p.prolang
   where n.nspname = 'public'
     and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
)
select '3 funcoes de public: assinatura, seguranca, config e corpo sem espaco' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;

-- CONSULTA 4 — impressão: grants de tabela em public para PUBLIC, anon e authenticated
with itens(item) as (
  select n.nspname || '.' || c.relname || ' | ' || c.relkind::text
         || ' | ' || case when a.grantee = 0 then 'PUBLIC' else r.rolname::text end
         || ' | ' || a.privilege_type
         || case when a.is_grantable then ' (grantable)' else '' end
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(c.relacl) a
    left join pg_roles r on r.oid = a.grantee
   where n.nspname = 'public'
     and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S')
     and (a.grantee = 0 or r.rolname in ('anon', 'authenticated'))
)
select '4 grants de tabela em public para PUBLIC, anon e authenticated' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;

-- CONSULTA 5 — impressão: grants de coluna em public para PUBLIC, anon e authenticated
with itens(item) as (
  select n.nspname || '.' || c.relname || '.' || att.attname
         || ' | ' || case when a.grantee = 0 then 'PUBLIC' else r.rolname::text end
         || ' | ' || a.privilege_type
         || case when a.is_grantable then ' (grantable)' else '' end
    from pg_attribute att
    join pg_class c on c.oid = att.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(att.attacl) a
    left join pg_roles r on r.oid = a.grantee
   where n.nspname = 'public'
     and att.attnum > 0 and not att.attisdropped
     and (a.grantee = 0 or r.rolname in ('anon', 'authenticated'))
)
select '5 grants de coluna em public para PUBLIC, anon e authenticated' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;

-- CONSULTA 6 — impressão: EXECUTE das funcoes de public para anon e authenticated (efetivo, inclui PUBLIC)
with itens(item) as (
  select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
         || ' | anon ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text
         || ' | authenticated ' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
)
select '6 EXECUTE das funcoes de public para anon e authenticated (efetivo, inclui PUBLIC)' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;

-- CONSULTA 7 — impressão: triggers nao internos de public e auth (inclui auth.users)
with itens(item) as (
  select n.nspname || '.' || c.relname || ' | ' || t.tgname || ' | ' || t.tgenabled::text
         || ' | ' || pg_get_triggerdef(t.oid)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
   where not t.tgisinternal
     and n.nspname in ('public', 'auth')
)
select '7 triggers nao internos de public e auth (inclui auth.users)' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;

-- CONSULTA 8 — impressão: extensoes e versoes
with itens(item) as (
  select e.extname || ' | ' || e.extversion || ' | ' || n.nspname
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
)
select '8 extensoes e versoes' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;

-- CONSULTA 9 — impressão: buckets de storage (id, public, file_size_limit, allowed_mime_types)
with itens(item) as (
  select b.id || ' | public ' || coalesce(b.public::text, 'null')
         || ' | limite ' || coalesce(b.file_size_limit::text, 'null')
         || ' | mime ' || coalesce(b.allowed_mime_types::text, 'null')
    from storage.buckets b
)
select '9 buckets de storage (id, public, file_size_limit, allowed_mime_types)' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;

-- CONSULTA 10 — impressão: publication supabase_realtime (flags e tabelas)
with itens(item) as (
  select 'publicacao | ' || p.pubname || ' | todas ' || p.puballtables::text
         || ' | insert ' || p.pubinsert::text || ' | update ' || p.pubupdate::text
         || ' | delete ' || p.pubdelete::text || ' | truncate ' || p.pubtruncate::text
    from pg_publication p
   where p.pubname = 'supabase_realtime'
  union all
  select 'tabela | ' || pt.schemaname || '.' || pt.tablename
    from pg_publication_tables pt
   where pt.pubname = 'supabase_realtime'
)
select '10 publication supabase_realtime (flags e tabelas)' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;

-- CONSULTA 11 — impressão: default ACLs (alter default privileges)
with itens(item) as (
  select pg_get_userbyid(d.defaclrole)::text || ' | ' || coalesce(n.nspname::text, '(todos os schemas)')
         || ' | ' || d.defaclobjtype::text
         || ' | ' || array_to_string(array(select x::text from unnest(d.defaclacl) x order by 1), ',')
    from pg_default_acl d
    left join pg_namespace n on n.oid = d.defaclnamespace
)
select '11 default ACLs (alter default privileges)' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;

-- CONSULTA 12 — impressão: RLS ligada e forcada nas tabelas de public e storage
with itens(item) as (
  select n.nspname || '.' || c.relname
         || ' | rls ' || c.relrowsecurity::text || ' | forcada ' || c.relforcerowsecurity::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in ('public', 'storage')
     and c.relkind in ('r', 'p')
)
select '12 RLS ligada e forcada nas tabelas de public e storage' as categoria,
       count(item) as itens,
       md5(coalesce(string_agg(item, E'\n' order by item collate "C"), '')) as impressao
from itens;


-- ============================================================================
-- AS LISTAS — rode só a da categoria cuja impressão divergiu (--so 10N)
-- ============================================================================

-- CONSULTA 101 — lista: constraints de public (f, c, u, x) com definicao
with itens(item) as (
  select n.nspname || '.' || c.relname || ' | ' || k.conname || ' | ' || k.contype::text
         || ' | ' || pg_get_constraintdef(k.oid)
    from pg_constraint k
    join pg_class c on c.oid = k.conrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and k.contype in ('f', 'c', 'u', 'x')
)
select item
from itens
where item is not null
order by item collate "C";

-- CONSULTA 102 — lista: policies de public e storage
with itens(item) as (
  select p.schemaname || '.' || p.tablename || ' | ' || p.policyname || ' | ' || p.permissive
         || ' | ' || array_to_string(array(select r::text from unnest(p.roles) r order by 1), ',')
         || ' | ' || p.cmd
         || ' | using: ' || coalesce(p.qual, '-')
         || ' | check: ' || coalesce(p.with_check, '-')
    from pg_policies p
   where p.schemaname in ('public', 'storage')
)
select item
from itens
where item is not null
order by item collate "C";

-- CONSULTA 103 — lista: funcoes de public: assinatura, seguranca, config e corpo sem espaco
with itens(item) as (
  select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
         || ' -> ' || coalesce(pg_get_function_result(p.oid), '-')
         || ' | ' || l.lanname
         || ' | ' || case when p.prosecdef then 'DEFINER' else 'INVOKER' end
         || ' | ' || p.provolatile::text
         || ' | ' || coalesce(array_to_string(array(select x from unnest(p.proconfig) x order by 1), ','), '-')
         || ' | corpo sem espaco ' || md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_language l on l.oid = p.prolang
   where n.nspname = 'public'
     and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
)
select item
from itens
where item is not null
order by item collate "C";

-- CONSULTA 104 — lista: grants de tabela em public para PUBLIC, anon e authenticated
with itens(item) as (
  select n.nspname || '.' || c.relname || ' | ' || c.relkind::text
         || ' | ' || case when a.grantee = 0 then 'PUBLIC' else r.rolname::text end
         || ' | ' || a.privilege_type
         || case when a.is_grantable then ' (grantable)' else '' end
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(c.relacl) a
    left join pg_roles r on r.oid = a.grantee
   where n.nspname = 'public'
     and c.relkind in ('r', 'p', 'v', 'm', 'f', 'S')
     and (a.grantee = 0 or r.rolname in ('anon', 'authenticated'))
)
select item
from itens
where item is not null
order by item collate "C";

-- CONSULTA 105 — lista: grants de coluna em public para PUBLIC, anon e authenticated
with itens(item) as (
  select n.nspname || '.' || c.relname || '.' || att.attname
         || ' | ' || case when a.grantee = 0 then 'PUBLIC' else r.rolname::text end
         || ' | ' || a.privilege_type
         || case when a.is_grantable then ' (grantable)' else '' end
    from pg_attribute att
    join pg_class c on c.oid = att.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(att.attacl) a
    left join pg_roles r on r.oid = a.grantee
   where n.nspname = 'public'
     and att.attnum > 0 and not att.attisdropped
     and (a.grantee = 0 or r.rolname in ('anon', 'authenticated'))
)
select item
from itens
where item is not null
order by item collate "C";

-- CONSULTA 106 — lista: EXECUTE das funcoes de public para anon e authenticated (efetivo, inclui PUBLIC)
with itens(item) as (
  select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
         || ' | anon ' || has_function_privilege('anon', p.oid, 'EXECUTE')::text
         || ' | authenticated ' || has_function_privilege('authenticated', p.oid, 'EXECUTE')::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and not exists (select 1 from pg_depend d where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e')
)
select item
from itens
where item is not null
order by item collate "C";

-- CONSULTA 107 — lista: triggers nao internos de public e auth (inclui auth.users)
with itens(item) as (
  select n.nspname || '.' || c.relname || ' | ' || t.tgname || ' | ' || t.tgenabled::text
         || ' | ' || pg_get_triggerdef(t.oid)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
   where not t.tgisinternal
     and n.nspname in ('public', 'auth')
)
select item
from itens
where item is not null
order by item collate "C";

-- CONSULTA 108 — lista: extensoes e versoes
with itens(item) as (
  select e.extname || ' | ' || e.extversion || ' | ' || n.nspname
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
)
select item
from itens
where item is not null
order by item collate "C";

-- CONSULTA 109 — lista: buckets de storage (id, public, file_size_limit, allowed_mime_types)
with itens(item) as (
  select b.id || ' | public ' || coalesce(b.public::text, 'null')
         || ' | limite ' || coalesce(b.file_size_limit::text, 'null')
         || ' | mime ' || coalesce(b.allowed_mime_types::text, 'null')
    from storage.buckets b
)
select item
from itens
where item is not null
order by item collate "C";

-- CONSULTA 110 — lista: publication supabase_realtime (flags e tabelas)
with itens(item) as (
  select 'publicacao | ' || p.pubname || ' | todas ' || p.puballtables::text
         || ' | insert ' || p.pubinsert::text || ' | update ' || p.pubupdate::text
         || ' | delete ' || p.pubdelete::text || ' | truncate ' || p.pubtruncate::text
    from pg_publication p
   where p.pubname = 'supabase_realtime'
  union all
  select 'tabela | ' || pt.schemaname || '.' || pt.tablename
    from pg_publication_tables pt
   where pt.pubname = 'supabase_realtime'
)
select item
from itens
where item is not null
order by item collate "C";

-- CONSULTA 111 — lista: default ACLs (alter default privileges)
with itens(item) as (
  select pg_get_userbyid(d.defaclrole)::text || ' | ' || coalesce(n.nspname::text, '(todos os schemas)')
         || ' | ' || d.defaclobjtype::text
         || ' | ' || array_to_string(array(select x::text from unnest(d.defaclacl) x order by 1), ',')
    from pg_default_acl d
    left join pg_namespace n on n.oid = d.defaclnamespace
)
select item
from itens
where item is not null
order by item collate "C";

-- CONSULTA 112 — lista: RLS ligada e forcada nas tabelas de public e storage
with itens(item) as (
  select n.nspname || '.' || c.relname
         || ' | rls ' || c.relrowsecurity::text || ' | forcada ' || c.relforcerowsecurity::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in ('public', 'storage')
     and c.relkind in ('r', 'p')
)
select item
from itens
where item is not null
order by item collate "C";
