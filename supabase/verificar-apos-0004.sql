-- ============================================================================
-- VERIFICAÇÃO APÓS A MIGRATION 0004
--
-- Rode DEPOIS de aplicar `migrations/0004_banco_recusa_o_que_a_action_recusa.sql`,
-- uma sonda por vez. NENHUMA altera dado: as que escrevem estão dentro de
-- transação com `rollback`, ou dentro de bloco que se desfaz sozinho.
--
-- ⚠️ NENHUMA SONDA FALA POR `raise notice` (SEC-035). Toda sonda devolve
-- TABELA, e o veredito está numa coluna.
--
-- ⚠️ A SONDA 2 ESPERA ERRO como resultado de sucesso. Está escrito nela.
--
-- ⚠️ A SONDA 3 É A QUE JUSTIFICA O ARQUIVO. Ela se passa, dentro de um bloco
-- que se desfaz no fim, pelo veterinário, pelo estabelecimento, por um admin
-- comum e por um master, e exercita cada regra nova da 0004 com CONTROLE
-- POSITIVO: para cada "o banco recusa", existe um "e aceita o caso certo".
-- Recusa sem controle positivo não prova nada: um banco que recusa TUDO
-- passaria.
--
-- COMO A SONDA 3 FUNCIONA (mesmo desenho da sonda 10 da 0003):
--   1. uma tabela temporária guarda o resultado;
--   2. o bloco `do` monta o cenário e roda cada caso dentro de uma
--      SUBTRANSAÇÃO, trocando de papel (`role` = authenticated) e plantando o
--      `sub` do JWT, exatamente como o PostgREST faz;
--   3. no fim, `raise exception` desfaz TUDO o que foi escrito; as conclusões
--      sobrevivem numa variável `jsonb`, que não volta atrás;
--   4. o último comando é um `select` na tabela temporária.
--   Rode o bloco INTEIRO, de uma vez: a tabela temporária vive na sessão.
--
-- ⚠️ DEPOIS DA 0004, A SONDA 10B DO `verificar-apos-0003.sql` QUEBRA, e é
-- esperado: ela grava `crmv = 'SP-99999'`, que o CHECK novo do R-059 recusa.
-- Aquele arquivo é registro histórico da 0003; não o rode de novo esperando
-- verde.
-- ============================================================================


-- ####### SONDA 1 — os 12 CHECKs, e quais nasceram validados ################
-- Esperado: 12 linhas.
--   `validada` = true   → nenhuma linha antiga fora da regra
--   `validada` = false  → NOT VALID: a regra vale para toda escrita nova, mas
--                         existe linha antiga fora dela. A consulta 4 do
--                         `prevoo-0004.sql` diz qual. Corrija e rode de novo a
--                         seção 8 da 0004.
-- Em PRODUÇÃO, `vet_profiles_crmv_formato` deve vir false até as duas contas
-- de teste com "GO-0155" e "GO 1522" serem corrigidas. No projeto de teste,
-- tudo true.
-- `definicao` é o que o Postgres guardou: confira que as listas são as do
-- `campos.ts`.
select
  con.conrelid::regclass::text  as tabela,
  con.conname                   as check_novo,
  con.convalidated              as validada,
  pg_get_constraintdef(con.oid) as definicao
from pg_constraint con
where con.conrelid in ('public.vet_profiles'::regclass, 'public.clinic_profiles'::regclass)
  and con.contype = 'c'
order by 1, 2;


