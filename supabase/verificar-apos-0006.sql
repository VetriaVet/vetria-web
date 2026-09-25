-- ============================================================================
-- VERIFICAÇÃO APÓS A MIGRATION 0006
--
-- ⚠️ AS SONDAS RODAM UMA POR VEZ. Selecione UMA sonda (do cabeçalho "SONDA N"
-- até o cabeçalho seguinte), rode, leia, anote no card, e só então a próxima.
-- O SQL Editor mostra só o resultado do último comando: colar o arquivo
-- inteiro esconde tudo menos a última sonda.
--
-- NENHUMA sonda deixa dado para trás: a sonda 2 escreve (contatos de teste,
-- slug, status) e desfaz TUDO no fim com uma exceção proposital. Depois dela,
-- `contatos` continua com as mesmas linhas de antes (a sonda 3 confere).
--
-- ⚠️ NENHUMA SONDA FALA POR `raise notice` (SEC-035). Toda sonda devolve
-- TABELA, e o veredito está numa coluna.
--
-- ⚠️ Os marcadores de bloco entre cifrões são só letras, sem número: o SQL
-- Editor do Supabase quebra com marcador que tem dígito.
--
-- ⚠️ A sonda 2 NÃO imprime número de telefone: ela planta um WhatsApp falso
-- ('62900000001') na conta de teste e confere por contagem. Nada de dado de
-- gente real sai na tela.
-- ============================================================================


-- ####### SONDA 1 — o catálogo ##############################################
-- Esperado: TODAS as linhas com `ok` = true. (É o mesmo que o select final da
-- migration mostrou; rodar de novo aqui prova que nada mudou depois.)
select * from (
  select 1 as ordem, 'registrar_contato: EXECUTE so service_role' as item,
         not has_function_privilege('anon', 'public.registrar_contato(text, text, uuid, uuid, text, text)', 'EXECUTE')
         and not has_function_privilege('authenticated', 'public.registrar_contato(text, text, uuid, uuid, text, text)', 'EXECUTE')
         and has_function_privilege('service_role', 'public.registrar_contato(text, text, uuid, uuid, text, text)', 'EXECUTE') as ok,
         'se false: o numero sai por /rest/v1/rpc' as leitura
  union all
  select 2, 'vincular_contatos_do_visitante: EXECUTE so service_role',
         not has_function_privilege('anon', 'public.vincular_contatos_do_visitante(uuid, uuid)', 'EXECUTE')
         and not has_function_privilege('authenticated', 'public.vincular_contatos_do_visitante(uuid, uuid)', 'EXECUTE')
         and has_function_privilege('service_role', 'public.vincular_contatos_do_visitante(uuid, uuid)', 'EXECUTE'),
         'se false: qualquer logado puxa o historico de um cookie'
  union all
  select 3, 'contatos: authenticated sem SELECT na tabela, sem anon_id e sem user_id',
         not has_table_privilege('authenticated', 'public.contatos', 'SELECT')
         and not has_column_privilege('authenticated', 'public.contatos', 'anon_id', 'SELECT')
         and not has_column_privilege('authenticated', 'public.contatos', 'user_id', 'SELECT'),
         'se false: R-074 aberto'
  union all
  select 4, 'contatos: CHECK contatos_tem_origem_ou_anonimizado validado, o antigo fora',
         exists (select 1 from pg_constraint where conrelid = 'public.contatos'::regclass
                  and conname = 'contatos_tem_origem_ou_anonimizado' and convalidated)
         and not exists (select 1 from pg_constraint where conrelid = 'public.contatos'::regclass
                  and conname = 'contatos_tem_origem'),
         'se false: R-076 aberto'
  union all
  select 5, 'os 4 triggers (anonimizar, slug protegido x2, slug ao ativar) ligados',
         (select count(*) = 4 from pg_trigger
           where tgname in ('trg_contatos_anonimizar', 'trg_vet_profiles_slug_protegido',
                            'trg_clinic_profiles_slug_protegido', 'trg_profiles_slug_ao_ativar')
             and tgenabled <> 'D'),
         'se false: falta trigger'
  union all
  select 6, 'hashes sem espaco: gerar_slug_do_perfil e slug_ao_ativar da 0006',
         (select count(*) = 2 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and ((p.proname = 'gerar_slug_do_perfil'
                   and md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) = '8cdba6b87eded20e7e9c3ab16bb09a7f')
               or (p.proname = 'slug_ao_ativar'
                   and md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) = '6e2da6385b4ddca66cd51863b207e8ce'))),
         'se false: a funcao foi mexida depois da 0006'
) s
order by ordem;


