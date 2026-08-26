-- ============================================================================
-- 0000 — BASELINE DO SCHEMA EM PRODUÇÃO
--
-- ⚠️  DOCUMENTAL. JÁ APLICADO. **NÃO RODAR EM PRODUÇÃO.**
--
-- Este arquivo não é uma migration a executar. Ele registra, em SQL, o estado
-- real do banco em 26/08/2026, levantado por introspecção (`introspect.sql` e
-- `introspect-funcoes.sql`). Serve para:
--   1. Permitir revisar o que está em produção lendo o repositório (fecha R-006).
--   2. Recriar um ambiente do zero, se um dia for preciso.
--   3. Dar contexto a quem for escrever a 0002 em diante.
--
-- Tudo abaixo foi criado direto no dashboard do Supabase, antes da pasta
-- `migrations/` existir. A única exceção é `handle_new_user`, versionada em
-- 0001 e reproduzida aqui na forma em que está no banco.
--
-- Baseline levantada em: 26/08/2026
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. TIPOS ENUM
-- ----------------------------------------------------------------------------
-- NOTA: `master` NÃO é um role. Um master é role='admin' + admin_level='master'.
-- A documentação antiga (CONTEXT.md §4.1) dizia o contrário e estava errada.
-- Ver DL-045 e docs/06-PERMISSOES.md §1.

create type public.user_role   as enum ('tutor', 'vet', 'clinic', 'admin');
create type public.admin_level as enum ('none', 'admin', 'master');
create type public.admin_team  as enum ('none', 'support', 'sales', 'ops', 'finance', 'compliance');


-- ----------------------------------------------------------------------------
-- 2. TABELA profiles (a única que existe hoje)
-- ----------------------------------------------------------------------------
-- NOTA: `profiles` TEM `full_name` e `phone`. O DL-019 afirmava que não tinha,
-- e estava errado. Verificado por introspecção em 26/08/2026.

create table public.profiles (
  id                    uuid          not null,
  role                  user_role     not null default 'tutor'::user_role,
  full_name             text,
  phone                 text,
  onboarding_completed  boolean       not null default false,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now(),
  admin_level           admin_level            default 'none'::admin_level,
  admin_team            admin_team             default 'none'::admin_team,
  constraint profiles_pkey primary key (id)
);

-- Índices: SOMENTE a primary key. Não há índice em `role` nem em nada mais.
-- A busca da Fase 4 vai precisar de índices de verdade.

alter table public.profiles enable row level security;
-- FORCE ROW LEVEL SECURITY está DESLIGADO (o dono da tabela ignora RLS).


-- ----------------------------------------------------------------------------
-- 3. FUNÇÕES
-- ----------------------------------------------------------------------------

-- 3.1 — is_master_admin() — CANÔNICA. É a usada pelas 5 policies de profiles.
create or replace function public.is_master_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND admin_level = 'master'
  );
$function$;

-- 3.2 — is_admin_master() — ⚠️ DUPLICATA EXATA da 3.1, byte a byte.
-- Não é usada por nenhuma policy nem pelo código do app. Resíduo do DL-014.
-- Marcada para remoção na 0002 (risco R-005).
create or replace function public.is_admin_master()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND admin_level = 'master'
  );
$function$;

-- 3.3 — current_user_role() — ⚠️⚠️ PERIGOSA. SECURITY INVOKER e SEM search_path.
-- Consulta `profiles`. Se for usada dentro de uma policy DE `profiles`, causa
-- recursão infinita de RLS: é exatamente o bug do DL-014, que já derrubou este
-- banco. Hoje não é usada em lugar nenhum (nem policy, nem app).
-- Marcada para remoção na 0002.
create or replace function public.current_user_role()
returns user_role
language sql
stable
as $function$
  select role from public.profiles where id = auth.uid();
$function$;

-- 3.4 — set_updated_at() — trigger de updated_at. INVOKER, sem search_path.
-- Risco baixo (não consulta tabela), mas será endurecida na 0002.
-- (Corpo abreviado: new.updated_at = now(); return new;)

-- 3.5 — handle_new_user() — versionada em 0001. Cria o profile no signup,
-- lendo o role do metadata. DEFINER + search_path. Ver 0001 para o corpo.

-- 3.6 — admin_list_profiles() — RPC guardada, DEFINER + search_path.
-- Levanta 'not authorized' se o chamador não for admin+master.
-- ⚠️ O app NÃO usa esta função: /api/admin/profiles acessa com SERVICE_ROLE.
-- Duas rotas para a mesma operação (risco R-012).