-- ####### SONDA 2 — ⚠️ A PROVA DE ANTES, REFEITA: o furo da T-017 ##########
-- Em 23/09/2026 o Elber fez, com a conta vet de teste, só `anon key` + login,
-- `PATCH /rest/v1/vet_profiles?id=eq.<uuid> {"estado":"ZZ"}` → HTTP 200, e a
-- releitura devolveu "ZZ". Esta sonda faz o MESMO pedido, pelo mesmo caminho
-- que o PostgREST usa: papel `authenticated`, `sub` do JWT = o dono da linha,
-- `update ... where id = auth.uid()`.
--
-- ✅ SUCESSO = ERRO
--      `new row for relation "vet_profiles" violates check constraint
--       "vet_profiles_estado_valido"` (código 23514)
--    ⚠️ o NOME da constraint importa. Se o erro citar OUTRA constraint (por
--    exemplo `vet_profiles_crmv_formato`), a sonda pegou uma linha suja, e o
--    erro não prova nada sobre o estado: corrija a linha, ou use a sonda 3,
--    que monta uma linha limpa.
--
-- ❌ FALHA = uma linha na tela, com `estado_gravado` = ZZ. O furo continua
--    aberto: a 0004 não entrou, ou o CHECK não está onde deveria.
--
-- ⚠️ SONDA INVÁLIDA = "Success. No rows returned". O update não alcançou linha
--    nenhuma (nenhum vet com perfil, ou `auth.uid()` não leu o claim). Zero
--    linha aqui NÃO é aprovação.
--
-- A escolha da conta pula quem tem CRMV fora do formato, para o erro vir do
-- estado e não do CRMV.
begin;
  select set_config('vetria.alvo_t017',
    coalesce((select v.id::text
                from public.vet_profiles v
                join public.profiles p on p.id = v.id
               where p.role = 'vet'
                 and (v.crmv is null or v.crmv ~ '^[0-9]{1,6}$')
               order by v.created_at
               limit 1), ''), true) as _;
  select set_config('request.jwt.claims',
    json_build_object('sub', current_setting('vetria.alvo_t017', true), 'role', 'authenticated')::text,
    true) as _;
  select set_config('request.jwt.claim.sub', current_setting('vetria.alvo_t017', true), true) as _;
  set local role authenticated;

  update public.vet_profiles
     set estado = 'ZZ'
   where id = auth.uid()
  returning id as conta, estado as estado_gravado_SE_APARECER_E_FALHA;
rollback;


-- ####### SONDA 3 — cada regra nova, com controle positivo ##################
-- Esperado: TODAS as linhas com `veredito` = OK.
--
-- Precisa de: uma conta `vet`, uma `clinic` e uma `admin` no banco. A conta
-- admin é usada duas vezes, uma como admin comum e outra como master (o
-- `admin_level` dela é trocado DENTRO do bloco e volta sozinho no fim).
-- Faltando qualquer uma, a sonda devolve SONDA INVALIDA e diz o que falta.
--
-- Os blocos, e o que cada um prova:
--    0      a sonda se passa mesmo pela conta (auth.uid() leu o claim)
--    1-11   T-017 / R-039 / R-059: o dono não grava fora da regra, e grava
--           dentro dela (2 e 10 são o controle positivo)
--   20-31   SEC-096 / SEC-099: as transições de admin_definir_status
--   40-51   SEC-097(b) / SEC-093 / DL-066: quem lê o quê
--   60-62   SEC-098: concluir o onboarding exige o objeto no bucket
--
-- Leitura dos códigos no `obtido`:
--   23514  CHECK recusou          42501  sem autorização
--   55000  fora do estado exigido 22023  pedido inválido (motivo, transição)
--   linhas=N  o comando rodou e alcançou N linhas
--
-- ⚠️ O caso 62 insere uma linha em `storage.objects` (sem bytes, desfeita no
-- fim) para simular o documento enviado. Se o Supabase recusar esse insert, o
-- caso vira NAO MEDIDO e não reprova a sonda: aí a prova do caminho feliz é a
-- da tela (roteiro do card, passo f).
drop table if exists sonda3_0004;
create temporary table sonda3_0004 (
  ordem    int,
  cenario  text,
  esperado text,
  obtido   text,
  veredito text
);

