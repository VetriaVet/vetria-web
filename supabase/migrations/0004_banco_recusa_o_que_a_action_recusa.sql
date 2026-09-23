-- ============================================================================
-- 0004 — O BANCO PASSA A RECUSAR O QUE A ACTION RECUSA
--
-- O que faz, em uma frase: a regra que hoje mora só na Server Action passa a
-- morar também no Postgres, que é o único escritor que não dá para contornar.
--
-- Card: T-027 (absorveu a T-017 em 23/09/2026, DL-062).
--
-- O que fecha, item por item:
--   R-039 / SEC-060 / T-017  CHECKs de conteúdo em vet_profiles e
--                            clinic_profiles: UF válida em estado e crmv_uf,
--                            lista fechada em titulo e experiencia, teto de
--                            tamanho nos textos públicos e nos arrays, e
--                            clinic_profiles.site só http/https (seção 2)
--   R-059                    formato do NÚMERO do CRMV, no CHECK e na Action,
--                            pela mesma regra (seção 2.a)
--   SEC-096 (fecha SEC-099)  admin_definir_status confere a ORIGEM
--                            (pending_validation para aprovar e reprovar),
--                            exige motivo para reprovar e suspender, e faz o
--                            update condicional com `if not found` (seção 5)
--   SEC-097 (b) + SEC-093    as policies *_select_admin de vet_profiles,
--                            clinic_profiles e perfil_privado passam a exigir
--                            o role certo do alvo e, para o dossiê, alvo em
--                            pending_validation (seções 3 e 4)
--   SEC-098                  concluir_onboarding_profissional exige o objeto
--                            do documento no bucket `documentos` (seção 6)
--
-- O que esta migration explicitamente NÃO faz:
--   · NÃO apaga, NÃO renomeia e NÃO dropa nada. É aditiva. As três policies
--     mudam por `alter policy ... using`, sem drop.
--   · NÃO altera UMA linha de dado de usuário. O dado antigo fora da regra é
--     tratado pela decisão da seção 2 (NOT VALID + validação separada).
--   · NÃO mexe em is_admin() nem em is_master_admin() (é a T-032, 2FA).
--   · NÃO cria tabela de apoio, `slug` nem pertença à lista de especialidades
--     e serviços. É a T-028 / 0005 (DL-062 item 5).
--   · NÃO encosta no CHECK all-or-nothing de perfil_privado.documento_*.
--   · NÃO resolve o R-040 (onboarding_completed escrito pelo dono).
--   · NÃO mexe em profiles_select_admin nem nas policies de UPDATE do admin.
--     Ver a nota da seção 4 sobre o que isso implica para a moderação.
--
-- ⚠️  ANTES DE RODAR, NESTA ORDEM (o roteiro completo está no card T-027):
--   1. `supabase/prevoo-0004.sql`, uma consulta por vez. Leia o que ele diz.
--   2. `supabase/backup-antes-da-0004.sql`. Exporte os CSV para
--      `supabase/backups/`. O plano é Free: não existe backup automático.
--   3. Leia a seção 10 (reversão).
--   4. Rode ESTE arquivo INTEIRO, de uma vez. É uma transação só.
--   5. O último comando é um `select` DEPOIS do commit: é o único canal de
--      saída deste arquivo. Leia a tabela inteira.
--   6. `supabase/verificar-apos-0004.sql`, uma sonda por vez.
--
-- ⚠️  NADA AQUI FALA POR `raise notice` (SEC-035): o SQL Editor deste projeto
--   não renderiza NOTICE. O que precisa ser lido é `raise exception` (para
--   tudo) ou linha do select final.
--
-- Escrita em: 23/09/2026 · vetria-backend · NÃO APLICADA em lugar nenhum.
-- Auditoria obrigatória antes de aplicar: vetria-seguranca.
-- ============================================================================


-- ============================================================================
-- A DECISÃO SOBRE O DADO QUE JÁ ESTÁ NO BANCO (leia antes da seção 2)
-- ============================================================================
-- `alter table ... add constraint ... check (...)` confere TODAS as linhas que
-- já existem, e se uma única violar, a migration inteira cai. Há dado real em
-- vet_profiles desde 31/08, e dado sabidamente fora da regra nova: as contas
-- de teste têm CRMV "GO-0155" e "GO 1522" (a sigla da UF dentro do número, o
-- R-059 visto em tela em 23/09).
--
-- DECISÃO: todo CHECK desta migration nasce `NOT VALID`, e a seção 8 tenta
-- validar cada um, um por um, deixando `NOT VALID` só o que ainda tiver linha
-- fora da regra.
--
-- O que `NOT VALID` significa, porque é fácil entender errado:
--   · a regra VALE A PARTIR DO COMMIT para todo INSERT e todo UPDATE, de
--     qualquer escritor. O `PATCH estado='ZZ'` da medição de 23/09 é recusado
--     no minuto seguinte à aplicação, com ou sem linha suja no banco;
--   · o que ela NÃO faz é conferir as linhas antigas. Uma linha suja continua
--     lá, e continua suja, até alguém a corrigir;
--   · e essa linha suja NÃO consegue ser salva de novo sem ser corrigida:
--     o CHECK é avaliado sobre a linha inteira a cada UPDATE, mesmo que o
--     UPDATE mexa em outra coluna. A dona da conta que tentar mudar o bairro
--     vai ouvir da Action que o CRMV está fora do formato (a Action confere o
--     CRMV com a mesma regra, R-059) e corrige ali mesmo.
--
-- Por que não "exigir a correção antes e abortar": porque o furo que esta
-- migration fecha está MEDIDO e aberto em produção, e as linhas que travariam
-- a aplicação são de CONTA DE TESTE. Segurar o conserto de segurança por causa
-- de dado de teste é trocar o importante pelo cômodo. E porque o pré-voo não
-- consegue garantir que ninguém grava uma linha nova fora da regra entre a
-- leitura dele e o `add constraint`.
--
-- Por que não "a migration corrige o dado": porque corrigir CRMV é mexer num
-- dado de identificação. O trigger `revalidar_ao_mudar_dado_sensivel` vigia
-- `crmv`, e rodando como `postgres` o `is_admin()` dá falso: toda conta
-- `active` com CRMV normalizado pela migration sairia da busca e voltaria para
-- a fila, com uma linha em `audit_logs` dizendo que ela mesma mudou o dado.
-- Ninguém mudou nada: teria sido a migration. É a lição da seção 5 da 0003.
--
-- O caminho das linhas sujas, depois de aplicar:
--   1. o select final e a sonda 1 do verificar mostram qual CHECK ficou
--      `NOT VALID` e o `prevoo-0004.sql` (consulta 4) mostra QUAIS linhas;
--   2. a pessoa dona da conta corrige pela tela (onboarding em modo revisão),
--      ou o Elber corrige no SQL Editor, com a ressalva do trigger acima;
--   3. roda de novo SÓ a seção 8 deste arquivo (o bloco `$validar$`). Ela é
--      idempotente e valida o que tiver ficado limpo.
-- Enquanto um CHECK estiver `NOT VALID`, ele protege tudo o que for escrito,
-- e a única coisa que ele não garante é o passado.


