-- ============================================================================
-- 0006 — O CONTATO REGISTRADO (DL-047) E O ENDEREÇO PÚBLICO PROTEGIDO
--
-- O que faz, em uma frase: dá ao servidor UMA porta estreita para registrar o
-- clique em "Chamar no WhatsApp" e devolver o número na mesma transação, fecha
-- a leitura de `anon_id`/`user_id` de `contatos` para quem está logado, e
-- impede que alguém além do gerador e do master troque o `slug`.
--
-- Card: T-039 · Decisões: D1, D3, D5, D6, D10 e D11 da S8, aprovadas pelo
-- Elber em 25/09/2026 exatamente como recomendadas · Fecha: R-074, R-076,
-- R-069 (SEC-115), R-070 (SEC-116)
--
-- O que entra, seção por seção:
--   §2  `contatos`: coluna `anonimizado_em`, trigger que anonimiza a linha
--       quando a conta de quem clicou é excluída (D11), e o CHECK de origem
--       passa a aceitar linha anonimizada (R-076)
--   §3  `contatos`: privilégio POR COLUNA. `authenticated` lê só as colunas
--       das telas; `anon_id` e `user_id` ficam fora do PostgREST (R-074, D6)
--   §4  índices dos limites por visitante (D3)
--   §5  `registrar_contato(...)`: resolve o slug, exige `active`, deduplica
--       (D5), aplica os limites (D3), lê o WhatsApp de `perfil_privado`, grava
--       a linha e SÓ ENTÃO devolve o número. EXECUTE só para `service_role` (D1)
--   §6  `vincular_contatos_do_visitante(...)`: na criação de conta de
--       responsável, os contatos anônimos dos últimos 30 dias daquele
--       navegador passam para a conta (D10). EXECUTE só para `service_role`
--   §7  o slug: trigger que recusa mudança fora do gerador e do master
--       (SEC-115), e a aprovação sem linha de perfil passa a FALHAR em vez de
--       ir ao ar sem endereço (SEC-116)
--
-- O que esta migration explicitamente NÃO faz:
--   · NÃO apaga linha, NÃO renomeia coluna, NÃO dropa tabela nem função.
--     ⚠️ UMA exceção, deliberada e pedida pelo card (R-076, D11): o CHECK
--     `contatos_tem_origem` da 0002 é trocado por `contatos_tem_origem_ou_
--     anonimizado`. Postgres não altera expressão de CHECK no lugar: trocar é
--     `drop constraint` + `add constraint`, na mesma transação. A regra nova é
--     MAIS FRACA só para a linha anonimizada; linha nova continua precisando
--     de origem (e a função da §5 grava `anon_id` sempre).
--   · NÃO cria a rota `/api/contato` nem o botão (T-040, T-041). Sem eles,
--     nada chama a função e `contatos` continua vazia.
--   · NÃO grava IP. NÃO cria tabela nova. `canal` continua só `whatsapp`.
--   · NÃO dá a ninguém logado leitura de `anon_id` ou `user_id`, nem ao admin
--     e ao master: só o servidor (`service_role`) lê essas colunas.
--   · NÃO roda a rotina de retenção de 12 meses (D11): ela é da F6. Esta
--     migration só deixa o banco ACEITAR a linha anonimizada.
--
-- ⚠️ ANTES DE RODAR, NESTA ORDEM (o roteiro completo está no card T-039):
--   1. A 0005 aplicada (o pré-voo 1.1 confere e para se não estiver).
--   2. `supabase/prevoo-0006.sql`, uma consulta por vez.
--   3. `supabase/backup-antes-da-0006.sql`, CSV em `supabase/backups/`.
--   4. Leia a seção 10 (reversão).
--   5. Rode ESTE arquivo INTEIRO, de uma vez. É uma transação só.
--   6. O último comando é um `select` depois do commit: único canal de saída.
--   7. `supabase/verificar-apos-0006.sql`, UMA SONDA POR VEZ.
--
-- ⚠️ NADA AQUI FALA POR `raise notice` (SEC-035).
-- ⚠️ SQL Editor do Supabase: todo marcador de bloco entre cifrões é só letra,
--     sem dígito. Marcador com número quebra no editor.
--
-- Escrita em: 25/09/2026 · vetria-backend · NÃO APLICADA em lugar nenhum.
-- Auditoria obrigatória antes de aplicar: vetria-seguranca.
-- ============================================================================


begin;


-- ============================================================================
-- 1. PRÉ-VOO — tudo aqui é leitura de catálogo e termina em `raise exception`
-- ============================================================================

-- 1.1 — ⚠️ A 0005 ESTÁ APLICADA, E AS DUAS FUNÇÕES QUE ESTA REESCREVE SÃO AS
-- DO REPO? A §7 substitui `gerar_slug_do_perfil` e `slug_ao_ativar` (as duas
-- da 0005). `create or replace` apagaria em silêncio uma edição feita pelo
-- painel (R-006, a origem da SEC-024). Por isso o hash SEM ESPAÇO do corpo
-- (padrão da 0004) tem que ser o da 0005 ou o desta 0006 (rodar de novo).
do $preflight$
declare
  f record;
