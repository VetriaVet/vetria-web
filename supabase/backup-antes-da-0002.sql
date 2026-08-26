-- ============================================================================
-- BACKUP MANUAL ANTES DA MIGRATION 0002 — SOMENTE LEITURA
--
-- Contexto: o banco tem UMA tabela (`profiles`) com 17 linhas. A 0002 não toca
-- em `auth.users`, que é onde as contas de verdade vivem. Então o que precisa
-- ser preservado cabe aqui.
--
-- Como usar:
--   1. Rode a QUERY 1 no SQL Editor.
--   2. Copie a coluna de resultado inteira (ou Export → CSV).
--   3. Cole num arquivo local, fora do repositório. NÃO commite: tem dado
--      pessoal (nome e telefone de pessoas reais).
--   4. Guarde até confirmar que a 0002 rodou bem.
--
-- Para restaurar, se precisar: rode a QUERY 2 e depois cole os INSERTs salvos.
-- ============================================================================


-- ############################################################
-- QUERY 1 — gera os INSERT de restauração de `profiles`
-- ############################################################

select
  'insert into public.profiles (id, role, full_name, phone, onboarding_completed, created_at, updated_at, admin_level, admin_team) values ('
  || quote_literal(id::text)          || '::uuid, '
  || quote_literal(role::text)        || '::user_role, '
  || coalesce(quote_literal(full_name), 'null') || ', '
  || coalesce(quote_literal(phone), 'null')     || ', '
  || onboarding_completed             || ', '
  || quote_literal(created_at::text)  || '::timestamptz, '
  || quote_literal(updated_at::text)  || '::timestamptz, '
  || coalesce(quote_literal(admin_level::text) || '::admin_level', 'null') || ', '
  || coalesce(quote_literal(admin_team::text)  || '::admin_team',  'null')
  || ') on conflict (id) do update set '
  || 'role = excluded.role, full_name = excluded.full_name, phone = excluded.phone, '
  || 'onboarding_completed = excluded.onboarding_completed, '
  || 'admin_level = excluded.admin_level, admin_team = excluded.admin_team;'
  as restore_sql
from public.profiles
order by created_at;


-- ############################################################
-- QUERY 2 — confere que as contas continuam de pé (rode DEPOIS da 0002)
-- Os totais têm que bater com os de antes: 17 contas no total.
-- ############################################################

select
  (select count(*) from auth.users)      as contas_auth,
  (select count(*) from public.profiles) as profiles;

-- E a distribuição por status, que é o que a 0002 muda:
--   esperado depois da 0002:
--     tutor  → active (8)
--     admin  → active (2)
--     vet    → incomplete (4)   ← voltaram pra refazer o onboarding
--     clinic → incomplete (3)   ← idem
select role, status, onboarding_completed, count(*) as total
from public.profiles
group by role, status, onboarding_completed
order by role, status;