begin;


-- ============================================================================
-- 1. PRÉ-VOO — as asserções que param tudo antes de mexer em qualquer coisa
-- ============================================================================
-- Tudo aqui é leitura de catálogo. Toda asserção termina em `raise exception`.
-- O banco vive fora do repo (R-006): o que está em produção pode não ser o que
-- a 0002 diz, e esta migration SOBRESCREVE duas funções.

-- 1.1 — ⚠️ AS DUAS FUNÇÕES QUE A SEÇÃO 5 E A 6 SOBRESCREVEM SÃO AS DA 0002?
-- Mesma trava do pré-voo 1.7 da 0003 (SEC-037 / SEC-024), com uma melhoria que
-- tira o passo manual: o hash é calculado sobre o corpo SEM ESPAÇO EM BRANCO.
-- A 0003 descobriu, medindo, que o md5 de `prosrc` em produção diferia do md5
-- do arquivo só por espaço em branco perdido entre o editor e o Postgres (fim
-- de linha, provavelmente). Tirando todo espaço em branco dos dois lados, o
-- hash passa a poder ser calculado a partir do ARQUIVO do repo, e continua
-- pegando qualquer mudança de conteúdo: uma letra trocada muda o hash.
--
-- Os valores abaixo foram calculados sobre o corpo entre `$$` e `$$` de
-- `0002_nucleo.sql:675-725` (admin_definir_status) e `:733-759`
-- (concluir_onboarding_profissional), removendo espaço, tab, CR, LF, FF e VT.
-- O corpo NOVO (desta migration) também é aceito, para que rodar o arquivo de
-- novo depois de aplicado não aborte: a migration é idempotente.
--
-- SE ABORTAR: a mensagem imprime o hash encontrado e o corpo inteiro. Leia o
-- corpo contra a 0002. Se alguém tiver editado a função fora do repo, PARE e
-- decida com o Elber o que fazer com essa edição. Não comente o bloco.
do $preflight$
declare
  esperado constant jsonb := jsonb_build_object(
    'admin_definir_status', jsonb_build_array(
      '51f27f5c43ca5c48aea0a3a21850cad2',   -- corpo da 0002
      '52241257ac30590e445c93e1bc39d09a'    -- corpo da 0004 (secao 5)
    ),
    'concluir_onboarding_profissional', jsonb_build_array(
      '0be00dee7bb30fddae30e7fde73293e0',   -- corpo da 0002
      '542d156b7723946d987647491dcfde13'    -- corpo da 0004 (secao 6)
    )
  );
  nome    text;
  achado  text;
  quantas integer;
  definer boolean;
begin
  for nome in select jsonb_object_keys(esperado) loop
    select count(*) into quantas
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = nome;

    if quantas <> 1 then
      raise exception
        'PARE: esperava exatamente 1 funcao public.%, encontrei %. Sobrecarga criada fora do repo? `create or replace` nao saberia qual trocar.', nome, quantas;
    end if;

    select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')), p.prosecdef
    into achado, definer
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = nome;

    if not ((esperado -> nome) ? achado) then
      raise exception
        'PARE: o corpo de public.%() NAO e o da 0002 nem o da 0004. hash sem espacos encontrado=%. Alguem editou a funcao fora do repo (R-006 / SEC-024), e esta migration apagaria a edicao. CORPO ENTRE >>> e <<< : >>>%<<<',
        nome, achado,
        (select p.prosrc from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.proname = nome);
    end if;

    if not definer then
      raise exception
        'PARE: public.%() existe mas NAO e SECURITY DEFINER. O corpo bate com o repo e o atributo nao: alguem recriou a funcao pelo painel. Descubra antes de seguir.', nome;
    end if;
  end loop;
end
$preflight$;

-- 1.2 — ⚠️ AS POLICIES DE LEITURA QUE A SEÇÃO 4 TROCA SÃO AS QUE A 0002 CRIOU?
-- E, o mais importante: NÃO EXISTE OUTRA policy de SELECT nessas três tabelas.
-- Policies permissivas se somam por OU. Se alguém tiver criado pelo painel uma
-- policy `for select using (true)` ou `using (is_admin())` com outro nome, a
-- seção 4 aperta as três que conhece e a quarta devolve tudo por trás: o
-- arquivo inteiro pareceria correto e a SEC-097 continuaria aberta.
--
-- O conjunto esperado é o da 0002 §6, conferido linha a linha:
--   vet_profiles     select_publico · select_own · select_admin
--   clinic_profiles  select_publico · select_own · select_admin
--   perfil_privado   select_own · select_admin
-- `cmd = 'ALL'` também conta, porque policy `for all` vale para SELECT.
do $preflight$
declare
  sobrando text;
  qual_atual text;
  p record;
begin
  select string_agg(format('%s.%s [cmd=%s]', tablename, policyname, cmd), '; ')
  into sobrando
  from pg_policies
  where schemaname = 'public'
    and tablename in ('vet_profiles', 'clinic_profiles', 'perfil_privado')
    and cmd in ('SELECT', 'ALL')
    and policyname not in (
      'vet_profiles_select_publico', 'vet_profiles_select_own', 'vet_profiles_select_admin',
      'clinic_profiles_select_publico', 'clinic_profiles_select_own', 'clinic_profiles_select_admin',
      'perfil_privado_select_own', 'perfil_privado_select_admin'
    );

  if sobrando is not null then
    raise exception
      'PARE: existe policy de leitura que o repo nao conhece: %. Policies permissivas se somam por OU: apertar as tres da 0002 nao adianta se esta continuar aberta. Descubra de quem e, decida com o Elber e so entao rode.', sobrando;
  end if;

  for p in
    select * from (values
      ('vet_profiles',    'vet_profiles_select_admin'),
      ('clinic_profiles', 'clinic_profiles_select_admin'),
      ('perfil_privado',  'perfil_privado_select_admin')
    ) as t(tabela, politica)
  loop
    select pol.qual into qual_atual
    from pg_policies pol
    where pol.schemaname = 'public' and pol.tablename = p.tabela and pol.policyname = p.politica;

    if qual_atual is null then
      raise exception
        'PARE: a policy %.% nao existe (ou nao tem USING). A 0002 a criou; o banco nao e o que o repo diz (R-006).', p.tabela, p.politica;
    end if;

    -- a da 0002 (`is_admin()`), ou a desta migration (rodada de novo)
    if qual_atual <> 'is_admin()' and qual_atual not like '%admin_pode_ver_%' then
      raise exception
        'PARE: %.% tem USING = %, que nao e o da 0002 (is_admin()) nem o da 0004. Alguem a mudou pelo painel.', p.tabela, p.politica, qual_atual;
    end if;
  end loop;