begin
  if (select count(*) from information_schema.tables
       where table_schema = 'public' and table_name in ('especialidades', 'servicos', 'cidades')) <> 3 then
    raise exception 'PARE: a 0005 nao esta aplicada neste banco (faltam as tabelas especialidades/servicos/cidades). Aplique a 0005 antes.';
  end if;

  if not exists (select 1 from pg_trigger
                  where tgname = 'trg_profiles_slug_ao_ativar'
                    and tgrelid = 'public.profiles'::regclass and not tgisinternal) then
    raise exception 'PARE: o trigger trg_profiles_slug_ao_ativar (0005) nao existe. A 0005 nao entrou inteira.';
  end if;

  for f in
    select * from (values
      ('gerar_slug_do_perfil', '8aca1eb4e4a72bd79ffc175938df18e8', '8cdba6b87eded20e7e9c3ab16bb09a7f'),
      ('slug_ao_ativar',       '0b6c06345e6bd0ce493b0cecc8a52b5c', '6e2da6385b4ddca66cd51863b207e8ce')
    ) as x(nome, hash_da_0005, hash_da_0006)
  loop
    if not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = f.nome
        and md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')) in (f.hash_da_0005, f.hash_da_0006)
    ) then
      raise exception 'PARE: a funcao public.% nao e a da 0005 nem a desta 0006 (hash sem espaco = %). Alguem a editou fora do repo (R-006). Leia o corpo pelo introspect-funcoes.sql e descubra o que mudou antes de seguir.',
        f.nome,
        coalesce((select string_agg(md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g')), ', ')
                    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                   where n.nspname = 'public' and p.proname = f.nome), 'NAO EXISTE');
    end if;
  end loop;

  -- `create or replace trigger` existe a partir do Postgres 14.
  if current_setting('server_version_num')::int < 140000 then
    raise exception 'PARE: Postgres % e anterior ao 14; esta migration usa create or replace trigger.', current_setting('server_version');
  end if;

  -- O grant da §5 e da §6 vai para `service_role`. Sem esse papel, o grant
  -- falharia no meio e a função ficaria sem ninguém que a chamasse.
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    raise exception 'PARE: o papel service_role nao existe neste banco. Este banco e mesmo um projeto Supabase?';
  end if;
end
$preflight$;

-- 1.2 — ⚠️ `contatos` É A DA 0002? E NINGUÉM ABRIU ESCRITA NELA PELO PAINEL?
-- A 0002 criou `contatos` SEM policy de escrita, de propósito (DL-047: só o
-- servidor grava). Uma policy de INSERT criada pelo painel deixaria qualquer
-- logado inventar contato, e a métrica que se vende viraria ficção. E as
-- colunas têm que ser as da 0002 (mais `anonimizado_em`, se esta migration já
-- rodou): outra coluna quer dizer outra origem, e o privilégio por coluna da
-- §3 seria escrito para uma tabela que não é esta.
do $preflight$
declare
  colunas  text;
  sobrando text;
begin
  select string_agg(column_name::text, ',' order by column_name) into colunas
  from information_schema.columns
  where table_schema = 'public' and table_name = 'contatos';

  if colunas is null then
    raise exception 'PARE: a tabela public.contatos nao existe. A 0002 nao esta aplicada neste banco?';
  end if;

  if colunas not in (
       'anon_id,canal,created_at,id,origem_cidade,origem_especialidade,profissional_id,user_id',
       'anon_id,anonimizado_em,canal,created_at,id,origem_cidade,origem_especialidade,profissional_id,user_id') then
    raise exception 'PARE: public.contatos tem colunas que o repo nao conhece: %. Esperado as da 0002 (e anonimizado_em, se a 0006 ja rodou). Descubra de onde vieram antes de seguir.', colunas;
  end if;

  select string_agg(format('%s [cmd=%s]', policyname, cmd), '; ') into sobrando
  from pg_policies
  where schemaname = 'public' and tablename = 'contatos'
    and policyname not in ('contatos_select_profissional', 'contatos_select_responsavel', 'contatos_select_admin');

  if sobrando is not null then
    raise exception 'PARE: existe policy em contatos que o repo nao conhece: %. So o servidor grava contato (DL-047). Descubra de quem e antes de seguir.', sobrando;
  end if;

  if (select count(*) from pg_policies
       where schemaname = 'public' and tablename = 'contatos' and cmd = 'SELECT'
         and policyname in ('contatos_select_profissional', 'contatos_select_responsavel', 'contatos_select_admin')) <> 3 then
    raise exception 'PARE: as tres policies de leitura de contatos da 0002 nao estao todas la. O responsavel ou o profissional deixariam de ver os proprios contatos.';
  end if;

  if not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                  where n.nspname = 'public' and c.relname = 'contatos' and c.relrowsecurity) then
    raise exception 'PARE: public.contatos esta SEM row level security. Com o grant por coluna da secao 3, todo logado leria o contato de todo mundo.';
  end if;

  -- O CHECK: ou o da 0002 (primeira vez), ou o desta 0006 (rodar de novo).
  if not exists (select 1 from pg_constraint
                  where conrelid = 'public.contatos'::regclass
                    and conname in ('contatos_tem_origem', 'contatos_tem_origem_ou_anonimizado')) then
    raise exception 'PARE: nenhum CHECK de origem em public.contatos (nem o da 0002 nem o da 0006). Alguem o removeu pelo painel?';
  end if;
end
$preflight$;

