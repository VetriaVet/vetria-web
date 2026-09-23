-- ============================================================================
-- MONTAR O vetria-e2e — o banco de TESTE igual ao de produção até a 0003
--
-- ⚠️ SÓ NO PROJETO vetria-e2e, E SÓ COM ELE VAZIO. Confira o nome do projeto no
-- topo do SQL Editor antes de colar. Rodar isto em PRODUÇÃO falha logo na
-- primeira linha (`type "user_role" already exists`) e não muda nada, porque é
-- uma transação só; mesmo assim, não rode.
--
-- O que é: UM arquivo para colar de uma vez, montado a partir dos arquivos
-- versionados, na ordem que funciona num projeto em branco (DL-064, T-027,
-- T-029). A `0004` NÃO está aqui: ela entra depois da auditoria, como passo
-- separado, com o arquivo dela.
--
-- ⚠️ ESTE ARQUIVO É MONTADO, NÃO ESCRITO. Os trechos entre os marcadores
-- "PASSO n de 6" são cópia literal das migrations, nas linhas que cada marcador
-- cita, com UMA exceção marcada (o pré-voo 1.7 da 0003). Montado em 23/09/2026
-- sobre 0000-0003 como estão no repo. Se uma dessas migrations mudar, monte de
-- novo pelas mesmas linhas em vez de editar trechos à mão: quem editar aqui
-- cria uma terceira versão do schema, que é o R-006 com outro nome.
--
-- POR QUE A ORDEM NÃO É 0000, 0001, 0002, 0003:
--   a `0000_baseline.sql` é DOCUMENTAL (foi escrita por introspecção de um
--   banco que já existia). A seção 4 dela cria dois triggers que apontam para
--   funções que ela mesma não cria: `handle_new_user()` (mora na 0001) e
--   `set_updated_at()` (corpo "abreviado" na 0000). Num projeto em branco ela
--   falha. Por isso:
--     1. 0000 seções 1 a 3   tipos, profiles, funções de checagem
--     2. 0001                handle_new_user
--     3. set_updated_at      o corpo da 0002 §3.4
--     4. 0000 seções 4 e 5   triggers e policies de profiles
--     5. 0002                núcleo
--     6. 0003                bucket e perfil_privado
--
-- COMO USAR:
--   1. Projeto vetria-e2e novo, vazio. SQL Editor → New query.
--   2. Cole ESTE ARQUIVO INTEIRO e rode. É UMA transação: ou entra tudo, ou
--      não entra nada. Se falhar, leia a mensagem, conserte a causa e rode de
--      novo o arquivo inteiro (o banco ficou como estava).
--   3. O resultado na tela é o BLOCO DE VERIFICAÇÃO do fim (só leitura, depois
--      do commit). Toda linha tem que vir `ok = true`.
--   4. Crie as contas de teste (passo a passo no card da T-027 / resposta do
--      vetria-backend de 23/09).
--   5. Só então a 0004, pelo arquivo dela, depois da auditoria.
--
-- ⚠️ NADA AQUI FALA POR `raise notice` (SEC-035).
--
-- ============================================================================
-- DIFERENÇAS CONHECIDAS entre o que este arquivo monta e PRODUÇÃO
-- ============================================================================
-- O que NÃO dá para reproduzir com certeza a partir do repo, e por quê:
--
--  1. `admin_list_profiles()` e `admin_set_user_access(uuid, user_role,
--     admin_level, admin_team)` EXISTEM em produção e NÃO são criadas aqui.
--     O corpo delas nunca foi versionado: a 0000 só as descreve (§3.6, §3.7).
--     O app NÃO as chama (`/api/admin/*` usa service_role, R-012), então
--     nenhum teste depende delas. Se um dia precisar: rode a QUERY 2 do
--     `supabase/introspect-funcoes.sql` em PRODUÇÃO e cole o corpo aqui.
--     Efeito colateral: o `revoke ... from anon` da 0002 §11 as procura por
--     descoberta e simplesmente não acha nada. Não falha.
--  2. O fix do DL-014 (`is_master_admin` SECURITY DEFINER + search_path) JÁ
--     ESTÁ na 0000 §3.1, na forma medida em produção em 26/08. É o único fix
--     aplicado à mão que o repo registra (CONTEXT.md, DL-014; migrations/
--     README). Qualquer outro feito pelo painel e não capturado pela
--     introspecção de 26/08 é desconhecido. Para comparar depois: a CONSULTA 2
--     do `supabase/prevoo-0004.sql` (policies) rodada nos dois projetos.
--  3. Os GRANTs de função do Supabase por "default privileges" dependem da
--     versão do projeto. Um projeto novo pode conceder EXECUTE a anon e
--     authenticated em funções que, em produção, nasceram antes dessa regra.
--     As funções que importam para segurança têm revoke/grant explícito na
--     0002 e na 0003, então o resultado é o mesmo nelas. Nas outras, pode
--     diferir.
--  4. `set_updated_at()` em produção, antes da 0002, era INVOKER sem
--     search_path. Aqui ela nasce já na forma da 0002. O estado FINAL é igual.
--  5. A versão do Postgres e do Storage de um projeto novo pode ser mais nova
--     que a de produção (por exemplo, `storage.objects` com trigger de
--     "prefixes"). Não muda o schema `public`, mas pode mudar o comportamento
--     de um insert direto em `storage.objects` (o caso 62 da sonda 3 do
--     verificar-apos-0004 prevê isso).
--  6. NADA DO QUE NÃO É SQL está aqui, e precisa ser configurado no painel do
--     vetria-e2e para bater com produção: Auth → Providers (email com
--     confirmação; Google, se o teste precisar), senha mínima (R-064), Site
--     URL e Redirect URLs, SMTP (Resend) e rate limits. As chaves (anon e
--     service_role) são OUTRAS: a de produção nunca vai para o CI (DL-064).
--  7. Dado: nenhum. Produção tem contas desde maio; aqui o banco nasce vazio,
--     e as contas de teste são criadas à mão depois (passo a passo à parte).
--  8. O pré-voo 1.7 da 0003 foi substituído (ver o PASSO 6). É a única linha
--     de migration que não é cópia literal.
-- ============================================================================

begin;


-- ############################################################################
-- PASSO 1 de 6 — 0000_baseline.sql, SEÇÕES 1 A 3 (tipos, profiles, funções), sem alteração
-- ############################################################################

-- ----------------------------------------------------------------------------
-- 1. TIPOS ENUM
-- ----------------------------------------------------------------------------
-- NOTA: `master` NÃO é um role. Um master é role='admin' + admin_level='master'.
-- A documentação antiga (CONTEXT.md §4.1) dizia o contrário e estava errada.
-- Ver DL-045 e docs/06-PERMISSOES.md §1.

create type public.user_role   as enum ('tutor', 'vet', 'clinic', 'admin');
create type public.admin_level as enum ('none', 'admin', 'master');
create type public.admin_team  as enum ('none', 'support', 'sales', 'ops', 'finance', 'compliance');


-- ----------------------------------------------------------------------------
-- 2. TABELA profiles (a única que existe hoje)
-- ----------------------------------------------------------------------------
-- NOTA: `profiles` TEM `full_name` e `phone`. O DL-019 afirmava que não tinha,
-- e estava errado. Verificado por introspecção em 26/08/2026.

create table public.profiles (
  id                    uuid          not null,
  role                  user_role     not null default 'tutor'::user_role,
  full_name             text,
  phone                 text,
  onboarding_completed  boolean       not null default false,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now(),
  admin_level           admin_level            default 'none'::admin_level,
  admin_team            admin_team             default 'none'::admin_team,
  constraint profiles_pkey primary key (id)
);

-- Índices: SOMENTE a primary key. Não há índice em `role` nem em nada mais.
-- A busca da Fase 4 vai precisar de índices de verdade.

alter table public.profiles enable row level security;
-- FORCE ROW LEVEL SECURITY está DESLIGADO (o dono da tabela ignora RLS).


-- ----------------------------------------------------------------------------
-- 3. FUNÇÕES
-- ----------------------------------------------------------------------------

-- 3.1 — is_master_admin() — CANÔNICA. É a usada pelas 5 policies de profiles.
create or replace function public.is_master_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND admin_level = 'master'
  );
$function$;

-- 3.2 — is_admin_master() — ⚠️ DUPLICATA EXATA da 3.1, byte a byte.
-- Não é usada por nenhuma policy nem pelo código do app. Resíduo do DL-014.
-- Marcada para remoção na 0002 (risco R-005).
create or replace function public.is_admin_master()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND admin_level = 'master'
  );
$function$;

-- 3.3 — current_user_role() — ⚠️⚠️ PERIGOSA. SECURITY INVOKER e SEM search_path.
-- Consulta `profiles`. Se for usada dentro de uma policy DE `profiles`, causa
-- recursão infinita de RLS: é exatamente o bug do DL-014, que já derrubou este
-- banco. Hoje não é usada em lugar nenhum (nem policy, nem app).
-- Marcada para remoção na 0002.
create or replace function public.current_user_role()
returns user_role
language sql
stable
as $function$
  select role from public.profiles where id = auth.uid();
$function$;

-- 3.4 — set_updated_at() — trigger de updated_at. INVOKER, sem search_path.
-- Risco baixo (não consulta tabela), mas será endurecida na 0002.
-- (Corpo abreviado: new.updated_at = now(); return new;)

-- 3.5 — handle_new_user() — versionada em 0001. Cria o profile no signup,
-- lendo o role do metadata. DEFINER + search_path. Ver 0001 para o corpo.

-- 3.6 — admin_list_profiles() — RPC guardada, DEFINER + search_path.
-- Levanta 'not authorized' se o chamador não for admin+master.
-- ⚠️ O app NÃO usa esta função: /api/admin/profiles acessa com SERVICE_ROLE.
-- Duas rotas para a mesma operação (risco R-012).

-- 3.7 — admin_set_user_access(target_user_id, new_role, new_admin_level, new_admin_team)
-- RPC guardada, DEFINER + search_path. Mesmo guard de master.
-- ⚠️ Ao rebaixar de admin, escreve admin_level = 'none'.
-- Já /api/admin/set-access escreve NULL no mesmo caso. É a origem da linha
-- com admin_level NULL encontrada em produção (risco R-012).

-- GRANTS observados:
--   admin_list_profiles, admin_set_user_access → PUBLIC revogado;
--     anon e authenticated com EXECUTE. Ambas se protegem internamente,
--     então não há escalada. `anon` é superfície desnecessária: revogar na 0002.
--   demais funções → PUBLIC com EXECUTE (padrão).


-- ############################################################################
-- PASSO 2 de 6 — 0001_handle_new_user_role_from_metadata.sql, a função, sem alteração
-- ############################################################################

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  meta_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    -- só tutor/vet/clinic são aceitos do metadata; qualquer outra coisa
    -- (inclusive 'admin' ou nulo) cai no default seguro 'tutor'
    case
      when meta_role in ('tutor', 'vet', 'clinic') then meta_role::user_role
      else 'tutor'::user_role
    end,
    -- nome vindo do cadastro (full_name) ou do Google (name); vazio => null
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;


-- ############################################################################
-- PASSO 3 de 6 — set_updated_at(), copiado de 0002_nucleo.sql §3.4 (linhas 224-232)
-- Precisa existir ANTES da seção 4 da 0000, que cria o trigger que a chama. A 0000
-- só registra o corpo "abreviado". A 0002, logo abaixo, recria a mesma função.
-- ############################################################################

create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ############################################################################
-- PASSO 4 de 6 — 0000_baseline.sql, SEÇÕES 4 E 5 (triggers e policies de profiles), sem alteração
-- ############################################################################

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS
-- ----------------------------------------------------------------------------

