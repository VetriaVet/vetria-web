-- ============================================================================
-- VERIFICAÇÃO APÓS A MIGRATION 0005 (e o seed de cidades)
--
-- ⚠️ AS SONDAS RODAM UMA POR VEZ. Selecione UMA sonda (do cabeçalho "SONDA N"
-- até o cabeçalho seguinte), rode, leia, anote no card, e só então a próxima.
-- O SQL Editor mostra só o resultado do último comando: colar o arquivo
-- inteiro esconde tudo menos a última sonda.
--
-- ⚠️ ORDEM: migration 0005 → seed-0005-cidades-ibge.sql → este arquivo.
-- A sonda 2 e a sonda 6 dependem do seed.
--
-- NENHUMA sonda altera dado: as que escrevem desfazem tudo no fim (bloco que
-- termina em exceção proposital, ou `begin ... rollback`).
--
-- ⚠️ NENHUMA SONDA FALA POR `raise notice` (SEC-035). Toda sonda devolve
-- TABELA, e o veredito está numa coluna.
--
-- ⚠️ Os marcadores de bloco entre cifrões são só letras, sem número: o SQL
-- Editor do Supabase quebra com marcador que tem dígito.
-- ============================================================================


-- ####### SONDA 1 — o catálogo e o seed ####################################
-- Esperado: TODAS as linhas com `ok` = true.
select * from (
  select 1 as ordem, 'cidades: 5571 municipios' as item,
         (select count(*) from public.cidades) = 5571 as ok,
         (select count(*) from public.cidades)::text as leitura
  union all
  select 2, 'cidades: 27 UFs', (select count(distinct uf) from public.cidades) = 27,
         (select count(distinct uf) from public.cidades)::text
  union all
  select 3, 'cidades: amostras (Goiania/GO, Sao Paulo/SP, Brasilia/DF)',
         (select count(*) from public.cidades
           where (slug, codigo_ibge) in (('goiania-go', 5208707), ('sao-paulo-sp', 3550308), ('brasilia-df', 5300108))) = 3,
         (select string_agg(nome || '/' || uf, ', ') from public.cidades
           where slug in ('goiania-go', 'sao-paulo-sp', 'brasilia-df'))
  union all
  select 4, 'especialidades: 12', (select count(*) from public.especialidades) = 12,
         (select string_agg(slug, ', ' order by ordem) from public.especialidades)
  union all
  select 5, 'servicos: 9', (select count(*) from public.servicos) = 9,
         (select string_agg(slug, ', ' order by ordem) from public.servicos)
  union all
  select 6, 'RLS ligada nas 3 tabelas de apoio',
         (select bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relname in ('especialidades', 'servicos', 'cidades')),
         'se false: tabela sem RLS'
  union all
  select 7, 'so leitura publica nas 3 (uma policy SELECT using true em cada)',
         (select count(*) = 3 and bool_and(cmd = 'SELECT' and qual = 'true') from pg_policies
           where schemaname = 'public' and tablename in ('especialidades', 'servicos', 'cidades')),
         (select string_agg(tablename || '.' || policyname, ', ') from pg_policies
           where schemaname = 'public' and tablename in ('especialidades', 'servicos', 'cidades'))
  union all
  select 8, 'os 3 triggers novos existem e estao ligados',
         (select count(*) = 3 from pg_trigger
           where tgname in ('trg_vet_profiles_especialidades_da_lista', 'trg_clinic_profiles_servicos_da_lista',
                            'trg_profiles_slug_ao_ativar') and tgenabled <> 'D'),
         'se false: a pertenca ou o slug na aprovacao nao estao valendo'
  union all
  select 9, 'CHECKs de formato do slug validados',
         (select count(*) = 2 and bool_and(convalidated) from pg_constraint
           where conname in ('vet_profiles_slug_formato', 'clinic_profiles_slug_formato')),
         'se false: ha slug fora do formato gravado fora da migration'
  union all
  select 10, 'nenhuma conta active com perfil e sem slug (R-065)',
         not exists (
           select 1 from public.profiles p
           left join public.vet_profiles v on v.id = p.id
           left join public.clinic_profiles c on c.id = p.id
           where p.status = 'active'
             and ((p.role = 'vet' and v.id is not null and v.slug is null)
               or (p.role = 'clinic' and c.id is not null and c.slug is null))),
         'se false: a sonda 3 lista quem'
) s
order by ordem;


