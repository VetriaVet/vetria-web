-- ============================================================================
-- 0007 — PARIDADE: A FK DE profiles.id PARA auth.users
--
-- O que faz, em uma frase: garante que `public.profiles.id` tenha
-- `profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE
-- CASCADE` em todo banco, sem mexer onde ela já existe.
--
-- Origem: SEC-139 (auditoria de 04/11/2026) · Risco: R-079
--   · Em PRODUÇÃO a FK existe (criada pelo painel antes da pasta migrations/).
--   · No vetria-e2e ela NÃO existe: o `montar-vetria-e2e.sql` copiou a 0000,
--     e a 0000 não a declarava.
--   · Causa: a introspecção de 26/08 (`introspect.sql` §8) só lia
--     `pg_indexes`, e FK não é índice. Corrigido no mesmo PR (§8b).
--   · Efeito: no vetria-e2e apagar um usuário de auth.users deixava o perfil
--     órfão, e uma sonda que inseria direto em `profiles` passava no teste e
--     quebrava em produção (23503). O teste não provava o que dizia provar.
--   · O vetria-e2e tinha 0 perfis sem usuário em 04/11/2026 (medido).
--
-- Comportamento esperado, por banco:
--   PRODUÇÃO   a FK já existe com a definição exata: a migration NÃO MEXE
--              (nenhum DDL roda). O select final prova o no-op: linha 5 =
--              `nao_mexi_ja_existia` e linha 6 = mesmo oid antes e depois.
--   vetria-e2e a FK não existe: a migration CRIA. Linha 5 = `criei`.
--              Rodar de novo: `nao_mexi_ja_existia` (idempotente).
--
-- O que esta migration explicitamente NÃO faz:
--   · NÃO apaga linha. Se houver perfil sem usuário, o pré-voo PARA e não
--     muda nada: decidir o que fazer com o órfão é com o Elber, nunca aqui.
--   · NÃO troca uma FK que já exista com outra definição: PARA e mostra a
--     definição que achou. Trocar FK é `drop` + `add`, e isso não é aditivo.
--   · NÃO cria tabela, função, policy nem grant.
--
-- Trava de tabela: só quando CRIA (vetria-e2e). `add constraint ... foreign
-- key` trava `profiles` e `auth.users` em SHARE ROW EXCLUSIVE enquanto valida
-- as linhas (milissegundos com poucas contas): um cadastro que chegue nesse
-- instante espera. `lock_timeout` de 10s: se não conseguir a trava, desiste
-- inteira em vez de ficar na fila segurando o cadastro.
--
-- ⚠️ ANTES DE RODAR:
--   1. `supabase/paridade-schema.sql` nos dois bancos (CONSULTA 1 mostra a
--      diferença de constraints que esta migration fecha).
--   2. Leia a seção 4 (reversão).
--   3. Rode ESTE arquivo INTEIRO, de uma vez. É uma transação só.
--   4. O último comando é um `select` depois do commit: único canal de saída.
--      Toda linha tem que vir `ok_tem_que_ser_true = true`.
--
-- ⚠️ NADA AQUI FALA POR `raise notice` (SEC-035).
-- ⚠️ SQL Editor do Supabase: todo marcador de bloco entre cifrões é só letra,
--     sem dígito.
--
-- Escrita em: 04/11/2026 · vetria-backend · NÃO APLICADA em lugar nenhum.
-- Auditoria obrigatória antes de aplicar: vetria-seguranca.
-- ============================================================================


begin;

-- `pg_get_constraintdef` só escreve `auth.users` com o schema quando `auth`
-- não está no search_path. Fixar o search_path da transação deixa a
-- comparação de texto da §2 igual em qualquer sessão.
set local search_path = public;
set local lock_timeout = '10s';


-- ============================================================================
-- 1. PRÉ-VOO — leitura de catálogo e contagem; termina em `raise exception`
-- ============================================================================
do $preflight$
declare
  v_orfaos  bigint;
  v_outras  text;
