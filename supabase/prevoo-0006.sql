-- ============================================================================
-- PRÉ-VOO DA MIGRATION 0006 — SOMENTE LEITURA
--
-- Rode ANTES de `migrations/0006_contato_registrado_e_slug_protegido.sql`,
-- UMA CONSULTA POR VEZ (o SQL Editor mostra só o resultado da última).
-- Nenhuma consulta daqui escreve nada: são todas `select`.
--
-- Anote o que cada consulta devolver no card T-039, no campo Resultado.
-- Rode no projeto de TESTE (vetria-e2e) e depois em PRODUÇÃO.
-- ============================================================================


-- ############################################################
-- CONSULTA 0 — o tamanho do que a 0006 vai tocar
-- ############################################################
-- `contatos_linhas` tem que ser 0: nada grava em `contatos` até a T-040. Se
-- vier outro número, alguém gravou por fora (R-006): PARE e descubra quem.
-- `active_sem_whatsapp` é informativo (D9): são os perfis que, depois da
-- T-041, vão mostrar "ainda não informou WhatsApp" em vez do botão.
-- `active_sem_perfil` tem que ser 0: conta assim é a da SEC-116; a 0006 não
-- a derruba (o `raise` só vale para quem VIRA active daqui em diante).
select
  (select count(*) from public.contatos)                                      as contatos_linhas,
  (select count(*) from public.profiles
    where role in ('vet', 'clinic') and status = 'active')                    as profissionais_active,
  (select count(*) from public.profiles p
    left join public.perfil_privado pp on pp.id = p.id
    where p.role in ('vet', 'clinic') and p.status = 'active'
      and nullif(btrim(pp.whatsapp), '') is null)                             as active_sem_whatsapp,
  (select count(*) from public.profiles p
    where p.status = 'active'
      and ((p.role = 'vet'    and not exists (select 1 from public.vet_profiles v where v.id = p.id))
        or (p.role = 'clinic' and not exists (select 1 from public.clinic_profiles c where c.id = p.id)))) as active_sem_perfil,
  (select count(*) from public.profiles where role = 'tutor')                 as responsaveis,
  (select count(*) from public.profiles)                                      as contas;


-- ############################################################
-- CONSULTA 1 — a 0005 está aplicada, e as duas funções que a 0006 reescreve
--              são as do repo
-- ############################################################
-- Esperado: `tabelas_da_0005` = 3, `trigger_slug_ao_ativar` = true e as duas
-- linhas de hash = true. Hash diferente = alguém editou a função fora do repo
-- (R-006): a migration PARA no pré-voo 1.1. Leia o corpo com a QUERY 2 do
-- `introspect-funcoes.sql` antes de decidir qualquer coisa.
select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name in ('especialidades', 'servicos', 'cidades'))  as tabelas_da_0005,
  exists (select 1 from pg_trigger where tgname = 'trg_profiles_slug_ao_ativar' and not tgisinternal) as trigger_slug_ao_ativar,
  (select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) = '8aca1eb4e4a72bd79ffc175938df18e8'
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'gerar_slug_do_perfil')                          as gerar_slug_e_da_0005,
  (select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) = '0b6c06345e6bd0ce493b0cecc8a52b5c'
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'slug_ao_ativar')                                as slug_ao_ativar_e_da_0005;


-- ############################################################
-- CONSULTA 2 — `contatos` como a 0002 a deixou
-- ############################################################
-- Esperado:
--   colunas   = anon_id,canal,created_at,id,origem_cidade,origem_especialidade,profissional_id,user_id
--   policies  = contatos_select_admin [SELECT] | contatos_select_profissional [SELECT] | contatos_select_responsavel [SELECT]
--   checks    = contatos_tem_origem
--   rls       = true
--   authenticated_select_na_tabela = true   (é o que a 0006 fecha, R-074)
--   authenticated_escreve          = false  (a 0002 revogou)
-- Policy a mais (de INSERT, principalmente) = a migration PARA no pré-voo 1.2.
select
  (select string_agg(column_name::text, ',' order by column_name) from information_schema.columns
    where table_schema = 'public' and table_name = 'contatos')                 as colunas,
  (select string_agg(policyname || ' [' || cmd || ']', ' | ' order by policyname) from pg_policies
    where schemaname = 'public' and tablename = 'contatos')                    as policies,
  (select string_agg(conname, ', ' order by conname) from pg_constraint
    where conrelid = 'public.contatos'::regclass and contype = 'c')            as checks,
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'contatos')                     as rls,
  has_table_privilege('authenticated', 'public.contatos', 'SELECT')            as authenticated_select_na_tabela,
  has_table_privilege('authenticated', 'public.contatos', 'INSERT,UPDATE,DELETE') as authenticated_escreve,
  has_table_privilege('anon', 'public.contatos', 'SELECT')                     as anon_select_na_tabela;


