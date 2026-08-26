-- ============================================================================
-- VERIFICAÇÃO APÓS A MIGRATION 0003
--
-- Rode DEPOIS de aplicar `migrations/0003_storage_documentos.sql`, uma sonda
-- por vez. NENHUMA altera dado: as que escrevem estão dentro de transação com
-- `rollback`, ou dentro de bloco que se desfaz sozinho.
--
-- ⚠️ NENHUMA SONDA DESTE ARQUIVO FALA POR `raise notice` OU `raise warning`.
-- Isso não é estilo, é a SEC-035. Foi CONFIRMADO no SQL Editor deste projeto,
-- em 26/08/2026, que ele não renderiza NOTICE:
--     do $$ begin raise notice 'teste de notice'; end $$;
-- devolve "Success. No rows returned" e não imprime nada. A versão anterior
-- deste arquivo entregava o veredito da sonda mais importante por esse canal, o
-- que significa que ela devolvia exatamente o mesmo resultado no passa e no
-- falha. Execução que não reporta não é execução (é o degrau seguinte do
-- DL-050). Se você acrescentar sonda aqui, ela devolve TABELA.
--
-- ⚠️ TRÊS SONDAS ESPERAM ERRO como resultado de sucesso: a 3, a 7A e a 7B.
-- Está escrito em cada uma. Erro ali é a prova de que a proteção funcionou.
--
-- ⚠️ A SONDA 4 pode reprovar o desenho inteiro do bucket. Ela pergunta se
-- `service_role` tem mesmo BYPASSRLS. A decisão "zero policy" depende disso: se
-- vier `false`, o servidor não alcança o bucket e a T-008 não tem caminho.
-- Rode a 4 cedo.
--
-- ⚠️ AS SONDAS 10 e 10B SÃO AS QUE JUSTIFICAM ESTE ARQUIVO. Elas exercitam os
-- TRÊS ramos do trigger que a seção 6 da migration reescreveu por inteiro
-- (`create or replace` troca o corpo todo: um erro de digitação no ramo do
-- veterinário passaria verde em todas as outras sondas e apareceria na primeira
-- vez que um vet salvasse o perfil).
--
-- COMO AS SONDAS DE TRIGGER FUNCIONAM, porque o desenho não é óbvio:
--   1. um `create temporary table` guarda o resultado;
--   2. o bloco `do` muta o banco dentro de uma SUBTRANSAÇÃO que ele mesmo
--      desfaz com um `raise exception` capturado por ele próprio;
--   3. as conclusões viajam numa VARIÁVEL `jsonb` — variável de plpgsql não
--      volta atrás quando a subtransação volta, só o dado do banco volta;
--   4. depois que a subtransação já desfez tudo, o bloco grava as conclusões na
--      tabela temporária;
--   5. o último comando da sonda é um `select` nessa tabela. É o que aparece na
--      tela.
--   Rode cada uma dessas sondas INTEIRA, de uma vez: a tabela temporária vive na
--   sessão, e o editor pode não lhe dar a mesma sessão duas vezes.
--
-- ⚠️ TODA SONDA SE AUTOVALIDA. Quando não há dado para testar, ela devolve
-- 'SONDA INVALIDA' e diz o que falta. Verde silencioso por falta de alvo é
-- exatamente o defeito que a SEC-025 descreveu.
--
-- Formato: cada sonda diz o resultado esperado ao lado. Rode uma de cada vez.
--
-- ⚠️ SEC-046, MEDIDA E DERRUBADA em 26/08/2026. Este arquivo dizia antes que "o
-- editor mostra só o resultado da última query", e a auditoria concluiu daí que
-- as sondas 3, 7C e 9 seriam cegas, porque nelas o veredito sai num `select`
-- seguido de `rollback;`. O modelo estava errado. Medido no SQL Editor deste
-- projeto: `begin; select 42 as prova; rollback;` IMPRIME 42 na tela. O editor
-- mostra o resultado do último comando QUE DEVOLVE LINHAS, e `rollback` não
-- devolve nenhuma. As três sondas funcionam como estão. NÃO as reescreva.
--
-- O que continua valendo é a SEC-035, e por outro motivo: `raise notice` não é
-- result set nenhum, é outro canal, e esse o editor não renderiza mesmo. Daí a
-- regra do projeto: sonda fala por linha devolvida, nunca por notice.
-- ============================================================================


-- ####### SONDA 1 — o bucket existe, é privado, e a configuração entrou ######
-- Esperado: uma linha, com as três colunas de veredito em `true` e
-- `objetos_dentro` = 0 (a T-008 ainda não existe).
--
-- Ponto de partida medido: em 26/08/2026, ANTES da 0003,
-- `select id, public, ... from storage.buckets` veio VAZIO — o projeto não tinha
-- bucket nenhum. Então esta linha nasceu aqui, e não sobrou de tentativa antiga.
--
-- Zero linha = o `insert into storage.buckets` não passou. Se ele tiver falhado
-- por permissão (`postgres` pode não ter INSERT em `storage.buckets`), a
-- transação inteira reverteu e NADA da 0003 está no banco: confira pela sonda 5.
-- O caminho então é criar o bucket pelo painel (Storage → New bucket, nome
-- `documentos`, Private, 10 MB, os quatro MIME) e seguir o CAMINHO DE ESCAPE
-- escrito no pré-voo 1.6 da migration — que manda comentar o pré-voo 1.6 e o
-- insert da seção 2. ⚠️ NÃO rode a migration de novo sem fazer isso: desde a
-- correção da SEC-045 ela ABORTA se o bucket já existir, em vez de reconciliar.
select
  b.id,
  b.name,
  not b.public                                                        as privado_TEM_QUE_SER_true,
  b.file_size_limit = 10485760                                        as limite_10mib_TEM_QUE_SER_true,
  b.allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
                                                                      as mime_ok_TEM_QUE_SER_true,
  (select count(*) from storage.objects o where o.bucket_id = 'documentos') as objetos_dentro,
  round(b.file_size_limit / 1024.0 / 1024.0, 2)                       as limite_mb,
  b.allowed_mime_types
from storage.buckets b
where b.id = 'documentos';