-- 1.3 — ⚠️ NADA COM OS NOMES QUE ESTA MIGRATION CRIA EXISTE, SALVO ELA MESMA.
-- Função com o nome certo e comentário '0006 / T-039' é desta migration
-- (rodar de novo não estraga). Com outra origem, `create or replace` a
-- apagaria em silêncio.
do $preflight$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure::text as assinatura,
           coalesce(obj_description(p.oid, 'pg_proc'), '') as comentario
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('registrar_contato', 'vincular_contatos_do_visitante',
                        'proteger_slug', 'anonimizar_contato')
  loop
    if f.comentario not like '0006 / T-039%' then
      raise exception 'PARE: a funcao % ja existe e nao e desta migration (comentario: "%"). Criada fora do repo? Descubra antes de seguir.', f.assinatura, f.comentario;
    end if;
  end loop;

  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'contatos'
               and column_name = 'anonimizado_em' and data_type <> 'timestamp with time zone') then
    raise exception 'PARE: contatos.anonimizado_em existe com outro tipo. Nao e desta migration.';
  end if;
end
$preflight$;


-- ============================================================================
-- 2. `contatos`: A LINHA ANONIMIZADA (R-076, D11)
-- ============================================================================
-- O problema (R-076): `user_id` é `on delete set null`, e o CHECK da 0002
-- exige `user_id` OU `anon_id`. Um contato feito logado, sem `anon_id`, faria
-- a exclusão da conta de quem clicou FALHAR (a linha ficaria sem os dois).
-- Isso travaria a exclusão de conta da LGPD (F6).
--
-- A regra nova (D11): a linha NÃO é apagada; ela perde quem clicou e fica
-- com o que é do profissional (a data, o canal e a origem: a contagem dele
-- não muda). E a linha anonimizada é MARCADA, para que "linha sem origem"
-- continue querendo dizer uma coisa só:
--   · `anonimizado_em` é carimbado pelo banco (trigger), nunca por quem grava;
--   · INSERT sem `user_id` e sem `anon_id` continua recusado (o CHECK novo só
--     aceita a linha sem os dois se ela foi ANONIMIZADA, e o trigger zera
--     `anonimizado_em` no INSERT);
--   · quando a conta de quem clicou é excluída (`user_id` vira nulo pelo
--     `on delete set null`), o `anon_id` sai junto: "excluir conta anonimiza
--     a linha" (D11). Sem isto, o cookie daquele navegador continuaria
--     apontando para o histórico de quem pediu para sumir;
--   · a rotina de 12 meses da F6 é um `update ... set anon_id = null` nas
--     linhas sem `user_id`; o trigger carimba a data sozinho.

alter table public.contatos add column if not exists anonimizado_em timestamptz;

comment on column public.contatos.anonimizado_em is
  '0006 / T-039: quando a linha perdeu quem clicou (conta excluída ou retenção de 12 meses, D11). Carimbado pelo trigger trg_contatos_anonimizar; nunca escrito por quem grava.';

create or replace function public.anonimizar_contato()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- linha nova nunca nasce anonimizada: sem origem, o CHECK recusa
    new.anonimizado_em := null;
    return new;
  end if;

  -- a conta de quem clicou saiu (on delete set null, ou exclusão pela F6)
  if old.user_id is not null and new.user_id is null then
    new.anon_id := null;
  end if;

  if new.user_id is null and new.anon_id is null then
    new.anonimizado_em := coalesce(old.anonimizado_em, now());
  else
    new.anonimizado_em := null;
  end if;

  return new;
end;
$$;

comment on function public.anonimizar_contato() is
  '0006 / T-039: trigger de contatos. Carimba anonimizado_em e tira o anon_id quando a conta de quem clicou sai (D11, R-076).';

create or replace trigger trg_contatos_anonimizar
  before insert or update on public.contatos
  for each row execute function public.anonimizar_contato();

-- A troca do CHECK. Nome novo, para que rodar de novo seja no-op: o antigo
-- só existe na primeira vez.
alter table public.contatos drop constraint if exists contatos_tem_origem;

do $checks$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.contatos'::regclass
                   and conname = 'contatos_tem_origem_ou_anonimizado') then
    alter table public.contatos add constraint contatos_tem_origem_ou_anonimizado
      check (user_id is not null or anon_id is not null or anonimizado_em is not null);
  end if;
end
$checks$;


-- ============================================================================
-- 3. `contatos`: QUEM LÊ QUAIS COLUNAS (R-074, D6)
-- ============================================================================
-- RLS é ROW-level (DL-049): `contatos_select_profissional` libera a LINHA, e o
-- PostgREST deixa pedir qualquer coluna dela. `select=anon_id` entregaria ao
-- profissional o valor do cookie de quem o procurou, e quem conhece esse
-- valor pode pô-lo no próprio navegador, criar conta de responsável e puxar
-- para si o histórico daquele visitante (§6).
--
-- A regra: `authenticated` NÃO tem SELECT na tabela; tem SELECT só nas
-- colunas que as telas da T-042 usam. `anon_id`, `user_id` e
-- `anonimizado_em` ficam de fora para TODO logado (profissional, responsável,
-- admin e master). Quem lê essas colunas é o servidor, com `service_role`.
--
-- ⚠️ CONSEQUÊNCIA PARA QUEM ESCREVER A T-042: `select=*` (e `.select('*')`
-- do supabase-js, inclusive com `count: 'exact', head: true`) passa a
-- devolver 42501 para quem está logado. As telas pedem as colunas pelo nome.
-- O filtro das policies (`user_id = auth.uid()`) continua valendo: condição
-- de policy não passa pelo privilégio de coluna de quem consulta.
--
-- `anon` não tem policy em `contatos` e perde todo privilégio (segunda porta).
-- `authenticated` também perde TUDO na tabela (TRUNCATE ignora a RLS; o
-- Supabase concede tudo por default privileges; e `revoke all` cobre também o
-- MAINTAIN do Postgres 17, SEC-122) e recebe de volta só o SELECT por coluna.
revoke all on public.contatos from anon;
revoke all on public.contatos from authenticated;
grant select (id, profissional_id, canal, origem_cidade, origem_especialidade, created_at)
  on public.contatos to authenticated;


