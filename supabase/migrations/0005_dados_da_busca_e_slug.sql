-- ============================================================================
-- 0005 — OS DADOS DA BUSCA E O ENDEREÇO PÚBLICO (slug)
--
-- O que faz, em uma frase: dá à busca da F4/S6 o que ela precisa ler (listas
-- de especialidades, serviços e cidades, e índices), e dá a cada profissional
-- aprovado o endereço da página pública da F4/S7 (o `slug`).
--
-- Card: T-028 · Decisões: DL-067 (a regra do slug) e DL-068 (o modelo dos
-- dados da busca) · Fecha: R-065 · Encosta em: R-059 (cidade × UF)
--
-- O que entra, seção por seção:
--   §2  funções de texto, puras: sem_acento, chave_de_nome, slugificar,
--       slug_truncado, juntar_textos
--   §3  tabelas `especialidades`, `servicos` e `cidades`, leitura pública,
--       escrita só por migration. Seed de especialidades e serviços aqui; o de
--       cidades (5571 municípios do IBGE) é o arquivo separado
--       `supabase/seed-0005-cidades-ibge.sql`, que roda DEPOIS deste
--   §4  a PERTENÇA À LISTA que a 0004 deixou para cá (DL-062 item 5):
--       `vet_profiles.especialidades` e `clinic_profiles.servicos` só aceitam
--       item que exista na tabela, conferido por trigger contra a TABELA
--   §5  o slug: formato no banco, gerado pelo servidor quando a conta vira
--       `active`, e PREENCHIDO AGORA nas contas que já estão `active` (R-065)
--   §6  a busca: coluna `busca` (full-text em português) e os índices dos três
--       filtros da F4 (cidade, especialidade/serviço, tipo de atendimento)
--
-- O que esta migration explicitamente NÃO faz:
--   · NÃO apaga, NÃO renomeia, NÃO dropa nada. Aditiva.
--   · NÃO reescreve nenhuma função que já existe. Em especial, NÃO toca em
--     `admin_definir_status` (a 0004 acabou de reescrevê-la): o slug nasce por
--     TRIGGER em `profiles.status`, e não por uma terceira versão da função.
--   · NÃO obriga `cidade` a estar na lista do IBGE. O texto livre continua
--     aceito; a busca casa cidade por chave normalizada (DL-068). Obrigar hoje
--     quebraria o formulário, que é texto livre.
--   · NÃO corrige dado de usuário, com UMA exceção deliberada: preenche o
--     `slug` (que está nulo) das contas `active`. É o que o R-065 pede.
--   · NÃO cria view nem função de busca: é a S6. E nada daqui lê `perfil_privado`.
--
-- ⚠️  ANTES DE RODAR, NESTA ORDEM (o roteiro completo está no card T-028):
--   1. A 0004 aplicada (o pré-voo 1.1 confere e para se não estiver).
--   2. `supabase/prevoo-0005.sql`, uma consulta por vez.
--   3. `supabase/backup-antes-da-0005.sql`, CSV em `supabase/backups/`.
--   4. Leia a seção 10 (reversão).
--   5. Rode ESTE arquivo INTEIRO, de uma vez. É uma transação só.
--   6. O último comando é um `select` depois do commit: único canal de saída.
--   7. `supabase/seed-0005-cidades-ibge.sql`, inteiro.
--   8. `supabase/verificar-apos-0005.sql`, UMA SONDA POR VEZ.
--
-- ⚠️  NADA AQUI FALA POR `raise notice` (SEC-035).
-- ⚠️  SQL Editor do Supabase: todo marcador de bloco entre cifrões é só letra,
--     sem dígito (ex.: preflight, checks, validar). Marcador com número quebra
--     no editor.
--
-- Escrita em: 23/09/2026 · vetria-backend · NÃO APLICADA em lugar nenhum.
-- Auditoria obrigatória antes de aplicar: vetria-seguranca.
-- ============================================================================


begin;


-- ============================================================================
-- 1. PRÉ-VOO — tudo aqui é leitura de catálogo e termina em `raise exception`
-- ============================================================================

-- 1.1 — ⚠️ A 0004 ESTÁ APLICADA? A T-028 depende dela para aplicar (card).
-- Os 12 CHECKs e as duas funções de leitura do admin são a assinatura dela.
-- Sem a 0004, o slug seria gerado numa aprovação que ainda aceita
-- `incomplete → active` (SEC-096), e o endereço público nasceria para quem
-- nunca passou pela fila.
do $preflight$
declare
  checks_0004 integer;
begin
  select count(*) into checks_0004
  from pg_constraint
  where conrelid in ('public.vet_profiles'::regclass, 'public.clinic_profiles'::regclass)
    and conname in (
      'vet_profiles_crmv_uf_valida', 'vet_profiles_estado_valido',
      'vet_profiles_crmv_formato', 'vet_profiles_titulo_lista',
      'vet_profiles_experiencia_lista', 'vet_profiles_textos_teto',
      'vet_profiles_especialidades_teto',
      'clinic_profiles_estado_valido', 'clinic_profiles_cep_formato',
      'clinic_profiles_textos_teto', 'clinic_profiles_servicos_teto',
      'clinic_profiles_site_http');

  if checks_0004 <> 12 then
    raise exception 'PARE: a 0004 nao esta aplicada neste banco (achei % de 12 CHECKs dela). Aplique a 0004 antes: a 0005 depende dela.', checks_0004;
  end if;

  if (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in ('admin_pode_ver_perfil', 'admin_pode_ver_dossie')) <> 2 then
    raise exception 'PARE: admin_pode_ver_perfil/admin_pode_ver_dossie nao existem. A 0004 nao entrou inteira.';
  end if;

  -- `create or replace trigger` (seções 4 e 5) existe a partir do Postgres 14.
  if current_setting('server_version_num')::int < 140000 then
    raise exception 'PARE: Postgres % e anterior ao 14; esta migration usa create or replace trigger.', current_setting('server_version');
  end if;

  if not exists (select 1 from pg_ts_config where cfgname = 'portuguese') then
    raise exception 'PARE: a configuracao de texto "portuguese" nao existe neste banco. A busca em portugues (secao 6) depende dela.';
  end if;