-- ####### SONDA 2 — `storage.objects`: RLS ligada e ZERO policy ##############
-- É o modelo de segurança inteiro do bucket em três colunas.
--
-- ⚠️ CORRIGIDA PELA SEC-034. A versão anterior contava as policies e depois
-- DESQUALIFICAVA O PRÓPRIO RESULTADO, dizendo por escrito que "policies no
-- storage maior que 0 não é falha automática" — e só tratava como falha as que
-- CITASSEM a string `documentos`. Uma policy sem filtro de `bucket_id` alcança
-- todos os buckets do projeto e não contém essa string: passava pelas duas
-- checagens, e quem rodasse leria o número e seguiria.
--
-- Esperado, sem ressalva nenhuma:
--   rls_objects_TEM_QUE_SER_true    true
--   rls_buckets_TEM_QUE_SER_true    true
--   policies_TEM_QUE_SER_0          0
--   quais_policies                  (nulo)
--
-- Qualquer policy aqui é FALHA enquanto `documentos` for o único bucket do
-- projeto. Não apague nada por conta própria: descubra de quem é e para que
-- serve. Quando a F4/S7 criar o bucket público de foto, esta sonda muda junto —
-- aí a regra passa a ser "nenhuma policy sem filtro de bucket_id", e essa
-- reescrita está anotada no card da foto de perfil.
--
-- Estado conferido no banco em 26/08/2026, ANTES de aplicar a 0003: vazio.
select
  (select c.relrowsecurity
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects')      as rls_objects_TEM_QUE_SER_true,
  (select c.relrowsecurity
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'buckets')      as rls_buckets_TEM_QUE_SER_true,
  (select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects')     as policies_TEM_QUE_SER_0,
  (select string_agg(format('%s [cmd=%s roles=%s]', policyname, cmd, roles::text), '; ')
     from pg_policies
    where schemaname = 'storage' and tablename = 'objects')     as quais_policies_TEM_QUE_SER_nulo;


-- ####### SONDA 3 — o anônimo alcança os objetos do bucket? ##################
-- ✅ SUCESSO = qualquer um destes dois:
--      (a) ERRO `permission denied for table objects`  → nem grant ele tem
--      (b) o número 0                                  → tem grant, a RLS barra
--    Os dois são aprovação. O desenho conta com (b); (a) é ainda melhor.
--
-- ❌ FALHA = qualquer número MAIOR que 0. Aí o bucket está aberto para a chave
--    anônima e você tem documento de identidade acessível pela internet. PARE
--    TUDO e derrube o bucket.
--
-- Antes da T-008 o bucket está vazio e esta sonda dá 0 de qualquer jeito, o que
-- a torna fraca hoje e forte depois. Rode-a DE NOVO no fim da T-008, com um
-- documento real dentro. Está anotado no card.
begin;
  set local role anon;
  select count(*) as TEM_QUE_SER_0_OU_ERRO from storage.objects where bucket_id = 'documentos';
rollback;


-- ####### SONDA 4 — a suposição que sustenta o desenho ######################
-- O bucket não tem policy nenhuma. O servidor só alcança os objetos se
-- `service_role` tiver BYPASSRLS. Isso é comportamento do Supabase, não coisa
-- que esta migration criou, e por isso mesmo tem que ser CONFERIDO em vez de
-- presumido: foi presumir sobre privilégio que produziu a SEC-014.
--
-- Esperado, e estes quatro valores foram MEDIDOS em produção em 26/08/2026,
-- antes de aplicar a 0003 — o desenho deixou de depender de suposição:
--   service_role    true
--   anon            false
--   authenticated   false
--   postgres        true   (é como você está rodando isto)
--
-- Esta sonda continua no arquivo como REGRESSÃO: o dia em que um desses valores
-- mudar, o modelo de zero policy muda junto e alguém precisa saber na hora.
--
-- Se `service_role` vier FALSE: o upload da T-008 ainda tem chance de funcionar,
-- porque o storage-api usa a conexão do DONO das tabelas de `storage` — mas
-- confirme antes de escrever a rota. E a resposta NÃO é criar policy para
-- `authenticated`. Não improvise policy.
select rolname, rolbypassrls
from pg_roles
where rolname in ('service_role', 'anon', 'authenticated', 'postgres')
order by rolname;


-- ####### SONDA 5 — as três colunas sumiram de `clinic_profiles` ############
-- Esperado: ZERO linha.
-- Qualquer linha aqui significa que o DROP da seção 7 não rodou, e o dado
-- continua saindo para o anônimo.
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'clinic_profiles'
  and column_name in ('razao_social', 'cnpj', 'responsavel_tecnico');


-- ####### SONDA 6 — onde elas moram agora, e o que `anon` pode nelas ########
-- Esta é a resposta direta a "anon não enxerga cnpj nem razao_social em lugar
-- nenhum": varre o schema `public` INTEIRO, não só as duas tabelas que a gente
-- lembra. Inclui as duas colunas de identidade do documento (SEC-033), que
-- nasceram nesta migration e são igualmente privadas.
--
-- Esperado: exatamente 5 linhas, todas com
--   tabela              perfil_privado
--   anon_pode_ler       false
--   anon_pode_escrever  false
--
-- Se aparecer QUALQUER outra tabela, ou qualquer `true`, o dado está exposto.
select
  c.table_name                                                              as tabela,
  c.column_name                                                             as coluna,
  has_column_privilege('anon', format('public.%I', c.table_name), c.column_name, 'SELECT') as anon_pode_ler,
  has_column_privilege('anon', format('public.%I', c.table_name), c.column_name, 'UPDATE') as anon_pode_escrever
from information_schema.columns c
where c.table_schema = 'public'
  and c.column_name in ('razao_social', 'cnpj', 'responsavel_tecnico',
                        'documento_hash', 'documento_tamanho')
order by c.table_name, c.column_name;


-- ####### SONDA 7A — o anônimo pedindo CNPJ no endereço antigo ##############
-- ✅ SUCESSO = ERRO `column "cnpj" does not exist`.
-- Este é literalmente o request da SEC-020:
--   GET /rest/v1/clinic_profiles?select=cnpj,razao_social,responsavel_tecnico
-- Se retornar linha, ou colunas vazias, a migration não fez o que diz.
--
-- ⚠️ Isto prova o SQL, não a API. O PostgREST guarda o schema em cache, e é por
-- isso que a migration termina com `notify pgrst, 'reload schema'` (SEC-038).
-- A prova pela API está no item (c) da sonda 14, e ela é a que importa: a
-- SEC-020 foi descrita como um request HTTP, não como um select.
begin;
  set local role anon;
  select cnpj, razao_social, responsavel_tecnico from public.clinic_profiles;
rollback;


-- ####### SONDA 7B — o anônimo pedindo CNPJ no endereço novo ################
-- ✅ SUCESSO = ERRO `permission denied for table perfil_privado`.
-- Repare que o erro é de PERMISSÃO, não de RLS: a 0002 revogou tudo de `anon`
-- nesta tabela. Ele nem chega na policy.
-- ❌ Se retornar qualquer número, inclusive 0, o revoke da 0002 §11b caiu.
--
-- ⚠️ Esta sonda mede uma porta que já estava soldada (SEC-038 item 2): `anon`
-- NUNCA teve grant aqui. O ator plausível é o usuário logado de OUTRA conta, e
-- é a sonda 7C que mede esse.
begin;
  set local role anon;
  select count(*) from public.perfil_privado;
rollback;


-- ####### SONDA 7C — a conta logada de OUTRA pessoa ##########################
-- ⚠️ SONDA NOVA (SEC-038 item 2). É a que importa depois desta migration: a
-- 0003 acabou de mover CNPJ, razão social e NOME DE PESSOA FÍSICA para dentro de
-- `perfil_privado`. `authenticated` TEM select nessa tabela (a 0002 só revogou
-- de `anon`); quem barra é exclusivamente a RLS.
--
-- Ela assume o papel `authenticated` com o `sub` da conta A e tenta ler a linha
-- da conta B. E tem CONTROLE POSITIVO: se a conta A não enxergar nem a própria
-- linha, a sonda se declara inválida em vez de comemorar o zero — um zero pode
-- significar "a RLS funcionou" ou "eu não estava medindo nada".
--
-- Esperado: `veredito` = OK, com
--   linhas_da_vitima_TEM_QUE_SER_0    0
--   linhas_proprias_TEM_QUE_SER_1     1
--   total_visivel_TEM_QUE_SER_1       1
begin;
  do $sonda7c$
  declare
    vitima uuid;
    espiao uuid;
  begin
    select id into vitima
    from public.profiles where role in ('vet', 'clinic')
    order by created_at limit 1;

    select id into espiao
    from public.profiles
    where role <> 'admin' and id is distinct from vitima
    order by created_at limit 1;

    perform set_config('vetria.vitima', coalesce(vitima::text, ''), true);
    perform set_config('vetria.espiao', coalesce(espiao::text, ''), true);

    if vitima is null or espiao is null then
      return;
    end if;

    -- as duas linhas existem só dentro desta transação, que termina em rollback
    insert into public.perfil_privado (id, telefone) values (vitima, '11888888888')
      on conflict (id) do update set telefone = '11888888888';
    insert into public.perfil_privado (id, telefone) values (espiao, '11777777777')
      on conflict (id) do update set telefone = '11777777777';
  end
  $sonda7c$;

  -- os dois formatos de claim, porque projetos diferentes do Supabase leem um ou
  -- o outro. Se `auth.uid()` vier nulo, a sonda se declara inválida abaixo.
  select set_config('request.jwt.claims',
    json_build_object('sub', current_setting('vetria.espiao', true), 'role', 'authenticated')::text,
    true) as _;
  select set_config('request.jwt.claim.sub', current_setting('vetria.espiao', true), true) as _;
  set local role authenticated;

  select
    current_setting('vetria.espiao', true)  as conta_que_espia,
    current_setting('vetria.vitima', true)  as conta_espiada,
    auth.uid()::text                        as auth_uid_lido,
    (select count(*) from public.perfil_privado
      where id = nullif(current_setting('vetria.vitima', true), '')::uuid)
                                            as linhas_da_vitima_TEM_QUE_SER_0,
    (select count(*) from public.perfil_privado
      where id = nullif(current_setting('vetria.espiao', true), '')::uuid)
                                            as linhas_proprias_TEM_QUE_SER_1,
    (select count(*) from public.perfil_privado)
                                            as total_visivel_TEM_QUE_SER_1,
    case
      when nullif(current_setting('vetria.vitima', true), '') is null
        or nullif(current_setting('vetria.espiao', true), '') is null
        then 'SONDA INVALIDA: preciso de uma conta vet/clinic e de uma segunda conta que nao seja admin. Crie a que faltar e rode de novo.'
      when auth.uid()::text is distinct from current_setting('vetria.espiao', true)
        then 'SONDA INVALIDA: auth.uid() nao leu o claim que a sonda plantou. Conserte a sonda, nao interprete o resultado.'
      when (select count(*) from public.perfil_privado
             where id = nullif(current_setting('vetria.espiao', true), '')::uuid) <> 1
        then 'SONDA INVALIDA: a conta nao enxerga nem a propria linha. Sem controle positivo, o zero da vitima nao prova nada.'
      when (select count(*) from public.perfil_privado
             where id = nullif(current_setting('vetria.vitima', true), '')::uuid) = 0
       and (select count(*) from public.perfil_privado) = 1
        then 'OK: a conta logada le a propria linha e NAO le a de ninguem mais. CNPJ, razao social e nome do responsavel tecnico estao fechados para usuario logado de outra conta.'
      else 'FALHA GRAVE: uma conta logada esta lendo perfil_privado de terceiro. Isto e a SEC-020 de volta, com sessao em vez de chave anonima. PARE.'
    end as veredito;
rollback;


-- ####### SONDA 8 — o dado não se perdeu no caminho #########################
-- Compare com a QUERY 0 do `backup-antes-da-0003.sql`, que você anotou ANTES.
-- Regra: `com_dado_migrado` aqui tem que ser IGUAL a `com_dado_a_migrar` de lá.
-- Conferido em 26/08, antes de aplicar, e anotado aqui para não depender da
-- memória de ninguém: `clinic_profiles` 0 · `com_dado_a_migrar` 0 ·
-- `perfil_privado` 0 · `vet_profiles` 0 · `contas_auth` 18 · `profiles` 18.
-- Então `com_dado_migrado` aqui tem que dar 0, e `contas_auth` e `profiles` têm
-- que continuar 18: a 0003 não cria nem apaga conta nenhuma.
--
-- `com_documento` e `com_hash` têm que ser IGUAIS entre si, sempre: é o CHECK
-- `perfil_privado_documento_completo` (SEC-033) sendo verdade no banco, e não só
-- no catálogo. Antes da T-008 os dois são 0.
select
  (select count(*) from public.clinic_profiles)  as clinic_profiles,
  (select count(*) from public.perfil_privado)   as perfil_privado,
  (select count(*) from public.perfil_privado
    where razao_social is not null
       or cnpj is not null
       or responsavel_tecnico is not null)       as com_dado_migrado,
  (select count(*) from public.perfil_privado
    where documento_path is not null)            as com_documento,
  (select count(*) from public.perfil_privado
    where documento_hash is not null)            as com_hash_TEM_QUE_SER_IGUAL_A_com_documento,
  (select count(*) from auth.users)              as contas_auth,
  (select count(*) from public.profiles)         as profiles;


-- ####### SONDA 9 — CONTROLE POSITIVO E NEGATIVO: a busca pública ###########
-- ⚠️ CORRIGIDA PELA SEC-038 item 4. A versão anterior contava TODOS os
-- `clinic_profiles` visíveis ao anônimo e exigia `count = 1`: com dois
-- estabelecimentos ativos no futuro ela reprovaria uma busca que está
-- funcionando, e sem nenhuma conta `clinic` no banco ela acusaria a busca de
-- estar morta. Agora ela conta SÓ o alvo que ela mesma ativou, e se autovalida.
--
-- Ganhou também o CONTROLE NEGATIVO, que é o que separa "a RLS funciona" de "a
-- RLS está desligada": o mesmo alvo, depois de sair de `active`, tem que sumir.
-- Sem isso, um banco com RLS aberta passaria nesta sonda.
--
-- Esperado: `veredito` = OK, com visivel_quando_active = 1 e
-- visivel_quando_pendente = 0.
--   0 no primeiro         → a leitura pública de estabelecimento morreu. A 0003
--                           não deveria ter tocado nisso: investigue.
--   1 no segundo          → a regra de visibilidade não está no Postgres. PARE.
--   ERRO em `perfil_esta_ativo`      → a SEC-014 voltou. PARE TUDO.
--   ERRO `column ... does not exist` → alguma policy ou índice ainda cita uma
--                                      coluna dropada.
begin;
  do $sonda9$
  declare
    alvo uuid;
  begin
    select id into alvo from public.profiles where role = 'clinic' order by created_at limit 1;
    perform set_config('vetria.alvo', coalesce(alvo::text, ''), true);

    if alvo is null then
      return;
    end if;

    -- ⚠️ a linha de clinic_profiles ENTRA ANTES do status virar active, e com
    -- `do nothing`: se caísse no caminho de UPDATE com o perfil já ativo, o
    -- trigger de revalidação o devolveria para a fila e a sonda mediria o
    -- próprio efeito colateral.
    insert into public.clinic_profiles (id) values (alvo) on conflict (id) do nothing;
    update public.profiles set status = 'active', status_motivo = null where id = alvo;
  end
  $sonda9$;

  set local role anon;
  select set_config('vetria.visivel_ativo',
    (select count(*) from public.clinic_profiles
      where id = nullif(current_setting('vetria.alvo', true), '')::uuid)::text, true) as _;
  reset role;

  update public.profiles set status = 'pending_validation'
   where id = nullif(current_setting('vetria.alvo', true), '')::uuid;

  set local role anon;
  select set_config('vetria.visivel_pendente',
    (select count(*) from public.clinic_profiles
      where id = nullif(current_setting('vetria.alvo', true), '')::uuid)::text, true) as _;
  reset role;

  select
    nullif(current_setting('vetria.alvo', true), '')      as alvo,
    current_setting('vetria.visivel_ativo', true)         as visivel_quando_active_TEM_QUE_SER_1,
    current_setting('vetria.visivel_pendente', true)      as visivel_quando_pendente_TEM_QUE_SER_0,
    case
      when nullif(current_setting('vetria.alvo', true), '') is null
        then 'SONDA INVALIDA: nao ha nenhuma conta clinic no banco. Crie uma conta de estabelecimento e rode de novo. Sem alvo esta sonda nao testa nada.'
      when current_setting('vetria.visivel_ativo', true) = '1'
       and current_setting('vetria.visivel_pendente', true) = '0'
        then 'OK: anon ve o estabelecimento quando ele esta active, e para de ve-lo quando ele volta para a fila. A regra de visibilidade esta no Postgres.'
      when current_setting('vetria.visivel_ativo', true) <> '1'
        then 'FALHA: anon nao enxerga o estabelecimento que esta sonda ativou. A leitura publica de clinic_profiles morreu.'
      else 'FALHA GRAVE: anon continua enxergando o estabelecimento depois de ele sair de active. A regra de visibilidade NAO esta no Postgres.'
    end as veredito;
rollback;


-- ####### SONDA 10 — O TRIGGER SEGUIU AS COLUNAS? (ramo perfil_privado) #####
-- A sonda que justifica o arquivo, agora devolvendo TABELA (SEC-035). Ela monta
-- o cenário inteiro — estabelecimento aprovado, com CNPJ e documento já
-- gravados — e mexe numa coluna de cada vez.
--
-- Esperado: todas as linhas com `veredito` = OK.
--   FALHA em cnpj/razao_social/responsavel_tecnico  → o trigger não seguiu as
--       colunas que a 0003 moveu. Reabra a seção 6 da migration.
--   FALHA em documento_hash/documento_tamanho       → as colunas de identidade
--       do objeto são decoração: trocar os bytes não move nada (SEC-033).
--   FALHA no controle negativo (telefone, email)    → o trigger vigia demais, e
--       vai tirar gente do ar por corrigir um telefone.
--   SONDA INVALIDA                                  → conserte a sonda, não
--       interprete o resultado.
--
-- ⚠️ O QUE ESTA SONDA NÃO CONSEGUE MEDIR, e é melhor dizer do que fingir:
-- o recarimbo de `documento_enviado_em` quando os bytes mudam (seção 6.b da
-- migration). `now()` é o timestamp da TRANSAÇÃO, não do comando: dentro de um
-- único bloco em rollback, o valor antigo e o novo são idênticos, e a asserção
-- daria FALHA com o banco correto. O comportamento é verificado por outras duas
-- vias: a sonda 11 confere no CATÁLOGO que a condição do hash está no corpo da
-- função, e o item (d) da sonda 14 confere o comportamento de verdade, com dois
-- envios em transações diferentes.
--
-- Nada é alterado: a subtransação desfaz tudo antes de a tabela ser preenchida.
-- Rode este bloco inteiro de uma vez.
drop table if exists sonda10;
create temporary table sonda10 (
  ordem    int,
  cenario  text,
  esperado text,
  obtido   text,
  veredito text
);

do $sonda10$
declare
  alvo            uuid;
  caminho         text;
  hash_a          constant text := repeat('a', 64);
  hash_b          constant text := repeat('b', 64);
  casos           constant text[][] := array[
    ['cnpj',                '11222333000181',       'pending_validation'],
    ['razao_social',        'RAZAO NOVA LTDA',      'pending_validation'],
    ['responsavel_tecnico', 'Responsavel Novo',     'pending_validation'],
    ['documento_hash',      hash_b,                 'pending_validation'],
    ['documento_tamanho',   '123456',               'pending_validation'],
    ['telefone',            '11999999999',          'active'],
    ['email_contato',       'contato@exemplo.com',  'active']
  ];
  i               int;
  depois          public.user_status;
  resultados      jsonb := '[]'::jsonb;
begin
  select id into alvo from public.profiles where role = 'clinic' order by created_at limit 1;

  if alvo is null then
    insert into sonda10 values (0, 'montagem do cenario', 'uma conta clinic no banco',
      'nenhuma', 'SONDA INVALIDA: crie uma conta de estabelecimento e rode de novo');
    return;
  end if;

  caminho := alvo::text || '/documento-1756240000123.pdf';

  begin
    -- 1) cenário: estabelecimento aprovado, com CNPJ e documento já gravados no
    --    lugar novo. O INSERT nao dispara a revalidacao (o trigger e
    --    `after update`), e o status e ativado DEPOIS: a montagem nao contamina.
    insert into public.perfil_privado
      (id, cnpj, razao_social, responsavel_tecnico, documento_path, documento_hash, documento_tamanho)
    values
      (alvo, '00000000000000', 'RAZAO ANTIGA LTDA', 'Responsavel Antigo', caminho, hash_a, 100000)
    on conflict (id) do update
      set cnpj = '00000000000000',
          razao_social = 'RAZAO ANTIGA LTDA',
          responsavel_tecnico = 'Responsavel Antigo',
          documento_path = caminho,
          documento_hash = hash_a,
          documento_tamanho = 100000;

    -- 2) uma coluna de cada vez, sempre partindo de `active`.
    --    auth.uid() e nulo aqui, entao is_admin() e falso e o trigger age como
    --    se fosse o proprio dono editando. E o caso que queremos.
    for i in 1 .. array_length(casos, 1) loop
      update public.profiles set status = 'active', status_motivo = null where id = alvo;

      execute format('update public.perfil_privado set %I = %L where id = %L',
                     casos[i][1], casos[i][2], alvo);

      select status into depois from public.profiles where id = alvo;

      resultados := resultados || jsonb_build_object(
        'ordem',    i,
        'cenario',  format('mudar %s depois de aprovado', casos[i][1]),
        'esperado', format('profiles.status = %s', casos[i][3]),
        'obtido',   format('profiles.status = %s', depois),
        'veredito', case when depois::text = casos[i][3]
                         then 'OK'
                         when casos[i][3] = 'active'
                         then 'FALHA: o trigger vigia demais e tirou o perfil do ar por um dado de contato'
                         else 'FALHA: o trigger NAO esta vigiando esta coluna' end
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
          'obtido', sqlerrm,
          'veredito', 'SONDA INVALIDA: a sonda quebrou no meio. As linhas acima podem estar incompletas.'
        );
      end if;
  end;

  -- Daqui pra baixo a subtransacao ja desfez tudo o que foi escrito no banco.
  -- A variavel `resultados` sobreviveu: variavel de plpgsql nao volta atras.
  insert into sonda10 (ordem, cenario, esperado, obtido, veredito)
  select (e ->> 'ordem')::int, e ->> 'cenario', e ->> 'esperado', e ->> 'obtido', e ->> 'veredito'
  from jsonb_array_elements(resultados) e;