-- ####### SONDA 2 — cada regra nova, com controle positivo ##################
-- Esperado: TODAS as linhas com `veredito` = OK (59 linhas).
-- Os limites (21 a 25) contam profissionais DISTINTOS: a sonda planta
-- contatos antigos apontando para outras contas (4 para o limite curto, 5
-- para a janela, 20 para o limite de 24 h). Se o banco não tiver 20 outras
-- contas, ela cria as que faltam em `profiles` (sem login) e as desfaz no
-- fim com todo o resto (a sonda 3 e a consulta de contas conferem).
--
-- Precisa de: uma conta `vet`, uma `clinic`, uma `tutor` e uma `admin`. A
-- admin é usada como admin comum e como master (o `admin_level` é trocado
-- DENTRO do bloco e volta sozinho no fim). Faltando alguma, SONDA INVALIDA.
--
-- Como funciona (o desenho da sonda 2 da 0005): cada caso roda como um ator,
-- trocando de papel e plantando o JWT como o PostgREST faz. `service` é o
-- `service_role` (a rota da T-040). `dono` é o dono do banco (o SQL Editor).
-- Os casos NÃO se desfazem um a um: o contato gravado no caso 4 é o que o
-- caso 6 deduplica. No fim, uma exceção proposital desfaz TUDO.
-- Rode o bloco INTEIRO (do `drop table` até o `select` final), de uma vez.
--
-- Os blocos:
--    0      a sonda se passa mesmo pela conta
--    1-3    ninguém além do servidor chama as duas funções
--    4-20   registrar_contato: grava e devolve; D5; origem; nao_encontrado;
--           sem_whatsapp; logado; consigo mesmo; anon_id obrigatório
--   21-25   D3: os limites, e a janela de 10 min
--   30-38   R-074: quem lê quais colunas de contatos
--   40-45   D10: o vínculo na criação de conta (a data vem de auth.users)
--   50-55   R-076 / D11: a linha anonimizada
--   60-68   SEC-115: o slug só muda pelo gerador e pelo master
--   70      SEC-116: aprovação sem linha de perfil falha
--
-- Códigos no `obtido`: 42501 sem permissão · 23514 CHECK recusou · 22004
-- parâmetro nulo · 55000 pré-condição · linhas=N o comando alcançou N linhas.
drop table if exists sonda_0006;
create temporary table sonda_0006 (
  ordem    int,
  cenario  text,
  esperado text,
  obtido   text,
  veredito text
);