begin
  if to_regclass('auth.users') is null then
    raise exception 'PARE: auth.users nao existe neste banco. Este banco e mesmo um projeto Supabase?';
  end if;

  if to_regclass('public.profiles') is null then
    raise exception 'PARE: public.profiles nao existe neste banco.';
  end if;

  -- ⚠️ O PERFIL SEM USUÁRIO. A FK não nasce com órfão (o `add constraint`
  -- falharia com 23503 de qualquer jeito); aqui a parada vem com o número e
  -- a explicação. Sai SÓ a contagem: nenhum id, nenhum nome.
  select count(*) into v_orfaos
    from public.profiles p
   where not exists (select 1 from auth.users u where u.id = p.id);

  if v_orfaos > 0 then
    raise exception 'PARE: % perfil(is) em public.profiles sem usuario em auth.users. A FK nao pode nascer com eles. Nada foi alterado. Decida com o Elber o que fazer com cada um antes de rodar de novo (esta migration nunca apaga linha).', v_orfaos;
  end if;

  -- Outra FK de profiles para auth.users, com OUTRO nome: criar a nossa
  -- deixaria duas regras de cascata na mesma coluna. Parar e olhar.
  select string_agg(k.conname || ': ' || pg_get_constraintdef(k.oid), ' ; ')
    into v_outras
    from pg_constraint k
   where k.conrelid = 'public.profiles'::regclass
     and k.contype = 'f'
     and k.confrelid = 'auth.users'::regclass
     and k.conname <> 'profiles_id_fkey';

  if v_outras is not null then
    raise exception 'PARE: public.profiles ja tem FK para auth.users com outro nome (%). Nada foi alterado. Leia e decida com o Elber.', v_outras;
  end if;
end
$preflight$;


-- ============================================================================
-- 2. A FK — idempotente: existe igual, não mexe; existe diferente, PARA;
--    não existe, cria
-- ============================================================================
-- O que esta execução fez fica em duas variáveis de SESSÃO (set_config com
-- `false`), para o select do fim, depois do commit, provar o no-op. Se a
-- transação voltar, elas voltam junto.
do $fk$
declare
  v_esperada constant text := 'FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE';
  v_oid      oid;
  v_tipo     "char";
  v_def      text;
begin
  select k.oid, k.contype, pg_get_constraintdef(k.oid)
    into v_oid, v_tipo, v_def
    from pg_constraint k
   where k.conrelid = 'public.profiles'::regclass
     and k.conname = 'profiles_id_fkey';

  if v_oid is not null then
    if v_tipo <> 'f' or v_def <> v_esperada then
      raise exception 'PARE: public.profiles ja tem a constraint profiles_id_fkey, mas ela e "%" (tipo %), e a esperada e "%". Nada foi alterado. Alguem a criou fora do repo (R-006): leia e decida com o Elber.',
        v_def, v_tipo, v_esperada;
    end if;

    perform set_config('vetria.m0007_acao', 'nao_mexi_ja_existia', false);
    perform set_config('vetria.m0007_oid_antes', v_oid::text, false);
  else
    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users (id) on delete cascade;

    perform set_config('vetria.m0007_acao', 'criei', false);
    perform set_config('vetria.m0007_oid_antes', '', false);
  end if;
end
$fk$;


-- ============================================================================
-- 3. AVISAR O PostgREST (SEC-038). Entregue no commit.
-- ============================================================================
-- `auth` não é exposto pela API, então nenhuma relação nova aparece; o aviso
-- é o de toda migration que mexe em constraint, e custa nada.
notify pgrst, 'reload schema';


commit;


