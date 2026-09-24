-- ============================================================================
-- PRÉ-VOO DA MIGRATION 0005 — SOMENTE LEITURA
--
-- Rode ANTES de `migrations/0005_dados_da_busca_e_slug.sql`, UMA CONSULTA POR
-- VEZ (o SQL Editor mostra só o resultado da última). Nenhuma consulta daqui
-- escreve nada: são todas `select`.
--
-- É o item do card T-028: "pré-voo com as linhas de hoje que não batem com as
-- listas novas, e o que se faz com elas decidido antes de aplicar". Anote o
-- que cada consulta devolver no card, no campo Resultado.
--
-- Rode no projeto de TESTE (vetria-e2e) e depois em PRODUÇÃO.
-- ============================================================================


-- ############################################################
-- CONSULTA 0 — o tamanho do que a 0005 vai tocar
-- ############################################################
-- `profissionais_active` é quantas contas vão ganhar slug na aplicação (R-065).
-- `slugs_ja_preenchidos` tem que ser 0: ninguém escrevia slug até hoje.
select
  (select count(*) from public.vet_profiles)                                   as vet_profiles,
  (select count(*) from public.clinic_profiles)                                as clinic_profiles,
  (select count(*) from public.profiles where role in ('vet','clinic')
      and status = 'active')                                                   as profissionais_active,
  (select count(*) from public.profiles where role in ('vet','clinic')
      and status = 'pending_validation')                                       as na_fila,
  (select count(*) from public.vet_profiles where slug is not null)
  + (select count(*) from public.clinic_profiles where slug is not null)       as slugs_ja_preenchidos;


-- ############################################################
-- CONSULTA 1 — a 0004 está aplicada, e ninguém mexeu nas policies de escrita
-- ############################################################
-- Esperado: `checks_da_0004` = 12, `validados` = 12, `admin_definir_status_e_da_0004`
-- = true. E a lista de policies de escrita igual à de baixo, SEM NENHUMA OUTRA:
--   clinic_profiles_insert_own, clinic_profiles_update_admin, clinic_profiles_update_own,
--   vet_profiles_insert_own, vet_profiles_update_admin, vet_profiles_update_own
-- Os `*_own` precisam citar `slug` no WITH CHECK (o dono não escreve o próprio
-- endereço, SEC-008). Se vier outra policy, a migration PARA no pré-voo 1.2.
select
  (select count(*) from pg_constraint
    where conrelid in ('public.vet_profiles'::regclass, 'public.clinic_profiles'::regclass)
      and conname in ('vet_profiles_crmv_uf_valida', 'vet_profiles_estado_valido',
        'vet_profiles_crmv_formato', 'vet_profiles_titulo_lista', 'vet_profiles_experiencia_lista',
        'vet_profiles_textos_teto', 'vet_profiles_especialidades_teto', 'clinic_profiles_estado_valido',
        'clinic_profiles_cep_formato', 'clinic_profiles_textos_teto', 'clinic_profiles_servicos_teto',
        'clinic_profiles_site_http'))                                           as checks_da_0004,
  (select count(*) from pg_constraint
    where conrelid in ('public.vet_profiles'::regclass, 'public.clinic_profiles'::regclass)
      and convalidated
      and conname in ('vet_profiles_crmv_uf_valida', 'vet_profiles_estado_valido',
        'vet_profiles_crmv_formato', 'vet_profiles_titulo_lista', 'vet_profiles_experiencia_lista',
        'vet_profiles_textos_teto', 'vet_profiles_especialidades_teto', 'clinic_profiles_estado_valido',
        'clinic_profiles_cep_formato', 'clinic_profiles_textos_teto', 'clinic_profiles_servicos_teto',
        'clinic_profiles_site_http'))                                           as validados,
  (select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) = '52241257ac30590e445c93e1bc39d09a'
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'admin_definir_status')        as admin_definir_status_e_da_0004,
  (select string_agg(policyname || ' [' || cmd || '] cita slug=' || (coalesce(with_check, '') like '%slug%')::text,
                     ' | ' order by policyname)
     from pg_policies
    where schemaname = 'public' and tablename in ('vet_profiles', 'clinic_profiles')
      and cmd in ('INSERT', 'UPDATE', 'ALL'))                                  as policies_de_escrita;


-- ############################################################
-- CONSULTA 2 — especialidades gravadas FORA da lista nova
-- ############################################################
-- A lista é a do seed da 0005 (cópia de ESPECIALIDADES do campos.ts).
-- Esperado: ZERO linhas. As Actions sempre conferiram contra a mesma lista.
-- Se vier linha: a 0005 aplica mesmo assim (o trigger só confere lista que
-- MUDA), a linha fica como está, e a dona corrige pelo "Rever e corrigir o
-- cadastro". Anote os ids no card. NÃO corrija pelo SQL Editor sem combinar.
select v.id, p.role, p.status, item as especialidade_fora_da_lista
from public.vet_profiles v
join public.profiles p on p.id = v.id
cross join lateral unnest(v.especialidades) as item
where item is null or item not in (
  'Clínica geral', 'Cardiologia', 'Dermatologia', 'Oftalmologia', 'Ortopedia', 'Cirurgia',
  'Anestesiologia', 'Oncologia', 'Animais exóticos', 'Felinos', 'Equinos', 'Comportamento')
order by v.id;