end
$sonda10$;

select * from sonda10 order by ordem;


-- ####### SONDA 10B — os outros dois ramos do MESMO trigger #################
-- ⚠️ SONDA NOVA (SEC-038 item 1). A seção 6 da migration usa
-- `create or replace function`, que reescreve o CORPO INTEIRO: um erro de
-- digitação no ramo do veterinário — que é o que a 0003 mais copiou e menos
-- pensou — sairia verde em todas as outras sondas e apareceria na primeira vez
-- que um vet salvasse o perfil, dias depois e longe daqui.
--
-- Cobre também o acréscimo da SEC-041: `endereco`, `cep`, `cidade` e `estado`
-- passam a devolver o estabelecimento para a fila.
--
-- Esperado: todas as linhas com `veredito` = OK.
--
-- ⚠️ A linha de `vet_profiles.cidade` tem `esperado = active` DE PROPÓSITO. O
-- ramo do vet NÃO ganhou os campos de localização nesta migration (o achado da
-- SEC-041 é sobre `clinic_profiles`), e essa assimetria está anotada na seção 6
-- da migration esperando decisão. A sonda existe para que ela fique VISÍVEL na
-- tela em vez de esquecida num comentário: no dia em que a decisão mudar, esta
-- linha muda junto.
drop table if exists sonda10b;
create temporary table sonda10b (
  ordem    int,
  cenario  text,
  esperado text,
  obtido   text,
  veredito text
);

