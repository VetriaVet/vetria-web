-- ============================================================================
-- BACKUP MANUAL ANTES DA MIGRATION 0006 — SOMENTE LEITURA
--
-- O que a 0006 muda, e por isso o que este backup guarda:
--   · `contatos`: coluna nova, CHECK trocado, privilégio por coluna. NÃO muda
--     valor de linha nenhuma (e a tabela deve estar vazia: pré-voo, consulta 0).
--   · `gerar_slug_do_perfil` e `slug_ao_ativar`: REESCRITAS. O corpo de antes
--     está na 0005 do repo, e a QUERY 3 o guarda como está NO BANCO (se o
--     pré-voo 1.1 passou, é o mesmo).
--   · `vet_profiles` / `clinic_profiles`: ganham um trigger. NENHUM slug muda.
--     A QUERY 2 guarda os slugs de hoje para provar isso depois.
--
-- ⚠️ Se o plano for Free, NÃO existe backup automático. O que você salvar é o
-- único.
--
-- Como usar:
--   1. Rode a QUERY 0. Anote os números no card da T-039.
--   2. Rode as QUERIES 1 a 4, UMA POR VEZ. Em cada uma, Export → CSV no painel
--      de resultados. Não copie da tela.
--   3. Salve em `supabase/backups/` como
--      `AAAA-MM-DD-antes-da-0006-<teste|producao>-<n>.csv`.
--      A pasta está no .gitignore. A QUERY 1 pode ter `anon_id` (identificador
--      de navegador, dado pessoal). Nunca versione.
--   4. Guarde até o `verificar-apos-0006.sql` sair verde.
-- ============================================================================


-- ############################################################
-- QUERY 0 — estado antes. Anote.
-- ############################################################
select
  (select count(*) from public.contatos)                            as contatos,
  (select count(*) from public.vet_profiles where slug is not null)  as vets_com_slug,
  (select count(*) from public.clinic_profiles where slug is not null) as clinics_com_slug,
  (select count(*) from pg_trigger t
    where t.tgrelid in ('public.contatos'::regclass, 'public.vet_profiles'::regclass,
                        'public.clinic_profiles'::regclass, 'public.profiles'::regclass)
      and not t.tgisinternal)                                       as triggers_nas_quatro_tabelas;


-- ############################################################
-- QUERY 1 — contatos inteira (esperado: vazia)
-- ############################################################
select id, profissional_id, user_id, anon_id, canal, origem_cidade, origem_especialidade, created_at
from public.contatos
order by created_at;


-- ############################################################
-- QUERY 2 — os slugs de hoje (a 0006 não muda nenhum)
-- ############################################################
select 'vet' as tipo, id, slug, updated_at from public.vet_profiles
union all
select 'clinic', id, slug, updated_at from public.clinic_profiles
order by 1, 3;


-- ############################################################
-- QUERY 3 — o corpo das duas funções que a 0006 reescreve, como estão
-- ############################################################
-- Uma linha por linha de código, para não truncar no editor (o padrão do
-- `introspect-funcoes.sql`). É o que se recria na reversão se o corpo do
-- banco for diferente do da 0005 (não deveria: o pré-voo 1.1 confere).
select p.proname as funcao, l.n as linha, l.texto
from pg_proc p
join pg_namespace ns on ns.oid = p.pronamespace
cross join lateral regexp_split_to_table(pg_get_functiondef(p.oid), E'\n') with ordinality as l(texto, n)
where ns.nspname = 'public' and p.proname in ('gerar_slug_do_perfil', 'slug_ao_ativar')
order by 1, 2;


-- ############################################################
-- QUERY 4 — os privilégios, constraints e triggers de contatos, como estão
-- ############################################################
select 'grant_tabela' as tipo, grantee::text as quem, privilege_type::text as o_que
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'contatos'
union all
select 'grant_coluna', grantee::text, column_name || ': ' || privilege_type
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'contatos'
  and grantee in ('anon', 'authenticated')
union all
select 'constraint', conname::text, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.contatos'::regclass
union all
select 'trigger', t.tgrelid::regclass::text || '.' || t.tgname, pg_get_triggerdef(t.oid)
from pg_trigger t
where t.tgrelid in ('public.contatos'::regclass, 'public.vet_profiles'::regclass, 'public.clinic_profiles'::regclass)
  and not t.tgisinternal
order by 1, 2, 3;