end
$preflight$;

-- 1.3 — ⚠️ A SEÇÃO 6 CONSULTA `storage.objects`. ESTE PAPEL CONSEGUE LER ALI?
-- `concluir_onboarding_profissional` é SECURITY DEFINER: roda com o privilégio
-- de quem a criou, que é quem está rodando este arquivo. Se esse papel não
-- puder ler `storage.objects`, a função passa a levantar `permission denied`
-- para TODO profissional que tentar concluir o cadastro: o funil de entrada
-- inteiro morre, e o sintoma aparece na tela de onboarding, longe daqui.
-- Medido na 0003 (sonda 4, 26/08): `postgres` tem BYPASSRLS. O que falta
-- conferir é o GRANT de leitura na tabela, que é outra coisa.
do $preflight$
begin
  if not has_table_privilege(current_user, 'storage.objects', 'SELECT') then
    raise exception
      'PARE: o papel % nao tem SELECT em storage.objects. A funcao de concluir o onboarding passaria a falhar para todo mundo. Rode esta migration como postgres pelo SQL Editor.', current_user;
  end if;

  if not exists (select 1 from storage.buckets where id = 'documentos') then
    raise exception
      'PARE: o bucket documentos nao existe. A 0003 nao foi aplicada neste banco, e sem o bucket ninguem mais conclui o onboarding depois desta migration. Aplique a 0003 antes.';
  end if;
end
$preflight$;

-- 1.4 — as duas funções que as policies novas CHAMAM existem e são DEFINER?
-- `admin_pode_ver_*` (seção 3) chamam `is_admin()` e `is_master_admin()`. As
-- duas precisam ser SECURITY DEFINER + search_path fixo (DL-014/015): uma
-- INVOKER consultando `profiles` de dentro de policy é a recursão que já
-- derrubou este banco uma vez.
do $preflight$
declare
  fraca text;
begin
  select string_agg(p.proname, ', ')
  into fraca
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('is_admin', 'is_master_admin')
    and (not p.prosecdef
         or not coalesce(p.proconfig, '{}'::text[]) && array['search_path=public', 'search_path="public"']);

  if fraca is not null then
    raise exception
      'PARE: % nao e SECURITY DEFINER com search_path=public. Usar isso dentro de policy e o DL-014. Corrija a funcao antes.', fraca;
  end if;

  if (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname in ('is_admin', 'is_master_admin')) <> 2 then
    raise exception 'PARE: is_admin() ou is_master_admin() nao existe neste banco. A 0000/0002 nao estao inteiras.';
  end if;
end
$preflight$;


-- ============================================================================
-- 2. OS CHECKs DE CONTEÚDO (T-017 / R-039 / SEC-060 / R-059)
-- ============================================================================
-- Todos `NOT VALID` (decisão no topo do arquivo) e todos idempotentes: cada um
-- só é criado se ainda não existir com aquele nome.
--
-- ⚠️ CADA LISTA AQUI TEM UM ESPELHO NO CÓDIGO, E OS DOIS MUDAM JUNTOS.
-- A lista do banco é a que vale; a do código existe para a pessoa ouvir o erro
-- na língua dela, no passo certo do formulário, e não um `23514`.
--   UFs, titulo, experiencia, tetos, CRMV → app/app/veterinario/onboarding/campos.ts
--   UFs, tetos, cep, servicos             → app/app/estabelecimento/onboarding/campos.ts
-- Se a lista do código crescer e a daqui não, a pessoa preenche certo e o
-- banco recusa. Se a daqui crescer e a do código não, ninguém consegue usar o
-- valor novo. As duas direções são defeito; a primeira é a mais barulhenta.
--
-- Os tetos usam `char_length` (caracteres) e o código usa `.length` do JS
-- (unidades UTF-16, que contam emoji como 2). Então tudo que passa no código
-- passa aqui: o código é sempre um pouco mais apertado, nunca mais frouxo.
--
-- As UFs estão escritas três vezes neste arquivo (crmv_uf, e estado nas duas
-- tabelas), e é de propósito: uma função `uf_valida()` dentro de CHECK
-- esconderia a regra de quem lê o schema, e trocar o corpo dela depois não
-- revalidaria linha nenhuma. A lista literal aparece em `\d vet_profiles`.