-- ============================================================================
-- O RESULTADO, NA TELA (SEC-035) — leitura pura, depois do commit
-- ============================================================================
-- Esperado: 7 linhas, TODAS com `ok_tem_que_ser_true` = true.
-- Linha 5, coluna `leitura`: em PRODUÇÃO tem que ser `nao_mexi_ja_existia`;
-- no vetria-e2e, na primeira vez, `criei`.
-- Se as linhas 5 a 7 vierem false com `leitura` vazia: o select rodou numa
-- sessão diferente da migration. Rode o arquivo inteiro de uma vez.
select * from (
  select 1 as ordem, 'profiles_id_fkey existe, e FK e esta validada' as item,
         coalesce((select k.contype = 'f' and k.convalidated from pg_constraint k
                    where k.conrelid = 'public.profiles'::regclass and k.conname = 'profiles_id_fkey'), false)
           as ok_tem_que_ser_true,
         'se false: a FK nao entrou' as leitura
  union all
  select 2, 'definicao exata: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE',
         coalesce((select k.contype = 'f' and k.conkey = array[a.attnum]::int2[]
                          and k.confrelid = 'auth.users'::regclass
                          and k.confdeltype = 'c' and k.confupdtype = 'a'
                          and not k.condeferrable
                     from pg_constraint k
                     join pg_attribute a on a.attrelid = k.conrelid and a.attname = 'id'
                    where k.conrelid = 'public.profiles'::regclass and k.conname = 'profiles_id_fkey'), false),
         coalesce((select pg_get_constraintdef(k.oid) from pg_constraint k
                    where k.conrelid = 'public.profiles'::regclass and k.conname = 'profiles_id_fkey'), 'NAO EXISTE')
  union all
  select 3, 'uma FK so de profiles para auth.users',
         (select count(*) = 1 from pg_constraint k
           where k.conrelid = 'public.profiles'::regclass and k.contype = 'f'
             and k.confrelid = 'auth.users'::regclass),
         (select string_agg(k.conname, ', ') from pg_constraint k
           where k.conrelid = 'public.profiles'::regclass and k.contype = 'f'
             and k.confrelid = 'auth.users'::regclass)
  union all
  select 4, 'perfis sem usuario em auth.users = 0',
         (select count(*) = 0 from public.profiles p
           where not exists (select 1 from auth.users u where u.id = p.id)),
         (select count(*)::text from public.profiles p
           where not exists (select 1 from auth.users u where u.id = p.id))
  union all
  select 5, 'acao desta execucao (producao: nao_mexi_ja_existia; vetria-e2e na 1a vez: criei)',
         coalesce(current_setting('vetria.m0007_acao', true) in ('nao_mexi_ja_existia', 'criei'), false),
         coalesce(current_setting('vetria.m0007_acao', true), '')
  union all
  select 6, 'no-op provado: se ja existia, e a MESMA constraint de antes (mesmo oid)',
         coalesce(current_setting('vetria.m0007_acao', true) = 'criei'
                  or (current_setting('vetria.m0007_acao', true) = 'nao_mexi_ja_existia'
                      and current_setting('vetria.m0007_oid_antes', true)
                          = (select k.oid::text from pg_constraint k
                              where k.conrelid = 'public.profiles'::regclass and k.conname = 'profiles_id_fkey')), false),
         coalesce('oid antes ' || nullif(current_setting('vetria.m0007_oid_antes', true), '') || ', agora '
                  || (select k.oid::text from pg_constraint k
                       where k.conrelid = 'public.profiles'::regclass and k.conname = 'profiles_id_fkey'),
                  'nao existia antes')
  union all
  select 7, 'criada so onde faltava: se criei, nao havia constraint antes',
         coalesce(current_setting('vetria.m0007_acao', true) = 'nao_mexi_ja_existia'
                  or (current_setting('vetria.m0007_acao', true) = 'criei'
                      and current_setting('vetria.m0007_oid_antes', true) = ''), false),
         'se false: rode o arquivo inteiro de uma vez'
) resultado
order by ordem;


-- ============================================================================
-- 4. PROCEDIMENTO DE REVERSÃO
-- ============================================================================
-- ⚠️ SÓ NO vetria-e2e, e só se a linha 5 disse `criei`. Em PRODUÇÃO a FK já
-- existia antes desta migration (ela não mexeu): reverter lá APAGARIA uma
-- regra que sempre esteve no ar. Não reverta em produção.
--
-- begin;
--   alter table public.profiles drop constraint if exists profiles_id_fkey;
--   notify pgrst, 'reload schema';
-- commit;
--
-- Efeito da reversão: o vetria-e2e volta a aceitar perfil sem usuário, e
-- excluir um usuário volta a deixar o perfil órfão (o R-079 reaberto).