do $sondadois$
declare
  dono        text := current_user;
  v_vet       uuid;
  v_clinic    uuid;
  v_tutor     uuid;
  v_admin     uuid;
  v_outros    uuid[];
  v_slug_vet  text;
  v_slug_cli  text;
  -- ordem | cenario | ator | status do VET antes ('' = nao mexe) |
  -- montagem como o dono do banco ('' = nenhuma) | comando como o ator |
  -- esperado | quantas outras contas o caso precisa (0 = nenhuma)
  casos constant text[][] := array[
    ['0',  'a sonda se passa pela conta vet (auth.uid() leu o claim)',
           'vet', '', '',
           $c$select count(*) from (select 1 where auth.uid() = '%VET%'::uuid) x$c$, 'linhas=1', '0'],
    ['0',  'a sonda se passa pelo servidor (o papel service_role da rota)',
           'service', '', '',
           $c$select count(*) from (select 1 where current_user = 'service_role') x$c$, 'linhas=1', '0'],

    -- ------------------------------------------------ quem chama
    ['1',  'anon chama registrar_contato (a chave anon esta no bundle)',
           'anon', '', '',
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', null, 'a0000000-0000-4000-8000-000000000001', null, null)) x$c$, '42501', '0'],
    ['2',  'responsavel logado chama registrar_contato',
           'tutor', '', '',
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', null, 'a0000000-0000-4000-8000-000000000001', null, null)) x$c$, '42501', '0'],
    ['3',  'responsavel logado chama vincular_contatos_do_visitante',
           'tutor', '', '',
           $c$select count(*) from (select public.vincular_contatos_do_visitante('%TUTOR%', 'a0000000-0000-4000-8000-000000000001')) x$c$, '42501', '0'],

    -- ------------------------------------------------ registrar_contato
    ['4',  'controle positivo: o servidor registra o contato e recebe o numero',
           'service', '', '',
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', null, 'a0000000-0000-4000-8000-00000000000a', 'goiania-go', 'clinica-geral') r) x where r ->> 'ok' = 'true' and r ->> 'whatsapp' = '62900000001'$c$, 'linhas=1', '0'],
    ['5',  'a linha foi gravada: anon_id, sem user_id, canal whatsapp, origem das listas',
           'dono', '', '',
           $c$select count(*) from public.contatos where profissional_id = '%VET%' and anon_id = 'a0000000-0000-4000-8000-00000000000a' and user_id is null and canal = 'whatsapp' and origem_cidade = 'goiania-go' and origem_especialidade = 'clinica-geral' and anonimizado_em is null$c$, 'linhas=1', '0'],
    ['6',  'D5: segundo clique do mesmo visitante devolve o numero de novo',
           'service', '', '',
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', null, 'a0000000-0000-4000-8000-00000000000a', null, null) r) x where r ->> 'ok' = 'true' and r ->> 'whatsapp' = '62900000001'$c$, 'linhas=1', '0'],
    ['7',  'D5: e NAO grava outra linha (conta 1)',
           'dono', '', '',
           $c$select count(*) from public.contatos where anon_id = 'a0000000-0000-4000-8000-00000000000a'$c$, 'linhas=1', '0'],
    ['8',  'origem fora das listas (e servico no lugar de especialidade de vet)',
           'service', '', '',
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', null, 'a0000000-0000-4000-8000-00000000000b', 'cidade-inventada-zz', 'vacinacao') r) x where r ->> 'ok' = 'true'$c$, 'linhas=1', '0'],
    ['9',  'a origem fora das listas virou nulo (lixo nao entra na metrica)',
           'dono', '', '',
           $c$select count(*) from public.contatos where anon_id = 'a0000000-0000-4000-8000-00000000000b' and origem_cidade is null and origem_especialidade is null$c$, 'linhas=1', '0'],
    ['10', 'conta pending_validation: nao_encontrado',
           'service', 'pending_validation', '',
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', null, 'a0000000-0000-4000-8000-00000000000c', null, null) r) x where r ->> 'ok' = 'false' and r ->> 'motivo' = 'nao_encontrado' and r -> 'whatsapp' is null$c$, 'linhas=1', '0'],
    ['11', 'e nada foi gravado para ela',
           'dono', 'active', '',
           $c$select count(*) from public.contatos where anon_id = 'a0000000-0000-4000-8000-00000000000c'$c$, 'linhas=0', '0'],
    ['12', 'slug inexistente: nao_encontrado',
           'service', '', '',
           $c$select count(*) from (select public.registrar_contato('vet', 'sonda-seis-nao-existe', null, 'a0000000-0000-4000-8000-00000000000c', null, null) r) x where r ->> 'motivo' = 'nao_encontrado'$c$, 'linhas=1', '0'],
    ['13', 'tipo errado (slug de vet pedido como clinic): nao_encontrado',
           'service', '', '',
           $c$select count(*) from (select public.registrar_contato('clinic', '%SLUGVET%', null, 'a0000000-0000-4000-8000-00000000000c', null, null) r) x where r ->> 'motivo' = 'nao_encontrado'$c$, 'linhas=1', '0'],
    ['14', 'estabelecimento sem WhatsApp: sem_whatsapp',
           'service', '',
           $c$insert into public.perfil_privado (id, whatsapp) values ('%CLINIC%', null) on conflict (id) do update set whatsapp = null$c$,
           $c$select count(*) from (select public.registrar_contato('clinic', '%SLUGCLI%', null, 'a0000000-0000-4000-8000-00000000000d', null, null) r) x where r ->> 'motivo' = 'sem_whatsapp' and r -> 'whatsapp' is null$c$, 'linhas=1', '0'],
    ['15', 'e sem_whatsapp NAO grava',
           'dono', '', '',
           $c$select count(*) from public.contatos where anon_id = 'a0000000-0000-4000-8000-00000000000d'$c$, 'linhas=0', '0'],
    ['16', 'responsavel logado: o servidor registra com user_id e anon_id',
           'service', '', '',
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', '%TUTOR%', 'a0000000-0000-4000-8000-00000000000e', null, null) r) x where r ->> 'ok' = 'true'$c$, 'linhas=1', '0'],
    ['17', 'a linha tem os dois',
           'dono', '', '',
           $c$select count(*) from public.contatos where user_id = '%TUTOR%' and anon_id = 'a0000000-0000-4000-8000-00000000000e'$c$, 'linhas=1', '0'],
    ['18', 'o profissional clica no proprio perfil: recebe o numero',
           'service', '', '',
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', '%VET%', 'a0000000-0000-4000-8000-00000000000f', null, null) r) x where r ->> 'ok' = 'true'$c$, 'linhas=1', '0'],
    ['19', 'e contato consigo mesmo NAO e gravado',
           'dono', '', '',
           $c$select count(*) from public.contatos where anon_id = 'a0000000-0000-4000-8000-00000000000f'$c$, 'linhas=0', '0'],
    ['20', 'sem anon_id: erro (R-076, a linha grava anon_id sempre)',
           'service', '', '',
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', null, null, null, null)) x$c$, '22004', '0'],

    -- ------------------------------------------------ D3: limites
    ['21', 'controle positivo: 4 profissionais em 10 min, o 5o passa',
           'service', '',
           $c$insert into public.contatos (profissional_id, anon_id, created_at) select o, 'a0000000-0000-4000-8000-000000000021', now() - interval '1 minute' from unnest('%OUTROS4%'::uuid[]) o$c$,
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', null, 'a0000000-0000-4000-8000-000000000021', null, null) r) x where r ->> 'ok' = 'true'$c$, 'linhas=1', '4'],
    ['22', 'D3: o 6o profissional em 10 min recebe muitas_tentativas, sem numero',
           'service', '',
           $c$insert into public.perfil_privado (id, whatsapp) values ('%CLINIC%', '6230000001') on conflict (id) do update set whatsapp = '6230000001'$c$,
           $c$select count(*) from (select public.registrar_contato('clinic', '%SLUGCLI%', null, 'a0000000-0000-4000-8000-000000000021', null, null) r) x where r ->> 'motivo' = 'muitas_tentativas' and r -> 'whatsapp' is null$c$, 'linhas=1', '4'],
    ['23', 'e a tentativa recusada NAO grava',
           'dono', '', '',
           $c$select count(*) from public.contatos where anon_id = 'a0000000-0000-4000-8000-000000000021' and profissional_id = '%CLINIC%'$c$, 'linhas=0', '4'],
    ['24', 'janela: 5 profissionais ha 11 min nao contam para os 10 min',
           'service', '',
           $c$insert into public.contatos (profissional_id, anon_id, created_at) select o, 'a0000000-0000-4000-8000-000000000024', now() - interval '11 minutes' from unnest('%OUTROS5%'::uuid[]) o$c$,
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', null, 'a0000000-0000-4000-8000-000000000024', null, null) r) x where r ->> 'ok' = 'true'$c$, 'linhas=1', '5'],
    ['25', 'D3: 20 profissionais em 24 h, o 21o recebe muitas_tentativas',
           'service', '',
           $c$insert into public.contatos (profissional_id, anon_id, created_at) select o, 'a0000000-0000-4000-8000-000000000025', now() - interval '2 hours' from unnest('%OUTROS20%'::uuid[]) o$c$,
           $c$select count(*) from (select public.registrar_contato('vet', '%SLUGVET%', null, 'a0000000-0000-4000-8000-000000000025', null, null) r) x where r ->> 'motivo' = 'muitas_tentativas'$c$, 'linhas=1', '20'],

    -- ------------------------------------------------ R-074: colunas
    ['30', 'controle positivo: o vet le as colunas das telas dos proprios contatos',
           'vet', '', '',
           $c$select least(count(*), 1) from (select id, created_at, canal, origem_cidade, origem_especialidade from public.contatos where profissional_id = '%VET%') x$c$, 'linhas=1', '0'],
    ['31', 'R-074: o vet pede anon_id de quem o procurou',
           'vet', '', '',
           $c$select count(anon_id) from public.contatos$c$, '42501', '0'],
    ['32', 'R-074: o vet pede user_id de quem o procurou',
           'vet', '', '',
           $c$select count(user_id) from public.contatos$c$, '42501', '0'],
    ['33', 'select=* passa a ser recusado para logado (a T-042 pede colunas pelo nome)',
           'vet', '', '',
           $c$select count(*) from (select * from public.contatos) x$c$, '42501', '0'],
    ['34', 'o responsavel ve so o proprio contato (1 linha, pela policy da 0002)',
           'tutor', '', '',
           $c$select count(*) from (select id, profissional_id, created_at from public.contatos) x$c$, 'linhas=1', '0'],
    ['35', 'o estabelecimento NAO ve contato do vet',
           'clinic', '', '',
           $c$select count(*) from (select id from public.contatos where profissional_id = '%VET%') x$c$, 'linhas=0', '0'],
    ['36', 'anon le contatos',
           'anon', '', '',
           $c$select count(*) from (select id from public.contatos) x$c$, '42501', '0'],
    ['37', 'logado inventa contato por INSERT',
           'tutor', '', '',
           $c$with u as (insert into public.contatos (profissional_id, anon_id) values ('%VET%', 'a0000000-0000-4000-8000-000000000037') returning 1) select count(*) from u$c$, '42501', '0'],
    ['38', 'R-074: nem o admin le anon_id',
           'admin', '', '',
           $c$select count(anon_id) from public.contatos$c$, '42501', '0'],

    -- ------------------------------------------------ D10: vínculo
    ['40', 'D10: conta de responsavel recem-criada vincula os contatos dos ultimos 30 dias',
           'service', '',
           $c$update auth.users set created_at = now() - interval '1 minute' where id = '%TUTOR%'; insert into public.contatos (profissional_id, anon_id, created_at) values ('%VET%', 'a0000000-0000-4000-8000-000000000040', now() - interval '3 days'), ('%CLINIC%', 'a0000000-0000-4000-8000-000000000040', now() - interval '29 days'), ('%VET%', 'a0000000-0000-4000-8000-000000000040', now() - interval '40 days')$c$,
           $c$select public.vincular_contatos_do_visitante('%TUTOR%', 'a0000000-0000-4000-8000-000000000040')::bigint$c$, 'linhas=2', '0'],
    ['41', 'D10: o de 40 dias ficou sem vinculo',
           'dono', '', '',
           $c$select count(*) from public.contatos where anon_id = 'a0000000-0000-4000-8000-000000000040' and user_id is null and created_at < now() - interval '30 days'$c$, 'linhas=1', '0'],
    ['42', 'D10: conta de responsavel ANTIGA nao vincula nada (login nao e criacao)',
           'service', '',
           $c$update auth.users set created_at = now() - interval '2 days' where id = '%TUTOR%'; insert into public.contatos (profissional_id, anon_id) values ('%CLINIC%', 'a0000000-0000-4000-8000-000000000042')$c$,
           $c$select public.vincular_contatos_do_visitante('%TUTOR%', 'a0000000-0000-4000-8000-000000000042')::bigint$c$, 'linhas=0', '0'],
    ['43', 'D10: conta de profissional nao vincula nada',
           'service', '',
           $c$update auth.users set created_at = now() - interval '1 minute' where id = '%CLINIC%'$c$,
           $c$select public.vincular_contatos_do_visitante('%CLINIC%', 'a0000000-0000-4000-8000-000000000042')::bigint$c$, 'linhas=0', '0'],
    ['44', 'D10: contato ja vinculado a outra conta nao muda de dono',
           'service', '',
           $c$update auth.users set created_at = now() - interval '1 minute' where id = '%TUTOR%'; update public.contatos set user_id = '%ADMIN%' where anon_id = 'a0000000-0000-4000-8000-000000000042'$c$,
           $c$select public.vincular_contatos_do_visitante('%TUTOR%', 'a0000000-0000-4000-8000-000000000042')::bigint$c$, 'linhas=0', '0'],

    ['45', 'SEC-121: reescrever profiles.created_at nao reabre a janela (vale auth.users)',
           'service', '',
           $c$update auth.users set created_at = now() - interval '2 days' where id = '%TUTOR%'; update public.profiles set created_at = now() where id = '%TUTOR%'; insert into public.contatos (profissional_id, anon_id) values ('%VET%', 'a0000000-0000-4000-8000-000000000045')$c$,
           $c$select public.vincular_contatos_do_visitante('%TUTOR%', 'a0000000-0000-4000-8000-000000000045')::bigint$c$, 'linhas=0', '0'],

    -- ------------------------------------------------ R-076 / D11
    ['50', 'R-076: contato logado SEM anon_id; a conta sai (user_id vira nulo) e a linha fica',
           'dono', '',
           $c$insert into public.contatos (profissional_id, user_id, anon_id) values ('%VET%', '%TUTOR%', null)$c$,
           $c$with u as (update public.contatos set user_id = null where user_id = '%TUTOR%' and anon_id is null returning 1) select count(*) from u$c$, 'linhas=1', '0'],
    ['51', 'D11: a linha ficou anonimizada e marcada, e a contagem do vet a mantem',
           'dono', '', '',
           $c$select count(*) from public.contatos where profissional_id = '%VET%' and user_id is null and anon_id is null and anonimizado_em is not null$c$, 'linhas=1', '0'],
    ['52', 'D11: a conta sai e o anon_id daquele navegador sai junto',
           'dono', '', '',
           $c$with u as (update public.contatos set user_id = null where anon_id = 'a0000000-0000-4000-8000-00000000000e' returning 1) select count(*) from u$c$, 'linhas=1', '0'],
    ['53', 'D11: nenhuma linha aponta mais para aquele navegador',
           'dono', '', '',
           $c$select count(*) from public.contatos where anon_id = 'a0000000-0000-4000-8000-00000000000e'$c$, 'linhas=0', '0'],
    ['54', 'linha NOVA sem user_id e sem anon_id continua recusada',
           'dono', '', '',
           $c$with u as (insert into public.contatos (profissional_id) values ('%VET%') returning 1) select count(*) from u$c$, '23514', '0'],
    ['55', 'linha nova nao nasce "anonimizada" por quem grava',
           'dono', '', '',
           $c$with u as (insert into public.contatos (profissional_id, anonimizado_em) values ('%VET%', now()) returning 1) select count(*) from u$c$, '23514', '0'],

    -- ------------------------------------------------ SEC-115: slug
    ['60', 'SEC-115: admin comum troca o slug pela API',
           'admin', '', '',
           $c$with u as (update public.vet_profiles set slug = 'sonda-seis-tomado' where id = '%VET%' returning 1) select count(*) from u$c$, '42501', '0'],
    ['61', 'controle positivo: admin comum continua moderando a bio',
           'admin', '', '',
           $c$with u as (update public.vet_profiles set bio = 'Bio moderada pela sonda seis' where id = '%VET%' returning 1) select count(*) from u$c$, 'linhas=1', '0'],
    ['62', 'controle positivo: o master troca o slug (DL-067 item 5)',
           'master', '', '',
           $c$with u as (update public.vet_profiles set slug = 'sonda-seis-master' where id = '%VET%' returning 1) select count(*) from u$c$, 'linhas=1', '0'],
    ['63', 'SEC-115: o service_role troca o slug',
           'service', '', '',
           $c$with u as (update public.vet_profiles set slug = 'sonda-seis-servico' where id = '%VET%' returning 1) select count(*) from u$c$, '42501', '0'],
    ['64', 'controle positivo: sessao direta do banco (SQL Editor) troca o slug',
           'dono', '', '',
           $c$with u as (update public.vet_profiles set slug = 'sonda-seis-editor' where id = '%VET%' returning 1) select count(*) from u$c$, 'linhas=1', '0'],
    ['65', 'SEC-008: o vet troca o proprio slug',
           'vet', '', '',
           $c$with u as (update public.vet_profiles set slug = 'sonda-seis-dono' where id = '%VET%' returning 1) select count(*) from u$c$, '42501', '0'],
    ['66', 'controle positivo: a aprovacao pelo admin comum ainda gera o slug',
           'admin', 'pending_validation',
           $c$update public.vet_profiles set slug = null where id = '%VET%'$c$,
           $c$select count(*) from (select public.admin_definir_status('%VET%', 'active', null)) x$c$, 'linhas=1', '0'],
    ['67', 'o slug foi gerado',
           'dono', '', '',
           $c$select count(*) from public.vet_profiles where id = '%VET%' and slug is not null$c$, 'linhas=1', '0'],
    ['68', 'a marca do gerador nao ficou ligada depois da aprovacao',
           'dono', '', '',
           $c$select count(*) from (select 1 where coalesce(current_setting('vetria.gerador_de_slug', true), '') = '') x$c$, 'linhas=1', '0'],

    -- ------------------------------------------------ SEC-116
    ['70', 'SEC-116: aprovar conta vet SEM linha de perfil falha (nao vai ao ar sem endereco)',
           'admin', '',
           $c$update public.profiles set role = 'vet', status = 'pending_validation', status_motivo = null where id = '%TUTOR%'$c$,
           $c$select count(*) from (select public.admin_definir_status('%TUTOR%', 'active', null)) x$c$, '55000', '0'],
    ['71', 'e a conta continua fora do ar',
           'dono', '', '',
           $c$select count(*) from public.profiles where id = '%TUTOR%' and status = 'pending_validation'$c$, 'linhas=1', '0']
  ];
  i           int;
  ator        text;
  ator_id     uuid;
  status_vet  text;
  montagem    text;
  comando     text;
  esperado    text;
  precisa     int;
  obtido      text;
  detalhe     text;
  n           bigint;
  resultados  jsonb := '[]'::jsonb;
begin
  select id into v_vet    from public.profiles where role = 'vet'    order by created_at limit 1;
  select id into v_clinic from public.profiles where role = 'clinic' order by created_at limit 1;
  select id into v_tutor  from public.profiles where role = 'tutor'  order by created_at limit 1;
  select id into v_admin  from public.profiles where role = 'admin'  order by created_at limit 1;

  if v_vet is null or v_clinic is null or v_tutor is null or v_admin is null then
    insert into sonda_0006 values (0, 'montagem do cenario',
      'uma conta vet, uma clinic, uma tutor e uma admin no banco',
      format('vet=%s clinic=%s tutor=%s admin=%s', coalesce(v_vet::text, 'FALTA'),
             coalesce(v_clinic::text, 'FALTA'), coalesce(v_tutor::text, 'FALTA'),
             coalesce(v_admin::text, 'FALTA')),
      'SONDA INVALIDA: crie a conta que falta e rode de novo.');
    return;
  end if;

  -- contas que servem de "outros profissionais" para os limites (o limite
  -- conta profissional_id distinto; a sonda planta contato antigo para elas)
  select coalesce(array_agg(id), '{}') into v_outros
  from (select p.id from public.profiles p
         where p.id not in (v_vet, v_clinic, v_tutor)
         order by p.created_at limit 20) x;

  begin
    -- montagem geral, como o dono do banco: vet e clinic com perfil, active,
    -- com slug; WhatsApp FALSO no vet (nada de numero real na tela)
    insert into public.vet_profiles (id, nome_exibicao, crmv, crmv_uf, cidade, estado)
    values (v_vet, 'Sonda Seis', '12345', 'SP', 'Cidade da Sonda', 'SP')
    on conflict (id) do nothing;
    insert into public.clinic_profiles (id, nome_fantasia, cidade, estado)
    values (v_clinic, 'Sonda Seis', 'Cidade da Sonda', 'SP')
    on conflict (id) do nothing;
    insert into public.perfil_privado (id, whatsapp) values (v_vet, '62900000001')
    on conflict (id) do update set whatsapp = '62900000001';

    update public.profiles set status = 'pending_validation', status_motivo = null
     where id in (v_vet, v_clinic) and status <> 'pending_validation';
    update public.profiles set status = 'active' where id in (v_vet, v_clinic);
    update public.profiles set admin_level = 'admin' where id = v_admin;

    -- faltando contas para os limites, a sonda cria contas de mentira em
    -- `profiles` (sem login: não há linha em auth.users), que somem no fim
    -- junto com todo o resto
    if coalesce(cardinality(v_outros), 0) < 20 then
      with novas as (
        insert into public.profiles (id, role, full_name, status)
        select gen_random_uuid(), 'tutor', 'Conta da sonda seis', 'active'
        from generate_series(1, 20 - coalesce(cardinality(v_outros), 0))
        returning id
      )
      select v_outros || array_agg(id) into v_outros from novas;
    end if;

    select slug into v_slug_vet from public.vet_profiles    where id = v_vet;
    select slug into v_slug_cli from public.clinic_profiles where id = v_clinic;

    for i in 1 .. array_length(casos, 1) loop
      ator       := casos[i][3];
      ator_id    := case ator when 'vet' then v_vet when 'clinic' then v_clinic when 'tutor' then v_tutor
                               when 'admin' then v_admin when 'master' then v_admin else null end;
      status_vet := casos[i][4];
      esperado   := casos[i][7];
      precisa    := casos[i][8]::int;
      montagem   := casos[i][5];
      comando    := casos[i][6];
      montagem   := replace(replace(replace(replace(replace(replace(replace(replace(replace(montagem,
                      '%VET%', v_vet::text), '%CLINIC%', v_clinic::text), '%TUTOR%', v_tutor::text),
                      '%ADMIN%', v_admin::text), '%SLUGVET%', coalesce(v_slug_vet, '')),
                      '%SLUGCLI%', coalesce(v_slug_cli, '')),
                      '%OUTROS4%', (v_outros[1:4])::text), '%OUTROS5%', (v_outros[1:5])::text),
                      '%OUTROS20%', (v_outros[1:20])::text);
      comando    := replace(replace(replace(replace(replace(replace(comando,
                      '%VET%', v_vet::text), '%CLINIC%', v_clinic::text), '%TUTOR%', v_tutor::text),
                      '%ADMIN%', v_admin::text), '%SLUGVET%', coalesce(v_slug_vet, '')),
                      '%SLUGCLI%', coalesce(v_slug_cli, ''));
      obtido     := null;
      detalhe    := null;

      if precisa > 0 and coalesce(cardinality(v_outros), 0) < precisa then
        resultados := resultados || jsonb_build_object(
          'ordem', casos[i][1]::int, 'cenario', casos[i][2], 'esperado', esperado,
          'obtido', format('so %s outras contas no banco', coalesce(cardinality(v_outros), 0)),
          'veredito', format('NAO MEDIDO: precisa de %s outras contas. Nao reprova a sonda.', precisa));
        continue;
      end if;

      -- 1) montagem do caso, como o dono do banco
      begin
        if ator in ('admin', 'master') then
          update public.profiles
             set admin_level = (case when ator = 'master' then 'master' else 'admin' end)::admin_level
           where id = v_admin;
        end if;
        if status_vet <> '' then
          update public.profiles
             set status = status_vet::public.user_status, status_motivo = null
           where id = v_vet;
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
          elsif ator = 'service' then
            perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
            perform set_config('request.jwt.claim.sub', '', true);
            perform set_config('role', 'service_role', true);
          elsif ator = 'dono' then
            perform set_config('request.jwt.claims', '', true);
            perform set_config('request.jwt.claim.sub', '', true);
          else
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
      perform set_config('request.jwt.claims', '', true);
      perform set_config('request.jwt.claim.sub', '', true);

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
            then 'SONDA INVALIDA: a sonda nao conseguiu se passar pelo ator. Nenhuma outra linha desta tabela prova nada.'
          when casos[i][1] = '4' and v_slug_vet is null
            then 'SONDA INVALIDA: o vet ficou sem slug na montagem (a aprovacao nao gerou). As linhas 4 a 25 nao provam nada.'
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

  insert into sonda_0006 (ordem, cenario, esperado, obtido, veredito)
  select (e ->> 'ordem')::int, e ->> 'cenario', e ->> 'esperado', e ->> 'obtido', e ->> 'veredito'
  from jsonb_array_elements(resultados) e;
end
$sondadois$;

select * from sonda_0006 order by ordem;


-- ####### SONDA 3 — o que está gravado em contatos (sem identificar ninguém) #
-- Informativo. Antes da T-040 ligar a rota, o esperado é TUDO ZERO (e a sonda
-- 2 não deixou nada: se `linhas` não for 0 aqui antes da T-040, a sonda 2 não
-- se desfez, e isso é para parar e olhar). Não mostra anon_id nem user_id.
select
  count(*)                                                    as linhas,
  count(distinct profissional_id)                             as profissionais,
  count(*) filter (where user_id is not null)                 as de_conta_logada,
  count(*) filter (where anonimizado_em is not null)          as anonimizadas,
  count(*) filter (where user_id is null and anon_id is null
                     and anonimizado_em is null)              as sem_origem_TEM_QUE_SER_0,
  min(created_at)                                             as primeiro,
  max(created_at)                                             as ultimo
from public.contatos;


-- ####### SONDA 4 — o anon real, pelo papel de verdade ######################
-- Como `anon`, pelo mesmo caminho da chave pública: a tabela e a função
-- recusam. Esperado: duas linhas, `veredito` = OK nas duas.
drop table if exists sonda_0006_anon;
create temporary table sonda_0006_anon (caso text, obtido text, veredito text);

do $sondaquatro$
begin
  begin
    set local role anon;
    perform count(*) from public.contatos;
    reset role;
    insert into sonda_0006_anon values ('anon le contatos', 'leu', 'FALHA');
  exception when others then
    reset role;
    insert into sonda_0006_anon values ('anon le contatos', sqlstate,
      case when sqlstate = '42501' then 'OK' else 'FALHA' end);
  end;

  begin
    set local role anon;
    perform public.registrar_contato('vet', 'qualquer-slug', null, gen_random_uuid(), null, null);
    reset role;
    insert into sonda_0006_anon values ('anon chama registrar_contato', 'executou', 'FALHA');
  exception when others then
    reset role;
    insert into sonda_0006_anon values ('anon chama registrar_contato', sqlstate,
      case when sqlstate = '42501' then 'OK' else 'FALHA' end);
  end;
end
$sondaquatro$;

select * from sonda_0006_anon;