-- ############################################################
-- CONSULTA 3 — serviços gravados FORA da lista nova
-- ############################################################
-- Mesma leitura da consulta 2. Esperado: ZERO linhas.
select c.id, p.role, p.status, item as servico_fora_da_lista
from public.clinic_profiles c
join public.profiles p on p.id = c.id
cross join lateral unnest(c.servicos) as item
where item is null or item not in (
  'Emergência 24h', 'Internação', 'Centro cirúrgico', 'Laboratório', 'Diagnóstico por imagem',
  'Vacinação', 'Banho & tosa', 'Pet shop', 'Farmácia')
order by c.id;


-- ############################################################
-- CONSULTA 4 — listas com item REPETIDO
-- ############################################################
-- O trigger novo também recusa repetição. Esperado: ZERO linhas (as Actions
-- tiram repetido com `new Set`). Mesma decisão da consulta 2 se vier linha.
select 'vet_profiles' as tabela, v.id, v.especialidades::text as lista
from public.vet_profiles v
where cardinality(v.especialidades) <> (select count(distinct x) from unnest(v.especialidades) x)
union all
select 'clinic_profiles', c.id, c.servicos::text
from public.clinic_profiles c
where cardinality(c.servicos) <> (select count(distinct x) from unnest(c.servicos) x);


-- ############################################################
-- CONSULTA 5 — R-065: as contas que vão ganhar slug, e a PRÉVIA do slug
-- ############################################################
-- Uma linha por conta vet/clinic `active`. `previa_do_slug` é a regra do
-- DL-067 calculada aqui à mão (sem o corte em 60/40 caracteres e sem o sufixo
-- de colisão, que só a migration sabe). Confira que nenhum endereço expõe algo
-- que não deveria (é nome público + cidade + UF, os três já públicos na busca).
-- `sem_perfil = true` quer dizer conta active SEM linha de perfil: ela NÃO
-- ganha slug (não há o que mostrar). Esperado: nenhuma.
select
  p.id,
  p.role,
  coalesce(v.nome_exibicao, c.nome_fantasia)           as nome_publico,
  coalesce(v.cidade, c.cidade)                         as cidade,
  coalesce(v.estado, c.estado)                         as uf,
  coalesce(v.slug, c.slug)                             as slug_hoje,
  (v.id is null and c.id is null)                      as sem_perfil,
  concat_ws('-',
    nullif(btrim(regexp_replace(lower(translate(coalesce(v.nome_exibicao, c.nome_fantasia, ''),
      'ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñÝýÿ',
      'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnYyy')), '[^a-z0-9]+', '-', 'g'), '-'), ''),
    nullif(btrim(regexp_replace(lower(translate(coalesce(v.cidade, c.cidade, ''),
      'ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñÝýÿ',
      'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnYyy')), '[^a-z0-9]+', '-', 'g'), '-'), ''),
    lower(coalesce(v.estado, c.estado)))               as previa_do_slug
from public.profiles p
left join public.vet_profiles    v on v.id = p.id and p.role = 'vet'
left join public.clinic_profiles c on c.id = p.id and p.role = 'clinic'
where p.role in ('vet', 'clinic') and p.status = 'active'
order by p.created_at;


-- ############################################################
-- CONSULTA 6 — os nomes que a 0005 cria JÁ EXISTEM?
-- ############################################################
-- Esperado ANTES de aplicar: ZERO linhas. Qualquer linha aqui é objeto criado
-- fora do repo com o mesmo nome (R-006), e a migration para no pré-voo 1.3.
select 'tabela' as tipo, table_name::text as nome
from information_schema.tables
where table_schema = 'public' and table_name in ('especialidades', 'servicos', 'cidades')
union all
select 'funcao', p.oid::regprocedure::text
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('sem_acento', 'chave_de_nome', 'slugificar', 'slug_truncado', 'juntar_textos',
                    'conferir_itens_de_lista', 'gerar_slug_do_perfil', 'slug_ao_ativar')
union all
select 'trigger', tgname::text
from pg_trigger
where tgname in ('trg_vet_profiles_especialidades_da_lista', 'trg_clinic_profiles_servicos_da_lista',
                 'trg_profiles_slug_ao_ativar')
union all
select 'coluna', table_name || '.' || column_name
from information_schema.columns
where table_schema = 'public' and table_name in ('vet_profiles', 'clinic_profiles') and column_name = 'busca'
union all
select 'constraint', conname::text
from pg_constraint
where conname in ('vet_profiles_slug_formato', 'clinic_profiles_slug_formato')
union all
select 'indice', indexname::text
from pg_indexes
where schemaname = 'public'
  and indexname in ('idx_vet_profiles_busca', 'idx_clinic_profiles_busca', 'idx_vet_profiles_local',
                    'idx_clinic_profiles_local', 'idx_cidades_chave_prefixo');


-- ############################################################
-- CONSULTA 7 — o ambiente
-- ############################################################
-- Esperado: `postgres_14_ou_mais` = true e `tem_portuguese` = true. A
-- collation é só para registro (a normalização não depende dela: o acento sai
-- antes do lower).
select
  current_setting('server_version')                                   as versao,
  current_setting('server_version_num')::int >= 140000                as postgres_14_ou_mais,
  exists (select 1 from pg_ts_config where cfgname = 'portuguese')    as tem_portuguese,
  (select datcollate from pg_database where datname = current_database()) as collation;


-- ############################################################
-- CONSULTA 8 — as cidades gravadas hoje (para o R-059)
-- ############################################################
-- Informativo. Depois do seed, a sonda 6 do verificar diz quais destas NÃO
-- casam com um município da UF gravada ("Goiânia / AP", visto em 23/09).
select 'vet' as role, estado, cidade, count(*) as contas
from public.vet_profiles group by estado, cidade
union all
select 'clinic', estado, cidade, count(*)
from public.clinic_profiles group by estado, cidade
order by 1, 2, 3;
