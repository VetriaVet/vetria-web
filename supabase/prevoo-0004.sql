-- ============================================================================
-- PRÉ-VOO DA MIGRATION 0004 — SOMENTE LEITURA
--
-- Rode ANTES de `migrations/0004_banco_recusa_o_que_a_action_recusa.sql`, uma
-- consulta por vez (o SQL Editor mostra o resultado da última que devolve
-- linha). NENHUMA consulta daqui escreve nada: são todas `select`.
--
-- É também o item 1 do "Feito quando" da T-027: "antes da primeira linha de
-- SQL, os `select` que a auditoria não conseguiu fazer, registrados". Anote o
-- que cada consulta devolver no card, no campo Resultado.
--
-- Rode no projeto de TESTE (vetria-e2e) e em PRODUÇÃO. Em teste quase tudo vem
-- vazio, e isso é esperado.
-- ============================================================================


-- ############################################################
-- CONSULTA 0 — o tamanho do que a 0004 vai tocar
-- ############################################################
-- A 0004 não altera dado nenhum; isto é a linha de base para a verificação.
select
  (select count(*) from public.vet_profiles)                                   as vet_profiles,
  (select count(*) from public.clinic_profiles)                                as clinic_profiles,
  (select count(*) from public.perfil_privado)                                 as perfil_privado,
  (select count(*) from public.profiles where role in ('vet','clinic')
      and status = 'pending_validation')                                       as na_fila,
  (select count(*) from public.profiles where role in ('vet','clinic')
      and status = 'active')                                                   as profissionais_active,
  (select count(*) from public.profiles where role in ('vet','clinic')
      and status = 'incomplete')                                               as profissionais_incomplete,
  (select count(*) from public.profiles where role = 'admin')                  as admins;


-- ############################################################
-- CONSULTA 1 — as duas funções que a 0004 SOBRESCREVE (SEC-2026-09-23-T024,
-- "Não consegui verificar", item 1)
-- ############################################################
-- Esperado, ANTES de aplicar a 0004:
--   admin_definir_status              bate_com_0002 = true
--   concluir_onboarding_profissional  bate_com_0002 = true
--   as duas com definer = true e search_path = {search_path=public}
-- Se `bate_com_0002` vier false: a função em produção não é a do repo. É
-- exatamente o que o pré-voo 1.1 da migration vai recusar. Leia o corpo pela
-- CONSULTA 1B e compare com `0002_nucleo.sql:668-759` antes de qualquer coisa.
-- (Depois de aplicar, `bate_com_0004` passa a true e `bate_com_0002` a false.)
select
  p.proname                                                           as funcao,
  p.prosecdef                                                         as definer,
  p.proconfig                                                         as config,
  md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))              as md5_sem_espacos,
  md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))
    = case p.proname
        when 'admin_definir_status'             then '51f27f5c43ca5c48aea0a3a21850cad2'
        when 'concluir_onboarding_profissional' then '0be00dee7bb30fddae30e7fde73293e0'
      end                                                             as bate_com_0002,
  md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))
    = case p.proname
        when 'admin_definir_status'             then '52241257ac30590e445c93e1bc39d09a'
        when 'concluir_onboarding_profissional' then '542d156b7723946d987647491dcfde13'
      end                                                             as bate_com_0004
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('admin_definir_status', 'concluir_onboarding_profissional')
order by p.proname;


-- ############################################################
-- CONSULTA 1B — o corpo de admin_definir_status, linha a linha
-- ############################################################
-- `pg_get_functiondef` inteiro trunca no editor. Aqui ele sai uma linha por
-- registro, na ordem. Troque o nome para ler a outra função.
select n as linha, texto
from regexp_split_to_table(
       pg_get_functiondef('public.admin_definir_status(uuid, public.user_status, text)'::regprocedure),
       E'\n'
     ) with ordinality as t(texto, n)
order by n;