-- ============================================================================
-- 4. ÍNDICES DOS LIMITES POR VISITANTE (D3)
-- ============================================================================
-- A §5 conta "quantos profissionais este visitante contatou nos últimos 10
-- minutos / 24 horas", por `anon_id` e por `user_id`. Os índices da 0002
-- (`idx_contatos_anon`, `idx_contatos_user`) são só pela coluna e ficam como
-- estão (aditivo).
create index if not exists idx_contatos_anon_recentes
  on public.contatos (anon_id, created_at desc) where anon_id is not null;
create index if not exists idx_contatos_user_recentes
  on public.contatos (user_id, created_at desc) where user_id is not null;


-- ============================================================================
-- 5. `registrar_contato` — A ÚNICA PORTA POR ONDE O NÚMERO SAI (D1, DL-047)
-- ============================================================================
-- Quem chama: SÓ a rota `POST /api/contato` (T-040), com o cliente
-- `service_role` de `lib/supabase/admin.ts`. `anon` e `authenticated` NÃO
-- executam (grant abaixo): a chave anon está no bundle, e uma função chamável
-- por ela seria raspada direto em `/rest/v1/rpc/registrar_contato`, com um
-- `anon_id` novo a cada pedido, por fora do firewall da Vercel.
--
-- Parâmetros (a rota já validou o formato; a função confere de novo):
--   p_tipo                  'vet' | 'clinic' (role do banco, DL-043)
--   p_slug                  o endereço público
--   p_user_id               o usuário logado, ou nulo
--   p_anon_id               o cookie `vetria_visitante`. OBRIGATÓRIO (R-076)
--   p_origem_cidade         `cidades.slug` da busca, ou nulo
--   p_origem_especialidade  `especialidades.slug` (vet) / `servicos.slug`
--                           (clinic) da busca, ou nulo
--
-- Devolve jsonb no formato de `RespostaDoContato`
-- (`lib/perfil-publico/contato.ts`):
--   {"ok": true,  "whatsapp": "62900000001"}   dígitos, DDD + número, sem 55
--   {"ok": false, "motivo": "nao_encontrado"}  slug inválido, inexistente,
--                                              role errado ou conta não active
--   {"ok": false, "motivo": "sem_whatsapp"}    NÃO grava nada
--   {"ok": false, "motivo": "muitas_tentativas"}  NÃO grava nada
-- Erro de programação (p_anon_id nulo) levanta 22004: a rota responde
-- `indisponivel`.
--
-- A ordem é a regra:
--   1. resolve o slug exigindo role certo E `active` (a mesma regra da busca)
--   2. trava por visitante (dois cliques simultâneos não furam limite nem
--      duplicam a linha)
--   3. lê o WhatsApp; sem número, `sem_whatsapp` e nada é gravado
--   4. contato consigo mesmo: devolve o número e NÃO grava
--   5. D5: o mesmo visitante já contatou este profissional nas últimas 24 h →
--      devolve o número e NÃO grava de novo (a contagem é honesta)
--   6. D3: 5 profissionais distintos em 10 min, 20 em 24 h → recusa
--   7. grava a linha (anon_id sempre; user_id quando logado; a origem só se
--      estiver nas listas: lixo não entra na métrica que se vende)
--   8. SÓ ENTÃO devolve o número. Se o INSERT falhar, a transação inteira
--      falha e o número não sai.
--
-- O IP NÃO chega aqui e NÃO é gravado (DL-047 alternativa c). O limite por IP
-- é da borda (firewall da Vercel, T-040).
create or replace function public.registrar_contato(
  p_tipo                 text,
  p_slug                 text,
  p_user_id              uuid,
  p_anon_id              uuid,
  p_origem_cidade        text default null,
  p_origem_especialidade text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  -- D3 e D5. Mudar um número daqui é migration nova (e DL), não edição.
  limite_curto     constant integer  := 5;
  janela_curta     constant interval := interval '10 minutes';
  limite_longo     constant integer  := 20;
  janela_longa     constant interval := interval '24 hours';
  janela_repetido  constant interval := interval '24 hours';

  v_profissional   uuid;
  v_whatsapp       text;
  v_cidade         text;
  v_especialidade  text;
begin
  if p_anon_id is null then
    raise exception 'registrar_contato: p_anon_id e obrigatorio (R-076: a linha grava anon_id sempre)'
      using errcode = '22004';
  end if;

  -- 1) o alvo: role certo E active, pelo endereço público (nunca por id)
  if p_tipo is null or p_tipo not in ('vet', 'clinic')
     or p_slug is null or char_length(p_slug) > 120
     or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado');
  end if;

  if p_tipo = 'vet' then
    select v.id into v_profissional
    from public.vet_profiles v
    join public.profiles p on p.id = v.id
    where v.slug = p_slug and p.role = 'vet' and p.status = 'active';
  else
    select c.id into v_profissional
    from public.clinic_profiles c
    join public.profiles p on p.id = c.id
    where c.slug = p_slug and p.role = 'clinic' and p.status = 'active';
  end if;

  if v_profissional is null then
    return jsonb_build_object('ok', false, 'motivo', 'nao_encontrado');
  end if;

  -- 2) um pedido por visitante de cada vez, até o fim da transação
  perform pg_advisory_xact_lock(hashtext('vetria.contato.anon.' || p_anon_id::text));
  if p_user_id is not null then
    perform pg_advisory_xact_lock(hashtext('vetria.contato.user.' || p_user_id::text));
  end if;

  -- 3) o número
  select nullif(btrim(pp.whatsapp), '') into v_whatsapp
  from public.perfil_privado pp
  where pp.id = v_profissional;

  if v_whatsapp is null then
    return jsonb_build_object('ok', false, 'motivo', 'sem_whatsapp');
  end if;

  -- 4) contato consigo mesmo não é lead
  if p_user_id is not null and p_user_id = v_profissional then
    return jsonb_build_object('ok', true, 'whatsapp', v_whatsapp);
  end if;

  -- 5) D5: mesmo visitante + mesmo profissional em 24 h conta 1
  if exists (
    select 1 from public.contatos c
    where c.profissional_id = v_profissional
      and c.created_at > now() - janela_repetido
      and (c.anon_id = p_anon_id or (p_user_id is not null and c.user_id = p_user_id))
  ) then
    return jsonb_build_object('ok', true, 'whatsapp', v_whatsapp);
  end if;

  -- 6) D3: profissionais DISTINTOS contatados por este visitante
  if (select count(distinct c.profissional_id) from public.contatos c
       where c.created_at > now() - janela_curta
         and (c.anon_id = p_anon_id or (p_user_id is not null and c.user_id = p_user_id))) >= limite_curto
  or (select count(distinct c.profissional_id) from public.contatos c
       where c.created_at > now() - janela_longa
         and (c.anon_id = p_anon_id or (p_user_id is not null and c.user_id = p_user_id))) >= limite_longo
  then
    return jsonb_build_object('ok', false, 'motivo', 'muitas_tentativas');
  end if;

  -- 7) a origem, só se estiver nas listas
  if p_origem_cidade is not null
     and exists (select 1 from public.cidades ci where ci.slug = p_origem_cidade) then
    v_cidade := p_origem_cidade;
  end if;

  if p_origem_especialidade is not null
     and ((p_tipo = 'vet'    and exists (select 1 from public.especialidades e where e.slug = p_origem_especialidade))
       or (p_tipo = 'clinic' and exists (select 1 from public.servicos s where s.slug = p_origem_especialidade))) then
    v_especialidade := p_origem_especialidade;
  end if;

  insert into public.contatos (profissional_id, user_id, anon_id, canal, origem_cidade, origem_especialidade)
  values (v_profissional, p_user_id, p_anon_id, 'whatsapp', v_cidade, v_especialidade);

  -- 8) só agora
  return jsonb_build_object('ok', true, 'whatsapp', v_whatsapp);