do $sonda10b$
declare
  vet_alvo    uuid;
  clinic_alvo uuid;
  alvo        uuid;
  casos       constant text[][] := array[
    ['vet_profiles',    'crmv',          'SP-99999',              'pending_validation'],
    ['vet_profiles',    'crmv_uf',       'RJ',                    'pending_validation'],
    ['vet_profiles',    'nome_exibicao', 'Nome Novo da Sonda',    'pending_validation'],
    ['vet_profiles',    'bio',           'texto de vitrine novo', 'active'],
    ['vet_profiles',    'cidade',        'Cidade Nova',           'active'],
    ['clinic_profiles', 'nome_fantasia', 'Fantasia Nova',         'pending_validation'],
    ['clinic_profiles', 'endereco',      'Rua Nova, 100',         'pending_validation'],
    ['clinic_profiles', 'cep',           '01310100',              'pending_validation'],
    ['clinic_profiles', 'cidade',        'Cidade Nova',           'pending_validation'],
    ['clinic_profiles', 'estado',        'RJ',                    'pending_validation'],
    ['clinic_profiles', 'sobre',         'texto de vitrine novo', 'active'],
    ['clinic_profiles', 'site',          'https://exemplo.com',   'active']
  ];
  i           int;
  depois      public.user_status;
  resultados  jsonb := '[]'::jsonb;