-- ############################################################
-- CONSULTA 2 — as policies das quatro tabelas (card T-027, item 1)
-- ############################################################
-- Esperado ANTES de aplicar, conferido contra a 0002 §6 e §7:
--   clinic_profiles  select_publico  perfil_esta_ativo(id, 'clinic'::user_role)
--   clinic_profiles  select_own      (id = auth.uid())
--   clinic_profiles  select_admin    is_admin()
--   clinic_profiles  insert_own, update_own, update_admin
--   perfil_privado   select_own, select_admin (is_admin()), insert_own, update_own
--   vet_profiles     o mesmo desenho de clinic_profiles
--   profiles         select_own, select_all_master, select_admin,
--                    update_all_master, update_own_safe_fields
-- ⚠️ QUALQUER policy a mais de SELECT (ou ALL) em vet_profiles, clinic_profiles
-- ou perfil_privado faz o pré-voo 1.2 da migration abortar. Isso é o certo:
-- policy permissiva se soma por OU, e uma policy desconhecida reabriria por
-- trás o que a 0004 fecha pela frente.
select tablename, policyname, cmd, roles, permissive, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('vet_profiles', 'clinic_profiles', 'profiles', 'perfil_privado')
order by tablename, cmd, policyname;


-- ############################################################
-- CONSULTA 3 — documento na linha, sem objeto no bucket (SEC-098; relatório
-- da T-024, "Não consegui verificar", item 3)
-- ############################################################
-- Lista as contas cuja linha APONTA para um documento que NÃO está no bucket.
-- Depois da 0004, uma conta `incomplete` nessa situação não conclui mais o
-- onboarding: a RPC recusa com 55000 e a tela manda reenviar o documento.
-- Quem já está `pending_validation` não é afetado (a RPC só age na conclusão),
-- mas o admin vai ver "Documento não encontrado no armazenamento" ao abrir.
-- Esperado hoje: zero linha. Se vier linha, anote os ids no card.
select pp.id, pr.role, pr.status, pp.documento_enviado_em
from public.perfil_privado pp
join public.profiles pr on pr.id = pp.id
left join storage.objects o
  on o.bucket_id = 'documentos' and o.name = pp.documento_path
where pp.documento_path is not null
  and o.id is null
order by pp.documento_enviado_em;


