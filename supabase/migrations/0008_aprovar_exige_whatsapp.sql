-- ============================================================================
-- 0008 · APROVAR EXIGE WHATSAPP
--
-- O que faz, em uma frase: `admin_definir_status` passa a recusar a
-- aprovação (pending_validation → active) de conta sem WhatsApp válido em
-- `perfil_privado.whatsapp`, com o código 23514.
--
-- Card: T-066 · Decisão: DL-080 item 4 (05/11/2026, o Elber: "o mínimo
-- profissional possível"). Antes dela, a T-046 tornou o WhatsApp obrigatório
-- no onboarding, mas uma conta antiga na fila sem número ainda podia ser
-- aprovada e aparecia na busca sem botão de contato (R-036 item 1).
--
-- A regra do número é a MESMA de `registrar_contato` (0006, SEC-128) e de
-- `lib/contato/whatsapp.ts` (WHATSAPP_GRAVADO): depois de tirar espaço das
-- pontas, só dígitos, 10 ou 11 (DDD + número, sem o 55). Número que o
-- contato não consegue entregar não conta como número.
--
-- OS CÓDIGOS DE ERRO CONTINUAM CONTRATO com a Server Action
-- (`app/admin/validacoes/[conta]/actions.ts`), que escolhe a frase pelo
-- CÓDIGO (SEC-057). Os da 0004 não mudam; entra um:
--   23514  aprovar sem WhatsApp válido no cadastro (T-066)
--
-- O que muda, e o que NÃO muda:
--   · Só o ramo de APROVAR ganha a conferência. Reprovar, suspender e
--     reativar continuam exatamente como na 0004.
--   · Reativar uma conta suspensa (só master) NÃO exige WhatsApp: é decisão
--     de moderação sobre quem já foi aprovado, e não está no DL-080.
--   · NÃO mexe em conta nenhuma. Quem já está `active` sem número continua
--     `active` (o painel avisa, T-046). Medido no pré-voo: quantas contas na
--     fila ficariam sem poder ser aprovadas (só a contagem).
--   · A assinatura NÃO muda (uuid, user_status, text): `create or replace`
--     preserva os GRANTs, e a Action continua chamando igual.
--   · NÃO cria tabela, coluna, policy nem grant.
--
-- ⚠️ ANTES DE RODAR:
--   1. `supabase/prevoo-0008.sql` (só leitura): o hash do corpo atual tem que
--      ser o da 0004, e a contagem da fila sem número é lida.
--   2. Leia a seção 4 (reversão).
--   3. Rode ESTE arquivo INTEIRO, de uma vez. É uma transação só, e o pré-voo
--      da seção 1 repete a conferência do hash dentro dela.
--   4. O último comando é um `select` depois do commit: único canal de saída.
--      Toda linha tem que vir `ok_tem_que_ser_true = true`.
--
-- ⚠️ NADA AQUI FALA POR `raise notice` (SEC-035).
-- ⚠️ SQL Editor do Supabase: todo marcador de bloco entre cifrões é só letra,
--     sem dígito.
--
-- Escrita em: 05/11/2026 · vetria-backend.
-- Auditoria obrigatória antes de produção: vetria-seguranca.
-- ============================================================================


begin;

set local search_path = public;
set local lock_timeout = '10s';


-- ============================================================================
-- 1. PRÉ-VOO · o corpo que vamos substituir é o da 0004?
-- ============================================================================
-- Hash SEM espaço em branco (README §"Estado conhecido das funções"). Se
-- divergir, alguém editou a função fora do repo (R-006), e `create or
-- replace` apagaria essa edição em silêncio. Para tudo.
do $preflight$
declare
  v_hash text;
begin
  select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) into v_hash
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'admin_definir_status'
     and pg_get_function_identity_arguments(p.oid) = 'target_user_id uuid, novo_status user_status, motivo text';

  if v_hash is null then
    raise exception 'PARE: admin_definir_status(uuid, user_status, text) nao existe neste banco. Nada foi alterado.';
  end if;

  -- 52241257... = corpo da 0004. 215d9918... = corpo desta 0008 (rodar de
  -- novo e idempotente: o corpo e o mesmo).
  if v_hash not in ('52241257ac30590e445c93e1bc39d09a', '215d99185f422209afdbc80988fa941c') then
    raise exception 'PARE: o corpo de admin_definir_status neste banco (hash sem espacos %) nao e o da 0004 nem o da 0008. Alguem editou fora do repo (R-006). Nada foi alterado: leia o corpo com o Elber antes de seguir.', v_hash;
  end if;