end
$preflight$;

-- 1.2 — ⚠️ O DONO CONTINUA SEM ESCREVER O PRÓPRIO SLUG (SEC-008)?
-- A regra do DL-067 ("quem gera é o servidor") só vale se as policies da 0002
-- que pinam o slug continuarem lá, e se não houver OUTRA policy de escrita
-- nessas tabelas. Policies permissivas se somam por OU: uma
-- `for update using (id = auth.uid())` criada pelo painel, sem pinar o slug,
-- deixaria o dono escolher o próprio endereço (squatting de nome).
do $preflight$
declare
  sobrando text;
  p record;
  texto text;
begin
  select string_agg(format('%s.%s [cmd=%s]', tablename, policyname, cmd), '; ')
  into sobrando
  from pg_policies
  where schemaname = 'public'
    and tablename in ('vet_profiles', 'clinic_profiles')
    and cmd in ('INSERT', 'UPDATE', 'ALL')
    and policyname not in (
      'vet_profiles_insert_own', 'vet_profiles_update_own', 'vet_profiles_update_admin',
      'clinic_profiles_insert_own', 'clinic_profiles_update_own', 'clinic_profiles_update_admin');

  if sobrando is not null then
    raise exception 'PARE: existe policy de escrita que o repo nao conhece: %. Ela pode deixar o dono escrever o proprio slug. Descubra de quem e antes de seguir.', sobrando;
  end if;

  for p in
    select * from (values
      ('vet_profiles',    'vet_profiles_insert_own'),
      ('vet_profiles',    'vet_profiles_update_own'),
      ('clinic_profiles', 'clinic_profiles_insert_own'),
      ('clinic_profiles', 'clinic_profiles_update_own')
    ) as t(tabela, politica)
  loop
    select pol.with_check into texto
    from pg_policies pol
    where pol.schemaname = 'public' and pol.tablename = p.tabela and pol.policyname = p.politica;

    if texto is null or texto not like '%slug%' then
      raise exception 'PARE: a policy %.% nao pina mais o slug (WITH CHECK = %). O dono poderia escolher o proprio endereco publico. A 0002 a criou pinando; alguem a mudou.', p.tabela, p.politica, coalesce(texto, 'nulo');
    end if;
  end loop;
end
$preflight$;

-- 1.3 — ⚠️ NADA COM OS NOMES QUE ESTA MIGRATION CRIA EXISTE, SALVO ELA MESMA.
-- A migration é idempotente (rodar de novo não estraga), então objeto com o
-- nome certo e a assinatura desta migration é aceito. Objeto com o mesmo nome
-- e OUTRA origem (criado pelo painel, R-006) para tudo: `create table if not
-- exists` pularia uma tabela alheia em silêncio, e `create or replace
-- function` apagaria uma função alheia.
do $preflight$
declare
  f record;
  t record;
  colunas text;
begin
  -- funções: as desta migration levam comentário começando com '0005 / T-028'
  for f in
    select p.oid::regprocedure::text as assinatura,
           coalesce(obj_description(p.oid, 'pg_proc'), '') as comentario
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('sem_acento', 'chave_de_nome', 'slugificar', 'slug_truncado',
                        'juntar_textos', 'conferir_itens_de_lista',
                        'gerar_slug_do_perfil', 'slug_ao_ativar')
  loop
    if f.comentario not like '0005 / T-028%' then
      raise exception 'PARE: a funcao % ja existe e nao e desta migration (comentario: "%"). Criada fora do repo? Descubra antes de seguir.', f.assinatura, f.comentario;
    end if;
  end loop;

  -- tabelas: se existirem, tem que ser com as colunas desta migration
  for t in
    select * from (values
      ('especialidades', 'nome,ordem,slug'),
      ('servicos',       'nome,ordem,slug'),
      ('cidades',        'chave,codigo_ibge,nome,slug,uf')
    ) as x(tabela, esperado)
  loop
    select string_agg(column_name::text, ',' order by column_name) into colunas
    from information_schema.columns
    where table_schema = 'public' and table_name = t.tabela;

    if colunas is not null and colunas <> t.esperado then
      raise exception 'PARE: a tabela public.% ja existe com outras colunas (%). Esperado: %. Nao e desta migration.', t.tabela, colunas, t.esperado;
    end if;
  end loop;

  -- a coluna `busca`, se existir, tem que ser a gerada desta migration
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name in ('vet_profiles', 'clinic_profiles')
               and column_name = 'busca' and is_generated <> 'ALWAYS') then
    raise exception 'PARE: existe uma coluna "busca" comum (nao gerada) em vet_profiles ou clinic_profiles. Nao e desta migration.';
  end if;
end
$preflight$;