-- ############################################################
-- CONSULTA 4 — ⚠️ AS LINHAS QUE VIOLARIAM CADA CHECK NOVO
-- ############################################################
-- Uma linha por (CHECK, conta, coluna). Zero linha = todos os CHECKs nascem
-- validados. Linha aqui NÃO impede a migration (os CHECKs nascem NOT VALID,
-- ver a decisão no topo da 0004): quer dizer que aquele CHECK vai ficar
-- `NOT VALID` até a linha ser corrigida.
--
-- ⚠️ ESPERADO EM PRODUÇÃO, pelo que a fila mostrou em 23/09:
--   vet_profiles_crmv_formato   duas contas de teste, com "GO-0155" e "GO 1522"
-- E o que NÃO deve aparecer, e por quê:
--   crmv_uf AL e AC             são UFs válidas. Estão erradas em relação ao
--                               número ("GO-0155" com UF AL), mas UF válida é o
--                               que o CHECK confere. O número é que é pego.
--   Goiânia com estado AP       cidade não é conferida contra UF: precisa da
--                               tabela de cidades, que é da T-028 (R-059).
--                               AP é UF válida. Não aparece aqui, e não é
--                               esquecimento.
-- `valor` mostra o conteúdo para CRMV, UF, título, experiência, CEP e site (o
-- que a própria tela do admin já mostra), e só o TAMANHO para os textos livres.
select * from (
  select 'vet_profiles_crmv_uf_valida' as check_novo, id, 'crmv_uf' as coluna, crmv_uf as valor
  from public.vet_profiles
  where not (crmv_uf is null or crmv_uf in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))

  union all
  select 'vet_profiles_estado_valido', id, 'estado', estado
  from public.vet_profiles
  where not (estado is null or estado in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))

  union all
  select 'vet_profiles_crmv_formato', id, 'crmv', crmv
  from public.vet_profiles
  where not (crmv is null or crmv ~ '^[0-9]{1,6}$')

  union all
  select 'vet_profiles_titulo_lista', id, 'titulo', titulo
  from public.vet_profiles
  where not (titulo is null or titulo in ('mv', 'dr', 'me', 'esp'))

  union all
  select 'vet_profiles_experiencia_lista', id, 'experiencia', experiencia
  from public.vet_profiles
  where not (experiencia is null or experiencia in ('lt1', '1a3', '3a5', '5a10', 'gt10'))

  union all
  select 'vet_profiles_textos_teto', id, c.coluna, format('%s caracteres (teto %s)', c.tamanho, c.teto)
  from public.vet_profiles v
  cross join lateral (values
    ('nome_exibicao', char_length(v.nome_exibicao), 120),
    ('cidade',        char_length(v.cidade),        80),
    ('bairro',        char_length(v.bairro),        200),
    ('bio',           char_length(v.bio),           500)
  ) as c(coluna, tamanho, teto)
  where c.tamanho > c.teto

  union all
  select 'vet_profiles_especialidades_teto', id, 'especialidades',
         format('%s itens, %s caracteres somados (tetos 4 e 240)',
                cardinality(especialidades), char_length(array_to_string(especialidades, '')))
  from public.vet_profiles
  where not (cardinality(especialidades) <= 4
             and char_length(array_to_string(especialidades, '')) <= 240)

  union all
  select 'clinic_profiles_estado_valido', id, 'estado', estado
  from public.clinic_profiles
  where not (estado is null or estado in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))

  union all
  select 'clinic_profiles_cep_formato', id, 'cep', cep
  from public.clinic_profiles
  where not (cep is null or cep ~ '^[0-9]{8}$')

  union all
  select 'clinic_profiles_textos_teto', id, c.coluna, format('%s caracteres (teto %s)', c.tamanho, c.teto)
  from public.clinic_profiles k
  cross join lateral (values
    ('nome_fantasia', char_length(k.nome_fantasia), 120),
    ('endereco',      char_length(k.endereco),      200),
    ('cidade',        char_length(k.cidade),        80),
    ('sobre',         char_length(k.sobre),         600)
  ) as c(coluna, tamanho, teto)
  where c.tamanho > c.teto

  union all
  select 'clinic_profiles_servicos_teto', id, 'servicos',
         format('%s itens, %s caracteres somados (tetos 9 e 400)',
                cardinality(servicos), char_length(array_to_string(servicos, '')))
  from public.clinic_profiles
  where not (cardinality(servicos) <= 9
             and char_length(array_to_string(servicos, '')) <= 400)

  union all
  select 'clinic_profiles_site_http', id, 'site', left(site, 80)
  from public.clinic_profiles
  where not (site is null
             or (char_length(site) <= 300
                 and site ~* '^https?://[^[:space:][:cntrl:]"<>\\/?#]+([/?#][^[:space:][:cntrl:]"<>\\]*)?$'))
) violacoes
order by check_novo, id;


-- ############################################################
-- CONSULTA 5 — quem é admin hoje (relatório da T-024, item 5)
-- ############################################################
-- A SEC-096 e a SEC-097 têm trava "antes do primeiro admin comum que não seja
-- o Elber". Esta consulta diz se esse dia já chegou. E a sonda 3 do verificar
-- precisa de uma conta `admin` para se passar por admin comum e por master.
select p.id, p.admin_level, p.full_name, p.created_at
from public.profiles p
where p.role = 'admin'
order by p.created_at;


-- ############################################################
-- CONSULTA 6 — as condições que o pré-voo 1.3 e 1.4 da migration exigem
-- ############################################################
-- Esperado: as quatro colunas true. Qualquer false faz a migration abortar
-- (e é melhor saber aqui, com calma).
select
  has_table_privilege(current_user, 'storage.objects', 'SELECT')   as le_storage_objects_TEM_QUE_SER_true,
  exists (select 1 from storage.buckets where id = 'documentos')    as bucket_documentos_existe_TEM_QUE_SER_true,
  (select bool_and(p.prosecdef)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('is_admin', 'is_master_admin'))
                                                                    as is_admin_e_master_definer_TEM_QUE_SER_true,
  current_user = 'postgres'                                         as rodando_como_postgres_TEM_QUE_SER_true;
