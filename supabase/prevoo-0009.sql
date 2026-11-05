-- PRÉ-VOO DA 0009 (T-064) · SÓ LEITURA, não altera nada.
-- Rode antes da migration, nos dois bancos: `npm run banco -- teste supabase/prevoo-0009.sql`.
-- Nenhuma linha devolve id, nome, email ou número: só contagens, hashes e catálogo.

-- CONSULTA 1 · o corpo de handle_new_user é o da 0002?
-- Esperado: e_o_da_0002 = true (hash sem espaços f6675eb2c3f4a9a218e6b1143d2b1b83).
select p.proname,
       md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) as hash_sem_espaco,
       md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) = 'f6675eb2c3f4a9a218e6b1143d2b1b83' as e_o_da_0002
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'handle_new_user';

-- CONSULTA 2 · a policy que o dono usa para editar a própria linha.
-- O hash do WITH CHECK (sem espaços) tem que ser o mesmo nos dois bancos; a
-- 0009 confere o valor medido no vetria-e2e e para se for outro.
select pol.policyname,
       md5(regexp_replace(pol.with_check, '[[:space:]]+', '', 'g')) as hash_with_check,
       pol.with_check
  from pg_policies pol
 where pol.schemaname = 'public' and pol.tablename = 'profiles'
 order by pol.policyname;

-- CONSULTA 3 · triggers de profiles (o que roda quando role e status mudam).
select t.tgname, pg_get_triggerdef(t.oid) as definicao
  from pg_trigger t
 where t.tgrelid = 'public.profiles'::regclass and not t.tgisinternal
 order by t.tgname;

-- CONSULTA 4 · a 0009 já entrou? (coluna e função)
select (select count(*) from information_schema.columns
          where table_schema = 'public' and table_name = 'profiles'
            and column_name = 'tipo_escolhido_em') as coluna_existe,
       (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = 'escolher_tipo_de_conta') as funcao_existe;

-- CONSULTA 5 · contas por tipo (para saber quantas existem antes; só contagem).
select role, status, count(*) as total
  from public.profiles
 group by role, status
 order by role, status;