-- ####### SONDA 2 — cada regra nova, com controle positivo ##################
-- Esperado: TODAS as linhas com `veredito` = OK. As linhas 27 e 28 podem vir
-- NAO MEDIDO se o banco tiver uma conta vet só (o vetria-e2e, por exemplo):
-- a colisão precisa de uma segunda conta vet com perfil.
--
-- Precisa de: uma conta `vet`, uma `clinic` e uma `admin`. A admin é usada
-- como admin comum e como master (o `admin_level` é trocado DENTRO do bloco e
-- volta sozinho no fim). Faltando alguma, a sonda diz SONDA INVALIDA.
--
-- Como funciona (o mesmo desenho da sonda 3 da 0004): cada caso roda numa
-- subtransação, trocando de papel e plantando o `sub` do JWT como o
-- PostgREST faz; no fim, uma exceção proposital desfaz TUDO; as conclusões
-- sobrevivem numa variável e vão para a tabela temporária. Rode o bloco
-- INTEIRO (do `drop table` até o `select` final), de uma vez.
--
-- Os blocos:
--    0      a sonda se passa mesmo pela conta
--    1-9    tabelas de apoio: todo mundo lê, ninguém escreve; o slug não é RPC
--   10-15   a pertença à lista, com controle positivo
--   20-30   o slug: o dono não escreve, a aprovação gera, é estável, a
--           reprova não gera, colisão ganha sufixo, a reativação gera
--   40-45   a busca: acha o active, NÃO acha quem não é active, casa cidade
--           sem acento, filtra tipo de atendimento, e não chega no privado
--
-- Códigos no `obtido`: 23514 lista/CHECK recusou · 42501 sem permissão ·
-- linhas=N o comando rodou e alcançou N linhas.
drop table if exists sonda_0005;
create temporary table sonda_0005 (
  ordem    int,
  cenario  text,
  esperado text,
  obtido   text,
  veredito text
);

