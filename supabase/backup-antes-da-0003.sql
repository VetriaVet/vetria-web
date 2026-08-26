-- ============================================================================
-- BACKUP MANUAL ANTES DA MIGRATION 0003 — SOMENTE LEITURA
--
-- Por que este backup existe e o de antes da 0002 não basta:
-- a 0003 é a primeira migration DESTRUTIVA do projeto. Ela dropa três colunas
-- de `clinic_profiles` (`razao_social`, `cnpj`, `responsavel_tecnico`) depois de
-- copiar o conteúdo para `perfil_privado` (SEC-020 / R-018). Coluna dropada não
-- volta. Se a cópia falhar em silêncio, o dado morre com o DROP.
--
-- Expectativa honesta: estas tabelas devem estar VAZIAS. Os onboardings
-- profissionais são casca (não persistem nada) e a 0002 devolveu os 4 vets e
-- 3 clinics para `incomplete`. Rode assim mesmo. O custo é um minuto, e a
-- QUERY 0 vira a prova de quantas linhas existiam antes: se a QUERY 0 diz 0 e
-- depois aparece gente reclamando de dado perdido, a resposta está aqui.
--
-- ⚠️ O plano é Free. NÃO existe backup automático. O que você salvar é o único.
--
-- Como usar:
--   1. Rode a QUERY 0. Anote os números.
--   2. Rode a QUERY 1 e a QUERY 2. Export → CSV no painel de resultados.
--      Não copie da tela: um caractere errado num UUID corrompe o backup sem
--      que você perceba.
--   3. Salve em `supabase/backups/` como
--      `clinic-e-privado-AAAA-MM-DD-antes-da-0003.sql`.
--      Essa pasta está no .gitignore. Tem CNPJ e nome de pessoa real. Nunca
--      versione.
--   4. Guarde até confirmar, com `verificar-apos-0003.sql`, que a 0003 rodou.
--
-- Rode UMA query por vez: o editor do Supabase mostra só o resultado da última.
-- ============================================================================


-- ############################################################
-- QUERY 0 — estado antes. Anote. É a linha de base da verificação.
-- ############################################################

select
  (select count(*) from public.clinic_profiles) as clinic_profiles,
  (select count(*) from public.clinic_profiles
    where razao_social is not null
       or cnpj is not null
       or responsavel_tecnico is not null)      as com_dado_a_migrar,
  (select count(*) from public.perfil_privado)  as perfil_privado,
  (select count(*) from public.vet_profiles)    as vet_profiles,
  (select count(*) from auth.users)             as contas_auth,
  (select count(*) from public.profiles)        as profiles;


-- ############################################################
-- QUERY 1 — gera os INSERT de restauração de `clinic_profiles`
-- Inclui as três colunas que a 0003 dropa. É o único lugar onde elas
-- sobrevivem se a migration der errado no meio.
-- ############################################################

select
  'insert into public.clinic_profiles (id, slug, nome_fantasia, razao_social, cnpj, responsavel_tecnico, endereco, cep, cidade, estado, sobre, servicos, site, created_at, updated_at) values ('
  || quote_literal(id::text)                             || '::uuid, '
  || coalesce(quote_literal(slug), 'null')               || ', '
  || coalesce(quote_literal(nome_fantasia), 'null')      || ', '
  || coalesce(quote_literal(razao_social), 'null')       || ', '
  || coalesce(quote_literal(cnpj), 'null')               || ', '
  || coalesce(quote_literal(responsavel_tecnico), 'null')|| ', '
  || coalesce(quote_literal(endereco), 'null')           || ', '
  || coalesce(quote_literal(cep), 'null')                || ', '
  || coalesce(quote_literal(cidade), 'null')             || ', '
  || coalesce(quote_literal(estado), 'null')             || ', '
  || coalesce(quote_literal(sobre), 'null')              || ', '
  || quote_literal(servicos::text) || '::text[], '
  || coalesce(quote_literal(site), 'null')               || ', '
  || quote_literal(created_at::text)                     || '::timestamptz, '
  || quote_literal(updated_at::text)                     || '::timestamptz'
  || ');'
  as restore_sql
from public.clinic_profiles
order by created_at;

-- ⚠️ Sem `on conflict do update` de propósito, ao contrário do backup da 0002.
-- Depois da 0003 as colunas `razao_social`, `cnpj` e `responsavel_tecnico` NÃO
-- EXISTEM MAIS em `clinic_profiles`: colar isto de volta sem editar vai falhar,
-- e é para falhar mesmo. Restaurar depois da 0003 significa (a) rodar o bloco
-- de reversão da 0003 primeiro, e só então (b) colar estes INSERTs.


-- ############################################################
-- QUERY 2 — gera os INSERT de restauração de `perfil_privado`
-- A 0003 ACRESCENTA colunas aqui e escreve dentro da tabela. Não dropa nada,
-- mas é onde o dado migrado aterrissa: se a cópia sair torta, o antes está aqui.
-- ############################################################

select
  'insert into public.perfil_privado (id, whatsapp, telefone, email_contato, documento_path, documento_enviado_em, created_at, updated_at) values ('
  || quote_literal(id::text)                              || '::uuid, '
  || coalesce(quote_literal(whatsapp), 'null')            || ', '
  || coalesce(quote_literal(telefone), 'null')            || ', '
  || coalesce(quote_literal(email_contato), 'null')       || ', '
  || coalesce(quote_literal(documento_path), 'null')      || ', '
  || coalesce(quote_literal(documento_enviado_em::text) || '::timestamptz', 'null') || ', '
  || quote_literal(created_at::text)                      || '::timestamptz, '
  || quote_literal(updated_at::text)                      || '::timestamptz'
  || ') on conflict (id) do update set '
  || 'whatsapp = excluded.whatsapp, telefone = excluded.telefone, '
  || 'email_contato = excluded.email_contato, '
  || 'documento_path = excluded.documento_path, '
  || 'documento_enviado_em = excluded.documento_enviado_em;'
  as restore_sql
from public.perfil_privado
order by created_at;


-- ############################################################
-- QUERY 3 — o que este backup NÃO cobre. Leia antes de rodar a 0003.
-- ############################################################
--
-- 1. `auth.users` e `profiles`. A 0003 não os toca. Se ela passar a tocar,
--    este arquivo não basta e o backup da 0002 (Query 1) precisa rodar junto.
-- 2. O bucket `documentos` e os objetos dentro dele. Na data desta migration o
--    bucket está sendo CRIADO: não há objeto para perder. A partir da T-008,
--    qualquer migration que mexa no Storage precisa de um procedimento novo,
--    porque nenhum SQL aqui exporta binário.
-- 3. Nada disso protege contra o DROP rodar e o Export → CSV não ter sido
--    feito. A ordem importa: exporta, confere que o arquivo abriu, só então roda.