end
$preflight$;


-- ============================================================================
-- 2. admin_definir_status · a 0004, mais a conferência do WhatsApp ao aprovar
-- ============================================================================
-- O corpo é o da 0004 linha a linha, com DUAS mudanças, marcadas `T-066`:
-- a variável `v_whatsapp` e o bloco dentro do ramo de aprovar. A leitura de
-- `perfil_privado` roda como dono da função (SECURITY DEFINER), então não
-- depende da policy de leitura do admin, e o número NÃO sai da função: nem
-- na mensagem do erro, nem na trilha.
create or replace function public.admin_definir_status(
  target_user_id uuid,
  novo_status    public.user_status,
  motivo         text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
-- 0004 / T-027: SEC-096 e SEC-099. 0008 / T-066: aprovar exige WhatsApp.
declare
  status_antigo public.user_status;
  alvo_role     public.user_role;
  -- motivo so de espacos, tabs ou quebras de linha conta como ausente
  motivo_limpo  text := nullif(btrim(motivo, E' \t\r\n'), '');
  -- T-066: o numero gravado, so para conferir o formato (nunca sai daqui)
  v_whatsapp    text;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  -- `for update`: a segunda decisao simultanea sobre a mesma conta espera
  -- esta terminar e le o status JA MUDADO (SEC-099).
  select p.status, p.role into status_antigo, alvo_role
  from public.profiles p
  where p.id = target_user_id
  for update;

  if not found then
    raise exception 'usuario nao encontrado' using errcode = 'P0002';
  end if;

  -- Suspensao e privilegio de master nas DUAS direcoes (SEC-005, da 0002).
  if (novo_status = 'suspended' or status_antigo = 'suspended')
     and not public.is_master_admin() then
    raise exception 'not authorized: suspender ou reativar exige master' using errcode = '42501';
  end if;

  if alvo_role not in ('vet', 'clinic') then
    raise exception 'status so se aplica a vet e clinic' using errcode = '22023';
  end if;

  -- Mesmo teto da Action (MOTIVO_MAXIMO). O motivo vai para a tela do
  -- profissional e para audit_logs, para sempre.
  if motivo_limpo is not null and char_length(motivo_limpo) > 1000 then
    raise exception 'motivo passa de 1000 caracteres' using errcode = '22023';
  end if;

  if novo_status = 'suspended' then
    if status_antigo = 'suspended' then
      raise exception 'a conta ja esta suspensa' using errcode = '55000';
    end if;
    if motivo_limpo is null then
      raise exception 'suspender exige motivo' using errcode = '22023';
    end if;

  elsif status_antigo = 'suspended' then
    -- reativar: master (conferido acima), para qualquer destino que nao seja
    -- `suspended` (esse caiu no ramo anterior).
    null;

  elsif novo_status in ('active', 'incomplete') then
    -- APROVAR e REPROVAR: so sobre quem esta na fila (DL-061, matriz 5).
    if status_antigo <> 'pending_validation' then
      raise exception 'conta fora da fila de validacao: status atual %', status_antigo
        using errcode = '55000';
    end if;
    if novo_status = 'incomplete' and motivo_limpo is null then
      raise exception 'reprovar exige motivo' using errcode = '22023';
    end if;
    -- T-066 / DL-080 item 4: aprovar exige WhatsApp que o contato consiga
    -- entregar. Mesma regra de registrar_contato (0006, SEC-128). Sem linha
    -- em perfil_privado e o mesmo que sem numero.
    if novo_status = 'active' then
      select nullif(btrim(pp.whatsapp), '') into v_whatsapp
        from public.perfil_privado pp
       where pp.id = target_user_id;
      if v_whatsapp is null or v_whatsapp !~ '^[0-9]{10,11}$' then
        raise exception 'aprovar exige whatsapp valido no cadastro' using errcode = '23514';
      end if;
    end if;

  else
    -- novo_status = 'pending_validation', vindo de `active` ou `incomplete`.
    -- Quem poe na fila e o proprio profissional, por
    -- concluir_onboarding_profissional(), ou o trigger de revalidacao.
    raise exception 'transicao nao permitida: % para %', status_antigo, novo_status
      using errcode = '22023';
  end if;

  -- Reprovar devolve ao onboarding (onboarding_completed = false), como na
  -- 0002: sem isso o reprovado nunca alcanca a tela onde o motivo aparece.
  -- O `and status = status_antigo` e a trava pedida pela SEC-096/099: nos
  -- ramos de aprovar e reprovar, status_antigo e 'pending_validation'.
  update public.profiles
  set status = novo_status,
      status_motivo = motivo_limpo,
      onboarding_completed = case
        when novo_status = 'incomplete' then false
        else onboarding_completed
      end,
      updated_at = now()
  where id = target_user_id
    and status = status_antigo;

  if not found then
    raise exception 'a conta mudou de estado durante a decisao' using errcode = '55000';
  end if;

  insert into public.audit_logs (actor_id, acao, alvo_tipo, alvo_id, detalhe)
  values (
    auth.uid(),
    'definir_status',
    'profile',
    target_user_id,
    jsonb_build_object('de', status_antigo, 'para', novo_status, 'motivo', motivo_limpo)
  );
end;
$$;

-- Os mesmos da 0004. `create or replace` já os preserva; repetir custa nada e
-- fecha a porta se alguém tiver mexido no grant fora do repo.
revoke execute on function public.admin_definir_status(uuid, public.user_status, text) from anon, public;
grant  execute on function public.admin_definir_status(uuid, public.user_status, text) to authenticated;


-- ============================================================================
-- 3. AVISAR O PostgREST (SEC-038). Entregue no commit.
-- ============================================================================
notify pgrst, 'reload schema';


commit;


-- ============================================================================
-- O RESULTADO, NA TELA (SEC-035) · leitura pura, depois do commit
-- ============================================================================
-- Esperado: 5 linhas, TODAS com `ok_tem_que_ser_true` = true.
select * from (
  select 1 as ordem, 'corpo novo de admin_definir_status (hash sem espacos da 0008)' as item,
         coalesce((select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) = '215d99185f422209afdbc80988fa941c'
                     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'admin_definir_status'), false)
           as ok_tem_que_ser_true,
         coalesce((select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))
                     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'admin_definir_status'), 'NAO EXISTE')
           as leitura
  union all
  select 2, 'uma versao so de admin_definir_status',
         (select count(*) = 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'admin_definir_status'),
         (select count(*)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'admin_definir_status')
  union all
  select 3, 'SECURITY DEFINER + search_path=public (DL-015)',
         coalesce((select p.prosecdef and coalesce(p.proconfig, '{}'::text[]) && array['search_path=public']
                     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'admin_definir_status'), false),
         coalesce((select array_to_string(p.proconfig, ',')
                     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                    where n.nspname = 'public' and p.proname = 'admin_definir_status'), 'SEM search_path')
  union all
  select 4, 'anon NAO executa',
         not has_function_privilege('anon', 'public.admin_definir_status(uuid, public.user_status, text)', 'EXECUTE'),
         'se false, o revoke nao pegou'
  union all
  select 5, 'authenticated executa (sem isto a fila do admin para de decidir)',
         has_function_privilege('authenticated', 'public.admin_definir_status(uuid, public.user_status, text)', 'EXECUTE'),
         'se false, aprovar e reprovar param'
) resultado
order by ordem;


-- ============================================================================
-- 4. PROCEDIMENTO DE REVERSÃO
-- ============================================================================
-- Reverter é rodar de novo a seção 5 da `0004_banco_recusa_o_que_a_action_recusa.sql`
-- (o `create or replace function public.admin_definir_status ... $$;` e os
-- dois comandos de grant logo abaixo dele), dentro de `begin; ... commit;`,
-- seguido de `notify pgrst, 'reload schema';`. Não rode o arquivo 0004
-- inteiro: ele mexe em outras coisas.
--
-- Efeito da reversão: o banco volta a aprovar conta sem WhatsApp. A Server
-- Action continua recusando (ela confere antes de chamar a função), então a
-- tela não muda; só a porta do PostgREST direto reabre.
-- Nenhum dado é afetado por aplicar nem por reverter.
