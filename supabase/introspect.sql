-- ============================================================
-- INTROSPECÇÃO DO BANCO — SOMENTE LEITURA
-- Rodar no Supabase → SQL Editor e colar o resultado de volta.
-- Não altera absolutamente nada. Nenhum INSERT, UPDATE, DROP ou ALTER.
-- Objetivo: versionar o baseline real antes da migration 0002 (risco R-006).
-- ============================================================

-- 1) TIPOS ENUM e seus valores  ← o mais importante agora
select t.typname as enum_name,
       string_agg(e.enumlabel, ' | ' order by e.enumsortorder) as valores
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
group by t.typname
order by t.typname;

-- 2) TABELAS e COLUNAS do schema public
select c.table_name,
       c.ordinal_position as pos,
       c.column_name,
       c.data_type,
       c.udt_name,
       c.is_nullable,
       c.column_default
from information_schema.columns c
join information_schema.tables t
  on t.table_schema = c.table_schema and t.table_name = c.table_name
where c.table_schema = 'public' and t.table_type = 'BASE TABLE'
order by c.table_name, c.ordinal_position;

-- 3) RLS está ativa em quais tabelas?
select relname as tabela,
       relrowsecurity as rls_ativa,
       relforcerowsecurity as rls_forcada
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;

-- 4) POLICIES existentes (o coração da autorização)
select schemaname, tablename, policyname, permissive,
       roles, cmd, qual as using_expr, with_check as check_expr
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 5) FUNÇÕES do schema public: quais são SECURITY DEFINER e têm search_path fixo
--    (DL-014/015: SECURITY INVOKER em policy já causou recursão infinita aqui)
select p.proname as funcao,
       pg_get_function_identity_arguments(p.oid) as args,
       case when p.prosecdef then 'DEFINER' else 'INVOKER' end as security,
       coalesce(array_to_string(p.proconfig, ', '), '(sem search_path fixo)') as config,
       pg_get_functiondef(p.oid) as definicao
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- 6) TRIGGERS
select c.relname as tabela, t.tgname as trigger, p.proname as funcao,
       pg_get_triggerdef(t.oid) as definicao
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc p on p.oid = t.tgfoid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and not t.tgisinternal
order by c.relname, t.tgname;

-- 7) TRIGGERS em auth.users (é onde vive o handle_new_user)
select c.relname as tabela, t.tgname as trigger, p.proname as funcao
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc p on p.oid = t.tgfoid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth' and not t.tgisinternal
order by c.relname, t.tgname;

-- 8) ÍNDICES e CONSTRAINTS
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- 9) QUEM EXISTE HOJE (contagem, sem expor dado pessoal)
select role, admin_level, onboarding_completed, count(*) as total
from public.profiles
group by role, admin_level, onboarding_completed
order by role, admin_level;

-- 10) Buckets do Storage
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by name;
