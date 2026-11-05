-- ============================================================================
-- 0009 · A CONTA SEM TIPO ESCOLHE O TIPO, UMA VEZ SÓ
--
-- O que faz, em uma frase: a conta criada sem tipo (Google, ou o cadastro
-- pelo `/login`, que não manda `role`) nasce marcada como "tipo ainda não
-- escolhido" e escolhe responsável, veterinário ou estabelecimento uma única
-- vez, por uma função guardada no banco.
--
-- Card: T-064 · Decisão: DL-080 item 2 (05/11/2026). Antes, quem entrava pelo
-- Google virava `tutor` sem escolha (A-4) e não tinha caminho para ser
-- profissional. A rota `/api/onboarding/set-role` existia, mas nunca gravava:
-- `role` é NOT NULL com default `tutor` (0000) e `handle_new_user` sempre
-- grava um valor, então a condição `role is null` dela nunca era verdadeira.
--
-- O DESENHO, peça por peça:
--   1. `profiles.tipo_escolhido_em timestamptz`, default `now()`. As contas que
--      JÁ EXISTEM ficam marcadas como escolhidas (o default preenche na hora):
--      ninguém que já usa a Vetria passa a ver uma tela nova. Linha criada por
--      qualquer caminho que não seja o trigger também nasce escolhida. O valor
--      nulo, "ainda não escolhido", só nasce de `handle_new_user`.
--   2. `handle_new_user` (corpo da 0002 + uma coluna): `role` do metadata
--      dentro da lista, grava `now()`; sem `role` (Google, `/login`), grava
--      nulo. O `role` continua nascendo `tutor` e o status `active`, como hoje:
--      enquanto não escolhe, a conta é um responsável sem cadastro concluído.
--   3. `profiles_update_own_safe_fields` passa a fixar `tipo_escolhido_em`,
--      como já fixa `role` e `status`. Sem isto, o dono zeraria a coluna por
--      PATCH e escolheria de novo.
--   4. `escolher_tipo_de_conta(p_role text)`, SECURITY DEFINER, só para
--      `authenticated`, sobre a PRÓPRIA conta (`auth.uid()`, sem parâmetro de
--      alvo). Recusa, com o código entre parênteses:
--        · sem sessão (42501)
--        · tipo fora de tutor/vet/clinic, inclusive `admin` (22023)
--        · tipo já escolhido (55000)
--        · conta que não é o estado de nascimento sem tipo: role diferente de
--          `tutor`, qualquer nível de admin, status diferente de `active`,
--          cadastro de responsável concluído, ou já com perfil de veterinário
--          ou de estabelecimento (55000). `lib/auth/tipo.ts` espelha esta
--          regra para a tela; o animal NÃO entra nela de propósito: sem tela
--          que o grave antes da escolha, conferi-lo aqui só criaria um caso em
--          que a tela oferece a escolha e o banco recusa para sempre.
--      Grava `role`, `status` (`incomplete` para vet e clinic, que passam pela
--      validação como qualquer profissional; `active` para tutor) e
--      `tipo_escolhido_em = now()` num `update` condicionado a
--      `tipo_escolhido_em is null`, com a linha travada (`for update`): dois
--      cliques simultâneos não escolhem duas vezes. Grava `audit_logs`
--      (`acao = 'escolher_tipo'`) na mesma transação.
--
-- O que esta migration explicitamente NÃO faz:
--   · NÃO apaga, NÃO renomeia e NÃO dropa nada. NÃO muda o enum `user_role`.
--   · NÃO deixa ninguém virar `admin`, nem `active` como profissional.
--   · NÃO mexe em conta existente além do default da coluna nova.
--   · NÃO mexe em `admin_set_user_access` (o master continua concedendo role).
--
-- ⚠️ ANTES DE RODAR:
--   1. `supabase/prevoo-0009.sql` (só leitura) nos dois bancos. Consulta 1 =
--      `true`; consulta 2, o hash do WITH CHECK de
--      `profiles_update_own_safe_fields` tem que ser 4856777f25b47f85082c775085820a46.
--   2. Leia a seção 7 (reversão).
--   3. Rode ESTE arquivo INTEIRO, de uma vez. É uma transação só.
--   4. O último comando é um `select` depois do commit. Toda linha `true`.
--
-- ⚠️ NADA AQUI FALA POR `raise notice` (SEC-035).
-- ⚠️ SQL Editor do Supabase: todo marcador de bloco entre cifrões é só letra.
--
-- Escrita em: 05/11/2026 · vetria-backend.
-- Auditoria obrigatória antes de produção: vetria-seguranca.
-- ============================================================================