-- ============================================================================
-- 2. FUNÇÕES DE TEXTO (puras, IMMUTABLE)
-- ============================================================================
-- Uma regra de normalização, escrita UMA vez, usada pelo slug, pela chave de
-- cidade, pela busca e pelo gerador do seed (`supabase/gerar-seed-cidades.mjs`
-- tem a cópia em JS dos dois mapas de acento; mudou aqui, muda lá).
--
-- Por que não a extensão `unaccent`: a função dela não é IMMUTABLE, e coluna
-- gerada e índice por expressão exigem IMMUTABLE. O contorno de mercado é um
-- invólucro "mentindo" a volatilidade; `translate` com os mapas explícitos é
-- IMMUTABLE de verdade, e cobre todos os 5571 nomes de município do IBGE (o
-- gerador confere, letra por letra).
--
-- O acento sai ANTES do `lower`: `lower` de letra não ASCII depende da
-- collation do banco, e o de ASCII não.
--
-- ⚠️ SEC-014: estas funções NÃO têm EXECUTE revogado, e é de propósito. A
-- busca anônima da S6 vai chamá-las (normalizar o termo, casar a cidade), e
-- os índices da seção 6 as usam. Elas não leem tabela nenhuma: não há o que
-- proteger, e revogar desligaria a busca pública em silêncio.
--
-- ⚠️ `set search_path = public` em todas (regra da casa, DL-015), mesmo sem
-- lerem tabela.

create or replace function public.sem_acento(p_texto text)
returns text
language sql immutable strict parallel safe
set search_path = public
as $$
  select lower(translate(p_texto,
    'ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñÝýÿ',
    'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnYyy'));
$$;

-- "São João d'Aliança" → "saojoaodalianca". É o que casa a cidade digitada
-- ("Sao Joao D Alianca") com a cidade da lista.
create or replace function public.chave_de_nome(p_texto text)
returns text
language sql immutable strict parallel safe
set search_path = public
as $$
  select regexp_replace(public.sem_acento(p_texto), '[^a-z0-9]+', '', 'g');
$$;

-- "Clínica Geral & Cia." → "clinica-geral-cia". Só [a-z0-9] e hífen simples.
create or replace function public.slugificar(p_texto text)
returns text
language sql immutable strict parallel safe
set search_path = public
as $$
  select btrim(regexp_replace(public.sem_acento(p_texto), '[^a-z0-9]+', '-', 'g'), '-');
$$;

-- Corta um slug em no máximo `p_max` caracteres, na fronteira de palavra
-- quando dá ("ana-maria-souza", 12 → "ana-maria"), e no caractere quando a
-- primeira palavra sozinha já passa do teto.
create or replace function public.slug_truncado(p_slug text, p_max integer)
returns text
language sql immutable strict parallel safe
set search_path = public
as $$
  select case
    when char_length(p_slug) <= p_max then p_slug
    else coalesce(
      nullif(btrim(
        case when position('-' in left(p_slug, p_max + 1)) > 0
             then regexp_replace(left(p_slug, p_max + 1), '-[^-]*$', '')
             else '' end,
        '-'), ''),
      btrim(left(p_slug, p_max), '-'))
  end;
$$;

-- `array_to_string` não é garantidamente IMMUTABLE; para `text[]` é. A coluna
-- gerada da seção 6 precisa da garantia.
create or replace function public.juntar_textos(p_itens text[])
returns text
language sql immutable parallel safe
set search_path = public
as $$
  select coalesce(array_to_string(p_itens, ' '), '');
$$;

comment on function public.sem_acento(text) is
  '0005 / T-028: minúsculas sem acento. Mapas espelhados em supabase/gerar-seed-cidades.mjs. Mudar o corpo NÃO recalcula as colunas geradas: exige recriá-las.';
comment on function public.chave_de_nome(text) is
  '0005 / T-028: só [a-z0-9]. Casa cidade digitada com public.cidades.chave (DL-068).';
comment on function public.slugificar(text) is
  '0005 / T-028: [a-z0-9] com hífen simples. Base do slug (DL-067).';
comment on function public.slug_truncado(text, integer) is
  '0005 / T-028: corta o slug na fronteira de palavra.';
comment on function public.juntar_textos(text[]) is
  '0005 / T-028: array_to_string IMMUTABLE para a coluna gerada busca.';


-- ============================================================================
-- 3. AS TABELAS DE APOIO: leitura pública, escrita só por migration
-- ============================================================================
-- `especialidades.nome` e `servicos.nome` são EXATAMENTE o texto que o
-- formulário grava hoje em `vet_profiles.especialidades` e
-- `clinic_profiles.servicos` ("Clínica geral", "Banho & tosa"). A tabela
-- adota o dado que já existe, em vez de pedir uma migração de dado: nenhuma
-- linha de perfil muda. O `slug` é para a URL da busca (`?especialidade=
-- clinica-geral`), e o `ordem` é a ordem em que a tela mostra.
--
-- ⚠️ O SEED É CÓPIA DE `ESPECIALIDADES` e `SERVICOS` dos `campos.ts`, na mesma
-- ordem. Acrescentar item = migration nova (🔴) + a linha no `campos.ts`, no
-- mesmo commit. Se só o `campos.ts` crescer, a pessoa escolhe o item novo e o
-- banco recusa (23514, seção 4).
--
-- `cidades` é a lista oficial do IBGE (5571 municípios em 23/09/2026), com o
-- código IBGE como chave. `chave` e `slug` são GERADOS: ninguém os escreve, e
-- eles não divergem do nome.

create table if not exists public.especialidades (
  nome   text     primary key,
  slug   text     not null,
  ordem  smallint not null,
  constraint especialidades_slug_unico   unique (slug),
  constraint especialidades_nome_teto    check (char_length(nome) between 1 and 60),
  constraint especialidades_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60)
);

create table if not exists public.servicos (
  nome   text     primary key,
  slug   text     not null,
  ordem  smallint not null,
  constraint servicos_slug_unico   unique (slug),
  constraint servicos_nome_teto    check (char_length(nome) between 1 and 60),
  constraint servicos_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60)
);