begin
  select id into vet_alvo    from public.profiles where role = 'vet'    order by created_at limit 1;
  select id into clinic_alvo from public.profiles where role = 'clinic' order by created_at limit 1;

  begin
    if vet_alvo is not null then
      insert into public.vet_profiles (id) values (vet_alvo) on conflict (id) do nothing;
    end if;
    if clinic_alvo is not null then
      insert into public.clinic_profiles (id) values (clinic_alvo) on conflict (id) do nothing;
    end if;

    for i in 1 .. array_length(casos, 1) loop
      alvo := case when casos[i][1] = 'vet_profiles' then vet_alvo else clinic_alvo end;

      if alvo is null then
        resultados := resultados || jsonb_build_object(
          'ordem', i,
          'cenario',  format('mudar %s.%s depois de aprovado', casos[i][1], casos[i][2]),
          'esperado', format('profiles.status = %s', casos[i][4]),
          'obtido',   format('nao ha conta %s no banco', case when casos[i][1] = 'vet_profiles' then 'vet' else 'clinic' end),
          'veredito', 'SONDA INVALIDA: crie a conta que falta e rode de novo'
        );
        continue;
      end if;

      update public.profiles set status = 'active', status_motivo = null where id = alvo;

      execute format('update public.%I set %I = %L where id = %L',
                     casos[i][1], casos[i][2], casos[i][3], alvo);

      select status into depois from public.profiles where id = alvo;

      resultados := resultados || jsonb_build_object(
        'ordem',    i,
        'cenario',  format('mudar %s.%s depois de aprovado', casos[i][1], casos[i][2]),
        'esperado', format('profiles.status = %s', casos[i][4]),
        'obtido',   format('profiles.status = %s', depois),
        'veredito', case when depois::text = casos[i][4]
                         then 'OK'
                         when casos[i][4] = 'active'
                         then 'FALHA: o trigger vigia demais e tirou o perfil do ar por um campo de vitrine'
                         else 'FALHA: o trigger NAO esta vigiando esta coluna' end
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
          'obtido', sqlerrm,
          'veredito', 'SONDA INVALIDA: a sonda quebrou no meio. As linhas acima podem estar incompletas.'
        );
      end if;
  end;

  insert into sonda10b (ordem, cenario, esperado, obtido, veredito)
  select (e ->> 'ordem')::int, e ->> 'cenario', e ->> 'esperado', e ->> 'obtido', e ->> 'veredito'
  from jsonb_array_elements(resultados) e;
