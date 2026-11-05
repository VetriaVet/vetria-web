-- PRÉ-VOO DA 0008 (T-066) · SÓ LEITURA, não altera nada.
-- Rode antes da migration, nos dois bancos: `npm run banco -- teste supabase/prevoo-0008.sql`.
-- Nenhuma linha devolve id, nome, email ou número: só contagens e hashes.

-- CONSULTA 1 · o corpo de admin_definir_status é o da 0004?
-- Esperado: hash_sem_espaco = 52241257ac30590e445c93e1bc39d09a (corpo da 0004).
-- Se vier outro valor, alguém editou a função fora do repo (R-006): PARE.
select p.proname,
       md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) as hash_sem_espaco,
       md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) = '52241257ac30590e445c93e1bc39d09a' as e_o_da_0004
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'admin_definir_status';

-- CONSULTA 2 · quantas contas na fila ficariam sem poder ser aprovadas.
-- Não muda nada: é o número que o Elber precisa saber antes de aplicar.
select count(*) filter (where pp.whatsapp is null or btrim(pp.whatsapp) !~ '^[0-9]{10,11}$') as na_fila_sem_whatsapp,
       count(*) as na_fila_total
  from public.profiles p
  left join public.perfil_privado pp on pp.id = p.id
 where p.status = 'pending_validation'
   and p.role in ('vet', 'clinic');