create table if not exists public.cidades (
  codigo_ibge integer primary key,
  nome        text    not null,
  uf          text    not null,
  chave       text    generated always as (public.chave_de_nome(nome)) stored,
  slug        text    generated always as (public.slugificar(nome) || '-' || lower(uf)) stored,
  constraint cidades_codigo_ibge_formato check (codigo_ibge between 1000000 and 9999999),
  constraint cidades_nome_teto           check (char_length(nome) between 1 and 80),
  constraint cidades_uf_valida           check (uf in (
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
    'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')),
  -- o gerador do seed confere que nenhum par (UF, chave) se repete no IBGE
  constraint cidades_uf_chave_unica      unique (uf, chave),
  constraint cidades_slug_unico          unique (slug)
);

comment on table public.especialidades is
  '0005 / T-028: lista fechada de especialidades. nome = o texto gravado em vet_profiles.especialidades. Espelho: ESPECIALIDADES em app/app/veterinario/onboarding/campos.ts.';
comment on table public.servicos is
  '0005 / T-028: lista fechada de serviços. nome = o texto gravado em clinic_profiles.servicos. Espelho: SERVICOS em app/app/estabelecimento/onboarding/campos.ts.';
comment on table public.cidades is
  '0005 / T-028: municípios do IBGE. Seed: supabase/seed-0005-cidades-ibge.sql, gerado por supabase/gerar-seed-cidades.mjs.';

-- RLS ligada nas três, com UMA policy: leitura para todo mundo. Nenhuma policy
-- de escrita = nenhuma escrita por anon ou authenticated. E, como segunda
-- porta, o GRANT de escrita sai (o Supabase concede tudo por default
-- privileges).
alter table public.especialidades enable row level security;
alter table public.servicos       enable row level security;
alter table public.cidades        enable row level security;

do $politicas$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'especialidades' and policyname = 'especialidades_select_publico') then
    create policy especialidades_select_publico on public.especialidades
      for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'servicos' and policyname = 'servicos_select_publico') then
    create policy servicos_select_publico on public.servicos
      for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'cidades' and policyname = 'cidades_select_publico') then
    create policy cidades_select_publico on public.cidades
      for select to anon, authenticated using (true);
  end if;
end
$politicas$;

revoke insert, update, delete, truncate, references, trigger on public.especialidades from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.servicos       from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.cidades        from anon, authenticated;
grant select on public.especialidades to anon, authenticated;
grant select on public.servicos       to anon, authenticated;
grant select on public.cidades        to anon, authenticated;

-- O seed. `on conflict do nothing`: rodar de novo não duplica nem sobrescreve.
insert into public.especialidades (nome, slug, ordem)
select nome, public.slugificar(nome), ordem
from (values
  ('Clínica geral', 1), ('Cardiologia', 2), ('Dermatologia', 3), ('Oftalmologia', 4),
  ('Ortopedia', 5), ('Cirurgia', 6), ('Anestesiologia', 7), ('Oncologia', 8),
  ('Animais exóticos', 9), ('Felinos', 10), ('Equinos', 11), ('Comportamento', 12)
) as s(nome, ordem)
on conflict (nome) do nothing;

insert into public.servicos (nome, slug, ordem)
select nome, public.slugificar(nome), ordem
from (values
  ('Emergência 24h', 1), ('Internação', 2), ('Centro cirúrgico', 3), ('Laboratório', 4),
  ('Diagnóstico por imagem', 5), ('Vacinação', 6), ('Banho & tosa', 7), ('Pet shop', 8),
  ('Farmácia', 9)
) as s(nome, ordem)
on conflict (nome) do nothing;


-- ============================================================================
-- 4. A PERTENÇA À LISTA (o que a 0004 deixou para cá, DL-062 item 5)
-- ============================================================================
-- Por que TRIGGER e não CHECK: CHECK não pode consultar outra tabela, e o
-- Postgres não tem chave estrangeira em elemento de array. A alternativa
-- "escrever a lista no CHECK" é a segunda cópia que o DL-062 proibiu.
--
-- A regra: todo item de `especialidades`/`servicos` existe na tabela, nenhum
-- é nulo e nenhum se repete. Recusa com 23514 e o nome
-- `*_da_lista` no campo `constraint` do erro, o mesmo código de CHECK que as
-- Actions já traduzem (T-027).
--
-- QUANDO confere: em todo INSERT, e em UPDATE só quando a lista MUDOU. Assim
-- uma linha antiga fora da lista (o pré-voo diz se existe; o esperado é zero,
-- porque as Actions sempre conferiram contra a mesma lista) não impede a dona
-- de salvar o bairro: é a mesma semântica do `NOT VALID` da 0004, sem travar
-- o que não mudou. A sonda 4 do verificar lista essas linhas, se houver.
--
-- SECURITY DEFINER + search_path: roda como o dono, e lê a lista mesmo que um
-- dia a leitura pública dela mude. Não lê nada além das duas tabelas de apoio.
create or replace function public.conferir_itens_de_lista()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  itens      text[];
  fora       text;
  restricao  text;
begin
  if tg_table_name = 'vet_profiles' then
    itens := new.especialidades;
    if tg_op = 'UPDATE' and itens is not distinct from old.especialidades then
      return new;
    end if;
    restricao := 'vet_profiles_especialidades_da_lista';
    select string_agg(coalesce(quote_literal(i), 'NULL'), ', ') into fora
    from unnest(itens) as i
    where i is null or not exists (select 1 from public.especialidades e where e.nome = i);

  elsif tg_table_name = 'clinic_profiles' then
    itens := new.servicos;
    if tg_op = 'UPDATE' and itens is not distinct from old.servicos then
      return new;
    end if;
    restricao := 'clinic_profiles_servicos_da_lista';
    select string_agg(coalesce(quote_literal(i), 'NULL'), ', ') into fora
    from unnest(itens) as i
    where i is null or not exists (select 1 from public.servicos s where s.nome = i);

  else
    return new;
  end if;

  if fora is not null then
    raise exception 'item fora da lista: %', fora
      using errcode = '23514', constraint = restricao, table = tg_table_name;
  end if;

  if cardinality(itens) <> (select count(distinct i) from unnest(itens) as i) then
    raise exception 'item repetido na lista'
      using errcode = '23514', constraint = restricao, table = tg_table_name;
  end if;

  return new;
