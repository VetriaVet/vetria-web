-- ============================================================================
-- BACKUP MANUAL ANTES DA MIGRATION 0004 — SOMENTE LEITURA
--
-- O que a 0004 muda, e por isso o que este backup guarda:
--   · NENHUM dado de usuário é alterado. Ela acrescenta CHECKs (NOT VALID),
--     troca a expressão de três policies e reescreve duas funções.
--   · O que não volta sozinho, se der errado, é o CORPO DAS FUNÇÕES como está
--     em PRODUÇÃO. A seção 10 da 0004 restaura o corpo do REPO (0002); se o
--     corpo real for outro, é daqui (CONSULTA 3) que ele volta.
--   · As tabelas de perfil entram mesmo assim (CONSULTAS 1 e 2). O custo é um
--     minuto, e "a 0004 não mexe em dado" é afirmação que se prova tendo o
--     antes guardado, não repetindo a frase.
--
-- ⚠️ O plano é Free. NÃO existe backup automático. O que você salvar é o único.
--
-- Como usar:
--   1. Rode a QUERY 0. Anote os números no card da T-027.
--   2. Rode as QUERIES 1, 2, 3 e 4. Em cada uma, Export → CSV no painel de
--      resultados. Não copie da tela: um caractere errado num UUID corrompe o
--      backup sem que ninguém perceba.
--   3. Salve em `supabase/backups/` como
--      `perfis-e-funcoes-AAAA-MM-DD-antes-da-0004-<teste|producao>.csv`.
--      A pasta está no .gitignore. Tem CRMV, nome e cidade de gente real.
--      Nunca versione.
--   4. Guarde até o `verificar-apos-0004.sql` sair verde.
--
-- Rode UMA query por vez: o editor mostra só o resultado da última.
-- ============================================================================


-- ############################################################
-- QUERY 0 — estado antes. Anote. É a linha de base da verificação.
-- ############################################################
select
  (select count(*) from public.vet_profiles)                        as vet_profiles,
  (select count(*) from public.clinic_profiles)                     as clinic_profiles,
  (select count(*) from public.perfil_privado)                      as perfil_privado,
  (select count(*) from public.profiles)                            as profiles,
  (select count(*) from auth.users)                                 as contas_auth,
  (select count(*) from public.audit_logs)                          as audit_logs,
  (select count(*) from public.profiles
    where role in ('vet','clinic') and status = 'pending_validation') as na_fila;


-- ############################################################
-- QUERY 1 — gera os INSERT de restauração de `vet_profiles`
-- ############################################################
-- `on conflict do update` porque, se um dia for preciso restaurar, a linha
-- provavelmente ainda existe. ⚠️ Colar isto de volta DEPOIS da 0004 com um
-- valor fora da regra nova (o CRMV "GO-0155", por exemplo) FALHA no CHECK, e
-- é para falhar: restaurar dado fora da regra exige reverter a 0004 antes
-- (seção 10 dela). ⚠️ E o UPDATE dispara o trigger de revalidação: rodando
-- como postgres, conta `active` com CRMV diferente volta para a fila.
select
  'insert into public.vet_profiles (id, slug, nome_exibicao, titulo, crmv, crmv_uf, especialidades, experiencia, bio, cidade, estado, bairro, atende_presencial, atende_domiciliar, atende_teleorientacao, created_at, updated_at) values ('
  || quote_literal(id::text)                        || '::uuid, '
  || coalesce(quote_literal(slug), 'null')          || ', '
  || coalesce(quote_literal(nome_exibicao), 'null') || ', '
  || coalesce(quote_literal(titulo), 'null')        || ', '
  || coalesce(quote_literal(crmv), 'null')          || ', '
  || coalesce(quote_literal(crmv_uf), 'null')       || ', '
  || quote_literal(especialidades::text)            || '::text[], '
  || coalesce(quote_literal(experiencia), 'null')   || ', '
  || coalesce(quote_literal(bio), 'null')           || ', '
  || coalesce(quote_literal(cidade), 'null')        || ', '
  || coalesce(quote_literal(estado), 'null')        || ', '
  || coalesce(quote_literal(bairro), 'null')        || ', '
  || atende_presencial::text                        || ', '
  || atende_domiciliar::text                        || ', '
  || atende_teleorientacao::text                    || ', '
  || quote_literal(created_at::text)                || '::timestamptz, '
  || quote_literal(updated_at::text)                || '::timestamptz'
  || ') on conflict (id) do update set '
  || 'nome_exibicao = excluded.nome_exibicao, titulo = excluded.titulo, crmv = excluded.crmv, '
  || 'crmv_uf = excluded.crmv_uf, especialidades = excluded.especialidades, '
  || 'experiencia = excluded.experiencia, bio = excluded.bio, cidade = excluded.cidade, '
  || 'estado = excluded.estado, bairro = excluded.bairro, '
  || 'atende_presencial = excluded.atende_presencial, atende_domiciliar = excluded.atende_domiciliar, '
  || 'atende_teleorientacao = excluded.atende_teleorientacao;'
  as restore_sql