end;
$$;

comment on function public.registrar_contato(text, text, uuid, uuid, text, text) is
  '0006 / T-039: registra o clique de contato e devolve o WhatsApp na mesma transação (DL-047, D1, D3, D5). EXECUTE só service_role.';

revoke execute on function public.registrar_contato(text, text, uuid, uuid, text, text) from public, anon, authenticated;
grant  execute on function public.registrar_contato(text, text, uuid, uuid, text, text) to service_role;


-- ============================================================================
-- 6. `vincular_contatos_do_visitante` — O HISTÓRICO VAI COM A CONTA NOVA (D10)
-- ============================================================================
-- Quem chama: SÓ o servidor, na CRIAÇÃO de conta de responsável (T-042), com
-- o `anon_id` do cookie daquele navegador. Não em todo login: num computador
-- compartilhado, quem entrasse na própria conta levaria o histórico de quem
-- usou a máquina antes (D10).
--
-- O banco confere o que consegue conferir sozinho:
--   · a conta é `tutor` (profissional não tem "Seus contatos");
--   · a conta foi criada nas últimas 24 horas, pela data de `auth.users`
--     (que o usuário não escreve; `profiles.created_at` ele poderia reescrever
--     pelo PATCH do próprio perfil, SEC-121). É a trava do "só na criação":
--     se um dia a rota chamar isto num login qualquer, a conta antiga não
--     vincula nada;
--   · só linhas SEM `user_id` (nunca rouba contato de outra conta), dos
--     últimos 30 dias, e nunca um contato consigo mesmo.
-- Devolve quantas linhas vinculou (0 quando não há o que vincular ou quando a
-- conta não passa nas travas: a criação de conta nunca falha por causa disto).
create or replace function public.vincular_contatos_do_visitante(p_user_id uuid, p_anon_id uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  vinculados integer := 0;
begin
  if p_user_id is null or p_anon_id is null then
    return 0;
  end if;

  if not exists (
    select 1 from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = p_user_id
      and p.role = 'tutor'
      and u.created_at > now() - interval '24 hours'
  ) then
    return 0;
  end if;

  perform pg_advisory_xact_lock(hashtext('vetria.contato.anon.' || p_anon_id::text));

  update public.contatos c
  set user_id = p_user_id
  where c.anon_id = p_anon_id
    and c.user_id is null
    and c.created_at > now() - interval '30 days'
    and c.profissional_id <> p_user_id;

  get diagnostics vinculados = row_count;
  return vinculados;
end;
$$;

comment on function public.vincular_contatos_do_visitante(uuid, uuid) is
  '0006 / T-039: na criação de conta de responsável, vincula os contatos anônimos dos últimos 30 dias daquele navegador (D10). EXECUTE só service_role.';

revoke execute on function public.vincular_contatos_do_visitante(uuid, uuid) from public, anon, authenticated;
grant  execute on function public.vincular_contatos_do_visitante(uuid, uuid) to service_role;


-- ============================================================================
-- 7. O SLUG: SÓ O GERADOR E O MASTER TROCAM (SEC-115, R-069) E A APROVAÇÃO
--    SEM PERFIL FALHA (SEC-116, R-070)
-- ============================================================================
-- 7.1 — SEC-115. `vet_profiles_update_admin` e `clinic_profiles_update_admin`
-- (0002) deixam o admin COMUM fazer `PATCH slug=...`, e a matriz §3 / DL-067
-- item 5 dizem que trocar o endereço é gesto do master. As policies ficam
-- como estão (o admin comum continua moderando bio e derrubando perfil); o
-- trigger recusa só a mudança do `slug`.
--
-- Quem PODE mudar o slug:
--   a) o gerador (`gerar_slug_do_perfil`, §7.2), que liga a marca local
--      `vetria.gerador_de_slug` só em volta do próprio UPDATE. A marca é
--      `set_config(..., true)` e é DESLIGADA pelo próprio gerador logo depois
--      do UPDATE (o `set_config(..., '', true)` explícito da §7.2); se o UPDATE
--      falhar, a transação inteira volta e a marca some com ela. A sonda 2,
--      caso 68, prova que ela não sobra. Ninguém de fora a liga: o PostgREST não
--      executa SET, e a função que a liga não tem EXECUTE para anon nem
--      authenticated;
--   b) o master logado (`is_master_admin()`);
--   c) uma sessão direta do banco (SQL Editor, migration), que é onde o
--      master faz o gesto manual do DL-067. Reconhecida pelo papel ATIVO da
--      sessão (`current_setting('role')`), que o PostgREST sempre troca para
--      `anon`, `authenticated` ou `service_role`. Uma função SECURITY DEFINER
--      troca o usuário efetivo, mas NÃO essa configuração: é por isso que a
--      checagem usa ela, e não `current_user`.
-- Quem NÃO pode: `anon`, `authenticated` que não é master (o dono já era
-- barrado pela policy, SEC-008; agora o admin comum também), e
-- `service_role` (nenhuma rota do app escreve slug; se um dia precisar, é
-- decisão registrada, não um PATCH).
-- Recusa com 42501, o mesmo código que o PostgREST devolve para policy.
create or replace function public.proteger_slug()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.slug is not distinct from old.slug then
    return new;
  end if;
  if tg_op = 'INSERT' and new.slug is null then
    return new;
  end if;

  if coalesce(current_setting('vetria.gerador_de_slug', true), '') = 'ligado' then
    return new;
  end if;

  if coalesce(current_setting('role', true), 'none') not in ('anon', 'authenticated', 'service_role') then
    return new;
  end if;

  if public.is_master_admin() then
    return new;
  end if;

  raise exception 'o endereco publico (slug) so muda pelo gerador ou pelo master (DL-067)'
    using errcode = '42501', table = tg_table_name, column = 'slug';