end;
$$;

comment on function public.conferir_itens_de_lista() is
  '0005 / T-028: pertença de especialidades/servicos às tabelas de apoio (DL-062 item 5, DL-068). 23514.';

create or replace trigger trg_vet_profiles_especialidades_da_lista
  before insert or update of especialidades on public.vet_profiles
  for each row execute function public.conferir_itens_de_lista();

create or replace trigger trg_clinic_profiles_servicos_da_lista
  before insert or update of servicos on public.clinic_profiles
  for each row execute function public.conferir_itens_de_lista();


-- ============================================================================
-- 5. O SLUG (DL-067, R-065)
-- ============================================================================
-- A regra, inteira no DL-067. Em resumo:
--   · formato `<nome>-<cidade>-<uf>`, só [a-z0-9] e hífen, até 120 caracteres
--     (nome até 60, cidade até 40, cortados na fronteira de palavra);
--   · colisão: sufixo `-2`, `-3`, ... por ordem de chegada;
--   · quem gera: o SERVIDOR, quando a conta vira `active`. O dono continua sem
--     escrever o próprio slug (SEC-008, conferido no pré-voo 1.2);
--   · ESTÁVEL: gerado uma vez e nunca trocado sozinho. Mudar o nome não muda o
--     endereço (link compartilhado e Google continuam valendo). Trocar é gesto
--     manual do master, e o link antigo deixa de existir (DL-067).

-- 5.1 — o formato, no banco. A coluna vai para a URL: nada de barra, ponto,
-- espaço, maiúscula nem `..`. NOT VALID + validação na seção 8 (hoje todos os
-- slugs são nulos, então valida limpo).
do $checks$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.vet_profiles'::regclass and conname = 'vet_profiles_slug_formato') then
    alter table public.vet_profiles add constraint vet_profiles_slug_formato
      check (slug is null or (char_length(slug) <= 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'))
      not valid;
  end if;
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.clinic_profiles'::regclass and conname = 'clinic_profiles_slug_formato') then
    alter table public.clinic_profiles add constraint clinic_profiles_slug_formato
      check (slug is null or (char_length(slug) <= 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'))
      not valid;
  end if;
end
$checks$;

-- 5.2 — gera o slug de UMA conta, se ela ainda não tiver. Devolve o slug (o
-- novo, ou o que já existia), ou nulo se a conta não tem linha de perfil.
--
-- A trava `pg_advisory_xact_lock` por tabela serializa a escolha do sufixo:
-- duas aprovações ao mesmo tempo, de duas "Ana Souza" de Goiânia, não
-- escolhem as duas "ana-souza-goiania-go". Dura até o fim da transação da
-- aprovação, que é curta.
--
-- ⚠️ NÃO é chamável por RPC (EXECUTE revogado abaixo). Só o trigger 5.3 e o
-- preenchimento 5.4 a chamam, os dois como o dono do banco.
create or replace function public.gerar_slug_do_perfil(p_id uuid, p_role public.user_role)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_atual     text;
  v_nome      text;
  v_cidade    text;
  v_uf        text;
  parte_nome  text;
  parte_local text;
  base        text;
  candidato   text;
  n           integer := 1;
begin
  if p_role = 'vet' then
    select v.slug, v.nome_exibicao, v.cidade, v.estado
      into v_atual, v_nome, v_cidade, v_uf
    from public.vet_profiles v where v.id = p_id
    for update;
  elsif p_role = 'clinic' then
    select c.slug, c.nome_fantasia, c.cidade, c.estado
      into v_atual, v_nome, v_cidade, v_uf
    from public.clinic_profiles c where c.id = p_id
    for update;
  else
    return null;
  end if;

  if not found then
    return null;
  end if;

  -- ESTÁVEL: quem já tem, fica com o que tem (DL-067).
  if v_atual is not null then
    return v_atual;
  end if;

  parte_nome := public.slug_truncado(coalesce(public.slugificar(v_nome), ''), 60);
  if parte_nome = '' then
    parte_nome := case p_role when 'vet' then 'veterinario' else 'estabelecimento' end;
  end if;
  parte_local := public.slug_truncado(coalesce(public.slugificar(v_cidade), ''), 40);

  base := parte_nome
       || case when parte_local <> '' then '-' || parte_local else '' end
       || case when v_uf ~ '^[A-Z]{2}$' then '-' || lower(v_uf) else '' end;

  perform pg_advisory_xact_lock(hashtext('vetria.slug.' || p_role::text));

  candidato := base;
  loop
    if p_role = 'vet' then
      exit when not exists (select 1 from public.vet_profiles where slug = candidato);
    else
      exit when not exists (select 1 from public.clinic_profiles where slug = candidato);
    end if;
    n := n + 1;
    candidato := base || '-' || n;
  end loop;

  if p_role = 'vet' then
    update public.vet_profiles set slug = candidato where id = p_id and slug is null;
  else
    update public.clinic_profiles set slug = candidato where id = p_id and slug is null;
  end if;

  return candidato;
end;
$$;

comment on function public.gerar_slug_do_perfil(uuid, public.user_role) is
  '0005 / T-028: gera o slug (DL-067) se a conta ainda não tem. Estável. Sem EXECUTE para anon/authenticated.';

revoke execute on function public.gerar_slug_do_perfil(uuid, public.user_role) from public, anon, authenticated;

-- 5.3 — o gatilho: a conta vet/clinic PASSOU a `active`. Cobre a aprovação
-- (`pending_validation → active`) e a reativação pelo master
-- (`suspended → active`), e qualquer caminho futuro para `active`, sem
-- reescrever `admin_definir_status` (a 0004 acabou de reescrevê-la; uma
-- terceira versão seria a segunda migration desfazendo a primeira).
--
-- Roda DENTRO da transação da aprovação: se o slug não puder ser gerado, a
-- aprovação falha e o admin vê o erro, em vez de a conta ir ao ar sem
-- endereço (que é o R-065 de novo).
create or replace function public.slug_ao_ativar()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.role in ('vet', 'clinic') then
    perform public.gerar_slug_do_perfil(new.id, new.role);
  end if;
  return null;
end;
$$;

comment on function public.slug_ao_ativar() is
  '0005 / T-028: trigger de profiles. Conta vet/clinic que vira active ganha slug (DL-067).';

create or replace trigger trg_profiles_slug_ao_ativar
  after update of status on public.profiles
  for each row
  when (new.status = 'active' and old.status is distinct from new.status)
  execute function public.slug_ao_ativar();

-- 5.4 — ⚠️ R-065: E O QUE JÁ ESTÁ GRAVADO? As contas que já são `active` hoje
-- ganham o slug agora, da mais antiga para a mais nova (a primeira fica com o
-- endereço sem sufixo). Único dado de usuário que esta migration escreve.
-- Efeito colateral conhecido: o `updated_at` dessas linhas vira a hora da
-- migration (trigger da 0002). Nenhuma revalidação dispara: o slug não é
-- dado vigiado pelo `revalidar_ao_mudar_dado_sensivel`.
do $preencher$
declare
  r record;
begin
  for r in
    select p.id, p.role
    from public.profiles p
    where p.role in ('vet', 'clinic') and p.status = 'active'
    order by p.created_at, p.id
  loop
    perform public.gerar_slug_do_perfil(r.id, r.role);
  end loop;
end
$preencher$;


-- ============================================================================
-- 6. A BUSCA: full-text em português e os índices dos três filtros (F4/S6)
-- ============================================================================
-- ⚠️ ÍNDICE NÃO É FILTRO. Quem decide quem aparece continua sendo a policy
-- `*_select_publico` (`perfil_esta_ativo(id, role)`: role certo E `active`),
-- intocada aqui. A sonda 5 do verificar prova que a coluna nova não abriu
-- ninguém.
--
-- 6.1 — `busca`: tsvector GERADO (ninguém escreve; muda sozinho quando o
-- texto muda), com peso: nome (A) > especialidades/serviços (B) > cidade e
-- bairro (C) > bio/sobre (D). Sem acento dos dois lados: a S6 normaliza o
-- termo com `public.sem_acento()` antes do `plainto_tsquery('portuguese', ...)`,
-- e "clinica" acha "Clínica".
--
-- ⚠️ SÓ COLUNA PÚBLICA ENTRA AQUI. Nada de `perfil_privado`, e o `endereco` do
-- estabelecimento fica de fora enquanto o R-032 (endereço público) não tiver
-- decisão. A coluna é legível por `anon` junto com a linha, então tudo o que
-- entra nela é tão público quanto a linha.
alter table public.vet_profiles add column if not exists busca tsvector
  generated always as (
       setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(coalesce(nome_exibicao, ''))), 'A')
    || setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(public.juntar_textos(especialidades))), 'B')
    || setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(coalesce(cidade, '') || ' ' || coalesce(bairro, ''))), 'C')
    || setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(coalesce(bio, ''))), 'D')
  ) stored;