from public.vet_profiles
order by created_at;


-- ############################################################
-- QUERY 2 — gera os INSERT de restauração de `clinic_profiles`
-- ############################################################
-- As três colunas de identificação já não moram aqui desde a 0003.
select
  'insert into public.clinic_profiles (id, slug, nome_fantasia, endereco, cep, cidade, estado, sobre, servicos, site, created_at, updated_at) values ('
  || quote_literal(id::text)                        || '::uuid, '
  || coalesce(quote_literal(slug), 'null')          || ', '
  || coalesce(quote_literal(nome_fantasia), 'null') || ', '
  || coalesce(quote_literal(endereco), 'null')      || ', '
  || coalesce(quote_literal(cep), 'null')           || ', '
  || coalesce(quote_literal(cidade), 'null')        || ', '
  || coalesce(quote_literal(estado), 'null')        || ', '
  || coalesce(quote_literal(sobre), 'null')         || ', '
  || quote_literal(servicos::text)                  || '::text[], '
  || coalesce(quote_literal(site), 'null')          || ', '
  || quote_literal(created_at::text)                || '::timestamptz, '
  || quote_literal(updated_at::text)                || '::timestamptz'
  || ') on conflict (id) do update set '
  || 'nome_fantasia = excluded.nome_fantasia, endereco = excluded.endereco, cep = excluded.cep, '
  || 'cidade = excluded.cidade, estado = excluded.estado, sobre = excluded.sobre, '
  || 'servicos = excluded.servicos, site = excluded.site;'
  as restore_sql
from public.clinic_profiles
order by created_at;


-- ############################################################
-- QUERY 3 — o CORPO REAL das duas funções que a 0004 sobrescreve
-- ############################################################
-- ⚠️ ESTA É A QUERY QUE IMPORTA. É o único lugar onde o corpo que está em
-- produção sobrevive se ele NÃO for o da 0002 (o pré-voo 1.1 da 0004 aborta
-- nesse caso, mas o backup é de antes de você saber). Cada linha de
-- `restore_sql` é um `create or replace` inteiro, pronto para colar.
select p.proname as funcao,
       pg_get_functiondef(p.oid) as restore_sql
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('admin_definir_status', 'concluir_onboarding_profissional')
order by p.proname;


-- ############################################################
-- QUERY 4 — as três policies que a 0004 troca, como `alter policy`
-- ############################################################
-- Esperado: as três com `using (is_admin())`. Se vier outra coisa, o pré-voo
-- 1.2 da 0004 aborta, e esta linha é o que você cola para voltar.
select policyname,
       format('alter policy %I on public.%I using (%s);', policyname, tablename, qual) as restore_sql
from pg_policies
where schemaname = 'public'
  and policyname in ('vet_profiles_select_admin', 'clinic_profiles_select_admin', 'perfil_privado_select_admin')
order by policyname;


-- ############################################################
-- O QUE ESTE BACKUP NÃO COBRE. Leia antes de rodar a 0004.
-- ############################################################
-- 1. `perfil_privado`, `profiles` e `audit_logs`: a 0004 não escreve nelas na
--    aplicação. Ela passa a escrever `profiles` e `audit_logs` só quando um
--    admin decide (como já acontecia). O backup de `profiles` mais recente é o
--    de antes da 0002.
-- 2. O bucket `documentos`: a 0004 só LÊ `storage.objects`. Nenhum SQL aqui
--    exporta binário, e nada no bucket é tocado.
-- 3. A ordem importa: exporta, confere que o CSV abriu, só então roda a 0004.