end;
$$;

comment on function public.proteger_slug() is
  '0006 / T-039: trigger de vet_profiles/clinic_profiles. Slug só muda pelo gerador ou pelo master (SEC-115, DL-067). 42501.';

revoke execute on function public.proteger_slug() from public, anon, authenticated;

create or replace trigger trg_vet_profiles_slug_protegido
  before insert or update of slug on public.vet_profiles
  for each row execute function public.proteger_slug();

create or replace trigger trg_clinic_profiles_slug_protegido
  before insert or update of slug on public.clinic_profiles
  for each row execute function public.proteger_slug();

-- 7.2 — o gerador da 0005, com UMA mudança: liga a marca do 7.1 em volta do
-- próprio UPDATE, e a desliga logo depois. O resto é a 0005 linha por linha
-- (regra do DL-067, trava de colisão, estabilidade). O pré-voo 1.1 conferiu
-- que a versão no banco é a da 0005.
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

  -- 0006 / SEC-115: a marca que o trigger proteger_slug reconhece
  perform set_config('vetria.gerador_de_slug', 'ligado', true);

  if p_role = 'vet' then
    update public.vet_profiles set slug = candidato where id = p_id and slug is null;
  else
    update public.clinic_profiles set slug = candidato where id = p_id and slug is null;
  end if;

  perform set_config('vetria.gerador_de_slug', '', true);

  return candidato;
end;
$$;

-- O comentário continua começando com '0005 / T-028': o pré-voo 1.3 da 0005
-- exige isso, e rodar a 0005 de novo não pode parar por causa da 0006.
comment on function public.gerar_slug_do_perfil(uuid, public.user_role) is
  '0005 / T-028 (reescrita na 0006 / T-039): gera o slug (DL-067) se a conta ainda não tem. Estável. Liga a marca vetria.gerador_de_slug só no próprio UPDATE (SEC-115). Sem EXECUTE para anon/authenticated.';

revoke execute on function public.gerar_slug_do_perfil(uuid, public.user_role) from public, anon, authenticated;