do $sondatres$
declare
  dono        text := current_user;
  v_vet       uuid;
  v_clinic    uuid;
  v_admin     uuid;
  -- ordem | cenario | ator | alvo | status do alvo antes ('' = nao mexe) |
  -- montagem como postgres ('' = nenhuma) | comando como o ator | esperado
  casos constant text[][] := array[
    ['0',  'a sonda se passa pela conta vet (auth.uid() leu o claim)',
           'vet', 'vet', 'pending_validation', '',
           $c$select count(*) from (select 1 where auth.uid() = '%VET%'::uuid) x$c$, 'linhas=1'],

    -- ---------------------------------------------------------------- T-017
    ['1',  'T-017: vet grava estado = ZZ na propria linha (a medicao de 23/09)',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set estado = 'ZZ' where id = '%VET%' returning 1) select count(*) from u$c$, '23514'],
    ['2',  'controle positivo: vet grava bairro valido na propria linha',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set bairro = 'Bairro da Sonda' where id = '%VET%' returning 1) select count(*) from u$c$, 'linhas=1'],
    ['3',  'R-059: vet grava crmv = GO-0155 (sigla da UF dentro do numero)',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set crmv = 'GO-0155' where id = '%VET%' returning 1) select count(*) from u$c$, '23514'],
    ['4',  'T-017: vet grava crmv_uf = XX',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set crmv_uf = 'XX' where id = '%VET%' returning 1) select count(*) from u$c$, '23514'],
    ['5',  'T-017: vet grava titulo fora da lista',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set titulo = 'hacker' where id = '%VET%' returning 1) select count(*) from u$c$, '23514'],
    ['6',  'T-017: vet grava bio de 501 caracteres',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set bio = repeat('a', 501) where id = '%VET%' returning 1) select count(*) from u$c$, '23514'],
    ['7',  'T-017: vet grava 5 especialidades',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set especialidades = array['a','b','c','d','e'] where id = '%VET%' returning 1) select count(*) from u$c$, '23514'],
    ['8',  'T-017: estabelecimento grava site = javascript:alert(1)',
           'clinic', 'clinic', 'pending_validation', '',
           $c$with u as (update public.clinic_profiles set site = 'javascript:alert(1)' where id = '%CLINIC%' returning 1) select count(*) from u$c$, '23514'],
    ['9',  'T-017: estabelecimento grava site = data:text/html',
           'clinic', 'clinic', 'pending_validation', '',
           $c$with u as (update public.clinic_profiles set site = 'data:text/html,<script>1</script>' where id = '%CLINIC%' returning 1) select count(*) from u$c$, '23514'],
    ['10', 'controle positivo: estabelecimento grava site https valido',
           'clinic', 'clinic', 'pending_validation', '',
           $c$with u as (update public.clinic_profiles set site = 'https://exemplo.com.br/contato?x=1' where id = '%CLINIC%' returning 1) select count(*) from u$c$, 'linhas=1'],
    ['11', 'T-017: estabelecimento grava estado = ZZ',
           'clinic', 'clinic', 'pending_validation', '',
           $c$with u as (update public.clinic_profiles set estado = 'ZZ' where id = '%CLINIC%' returning 1) select count(*) from u$c$, '23514'],

    -- ---------------------------------------------------------------- SEC-096 / SEC-099
    ['20', 'SEC-096: admin comum aprova conta incomplete (nunca passou pela fila)',
           'admin', 'vet', 'incomplete', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'active', null)) x$c$, '55000'],
    ['21', 'SEC-096: admin comum reprova sem motivo',
           'admin', 'vet', 'pending_validation', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'incomplete', null)) x$c$, '22023'],
    ['22', 'SEC-096: admin comum reprova com motivo so de espacos',
           'admin', 'vet', 'pending_validation', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'incomplete', E'   \n  ')) x$c$, '22023'],
    ['23', 'SEC-096: admin comum devolve conta active para a fila (contornar a SEC-092)',
           'admin', 'vet', 'active', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'pending_validation', null)) x$c$, '22023'],
    ['24', 'SEC-096: admin comum tira do ar conta active como se fosse reprova',
           'admin', 'vet', 'active', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'incomplete', 'motivo da sonda com mais de dez')) x$c$, '55000'],
    ['25', 'admin comum suspende (so master pode)',
           'admin', 'vet', 'pending_validation', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'suspended', 'motivo da sonda')) x$c$, '42501'],
    ['26', 'controle positivo: admin comum aprova conta na fila',
           'admin', 'vet', 'pending_validation', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'active', null)) x$c$, 'linhas=1'],
    ['27', 'SEC-099: segunda decisao sobre a mesma conta, logo depois da 26',
           'admin', 'vet', '', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'incomplete', 'motivo da sonda com mais de dez')) x$c$, '55000'],
    ['28', 'controle positivo: admin comum reprova conta na fila, com motivo',
           'admin', 'vet', 'pending_validation', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'incomplete', 'motivo da sonda com mais de dez')) x$c$, 'linhas=1'],
    ['29', 'master suspende sem motivo',
           'master', 'vet', 'active', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'suspended', null)) x$c$, '22023'],
    ['30', 'controle positivo: master suspende com motivo',
           'master', 'vet', 'active', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'suspended', 'motivo da sonda')) x$c$, 'linhas=1'],
    ['31', 'controle positivo: master reativa a conta suspensa na 30',
           'master', 'vet', '', '',
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'active', null)) x$c$, 'linhas=1'],

    -- ---------------------------------------------------------------- SEC-097(b) / SEC-093 / DL-066
    ['40', 'SEC-097b: admin comum le o dossie (perfil_privado) de conta active',
           'admin', 'vet', 'active', '',
           $c$select count(*) from public.perfil_privado where id = '%VET%'$c$, 'linhas=0'],
    ['41', 'controle positivo: admin comum le o dossie de conta na fila (a fila continua cheia)',
           'admin', 'vet', 'pending_validation', '',
           $c$select count(*) from public.perfil_privado where id = '%VET%'$c$, 'linhas=1'],
    ['42', 'SEC-097b: admin comum le vet_profiles de conta incomplete',
           'admin', 'vet', 'incomplete', '',
           $c$select count(*) from public.vet_profiles where id = '%VET%'$c$, 'linhas=0'],
    ['43', 'controle positivo: admin comum le vet_profiles de conta na fila',
           'admin', 'vet', 'pending_validation', '',
           $c$select count(*) from public.vet_profiles where id = '%VET%'$c$, 'linhas=1'],
    ['44', 'admin comum le vet_profiles de conta active (pela policy PUBLICA, como todo mundo)',
           'admin', 'vet', 'active', '',
           $c$select count(*) from public.vet_profiles where id = '%VET%'$c$, 'linhas=1'],
    ['45', 'SEC-097b: admin comum le clinic_profiles de conta incomplete',
           'admin', 'clinic', 'incomplete', '',
           $c$select count(*) from public.clinic_profiles where id = '%CLINIC%'$c$, 'linhas=0'],
    ['46', 'controle positivo: admin comum le clinic_profiles de conta na fila',
           'admin', 'clinic', 'pending_validation', '',
           $c$select count(*) from public.clinic_profiles where id = '%CLINIC%'$c$, 'linhas=1'],
    ['47', 'DL-066: master continua lendo vet_profiles de conta incomplete',
           'master', 'vet', 'incomplete', '',
           $c$select count(*) from public.vet_profiles where id = '%VET%'$c$, 'linhas=1'],
    ['48', 'DL-066: master NAO le o dossie de conta active',
           'master', 'vet', 'active', '',
           $c$select count(*) from public.perfil_privado where id = '%VET%'$c$, 'linhas=0'],
    ['49', 'controle positivo: master le o dossie de conta na fila',
           'master', 'vet', 'pending_validation', '',
           $c$select count(*) from public.perfil_privado where id = '%VET%'$c$, 'linhas=1'],
    ['51', 'SEC-093: linha de vet_profiles com id de conta clinic nao aparece para admin comum',
           'admin', 'clinic', 'pending_validation',
           $c$insert into public.vet_profiles (id) values ('%CLINIC%') on conflict (id) do nothing$c$,
           $c$select count(*) from public.vet_profiles where id = '%CLINIC%'$c$, 'linhas=0'],

    -- ---------------------------------------------------------------- SEC-098
    ['60', 'SEC-098: vet conclui o onboarding sem documento',
           'vet', 'vet', 'incomplete',
           $c$update public.perfil_privado set documento_path = null, documento_hash = null, documento_tamanho = null where id = '%VET%'$c$,
           $c$select count(*) from (select public.concluir_onboarding_profissional()) x$c$, '55000'],
    ['61', 'SEC-098: vet conclui com caminho na linha e SEM objeto no bucket',
           'vet', 'vet', 'incomplete',
           $c$update public.perfil_privado set documento_path = '%VET%/documento-sonda0004.pdf', documento_hash = repeat('a', 64), documento_tamanho = 100 where id = '%VET%'$c$,
           $c$select count(*) from (select public.concluir_onboarding_profissional()) x$c$, '55000'],
    ['62', 'controle positivo: vet conclui com o objeto no bucket',
           'vet', 'vet', 'incomplete',
           $c$insert into storage.objects (bucket_id, name) values ('documentos', '%VET%/documento-sonda0004.pdf')$c$,
           $c$select count(*) from (select public.concluir_onboarding_profissional()) x$c$, 'linhas=1']
  ];
  i           int;
  ator        text;
  alvo_id     uuid;
  ator_id     uuid;
  status_alvo text;
  montagem    text;
  comando     text;
  esperado    text;
  obtido      text;
  detalhe     text;
  n           bigint;
  resultados  jsonb := '[]'::jsonb;