do $checks$
begin
  -- -------------------------------------------------------------------------
  -- 2.a — vet_profiles
  -- -------------------------------------------------------------------------

  -- UF do registro no conselho. 27 UFs, maiúsculas (a Action faz toUpperCase).
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.vet_profiles'::regclass and conname = 'vet_profiles_crmv_uf_valida') then
    alter table public.vet_profiles add constraint vet_profiles_crmv_uf_valida
      check (crmv_uf is null or crmv_uf in (
        'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
        'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))
      not valid;
  end if;

  -- UF de atendimento. É esta a coluna do `PATCH estado='ZZ'` medido em 23/09.
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.vet_profiles'::regclass and conname = 'vet_profiles_estado_valido') then
    alter table public.vet_profiles add constraint vet_profiles_estado_valido
      check (estado is null or estado in (
        'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
        'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))
      not valid;
  end if;

  -- ⚠️ R-059 — o NÚMERO do CRMV: só algarismos, de 1 a 6.
  -- A UF tem coluna própria (`crmv_uf`). "GO-0155" com `crmv_uf = 'AL'` é
  -- exatamente o que a fila mostrou em 23/09: a sigla de uma UF dentro do
  -- número, e outra UF no campo da UF. Aqui nenhuma letra entra.
  -- Seis algarismos cobrem com folga os maiores conselhos (a numeração do
  -- CRMV-SP está na casa das dezenas de milhar) e o zero à esquerda que a
  -- pessoa digita ("0155"). Espaço e ponto de milhar ("12.345") são tirados
  -- pela Action antes de gravar; aqui chegam só os algarismos.
  -- ESPELHO: `CRMV_NUMERO` em app/app/veterinario/onboarding/campos.ts.
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.vet_profiles'::regclass and conname = 'vet_profiles_crmv_formato') then
    alter table public.vet_profiles add constraint vet_profiles_crmv_formato
      check (crmv is null or crmv ~ '^[0-9]{1,6}$')
      not valid;
  end if;

  -- Lista fechada: espelho de TITULOS em campos.ts. Guarda-se o `value`.
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.vet_profiles'::regclass and conname = 'vet_profiles_titulo_lista') then
    alter table public.vet_profiles add constraint vet_profiles_titulo_lista
      check (titulo is null or titulo in ('mv', 'dr', 'me', 'esp'))
      not valid;
  end if;

  -- Lista fechada: espelho de EXPERIENCIA em campos.ts.
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.vet_profiles'::regclass and conname = 'vet_profiles_experiencia_lista') then
    alter table public.vet_profiles add constraint vet_profiles_experiencia_lista
      check (experiencia is null or experiencia in ('lt1', '1a3', '3a5', '5a10', 'gt10'))
      not valid;
  end if;

  -- Tetos dos textos PÚBLICOS. Esta tabela é lida por `anon` em toda linha
  -- `active`: sem teto, uma `bio` de vários MB é servida a todo visitante e
  -- entra na agregação de facetas da busca da F4/S6. Espelho de LIMITES.
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.vet_profiles'::regclass and conname = 'vet_profiles_textos_teto') then
    alter table public.vet_profiles add constraint vet_profiles_textos_teto
      check (
            (nome_exibicao is null or char_length(nome_exibicao) <= 120)
        and (cidade        is null or char_length(cidade)        <= 80)
        and (bairro        is null or char_length(bairro)        <= 200)
        and (bio           is null or char_length(bio)           <= 500)
      )
      not valid;
  end if;

  -- Teto do ARRAY, não pertença à lista. A pertença é da T-028, onde a tabela
  -- de especialidades nasce e passa a ser a fonte da verdade (DL-062 item 5):
  -- escrever a lista num CHECK hoje e numa tabela na semana que vem seria o
  -- R-039 (duas cópias) nascendo de propósito.
  -- 4 = MAX_ESPECIALIDADES ("1 principal e até 3 secundárias"). O segundo teto
  -- é a soma dos textos: sem ele, 4 elementos de 1 MB cada passariam.
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.vet_profiles'::regclass and conname = 'vet_profiles_especialidades_teto') then
    alter table public.vet_profiles add constraint vet_profiles_especialidades_teto
      check (
            cardinality(especialidades) <= 4
        and char_length(array_to_string(especialidades, '')) <= 240
      )
      not valid;
  end if;

  -- -------------------------------------------------------------------------
  -- 2.b — clinic_profiles
  -- -------------------------------------------------------------------------

  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.clinic_profiles'::regclass and conname = 'clinic_profiles_estado_valido') then
    alter table public.clinic_profiles add constraint clinic_profiles_estado_valido
      check (estado is null or estado in (
        'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
        'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'))
      not valid;
  end if;

  -- A Action grava o CEP só com os 8 dígitos (`actions.ts`, "Passo 2").
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.clinic_profiles'::regclass and conname = 'clinic_profiles_cep_formato') then
    alter table public.clinic_profiles add constraint clinic_profiles_cep_formato
      check (cep is null or cep ~ '^[0-9]{8}$')
      not valid;
  end if;

  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.clinic_profiles'::regclass and conname = 'clinic_profiles_textos_teto') then
    alter table public.clinic_profiles add constraint clinic_profiles_textos_teto
      check (
            (nome_fantasia is null or char_length(nome_fantasia) <= 120)
        and (endereco      is null or char_length(endereco)      <= 200)
        and (cidade        is null or char_length(cidade)        <= 80)
        and (sobre         is null or char_length(sobre)         <= 600)
      )
      not valid;
  end if;

  -- 9 = MAX_SERVICOS (a lista inteira). Pertença à lista: T-028.
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.clinic_profiles'::regclass and conname = 'clinic_profiles_servicos_teto') then
    alter table public.clinic_profiles add constraint clinic_profiles_servicos_teto
      check (
            cardinality(servicos) <= 9
        and char_length(array_to_string(servicos, '')) <= 400
      )
      not valid;
  end if;

  -- ⚠️ A LINHA MAIS IMPORTANTE DESTE ARQUIVO (T-017).
  -- `site` é "PÚBLICA por decisão. É vitrine" (0003:1301) e vira LINK numa
  -- página pública na F4/S7. Hoje `javascript:alert(1)` e `data:text/html,...`
  -- passam. O dia em que a página existir, passam a ser executáveis no
  -- navegador de quem clicar.
  --
  -- A regra, lida da esquerda para a direita:
  --   ^https?://          esquema http ou https, e mais nenhum (case-insensitive,
  --                       `~*`: "HTTPS://" é o mesmo endereço)
  --   [^...]+             um host NÃO VAZIO, sem espaço, sem caractere de
  --                       controle, sem aspas, sem < > e sem barra invertida, e
  --                       que não começa com / ? # ("https:///x" não passa)
  --   ([/?#][^...]*)?     caminho, query e fragmento opcionais, com a mesma
  --                       lista de proibidos
  --   300 caracteres      teto, como todo texto público
  -- Aspas, < > e barra invertida ficam fora mesmo sendo inofensivas dentro de
  -- um `href` que o React escapa: não existe URL de site legítima com eles, e
  -- recusar custa zero.
  -- NÃO há campo de site em tela hoje (T-007 decidiu não criar). Quem criar:
  -- conferir o esquema no servidor ANTES de gravar, com a mesma regra, para a
  -- pessoa ouvir o erro em português e não um 23514.
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.clinic_profiles'::regclass and conname = 'clinic_profiles_site_http') then
    alter table public.clinic_profiles add constraint clinic_profiles_site_http
      check (
        site is null
        or (
              char_length(site) <= 300
          and site ~* '^https?://[^[:space:][:cntrl:]"<>\\/?#]+([/?#][^[:space:][:cntrl:]"<>\\]*)?$'
        )
      )
      not valid;
  end if;
end
$checks$;

comment on constraint vet_profiles_crmv_formato on public.vet_profiles is
  'R-059 / T-027: só algarismos, 1 a 6. A UF mora em crmv_uf. Espelho: CRMV_NUMERO em app/app/veterinario/onboarding/campos.ts. Mudou aqui, muda lá.';
comment on constraint vet_profiles_estado_valido on public.vet_profiles is
  'R-039 / T-017 / T-027: UF brasileira. Espelho: UFS em app/app/veterinario/onboarding/campos.ts.';
comment on constraint clinic_profiles_site_http on public.clinic_profiles is
  'T-017 / T-027: site só http/https, host não vazio, sem espaço nem caractere de controle. A coluna vira link em página pública (F4/S7). Nunca afrouxe sem auditoria.';


-- ============================================================================
-- 3. AS FUNÇÕES QUE AS POLICIES DE LEITURA DO ADMIN PASSAM A CHAMAR
-- ============================================================================
-- ⚠️ DL-014/015 — SECURITY DEFINER + SET search_path = public, as duas.
-- Elas consultam `profiles` de dentro de policy de OUTRA tabela. Como DEFINER,
-- rodam com o dono (postgres, BYPASSRLS): nenhuma policy de `profiles` é
-- avaliada lá dentro e não há como a consulta voltar para a policy que a
-- chamou. INVOKER aqui é o caminho da recursão que já derrubou este banco.
--
-- ⚠️ A DECISÃO SOBRE O MASTER (SEC-097 b pede o aperto "para o admin comum"
-- e deixa o master em aberto). Registrada como DL-066, a confirmar pelo Elber:
--
--   vet_profiles e clinic_profiles (o perfil de VITRINE, sem contato e sem
--   documento): o master CONTINUA lendo a linha de qualquer vet/clinic, em
--   qualquer status. É a linha "Ver a base inteira de usuários: master ✅" da
--   matriz §5, e é dado que vira público assim que a conta é aprovada.
--
--   perfil_privado (o DOSSIÊ: CNPJ, razão social, responsável técnico,
--   WhatsApp, telefone, caminho do documento): o master PERDE a leitura fora
--   da validação, igual ao admin comum. É o DL-061 levado ao banco: "o dossiê
--   existe para validar, então só abre enquanto há validação", e a tela e a
--   rota do documento JÁ aplicam isso ao master desde a T-024 (`fila.ts`,
--   `carregarCadastro`: "nem para o master"). Deixar o PostgREST mais largo
--   que a tela para o master seria manter aberto por trás o que a tela fechou
--   pela frente, e é exatamente o que o R-062 descreve: uma senha de master
--   vazada entrega o dossiê de toda a base. Nenhuma tela do app lê
--   perfil_privado de conta fora da fila com a sessão do master; o painel de
--   usuários do master usa `/api/admin/*` com service_role e não passa por aqui.
--   Se o master precisar do dossiê de uma conta `active` (investigação de
--   fraude), o caminho é o SQL Editor, que é acesso de dono do banco e fica
--   fora do produto. Se o Elber decidir o contrário, é UMA linha: o
--   `or public.is_master_admin()` que está em admin_pode_ver_perfil.

-- 3.1 — o admin pode ler o perfil de vitrine desta conta?
--   · SEC-093: o role do alvo tem que ser o da tabela (`vet` em vet_profiles,
--     `clinic` em clinic_profiles), para admin E master. É a mesma cláusula
--     que `profiles_select_admin` já tem desde a 0002.
--   · SEC-097 (b): admin comum, só alvo em `pending_validation`. O que está
--     `active` ele continua lendo, mas pela policy PÚBLICA, como qualquer um.
create or replace function public.admin_pode_ver_perfil(p_id uuid, p_role public.user_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_admin()
     and exists (
       select 1
       from public.profiles p
       where p.id = p_id
         and p.role = p_role
         and (p.status = 'pending_validation' or public.is_master_admin())
     );
$$;

-- 3.2 — o admin pode ler o DOSSIÊ desta conta? Só com validação em curso, e
-- só de vet/clinic. Vale para admin comum e master (ver a decisão acima).
create or replace function public.admin_pode_ver_dossie(p_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_admin()
     and exists (
       select 1
       from public.profiles p
       where p.id = p_id
         and p.role in ('vet', 'clinic')
         and p.status = 'pending_validation'
     );
$$;

-- ⚠️ SEC-014 — por que `authenticated` recebe EXECUTE e `anon` não.
-- Expressão de policy é avaliada como o usuário da consulta, e o SECURITY
-- DEFINER só troca de contexto DEPOIS da checagem de EXECUTE. As três policies
-- que chamam estas funções são `to authenticated`: é só esse papel que as
-- avalia. `anon` nunca chega nelas (a leitura pública passa por
-- `*_select_publico`, que usa `perfil_esta_ativo`, intocada aqui). Revogar de
-- `anon` explicitamente porque o Supabase concede EXECUTE a `anon` por default
-- privileges, e `revoke from public` sozinho não tira isso.
revoke execute on function public.admin_pode_ver_perfil(uuid, public.user_role) from public, anon;
revoke execute on function public.admin_pode_ver_dossie(uuid)                    from public, anon;
grant  execute on function public.admin_pode_ver_perfil(uuid, public.user_role) to authenticated;
grant  execute on function public.admin_pode_ver_dossie(uuid)                    to authenticated;


-- ============================================================================
-- 4. AS TRÊS POLICIES DE LEITURA DO ADMIN (SEC-097 b + SEC-093)
-- ============================================================================
-- `alter policy ... using` troca só a expressão. Nome, comando (`select`) e
-- papel (`to authenticated`) ficam como a 0002 deixou, e rodar de novo é
-- inofensivo. Nada é dropado.
--
-- O que MUDA para quem usa o produto: nada na tela. A fila e o detalhe já
-- filtravam `pending_validation` na consulta (T-023/T-024), e a rota do
-- documento também (SEC-097 a). O que muda é o PostgREST cru: o token de um
-- admin comum deixa de ler, por `GET /rest/v1/perfil_privado?id=eq.<uuid>`,
-- o CNPJ e o WhatsApp de quem já saiu da fila.
--
-- ⚠️ O QUE ISTO IMPLICA PARA A MODERAÇÃO (e é consequência, não descuido):
-- `vet_profiles_update_admin` e `clinic_profiles_update_admin` continuam
-- `using (is_admin())`. Mas UPDATE com filtro na linha também passa pelas
-- policies de SELECT. Na prática: o admin comum continua conseguindo editar o
-- perfil de uma conta `active` (ela é legível pela policy pública) e de uma
-- conta na fila, e deixa de alcançar a de uma conta `incomplete` ou
-- `suspended`. A matriz §5 diz que moderar "ganha tela própria quando existir"
-- (DL-061); essa tela não existe, e quando existir ela traz a regra de leitura
-- que a finalidade dela justificar.

alter policy vet_profiles_select_admin on public.vet_profiles
  using (public.admin_pode_ver_perfil(id, 'vet'));

alter policy clinic_profiles_select_admin on public.clinic_profiles
  using (public.admin_pode_ver_perfil(id, 'clinic'));

alter policy perfil_privado_select_admin on public.perfil_privado
  using (public.admin_pode_ver_dossie(id));


-- ============================================================================
-- 5. admin_definir_status CONFERE A ORIGEM (SEC-096, fecha a SEC-099)
-- ============================================================================
-- A regra do DL-061 e do R-051 deixa de morar só na Server Action.
--
-- AS TRANSIÇÕES QUE A FUNÇÃO ACEITA, E MAIS NENHUMA (matriz §4 e §5):
--
--   de                   para                 quem          motivo
--   pending_validation → active               admin, master opcional
--   pending_validation → incomplete           admin, master OBRIGATÓRIO
--   qualquer ≠ suspended → suspended          só master     OBRIGATÓRIO
--   suspended          → qualquer ≠ suspended só master     opcional
--
-- O que passa a ser RECUSADO, e antes não era:
--   · incomplete → active: a conta que nunca concluiu o cadastro nem mandou
--     documento virava `active` com uma chamada (SEC-096 exploração 1)
--   · reprovar sem motivo, ou com motivo só de espaços (SEC-096 exploração 2,
--     o laço mudo do R-051)
--   · active → pending_validation → abrir o dossiê → active: a SEC-092(a)
--     contornada com duas linhas de trilha (SEC-096 exploração 3)
--   · active → incomplete. A matriz responde (§5, 23/09): reprovar é sobre
--     quem está na fila. Tirar do ar quem já foi aprovado é MODERAÇÃO, que
--     "ganha tela própria quando existir", e o instrumento que existe hoje
--     para isso é a suspensão, que é do master. Quando a tela de moderação
--     nascer, ela chega com DL e com um ramo explícito aqui, com motivo.
--   · a segunda decisão sobre a mesma conta (SEC-099). O `for update` faz o
--     segundo admin ESPERAR o primeiro terminar e então ler o status novo, que
--     já não é `pending_validation`: cai no 55000. O `update ... where status
--     = status_antigo` + `if not found` é a segunda porta, pedida pelo card.
--
-- OS CÓDIGOS DE ERRO SÃO CONTRATO com a Server Action
-- (app/admin/validacoes/[conta]/actions.ts), que decide a frase da tela pelo
-- CÓDIGO e nunca pelo texto (texto de exception é detalhe interno, SEC-057):
--   42501  sem autorização (não é admin, ou é admin comum mexendo em suspensão)
--   55000  a conta não está no estado de origem exigido: "não está mais na fila"
--   22023  pedido inválido: sem motivo, motivo longo demais, transição proibida,
--          alvo que não é vet/clinic
--   P0002  conta não encontrada
--
-- ⚠️ A assinatura NÃO muda (uuid, user_status, text). `create or replace`
-- preserva os GRANTs, e a Action continua chamando igual.
create or replace function public.admin_definir_status(
  target_user_id uuid,
  novo_status    public.user_status,
  motivo         text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
-- 0004 / T-027: SEC-096 e SEC-099. Ver o comentario da secao 5 da migration.
declare
  status_antigo public.user_status;
  alvo_role     public.user_role;
  -- motivo so de espacos, tabs ou quebras de linha conta como ausente
  motivo_limpo  text := nullif(btrim(motivo, E' \t\r\n'), '');
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

revoke execute on function public.admin_definir_status(uuid, public.user_status, text) from anon, public;
grant  execute on function public.admin_definir_status(uuid, public.user_status, text) to authenticated;


-- ============================================================================
-- 6. concluir_onboarding_profissional EXIGE O DOCUMENTO NO BUCKET (SEC-098)
-- ============================================================================
-- A Server Action já recusa concluir sem documento desde a T-024 (DL-061 item
-- 2, T-022 opção a). Mas a RPC é chamável direto pelo PostgREST por qualquer
-- conta logada, e ela não olhava documento: `rpc/concluir_onboarding_profissional`
-- punha a conta na fila sem documento.
--
-- ⚠️ POR QUE CONFERIR O OBJETO NO BUCKET, e não só a coluna:
-- `perfil_privado_update_own` deixa o dono escrever `documento_path`,
-- `documento_hash` e `documento_tamanho` (SEC-098 variante 2). Um `PATCH` com
-- os três inventados satisfaz o CHECK all-or-nothing, o trigger carimba a data,
-- e a conta entraria na fila SEM o badge âmbar, apontando para um arquivo que
-- não existe. A coluna é o que o dono DIZ; o objeto é o que a rota de upload
-- ESCREVEU com service_role (0003 §2.b). A função confere o segundo.
--
-- Lê `storage.objects` como o dono da função (postgres). O pré-voo 1.3
-- conferiu que ele pode. `storage.objects` é qualificada com o schema porque o
-- search_path fixo é só `public`.
--
-- O que NÃO muda: quem já está em `pending_validation` sem documento (as 3
-- contas antigas do DL-061) continua na fila, com o badge âmbar. Esta função
-- só age na passagem `incomplete → pending_validation`.
--
-- Código de erro novo, contrato com as duas Actions de onboarding:
--   55000  documento de validação ausente (sem caminho, ou caminho sem objeto)
-- Os outros continuam com o texto de antes; a Action os trata por RELEITURA
-- do status (SEC-057), não pelo texto.
create or replace function public.concluir_onboarding_profissional()
returns void
language plpgsql security definer set search_path = public
as $$
-- 0004 / T-027: SEC-098. Ver o comentario da secao 6 da migration.
declare
  meu_role      public.user_role;
  meu_status    public.user_status;
  meu_documento text;
begin
  select p.role, p.status into meu_role, meu_status
  from public.profiles p
  where p.id = auth.uid()
  for update;

  if not found then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if meu_role not in ('vet', 'clinic') then
    raise exception 'apenas vet e clinic passam por validacao';
  end if;

  if meu_status <> 'incomplete' then
    raise exception 'onboarding ja concluido';
  end if;

  select pp.documento_path into meu_documento
  from public.perfil_privado pp
  where pp.id = auth.uid();

  if meu_documento is null
     or not exists (
       select 1 from storage.objects o
       where o.bucket_id = 'documentos'
         and o.name = meu_documento
     ) then
    raise exception 'documento de validacao ausente: envie o documento antes de concluir'
      using errcode = '55000';
  end if;

  update public.profiles
  set status = 'pending_validation',
      onboarding_completed = true,
      updated_at = now()
  where id = auth.uid()
    and status = 'incomplete';

  if not found then
    raise exception 'onboarding ja concluido';
  end if;
end;
$$;

revoke execute on function public.concluir_onboarding_profissional() from anon, public;
grant  execute on function public.concluir_onboarding_profissional() to authenticated;


-- ============================================================================
-- 7. AVISAR O PostgREST (regra da 0003, SEC-038)
-- ============================================================================
-- Dentro da transação: NOTIFY só é entregue no commit.
notify pgrst, 'reload schema';


-- ============================================================================
-- 8. VALIDAR O QUE ESTÁ LIMPO — e esta seção RODA DE NOVO SOZINHA
-- ============================================================================
-- Para cada CHECK desta migration que ainda esteja `NOT VALID`, tenta
-- `validate constraint`. Se alguma linha antiga violar, aquele CHECK fica
-- `NOT VALID` e os outros seguem. O resultado aparece no select final (seção
-- 9) e na sonda 1 do verificar, com o nome de cada CHECK.
--
-- ⚠️ Isto NÃO é um aviso que ninguém lê (SEC-035): o `exception` abaixo não
-- esconde nada, ele só impede que UMA linha suja de conta de teste derrube a
-- transação inteira e leve junto o conserto de segurança das seções 3 a 6.
-- O estado de cada CHECK é result set, na tela, na seção 9.
--
-- DEPOIS DE CORRIGIR AS LINHAS SUJAS: rode de novo SÓ o bloco `$validar$`
-- abaixo, e em seguida o select da seção 9. Não precisa de transação em
-- volta: cada `validate` é atômico e não muda dado.
do $validar$
declare
  c record;
begin
  for c in
    select con.conrelid::regclass::text as tabela, con.conname
    from pg_constraint con
    where con.conname in (
      'vet_profiles_crmv_uf_valida', 'vet_profiles_estado_valido',
      'vet_profiles_crmv_formato', 'vet_profiles_titulo_lista',
      'vet_profiles_experiencia_lista', 'vet_profiles_textos_teto',
      'vet_profiles_especialidades_teto',
      'clinic_profiles_estado_valido', 'clinic_profiles_cep_formato',
      'clinic_profiles_textos_teto', 'clinic_profiles_servicos_teto',
      'clinic_profiles_site_http'
    )
      and con.conrelid in ('public.vet_profiles'::regclass, 'public.clinic_profiles'::regclass)
      and not con.convalidated
  loop
    begin
      execute format('alter table %s validate constraint %I', c.tabela, c.conname);
    exception
      when check_violation then
        null;  -- fica NOT VALID; a seção 9 mostra qual, o prevoo mostra quem
    end;
  end loop;
end
$validar$;


commit;


-- ============================================================================
-- 9. O RESULTADO, NA TELA (SEC-035)
-- ============================================================================
-- ⚠️ ÚNICO CANAL DE SAÍDA. Leitura pura, depois do commit.
--
-- Esperado, linha por linha, `ok_TEM_QUE_SER_true` = true, COM UMA EXCEÇÃO
-- CONHECIDA: em PRODUÇÃO, `vet_profiles_crmv_formato` deve vir `false` (NOT
-- VALID) por causa das contas de teste com "GO-0155" e "GO 1522". Isso é a
-- decisão do topo do arquivo funcionando, não falha. Qualquer OUTRO CHECK em
-- `false` quer dizer outra linha suja: a consulta 4 do prevoo diz qual.
-- No projeto de TESTE (vetria-e2e), vazio, TODAS têm que vir true.
--
-- As duas linhas `md5_*` são o novo estado conhecido das funções (hash sem
-- espaços, o mesmo cálculo do pré-voo 1.1). Anote no README das migrations.
select * from (
  select
    10 + row_number() over (order by con.conname) as ordem,
    format('CHECK %s.%s', con.conrelid::regclass, con.conname) as item,
    con.convalidated as ok_TEM_QUE_SER_true,
    case when con.convalidated then 'validada: nenhuma linha antiga fora da regra'
         else 'NOT VALID: vale para toda escrita nova, mas ha linha antiga fora da regra. Corrija (prevoo, consulta 4) e rode de novo a secao 8' end as leitura
  from pg_constraint con
  where con.conrelid in ('public.vet_profiles'::regclass, 'public.clinic_profiles'::regclass)
    and con.conname in (
      'vet_profiles_crmv_uf_valida', 'vet_profiles_estado_valido',
      'vet_profiles_crmv_formato', 'vet_profiles_titulo_lista',
      'vet_profiles_experiencia_lista', 'vet_profiles_textos_teto',
      'vet_profiles_especialidades_teto',
      'clinic_profiles_estado_valido', 'clinic_profiles_cep_formato',
      'clinic_profiles_textos_teto', 'clinic_profiles_servicos_teto',
      'clinic_profiles_site_http')

  union all
  select 1, 'os 12 CHECKs existem',
    (select count(*) = 12 from pg_constraint
      where conrelid in ('public.vet_profiles'::regclass, 'public.clinic_profiles'::regclass)
        and conname in (
          'vet_profiles_crmv_uf_valida', 'vet_profiles_estado_valido',
          'vet_profiles_crmv_formato', 'vet_profiles_titulo_lista',
          'vet_profiles_experiencia_lista', 'vet_profiles_textos_teto',
          'vet_profiles_especialidades_teto',
          'clinic_profiles_estado_valido', 'clinic_profiles_cep_formato',
          'clinic_profiles_textos_teto', 'clinic_profiles_servicos_teto',
          'clinic_profiles_site_http')),
    'se false, alguma criacao nao entrou'

  union all
  select 2, format('policy %s.%s', pol.tablename, pol.policyname),
    pol.qual like '%admin_pode_ver_%',
    pol.qual
  from pg_policies pol
  where pol.schemaname = 'public'
    and pol.policyname in ('vet_profiles_select_admin', 'clinic_profiles_select_admin', 'perfil_privado_select_admin')

  union all
  select 3, format('funcao %s: SECURITY DEFINER + search_path=public', p.proname),
    p.prosecdef and coalesce(p.proconfig, '{}'::text[]) && array['search_path=public'],
    coalesce(array_to_string(p.proconfig, ','), 'SEM search_path')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('admin_pode_ver_perfil', 'admin_pode_ver_dossie',
                      'admin_definir_status', 'concluir_onboarding_profissional')

  union all
  select 4, format('md5_sem_espacos_%s (anote no README)', p.proname),
    true,
    md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('admin_definir_status', 'concluir_onboarding_profissional')

  union all
  select 5, 'anon NAO executa admin_pode_ver_perfil nem admin_pode_ver_dossie',
    not has_function_privilege('anon', 'public.admin_pode_ver_perfil(uuid, public.user_role)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.admin_pode_ver_dossie(uuid)', 'EXECUTE'),
    'se false, o revoke nao pegou (default privileges do Supabase)'

  union all
  select 6, 'authenticated executa as duas (SEC-014: sem isto a fila do admin some)',
    has_function_privilege('authenticated', 'public.admin_pode_ver_perfil(uuid, public.user_role)', 'EXECUTE')
      and has_function_privilege('authenticated', 'public.admin_pode_ver_dossie(uuid)', 'EXECUTE'),
    'se false, TODA leitura do admin nas tres tabelas passa a dar erro'
) resultado
order by ordem, item;


-- ============================================================================
-- 10. PROCEDIMENTO DE REVERSÃO
-- ============================================================================
-- A ORDEM IMPORTA: as policies dependem de admin_pode_ver_*, então elas voltam
-- para `is_admin()` ANTES de as funções saírem. Reverter reabre R-039, SEC-096,
-- SEC-097(b), SEC-098, SEC-099 e SEC-093. Nenhum dado é afetado por reverter:
-- esta migration não alterou dado.
--
-- ⚠️ As duas funções voltam EXATAMENTE como a 0002 as deixou (0002:668-759).
-- Se o backup (`backup-antes-da-0004.sql`, consulta 3) tiver mostrado um corpo
-- diferente em produção, restaure O DO BACKUP, não este.
--
-- begin;
--   -- 1) policies primeiro
--   alter policy vet_profiles_select_admin    on public.vet_profiles    using (public.is_admin());
--   alter policy clinic_profiles_select_admin on public.clinic_profiles using (public.is_admin());
--   alter policy perfil_privado_select_admin  on public.perfil_privado  using (public.is_admin());
--
--   -- 2) as funções auxiliares, já sem policy dependendo delas
--   drop function if exists public.admin_pode_ver_perfil(uuid, public.user_role);
--   drop function if exists public.admin_pode_ver_dossie(uuid);
--
--   -- 3) admin_definir_status como na 0002
--   create or replace function public.admin_definir_status(
--     target_user_id uuid,
--     novo_status    public.user_status,
--     motivo         text default null
--   )
--   returns void
--   language plpgsql security definer set search_path = public
--   as $$
--   declare
--     status_antigo public.user_status;
--     alvo_role     public.user_role;
--   begin
--     if not public.is_admin() then
--       raise exception 'not authorized';
--     end if;
--     select p.status, p.role into status_antigo, alvo_role
--     from public.profiles p where p.id = target_user_id;
--     if not found then
--       raise exception 'usuario nao encontrado';
--     end if;
--     if (novo_status = 'suspended' or status_antigo = 'suspended')
--        and not public.is_master_admin() then
--       raise exception 'not authorized: suspender ou reativar exige master';
--     end if;
--     if alvo_role not in ('vet', 'clinic') then
--       raise exception 'status so se aplica a vet e clinic';
--     end if;
--     update public.profiles
--     set status = novo_status,
--         status_motivo = motivo,
--         onboarding_completed = case
--           when novo_status = 'incomplete' then false
--           else onboarding_completed
--         end,
--         updated_at = now()
--     where id = target_user_id;
--     insert into public.audit_logs (actor_id, acao, alvo_tipo, alvo_id, detalhe)
--     values (auth.uid(), 'definir_status', 'profile', target_user_id,
--             jsonb_build_object('de', status_antigo, 'para', novo_status, 'motivo', motivo));
--   end;
--   $$;
--
--   -- 4) concluir_onboarding_profissional como na 0002
--   create or replace function public.concluir_onboarding_profissional()
--   returns void
--   language plpgsql security definer set search_path = public
--   as $$
--   declare
--     meu_role   public.user_role;
--     meu_status public.user_status;
--   begin
--     select p.role, p.status into meu_role, meu_status
--     from public.profiles p where p.id = auth.uid();
--     if not found then
--       raise exception 'not authorized';
--     end if;
--     if meu_role not in ('vet', 'clinic') then
--       raise exception 'apenas vet e clinic passam por validacao';
--     end if;
--     if meu_status <> 'incomplete' then
--       raise exception 'onboarding ja concluido';
--     end if;
--     update public.profiles
--     set status = 'pending_validation',
--         onboarding_completed = true,
--         updated_at = now()
--     where id = auth.uid();
--   end;
--   $$;
--
--   -- 5) os CHECKs. Só aqui aparece `drop`, e é reversão, não migration.
--   alter table public.vet_profiles    drop constraint if exists vet_profiles_crmv_uf_valida;
--   alter table public.vet_profiles    drop constraint if exists vet_profiles_estado_valido;
--   alter table public.vet_profiles    drop constraint if exists vet_profiles_crmv_formato;
--   alter table public.vet_profiles    drop constraint if exists vet_profiles_titulo_lista;
--   alter table public.vet_profiles    drop constraint if exists vet_profiles_experiencia_lista;
--   alter table public.vet_profiles    drop constraint if exists vet_profiles_textos_teto;
--   alter table public.vet_profiles    drop constraint if exists vet_profiles_especialidades_teto;
--   alter table public.clinic_profiles drop constraint if exists clinic_profiles_estado_valido;
--   alter table public.clinic_profiles drop constraint if exists clinic_profiles_cep_formato;
--   alter table public.clinic_profiles drop constraint if exists clinic_profiles_textos_teto;
--   alter table public.clinic_profiles drop constraint if exists clinic_profiles_servicos_teto;
--   alter table public.clinic_profiles drop constraint if exists clinic_profiles_site_http;
--
--   notify pgrst, 'reload schema';
-- commit;
--
-- ⚠️ E O CÓDIGO: reverter a migration NÃO exige reverter o código da T-027.
-- As Actions só passaram a tratar códigos (55000, 22023, 23514) que a função
-- antiga nunca emite, e a validação do CRMV na Action continua valendo sozinha.


-- ============================================================================
-- 11. VERIFICAÇÃO PÓS-APLICAÇÃO
-- ============================================================================
-- Em arquivo separado, pelo motivo de sempre (ninguém cola as duas coisas
-- juntas):
--
--     supabase/verificar-apos-0004.sql
--
-- A sonda 2 é a prova de antes refeita: o `PATCH estado='ZZ'` da T-017, agora
-- esperando ERRO. A sonda 3 exercita cada transição da seção 5, cada leitura
-- da seção 4 e as três portas da seção 6, com controle positivo em todas.