end
$sonda10b$;

select * from sonda10b order by ordem;


-- ####### SONDA 11 — o que a 0003 NÃO podia ter quebrado ####################
-- Esperado: QUATRO triggers em `perfil_privado`.
--   trg_perfil_privado_carimbo   ... BEFORE INSERT OR UPDATE ...
--        (correção SEC-028: se disser só "BEFORE UPDATE", a primeira data de
--         envio volta a ser escrita pelo cliente. Item do card T-002.)
--   trg_perfil_privado_dado_de_estabelecimento ... BEFORE INSERT OR UPDATE ...
--        (a guarda da SEC-044, nova nesta migration)
--   trg_perfil_privado_revalidar ... AFTER UPDATE ...
--   trg_perfil_privado_updated_at ... BEFORE UPDATE ...
select tgname as trigger, pg_get_triggerdef(oid) as definicao
from pg_trigger
where tgrelid = 'public.perfil_privado'::regclass and not tgisinternal
order by tgname;

-- e os CHECKs (rode separado). Esperado: QUATRO.
--   perfil_privado_documento_do_dono        a whitelist pdf|jpg|jpeg|png|webp e
--                                           o prefixo do uuid do dono (SEC-015 /
--                                           SEC-026), herdado da 0002
--   perfil_privado_documento_hash_formato   64 caracteres hex minúsculo
--   perfil_privado_documento_tamanho_limite > 0 e <= 10485760, o mesmo teto do
--                                           `file_size_limit` do bucket
--   perfil_privado_documento_completo       all-or-nothing: caminho, hash e
--                                           tamanho vivem e morrem juntos
select conname, pg_get_constraintdef(oid) as definicao
from pg_constraint
where conrelid = 'public.perfil_privado'::regclass and contype = 'c'
order by conname;