begin
  select id into v_vet    from public.profiles where role = 'vet'    order by created_at limit 1;
  select id into v_clinic from public.profiles where role = 'clinic' order by created_at limit 1;
  select id into v_admin  from public.profiles where role = 'admin'  order by created_at limit 1;

  if v_vet is null or v_clinic is null or v_admin is null then
    insert into sonda3_0004 values (0, 'montagem do cenario',
      'uma conta vet, uma clinic e uma admin no banco',
      format('vet=%s clinic=%s admin=%s', coalesce(v_vet::text, 'FALTA'),
             coalesce(v_clinic::text, 'FALTA'), coalesce(v_admin::text, 'FALTA')),
      'SONDA INVALIDA: crie a conta que falta e rode de novo. Admin: cadastre uma conta e promova pelo SQL Editor (role admin).');
    return;
  end if;

  begin
    -- ---------------------------------------------------------------------
    -- montagem geral, como o dono do banco: linhas LIMPAS, para que um CHECK
    -- recusar prove a regra testada, e não uma linha suja antiga.
    -- ---------------------------------------------------------------------
    insert into public.vet_profiles (id, nome_exibicao, crmv, crmv_uf, cidade, estado)
    values (v_vet, 'Sonda 0004', '12345', 'SP', 'Cidade da Sonda', 'SP')
    on conflict (id) do update
      set nome_exibicao = 'Sonda 0004', titulo = null, crmv = '12345', crmv_uf = 'SP',
          especialidades = '{}', experiencia = null, bio = null,
          cidade = 'Cidade da Sonda', estado = 'SP', bairro = null;

    insert into public.clinic_profiles (id, nome_fantasia, cidade, estado)
    values (v_clinic, 'Sonda 0004', 'Cidade da Sonda', 'SP')
    on conflict (id) do update
      set nome_fantasia = 'Sonda 0004', endereco = null, cep = null,
          cidade = 'Cidade da Sonda', estado = 'SP', sobre = null,
          servicos = '{}', site = null;

    insert into public.perfil_privado (id, telefone) values (v_vet, '11999990000')
    on conflict (id) do update set telefone = '11999990000';

    for i in 1 .. array_length(casos, 1) loop
      ator        := casos[i][3];
      alvo_id     := case casos[i][4] when 'vet' then v_vet else v_clinic end;
      ator_id     := case ator when 'vet' then v_vet when 'clinic' then v_clinic else v_admin end;
      status_alvo := casos[i][5];
      montagem    := replace(replace(casos[i][6], '%VET%', v_vet::text), '%CLINIC%', v_clinic::text);
      comando     := replace(replace(casos[i][7], '%VET%', v_vet::text), '%CLINIC%', v_clinic::text);
      esperado    := casos[i][8];
      obtido      := null;
      detalhe     := null;

      -- 1) montagem do caso, como o dono do banco
      begin
        if ator in ('admin', 'master') then
          update public.profiles
             set admin_level = (case when ator = 'master' then 'master' else 'admin' end)::admin_level
           where id = v_admin;
        end if;
        if status_alvo <> '' then
          update public.profiles
             set status = status_alvo::public.user_status, status_motivo = null
           where id = alvo_id;
        end if;
        if montagem <> '' then
          execute montagem;
        end if;
      exception when others then
        obtido  := 'MONTAGEM';
        detalhe := sqlstate || ' ' || sqlerrm;
      end;

      -- 2) o comando, como o ator, pelo mesmo caminho do PostgREST
      if obtido is null then
        begin
          perform set_config('request.jwt.claims',
            json_build_object('sub', ator_id::text, 'role', 'authenticated')::text, true);
          perform set_config('request.jwt.claim.sub', ator_id::text, true);
          perform set_config('role', 'authenticated', true);

          execute comando into n;

          perform set_config('role', dono, true);
          obtido := 'linhas=' || n;
        exception when others then
          -- a subtransação desfaz o `role` junto com o resto
          obtido  := sqlstate;
          detalhe := sqlerrm;
        end;
      end if;

      perform set_config('role', dono, true);

      resultados := resultados || jsonb_build_object(
        'ordem',    casos[i][1]::int,
        'cenario',  casos[i][2],
        'esperado', esperado,
        'obtido',   obtido || coalesce(' / ' || detalhe, ''),
        'veredito', case
          when obtido = esperado then 'OK'
          when obtido = 'MONTAGEM' and casos[i][1] = '62'
            then 'NAO MEDIDO: o Supabase recusou simular o objeto em storage.objects. Prove o caminho feliz pela tela.'
          when obtido = 'MONTAGEM'
            then 'SONDA INVALIDA: a montagem do caso falhou. Conserte a sonda, nao interprete o resultado.'
          when casos[i][1] = '0'
            then 'SONDA INVALIDA: auth.uid() nao leu o claim. Nenhuma outra linha desta tabela prova nada.'
          else 'FALHA'
        end
      );
    end loop;

    raise exception 'ROLLBACK_DA_SONDA';
  exception
    when others then
      if sqlerrm <> 'ROLLBACK_DA_SONDA' then
        resultados := resultados || jsonb_build_object(
          'ordem', 999,
          'cenario', 'execucao da sonda',
          'esperado', 'nenhum erro',
          'obtido', sqlstate || ' ' || sqlerrm,
          'veredito', 'SONDA INVALIDA: a sonda quebrou no meio. As linhas acima podem estar incompletas.'
        );
      end if;
  end;

  perform set_config('role', dono, true);

  -- Daqui pra baixo a subtransação já desfez tudo o que foi escrito no banco.
  insert into sonda3_0004 (ordem, cenario, esperado, obtido, veredito)
  select (e ->> 'ordem')::int, e ->> 'cenario', e ->> 'esperado', e ->> 'obtido', e ->> 'veredito'
  from jsonb_array_elements(resultados) e;