-- 4.1 — em auth.users: cria o profile quando a conta nasce
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4.2 — em public.profiles: mantém updated_at
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 5. POLICIES DE profiles (5, todas PERMISSIVE, para o role `authenticated`)
-- ----------------------------------------------------------------------------
-- ⚠️ NÃO EXISTE policy de INSERT: só o trigger insere (DEFINER, ignora RLS).
--    Correto e seguro. Nenhum usuário insere profile direto.
-- ⚠️ NÃO EXISTE policy de DELETE: ninguém apaga nada. Vira bloqueio na F6,
--    quando a exclusão de conta da LGPD entrar.
-- ⚠️ NÃO EXISTE policy que deixe ADMIN COMUM ler profiles: só o dono e o
--    master. O painel admin só funciona hoje porque /api/admin/* usa
--    SERVICE_ROLE, que ignora RLS. O DL-045 exige admin comum na fila de
--    validação, então a 0002 precisa de is_admin() + policies próprias.

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_select_all_master on public.profiles
  for select to authenticated
  using (is_master_admin());

create policy profiles_update_all_master on public.profiles
  for update to authenticated
  using (is_master_admin())
  with check (is_master_admin());

-- ⚠️ SUPERADA pela policy seguinte. Comparação direta `admin_level = (subselect)`
-- resolve para NULL quando os dois lados são NULL, e CHECK que dá NULL é tratado
-- como falso. Resultado: o usuário com admin_level NULL não conseguia editar o
-- próprio perfil. Foi por isso que a `_safe_fields` foi criada.
-- Marcada para remoção na 0002 (é estritamente MENOS permissiva que a outra,
-- e policies permissivas se somam por OU, então removê-la não muda nada).
create policy profiles_update_own_safe on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role        = (select p.role        from public.profiles p where p.id = auth.uid())
    and admin_level = (select p.admin_level from public.profiles p where p.id = auth.uid())
    and admin_team  = (select p.admin_team  from public.profiles p where p.id = auth.uid())
  );

-- ✅ A que de fato vale. Fixa role/admin_level/admin_team nos valores atuais,
-- com COALESCE para tratar NULL corretamente. O dono edita full_name, phone e
-- onboarding_completed, mas NÃO consegue escalar privilégio.
-- Este é o padrão a copiar na 0002 para fixar a coluna `status`.
create policy profiles_update_own_safe_fields on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p2.role from public.profiles p2 where p2.id = auth.uid())
    and coalesce(admin_level, 'none'::admin_level)
        = coalesce((select p2.admin_level from public.profiles p2 where p2.id = auth.uid()), 'none'::admin_level)
    and coalesce(admin_team, 'none'::admin_team)
        = coalesce((select p2.admin_team from public.profiles p2 where p2.id = auth.uid()), 'none'::admin_team)
  );


-- ############################################################################
-- PASSO 5 de 6 — 0002_nucleo.sql, linhas 108-912 (sem o begin/commit dela: a transação é a deste arquivo)
-- ############################################################################



-- ============================================================================
-- 0. O QUE ESTA MIGRATION REMOVE (leia antes de rodar)
-- ============================================================================
-- Esta migration é aditiva EXCETO por três remoções deliberadas. Todas as três
-- têm o SQL de recriação na seção 11, e nenhuma delas apaga dado de usuário.
--
--   a) function current_user_role()   — SECURITY INVOKER sem search_path,
--      consulta profiles. Usar isso numa policy de profiles é recursão infinita
--      de RLS: o bug do DL-014 que já derrubou este banco. Verificado: não é
--      usada por nenhuma policy nem por nenhuma linha do app.
--
--   b) function is_admin_master()     — duplicata byte a byte de
--      is_master_admin(). Verificado: não é usada por nada. Risco R-005.
--
--   c) policy profiles_update_own_safe — superada por
--      profiles_update_own_safe_fields, que trata NULL corretamente. Policies
--      permissivas se somam por OU, então manter a antiga seria PERIGOSO agora:
--      o WITH CHECK dela não menciona `status`, e uma linha com status alterado
--      passaria por ela. Removê-la é requisito de segurança, não faxina.


-- ============================================================================
-- 1. TIPOS NOVOS
-- ============================================================================

create type public.user_status as enum (
  'incomplete',          -- onboarding não terminou
  'pending_validation',  -- documentos em revisão pelo admin
  'active',              -- validado; aparece na busca
  'suspended'            -- suspenso (só master suspende)
);

create type public.contato_canal as enum ('whatsapp', 'telefone', 'agendamento');
-- 'telefone' e 'agendamento' existem para que a integração futura seja aditiva.
-- NENHUM dos dois é usado nos 3 meses. Ver DL-047.


-- ⚠️ A ORDEM DESTAS DUAS SEÇÕES IMPORTA, E JÁ QUEBROU UMA VEZ.
-- As colunas vêm ANTES das funções. `perfil_esta_ativo()` é LANGUAGE sql e
-- consulta `profiles.status`; o Postgres valida o corpo de função sql na hora
-- do CREATE (check_function_bodies), então criá-la antes da coluna existir
-- falha com `column "status" does not exist` e derruba a migration inteira.
-- Descoberto na primeira tentativa real de aplicar, em 26/08/2026: quatro
-- auditorias revisaram a semântica e nenhuma pegou a ordem de execução.

-- ============================================================================
-- 2. profiles.status e profiles.status_motivo
-- ============================================================================
-- NOT NULL com DEFAULT não reescreve a tabela no Postgres 11+.

alter table public.profiles
  add column if not exists status public.user_status not null default 'incomplete';

-- SEC-007: sem isto, o motivo da reprova só existe em `audit_logs`, que é
-- master-only, e o profissional reprovado nunca descobre por que foi reprovado.
alter table public.profiles
  add column if not exists status_motivo text;

comment on column public.profiles.status_motivo is
  'Motivo da última mudança de status, legível pelo próprio usuário. Escrito só por admin_definir_status().';

comment on column public.profiles.status is
  'Estado do usuário. NUNCA escrito pelo próprio usuário: só por admin, via admin_definir_status(). Ver docs/06-PERMISSOES.md §3.';


-- ============================================================================
-- 3. FUNÇÕES DE AUTORIZAÇÃO
-- ============================================================================
-- Toda função usada em policy é SECURITY DEFINER + SET search_path (DL-015).
-- SECURITY DEFINER ignora RLS, que é justamente o que evita a recursão.

-- 3.1 — admin comum OU master. Necessária pelo DL-045: admin comum vê a fila
-- de validação. Hoje NÃO existe policy que deixe admin comum ler profiles, e o
-- painel só funciona porque a API usa SERVICE_ROLE, ignorando RLS.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3.2 — o perfil é publicamente visível? Usada nas policies de leitura PÚBLICA.
-- Precisa ser DEFINER: um visitante anônimo não enxerga profiles pela RLS.
--
-- ⚠️ EXIGE role E status (correção SEC-001). A versão anterior checava só
-- `status`, e como o responsável nasce 'active', qualquer conta de responsável
-- podia inserir uma linha em vet_profiles e aparecer na busca. A matriz §3 manda
-- `role IN ('vet','clinic') AND status='active'`: as DUAS metades.
create or replace function public.perfil_esta_ativo(p_id uuid, p_role public.user_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_id and role = p_role and status = 'active'
  );
$$;

-- 3.3 — o usuário logado tem este role? Guarda os INSERT/UPDATE dos perfis
-- profissionais (correção SEC-001). DEFINER pelo mesmo motivo das outras.
create or replace function public.tem_role(p_role public.user_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = p_role
  );
$$;

-- 3.4 — endurece a trigger de updated_at (faltava search_path)
create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ============================================================================
-- 4. TABELAS NOVAS
-- ============================================================================

-- 4.1 — vet_profiles (1:1 com profiles). Campos espelham o que o onboarding e
-- o editor de perfil já coletam hoje. Nada inventado.
create table public.vet_profiles (
  id                      uuid primary key references public.profiles(id) on delete cascade,
  slug                    text unique,          -- nulo até virar 'active' (F4/S5 define a regra)
  nome_exibicao           text,
  titulo                  text,
  crmv                    text,
  crmv_uf                 text,
  especialidades          text[]      not null default '{}',
  experiencia             text,
  bio                     text,
  cidade                  text,
  estado                  text,
  bairro                  text,
  atende_presencial       boolean     not null default false,
  atende_domiciliar       boolean     not null default false,
  atende_teleorientacao   boolean     not null default false,
  -- ⚠️ whatsapp/telefone/email_contato/documento_path NÃO ficam aqui.
  -- Esta tabela é lida publicamente, e RLS é ROW-level: liberar a linha libera
  -- TODAS as colunas dela. `GET /rest/v1/vet_profiles?select=whatsapp` com a
  -- chave anônima entregaria a base inteira de telefones (correção SEC-002).
  -- Dado sensível vive em `perfil_privado`, que anon nunca lê.
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- 4.2 — clinic_profiles (1:1 com profiles)
create table public.clinic_profiles (
  id                  uuid primary key references public.profiles(id) on delete cascade,
  slug                text unique,
  nome_fantasia       text,
  razao_social        text,
  cnpj                text,
  responsavel_tecnico text,
  endereco            text,
  cep                 text,
  cidade              text,
  estado              text,
  sobre               text,
  servicos            text[]      not null default '{}',
  site                text,              -- público de propósito: é vitrine
  -- contato e documento vivem em `perfil_privado` (correção SEC-002)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 4.2b — perfil_privado: o que NUNCA pode ser lido publicamente
-- Correção SEC-002 e SEC-003. Serve vet e estabelecimento (ambos 1:1 com
-- profiles). O número de telefone é o ativo que a Vetria vende exposição para;
-- deixá-lo legível pela API anônima entregaria a base inteira a um concorrente
-- e anularia o DL-047 antes dele existir.
--
-- O CHECK do documento_path fecha o "deputado confuso" da SEC-003: o caminho
-- tem que começar com o uuid do próprio dono, então ninguém consegue apontar o
-- próprio registro para o documento de outra pessoa e fazer o admin abri-lo.
create table public.perfil_privado (
  id                   uuid primary key references public.profiles(id) on delete cascade,
  whatsapp             text,
  telefone             text,
  email_contato        text,
  documento_path       text,
  documento_enviado_em timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- ⚠️ SEC-015 — regex, não LIKE de prefixo.
  -- `documento_path like id::text || '/%'` parece cobrir, e não cobre:
  -- `<meu-uuid>/../<vitima>/doc.pdf` passa, e o Storage normaliza o `..`.
  -- Um CHECK que parece proteger e não protege é pior que nenhum.
  -- Aqui: <uuid>/ + um nome sem barra e sem ponto + UM ponto + extensão.
  -- `..` não passa porque o primeiro caractere depois da barra tem que ser
  -- alfanumérico, hífen ou sublinhado.
  constraint perfil_privado_documento_do_dono
    check (
      documento_path is null
      -- ⚠️ SEC-026 — extensão por whitelist, não por formato genérico.
      -- `[A-Za-z0-9]{1,8}` aceitava `.svg` e `.html`. O admin abre o documento
      -- pra validar o CRMV, e um SVG com script vira XSS disparado dentro do
      -- painel administrativo, na sessão de quem tem mais poder no sistema.
      -- Amarra com o R-004 (dangerouslyAllowSVG ligado no next.config).
      or documento_path ~ ('^' || id::text || '/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$')
    )
);

-- 4.3 — animais do responsável
-- ⚠️ ADIÇÃO PROPOSTA, não estava no card original da T-001.
-- Motivo: o onboarding do responsável JÁ coleta nome, espécie, idade e peso de
-- um animal (TutorOnboardingForm.tsx) e hoje descarta tudo. Sem esta tabela, o
-- formulário continua mentindo pro usuário. É uma tabela pequena, e criá-la
-- agora evita uma segunda sessão presencial na F3/S2.
-- Se for cortada: apague este bloco e a policy correspondente na seção 6.
-- idade e peso são texto porque os campos do formulário são texto livre.
create table public.animais (
  id          uuid primary key default gen_random_uuid(),
  tutor_id    uuid        not null references public.profiles(id) on delete cascade,
  nome        text        not null,
  especie     text,
  idade       text,
  peso        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4.4 — contatos (DL-047)
-- O clique no WhatsApp é evento de servidor. Funciona ANÔNIMO: quem não tem
-- conta é identificado por anon_id (cookie httpOnly com UUID aleatório, nunca
-- por IP). Se a pessoa criar conta depois, o histórico é vinculado por anon_id.
create table public.contatos (
  id                    uuid primary key default gen_random_uuid(),
  profissional_id       uuid        not null references public.profiles(id) on delete cascade,
  user_id               uuid        references public.profiles(id) on delete set null,
  anon_id               uuid,
  canal                 public.contato_canal not null default 'whatsapp',
  origem_cidade         text,
  origem_especialidade  text,
  created_at            timestamptz not null default now(),
  constraint contatos_tem_origem check (user_id is not null or anon_id is not null)
);

-- 4.5 — audit_logs. Toda ação de admin entra aqui, master incluído (DL-045).
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid        references public.profiles(id) on delete set null,
  acao        text        not null,
  alvo_tipo   text,
  alvo_id     uuid,
  detalhe     jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);


-- ============================================================================
-- 5. TRIGGERS DE updated_at
-- ============================================================================

create trigger trg_vet_profiles_updated_at
  before update on public.vet_profiles
  for each row execute function public.set_updated_at();

create trigger trg_clinic_profiles_updated_at
  before update on public.clinic_profiles
  for each row execute function public.set_updated_at();

-- ⚠️ SEC-016 — a aprovação vale para o DADO que foi aprovado, não para a conta.
-- Sem isto, um veterinário aprovado troca o CRMV por um PATCH e continua no ar,
-- exibindo um registro que ninguém conferiu. A aprovação vira um cheque em
-- branco vitalício.
-- Precisa ser DEFINER: quem dispara é o próprio dono, e a policy do 7.2 impede
-- que ele escreva em `status`.
create or replace function public.revalidar_ao_mudar_dado_sensivel()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  mudou boolean := false;
begin
  if tg_table_name = 'vet_profiles' then
    mudou := (new.crmv is distinct from old.crmv)
          or (new.crmv_uf is distinct from old.crmv_uf)
          or (new.nome_exibicao is distinct from old.nome_exibicao);
  elsif tg_table_name = 'clinic_profiles' then
    mudou := (new.cnpj is distinct from old.cnpj)
          or (new.razao_social is distinct from old.razao_social)
          or (new.nome_fantasia is distinct from old.nome_fantasia);
  -- ⚠️ SEC-023 — o documento é A PROVA, não só um campo.
  -- A versão anterior cobria CRMV e CNPJ, que é o que o público vê, e deixava
  -- de fora justamente o arquivo que sustentou a aprovação. Trocar o documento
  -- depois de aprovado esvazia a validação inteira.
  elsif tg_table_name = 'perfil_privado' then
    mudou := (new.documento_path is distinct from old.documento_path);
  end if;

  -- Admin editando (moderação) não devolve pra fila: ele já está olhando.
  if mudou and not public.is_admin() then
    update public.profiles
    set status = 'pending_validation',
        status_motivo = 'Dado de identificação alterado. O perfil voltou para revisão.',
        updated_at = now()
    where id = new.id and status = 'active';

    -- ⚠️ SEC-027 — sem isto, o admin recebe o perfil de volta na fila e não
    -- sabe POR QUE ele voltou nem o que mudou. Reaprova no automático, e a
    -- revalidação vira teatro. O trigger tem `old` e `new` na mão: usa.
    if found then
      insert into public.audit_logs (actor_id, acao, alvo_tipo, alvo_id, detalhe)
      values (
        auth.uid(),
        'revalidacao_automatica',
        tg_table_name,
        new.id,
        jsonb_build_object('motivo', 'dado de identificacao alterado apos aprovacao')
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_vet_profiles_revalidar
  after update on public.vet_profiles
  for each row execute function public.revalidar_ao_mudar_dado_sensivel();

create trigger trg_clinic_profiles_revalidar
  after update on public.clinic_profiles
  for each row execute function public.revalidar_ao_mudar_dado_sensivel();

create trigger trg_perfil_privado_revalidar
  after update on public.perfil_privado
  for each row execute function public.revalidar_ao_mudar_dado_sensivel();

-- SEC-023 (parte 2): a data de envio é carimbada pelo servidor, nunca aceita do
-- cliente. Sem isto o dono retroage `documento_enviado_em` e some com o rastro
-- de que trocou o arquivo.
create or replace function public.carimbar_envio_documento()
returns trigger
language plpgsql set search_path = public
as $$
begin
  -- ⚠️ SEC-028 — cobrir INSERT também. A versão anterior só tratava UPDATE,
  -- então a PRIMEIRA data de envio, que é a que importa, vinha do cliente e
  -- podia nascer retroagida. `old` não existe no INSERT, daí o TG_OP.
  if tg_op = 'INSERT' then
    new.documento_enviado_em := case when new.documento_path is null then null else now() end;
  elsif new.documento_path is distinct from old.documento_path then
    new.documento_enviado_em := case when new.documento_path is null then null else now() end;
  else
    new.documento_enviado_em := old.documento_enviado_em;
  end if;
  return new;
end;
$$;

create trigger trg_perfil_privado_carimbo
  before insert or update on public.perfil_privado
  for each row execute function public.carimbar_envio_documento();

create trigger trg_perfil_privado_updated_at
  before update on public.perfil_privado
  for each row execute function public.set_updated_at();

create trigger trg_animais_updated_at
  before update on public.animais
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 6. RLS — codifica docs/06-PERMISSOES.md §3
-- ============================================================================

alter table public.vet_profiles    enable row level security;
alter table public.clinic_profiles enable row level security;
alter table public.perfil_privado  enable row level security;
alter table public.animais         enable row level security;
alter table public.contatos        enable row level security;
alter table public.audit_logs      enable row level security;

-- ---------- vet_profiles ----------
-- Leitura pública SÓ de quem é 'vet' E está 'active'. É a regra de visibilidade
-- da busca, dentro do Postgres. As DUAS metades (correção SEC-001).
create policy vet_profiles_select_publico on public.vet_profiles
  for select to anon, authenticated
  using (public.perfil_esta_ativo(id, 'vet'));

create policy vet_profiles_select_own on public.vet_profiles
  for select to authenticated using (id = auth.uid());

create policy vet_profiles_select_admin on public.vet_profiles
  for select to authenticated using (public.is_admin());

-- ⚠️ INSERT exige role='vet' (correção SEC-001). Sem isso, uma conta de
-- responsável inseria a própria linha aqui e, como responsável nasce 'active',
-- aparecia na busca pública com CRMV inventado.
create policy vet_profiles_insert_own on public.vet_profiles
  for insert to authenticated
  with check (id = auth.uid() and public.tem_role('vet') and slug is null);

-- UPDATE do dono: não pode trocar o próprio slug (correção SEC-008, squatting
-- de nome). O slug é definido pelo servidor na F4/S5.
create policy vet_profiles_update_own on public.vet_profiles
  for update to authenticated
  using (id = auth.uid() and public.tem_role('vet'))
  with check (
    id = auth.uid()
    and slug is not distinct from (select v2.slug from public.vet_profiles v2 where v2.id = auth.uid())
  );

-- Admin escreve: moderar bio ofensiva e derrubar perfil fraudulento (DL-045,
-- matriz §3). Sem isto o DoD da F3/S4 não fecha (correção SEC-006).
create policy vet_profiles_update_admin on public.vet_profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- clinic_profiles ----------
create policy clinic_profiles_select_publico on public.clinic_profiles
  for select to anon, authenticated
  using (public.perfil_esta_ativo(id, 'clinic'));

create policy clinic_profiles_select_own on public.clinic_profiles
  for select to authenticated using (id = auth.uid());

create policy clinic_profiles_select_admin on public.clinic_profiles
  for select to authenticated using (public.is_admin());

create policy clinic_profiles_insert_own on public.clinic_profiles
  for insert to authenticated
  with check (id = auth.uid() and public.tem_role('clinic') and slug is null);

create policy clinic_profiles_update_own on public.clinic_profiles
  for update to authenticated
  using (id = auth.uid() and public.tem_role('clinic'))
  with check (
    id = auth.uid()
    and slug is not distinct from (select c2.slug from public.clinic_profiles c2 where c2.id = auth.uid())
  );

create policy clinic_profiles_update_admin on public.clinic_profiles
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- perfil_privado ----------
-- Só o dono e o admin. Anon NUNCA. É onde vive o telefone que a Vetria vende.
create policy perfil_privado_select_own on public.perfil_privado
  for select to authenticated using (id = auth.uid());

create policy perfil_privado_select_admin on public.perfil_privado
  for select to authenticated using (public.is_admin());

-- ⚠️ SEC-032 — guarda de role, e não é preciosismo.
-- Sem ela, uma conta de responsável insere linha aqui; o trigger de revalidação
-- então a coloca em `pending_validation`; e `admin_definir_status` recusa alvo
-- que não seja vet/clinic. A conta fica presa num estado do qual nem o admin
-- tira. Responsável não tem CRMV nem documento: não tem o que fazer nesta
-- tabela. O telefone dele mora em `profiles.phone`.
create policy perfil_privado_insert_own on public.perfil_privado
  for insert to authenticated
  with check (
    id = auth.uid()
    and (public.tem_role('vet') or public.tem_role('clinic'))
  );

create policy perfil_privado_update_own on public.perfil_privado
  for update to authenticated
  using (
    id = auth.uid()
    and (public.tem_role('vet') or public.tem_role('clinic'))
  )
  with check (
    id = auth.uid()
    and (public.tem_role('vet') or public.tem_role('clinic'))
  );

-- ---------- animais ----------
-- Dado privado do responsável. Ninguém mais lê, nem admin.
create policy animais_select_own on public.animais
  for select to authenticated using (tutor_id = auth.uid());

create policy animais_insert_own on public.animais
  for insert to authenticated with check (tutor_id = auth.uid());

create policy animais_update_own on public.animais
  for update to authenticated
  using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());

create policy animais_delete_own on public.animais
  for delete to authenticated using (tutor_id = auth.uid());

-- ---------- contatos ----------
-- Leem: o responsável que originou e o profissional que recebeu. E o admin.
-- NINGUÉM escreve pelo cliente: o registro é feito pelo servidor (DL-047).
-- Sem policy de INSERT = nenhum INSERT pelo anon/authenticated. É intencional.
create policy contatos_select_profissional on public.contatos
  for select to authenticated using (profissional_id = auth.uid());

create policy contatos_select_responsavel on public.contatos
  for select to authenticated using (user_id = auth.uid());

create policy contatos_select_admin on public.contatos
  for select to authenticated using (public.is_admin());

-- ---------- audit_logs ----------
-- Só o master lê. Ninguém escreve pelo cliente: só o servidor.
create policy audit_logs_select_master on public.audit_logs
  for select to authenticated using (public.is_master_admin());

-- ---------- profiles: leitura pelo admin (DL-045) ----------
-- ⚠️ Admin COMUM só enxerga vet e clinic, que é a fila de validação dele.
-- A matriz §5 diz "ver a base inteira: Admin ❌ / Master ✅" (correção SEC-004).
-- O master já lê tudo por `profiles_select_all_master`, que a 0000 criou.
create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (public.is_admin() and role in ('vet', 'clinic'));


-- ============================================================================
-- 7. FIXA `status` CONTRA ESCALADA
-- ============================================================================
-- Sem isto, um veterinário faz `update profiles set status='active'` pelo
-- cliente Supabase e aparece na busca sem validação e sem pagar. É o modelo de
-- negócio inteiro contornado por um UPDATE.

-- 7.1 — remove a policy superada (ver seção 0.c). Ela NÃO menciona `status`,
-- e como policies permissivas se somam por OU, mantê-la anularia o 7.2.
drop policy if exists profiles_update_own_safe on public.profiles;

-- 7.2 — a policy que de fato vale passa a fixar `status` também.
-- Mesmo padrão de COALESCE já usado para admin_level/admin_team.
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
  );


-- ============================================================================
-- 8. AÇÕES DE ADMIN COMO FUNÇÃO GUARDADA
-- ============================================================================
-- Admin NÃO faz UPDATE direto em profiles. Passa por função guardada, pelo
-- mesmo motivo que admin_set_user_access já existe: a autorização fica em UM
-- lugar só, e a trilha de auditoria sai de graça em vez de depender de o
-- desenvolvedor lembrar de escrevê-la.

-- 8.1 — aprovar, reprovar ou mudar o estado de um profissional
create or replace function public.admin_definir_status(
  target_user_id uuid,
  novo_status    public.user_status,
  motivo         text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  status_antigo public.user_status;
  alvo_role     public.user_role;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  select p.status, p.role into status_antigo, alvo_role
  from public.profiles p where p.id = target_user_id;

  if not found then
    raise exception 'usuario nao encontrado';
  end if;

  -- Suspensão é privilégio de master nas DUAS direções (correção SEC-005).
  -- Checar só o destino deixava admin comum REATIVAR conta suspensa pelo master,
  -- desfazendo uma decisão que ele não teria poder de tomar.
  if (novo_status = 'suspended' or status_antigo = 'suspended')
     and not public.is_master_admin() then
    raise exception 'not authorized: suspender ou reativar exige master';
  end if;

  if alvo_role not in ('vet', 'clinic') then
    raise exception 'status so se aplica a vet e clinic';
  end if;

  -- Reprovar devolve ao onboarding. Sem isto o `onboarding_completed` continua
  -- true, o roteamento manda o reprovado pro painel, e ele nunca alcança a tela
  -- onde o `status_motivo` aparece: fica sem saber por que foi reprovado.
  update public.profiles
  set status = novo_status,
      status_motivo = motivo,
      onboarding_completed = case
        when novo_status = 'incomplete' then false
        else onboarding_completed
      end,
      updated_at = now()
  where id = target_user_id;

  insert into public.audit_logs (actor_id, acao, alvo_tipo, alvo_id, detalhe)
  values (
    auth.uid(),
    'definir_status',
    'profile',
    target_user_id,
    jsonb_build_object('de', status_antigo, 'para', novo_status, 'motivo', motivo)
  );
end;
$$;

-- 8.2 — o profissional conclui o onboarding e entra na fila. Quem move de
-- 'incomplete' para 'pending_validation' é o SERVIDOR, não o usuário: a policy
-- do 7.2 impede que ele mexa em status pelo cliente.
create or replace function public.concluir_onboarding_profissional()
returns void
language plpgsql security definer set search_path = public
as $$
declare
  meu_role   public.user_role;
  meu_status public.user_status;
begin
  select p.role, p.status into meu_role, meu_status
  from public.profiles p where p.id = auth.uid();

  if not found then
    raise exception 'not authorized';
  end if;

  if meu_role not in ('vet', 'clinic') then
    raise exception 'apenas vet e clinic passam por validacao';
  end if;

  if meu_status <> 'incomplete' then
    raise exception 'onboarding ja concluido';
  end if;

  update public.profiles
  set status = 'pending_validation',
      onboarding_completed = true,
      updated_at = now()
  where id = auth.uid();
end;
$$;

-- Superfície mínima: só quem está logado chama estas funções.
revoke execute on function public.admin_definir_status(uuid, public.user_status, text) from anon, public;
revoke execute on function public.concluir_onboarding_profissional() from anon, public;
grant  execute on function public.admin_definir_status(uuid, public.user_status, text) to authenticated;
grant  execute on function public.concluir_onboarding_profissional() to authenticated;


-- ============================================================================
-- 9. TRIGGER DE SIGNUP: status coerente desde o nascimento
-- ============================================================================
-- Substitui a versão da 0001, acrescentando `status`. Responsável e admin
-- nascem 'active' (não passam por validação). Vet e clinic nascem 'incomplete'.

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

  insert into public.profiles (id, role, full_name, status)
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
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$function$;


-- ============================================================================
-- 10. MIGRAÇÃO DOS DADOS EXISTENTES (decisão B: nada é apagado)
-- ============================================================================
-- As contas podem ser dos sócios, então apagar está fora de questão.

-- 10.1 — responsáveis e admins não passam por validação
update public.profiles set status = 'active'
where role in ('tutor', 'admin');

-- 10.2 — os profissionais marcados como "onboarding concluído" preencheram um
-- formulário que era CASCA: nada foi persistido. Voltam ao início para refazer.
--
-- ⚠️ CONDICIONAL (correção SEC-012): só mexe em quem NÃO tem linha de perfil.
-- Sem essa condição, reexecutar a migration por engano zeraria o onboarding de
-- profissionais que já tivessem preenchido tudo de verdade.
update public.profiles p
set status = 'incomplete', onboarding_completed = false
where p.role in ('vet', 'clinic')
  and not exists (select 1 from public.vet_profiles    v where v.id = p.id)
  and not exists (select 1 from public.clinic_profiles c where c.id = p.id);

-- 10.3 — normaliza o NULL herdado de /api/admin/set-access (risco R-012)
update public.profiles set admin_level = 'none'::admin_level where admin_level is null;
update public.profiles set admin_team  = 'none'::admin_team  where admin_team  is null;


-- ============================================================================
-- 11. LIMPEZA (ver seção 0)
-- ============================================================================

drop function if exists public.current_user_role();
drop function if exists public.is_admin_master();

-- anon não tem o que fazer chamando função de admin. Elas já se protegem
-- internamente, então isto é defesa em profundidade, não correção de furo.
-- Feito por descoberta em vez de assinatura fixa (correção SEC-010): errar a
-- assinatura no `revoke` faria a migration inteira falhar no último passo e
-- reverter tudo. Assim funciona qualquer que seja a aridade real da função.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as assinatura
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('admin_list_profiles', 'admin_set_user_access')
  loop
    execute format('revoke execute on function %s from anon', f.assinatura);
  end loop;
end $$;

-- ⚠️ SEC-014 — LEIA ANTES DE MEXER AQUI.
-- A tentação é revogar EXECUTE destas funções pra que não sejam chamáveis por
-- RPC. NÃO FAÇA. Expressão de policy é avaliada COMO O USUÁRIO DA CONSULTA, e
-- o SECURITY DEFINER troca o contexto DEPOIS da checagem de EXECUTE, não antes.
-- Revogar de `public` (ou de `anon`) faz a própria policy falhar: a busca
-- pública para de retornar qualquer coisa.
--
-- E o pior: isso é INVISÍVEL em desenvolvimento, porque o dev está sempre
-- logado. Só apareceria em produção, com o site no ar e o visitante anônimo
-- vendo busca vazia.
--
-- Então: tira o grant automático do PUBLIC e concede explicitamente a quem a
-- policy precisa. Superfície mínima sem quebrar nada.
revoke execute on function public.perfil_esta_ativo(uuid, public.user_role) from public;
revoke execute on function public.tem_role(public.user_role)                from public;
revoke execute on function public.is_admin()                                from public;

grant execute on function public.perfil_esta_ativo(uuid, public.user_role) to anon, authenticated;
grant execute on function public.tem_role(public.user_role)                to authenticated;
grant execute on function public.is_admin()                                to authenticated;


-- 11b. GRANTS EXPLÍCITOS (defesa em profundidade)
-- ============================================================================
-- O Supabase concede DML nas tabelas novas a anon e authenticated por default
-- privileges. Hoje só a RLS segura a escrita. Se um dia alguém criar uma policy
-- permissiva demais por engano, o grant faltando é a segunda porta trancada.

revoke insert, update, delete on public.vet_profiles    from anon;
revoke insert, update, delete on public.clinic_profiles from anon;
revoke insert, update, delete on public.animais         from anon;
revoke all                    on public.perfil_privado  from anon;
revoke all                    on public.audit_logs      from anon;
-- só escrita: o master PRECISA do select, senão a policy dele não tem o que exercer
revoke insert, update, delete on public.audit_logs      from authenticated;
revoke insert, update, delete on public.contatos        from anon, authenticated;


-- ============================================================================
-- 12. ÍNDICES
-- ============================================================================

create index idx_profiles_role_status      on public.profiles (role, status);
create index idx_vet_profiles_cidade       on public.vet_profiles (cidade, estado);
create index idx_clinic_profiles_cidade    on public.clinic_profiles (cidade, estado);
create index idx_vet_profiles_especialidades on public.vet_profiles using gin (especialidades);
create index idx_clinic_profiles_servicos  on public.clinic_profiles using gin (servicos);
create index idx_animais_tutor             on public.animais (tutor_id);
create index idx_contatos_profissional     on public.contatos (profissional_id, created_at desc);
create index idx_contatos_user             on public.contatos (user_id) where user_id is not null;
create index idx_contatos_anon             on public.contatos (anon_id) where anon_id is not null;
create index idx_audit_logs_criado         on public.audit_logs (created_at desc);
create index idx_profiles_status_motivo    on public.profiles (status) where status = 'pending_validation';




-- ############################################################################
-- PASSO 6 de 6 — 0003_storage_documentos.sql, linhas 102-1371 (sem begin/commit),
-- com o pré-voo 1.7 (linhas 452-495) substituído. Nada mais mudou.
-- ############################################################################



-- ============================================================================
-- 0. O QUE ESTA MIGRATION REMOVE (leia antes de rodar)
-- ============================================================================
-- Três colunas de `public.clinic_profiles`:
--
--     razao_social · cnpj · responsavel_tecnico
--
-- Elas não são apagadas: a seção 5 COPIA o conteúdo para `perfil_privado`
-- antes, e a seção 10 tem o caminho de volta. Mesmo assim, o backup da etapa 1
-- é obrigatório, porque `drop column` não tem desfazer dentro do Postgres.
--
-- POR QUE MOVER, E NÃO SÓ ESCONDER
-- `clinic_profiles_select_publico` (0002, linha 533) é
-- `for select to anon using (perfil_esta_ativo(id,'clinic'))`. RLS é ROW-level:
-- a policy libera a LINHA INTEIRA. Não existe policy que esconda coluna. Com um
-- único `GET /rest/v1/clinic_profiles?select=cnpj,razao_social,responsavel_tecnico`
-- e a chave anônima, sai um cadastro completo de empresas mais o nome da pessoa
-- física responsável por cada uma. Isso nunca foi decidido por ninguém: ficou
-- por omissão na triagem da SEC-002.
--
-- POR QUE MOVER, E NÃO DEIXAR A COLUNA PARADA NO LUGAR
-- Existe um caminho não destrutivo: `revoke select (cnpj, ...) on
-- clinic_profiles from anon`. Foi descartado. Coluna que continua existindo é
-- coluna que a próxima Server Action volta a preencher, e aí passam a existir
-- duas fontes de verdade para o mesmo dado, uma delas do lado público. O
-- privilégio de coluna também é invisível para quem lê o schema: some numa
-- migration futura sem que ninguém perceba.
--
-- O QUE CONTINUA EM `clinic_profiles`, PÚBLICO POR ORA
--   endereco · cep · cidade · estado · nome_fantasia · sobre · servicos · site
-- A busca por localização depende de cidade e estado. `endereco` e `cep` têm
-- uma pergunta em aberto que a seção 8 registra e NÃO finge ter respondido.
--
-- QUEBRA DE CONTRATO COM CÓDIGO QUE AINDA NÃO EXISTE
-- O card da T-007 manda a Server Action gravar `razao_social`, `cnpj` e
-- `responsavel_tecnico` em `clinic_profiles`. Depois desta migration, esses três
-- vão para `perfil_privado`. O card JÁ foi corrigido em 26/08; se alguém o
-- reabrir, o insert falha com `column "cnpj" of relation "clinic_profiles" does
-- not exist` e vai custar meia hora de procura no lugar errado.


-- ============================================================================
-- 1. PRÉ-VOO — as asserções que param a migration antes de ela mexer em nada
-- ============================================================================
-- Tudo aqui é leitura de catálogo. Nada é alterado nesta seção. Ela existe
-- porque a SEC-017 nasceu de um bloco que dropava coluna ainda referenciada por
-- policy, e porque o banco vive fora do repo (R-006): o que está em produção
-- pode não ser o que a 0002 diz.
--
-- ⚠️ TODA asserção desta seção termina em `raise exception`. Nenhuma avisa.
-- Aviso aqui seria invisível (SEC-035) e, pior, seria uma decisão de segurança
-- tomada pelo arquivo em vez de por um humano.

-- 1.1 — a migration já foi aplicada? E as três colunas estão todas lá?
-- A seção 7 dropa as três sem `if exists`, de propósito. Se só duas
-- existirem, é melhor descobrir aqui, antes de mexer em qualquer coisa, do que
-- no meio do arquivo.
do $preflight$
declare
  encontradas integer;
begin
  select count(*)
  into encontradas
  from pg_attribute
  where attrelid = 'public.clinic_profiles'::regclass
    and attname in ('razao_social', 'cnpj', 'responsavel_tecnico')
    and attnum > 0 and not attisdropped;

  if encontradas = 0 then
    raise exception
      'PARE: nenhuma das tres colunas existe em clinic_profiles. A 0003 ja foi aplicada. Rode supabase/verificar-apos-0003.sql em vez desta migration.';
  end if;

  if encontradas <> 3 then
    raise exception
      'PARE: encontrei % das 3 colunas (razao_social, cnpj, responsavel_tecnico) em clinic_profiles. O schema em producao nao e o que a 0002 descreve — o banco vive fora do repo (R-006). Descubra o que aconteceu antes de rodar.', encontradas;
  end if;
end
$preflight$;

-- 1.2 — ⚠️ A ASSERÇÃO MAIS IMPORTANTE DO ARQUIVO.
-- O modelo de segurança do bucket é "RLS ligada + zero policy". Se
-- `storage.objects` estiver SEM RLS, "zero policy" deixa de significar "ninguém
-- entra" e passa a significar "todo mundo entra": criaríamos um bucket privado
-- de documentos de identidade aberto para a chave anônima, e o arquivo inteiro
-- pareceria correto.
--
-- Se esta asserção levantar, NÃO contorne. `alter table storage.objects enable
-- row level security` exige ser dono da tabela, e o dono é
-- `supabase_storage_admin`, não `postgres`. O caminho é o painel do Supabase
-- (Storage → Policies), e só depois rodar esta migration.
--
-- ⚠️ SEC-035 — `storage.buckets` sem RLS TAMBÉM aborta agora.
-- Na v1 isso era `raise warning`, e warning é invisível no SQL Editor deste
-- projeto: a migration seguiria e ninguém saberia. Buckets sem RLS não expõe
-- ARQUIVO (o arquivo está em `storage.objects`), mas expõe a LISTA de buckets e
-- a configuração deles para qualquer chave. Isso é decisão de humano, não linha
-- para rolar a tela. Se você olhar e concluir que aceita, o caminho é registrar
-- em `docs/05-DECISOES.md` e comentar ESTE bloco, escrevendo por quê.
do $preflight$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects' and c.relrowsecurity
  ) then
    raise exception
      'PARE: storage.objects esta SEM row level security. Criar o bucket agora o deixaria aberto para anon. Ligue a RLS pelo painel do Supabase e rode de novo.';
  end if;

  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'buckets' and c.relrowsecurity
  ) then
    raise exception
      'PARE: storage.buckets esta SEM row level security. Isso nao expoe arquivo, expoe a LISTA e a configuracao dos buckets para qualquer chave. Ligue pelo painel, ou decida por escrito aceitar e comente o pre-voo 1.2 dizendo por que.';
  end if;
end
$preflight$;

-- 1.3 — ⚠️ SEC-034 — ZERO POLICY EM `storage.objects`. PONTO.
-- A v1 abortava só se a policy CITASSE a string `documentos`. Uma policy sem
-- filtro de `bucket_id` alcança TODOS os buckets do projeto e não contém essa
-- string — e é exatamente a forma que o template "New policy" do painel do
-- Supabase gera quando alguém aceita o padrão. Uma policy legada
-- `for select to authenticated using (true)`, criada meses antes para outro
-- bucket, passava invisível: a partir da T-008, qualquer conta logada faria
-- `GET /storage/v1/object/documentos/<uuid-da-vitima>/documento-....pdf` e leria
-- RG, CNH e comprovante de CRMV de toda a base, com a seção 2.a declarando por
-- escrito que a superfície de ataque era zero.
--
-- Uma asserção que roda, passa e não cobre o caso que ela diz cobrir é PIOR que
-- asserção nenhuma: ninguém volta para conferir o que já foi declarado verde.
--
-- ⚠️ ESTADO EM 26/08/2026, CONFERIDO NO BANCO DE PRODUÇÃO:
--   select policyname, cmd, roles, qual, with_check from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';
--   → VAZIO. Zero policy hoje. O cenário de exploração acima NÃO existe no banco
--   atual; este pré-voo é endurecimento, não conserto de exposição ativa. Ele
--   existe para o dia em que alguém criar a primeira policy pelo painel.
--
-- Enquanto `documentos` for o único bucket do projeto, qualquer policy aqui é
-- policy que alcança este bucket. Quando a F4/S7 criar o bucket de foto (que é
-- PÚBLICO e vai querer policy), este pré-voo precisa ser reescrito junto: aí
-- "zero policy" deixa de ser a regra certa e vira "nenhuma policy sem filtro de
-- bucket_id". Está anotado no card da foto de perfil.
do $preflight$
declare
  achados text;
  quantas integer;
begin
  select count(*), string_agg(format('%s [cmd=%s roles=%s]', policyname, cmd, roles::text), '; ')
  into quantas, achados
  from pg_policies
  where schemaname = 'storage' and tablename = 'objects';

  if quantas > 0 then
    raise exception
      'PARE: existem % policy(ies) em storage.objects: %. O modelo desta migration e ZERO policy — e policy SEM filtro de bucket_id alcanca o bucket documentos mesmo sem citar o nome dele. Nao apague nada por conta propria: descubra de quem e e para que serve, decida com o Elber, e so entao rode.', quantas, achados;
  end if;
end
$preflight$;

-- 1.4 — alguma policy, índice, constraint, default, view ou regra referencia as
-- três colunas que a seção 7 vai dropar?
-- Isto varre `pg_depend`, que é onde o Postgres registra dependência de VERDADE.
-- Ele cobre policy, índice, constraint, default, view e materialized view,
-- trigger com `UPDATE OF <col>`, `CREATE STATISTICS` e coluna de publication.
-- NÃO cobre corpo de função: isso é a checagem 1.5, que existe por causa disso.
do $preflight$
declare
  achados text;
begin
  select string_agg(format('%s (oid %s)', d.classid::regclass::text, d.objid), '; ')
  into achados
  from pg_depend d
  where d.refclassid  = 'pg_class'::regclass
    and d.refobjid    = 'public.clinic_profiles'::regclass
    and d.refobjsubid in (
      select a.attnum from pg_attribute a
      where a.attrelid = 'public.clinic_profiles'::regclass
        and a.attname in ('razao_social', 'cnpj', 'responsavel_tecnico')
        and a.attnum > 0 and not a.attisdropped
    );

  if achados is not null then
    raise exception
      'PARE: as colunas a dropar ainda sao referenciadas por: %. Isto e a SEC-017 de novo. Trate cada dependencia ANTES de dropar.', achados;
  end if;
end
$preflight$;

-- 1.5 — corpo de função NÃO é rastreado pelo Postgres.
-- Isto é o buraco perigoso desta migration: `drop column` roda com sucesso
-- mesmo que uma função de trigger referencie a coluna, e a função só quebra no
-- primeiro UPDATE de um usuário de verdade, com `record "new" has no field
-- "cnpj"`, longe daqui e sem relação óbvia com a causa.
--
-- ⚠️ SEC-037 — a v1 varria só `nspname = 'public'`, que é exatamente o buraco
-- que ela declarava tapar: função em `auth`, `storage`, `extensions` ou num
-- schema que alguém criou pelo painel passava livre. Agora varre TODOS os
-- schemas, menos `pg_catalog` e `information_schema` (que são do Postgres e não
-- citam coluna nossa).
--
-- `revalidar_ao_mudar_dado_sensivel` é conhecida, a seção 6 a reescreve, e o
-- pré-voo 1.7 confere o corpo dela: por isso ela está excluída da varredura.
-- Qualquer OUTRA é motivo de parar. Se você ler o corpo da função apontada e
-- concluir que é falso positivo (a palavra aparece num comentário, por
-- exemplo), comente este bloco e escreva no card por quê.
do $preflight$
declare
  achados text;
begin
  select string_agg(format('%s.%s', n.nspname, p.proname), ', ')
  into achados
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname not in ('pg_catalog', 'information_schema')
    and not (n.nspname = 'public' and p.proname = 'revalidar_ao_mudar_dado_sensivel')
    and (p.prosrc like '%razao_social%'
      or p.prosrc like '%cnpj%'
      or p.prosrc like '%responsavel_tecnico%');

  if achados is not null then
    raise exception
      'PARE: estas funcoes citam as colunas que serao dropadas: %. Corpo de funcao nao e rastreado pelo pg_depend: o DROP passa e a funcao quebra depois, em producao. Leia cada uma.', achados;
  end if;
end
$preflight$;

-- 1.6 — ⚠️ SEC-045 — O BUCKET `documentos` JÁ EXISTE?
-- A v1 tinha cinco asserções e nenhuma perguntava isso. Se o bucket existisse —
-- público, com objetos de uma tentativa manual anterior — o `on conflict` da
-- seção 2 o tornava privado e a migration SEGUIA SEM DIZER NADA. O operador
-- terminava a sessão sem saber que existiu um bucket de documentos exposto, por
-- quanto tempo e com o quê dentro. Corrigir sem contar é o que apaga o
-- incidente.
--
-- Agora: se existir, PARA, e imprime o que encontrou (inclusive quantos objetos
-- tem dentro). Quem rodar decide o que fazer com a informação. A migration não
-- decide no escuro.
--
-- ⚠️ ESTADO EM 26/08/2026, CONFERIDO NO BANCO DE PRODUÇÃO:
--   select id, public, file_size_limit, allowed_mime_types from storage.buckets;
--   → VAZIO. O projeto não tem bucket NENHUM, muito menos um `documentos`. A
--   condição perigosa que a SEC-045 descreve (bucket preexistente, possivelmente
--   público, com objeto dentro) NÃO existe hoje, e o `on conflict` da v1 nunca
--   teria disparado. Este pré-voo fica como guarda preventiva: ele vale para a
--   segunda vez que alguém rodar este arquivo, e para o caso de o bucket nascer
--   pelo painel entre a leitura desta linha e a aplicação.
--
-- ⚠️ ISTO TAMBÉM CONSERTA O TERCEIRO PONTO DE ORDEM DO ARQUIVO (SEC-045).
-- Na v1, a reconciliação do bucket acontecia na seção 2 e o `commit` só vinha
-- depois da seção 7: se a guarda da seção 5 ou o DROP levantassem, a transação
-- revertia e o bucket VOLTAVA A SER PÚBLICO, com a única mensagem na tela
-- falando de divergência entre `clinic_profiles` e `perfil_privado`, assunto sem
-- relação nenhuma. Com o bucket sendo CRIADO e nunca reconciliado, reverter a
-- transação apaga o bucket, que é o estado seguro: um bucket que não existe não
-- vaza nada.
--
-- CAMINHO DE ESCAPE, se você criou o bucket pelo painel de propósito (porque
-- `postgres` não tinha INSERT em storage.buckets, por exemplo):
--   1. leia a configuração que a mensagem imprimir e o número de objetos;
--   2. se houver objeto dentro de um bucket que esteve público, isso é
--      incidente: anote em `docs/04-RISCOS.md` antes de qualquer outra coisa;
--   3. comente ESTE bloco e o `insert` da seção 2, e rode, à mão, a
--      reconciliação abaixo, olhando o resultado:
--        update storage.buckets
--        set public = false, file_size_limit = 10485760,
--            allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
--        where id = 'documentos'
--        returning id, public, file_size_limit, allowed_mime_types;
do $preflight$
declare
  b record;
  objetos bigint;
begin
  select id, public, file_size_limit, allowed_mime_types, created_at
  into b
  from storage.buckets
  where id = 'documentos';

  if found then
    select count(*) into objetos from storage.objects where bucket_id = 'documentos';
    raise exception
      'PARE: o bucket documentos JA EXISTE. public=% · file_size_limit=% · allowed_mime_types=% · criado_em=% · objetos_dentro=%. Esta migration CRIA o bucket, ela nao reconcilia em silencio (SEC-045). Se ele esteve publico com objeto dentro, trate como incidente antes de seguir. O caminho de escape esta escrito no comentario do pre-voo 1.6.',
      b.public, b.file_size_limit, b.allowed_mime_types, b.created_at, objetos;
  end if;
end
$preflight$;

-- 1.7 — ⚠️ SEC-037 — O QUE ESTÁ EM PRODUÇÃO É MESMO O QUE A 0002 DEIXOU?
-- Este arquivo inteiro é construído sobre a premissa de que o banco vive fora do
-- repo (R-006). A seção 6 SOBRESCREVE duas funções que já existem. Se alguém as
-- tiver corrigido pelo painel entre a 0002 e hoje, a 0003 apagaria a correção em
-- silêncio, e a reversão da seção 10 restauraria o texto da 0002, não o que
-- estava lá. É o perfil exato da SEC-024, com o alvo trocado.
--
-- Como funciona: compara `md5(pg_proc.prosrc)` com o hash MEDIDO EM PRODUCAO.
--
-- ⚠️ O HASH VEM DO BANCO, NÃO DO ARQUIVO DO REPO. Isto não é preciosismo, é
-- medida: em 26/08/2026 rodamos
--     select md5(prosrc) from pg_proc where proname = 'revalidar_ao_mudar_dado_sensivel';
-- e veio `035f8c64c139f2b6e1865341b4995fb7`, enquanto o mesmo cálculo feito sobre
-- o corpo que está em `0002_nucleo.sql` dá `931ba06d0a23f31d5e0a2fdfe84f16b3`.
-- O corpo em produção FOI LIDO e confere com a 0002 linha a linha, comentários
-- inclusive: a diferença é espaço em branco que se perdeu entre o arquivo e o
-- que o Postgres guardou. Derivar o hash esperado do arquivo faria esta asserção
-- abortar por um motivo que não tem nada a ver com segurança — e asserção que dá
-- falso positivo é asserção que alguém comenta na segunda vez.
--
-- Os dois valores abaixo foram CAPTURADOS EM PRODUÇÃO em 26/08/2026, antes de
-- aplicar:
--   revalidar_ao_mudar_dado_sensivel  035f8c64c139f2b6e1865341b4995fb7
--   carimbar_envio_documento          ec641daea0efa102859b787d364a98ad
--
-- Duas coisas foram confirmadas na mesma leitura do corpo real, e valem citar
-- porque foram medidas e não deduzidas:
--   · o ramo `clinic_profiles` é exatamente `cnpj`, `razao_social`,
--     `nome_fantasia`. `responsavel_tecnico` NÃO está lá (SEC-043 confirmada
--     contra produção, não contra o repo);
--   · o ramo `perfil_privado` é literalmente
--     `new.documento_path is distinct from old.documento_path`. Só a string,
--     nada mais (SEC-033 confirmada contra produção). Isso também valida a ordem
--     da seção 5: a cópia pode mesmo vir antes da troca da função, porque este
--     ramo não olha nenhuma coluna que a cópia toca.
--
-- ⚠️ SEC-050 — O QUE ESTA ASSERÇÃO PROVA, E O QUE ELA NÃO PROVA.
-- Para `revalidar_ao_mudar_dado_sensivel` ela prova alguma coisa, porque além do
-- hash o CORPO foi lido linha a linha contra a 0002 em 26/08/2026 e confere. É a
-- leitura que prova; o hash só congela o que a leitura já validou.
-- Para `carimbar_envio_documento` o hash foi medido no mesmo dia, minutos antes
-- de aplicar, e o corpo NÃO foi lido com o mesmo rigor. Ou seja: para esta
-- segunda função a asserção compara produção com produção, e vale como trava
-- contra alteração FUTURA, não como prova de que ninguém mexeu no passado.
--
-- ⚠️ E QUANDO A 0004 COPIAR ESTA RECEITA: o corpo tem que ser conferido contra
-- `0002_nucleo.sql:453-470`, que é o corpo de ORIGEM. NUNCA contra a seção 6.b
-- desta migration, que é o corpo NOVO e já traz
-- `or new.documento_hash is distinct from old.documento_hash`. Produção TEM que
-- divergir da 6.b — quem comparar com ela ou toma um falso alarme, ou aprende a
-- ignorar a diferença, que é como a SEC-024 volta com uma asserção na frente
-- dizendo que foi conferido.
--
-- SE ABORTAR POR DIVERGÊNCIA: a mensagem imprime o hash encontrado e o corpo
-- inteiro. Leia o corpo. Se for de fato outra coisa, PARE e decida com o Elber o
-- que fazer com a alteração que alguém fez fora do repo. Não comente o bloco.
-- ⚠️ MONTAGEM DO vetria-e2e: ESTE BLOCO SUBSTITUI O PRÉ-VOO 1.7 DA 0003.
-- O original compara md5(prosrc) CRU com o hash medido em PRODUÇÃO em 26/08.
-- Num projeto novo, o texto colado pode diferir por espaço em branco (fim de
-- linha), e o pré-voo abortaria sem nada estar errado. Aqui a comparação é a
-- da 0004: md5 do corpo SEM ESPAÇO EM BRANCO, contra o corpo da 0002 do repo
-- (0002_nucleo.sql:388-436 e :453-470), que este mesmo script acabou de criar.
-- Continua pegando qualquer diferença de CONTEÚDO. O arquivo versionado da
-- 0003 NÃO foi alterado.
do $preflight$
declare
  esperado constant jsonb := jsonb_build_object(
    'revalidar_ao_mudar_dado_sensivel', '67345060efa7cd74eea010d9cc5e01ea',
    'carimbar_envio_documento',         '5b94693ad68fb4d230fa9ca16d899845'
  );
  nome    text;
  achado  text;
  quantas integer;
begin
  for nome in select jsonb_object_keys(esperado) loop
    select count(*) into quantas
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = nome;

    if quantas <> 1 then
      raise exception 'PARE: esperava exatamente 1 funcao public.%, encontrei %.', nome, quantas;
    end if;

    select md5(regexp_replace(p.prosrc, '[[:space:]]+', '', 'g'))
    into achado
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = nome;

    if achado is distinct from (esperado ->> nome) then
      raise exception
        'PARE (montagem e2e): o corpo de public.%() nao e o da 0002 do repo. esperado=% encontrado=% (hash sem espacos).',
        nome, (esperado ->> nome), achado;
    end if;
  end loop;
end
$preflight$;

-- 1.8 — ⚠️ PONTO DE ORDEM NOVO, NASCIDO DAS COLUNAS QUE A v2 ACRESCENTA.
-- A seção 4 cria o CHECK `perfil_privado_documento_completo`: ou os três campos
-- do documento (`documento_path`, `documento_hash`, `documento_tamanho`) estão
-- todos preenchidos, ou os três estão nulos. Documento sem identidade dos bytes
-- é justamente o que a SEC-033 descreve, então "path sozinho" deixa de ser um
-- estado válido da tabela.
--
-- Consequência: se JÁ existir linha com `documento_path` preenchido, as colunas
-- novas nascem NULAS nela e o `add constraint` da seção 4 falha na validação,
-- derrubando a migration inteira com uma mensagem de CHECK que não explica nada.
-- Falha fechada, mas ilegível. Este pré-voo troca isso por uma mensagem que diz
-- o que fazer.
--
-- E não dá para consertar aqui: o sha256 dos bytes exige LER o objeto no bucket,
-- coisa que SQL não faz. É trabalho de um script com `service_role`.
--
-- ESTADO EM 26/08/2026, CONFERIDO NO BANCO: `perfil_privado` tem 0 linhas, logo
-- 0 documentos. Este pré-voo passa trivialmente hoje. Ele existe para o dia em
-- que o banco não estiver vazio — e porque o banco pode não ser o que a doc diz.
do $preflight$
declare
  quantos integer;
  ids     text;
begin
  select count(*), string_agg(id::text, ', ')
  into quantos, ids
  from public.perfil_privado
  where documento_path is not null;

  if quantos > 0 then
    raise exception
      'PARE: % linha(s) de perfil_privado ja tem documento_path e nao tem hash (as colunas nascem agora). O CHECK perfil_privado_documento_completo da secao 4 recusaria essas linhas. Ids: %. Caminho: rode um script com service_role que baixe cada objeto, calcule o sha256 em hex e o tamanho em bytes, grave nas colunas novas, e SO ENTAO rode esta migration. Alternativa (pior, e precisa de decisao escrita): criar o CHECK com NOT VALID.',
      quantos, ids;
  end if;
end
$preflight$;


-- ============================================================================
-- 2. O BUCKET `documentos`
-- ============================================================================
-- Privado, 10 MiB, quatro MIME. E NENHUMA POLICY. As três coisas são decisão.
--
-- ---------------------------------------------------------------------------
-- 2.a — POR QUE ZERO POLICY EM `storage.objects`
-- ---------------------------------------------------------------------------
-- O card da T-002 pedia "o dono lê e escreve só dentro do próprio prefixo".
-- Escrever isso como policy de Storage foi descartado pelo Elber em 26/08, e o
-- motivo é a linha 1054 do relatório SEC-2026-08-26:
--
--   o CHECK `perfil_privado_documento_do_dono` valida A STRING GUARDADA NA
--   TABELA, não o objeto que está no bucket.
--
-- Se o cliente escolhesse o nome do arquivo, teríamos duas verdades sobre o
-- mesmo documento (a chave real no bucket e o texto na coluna) e o CHECK viraria
-- teatro: ele aprovaria um caminho que não é o do arquivo. A SEC-015 já mostrou
-- que a diferença entre a string guardada e a string que chega no storage-api é
-- suficiente para vazar o documento de identidade de terceiro.
--
-- Então o caminho é: o SERVIDOR gera o caminho, e só ele alcança o bucket.
--   escrever → `upload(path, bytes)` com service_role, DENTRO da rota (2.b)
--   ler      → `createSignedUrl(path, expiresIn)` com service_role, no servidor
--
-- `service_role` tem BYPASSRLS no Postgres do Supabase: ele não precisa de
-- policy nenhuma para alcançar `storage.objects`. `anon` e `authenticated` não
-- têm BYPASSRLS, e com RLS ligada (asserção 1.2) e nenhuma policy que os
-- alcance, eles recebem zero linha em leitura e exceção em escrita.
--
-- Sem policy não há bug de policy. É a única superfície deste projeto que pode
-- ter tamanho zero, e ela tem. Depois da decisão da 2.b isso deixou de ser só
-- desenho e virou literal: NENHUM token de escrita chega ao cliente.
--
-- ---------------------------------------------------------------------------
-- 2.b — ⚠️ O CONTRATO DA T-008. LEIA ANTES DE PEGAR A T-008.
-- ---------------------------------------------------------------------------
-- ⚠️ DECISÃO DO ELBER, 26/08/2026 (SEC-036 e SEC-033), tomada ANTES de o bucket
-- existir, que é a única hora em que ela sai barata:
--
--   O ARQUIVO SOBE POR UMA ROTA NOSSA. Não existe URL de upload assinada, e
--   `createSignedUploadUrl` NÃO é usada em lugar nenhum.
--
-- Isso muda três coisas de uma vez, e cada uma fecha um achado:
--   · o servidor tem os BYTES na mão, então a validação de tipo real passa a ser
--     possível (SEC-036 — a "primeira porta" passa a existir de verdade);
--   · nenhum token de escrita chega ao cliente, então não há token para guardar
--     e reusar depois da aprovação (SEC-033, primeiro vetor);
--   · o servidor calcula o sha256 dos bytes que ele mesmo escreveu, e grava na
--     linha (SEC-033, o vetor que sobra: trocar os bytes tem que mover uma
--     coluna que o trigger vigia).
--
-- O custo, escrito para ninguém se surpreender: até 10 MiB trafegam pela função
-- do Next.js em cada envio. É aceitável porque é UM arquivo por profissional,
-- uma vez, no onboarding — não é o caminho quente do app.
--
-- ROTA DE ESCRITA (upload), os oito passos, nesta ordem:
--   1. exigir sessão. Sem sessão, 401 antes de ler um byte.
--   2. conferir que o `role` do requisitante é `vet` ou `clinic`. Responsável
--      não tem documento de validação (mesma razão da guarda da SEC-032).
--   3. ler os bytes no servidor, com limite duro de 10485760. Estourou, 413 —
--      e o limite é conferido no servidor ANTES de mandar para o Storage, não
--      só pelo `file_size_limit` do bucket.
--   4. validar o TIPO REAL pela assinatura mágica dos primeiros bytes, NÃO pelo
--      `content-type` declarado. A tabela está na 2.c. Não bateu, 415.
--   5. derivar a extensão do tipo REAL detectado no passo 4. Nunca do nome que
--      veio do navegador, nunca do content-type declarado.
--   6. montar o caminho pela regra da seção 3, com o uuid vindo de `auth.uid()`
--      da sessão — nunca do corpo da requisição. CAMINHO NOVO A CADA ENVIO,
--      e a rota NUNCA escreve num caminho que já existe: sem `upsert`, e se o
--      Storage recusar por colisão, isso é erro, não motivo para sobrescrever.
--   7. escrever no bucket com `service_role`.
--   8. só então gravar a linha: `documento_path`, `documento_hash` (sha256 em
--      hex minúsculo dos MESMOS bytes que foram escritos) e `documento_tamanho`.
--      Os três juntos, num único UPDATE: o CHECK da seção 4 recusa dois de três.
--
--   Se o passo 8 falhar, o objeto fica no bucket sem linha que o aponte. É
--   órfão, e é o lado seguro do erro: ninguém o alcança sem `service_role`.
--   Anote no card da F6 (exclusão de dados) que a varredura de órfãos existe.
--
-- ROTA DE LEITURA (o admin, ou o dono, abrindo o documento), os cinco passos:
--   1. exigir sessão;
--   2. conferir que o `documento_path` pedido é o da PRÓPRIA linha de
--      `perfil_privado` do requisitante, OU que o requisitante é admin;
--   3. nunca aceitar caminho vindo do cliente. O caminho sai da tabela.
--   4. ⚠️ SEC-040 — GRAVAR EM `audit_logs` ANTES de devolver a URL:
--        acao      'documento_visualizado'
--        alvo_tipo 'perfil_privado'
--        alvo_id   o DONO do documento (não o admin)
--        detalhe   jsonb com o caminho e a validade em segundos da URL emitida
--      ⚠️ ESTA GRAVAÇÃO SAI PELO `service_role`, no servidor. A 0002 fez
--      `revoke insert, update, delete on public.audit_logs from authenticated`
--      (seção 11b): se a rota tentar gravar com a sessão do admin, recebe
--      `permission denied for table audit_logs` e a trilha some junto com o
--      erro. O master precisa do SELECT, e é só isso que ele tem.
--      Antes, não depois: se a emissão falhar no meio, o que interessa saber é
--      que alguém pediu. A `0002` já dá trilha automática a toda ação de admin
--      (`admin_definir_status` grava sozinha, e a SEC-027 fez o mesmo pela
--      revalidação). A leitura do documento de identidade de um terceiro é o
--      acesso mais sensível que este sistema tem, e era o único fora dessa
--      disciplina. "Quem abriu o RG do fulano em março?" é a primeira pergunta
--      de qualquer incidente com documento, e a Vetria vai ter dois ou três
--      admins operando a fila (R-014).
--   5. só então `createSignedUrl` com expiração curta.
--
--   O passo 2 é a autorização inteira. Se ele for esquecido, a rota vira o
--   "deputado confuso" da SEC-003 com outro nome.
--
-- ⚠️ O DONO NÃO LÊ MAIS O PRÓPRIO DOCUMENTO DIRETO DO STORAGE. Nem com sessão
-- válida, nem com o SDK do navegador: `supabase.storage.from('documentos')`
-- chamado do cliente devolve vazio ou erro, sempre, inclusive para o dono. Isso
-- não contraria a matriz (docs/06-PERMISSOES.md linha 75 diz "só o dono e
-- admin/master, por URL assinada de vida curta"): muda ONDE a regra é aplicada,
-- do Postgres para a rota de servidor.
--
-- ⚠️ E O 404 MUDO NA FILA DO ADMIN (SEC-033, segundo efeito): se o caminho
-- apontar para objeto que não existe, a rota de leitura devolve uma mensagem
-- dizendo isso, e a tela de validação mostra "documento não encontrado no
-- armazenamento" com o caminho. Não pode ser 404 sem explicação numa tela cujo
-- trabalho inteiro é abrir aquele arquivo.
--
-- ---------------------------------------------------------------------------
-- 2.c — LIMITE, MIME E A ASSINATURA MÁGICA
-- ---------------------------------------------------------------------------
-- 10 MiB = 10485760 bytes. Foto de documento tirada por celular fica entre 2 e
-- 6 MB; PDF de CRMV escaneado raramente passa de 3 MB. 10 MiB cobre com folga e
-- ainda barra upload de vídeo ou de arquivo de despejo.
--
-- ⚠️ AGORA SÃO QUATRO LISTAS, E ELAS TÊM QUE SER MEXIDAS JUNTAS, SEMPRE.
-- Se divergirem, o arquivo sobe e a linha é recusada, ou o contrário, que é pior:
--   1. `allowed_mime_types` do bucket, aqui embaixo
--   2. a whitelist de EXTENSÃO no CHECK `perfil_privado_documento_do_dono`
--      (0002, correção SEC-026): pdf|jpg|jpeg|png|webp
--   3. a tabela de assinatura mágica da rota (passo 4 da 2.b)
--   4. o limite de bytes: `file_size_limit` aqui e o CHECK de
--      `documento_tamanho` na seção 4
--
-- A TABELA DE ASSINATURA MÁGICA que a rota tem que implementar (passo 4 da 2.b).
-- Confira os PRIMEIROS BYTES do arquivo, não o que o cliente declarou:
--   application/pdf   25 50 44 46 2D                    ("%PDF-")
--   image/jpeg        FF D8 FF
--   image/png         89 50 4E 47 0D 0A 1A 0A
--   image/webp        52 49 46 46 ?? ?? ?? ?? 57 45 42 50   ("RIFF"…"WEBP")
--
-- ⚠️ O QUE MUDOU DA v1, E POR QUE ISSO IMPORTA (SEC-036):
-- A v1 dizia que a validação de MIME do servidor era "a primeira porta" e esta
-- lista, "a segunda". Com URL de upload assinada isso era falso: o byte nunca
-- passava pelo Next.js, o servidor só podia validar uma string que o cliente
-- mandara antes e não era obrigado a repetir no PUT. As duas portas eram a
-- mesma, e era a fraca — o storage-api compara o content-type DECLARADO com esta
-- lista. O arquivo afirmava a primeira e implementava a segunda, e o risco caro
-- não era o vazamento: era a T-008 ser escrita acreditando num controle que não
-- tinha. Com a rota da 2.b, a primeira porta existe: é o passo 4, sobre os bytes.
--
-- ⚠️ E UMA PRECISÃO QUE NINGUÉM DEVE PERDER: depois da decisão da 2.b, a
-- whitelist do bucket deixa de ser defesa contra o USUÁRIO e vira conferência
-- sobre o NOSSO PRÓPRIO CÓDIGO. O storage-api compara o `content-type` que a
-- requisição declara; a partir de agora quem declara é a nossa rota, com o tipo
-- que ela detectou no passo 4. Ou seja: as duas listas continuam existindo e
-- continuam tendo que casar, mas a que barra o atacante é a assinatura mágica,
-- e a do bucket é o cinto que pega o dia em que alguém mexer na rota e esquecer
-- de mexer aqui. Escrever isso evita que a próxima pessoa conte duas portas
-- independentes onde há uma porta e um alarme.
--
-- ⚠️ O QUE O BANCO CONTINUA NÃO SABENDO: nada no Postgres amarra a EXTENSÃO
-- gravada em `documento_path` ao tipo real do objeto. Quem amarra é o passo 5 da
-- rota, em código. O CHECK só sabe dizer que a extensão está na lista.
--
-- ⚠️ O QUE CONTINUA FECHADO, para ninguém reabrir por engano:
-- `image/svg+xml` e `text/html` estão fora das quatro listas, e a URL assinada
-- vive em `*.supabase.co`, origem diferente da do app — então nem um HTML servido
-- de lá rodaria no contexto do painel. O R-004 NÃO REABRE.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos',
  'documentos',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);
-- ⚠️ Sem `on conflict` (SEC-045). Esta migration CRIA o bucket. Se ele já
-- existir, o pré-voo 1.6 já parou tudo e imprimiu a configuração encontrada.
-- Reconciliar em silêncio é o que apaga o incidente; e reconciliar dentro de uma
-- transação que pode reverter mais adiante devolvia um bucket público ao mundo
-- com uma mensagem na tela falando de outro assunto.

-- Cinto e suspensório: se por qualquer motivo o bucket tiver nascido público, é
-- melhor a migration inteira falhar do que existir um bucket PÚBLICO chamado
-- `documentos` no projeto.
do $bucket$
begin
  if exists (select 1 from storage.buckets where id = 'documentos' and public) then
    raise exception 'PARE: o bucket documentos ficou PUBLICO. Nao siga.';
  end if;
end
$bucket$;


-- ============================================================================
-- 3. A REGRA DO NOME DO ARQUIVO (documentação exigida pelo card da T-002)
-- ============================================================================
-- Isto não gera SQL. Está aqui porque hoje não está escrito em lugar nenhum, e
-- quem pegar a T-008 vai errar sem saber por quê: o banco vai recusar a linha
-- com uma violação de CHECK que não explica nada.
--
-- O CHECK que precisa ser satisfeito (0002, `perfil_privado_documento_do_dono`):
--
--     ^<uuid do dono>/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$
--
-- Traduzindo para regra de código:
--
--   1. O caminho tem EXATAMENTE dois segmentos: `<uuid>/<nome>.<ext>`.
--      Uma única barra. Sem subpasta. Sem `..` (o primeiro caractere depois da
--      barra tem que ser letra, número, `_` ou `-`).
--   2. O primeiro segmento é `auth.uid()` do dono, em minúsculas, com hífens,
--      como o Postgres imprime. É o mesmo valor de `perfil_privado.id`.
--   3. O nome do arquivo é GERADO PELO SERVIDOR. O nome que o usuário escolheu
--      NÃO chega ao caminho, nem sanitizado. Ele pode ir para uma coluna de
--      exibição no futuro, nunca para a chave do objeto.
--   4. Caracteres permitidos no nome: A-Z a-z 0-9 `_` `-`. Só isso.
--      Sem acento, sem espaço, sem ponto (o único ponto é o da extensão),
--      sem `+`, sem `%`, sem maiúscula por convenção nossa (a regex aceita,
--      a casa não usa).
--   5. Máximo 120 caracteres no nome, sem contar a extensão.
--   6. Extensão minúscula e de dentro da lista: pdf, jpg, jpeg, png, webp.
--      A extensão tem que ser derivada do TIPO REAL detectado pela assinatura
--      mágica (2.c), nunca copiada do nome que veio do navegador.
--
-- Forma sugerida (a T-008 pode escolher outra, desde que passe na regex):
--
--     <uuid>/documento-<epoch em milissegundos>.<ext>
--     ex.: 3f2a91c4-7b0e-4d51-9a3c-2e8b6d5f4a10/documento-1756240000123.pdf
--
-- ⚠️ O EPOCH NÃO É ENFEITE, E EM MILISSEGUNDOS NÃO É PRECIOSISMO (SEC-033).
-- Ele existe para que CADA ENVIO TENHA UM CAMINHO NOVO, o que torna
-- impossível trocar os bytes de um documento já aprovado sem trocar a string. Em
-- segundos, dois envios no mesmo segundo colidiriam — e o comportamento natural
-- de quem escreve "reenviar arquivo" seria sobrescrever. Em milissegundos a
-- colisão fica implausível, e mesmo assim a regra do passo 6 da 2.b vale: se o
-- caminho já existir, é ERRO, não sobrescrita.
--
-- O caminho antigo NÃO é apagado no reenvio, e isso é de propósito: o admin
-- pode precisar comparar o que foi aprovado com o que chegou depois. A limpeza
-- é assunto da rotina de exclusão da F6 (SEC-039).
--
-- A data que vale continua sendo `perfil_privado.documento_enviado_em`,
-- carimbada pelo trigger `trg_perfil_privado_carimbo`, que cobre INSERT e UPDATE
-- desde a v5 da 0002 (correção SEC-028) e que a seção 6 desta migration passa a
-- disparar TAMBÉM quando o hash muda.
--
-- ⚠️ Nunca monte esse caminho com o uuid vindo do formulário, do corpo da
-- requisição ou de um parâmetro de rota. Só do `auth.uid()` da sessão no
-- servidor. É a diferença entre a SEC-003 estar fechada e estar aberta.


-- ============================================================================
-- 4. AS COLUNAS CHEGAM EM `perfil_privado`
-- ============================================================================
-- `perfil_privado` já tem RLS ligada e as policies já cobrem o `clinic`:
--   select_own   id = auth.uid()
--   select_admin is_admin()
--   insert_own   id = auth.uid() and (tem_role('vet') or tem_role('clinic'))
--   update_own   idem, no USING e no WITH CHECK
-- A guarda de role veio na v5 da 0002 (correção SEC-032) e menciona `clinic`
-- explicitamente. Nenhuma das quatro assume que a tabela é só de contato: todas
-- olham `id` e `role`, nenhuma olha coluna de conteúdo. Colunas novas entram
-- protegidas pelo mesmo conjunto, sem alteração. Conferido linha a linha na
-- 0002 (seções 6 e 11b), e a sonda 13 do arquivo de verificação prova no banco.
--
-- `anon` não tem NENHUM privilégio nesta tabela: a 0002 fez
-- `revoke all on public.perfil_privado from anon` (seção 11b). Não é só falta
-- de policy, é falta de grant. Duas portas.
--
-- ⚠️ O que essas policies NÃO fazem, e a seção 6 passa a fazer: elas deixam uma
-- conta `vet` gravar `cnpj` na própria linha (SEC-044). Ver a guarda 6.c.

alter table public.perfil_privado
  add column if not exists razao_social        text,
  add column if not exists cnpj                text,
  add column if not exists responsavel_tecnico text;

-- ⚠️ SEC-033 — A IDENTIDADE DO OBJETO, e é por isso que estas duas colunas
-- existem. A SEC-023 amarrou a revalidação a UMA STRING (`documento_path`).
-- Reutilizar o mesmo caminho trocava os BYTES sem mudar a string: trigger não
-- disparava, `documento_enviado_em` não se movia (o carimbo só disparava quando
-- a string diferia), e o perfil seguia `active` exibindo um documento que
-- ninguém conferiu — o cheque em branco vitalício da SEC-016 voltando pela porta
-- que esta migration abre.
--
-- A regra que fecha isso é uma frase: TROCAR OS BYTES TEM QUE MOVER UMA COLUNA
-- QUE O TRIGGER VIGIA. Como a rota da 2.b tem os bytes na mão, o sha256 é mais
-- forte e mais barato que qualquer identificador que a gente fosse ler de volta
-- do storage-api.
--
-- O CHECK do formato não é enfeite: sem ele, "hash" vira campo de texto livre e
-- alguém grava 'ok' ali sem perceber que desligou a garantia.
alter table public.perfil_privado
  add column if not exists documento_hash text
    constraint perfil_privado_documento_hash_formato
    check (documento_hash is null or documento_hash ~ '^[a-f0-9]{64}$'),
  add column if not exists documento_tamanho integer
    constraint perfil_privado_documento_tamanho_limite
    check (documento_tamanho is null
        or (documento_tamanho > 0 and documento_tamanho <= 10485760));

-- ⚠️ ALL-OR-NOTHING. Documento sem identidade dos bytes não é estado válido:
-- é exatamente a situação que a SEC-033 descreve. Este CHECK impede a
-- degradação silenciosa em que alguém escreve `documento_path` sozinho e a
-- garantia da coluna nova some sem ninguém notar.
--
-- ⚠️ O limite de 10485760 aqui é a MESMA lista da 2.c, item 4. Se um dia o
-- `file_size_limit` do bucket mudar, este CHECK muda junto, ou a rota vai
-- conseguir escrever o objeto e não vai conseguir gravar a linha.
--
-- O pré-voo 1.8 garante que nenhuma linha existente viola isto. Se ele passou,
-- este `add constraint` não pode falhar.
do $constraint$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.perfil_privado'::regclass
      and conname  = 'perfil_privado_documento_completo'
  ) then
    alter table public.perfil_privado
      add constraint perfil_privado_documento_completo
      check (
        (documento_path is null and documento_hash is null and documento_tamanho is null)
        or
        (documento_path is not null and documento_hash is not null and documento_tamanho is not null)
      );
  end if;
end
$constraint$;

comment on column public.perfil_privado.razao_social is
  'Razão social do estabelecimento. PRIVADA por decisão (SEC-020 / R-018): em MEI e firma individual a razão social carrega o nome civil do dono. Nunca sai para anon. Mexer aqui devolve o perfil para pending_validation.';

comment on column public.perfil_privado.cnpj is
  'CNPJ do estabelecimento. PRIVADO por decisão (SEC-020 / R-018): ser público na Receita não autoriza republicação em massa por terceiro com finalidade própria. Mexer aqui devolve o perfil para pending_validation.';

comment on column public.perfil_privado.responsavel_tecnico is
  'Nome do responsável técnico do estabelecimento. É PESSOA FÍSICA, que pode nem ser a titular da conta e nunca consentiu em virar dado público. PRIVADO por decisão (SEC-020 / R-018). Mexer aqui devolve o perfil para pending_validation.';

comment on column public.perfil_privado.documento_hash is
  'sha256 em hex minúsculo dos bytes do documento, calculado PELA ROTA DE UPLOAD sobre os mesmos bytes que ela escreveu no bucket (SEC-033). É a identidade do objeto: sem ela, trocar o arquivo no mesmo caminho não move nada na linha e o perfil aprovado segue exibindo documento que ninguém conferiu. Mexer aqui devolve o perfil para pending_validation. Nunca aceite este valor do cliente.';

comment on column public.perfil_privado.documento_tamanho is
  'Tamanho do documento em bytes, medido no servidor no momento do upload (SEC-033). Segundo sinal de identidade do objeto e prova de que o limite de 10 MiB foi conferido do lado de cá. O teto do CHECK é o mesmo file_size_limit do bucket: os dois mudam juntos.';


-- ============================================================================
-- 5. CÓPIA DOS DADOS — E A ORDEM AQUI É REQUISITO, NÃO ESTILO
-- ============================================================================
-- ⚠️ ESTA CÓPIA TEM QUE ACONTECER ANTES DA SEÇÃO 6. Não é preferência.
--
-- A seção 6 reescreve `revalidar_ao_mudar_dado_sensivel()` para vigiar `cnpj`,
-- `razao_social` e `responsavel_tecnico` dentro de `perfil_privado`. O
-- `trg_perfil_privado_revalidar` é `after update`. Se a cópia rodasse DEPOIS da
-- troca da função, gravar o CNPJ pela primeira vez seria visto como "o dado de
-- identificação mudou", e todo estabelecimento `active` COM LINHA EM
-- `perfil_privado` sairia do ar no meio da própria migration, com
-- `status = 'pending_validation'` e uma linha em `audit_logs` dizendo que ele
-- mesmo mudou o dado. Ninguém mudou nada: foi a migration.
--
-- ⚠️ Precisão que a auditoria acrescentou: quem NÃO tivesse linha em
-- `perfil_privado` entraria pelo INSERT puro, e o trigger é `after update` — não
-- dispararia. O estrago seria menor do que a v1 deste comentário dizia. A ordem
-- continua sendo requisito; o tamanho do incêndio é que era menor.
--
-- Nesta ordem, a função ainda é a da 0002, cujo ramo de `perfil_privado` olha
-- só `documento_path`. A cópia não toca `documento_path`, então `mudou` é
-- falso e nenhum status se move. Isto foi LIDO NO CORPO REAL EM PRODUÇÃO em
-- 26/08/2026, não deduzido do repo: o ramo é literalmente
-- `new.documento_path is distinct from old.documento_path`, só a string. E o
-- pré-voo 1.7 amarra esse corpo pelo hash, para que continue verdade no dia da
-- aplicação.
--
-- ⚠️ SEGUNDO PONTO DE ORDEM NOVO DA v2: a guarda da SEC-044 (seção 6.c) recusa
-- `cnpj` em linha de conta que não seja `clinic`. Ela é criada DEPOIS desta
-- cópia, de propósito. Se viesse antes, uma linha herdada de um estado
-- inconsistente do banco (clinic_profiles de uma conta que hoje é `vet`)
-- derrubaria a migration inteira, sem caminho de conserto dentro dela. A guarda
-- governa o que for escrito DAQUI PRA FRENTE; o que já está no banco é assunto
-- da guarda de divergência logo abaixo, que mostra o problema a um humano.
--
-- Os outros dois triggers da tabela também foram conferidos contra esta cópia:
--   trg_perfil_privado_carimbo    ramo INSERT, documento_path nulo, grava nulo
--   trg_perfil_privado_updated_at carimba updated_at. Esperado e inofensivo.
--
-- Expectativa honesta, CONFERIDA NO BANCO EM 26/08/2026 (QUERY 0 do backup):
-- `clinic_profiles` 0 · `com_dado_a_migrar` 0 · `perfil_privado` 0 ·
-- `vet_profiles` 0 · `contas_auth` 18 · `profiles` 18. ZERO linha para copiar.
-- A cópia e a guarda abaixo vão operar sobre conjunto vazio e passar
-- trivialmente. Elas ficam assim mesmo: existem para o dia em que o banco não
-- estiver vazio, e para o caso de o banco não ser o que a doc diz (R-006).

insert into public.perfil_privado (id, razao_social, cnpj, responsavel_tecnico)
select c.id, c.razao_social, c.cnpj, c.responsavel_tecnico
from public.clinic_profiles c
where c.razao_social is not null
   or c.cnpj is not null
   or c.responsavel_tecnico is not null
on conflict (id) do update set
  -- `coalesce` com o valor que já está lá: se por algum motivo `perfil_privado`
  -- já tiver conteúdo nessas colunas, o dado que está no destino ganha. Origem
  -- pública nunca sobrescreve destino privado.
  -- Sem qualificar com o schema: dentro do `do update set`, o Postgres só
  -- enxerga a tabela alvo (pelo nome, sem schema) e `excluded`. Escrever
  -- `public.perfil_privado.razao_social` aqui é o tipo de detalhe que faz a
  -- migration falhar no editor por um motivo que não tem nada a ver com o que
  -- ela está tentando fazer.
  razao_social        = coalesce(perfil_privado.razao_social,        excluded.razao_social),
  cnpj                = coalesce(perfil_privado.cnpj,                excluded.cnpj),
  responsavel_tecnico = coalesce(perfil_privado.responsavel_tecnico, excluded.responsavel_tecnico);

-- Prova de que a cópia não perdeu nada. Se sobrar um único par sem
-- correspondência, a migration aborta e o DROP da seção 7 não acontece.
-- É a diferença entre "provavelmente copiou" e "copiou".
--
-- Duas coisas fazem esta checagem levantar, e as duas querem um humano:
--   (a) a cópia não pegou a linha (bug nosso);
--   (b) a linha de `perfil_privado` já tinha um valor DIFERENTE naquela coluna,
--       e o `coalesce` acima preservou o do destino. Aí existem dois valores
--       para o mesmo dado e alguém precisa decidir qual vale. Não é a migration
--       que decide isso no escuro.
--
-- ⚠️ SEC-035 — a v1 terminava este bloco com um `raise notice` dizendo "cópia
-- conferida". Ninguém nunca teria lido: o SQL Editor deste projeto não renderiza
-- NOTICE (confirmado em 26/08). O sinal de que a cópia conferiu é a migration
-- não abortar aqui, mais a coluna `copia_conferida` do select de resultado, no
-- fim do arquivo, que é result set e aparece na tela.
do $copia$
declare
  faltando integer;
begin
  select count(*)
  into faltando
  from public.clinic_profiles c
  left join public.perfil_privado p on p.id = c.id
  where (c.razao_social        is not null and p.razao_social        is distinct from c.razao_social)
     or (c.cnpj                is not null and p.cnpj                is distinct from c.cnpj)
     or (c.responsavel_tecnico is not null and p.responsavel_tecnico is distinct from c.responsavel_tecnico);

  if faltando > 0 then
    raise exception
      'PARE: % linha(s) divergem entre clinic_profiles e perfil_privado (nao copiou, ou o destino ja tinha outro valor). NADA foi dropado, a transacao inteira volta atras. Investigue com a QUERY 1 do backup na mao antes de rodar de novo.', faltando;
  end if;
end
$copia$;


-- ============================================================================
-- 6. OS TRIGGERS ACOMPANHAM AS COLUNAS
-- ============================================================================
-- ⚠️ ESTE É O PONTO MAIS FÁCIL DE ERRAR DA MIGRATION INTEIRA, e ele erra em
-- silêncio nas DUAS direções.
--
-- Direção 1 — se a função continuasse citando `new.cnpj` no ramo de
-- `clinic_profiles` depois do DROP: plpgsql NÃO valida corpo no `create`, e o
-- `drop column` não enxerga a função. Tudo aplica com sucesso. E aí o primeiro
-- estabelecimento que salvar o perfil recebe
-- `record "new" has no field "cnpj"`, e NENHUM update em `clinic_profiles`
-- funciona mais no sistema. O sintoma aparece dias depois, longe daqui.
--
-- Direção 2 — se o ramo de `perfil_privado` não ganhasse as colunas novas: o
-- estabelecimento aprovado troca o CNPJ, o dado agora mora em `perfil_privado`,
-- nada dispara, e ele segue no ar exibindo um cadastro que ninguém conferiu. É
-- a SEC-016 reaberta pela própria correção da SEC-020 — exatamente o padrão que
-- já apareceu quatro rodadas seguidas na auditoria da 0002: o achado novo nasce
-- do encontro de uma correção nova com uma garantia antiga.
--
-- O que a 0002 vigiava, conferido linha a linha no corpo dela (linhas 395-409),
-- amarrado pelo hash (pré-voo 1.7) e — o que importa mais — LIDO NO CORPO REAL
-- QUE ESTÁ EM PRODUÇÃO em 26/08/2026, que confere com a 0002 comentário por
-- comentário. Ninguém a corrigiu pelo painel:
--   vet_profiles     crmv, crmv_uf, nome_exibicao
--   clinic_profiles  cnpj, razao_social, nome_fantasia
--   perfil_privado   documento_path
--
-- ⚠️ DECISÕES QUE O CARD NÃO ESPECIFICAVA, três, todas de endurecimento:
--
--   (i)   `responsavel_tecnico` passa a ser vigiado (SEC-043). Não estava na
--         lista da 0002, e a SEC-016 nomeia os três dados de identificação do
--         estabelecimento COMO CONJUNTO, o que torna a ausência um lapso e não
--         uma decisão. É o veterinário que responde legalmente pelo lugar.
--
--   (ii)  `endereco`, `cep`, `cidade` e `estado` entram no ramo de
--         `clinic_profiles` (SEC-041 item 2). São os quatro campos que o
--         responsável usa para decidir PARA ONDE LEVAR O ANIMAL DOENTE, e sem
--         isso um estabelecimento aprovado muda os quatro e continua `active`.
--         É a SEC-016 em colunas diferentes, com consequência mais direta para o
--         consumidor do que trocar um CRMV.
--
--   (iii) `documento_hash` e `documento_tamanho` entram no ramo de
--         `perfil_privado` (SEC-033). É o ponto inteiro das colunas novas: se o
--         trigger não as vigiar, elas são decoração.
--
-- Se for para reverter qualquer uma, é UMA linha, e todas estão marcadas.
--
-- ⚠️ ASSIMETRIA CONHECIDA, DEIXADA DE PROPÓSITO PARA A PRÓXIMA REVISÃO DECIDIR.
-- `vet_profiles` também tem `cidade`, `estado` e `bairro`, e o argumento do item
-- (ii) — "é por onde o responsável decide para onde levar o animal" — vale igual
-- para o veterinário que atende em domicílio. O ramo do vet NÃO foi mexido aqui
-- porque o achado da SEC-041 é sobre `clinic_profiles`, e alargar a revalidação
-- do vet por conta própria tiraria da busca todo profissional que corrigir o
-- bairro. Fica anotado para o `vetria-seguranca` e para o Elber decidirem; é uma
-- linha em qualquer direção, e não muda nada do que esta migration faz.
--
-- ⚠️ Efeito colateral que a fila do admin vai sentir, e é melhor saber antes:
-- o ramo do clinic ficou mais sensível. Corrigir um CEP digitado errado devolve
-- o perfil para `pending_validation`. É o comportamento desejado (o dado que o
-- consumidor usa mudou), mas o admin da S4 vai ver perfis voltando por motivo
-- pequeno. O `status_motivo` e a linha em `audit_logs` são o que permitem
-- despachar isso rápido; a SEC-027 existe exatamente por causa disso.

-- ---------------------------------------------------------------------------
-- 6.a — a revalidação
-- ---------------------------------------------------------------------------
create or replace function public.revalidar_ao_mudar_dado_sensivel()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  mudou boolean := false;
begin
  if tg_table_name = 'vet_profiles' then
    mudou := (new.crmv is distinct from old.crmv)
          or (new.crmv_uf is distinct from old.crmv_uf)
          or (new.nome_exibicao is distinct from old.nome_exibicao);

  -- ⚠️ 0003 — `cnpj` e `razao_social` SAÍRAM desta tabela. Não os cite aqui:
  -- as colunas não existem mais e o plpgsql só descobre em tempo de execução.
  elsif tg_table_name = 'clinic_profiles' then
    mudou := (new.nome_fantasia is distinct from old.nome_fantasia)
          or (new.endereco is distinct from old.endereco)   -- acréscimo da 0003 (SEC-041)
          or (new.cep is distinct from old.cep)             -- acréscimo da 0003 (SEC-041)
          or (new.cidade is distinct from old.cidade)       -- acréscimo da 0003 (SEC-041)
          or (new.estado is distinct from old.estado);      -- acréscimo da 0003 (SEC-041)

  -- ⚠️ 0003 — o ramo que herdou a vigilância das três colunas.
  -- documento_path é a correção SEC-023 (o documento é A PROVA).
  -- documento_hash e documento_tamanho são a SEC-033: trocar os BYTES tem que
  -- mover uma coluna vigiada, senão o caminho continua o mesmo e nada dispara.
  -- cnpj e razao_social vieram de clinic_profiles junto com o dado.
  -- responsavel_tecnico é acréscimo desta migration (ver nota (i) acima).
  elsif tg_table_name = 'perfil_privado' then
    mudou := (new.documento_path is distinct from old.documento_path)
          or (new.documento_hash is distinct from old.documento_hash)        -- acréscimo da 0003 (SEC-033)
          or (new.documento_tamanho is distinct from old.documento_tamanho)  -- acréscimo da 0003 (SEC-033)
          or (new.cnpj is distinct from old.cnpj)
          or (new.razao_social is distinct from old.razao_social)
          or (new.responsavel_tecnico is distinct from old.responsavel_tecnico);  -- acréscimo da 0003 (SEC-043)
  end if;

  -- Admin editando (moderação) não devolve pra fila: ele já está olhando.
  if mudou and not public.is_admin() then
    update public.profiles
    set status = 'pending_validation',
        status_motivo = 'Dado de identificação alterado. O perfil voltou para revisão.',
        updated_at = now()
    where id = new.id and status = 'active';

    -- SEC-027: a fila precisa saber POR QUE o perfil voltou.
    if found then
      insert into public.audit_logs (actor_id, acao, alvo_tipo, alvo_id, detalhe)
      values (
        auth.uid(),
        'revalidacao_automatica',
        tg_table_name,
        new.id,
        jsonb_build_object('motivo', 'dado de identificacao alterado apos aprovacao')
      );
    end if;
  end if;

  return new;
end;
$$;

-- Os três triggers da 0002 continuam existindo e apontando para esta função.
-- `create or replace function` troca o corpo sem tocar nos triggers: nada a
-- recriar aqui, e recriá-los seria erro (duplicaria o disparo).

-- ---------------------------------------------------------------------------
-- 6.b — o carimbo da data de envio passa a olhar os bytes, não só o caminho
-- ---------------------------------------------------------------------------
-- ⚠️ SEC-033, a parte que ninguém vê. O relatório descreve o sintoma completo:
-- "o admin vê um documento que ninguém conferiu, COM CARIMBO DE DATA DA
-- CONFERÊNCIA QUE ACONTECEU SOBRE O ARQUIVO ANTIGO". A revalidação (6.a) já
-- devolve o perfil para a fila quando o hash muda; sem esta linha, o admin
-- receberia o perfil de volta com uma data de envio que mente.
--
-- A mudança é uma condição a mais no ramo de UPDATE. O ramo de INSERT (correção
-- SEC-028, que é o que impede a PRIMEIRA data de nascer retroagida vinda do
-- cliente) fica exatamente como estava.
--
-- ⚠️ ESTA FUNÇÃO CONTINUA `security invoker`, DE PROPÓSITO, e é a única do
-- arquivo que não é DEFINER. A regra do DL-014/015 existe para função USADA
-- DENTRO DE POLICY: lá, INVOKER causa recursão infinita e derruba o banco. Esta
-- não aparece em policy nenhuma, não consulta tabela nenhuma e só escreve em
-- campos do próprio `new`. Promovê-la a DEFINER daria a ela o privilégio do dono
-- do schema sem necessidade nenhuma, e mudaria em silêncio uma decisão que a
-- 0002 tomou. O `set search_path = public`, que é a metade que de fato impede
-- sequestro de resolução de nome, continua onde estava.
create or replace function public.carimbar_envio_documento()
returns trigger
language plpgsql set search_path = public
as $$
begin
  -- ⚠️ SEC-028 — cobrir INSERT também. A versão anterior só tratava UPDATE,
  -- então a PRIMEIRA data de envio, que é a que importa, vinha do cliente e
  -- podia nascer retroagida. `old` não existe no INSERT, daí o TG_OP.
  if tg_op = 'INSERT' then
    new.documento_enviado_em := case when new.documento_path is null then null else now() end;
  -- ⚠️ 0003 / SEC-033 — o `or` do hash é o acréscimo. Sem ele, trocar os bytes
  -- reaproveitando o caminho deixava a data de envio parada na conferência
  -- anterior, e o admin lia uma data que não é a daquele arquivo.
  elsif new.documento_path is distinct from old.documento_path
     or new.documento_hash is distinct from old.documento_hash then
    new.documento_enviado_em := case when new.documento_path is null then null else now() end;
  else
    new.documento_enviado_em := old.documento_enviado_em;
  end if;
  return new;
end;
$$;

-- O trigger `trg_perfil_privado_carimbo` da 0002 continua apontando para esta
-- função. Nada a recriar.

-- ---------------------------------------------------------------------------
-- 6.c — dado de estabelecimento não entra em linha de pessoa física
-- ---------------------------------------------------------------------------
-- ⚠️ SEC-044, e a decisão foi CORRIGIR em vez de aceitar. O motivo está escrito
-- aqui porque a auditoria deixou a escolha em aberto:
--
-- As quatro policies de `perfil_privado` olham `id` e `role`, nunca coluna de
-- conteúdo — o que está certo e é o que faz as colunas novas nascerem protegidas
-- sem alteração nenhuma. O efeito colateral é que a guarda de role da SEC-032
-- ficou MAIS LARGA que o modelo de dados: uma conta `vet` pode gravar `cnpj`,
-- `razao_social` e `responsavel_tecnico` na própria linha. O ramo do trigger é
-- escolhido por `tg_table_name`, não por role, então a revalidação dispara e o
-- veterinário SE DERRUBA DE `active` PARA `pending_validation` sozinho.
--
-- É autoinfligido, e por isso a auditoria classificou como 🟡. Corrigimos assim
-- mesmo, por três razões:
--   1. é o único achado da lista cujo sintoma é um usuário legítimo saindo da
--      busca sem entender por quê. Vira ticket que ninguém do suporte sabe
--      explicar, e some da fila do admin como "perfil que voltou sozinho";
--   2. polui a fila do admin com CNPJ em linha de pessoa física, no exato
--      momento em que a fila está sendo desenhada (S4);
--   3. o conserto é uma função de 12 linhas AGORA. Depois é outra sessão 🔴.
--
-- Falha RUIDOSA, não silenciosa: a alternativa seria zerar os campos no `before`
-- e deixar passar, e aí a T-007 gravaria CNPJ achando que gravou. Um erro que o
-- desenvolvedor vê na primeira execução é mais barato que um dado que some.
--
-- O role conferido é o do DONO DA LINHA (`new.id`), não o do ator: quando um
-- admin editar a linha de um estabelecimento, a checagem tem que continuar
-- valendo sobre o estabelecimento.
--
-- SECURITY DEFINER aqui é necessário e NÃO reabre o DL-014/015: esta função não
-- é usada em policy nenhuma (não há risco de recursão), e ela precisa enxergar
-- `profiles` sem depender da RLS de quem está escrevendo. Se ela lesse `profiles`
-- como invocador e a RLS escondesse a linha, `role_do_dono` viria nulo e a função
-- recusaria uma escrita legítima.
create or replace function public.recusar_dado_de_estabelecimento_em_pessoa_fisica()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  role_do_dono public.user_role;
begin
  -- Caminho normal: linha de contato ou de documento, sem dado de empresa.
  -- Sai antes de consultar `profiles` para não cobrar uma leitura por UPDATE de
  -- telefone, que é o UPDATE mais comum desta tabela.
  if new.cnpj is null and new.razao_social is null and new.responsavel_tecnico is null then
    return new;
  end if;

  select p.role into role_do_dono
  from public.profiles p
  where p.id = new.id;

  if role_do_dono is distinct from 'clinic'::public.user_role then
    raise exception
      'cnpj, razao_social e responsavel_tecnico sao dados de ESTABELECIMENTO, e a conta % tem role %. Gravar esses campos na linha dela dispararia a revalidacao e a tiraria da busca sozinha (SEC-044). Nesta tabela, uma conta vet grava contato e documento.',
      new.id, coalesce(role_do_dono::text, 'desconhecido');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_perfil_privado_dado_de_estabelecimento on public.perfil_privado;
create trigger trg_perfil_privado_dado_de_estabelecimento
  before insert or update on public.perfil_privado
  for each row execute function public.recusar_dado_de_estabelecimento_em_pessoa_fisica();


-- ============================================================================
-- 7. AS COLUNAS SAEM DE `clinic_profiles`
-- ============================================================================
-- Só agora. Nesta altura do arquivo: o dado já está copiado e conferido (5), e
-- nenhuma função ainda referencia as colunas (1.5 provou que não havia outra em
-- schema nenhum, 1.7 provou que a conhecida era mesmo a da 0002, e a 6 a
-- tratou). Esta é a ordem que a SEC-017 ensinou a respeitar.
--
-- Sem `cascade`, de propósito. Se sobrou alguma dependência que o pré-voo não
-- pegou, é melhor a migration morrer aqui, com o nome do objeto na mensagem, do
-- que derrubar um objeto em silêncio.

alter table public.clinic_profiles drop column razao_social;
alter table public.clinic_profiles drop column cnpj;
alter table public.clinic_profiles drop column responsavel_tecnico;


-- ============================================================================
-- 8. O QUE CONTINUA PÚBLICO EM `clinic_profiles`, E O QUE AINDA NÃO FOI DECIDIDO
-- ============================================================================
-- A SEC-020 disse, com todas as letras: "a regra é o comentário, não a coluna —
-- toda coluna pública deve ter dito por escrito que quer ser pública". Até aqui
-- só `site` tinha esse comentário. As outras eram públicas por omissão, que é
-- como a SEC-020 nasceu.
--
-- Estas colunas são lidas por `anon` em toda linha `active`, via
-- `clinic_profiles_select_publico`.
--
-- ⚠️ PERGUNTA EM ABERTO, E ESTE ARQUIVO NÃO A RESPONDE (SEC-041 item 1).
-- O comentário de `razao_social` (seção 4) argumenta que em MEI e firma
-- individual a razão social carrega o nome civil do dono, e por isso o campo
-- desce para o privado. O MESMO argumento se aplica a `endereco` e `cep`: no MEI
-- e no profissional que atende em casa, o endereço comercial É o residencial, e
-- nada no schema, no formulário ou no consentimento distingue os dois casos. A
-- v1 deste arquivo usava os dois argumentos em sentidos opostos, na mesma
-- sessão, e chamava isso de decisão.
--
-- É decisão de PRODUTO, não de banco, e ela não bloqueia esta migration. Fica
-- registrada como pergunta em aberto no R-018 e no relatório
-- `docs/relatorios/SEC-2026-08-26-0003.md` (SEC-041). Precisa de resposta escrita
-- em `docs/05-DECISOES.md` ANTES do perfil público da F4/S7, que é quando o dado
-- de fato aparece numa página. Enquanto não houver essa resposta, nenhum
-- comentário deste arquivo deve ser lido como "está resolvido".

comment on column public.clinic_profiles.nome_fantasia is
  'PÚBLICA por decisão. É o nome pelo qual o estabelecimento quer ser encontrado: sem isso não há vitrine. Mudança devolve o perfil para pending_validation (SEC-016).';

comment on column public.clinic_profiles.endereco is
  'PÚBLICA hoje (SEC-020 / R-018): é para onde o responsável leva o animal, e a busca por localização depende dela. ⚠️ PERGUNTA EM ABERTO (SEC-041): em MEI e em quem atende no próprio endereço, este é o endereço residencial, e foi esse mesmo argumento que desceu razao_social para perfil_privado. Decisão de produto, ainda não tomada, e obrigatória antes do perfil público da F4/S7. Mudança devolve o perfil para pending_validation (SEC-041).';

comment on column public.clinic_profiles.cep is
  'PÚBLICA hoje (SEC-020 / R-018), mesmo motivo do endereço, e a MESMA pergunta em aberto (SEC-041): CEP de MEI é frequentemente o CEP da casa. Não trate como decidido. Mudança devolve o perfil para pending_validation.';

comment on column public.clinic_profiles.cidade is
  'PÚBLICA por decisão. É o filtro principal da busca (docs/06-PERMISSOES.md §3). Indexada junto com estado. Mudança devolve o perfil para pending_validation (SEC-041): mudar de cidade depois de aprovado muda o resultado de quem procura socorro perto de casa.';

comment on column public.clinic_profiles.estado is
  'PÚBLICA por decisão. Par de cidade no filtro da busca. Mudança devolve o perfil para pending_validation (SEC-041).';

comment on column public.clinic_profiles.sobre is
  'PÚBLICA por decisão. Texto de vitrine escrito pelo próprio estabelecimento. Sujeita a moderação pelo admin (DL-045). NÃO devolve o perfil para a fila: é texto livre, e moderação é outro caminho.';

comment on column public.clinic_profiles.servicos is
  'PÚBLICA por decisão. É o segundo filtro da busca, depois da localização.';

comment on column public.clinic_profiles.site is
  'PÚBLICA por decisão. É vitrine. (Comentário herdado da 0002.)';

comment on column public.clinic_profiles.slug is
  'PÚBLICA por decisão, e NUNCA escrita pelo dono (SEC-008): a policy de UPDATE a pina. Nula até o perfil virar active; a regra de geração nasce na F4/S5.';

comment on table public.clinic_profiles is
  'Perfil PÚBLICO do estabelecimento: tudo aqui é lido por anon quando o perfil está active. Dado privado (contato, documento, CNPJ, razão social, responsável técnico) mora em perfil_privado. Antes de adicionar coluna aqui, pergunte se o visitante anônimo pode vê-la, e escreva a resposta num comment.';

comment on table public.perfil_privado is
  'Dado do profissional que anon NUNCA lê: contato, documento de validação (caminho, sha256 e tamanho) e, desde a 0003, os dados de identificação do estabelecimento. Só o dono e o admin, e o documento só por rota de servidor com URL assinada. Alterar documento_path, documento_hash, documento_tamanho, cnpj, razao_social ou responsavel_tecnico devolve o perfil para pending_validation.';


-- ============================================================================
-- 9. GRANTS — por que esta seção não executa nada
-- ============================================================================
-- A pergunta foi feita direito, então a resposta merece estar escrita: NÃO,
-- nem `storage.buckets` nem `storage.objects` precisam de grant ou revoke desta
-- migration. E é deliberado que não haja nenhum. Motivos, um a um:
--
--   a) `service_role` NÃO precisa de grant. No Postgres do Supabase ele tem o
--      atributo BYPASSRLS: alcança `storage.objects` independentemente de
--      policy. E, mesmo que não tivesse, o storage-api usa a conexão do DONO das
--      tabelas de `storage`. São duas garantias independentes, e basta uma.
--      ⚠️ MEDIDO EM PRODUÇÃO EM 26/08/2026, e não mais suposto:
--        service_role  true · postgres  true · anon  false · authenticated  false
--      A sonda 4 continua no arquivo de verificação como regressão: o dia em que
--      isso mudar, o desenho inteiro do bucket muda junto.
--
--   b) `anon` e `authenticated` já vêm com DML em `storage.objects` pela
--      instalação do próprio Supabase. Quem os barra é a RLS ligada sem policy
--      que os alcance (asserções 1.2 e 1.3). Grant sem policy não dá acesso
--      nenhum com RLS ligada: não revogar é suficiente.
--
--   c) NÃO revogamos esses grants, e isto é a lição da SEC-014 aplicada:
--      `storage.objects` é UMA tabela compartilhada por TODOS os buckets do
--      projeto. Um revoke aqui, feito pensando no bucket `documentos`, quebra o
--      bucket de foto de perfil que a F4/S7 vai criar — e quebra do jeito pior,
--      com a foto sumindo em produção e a policy do bucket novo parecendo
--      correta. Há um segundo motivo, menos citado: a tabela pertence a
--      `supabase_storage_admin`, e `postgres` provavelmente nem TEM permissão de
--      revogar ali. A tentativa derrubaria a migration inteira.
--
--   d) Nas tabelas do schema `public` também não há nada a fazer. As cinco
--      colunas novas entram em `perfil_privado`, e a 0002 já fez
--      `revoke all on public.perfil_privado from anon` (seção 11b). Grant é por
--      tabela, não por coluna: coluna nova herda o que a tabela tem. Nenhuma
--      permissão nova nasceu com esta migration.
--
-- Se você veio aqui procurando o que revogar: não há. A superfície é zero por
-- construção, e checar isso é o papel das sondas 1 a 4 do arquivo de
-- verificação, que assumem o papel `anon` de verdade em vez de ler o catálogo.


-- ============================================================================
-- 9.b — AVISAR O PostgREST (SEC-038 item 3)
-- ============================================================================
-- O PostgREST guarda o schema em cache. Sem este aviso, ele pode continuar
-- servindo as colunas dropadas por algum tempo depois do commit: a sonda 7A
-- passaria no SQL enquanto a API respondesse outra coisa — e "a API responde
-- outra coisa" é justamente a superfície da SEC-020.
--
-- Dentro da transação, de propósito: NOTIFY só é entregue no commit. Se a
-- migration reverter, o PostgREST não é avisado de uma mudança que não houve.
--
-- Esta linha não existia em nenhum arquivo de `supabase/` até aqui. Toda
-- migration que mexer em coluna, tabela ou função exposta pela API deve terminar
-- com ela.
notify pgrst, 'reload schema';




commit;


-- ############################################################################
-- VERIFICAÇÃO — SÓ LEITURA, DEPOIS DO COMMIT. É o único resultado na tela.
-- ############################################################################
-- Toda linha tem que vir `ok = true`. O esperado de cada uma é o estado de
-- produção depois da 0003, conferido contra os arquivos 0000 a 0003.
select * from (
  -- tabelas, com RLS ligada
  select 1 as ordem, format('tabela public.%s existe com RLS', t.nome) as item,
         coalesce((select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
                    where n.nspname = 'public' and c.relname = t.nome and c.relkind = 'r'), false) as ok
  from (values ('profiles'), ('vet_profiles'), ('clinic_profiles'), ('perfil_privado'),
               ('animais'), ('contatos'), ('audit_logs')) as t(nome)

  -- funções: existem e são SECURITY DEFINER com search_path (DL-014/015)
  union all
  select 2, format('funcao public.%s: DEFINER + search_path=public', f.nome),
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = f.nome and p.prosecdef
                    and coalesce(p.proconfig, '{}'::text[]) && array['search_path=public', 'search_path="public"'])
  from (values ('is_master_admin'), ('is_admin'), ('tem_role'), ('perfil_esta_ativo'),
               ('handle_new_user'), ('admin_definir_status'), ('concluir_onboarding_profissional'),
               ('revalidar_ao_mudar_dado_sensivel'),
               ('recusar_dado_de_estabelecimento_em_pessoa_fisica')) as f(nome)

  -- as que são INVOKER de propósito (0003 §6.b), mas com search_path
  union all
  select 3, format('funcao public.%s: INVOKER com search_path=public', f.nome),
         exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                  where n.nspname = 'public' and p.proname = f.nome and not p.prosecdef
                    and coalesce(p.proconfig, '{}'::text[]) && array['search_path=public'])
  from (values ('set_updated_at'), ('carimbar_envio_documento')) as f(nome)

  -- as que a 0002 removeu não podem existir
  union all
  select 4, 'current_user_role() e is_admin_master() NAO existem (0002 §11)',
         not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                      where n.nspname = 'public' and p.proname in ('current_user_role', 'is_admin_master'))

  -- o trigger do cadastro
  union all
  select 5, 'trigger on_auth_user_created em auth.users',
         exists (select 1 from pg_trigger where tgname = 'on_auth_user_created'
                  and tgrelid = 'auth.users'::regclass and not tgisinternal)

  -- policies: o conjunto exato, por tabela (0000 §5 + 0002 §6 e §7)
  union all
  select 6, format('policies de public.%s: %s esperadas', e.tabela, e.qtd),
         (select count(*) from pg_policies where schemaname = 'public' and tablename = e.tabela) = e.qtd
  from (values ('profiles', 5), ('vet_profiles', 6), ('clinic_profiles', 6), ('perfil_privado', 4),
               ('animais', 4), ('contatos', 3), ('audit_logs', 1)) as e(tabela, qtd)

  union all
  select 7, 'profiles_update_own_safe NAO existe (0002 §7.1)',
         not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
                      and policyname = 'profiles_update_own_safe')

  -- o bucket
  union all
  select 8, 'bucket documentos: privado, 10 MiB, 4 MIME',
         coalesce((select not b.public and b.file_size_limit = 10485760
                          and b.allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
                     from storage.buckets b where b.id = 'documentos'), false)

  union all
  select 9, 'storage.objects: RLS ligada e ZERO policy (0003 §2.a)',
         (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'storage' and c.relname = 'objects')
         and (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects') = 0

  -- as colunas que a 0003 moveu
  union all
  select 10, 'cnpj/razao_social/responsavel_tecnico sairam de clinic_profiles e estao em perfil_privado',
         (select count(*) from information_schema.columns
           where table_schema = 'public' and table_name = 'clinic_profiles'
             and column_name in ('razao_social','cnpj','responsavel_tecnico')) = 0
         and (select count(*) from information_schema.columns
               where table_schema = 'public' and table_name = 'perfil_privado'
                 and column_name in ('razao_social','cnpj','responsavel_tecnico','documento_hash','documento_tamanho')) = 5

  -- anon não alcança perfil_privado nem audit_logs (0002 §11b)
  union all
  select 11, 'anon sem SELECT em perfil_privado e audit_logs',
         not has_table_privilege('anon', 'public.perfil_privado', 'SELECT')
         and not has_table_privilege('anon', 'public.audit_logs', 'SELECT')

  -- enums, com os valores de produção
  union all
  select 12, 'enum user_status = incomplete, pending_validation, active, suspended',
         (select array_agg(e.enumlabel order by e.enumsortorder)::text[] from pg_enum e
           where e.enumtypid = 'public.user_status'::regtype)
         = array['incomplete','pending_validation','active','suspended']
  union all
  select 12, 'enum user_role = tutor, vet, clinic, admin',
         (select array_agg(e.enumlabel order by e.enumsortorder)::text[] from pg_enum e
           where e.enumtypid = 'public.user_role'::regtype)
         = array['tutor','vet','clinic','admin']
) verificacao
order by ordem, item;