do $sondadois$
declare
  dono       text := current_user;
  v_vet      uuid;
  v_vet_dois uuid;
  v_clinic   uuid;
  v_admin    uuid;
  -- ordem | cenario | ator | alvo | status do alvo antes ('' = nao mexe) |
  -- montagem como o dono do banco ('' = nenhuma) | comando como o ator | esperado
  casos constant text[][] := array[
    ['0',  'a sonda se passa pela conta vet (auth.uid() leu o claim)',
           'vet', 'vet', 'pending_validation', '',
           $c$select count(*) from (select 1 where auth.uid() = '%VET%'::uuid) x$c$, 'linhas=1'],

    -- ------------------------------------------------ tabelas de apoio
    ['1',  'anon le a lista de especialidades',
           'anon', 'vet', '', '', $c$select count(*) from public.especialidades$c$, 'linhas=12'],
    ['2',  'anon le a lista de servicos',
           'anon', 'vet', '', '', $c$select count(*) from public.servicos$c$, 'linhas=9'],
    ['3',  'anon le a lista de cidades (seed carregado)',
           'anon', 'vet', '', '', $c$select count(*) from public.cidades$c$, 'linhas=5571'],
    ['4',  'anon insere especialidade',
           'anon', 'vet', '', '',
           $c$with u as (insert into public.especialidades (nome, slug, ordem) values ('Sonda', 'sonda', 99) returning 1) select count(*) from u$c$, '42501'],
    ['5',  'vet logado insere especialidade',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (insert into public.especialidades (nome, slug, ordem) values ('Sonda', 'sonda', 99) returning 1) select count(*) from u$c$, '42501'],
    ['6',  'vet logado apaga um servico',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (delete from public.servicos where nome = 'Farmácia' returning 1) select count(*) from u$c$, '42501'],
    ['7',  'vet logado renomeia uma cidade',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.cidades set nome = 'Sonda' where codigo_ibge = 3550308 returning 1) select count(*) from u$c$, '42501'],
    ['8',  'anon chama gerar_slug_do_perfil por RPC',
           'anon', 'vet', '', '',
           $c$select count(*) from (select public.gerar_slug_do_perfil('%VET%', 'vet')) x$c$, '42501'],
    ['9',  'vet logado chama gerar_slug_do_perfil por RPC',
           'vet', 'vet', 'pending_validation', '',
           $c$select count(*) from (select public.gerar_slug_do_perfil('%VET%', 'vet')) x$c$, '42501'],

    -- ------------------------------------------------ pertença à lista
    ['10', 'vet grava especialidade fora da lista',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set especialidades = array['Clínica geral', 'Especialidade Inventada'] where id = '%VET%' returning 1) select count(*) from u$c$, '23514'],
    ['11', 'vet grava especialidade repetida',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set especialidades = array['Cardiologia', 'Cardiologia'] where id = '%VET%' returning 1) select count(*) from u$c$, '23514'],
    ['12', 'controle positivo: vet grava duas especialidades da lista',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set especialidades = array['Clínica geral', 'Cardiologia'] where id = '%VET%' returning 1) select count(*) from u$c$, 'linhas=1'],
    ['13', 'controle positivo: vet salva outra coluna reenviando a mesma lista',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set bairro = 'Bairro da Sonda', especialidades = array['Clínica geral', 'Cardiologia'] where id = '%VET%' returning 1) select count(*) from u$c$, 'linhas=1'],
    ['14', 'estabelecimento grava servico fora da lista',
           'clinic', 'clinic', 'pending_validation', '',
           $c$with u as (update public.clinic_profiles set servicos = array['Hotelzinho'] where id = '%CLINIC%' returning 1) select count(*) from u$c$, '23514'],
    ['15', 'controle positivo: estabelecimento grava servicos da lista',
           'clinic', 'clinic', 'pending_validation', '',
           $c$with u as (update public.clinic_profiles set servicos = array['Vacinação', 'Banho & tosa'] where id = '%CLINIC%' returning 1) select count(*) from u$c$, 'linhas=1'],

    -- ------------------------------------------------ slug
    ['20', 'SEC-008: vet escreve o proprio slug',
           'vet', 'vet', 'pending_validation', '',
           $c$with u as (update public.vet_profiles set slug = 'meu-endereco' where id = '%VET%' returning 1) select count(*) from u$c$, '42501'],
    ['21', 'controle positivo: admin comum aprova conta na fila',
           'admin', 'vet', 'pending_validation',
           $c$update public.vet_profiles set slug = null, nome_exibicao = 'Sonda Cinco', cidade = 'Cidade da Sonda', estado = 'SP' where id = '%VET%'$c$,
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'active', null)) x$c$, 'linhas=1'],
    ['22', 'DL-067: a aprovacao gerou o slug nome-cidade-uf',
           'dono', 'vet', '', '',
           $c$select count(*) from public.vet_profiles where id = '%VET%' and slug = 'sonda-cinco-cidade-da-sonda-sp'$c$, 'linhas=1'],
    ['23', 'estabilidade: o nome muda, a conta volta para a fila e e aprovada de novo',
           'admin', 'vet', 'pending_validation',
           $c$update public.vet_profiles set nome_exibicao = 'Outro Nome da Sonda' where id = '%VET%'$c$,
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'active', null)) x$c$, 'linhas=1'],
    ['24', 'DL-067: o slug continua o primeiro',
           'dono', 'vet', '', '',
           $c$select count(*) from public.vet_profiles where id = '%VET%' and slug = 'sonda-cinco-cidade-da-sonda-sp'$c$, 'linhas=1'],
    ['25', 'controle: reprovar a conta na fila',
           'admin', 'vet', 'pending_validation',
           $c$update public.vet_profiles set slug = null where id = '%VET%'$c$,
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'incomplete', 'motivo da sonda com mais de dez')) x$c$, 'linhas=1'],
    ['26', 'reprovar NAO gera slug',
           'dono', 'vet', '', '',
           $c$select count(*) from public.vet_profiles where id = '%VET%' and slug is null$c$, 'linhas=1'],
    ['27', 'colisao: outra conta ja tem o endereco, e esta e aprovada',
           'admin', 'vet', 'pending_validation',
           $c$update public.vet_profiles set slug = case when id = '%VETDOIS%' then 'sonda-cinco-cidade-da-sonda-sp' else null end, nome_exibicao = case when id = '%VET%' then 'Sonda Cinco' else nome_exibicao end where id in ('%VET%', '%VETDOIS%')$c$,
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'active', null)) x$c$, 'linhas=1'],
    ['28', 'DL-067: a colisao ganhou o sufixo -2',
           'dono', 'vet', '', '',
           $c$select count(*) from public.vet_profiles where id = '%VET%' and slug = 'sonda-cinco-cidade-da-sonda-sp-2'$c$, 'linhas=1'],
    ['29', 'master reativa conta suspensa sem slug',
           'master', 'vet', 'suspended',
           $c$update public.vet_profiles set slug = null where id = '%VET%'$c$,
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'active', null)) x$c$, 'linhas=1'],
    ['30', 'a reativacao gerou o slug',
           'dono', 'vet', '', '',
           $c$select count(*) from public.vet_profiles where id = '%VET%' and slug is not null$c$, 'linhas=1'],

    -- ------------------------------------------------ busca
    ['40', 'anon acha o vet active pela especialidade, digitada sem acento',
           'anon', 'vet', 'active',
           $c$update public.vet_profiles set especialidades = array['Clínica geral'] where id = '%VET%'$c$,
           $c$select count(*) from public.vet_profiles where id = '%VET%' and busca @@ plainto_tsquery('portuguese', public.sem_acento('clinica geral'))$c$, 'linhas=1'],
    ['41', 'indice nao e filtro: anon NAO acha o mesmo vet em pending_validation',
           'anon', 'vet', 'pending_validation', '',
           $c$select count(*) from public.vet_profiles where id = '%VET%' and busca @@ plainto_tsquery('portuguese', public.sem_acento('clinica geral'))$c$, 'linhas=0'],
    ['42', 'anon casa a cidade da lista com o texto gravado sem acento (goiania/GO)',
           'anon', 'vet', 'active',
           $c$update public.vet_profiles set cidade = 'goiania ', estado = 'GO' where id = '%VET%'$c$,
           $c$select count(*) from public.vet_profiles v join public.cidades c on c.uf = v.estado and c.chave = public.chave_de_nome(v.cidade) where v.id = '%VET%' and c.slug = 'goiania-go'$c$, 'linhas=1'],
    ['43', 'anon filtra por tipo de atendimento (domiciliar)',
           'anon', 'vet', 'active',
           $c$update public.vet_profiles set atende_domiciliar = true where id = '%VET%'$c$,
           $c$select count(*) from public.vet_profiles where id = '%VET%' and atende_domiciliar$c$, 'linhas=1'],
    ['44', 'anon acha o estabelecimento active pelo servico',
           'anon', 'clinic', 'active',
           $c$update public.clinic_profiles set servicos = array['Banho & tosa'] where id = '%CLINIC%'$c$,
           $c$select count(*) from public.clinic_profiles where id = '%CLINIC%' and busca @@ plainto_tsquery('portuguese', public.sem_acento('banho tosa'))$c$, 'linhas=1'],
    ['45', 'a busca nao chega no privado: anon le perfil_privado',
           'anon', 'vet', 'active', '',
           $c$select count(*) from public.perfil_privado$c$, '42501']
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
  select v.id into v_vet_dois
    from public.vet_profiles v join public.profiles p on p.id = v.id
   where p.role = 'vet' and v.id <> v_vet
   order by p.created_at limit 1;

  if v_vet is null or v_clinic is null or v_admin is null then
    insert into sonda_0005 values (0, 'montagem do cenario',
      'uma conta vet, uma clinic e uma admin no banco',
      format('vet=%s clinic=%s admin=%s', coalesce(v_vet::text, 'FALTA'),
             coalesce(v_clinic::text, 'FALTA'), coalesce(v_admin::text, 'FALTA')),
      'SONDA INVALIDA: crie a conta que falta e rode de novo.');
    return;
  end if;

  begin
    -- montagem geral, como o dono do banco: linhas LIMPAS e conhecidas
    insert into public.vet_profiles (id, nome_exibicao, crmv, crmv_uf, cidade, estado)
    values (v_vet, 'Sonda Cinco', '12345', 'SP', 'Cidade da Sonda', 'SP')
    on conflict (id) do update
      set slug = null, nome_exibicao = 'Sonda Cinco', titulo = null, crmv = '12345', crmv_uf = 'SP',
          especialidades = '{}', experiencia = null, bio = null, cidade = 'Cidade da Sonda',
          estado = 'SP', bairro = null, atende_presencial = false, atende_domiciliar = false,
          atende_teleorientacao = false;

    insert into public.clinic_profiles (id, nome_fantasia, cidade, estado)
    values (v_clinic, 'Sonda Cinco', 'Cidade da Sonda', 'SP')
    on conflict (id) do update
      set slug = null, nome_fantasia = 'Sonda Cinco', endereco = null, cep = null,
          cidade = 'Cidade da Sonda', estado = 'SP', sobre = null, servicos = '{}', site = null;

    for i in 1 .. array_length(casos, 1) loop
      ator        := casos[i][3];
      alvo_id     := case casos[i][4] when 'vet' then v_vet else v_clinic end;
      ator_id     := case ator when 'vet' then v_vet when 'clinic' then v_clinic
                                when 'admin' then v_admin when 'master' then v_admin else null end;
      status_alvo := casos[i][5];
      montagem    := replace(replace(replace(casos[i][6], '%VETDOIS%', coalesce(v_vet_dois::text, '00000000-0000-0000-0000-000000000000')),
                                     '%VET%', v_vet::text), '%CLINIC%', v_clinic::text);
      comando     := replace(replace(casos[i][7], '%VET%', v_vet::text), '%CLINIC%', v_clinic::text);
      esperado    := casos[i][8];
      obtido      := null;
      detalhe     := null;

      if casos[i][1] in ('27', '28') and v_vet_dois is null then
        resultados := resultados || jsonb_build_object(
          'ordem', casos[i][1]::int, 'cenario', casos[i][2], 'esperado', esperado,
          'obtido', 'sem segunda conta vet com perfil',
          'veredito', 'NAO MEDIDO: precisa de uma segunda conta vet com perfil. Nao reprova a sonda.');
        continue;
      end if;

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
          if ator = 'anon' then
            perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
            perform set_config('request.jwt.claim.sub', '', true);
            perform set_config('role', 'anon', true);
          elsif ator <> 'dono' then
            perform set_config('request.jwt.claims',
              json_build_object('sub', ator_id::text, 'role', 'authenticated')::text, true);
            perform set_config('request.jwt.claim.sub', ator_id::text, true);
            perform set_config('role', 'authenticated', true);
          end if;

          execute comando into n;

          perform set_config('role', dono, true);
          obtido := 'linhas=' || n;
        exception when others then
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
          when obtido = 'MONTAGEM'
            then 'SONDA INVALIDA: a montagem do caso falhou. Conserte a sonda, nao interprete o resultado.'
          when casos[i][1] = '0'
            then 'SONDA INVALIDA: auth.uid() nao leu o claim. Nenhuma outra linha desta tabela prova nada.'
          when casos[i][1] = '3' and obtido = 'linhas=0'
            then 'FALHA: cidades vazia. Rode o seed-0005-cidades-ibge.sql antes desta sonda.'
          else 'FALHA'
        end
      );
    end loop;

    raise exception 'ROLLBACK_DA_SONDA';
  exception
    when others then
      if sqlerrm <> 'ROLLBACK_DA_SONDA' then
        resultados := resultados || jsonb_build_object(
          'ordem', 999, 'cenario', 'execucao da sonda', 'esperado', 'nenhum erro',
          'obtido', sqlstate || ' ' || sqlerrm,
          'veredito', 'SONDA INVALIDA: a sonda quebrou no meio. As linhas acima podem estar incompletas.');
      end if;
  end;

  perform set_config('role', dono, true);

  insert into sonda_0005 (ordem, cenario, esperado, obtido, veredito)
  select (e ->> 'ordem')::int, e ->> 'cenario', e ->> 'esperado', e ->> 'obtido', e ->> 'veredito'
  from jsonb_array_elements(resultados) e;