end
$sondatres$;

select * from sonda3_0004 order by ordem;


-- ####### SONDA 4 — a fila REAL continua cheia para o admin comum ###########
-- A sonda 3 prova a regra num cenário montado. Esta prova no dado de verdade:
-- o admin comum enxerga, pelas policies novas, EXATAMENTE o que está na fila.
-- É o critério do card: "e a fila do admin continua cheia (é a prova de que
-- as policies de leitura não caíram)".
--
-- Esperado: `veredito` = OK, com as colunas `*_admin_ve` iguais às `*_no_banco`.
-- Se `*_admin_ve` vier menor: as policies novas esconderam gente da fila. PARE.
-- Se vier maior: o admin comum está lendo fora da fila. PARE.
-- Com a fila vazia a sonda passa com zeros, e diz isso.
begin;
  select set_config('vetria.admin_sonda4',
    coalesce((select id::text from public.profiles where role = 'admin' order by created_at limit 1), ''),
    true) as _;

  -- o que está na fila, contado pelo dono do banco
  select set_config('vetria.fila',
    (select count(*) from public.profiles
      where role in ('vet','clinic') and status = 'pending_validation')::text, true) as _;
  select set_config('vetria.vet_no_banco',
    (select count(*) from public.vet_profiles v join public.profiles p on p.id = v.id
      where p.role = 'vet' and p.status = 'pending_validation')::text, true) as _;
  select set_config('vetria.clinic_no_banco',
    (select count(*) from public.clinic_profiles c join public.profiles p on p.id = c.id
      where p.role = 'clinic' and p.status = 'pending_validation')::text, true) as _;
  select set_config('vetria.privado_no_banco',
    (select count(*) from public.perfil_privado pp join public.profiles p on p.id = pp.id
      where p.role in ('vet','clinic') and p.status = 'pending_validation')::text, true) as _;
  select set_config('vetria.privado_total',
    (select count(*) from public.perfil_privado)::text, true) as _;

  -- a conta admin vira admin COMUM só dentro desta transação
  update public.profiles set admin_level = 'admin'
   where id = nullif(current_setting('vetria.admin_sonda4', true), '')::uuid;

  select set_config('request.jwt.claims',
    json_build_object('sub', current_setting('vetria.admin_sonda4', true), 'role', 'authenticated')::text,
    true) as _;
  select set_config('request.jwt.claim.sub', current_setting('vetria.admin_sonda4', true), true) as _;
  set local role authenticated;

  select
    current_setting('vetria.fila', true)             as na_fila,
    current_setting('vetria.vet_no_banco', true)     as vet_no_banco,
    (select count(*) from public.vet_profiles v
      where exists (select 1 from public.profiles p
                     where p.id = v.id and p.status = 'pending_validation'))
                                                     as vet_admin_ve,
    current_setting('vetria.clinic_no_banco', true)  as clinic_no_banco,
    (select count(*) from public.clinic_profiles c
      where exists (select 1 from public.profiles p
                     where p.id = c.id and p.status = 'pending_validation'))
                                                     as clinic_admin_ve,
    current_setting('vetria.privado_no_banco', true) as privado_no_banco,
    (select count(*) from public.perfil_privado)     as privado_admin_ve,
    current_setting('vetria.privado_total', true)    as privado_total_no_banco,
    case
      when nullif(current_setting('vetria.admin_sonda4', true), '') is null
        then 'SONDA INVALIDA: nao ha conta admin no banco.'
      when auth.uid() is null
        then 'SONDA INVALIDA: auth.uid() nao leu o claim.'
      when (select count(*) from public.vet_profiles v
             where exists (select 1 from public.profiles p where p.id = v.id and p.status = 'pending_validation'))::text
             = current_setting('vetria.vet_no_banco', true)
       and (select count(*) from public.clinic_profiles c
             where exists (select 1 from public.profiles p where p.id = c.id and p.status = 'pending_validation'))::text
             = current_setting('vetria.clinic_no_banco', true)
       and (select count(*) from public.perfil_privado)::text
             = current_setting('vetria.privado_no_banco', true)
        then case when current_setting('vetria.fila', true) = '0'
                  then 'OK (com a fila vazia: rode de novo quando houver alguem na fila para a prova valer)'
                  else 'OK: o admin comum ve a fila inteira, e do dossie so a fila' end
      else 'FALHA: o que o admin comum ve nao bate com a fila. Compare as colunas.'
    end as veredito;
rollback;


-- ####### SONDA 5 — a busca pública não foi tocada ##########################
-- A 0004 não mexe em `*_select_publico` nem em `perfil_esta_ativo`. Esta sonda
-- existe porque "não mexi" é afirmação, e a SEC-014 ensinou que a busca
-- pública morre em silêncio: quem está logado nunca vê.
--
-- Esperado: `anon_ve_TEM_QUE_SER_IGUAL` = `vets_active_no_banco`. Com zero vet
-- active, os dois dão 0 e a sonda não prova nada; diga isso no card.
begin;
  select set_config('vetria.vets_active',
    (select count(*) from public.vet_profiles v join public.profiles p on p.id = v.id
      where p.role = 'vet' and p.status = 'active')::text, true) as _;
  set local role anon;
  select
    current_setting('vetria.vets_active', true)  as vets_active_no_banco,
    (select count(*) from public.vet_profiles)   as anon_ve_TEM_QUE_SER_IGUAL;
rollback;