begin;

set local search_path = public;
set local lock_timeout = '10s';


-- ============================================================================
-- 1. PRÉ-VOO
-- ============================================================================
do $preflight$
declare
  v_hash   text;
  v_check  text;
begin
  -- handle_new_user: o corpo da 0002, ou o desta 0009 (rodar de novo).
  select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) into v_hash
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'handle_new_user';

  if v_hash is null then
    raise exception 'PARE: handle_new_user nao existe neste banco. Nada foi alterado.';
  end if;
  if v_hash not in ('f6675eb2c3f4a9a218e6b1143d2b1b83', '9cf94a4a22b933df9ead48a27145f005') then
    raise exception 'PARE: o corpo de handle_new_user (hash sem espacos %) nao e o da 0002 nem o da 0009. Alguem editou fora do repo (R-006). Nada foi alterado.', v_hash;
  end if;

  -- A policy do dono: a da 0002, ou a desta 0009 (rodar de novo).
  select md5(regexp_replace(pol.with_check, '[[:space:]]+', '', 'g')) into v_check
    from pg_policies pol
   where pol.schemaname = 'public' and pol.tablename = 'profiles'
     and pol.policyname = 'profiles_update_own_safe_fields';

  if v_check is null then
    raise exception 'PARE: a policy profiles_update_own_safe_fields nao existe neste banco. Nada foi alterado.';
  end if;
  if v_check <> '4856777f25b47f85082c775085820a46'
     and not exists (select 1 from information_schema.columns
                      where table_schema = 'public' and table_name = 'profiles'
                        and column_name = 'tipo_escolhido_em') then
    raise exception 'PARE: o WITH CHECK de profiles_update_own_safe_fields (hash sem espacos %) nao e o da 0002. Alguem editou fora do repo (R-006). Nada foi alterado.', v_check;
  end if;

  -- O nome da função nova não pode estar ocupado por outra assinatura.
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.proname = 'escolher_tipo_de_conta'
                and pg_get_function_identity_arguments(p.oid) <> 'p_role text') then
    raise exception 'PARE: ja existe escolher_tipo_de_conta com outra assinatura. Nada foi alterado.';
  end if;
end
$preflight$;


-- ============================================================================
-- 2. A COLUNA
-- ============================================================================
-- `default now()` com `add column`: o Postgres calcula o valor uma vez e
-- preenche as linhas existentes com ele (sem reescrever a tabela). Toda conta
-- que existe hoje fica "escolhida".
alter table public.profiles
  add column if not exists tipo_escolhido_em timestamptz default now();

comment on column public.profiles.tipo_escolhido_em is
  '0009 / T-064: quando o tipo da conta foi escolhido. Nulo = conta criada sem tipo (Google, /login) que ainda nao escolheu. Escrito so por handle_new_user e por escolher_tipo_de_conta(); o dono nao escreve (profiles_update_own_safe_fields).';


-- ============================================================================
-- 3. handle_new_user · a 0002, mais a coluna nova
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $function$
declare
  meta_role text := new.raw_user_meta_data ->> 'role';
  role_final public.user_role;
begin
  role_final := case
    when meta_role in ('tutor', 'vet', 'clinic') then meta_role::public.user_role
    else 'tutor'::public.user_role
  end;

  insert into public.profiles (id, role, full_name, status, tipo_escolhido_em)
  values (
    new.id,
    role_final,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    ),
    case
      when role_final in ('vet', 'clinic') then 'incomplete'::public.user_status
      else 'active'::public.user_status
    end,
    -- 0009 / T-064: sem `role` valido no metadata (Google, /login), o tipo
    -- ainda nao foi escolhido. `admin` no metadata tambem cai aqui: vira
    -- `tutor` sem tipo, e a escolha nunca oferece `admin`.
    case
      when meta_role in ('tutor', 'vet', 'clinic') then now()
      else null
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;