end
$sondadois$;

select * from sonda_0005 order by ordem;


-- ####### SONDA 3 — R-065 no dado de verdade: toda conta active tem endereço #
-- Uma linha por conta vet/clinic `active`. Esperado: `veredito` = OK em todas.
-- Anote os endereços no card: são os links da página pública da S7.
select
  p.id,
  p.role,
  coalesce(v.slug, c.slug) as slug,
  case
    when v.id is null and c.id is null then 'OK (sem linha de perfil: nao ha o que mostrar)'
    when coalesce(v.slug, c.slug) is null then 'FALHA: active sem slug'
    when coalesce(v.slug, c.slug) !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then 'FALHA: slug fora do formato'
    else 'OK'
  end as veredito
from public.profiles p
left join public.vet_profiles    v on v.id = p.id and p.role = 'vet'
left join public.clinic_profiles c on c.id = p.id and p.role = 'clinic'
where p.role in ('vet', 'clinic') and p.status = 'active'
order by p.created_at;


-- ####### SONDA 4 — dado gravado fora das listas (o que o pré-voo previu) ####
-- Esperado: ZERO linhas (o pré-voo, consultas 2 a 4, disse o mesmo). Linha
-- aqui é conta que, ao MUDAR a lista, vai ouvir que um item não vale mais. Ela
-- corrige pelo "Rever e corrigir o cadastro". Anote os ids no card.
select 'vet_profiles' as tabela, v.id, item as fora_da_lista
from public.vet_profiles v cross join lateral unnest(v.especialidades) as item
where not exists (select 1 from public.especialidades e where e.nome = item)
union all
select 'clinic_profiles', c.id, item
from public.clinic_profiles c cross join lateral unnest(c.servicos) as item
where not exists (select 1 from public.servicos s where s.nome = item);