alter table public.clinic_profiles add column if not exists busca tsvector
  generated always as (
       setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(coalesce(nome_fantasia, ''))), 'A')
    || setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(public.juntar_textos(servicos))), 'B')
    || setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(coalesce(cidade, ''))), 'C')
    || setweight(to_tsvector('portuguese'::regconfig, public.sem_acento(coalesce(sobre, ''))), 'D')
  ) stored;

comment on column public.vet_profiles.busca is
  '0005 / T-028: full-text em português, gerado. Só colunas públicas. Consultar com plainto_tsquery(''portuguese'', sem_acento(termo)).';
comment on column public.clinic_profiles.busca is
  '0005 / T-028: full-text em português, gerado. Só colunas públicas (sem endereco: R-032). Consultar com plainto_tsquery(''portuguese'', sem_acento(termo)).';

-- 6.2 — os índices dos três filtros da F4 (E4: cidade + especialidade + tipo
-- de atendimento):
--   · texto livre           → GIN em `busca`
--   · cidade                → (estado, chave_de_nome(cidade)): a S6 recebe a
--                             cidade escolhida da lista (`cidades.slug`) e casa
--                             por `uf` + `chave`, que é como o texto livre
--                             gravado ("Goiania", "goiânia ") encontra
--                             "Goiânia" (DL-068)
--   · especialidade/serviço → GIN em `especialidades` e `servicos`: JÁ EXISTEM
--                             desde a 0002 (`idx_vet_profiles_especialidades`,
--                             `idx_clinic_profiles_servicos`), para `@>`
--   · tipo de atendimento   → os três booleanos de `vet_profiles`. SEM índice
--                             de propósito: coluna de dois valores não
--                             seleciona nada sozinha; o plano usa o índice de
--                             cidade e filtra o resto. Rever quando doer.
--   · autocompletar cidade  → `cidades.chave` com `text_pattern_ops`, para
--                             `chave like 'goian%'`
create index if not exists idx_vet_profiles_busca    on public.vet_profiles    using gin (busca);
create index if not exists idx_clinic_profiles_busca on public.clinic_profiles using gin (busca);
create index if not exists idx_vet_profiles_local    on public.vet_profiles    (estado, (public.chave_de_nome(cidade)));
create index if not exists idx_clinic_profiles_local on public.clinic_profiles (estado, (public.chave_de_nome(cidade)));
create index if not exists idx_cidades_chave_prefixo on public.cidades         (chave text_pattern_ops);