-- 3.7 — admin_set_user_access(target_user_id, new_role, new_admin_level, new_admin_team)
-- RPC guardada, DEFINER + search_path. Mesmo guard de master.
-- ⚠️ Ao rebaixar de admin, escreve admin_level = 'none'.
-- Já /api/admin/set-access escreve NULL no mesmo caso. É a origem da linha
-- com admin_level NULL encontrada em produção (risco R-012).

-- GRANTS observados:
--   admin_list_profiles, admin_set_user_access → PUBLIC revogado;
--     anon e authenticated com EXECUTE. Ambas se protegem internamente,
--     então não há escalada. `anon` é superfície desnecessária: revogar na 0002.
--   demais funções → PUBLIC com EXECUTE (padrão).


-- ----------------------------------------------------------------------------
-- 4. TRIGGERS
-- ----------------------------------------------------------------------------

-- 4.1 — em auth.users: cria o profile quando a conta nasce
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4.2 — em public.profiles: mantém updated_at
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 5. POLICIES DE profiles (5, todas PERMISSIVE, para o role `authenticated`)
-- ----------------------------------------------------------------------------
-- ⚠️ NÃO EXISTE policy de INSERT: só o trigger insere (DEFINER, ignora RLS).
--    Correto e seguro. Nenhum usuário insere profile direto.
-- ⚠️ NÃO EXISTE policy de DELETE: ninguém apaga nada. Vira bloqueio na F6,
--    quando a exclusão de conta da LGPD entrar.
-- ⚠️ NÃO EXISTE policy que deixe ADMIN COMUM ler profiles: só o dono e o
--    master. O painel admin só funciona hoje porque /api/admin/* usa
--    SERVICE_ROLE, que ignora RLS. O DL-045 exige admin comum na fila de
--    validação, então a 0002 precisa de is_admin() + policies próprias.

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_select_all_master on public.profiles
  for select to authenticated
  using (is_master_admin());

create policy profiles_update_all_master on public.profiles
  for update to authenticated
  using (is_master_admin())
  with check (is_master_admin());

-- ⚠️ SUPERADA pela policy seguinte. Comparação direta `admin_level = (subselect)`
-- resolve para NULL quando os dois lados são NULL, e CHECK que dá NULL é tratado
-- como falso. Resultado: o usuário com admin_level NULL não conseguia editar o
-- próprio perfil. Foi por isso que a `_safe_fields` foi criada.
-- Marcada para remoção na 0002 (é estritamente MENOS permissiva que a outra,
-- e policies permissivas se somam por OU, então removê-la não muda nada).
create policy profiles_update_own_safe on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role        = (select p.role        from public.profiles p where p.id = auth.uid())
    and admin_level = (select p.admin_level from public.profiles p where p.id = auth.uid())
    and admin_team  = (select p.admin_team  from public.profiles p where p.id = auth.uid())
  );

-- ✅ A que de fato vale. Fixa role/admin_level/admin_team nos valores atuais,
-- com COALESCE para tratar NULL corretamente. O dono edita full_name, phone e
-- onboarding_completed, mas NÃO consegue escalar privilégio.
-- Este é o padrão a copiar na 0002 para fixar a coluna `status`.
create policy profiles_update_own_safe_fields on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p2.role from public.profiles p2 where p2.id = auth.uid())
    and coalesce(admin_level, 'none'::admin_level)
        = coalesce((select p2.admin_level from public.profiles p2 where p2.id = auth.uid()), 'none'::admin_level)
    and coalesce(admin_team, 'none'::admin_team)
        = coalesce((select p2.admin_team from public.profiles p2 where p2.id = auth.uid()), 'none'::admin_team)
  );


-- ----------------------------------------------------------------------------
-- 6. STORAGE
-- ----------------------------------------------------------------------------
-- Nenhum bucket existe. O bucket `documentos` é criado na T-002.


-- ----------------------------------------------------------------------------
-- 7. DADOS EM PRODUÇÃO em 26/08/2026 (17 contas, todas de teste ou dos sócios)
-- ----------------------------------------------------------------------------
--   role     admin_level  onboarding_completed  total
--   tutor    none         false                 3
--   tutor    none         true                  5
--   vet      none         true                  3
--   vet      NULL         true                  1   ← origem: /api/admin/set-access
--   clinic   none         true                  3
--   admin    admin        false                 1
--   admin    master       false                 1
--
-- ⚠️ Os 3 vets e 3 clinics com onboarding_completed = true preencheram um
-- onboarding que era CASCA: nenhum dado foi persistido. A 0002 os devolve para
-- onboarding_completed = false + status = 'incomplete' para que refaçam o
-- cadastro de verdade (decisão B, nada é apagado).