-- 7.3 — SEC-116. A 0005 dizia "se o slug não puder ser gerado, a aprovação
-- falha", e o código não fazia isso: conta vet/clinic sem linha de perfil
-- virava `active` sem endereço, em silêncio. Agora a aprovação (ou a
-- reativação pelo master) FALHA, com 55000, e o admin vê o erro. Hoje não há
-- caminho pelo app até aqui (a conclusão do onboarding exige a linha); isto
-- fecha o caminho pelo banco.
create or replace function public.slug_ao_ativar()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_slug text;
begin
  if new.role in ('vet', 'clinic') then
    v_slug := public.gerar_slug_do_perfil(new.id, new.role);
    if v_slug is null then
      raise exception 'a conta % (%) nao tem linha de perfil: sem ela nao ha endereco publico, e a conta nao pode ficar active', new.id, new.role
        using errcode = '55000';
    end if;
  end if;
  return null;
end;
$$;

comment on function public.slug_ao_ativar() is
  '0005 / T-028 (reescrita na 0006 / T-039): trigger de profiles. Conta vet/clinic que vira active ganha slug (DL-067); sem linha de perfil, a mudança falha com 55000 (SEC-116).';


-- ============================================================================
-- 8. AVISAR O PostgREST (SEC-038). Entregue no commit.
-- ============================================================================
notify pgrst, 'reload schema';


commit;


-- ============================================================================
-- 9. O RESULTADO, NA TELA (SEC-035) — leitura pura, depois do commit
-- ============================================================================
-- Esperado: TODA linha com `ok_TEM_QUE_SER_true` = true.
select * from (
  select 1 as ordem, 'contatos: RLS ligada' as item,
         (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relname = 'contatos') as ok_TEM_QUE_SER_true,
         'se false: vazamento' as leitura
  union all
  select 2, 'contatos: so as 3 policies de leitura da 0002, nenhuma de escrita',
         (select count(*) = 3 and bool_and(cmd = 'SELECT') from pg_policies
           where schemaname = 'public' and tablename = 'contatos'),
         (select string_agg(policyname || ' [' || cmd || ']', ', ') from pg_policies
           where schemaname = 'public' and tablename = 'contatos')
  union all
  select 3, 'R-074: authenticated NAO le anon_id nem user_id, e nao tem SELECT na tabela',
         not has_table_privilege('authenticated', 'public.contatos', 'SELECT')
         and not has_column_privilege('authenticated', 'public.contatos', 'anon_id', 'SELECT')
         and not has_column_privilege('authenticated', 'public.contatos', 'user_id', 'SELECT')
         and not has_column_privilege('authenticated', 'public.contatos', 'anonimizado_em', 'SELECT'),
         'se false: o profissional le o cookie de quem o procurou'
  union all
  select 4, 'R-074: authenticated le as 6 colunas das telas (controle positivo)',
         has_column_privilege('authenticated', 'public.contatos', 'id', 'SELECT')
         and has_column_privilege('authenticated', 'public.contatos', 'profissional_id', 'SELECT')
         and has_column_privilege('authenticated', 'public.contatos', 'canal', 'SELECT')
         and has_column_privilege('authenticated', 'public.contatos', 'origem_cidade', 'SELECT')
         and has_column_privilege('authenticated', 'public.contatos', 'origem_especialidade', 'SELECT')
         and has_column_privilege('authenticated', 'public.contatos', 'created_at', 'SELECT'),
         'se false: as telas da T-042 nao leem nada'
  union all
  select 5, 'contatos: anon sem privilegio nenhum; authenticated nao escreve',
         not has_table_privilege('anon', 'public.contatos', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
         and not has_any_column_privilege('anon', 'public.contatos', 'SELECT')
         and not has_table_privilege('authenticated', 'public.contatos', 'INSERT,UPDATE,DELETE,TRUNCATE'),
         'se false: grant sobrando'
  union all
  select 6, 'contatos: service_role le e grava (a rota e o teste precisam)',
         has_table_privilege('service_role', 'public.contatos', 'SELECT,INSERT'),
         'se false: a rota da T-040 e o E2E da T-043 quebram'
  union all
  select 7, 'R-076: o CHECK novo existe e o da 0002 saiu',
         exists (select 1 from pg_constraint where conrelid = 'public.contatos'::regclass
                  and conname = 'contatos_tem_origem_ou_anonimizado' and convalidated)
         and not exists (select 1 from pg_constraint where conrelid = 'public.contatos'::regclass
                  and conname = 'contatos_tem_origem'),
         (select string_agg(conname, ', ') from pg_constraint
           where conrelid = 'public.contatos'::regclass and contype = 'c')

  union all
  select 10, format('funcao %s: SECURITY DEFINER + search_path=public', p.proname),
         p.prosecdef and coalesce(p.proconfig, '{}'::text[]) && array['search_path=public'],
         coalesce(array_to_string(p.proconfig, ','), 'SEM search_path')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('registrar_contato', 'vincular_contatos_do_visitante', 'proteger_slug',
                      'gerar_slug_do_perfil', 'slug_ao_ativar')
  union all
  select 11, 'funcao anonimizar_contato: search_path=public (so mexe no NEW, sem DEFINER)',
         (select coalesce(p.proconfig, '{}'::text[]) && array['search_path=public'] and not p.prosecdef
            from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname = 'anonimizar_contato'),
         'se false: a funcao nao e a desta migration'
  union all
  select 12, format('%s: EXECUTE so service_role (nem public, nem anon, nem authenticated)', f.nome),
         (select p.proacl is not null
                 and not exists (select 1 from aclexplode(p.proacl) a
                                  where a.grantee = 0 and a.privilege_type = 'EXECUTE')
            from pg_proc p where p.oid = f.assinatura::regprocedure)
         and not has_function_privilege('anon', f.assinatura, 'EXECUTE')
         and not has_function_privilege('authenticated', f.assinatura, 'EXECUTE')
         and has_function_privilege('service_role', f.assinatura, 'EXECUTE'),
         'se false: o numero sai por /rest/v1/rpc sem passar pela rota'
  from (values
    ('registrar_contato', 'public.registrar_contato(text, text, uuid, uuid, text, text)'),
    ('vincular_contatos_do_visitante', 'public.vincular_contatos_do_visitante(uuid, uuid)')
  ) as f(nome, assinatura)
  union all
  select 13, format('hash sem espaco de %s = o desta 0006', p.proname),
         md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))
           = case p.proname when 'gerar_slug_do_perfil' then '8cdba6b87eded20e7e9c3ab16bb09a7f'
                            else '6e2da6385b4ddca66cd51863b207e8ce' end,
         md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname in ('gerar_slug_do_perfil', 'slug_ao_ativar')

  union all
  select 20, format('trigger %s', t.tgname), not t.tgisinternal and t.tgenabled <> 'D',
         t.tgrelid::regclass::text
  from pg_trigger t
  where t.tgname in ('trg_contatos_anonimizar', 'trg_vet_profiles_slug_protegido',
                     'trg_clinic_profiles_slug_protegido', 'trg_profiles_slug_ao_ativar')
  union all
  select 21, 'os 4 triggers existem', (select count(*) = 4 from pg_trigger t
           where t.tgname in ('trg_contatos_anonimizar', 'trg_vet_profiles_slug_protegido',
                              'trg_clinic_profiles_slug_protegido', 'trg_profiles_slug_ao_ativar')),
         'se false: falta um trigger'
  union all
  select 22, format('indice %s', i.indexname), true, i.tablename::text
  from pg_indexes i
  where i.schemaname = 'public'
    and i.indexname in ('idx_contatos_anon_recentes', 'idx_contatos_user_recentes')
  union all
  select 23, 'os 2 indices dos limites existem',
         (select count(*) = 2 from pg_indexes where schemaname = 'public'
           and indexname in ('idx_contatos_anon_recentes', 'idx_contatos_user_recentes')),
         'se false: falta indice'

  union all
  select 30, 'contatos: linhas hoje (informativo; esperado 0 antes da T-040)', true,
         (select count(*)::text from public.contatos)
) resultado
order by ordem, item;