-- ####### SONDA 5 — a busca pública não abriu ninguém (SEC-014) ##############
-- Como `anon`, o que ele enxerga tem que ser EXATAMENTE quem está active. A
-- coluna `busca` nova é legível junto com a linha; esta sonda prova que a
-- linha continua sendo só a de quem pode.
-- Esperado: `veredito` = OK. Com zero active, os números dão 0 e a sonda não
-- prova nada: diga isso no card.
begin;
  select set_config('vetria.vets_active',
    (select count(*) from public.vet_profiles v join public.profiles p on p.id = v.id
      where p.role = 'vet' and p.status = 'active')::text, true) as _;
  select set_config('vetria.clinics_active',
    (select count(*) from public.clinic_profiles c join public.profiles p on p.id = c.id
      where p.role = 'clinic' and p.status = 'active')::text, true) as _;
  set local role anon;
  select
    current_setting('vetria.vets_active', true)     as vets_active_no_banco,
    (select count(*) from public.vet_profiles)      as vets_que_anon_ve,
    current_setting('vetria.clinics_active', true)  as clinics_active_no_banco,
    (select count(*) from public.clinic_profiles)   as clinics_que_anon_ve,
    case
      when (select count(*) from public.vet_profiles)::text = current_setting('vetria.vets_active', true)
       and (select count(*) from public.clinic_profiles)::text = current_setting('vetria.clinics_active', true)
        then case when current_setting('vetria.vets_active', true) = '0'
                   and current_setting('vetria.clinics_active', true) = '0'
                  then 'OK (com zero active: nao prova nada, anote)'
                  else 'OK: anon ve exatamente quem esta active' end
      else 'FALHA: o que anon ve nao bate com quem esta active. PARE.'
    end as veredito;
rollback;


-- ####### SONDA 6 — R-059: cidade que não casa com a UF gravada ##############
-- Informativo, não reprova nada. Lista cada conta vet/clinic cuja cidade NÃO
-- é um município da UF gravada, e onde existe um município com esse nome
-- (`existe_em`). É o "Goiânia / AP" que o Elber viu em 23/09.
-- Conta nesta lista NÃO aparece quando a busca filtrar pela cidade certa, até
-- corrigir. Anote no card; a correção é da própria conta (onboarding em modo
-- revisão), ou a cidade vira lista na tela (card futuro).
select
  p.role,
  p.status,
  x.id,
  x.cidade,
  x.estado,
  (select string_agg(c2.nome || '/' || c2.uf, ', ' order by c2.uf)
     from public.cidades c2 where c2.chave = public.chave_de_nome(x.cidade)) as existe_em
from (
  select id, cidade, estado from public.vet_profiles
  union all
  select id, cidade, estado from public.clinic_profiles
) x
join public.profiles p on p.id = x.id
where x.cidade is not null
  and not exists (select 1 from public.cidades c
                   where c.uf = x.estado and c.chave = public.chave_de_nome(x.cidade))
order by p.status, x.estado, x.cidade;
