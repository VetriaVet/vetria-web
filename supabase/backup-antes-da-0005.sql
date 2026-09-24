-- ============================================================================
-- BACKUP MANUAL ANTES DA MIGRATION 0005 — SOMENTE LEITURA
--
-- O que a 0005 muda em dado que já existe, e por isso o que este backup guarda:
--   · `slug` e `updated_at` das contas vet/clinic `active` (a seção 5.4
--     preenche o slug; o trigger da 0002 carimba o updated_at). É a ÚNICA
--     escrita em linha de usuário.
--   · Ela acrescenta a coluna gerada `busca` em vet_profiles e clinic_profiles
--     (reescreve a tabela, sem mudar valor de coluna nenhuma) e cria três
--     tabelas novas. Nenhuma função existente é reescrita.
--   · As tabelas de perfil entram inteiras mesmo assim, pelo mesmo motivo da
--     0004: "não mexe em dado" se prova tendo o antes guardado.
--
-- ⚠️ O plano é Free. NÃO existe backup automático. O que você salvar é o único.
--
-- Como usar:
--   1. Rode a QUERY 0. Anote os números no card da T-028.
--   2. Rode as QUERIES 1, 2 e 3, UMA POR VEZ. Em cada uma, Export → CSV no
--      painel de resultados. Não copie da tela.
--   3. Salve em `supabase/backups/` como
--      `perfis-AAAA-MM-DD-antes-da-0005-<teste|producao>-<n>.csv`.
--      A pasta está no .gitignore. Tem nome e cidade de gente real. Nunca versione.
--   4. Guarde até o `verificar-apos-0005.sql` sair verde.
-- ============================================================================


-- ############################################################
-- QUERY 0 — estado antes. Anote.
-- ############################################################
select
  (select count(*) from public.vet_profiles)                        as vet_profiles,
  (select count(*) from public.clinic_profiles)                     as clinic_profiles,
  (select count(*) from public.profiles)                            as profiles,
  (select count(*) from public.profiles
    where role in ('vet','clinic') and status = 'active')           as profissionais_active,
  (select count(*) from public.vet_profiles where slug is not null)
  + (select count(*) from public.clinic_profiles where slug is not null) as slugs_preenchidos,
  (select count(*) from pg_trigger t
    where t.tgrelid in ('public.profiles'::regclass, 'public.vet_profiles'::regclass,
                        'public.clinic_profiles'::regclass)
      and not t.tgisinternal)                                       as triggers_nas_tres_tabelas;


-- ############################################################
-- QUERY 1 — vet_profiles inteira (linha a linha, como estava)
-- ############################################################
-- Para restaurar SÓ o que a 0005 muda, basta `id`, `slug` e `updated_at`. As
-- outras colunas vão junto porque custam nada e fecham a discussão.
select id, slug, nome_exibicao, titulo, crmv, crmv_uf, especialidades, experiencia, bio,
       cidade, estado, bairro, atende_presencial, atende_domiciliar, atende_teleorientacao,
       created_at, updated_at
from public.vet_profiles
order by created_at;


-- ############################################################
-- QUERY 2 — clinic_profiles inteira
-- ############################################################
select id, slug, nome_fantasia, endereco, cep, cidade, estado, sobre, servicos, site,
       created_at, updated_at
from public.clinic_profiles
order by created_at;


-- ############################################################
-- QUERY 3 — os triggers que já existem nas três tabelas que a 0005 toca
-- ############################################################
-- Para comparar com o depois: a 0005 acrescenta três e não troca nenhum.
select t.tgrelid::regclass::text as tabela, t.tgname as trigger_nome,
       t.tgfoid::regprocedure::text as funcao, pg_get_triggerdef(t.oid) as definicao
from pg_trigger t
where t.tgrelid in ('public.profiles'::regclass, 'public.vet_profiles'::regclass,
                    'public.clinic_profiles'::regclass)
  and not t.tgisinternal
order by 1, 2;