-- ============================================================================
-- 10. PROCEDIMENTO DE REVERSÃO
-- ============================================================================
-- Primeiro o que depende, depois aquilo de que depende. Só aqui aparece
-- `drop`, e é reversão, não migration.
--
-- ⚠️ ANTES DE REVERTER, desligue o contato no código (T-041:
-- `CONTATO_PELO_SITE_ABERTO = false`), se ele já estiver ligado: sem a função,
-- a rota da T-040 responde `indisponivel` a todo clique.
--
-- ⚠️ O CHECK antigo só volta se NENHUMA linha estiver anonimizada (linha sem
-- `user_id` e sem `anon_id`). Se houver, o `add constraint` falha e a
-- transação inteira da reversão volta: decida com o Elber (a linha
-- anonimizada é a LGPD funcionando; o CHECK antigo é que a proíbe).
--
-- begin;
--   drop trigger if exists trg_vet_profiles_slug_protegido    on public.vet_profiles;
--   drop trigger if exists trg_clinic_profiles_slug_protegido on public.clinic_profiles;
--   drop function if exists public.proteger_slug();
--
--   -- gerar_slug_do_perfil e slug_ao_ativar: recrie as versões da 0005,
--   -- copiando da 0005_dados_da_busca_e_slug.sql as seções 5.2 e 5.3
--   -- INTEIRAS (create or replace function ... até o comment on function).
--   -- Não rode a 0005 inteira: ela recria o resto e preenche slug.
--
--   drop function if exists public.vincular_contatos_do_visitante(uuid, uuid);
--   drop function if exists public.registrar_contato(text, text, uuid, uuid, text, text);
--
--   drop index if exists public.idx_contatos_anon_recentes;
--   drop index if exists public.idx_contatos_user_recentes;
--
--   -- privilégio: volta ao da 0002 (SELECT na tabela inteira para
--   -- authenticated). O anon continua sem nada: sem policy, não havia o
--   -- que ele lesse, e reabrir o grant não serve a ninguém.
--   revoke select (id, profissional_id, canal, origem_cidade, origem_especialidade, created_at)
--     on public.contatos from authenticated;
--   grant select on public.contatos to authenticated;
--
--   alter table public.contatos drop constraint if exists contatos_tem_origem_ou_anonimizado;
--   alter table public.contatos add constraint contatos_tem_origem
--     check (user_id is not null or anon_id is not null);
--   drop trigger if exists trg_contatos_anonimizar on public.contatos;
--   drop function if exists public.anonimizar_contato();
--   alter table public.contatos drop column if exists anonimizado_em;
--
--   notify pgrst, 'reload schema';
-- commit;
--
-- ⚠️ E O CÓDIGO: hoje nada no app chama as duas funções nem lê `contatos`.
-- Reverter antes da T-040 não exige mudança de código.


-- ============================================================================
-- 11. VERIFICAÇÃO PÓS-APLICAÇÃO
-- ============================================================================
-- Em arquivo separado: `supabase/verificar-apos-0006.sql`, UMA SONDA POR VEZ.