-- e o CORPO das duas funções que a seção 6 sobrescreveu (rode separado).
-- ⚠️ Esta é a única verificação possível para o recarimbo do hash: `now()` é o
-- timestamp da transação, então nenhuma sonda em rollback consegue ver a data se
-- mover (ver o cabeçalho da sonda 10). Aqui a pergunta é feita ao catálogo: a
-- condição está no corpo que está rodando em produção?
--
-- Esperado: as quatro primeiras colunas `true`. Anote os dois md5 no card da
-- T-002: são o estado conhecido das funções depois da 0003, e é deles que a
-- próxima migration vai precisar no pré-voo dela (SEC-037).
select
  (select p.prosrc like '%new.documento_hash is distinct from old.documento_hash%'
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'carimbar_envio_documento')
                                              as carimbo_segue_o_hash_TEM_QUE_SER_true,
  (select p.prosrc like '%new.documento_hash is distinct from old.documento_hash%'
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'revalidar_ao_mudar_dado_sensivel')
                                              as revalidacao_segue_o_hash_TEM_QUE_SER_true,
  (select p.prosrc like '%new.responsavel_tecnico is distinct from old.responsavel_tecnico%'
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'revalidar_ao_mudar_dado_sensivel')
                                              as responsavel_tecnico_vigiado_TEM_QUE_SER_true,
  (select p.prosrc like '%new.endereco is distinct from old.endereco%'
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'revalidar_ao_mudar_dado_sensivel')
                                              as endereco_vigiado_TEM_QUE_SER_true,
  (select md5(p.prosrc)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'revalidar_ao_mudar_dado_sensivel')
                                              as md5_revalidar_anote_no_card,
  (select md5(p.prosrc)
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'carimbar_envio_documento')
                                              as md5_carimbo_anote_no_card;


-- ####### SONDA 12 — RLS ativa em toda tabela de `public` ###################
-- Toda linha tem que vir true. Herdada da verificação da 0002: é barata e a
-- 0003 mexeu em tabela.
select relname as tabela, relrowsecurity as rls_ativa
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;


-- ####### SONDA 13 — as policies de `perfil_privado` continuam as mesmas ####
-- As cinco colunas novas entraram numa tabela que já tinha RLS. Esperado: as
-- quatro policies da 0002, intactas, e as duas de escrita com a guarda de role
-- (`tem_role('vet') or tem_role('clinic')`, correção SEC-032). Nenhuma delas
-- pode citar coluna de conteúdo: se citar, a 0003 mexeu onde não devia.
--
-- ⚠️ Repare que a guarda de role dessas policies é MAIS LARGA que o modelo de
-- dados: ela deixa um `vet` gravar `cnpj` na própria linha. Quem fecha isso não
-- é policy, é o trigger da SEC-044, e quem prova é a sonda 13B.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'perfil_privado'
order by policyname;


-- ####### SONDA 13B — dado de estabelecimento em linha de pessoa física #####
-- ⚠️ SONDA NOVA, para a guarda da SEC-044 (seção 6.c da migration).
-- Sem ela, uma conta `vet` grava `cnpj` na própria linha, o trigger de
-- revalidação dispara (o ramo é escolhido por `tg_table_name`, não por role) e o
-- veterinário SE DERRUBA de `active` para `pending_validation` sozinho — vira
-- ticket que ninguém do suporte sabe explicar.
--
-- Esperado: as três linhas com `veredito` = OK.
--   caso 1  conta vet gravando cnpj          → tem que ser RECUSADO com exceção
--   caso 2  conta clinic gravando cnpj       → tem que PASSAR (controle
--                                              positivo: guarda que recusa tudo
--                                              também "passa" no caso 1)
--   caso 3  conta vet gravando telefone      → tem que PASSAR (a guarda só
--                                              olha os três campos de empresa)
drop table if exists sonda13b;
create temporary table sonda13b (
  ordem    int,
  cenario  text,
  esperado text,
  obtido   text,
  veredito text
);

do $sonda13b$
declare
  vet_alvo    uuid;
  clinic_alvo uuid;
  resultados  jsonb := '[]'::jsonb;
begin
  select id into vet_alvo    from public.profiles where role = 'vet'    order by created_at limit 1;
  select id into clinic_alvo from public.profiles where role = 'clinic' order by created_at limit 1;

  begin
    -- caso 1 — conta vet gravando CNPJ: tem que levantar
    if vet_alvo is null then
      resultados := resultados || jsonb_build_object('ordem', 1,
        'cenario', 'conta vet grava cnpj em perfil_privado', 'esperado', 'excecao',
        'obtido', 'nao ha conta vet no banco', 'veredito', 'SONDA INVALIDA');
    else
      begin
        insert into public.perfil_privado (id, cnpj) values (vet_alvo, '11222333000181')
          on conflict (id) do update set cnpj = '11222333000181';
        resultados := resultados || jsonb_build_object('ordem', 1,
          'cenario', 'conta vet grava cnpj em perfil_privado', 'esperado', 'excecao',
          'obtido', 'gravou sem reclamar',
          'veredito', 'FALHA: a guarda da SEC-044 nao existe ou nao pegou. Um vet consegue se derrubar da busca sozinho.');
      exception
        when others then
          resultados := resultados || jsonb_build_object('ordem', 1,
            'cenario', 'conta vet grava cnpj em perfil_privado', 'esperado', 'excecao',
            'obtido', sqlerrm, 'veredito', 'OK');
      end;
    end if;

    -- caso 2 — conta clinic gravando CNPJ: tem que passar (controle positivo)
    if clinic_alvo is null then
      resultados := resultados || jsonb_build_object('ordem', 2,
        'cenario', 'conta clinic grava cnpj em perfil_privado', 'esperado', 'grava sem erro',
        'obtido', 'nao ha conta clinic no banco', 'veredito', 'SONDA INVALIDA');
    else
      begin
        insert into public.perfil_privado (id, cnpj) values (clinic_alvo, '11222333000181')
          on conflict (id) do update set cnpj = '11222333000181';
        resultados := resultados || jsonb_build_object('ordem', 2,
          'cenario', 'conta clinic grava cnpj em perfil_privado', 'esperado', 'grava sem erro',
          'obtido', 'gravou', 'veredito', 'OK');
      exception
        when others then
          resultados := resultados || jsonb_build_object('ordem', 2,
            'cenario', 'conta clinic grava cnpj em perfil_privado', 'esperado', 'grava sem erro',
            'obtido', sqlerrm,
            'veredito', 'FALHA: a guarda esta recusando quem tem direito. O estabelecimento nao consegue salvar o proprio CNPJ.');
      end;
    end if;

    -- caso 3 — controle negativo: telefone de vet continua passando
    if vet_alvo is null then
      resultados := resultados || jsonb_build_object('ordem', 3,
        'cenario', 'conta vet grava telefone em perfil_privado', 'esperado', 'grava sem erro',
        'obtido', 'nao ha conta vet no banco', 'veredito', 'SONDA INVALIDA');
    else
      begin
        insert into public.perfil_privado (id, telefone) values (vet_alvo, '11999999999')
          on conflict (id) do update set telefone = '11999999999';
        resultados := resultados || jsonb_build_object('ordem', 3,
          'cenario', 'conta vet grava telefone em perfil_privado', 'esperado', 'grava sem erro',
          'obtido', 'gravou', 'veredito', 'OK');
      exception
        when others then
          resultados := resultados || jsonb_build_object('ordem', 3,
            'cenario', 'conta vet grava telefone em perfil_privado', 'esperado', 'grava sem erro',
            'obtido', sqlerrm,
            'veredito', 'FALHA: a guarda vigia demais e quebrou o caso mais comum da tabela.');
      end;
    end if;

    raise exception 'ROLLBACK_DA_SONDA';
  exception
    when others then
      if sqlerrm <> 'ROLLBACK_DA_SONDA' then
        resultados := resultados || jsonb_build_object('ordem', 999,
          'cenario', 'execucao da sonda', 'esperado', 'nenhum erro', 'obtido', sqlerrm,
          'veredito', 'SONDA INVALIDA: a sonda quebrou no meio.');
      end if;
  end;

  insert into sonda13b (ordem, cenario, esperado, obtido, veredito)
  select (e ->> 'ordem')::int, e ->> 'cenario', e ->> 'esperado', e ->> 'obtido', e ->> 'veredito'
  from jsonb_array_elements(resultados) e;