-- ============================================================================
-- 7. AVISAR O PostgREST (SEC-038). Entregue no commit.
-- ============================================================================
notify pgrst, 'reload schema';


-- ============================================================================
-- 8. VALIDAR O QUE ESTÁ LIMPO — roda de novo sozinha, como a da 0004
-- ============================================================================
-- Os dois CHECKs de formato do slug. Hoje todo slug é nulo ou foi gerado pela
-- seção 5, então os dois têm que validar. Se algum ficar NOT VALID, existe um
-- slug gravado fora da migration (R-006): o select final mostra.
do $validar$
declare
  c record;
begin
  for c in
    select con.conrelid::regclass::text as tabela, con.conname
    from pg_constraint con
    where con.conname in ('vet_profiles_slug_formato', 'clinic_profiles_slug_formato')
      and con.conrelid in ('public.vet_profiles'::regclass, 'public.clinic_profiles'::regclass)
      and not con.convalidated
  loop
    begin
      execute format('alter table %s validate constraint %I', c.tabela, c.conname);
    exception
      when check_violation then
        null;  -- fica NOT VALID; o select final mostra
    end;
  end loop;
end
$validar$;


commit;


-- ============================================================================
-- 9. O RESULTADO, NA TELA (SEC-035) — leitura pura, depois do commit
-- ============================================================================
-- Esperado: TODA linha com `ok_TEM_QUE_SER_true` = true. A linha 30 (cidades)
-- vem com 0 municípios até o seed rodar, e isso NÃO é falha aqui: ela diz o que
-- fazer.
select * from (
  select 1 as ordem, format('tabela %s existe com RLS ligada', c.relname) as item,
         c.relrowsecurity as ok_TEM_QUE_SER_true,
         case when c.relrowsecurity then 'RLS ligada' else 'SEM RLS: vazamento' end as leitura
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('especialidades', 'servicos', 'cidades')

  union all
  select 2, format('tabela %s: so a policy de leitura publica', t.tabela),
         (select count(*) = 1 and bool_and(pol.cmd = 'SELECT' and pol.qual = 'true')
            from pg_policies pol where pol.schemaname = 'public' and pol.tablename = t.tabela),
         (select string_agg(pol.policyname || ' [' || pol.cmd || ']', ', ')
            from pg_policies pol where pol.schemaname = 'public' and pol.tablename = t.tabela)
  from (values ('especialidades'), ('servicos'), ('cidades')) as t(tabela)

  union all
  select 3, format('tabela %s: anon e authenticated leem e NAO escrevem', t.tabela),
         has_table_privilege('anon', 'public.' || t.tabela, 'SELECT')
         and has_table_privilege('authenticated', 'public.' || t.tabela, 'SELECT')
         and not has_table_privilege('anon', 'public.' || t.tabela, 'INSERT,UPDATE,DELETE,TRUNCATE')
         and not has_table_privilege('authenticated', 'public.' || t.tabela, 'INSERT,UPDATE,DELETE,TRUNCATE'),
         'se false: grant de escrita sobrando, ou leitura faltando (a busca anonima quebra)'
  from (values ('especialidades'), ('servicos'), ('cidades')) as t(tabela)

  union all
  select 10, 'seed: especialidades = a lista do campos.ts, na ordem',
         (select array_agg(nome order by ordem) from public.especialidades)
           = array['Clínica geral','Cardiologia','Dermatologia','Oftalmologia','Ortopedia',
                   'Cirurgia','Anestesiologia','Oncologia','Animais exóticos','Felinos',
                   'Equinos','Comportamento'],
         (select count(*)::text || ' itens' from public.especialidades)
  union all
  select 11, 'seed: servicos = a lista do campos.ts, na ordem',
         (select array_agg(nome order by ordem) from public.servicos)
           = array['Emergência 24h','Internação','Centro cirúrgico','Laboratório',
                   'Diagnóstico por imagem','Vacinação','Banho & tosa','Pet shop','Farmácia'],
         (select count(*)::text || ' itens' from public.servicos)

  union all
  select 20, format('funcao %s: SECURITY DEFINER + search_path=public', p.proname),
         p.prosecdef and coalesce(p.proconfig, '{}'::text[]) && array['search_path=public'],
         coalesce(array_to_string(p.proconfig, ','), 'SEM search_path')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('conferir_itens_de_lista', 'gerar_slug_do_perfil', 'slug_ao_ativar')
  union all
  select 21, format('funcao %s: IMMUTABLE + search_path=public', p.proname),
         p.provolatile = 'i' and coalesce(p.proconfig, '{}'::text[]) && array['search_path=public'],
         p.provolatile::text
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('sem_acento', 'chave_de_nome', 'slugificar', 'slug_truncado', 'juntar_textos')
  union all
  select 22, 'anon e authenticated NAO executam gerar_slug_do_perfil',
         not has_function_privilege('anon', 'public.gerar_slug_do_perfil(uuid, public.user_role)', 'EXECUTE')
         and not has_function_privilege('authenticated', 'public.gerar_slug_do_perfil(uuid, public.user_role)', 'EXECUTE'),
         'se false: qualquer um geraria slug de qualquer conta por RPC'
  union all
  select 23, 'anon EXECUTA sem_acento e chave_de_nome (SEC-014: a busca anonima usa)',
         has_function_privilege('anon', 'public.sem_acento(text)', 'EXECUTE')
         and has_function_privilege('anon', 'public.chave_de_nome(text)', 'EXECUTE'),
         'se false: a busca publica da S6 quebra para quem nao esta logado'
  union all
  select 24, 'normalizacao: amostras',
         public.slugificar('Clínica Geral & Cia.') = 'clinica-geral-cia'
         and public.chave_de_nome('São João d''Aliança') = 'saojoaodalianca'
         and public.slug_truncado('ana-maria-souza', 12) = 'ana-maria'
         and public.slug_truncado('abcdefghij', 5) = 'abcde',
         public.slugificar('Clínica Geral & Cia.') || ' | ' || public.chave_de_nome('São João d''Aliança')

  union all
  select 25, format('trigger %s', t.tgname), not t.tgisinternal and t.tgenabled <> 'D',
         t.tgrelid::regclass::text
  from pg_trigger t
  where t.tgname in ('trg_vet_profiles_especialidades_da_lista',
                     'trg_clinic_profiles_servicos_da_lista',
                     'trg_profiles_slug_ao_ativar')

  union all
  select 26, format('CHECK %s.%s', con.conrelid::regclass, con.conname), con.convalidated,
         case when con.convalidated then 'validada' else 'NOT VALID: existe slug fora do formato gravado fora da migration' end
  from pg_constraint con
  where con.conname in ('vet_profiles_slug_formato', 'clinic_profiles_slug_formato')

  union all
  select 27, 'R-065: nenhuma conta active (com perfil) sem slug',
         not exists (
           select 1 from public.profiles p
           left join public.vet_profiles v on v.id = p.id
           left join public.clinic_profiles c on c.id = p.id
           where p.status = 'active'
             and ((p.role = 'vet' and v.id is not null and v.slug is null)
               or (p.role = 'clinic' and c.id is not null and c.slug is null))),
         (select count(*)::text || ' contas vet/clinic active; '
                 || (select count(*) from public.vet_profiles where slug is not null)::text || ' vet com slug; '
                 || (select count(*) from public.clinic_profiles where slug is not null)::text || ' clinic com slug'
            from public.profiles where role in ('vet','clinic') and status = 'active')

  union all
  select 28, format('coluna %s.busca gerada', col.table_name), col.is_generated = 'ALWAYS',
         col.data_type::text
  from information_schema.columns col
  where col.table_schema = 'public' and col.table_name in ('vet_profiles', 'clinic_profiles')
    and col.column_name = 'busca'
  union all
  select 29, format('indice %s', i.indexname), true, i.tablename::text
  from pg_indexes i
  where i.schemaname = 'public'
    and i.indexname in ('idx_vet_profiles_busca', 'idx_clinic_profiles_busca',
                        'idx_vet_profiles_local', 'idx_clinic_profiles_local',
                        'idx_cidades_chave_prefixo')

  union all
  select 30, 'cidades: rode agora o seed-0005-cidades-ibge.sql', true,
         (select count(*)::text || ' municipios carregados (esperado 5571 depois do seed)' from public.cidades)
) resultado
order by ordem, item;