-- ============================================================================
-- 4. A POLICY DO DONO FIXA A COLUNA NOVA
-- ============================================================================
-- O WITH CHECK da 0002 §7.2, linha a linha, mais a última condição.
alter policy profiles_update_own_safe_fields on public.profiles
  with check (
    id = auth.uid()
    and role = (select p2.role from public.profiles p2 where p2.id = auth.uid())
    and coalesce(admin_level, 'none'::admin_level)
        = coalesce((select p2.admin_level from public.profiles p2 where p2.id = auth.uid()), 'none'::admin_level)
    and coalesce(admin_team, 'none'::admin_team)
        = coalesce((select p2.admin_team from public.profiles p2 where p2.id = auth.uid()), 'none'::admin_team)
    and status = (select p2.status from public.profiles p2 where p2.id = auth.uid())
    and status_motivo is not distinct from (select p2.status_motivo from public.profiles p2 where p2.id = auth.uid())
    and tipo_escolhido_em is not distinct from (select p2.tipo_escolhido_em from public.profiles p2 where p2.id = auth.uid())
  );


-- ============================================================================
-- 5. escolher_tipo_de_conta
-- ============================================================================
create or replace function public.escolher_tipo_de_conta(p_role text)
returns text
language plpgsql security definer set search_path = public
as $escolha$
-- 0009 / T-064: ver o cabecalho da migration.
declare
  v_uid      uuid := auth.uid();
  v_role     public.user_role;
  v_status   public.user_status;
  v_nivel    public.admin_level;
  v_concluiu boolean;
  v_escolha  timestamptz;
begin
  if v_uid is null then
    raise exception 'sem sessao' using errcode = '42501';
  end if;

  -- Lista fechada. `admin` nunca passa.
  if p_role is null or p_role not in ('tutor', 'vet', 'clinic') then
    raise exception 'tipo de conta invalido' using errcode = '22023';
  end if;

  select p.role, p.status, p.admin_level, p.onboarding_completed, p.tipo_escolhido_em
    into v_role, v_status, v_nivel, v_concluiu, v_escolha
    from public.profiles p
   where p.id = v_uid
   for update;

  if not found then
    raise exception 'conta nao encontrada' using errcode = 'P0002';
  end if;

  if v_escolha is not null then
    raise exception 'o tipo desta conta ja foi escolhido' using errcode = '55000';
  end if;

  -- So o estado de nascimento sem tipo: responsavel ativo, sem nada feito.
  if v_role <> 'tutor'
     or coalesce(v_nivel, 'none'::public.admin_level) <> 'none'
     or v_status <> 'active'
     or coalesce(v_concluiu, false)
     or exists (select 1 from public.vet_profiles v where v.id = v_uid)
     or exists (select 1 from public.clinic_profiles c where c.id = v_uid) then
    raise exception 'esta conta nao pode mais escolher o tipo' using errcode = '55000';
  end if;

  update public.profiles
     set role = p_role::public.user_role,
         status = case when p_role in ('vet', 'clinic')
                       then 'incomplete'::public.user_status
                       else 'active'::public.user_status end,
         tipo_escolhido_em = now(),
         updated_at = now()
   where id = v_uid
     and tipo_escolhido_em is null;

  if not found then
    raise exception 'o tipo desta conta ja foi escolhido' using errcode = '55000';
  end if;

  insert into public.audit_logs (actor_id, acao, alvo_tipo, alvo_id, detalhe)
  values (v_uid, 'escolher_tipo', 'profile', v_uid, jsonb_build_object('para', p_role));

  return p_role;
end;
$escolha$;

comment on function public.escolher_tipo_de_conta(text) is
  '0009 / T-064: a conta criada sem tipo escolhe tutor, vet ou clinic, uma vez, sobre si mesma. 42501 sem sessao, 22023 tipo invalido, 55000 ja escolhido ou conta fora do estado de nascimento.';

revoke execute on function public.escolher_tipo_de_conta(text) from anon, public;
grant  execute on function public.escolher_tipo_de_conta(text) to authenticated;


-- ============================================================================
-- 6. AVISAR O PostgREST (SEC-038). Entregue no commit.
-- ============================================================================
notify pgrst, 'reload schema';


commit;