-- ############################################################
-- CONSULTA 3 — os nomes que a 0006 cria JÁ EXISTEM?
-- ############################################################
-- Esperado ANTES de aplicar: ZERO linhas. Qualquer linha aqui é objeto criado
-- fora do repo com o mesmo nome (R-006), e a migration para no pré-voo 1.3
-- (funções) ou o reaproveita em silêncio (índice, trigger): descubra antes.
select 'funcao' as tipo, p.oid::regprocedure::text as nome
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('registrar_contato', 'vincular_contatos_do_visitante', 'proteger_slug', 'anonimizar_contato')
union all
select 'trigger', tgname::text
from pg_trigger
where tgname in ('trg_contatos_anonimizar', 'trg_vet_profiles_slug_protegido', 'trg_clinic_profiles_slug_protegido')
union all
select 'coluna', 'contatos.' || column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'contatos' and column_name = 'anonimizado_em'
union all
select 'constraint', conname::text
from pg_constraint
where conname = 'contatos_tem_origem_ou_anonimizado'
union all
select 'indice', indexname::text
from pg_indexes
where schemaname = 'public' and indexname in ('idx_contatos_anon_recentes', 'idx_contatos_user_recentes');


-- ############################################################
-- CONSULTA 4 — os slugs de hoje (a 0006 NÃO muda nenhum; é o "antes")
-- ############################################################
-- Esperado: `active_sem_slug` = 0 (a 0005 preencheu) e `slug_fora_do_formato`
-- = 0. Depois da 0006, ninguém além do gerador e do master troca estes
-- valores: conferir que eles estão certos ANTES é o que importa.
select
  (select count(*) from public.profiles p
    left join public.vet_profiles v on v.id = p.id
    left join public.clinic_profiles c on c.id = p.id
    where p.status = 'active'
      and ((p.role = 'vet' and v.id is not null and v.slug is null)
        or (p.role = 'clinic' and c.id is not null and c.slug is null)))       as active_sem_slug,
  (select count(*) from (select slug from public.vet_profiles union all select slug from public.clinic_profiles) s
    where s.slug is not null and s.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$')        as slug_fora_do_formato,
  (select count(*) from public.vet_profiles where slug is not null)            as vets_com_slug,
  (select count(*) from public.clinic_profiles where slug is not null)         as clinics_com_slug;


-- ############################################################
-- CONSULTA 5 — o ambiente
-- ############################################################
-- Esperado: `postgres_14_ou_mais` = true, `service_role_existe` = true e
-- `posso_assumir_service_role` = true (a sonda 2 do verificar se passa pelo
-- servidor; sem isto ela diz SONDA INVALIDA na linha 0, e a migration em si
-- não depende disto). `papel_atual` tem que ser `postgres`.
select
  current_setting('server_version')                                    as versao,
  current_setting('server_version_num')::int >= 140000                 as postgres_14_ou_mais,
  exists (select 1 from pg_roles where rolname = 'service_role')       as service_role_existe,
  pg_has_role(current_user, 'service_role', 'MEMBER')                  as posso_assumir_service_role,
  current_user                                                         as papel_atual;


-- ############################################################
-- CONSULTA 6 — contas para a sonda 2 do verificar
-- ############################################################
-- Informativo. A sonda 2 precisa de 1 vet, 1 clinic, 1 tutor e 1 admin; os
-- casos 21 a 25 (limites) precisam de 4, 5 e 20 OUTRAS contas (qualquer
-- papel). Com menos, eles saem NAO MEDIDO: anote.
select role, count(*) as contas
from public.profiles
group by role
order by role;