-- ============================================================================
-- 10. PROCEDIMENTO DE REVERSÃO
-- ============================================================================
-- A ORDEM IMPORTA: índices e colunas geradas dependem das funções de texto, e
-- os triggers dependem das funções de trigger. Primeiro o que depende, depois
-- aquilo de que depende. Só aqui aparece `drop`, e é reversão, não migration.
--
-- O que NÃO volta sozinho, e não precisa: o `slug` preenchido pela seção 5.4
-- nas contas `active`. Ele é inofensivo sem a página pública. Se for preciso
-- zerar, a consulta 1 e a 2 do `backup-antes-da-0005.sql` listam quem tinha
-- slug nulo antes: `update ... set slug = null where id in (...)`.
--
-- begin;
--   drop trigger if exists trg_profiles_slug_ao_ativar             on public.profiles;
--   drop trigger if exists trg_vet_profiles_especialidades_da_lista on public.vet_profiles;
--   drop trigger if exists trg_clinic_profiles_servicos_da_lista    on public.clinic_profiles;
--   drop function if exists public.slug_ao_ativar();
--   drop function if exists public.gerar_slug_do_perfil(uuid, public.user_role);
--   drop function if exists public.conferir_itens_de_lista();
--
--   drop index if exists public.idx_vet_profiles_busca;
--   drop index if exists public.idx_clinic_profiles_busca;
--   drop index if exists public.idx_vet_profiles_local;
--   drop index if exists public.idx_clinic_profiles_local;
--   drop index if exists public.idx_cidades_chave_prefixo;
--   alter table public.vet_profiles    drop column if exists busca;
--   alter table public.clinic_profiles drop column if exists busca;
--   alter table public.vet_profiles    drop constraint if exists vet_profiles_slug_formato;
--   alter table public.clinic_profiles drop constraint if exists clinic_profiles_slug_formato;
--
--   drop table if exists public.cidades;
--   drop table if exists public.servicos;
--   drop table if exists public.especialidades;
--
--   drop function if exists public.juntar_textos(text[]);
--   drop function if exists public.slug_truncado(text, integer);
--   drop function if exists public.slugificar(text);
--   drop function if exists public.chave_de_nome(text);
--   drop function if exists public.sem_acento(text);
--
--   notify pgrst, 'reload schema';
-- commit;
--
-- ⚠️ E O CÓDIGO: a 0005 não exigiu mudança de código para entrar, e reverter
-- também não exige. As Actions de onboarding já conferem as mesmas listas
-- (campos.ts) antes de gravar.


-- ============================================================================
-- 11. VERIFICAÇÃO PÓS-APLICAÇÃO
-- ============================================================================
-- Em arquivo separado: `supabase/verificar-apos-0005.sql`, UMA SONDA POR VEZ,
-- depois do seed de cidades.