-- ============================================================================
-- O RESULTADO, NA TELA (SEC-035) · leitura pura, depois do commit
-- ============================================================================
-- Esperado: 9 linhas, TODAS com `ok_tem_que_ser_true` = true.
select * from (
  select 1 as ordem, 'coluna profiles.tipo_escolhido_em existe, timestamptz, default now()' as item,
         coalesce((select c.data_type = 'timestamp with time zone' and c.column_default = 'now()'
                     from information_schema.columns c
                    where c.table_schema = 'public' and c.table_name = 'profiles'
                      and c.column_name = 'tipo_escolhido_em'), false) as ok_tem_que_ser_true,
         coalesce((select c.data_type || ' default ' || coalesce(c.column_default, 'nenhum')
                     from information_schema.columns c
                    where c.table_schema = 'public' and c.table_name = 'profiles'
                      and c.column_name = 'tipo_escolhido_em'), 'NAO EXISTE') as leitura
  union all
  select 2, 'nenhuma conta ficou sem tipo por causa da migration (na 1a execucao; depois, conta nova sem tipo e legitima)',
         (select count(*) = 0 from public.profiles p
           where p.tipo_escolhido_em is null and p.created_at < now() - interval '1 minute'),
         (select count(*)::text from public.profiles p where p.tipo_escolhido_em is null)
  union all
  select 3, 'handle_new_user com o corpo da 0009',
         coalesce((select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) = '9cf94a4a22b933df9ead48a27145f005'
                     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'handle_new_user'), false),
         coalesce((select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))
                     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'handle_new_user'), 'NAO EXISTE')
  union all
  select 4, 'a policy do dono fixa tipo_escolhido_em',
         coalesce((select pol.with_check like '%tipo_escolhido_em%' from pg_policies pol
                    where pol.schemaname = 'public' and pol.tablename = 'profiles'
                      and pol.policyname = 'profiles_update_own_safe_fields'), false),
         coalesce((select md5(regexp_replace(pol.with_check, '[[:space:]]+', '', 'g')) from pg_policies pol
                    where pol.schemaname = 'public' and pol.tablename = 'profiles'
                      and pol.policyname = 'profiles_update_own_safe_fields'), 'NAO EXISTE')
  union all
  select 5, 'a policy do dono continua fixando role e status',
         coalesce((select pol.with_check like '%p2.role%' and pol.with_check like '%p2.status%'
                     from pg_policies pol
                    where pol.schemaname = 'public' and pol.tablename = 'profiles'
                      and pol.policyname = 'profiles_update_own_safe_fields'), false),
         'se false: o dono passaria a escrever role ou status'
  union all
  select 6, 'escolher_tipo_de_conta e a dona do corpo da 0009',
         coalesce((select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) = '098c93992ddac17e9feec2d6f0489d77'
                     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'escolher_tipo_de_conta'), false),
         coalesce((select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))
                     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'escolher_tipo_de_conta'), 'NAO EXISTE')
  union all
  select 7, 'as duas funcoes: SECURITY DEFINER + search_path=public (DL-015)',
         (select count(*) = 2 and bool_and(p.prosecdef and coalesce(p.proconfig, '{}'::text[]) && array['search_path=public'])
            from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('handle_new_user', 'escolher_tipo_de_conta')),
         'se false: recursao de RLS (DL-014) ou search_path solto'
  union all
  select 8, 'anon NAO executa escolher_tipo_de_conta',
         not has_function_privilege('anon', 'public.escolher_tipo_de_conta(text)', 'EXECUTE'),
         'se false, o revoke nao pegou'
  union all
  select 9, 'authenticated executa escolher_tipo_de_conta',
         has_function_privilege('authenticated', 'public.escolher_tipo_de_conta(text)', 'EXECUTE'),
         'se false, a tela de escolha para de funcionar'
) resultado
order by ordem;


-- ============================================================================
-- 7. PROCEDIMENTO DE REVERSÃO
-- ============================================================================
-- Aditivo: a reversão só volta o comportamento, sem apagar a coluna (apagar
-- coluna não é aditivo; se um dia for preciso, é com o Elber e backup).
--
-- begin;
--   -- a) handle_new_user volta ao corpo da 0002: rodar o bloco
--   --    `create or replace function public.handle_new_user() ... $function$;`
--   --    da seção 9 de `0002_nucleo.sql`.
--   -- b) a função de escolha deixa de ser chamável (sem drop):
--   revoke execute on function public.escolher_tipo_de_conta(text) from authenticated;
--   -- c) a policy do dono volta ao WITH CHECK da 0002 §7.2 (o bloco
--   --    `alter policy profiles_update_own_safe_fields` daquela seção).
--   -- d) as contas novas que nasceram sem tipo passam a contar como escolhidas:
--   update public.profiles set tipo_escolhido_em = created_at where tipo_escolhido_em is null;
--   notify pgrst, 'reload schema';
-- commit;
--
-- Efeito da reversão: conta do Google volta a virar responsável sem escolha
-- (A-4 reaberto). O código do app trata a coluna como "escolhido" quando a
-- função não responde, então a tela de escolha some sozinha.