end
$sonda13b$;

select * from sonda13b order by ordem;


-- ####### SONDA 14 — a que nenhum SQL faz por você ##########################
-- Quatro coisas que só a mão confere. Esta sonda é de propósito a última: ela é
-- a única do projeto que admite que existe coisa que SQL não verifica.
--
-- (a) O BUCKET, PELO PAINEL.
--     Supabase → Storage → `documentos`. Confira com os olhos:
--       · o cadeado de "Private" está lá (não diz "Public")
--       · File size limit: 10 MB
--       · Allowed MIME types: os quatro
--     Tente arrastar um `.svg` para dentro pelo painel: tem que ser recusado.
--     (O painel usa service_role, então ele CONSEGUE subir arquivo. Isso é
--     esperado e não é falha: quem tem que ser barrado é o navegador do
--     usuário, e é a sonda 3 que mede isso, depois da T-008.)
--
-- (b) O CAMINHO REAL DO ESTABELECIMENTO, NO APP.
--     Depois da T-007 estar no ar: crie uma conta de estabelecimento, preencha
--     o onboarding, aprove pelo SQL, e então:
--
--     select c.nome_fantasia, c.cidade, p.cnpj, p.razao_social, p.responsavel_tecnico
--     from public.clinic_profiles c
--     join public.perfil_privado p on p.id = c.id
--     where c.id = 'COLE-O-UUID-AQUI';
--
--     O CNPJ tem que estar do lado de `perfil_privado`. Se estiver nulo lá e a
--     tela mostrar o CNPJ preenchido, a Server Action da T-007 está gravando no
--     lugar antigo e o dado está sendo descartado em silêncio.
--
--     Depois, edite o CNPJ pela tela de perfil e recarregue: o estabelecimento
--     tem que sair da busca e voltar para a fila de validação. É a sonda 10,
--     agora pelo caminho de verdade, com a sessão de um usuário real em vez de
--     `postgres`.
--
-- (c) ⚠️ PELA API, NÃO PELO SQL (SEC-038 item 3). Nenhuma sonda deste arquivo
--     passa pelo PostgREST, e a SEC-020 foi descrita como um request HTTP. O
--     PostgREST guarda o schema em cache; a migration termina com
--     `notify pgrst, 'reload schema'` justamente para invalidá-lo. Confira que
--     funcionou, do seu terminal, com a chave ANÔNIMA (a mesma que está no
--     bundle do site, não a de service role):
--
--     curl -s "https://<PROJECT>.supabase.co/rest/v1/clinic_profiles?select=cnpj" \
--       -H "apikey: <ANON_KEY>"
--
--     ✅ SUCESSO = erro dizendo que a coluna `cnpj` não existe.
--     ❌ FALHA   = qualquer JSON com dado. Se vier dado, o cache do PostgREST
--        ainda está servindo o schema antigo: espere um minuto e repita. Se
--        insistir, rode `notify pgrst, 'reload schema';` à mão.
--
--     Faça o mesmo com `perfil_privado`, que tem que responder erro de
--     permissão:
--     curl -s "https://<PROJECT>.supabase.co/rest/v1/perfil_privado?select=cnpj" \
--       -H "apikey: <ANON_KEY>"
--
-- (d) O UPLOAD, DEPOIS DA T-008 (não dá para fazer antes: a rota não existe).
--       · suba um PDF de verdade pelo onboarding e confira no banco que
--         `documento_path`, `documento_hash` e `documento_tamanho` foram
--         gravados os três, e que o hash tem 64 caracteres;
--       · renomeie um `.exe` para `.pdf` e tente subir: a rota tem que recusar
--         pela ASSINATURA MÁGICA, não pelo nome (2.c da migration);
--       · suba um segundo documento: o caminho tem que ser NOVO, o hash tem que
--         ser OUTRO, `documento_enviado_em` tem que ter avançado, e o perfil tem
--         que voltar para `pending_validation`. ⚠️ Este é o único jeito de provar
--         o recarimbo da seção 6.b: `now()` é o timestamp da transação, então
--         nenhuma sonda em rollback enxerga a data se mover. Precisa ser em dois
--         envios de verdade, em transações diferentes;
--       · abra o documento como admin e confira que nasceu uma linha em
--         `audit_logs` com `acao = 'documento_visualizado'` e `alvo_id` = o dono
--         (SEC-040):
--         select * from public.audit_logs where acao = 'documento_visualizado'
--         order by created_at desc limit 5;
--       · rode a SONDA 3 de novo, agora com documento de verdade no bucket. Só
--         aí ela deixa de ser fraca.
