-- ============================================================================
-- 0002 — NÚCLEO DE DADOS
--
-- O que faz: cria o núcleo que tira o app da casca. Estados do usuário, perfis
-- profissionais, animais do responsável, registro de contatos e trilha de
-- auditoria. Codifica a matriz de docs/06-PERMISSOES.md dentro do banco.
--
-- ⚠️  ANTES DE RODAR:
--   1. BACKUP do banco de produção. Sem isso, não rode.
--   2. Leia a seção 0 (o que esta migration REMOVE) e a seção 11 (reversão).
--   3. Rode INTEIRA, de uma vez. Ela é uma transação só.
--
-- Referências: DL-044 a DL-047 · docs/06-PERMISSOES.md · T-001
-- Escrita em: 26/08/2026
-- ============================================================================

begin;


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


-- ============================================================================
-- 2. FUNÇÕES DE AUTORIZAÇÃO
-- ============================================================================
-- Toda função usada em policy é SECURITY DEFINER + SET search_path (DL-015).
-- SECURITY DEFINER ignora RLS, que é justamente o que evita a recursão.

-- 2.1 — admin comum OU master. Necessária pelo DL-045: admin comum vê a fila
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

-- 2.2 — o perfil está ativo? Usada nas policies de leitura PÚBLICA dos perfis
-- profissionais. Precisa ser DEFINER: um visitante anônimo não enxerga
-- profiles pela RLS, então a checagem tem que rodar por cima dela.
create or replace function public.perfil_esta_ativo(p_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_id and status = 'active'
  );
$$;

-- 2.3 — endurece a trigger de updated_at (faltava search_path)
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
-- 3. profiles.status
-- ============================================================================
-- NOT NULL com DEFAULT não reescreve a tabela no Postgres 11+.

alter table public.profiles
  add column if not exists status public.user_status not null default 'incomplete';

comment on column public.profiles.status is
  'Estado do usuário. NUNCA escrito pelo próprio usuário: só por admin, via admin_definir_status(). Ver docs/06-PERMISSOES.md §3.';


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
  whatsapp                text,
  telefone                text,
  email_contato           text,
  documento_path          text,                 -- caminho no bucket privado, NUNCA URL pública
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
  whatsapp            text,
  telefone            text,
  email_contato       text,
  site                text,
  documento_path      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
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

create trigger trg_animais_updated_at
  before update on public.animais
  for each row execute function public.set_updated_at();


-- ============================================================================
-- 6. RLS — codifica docs/06-PERMISSOES.md §3
-- ============================================================================

alter table public.vet_profiles    enable row level security;
alter table public.clinic_profiles enable row level security;
alter table public.animais         enable row level security;
alter table public.contatos        enable row level security;
alter table public.audit_logs      enable row level security;

-- ---------- vet_profiles ----------
-- Leitura pública SÓ de quem está 'active'. É a regra de visibilidade da busca,
-- dentro do Postgres, exatamente como manda a matriz. Filtro no cliente não conta.
create policy vet_profiles_select_publico on public.vet_profiles
  for select to anon, authenticated
  using (public.perfil_esta_ativo(id));

create policy vet_profiles_select_own on public.vet_profiles
  for select to authenticated using (id = auth.uid());

create policy vet_profiles_select_admin on public.vet_profiles
  for select to authenticated using (public.is_admin());

create policy vet_profiles_insert_own on public.vet_profiles
  for insert to authenticated with check (id = auth.uid());

create policy vet_profiles_update_own on public.vet_profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------- clinic_profiles ----------
create policy clinic_profiles_select_publico on public.clinic_profiles
  for select to anon, authenticated
  using (public.perfil_esta_ativo(id));

create policy clinic_profiles_select_own on public.clinic_profiles
  for select to authenticated using (id = auth.uid());

create policy clinic_profiles_select_admin on public.clinic_profiles
  for select to authenticated using (public.is_admin());

create policy clinic_profiles_insert_own on public.clinic_profiles
  for insert to authenticated with check (id = auth.uid());

create policy clinic_profiles_update_own on public.clinic_profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

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
create policy profiles_select_admin on public.profiles
  for select to authenticated using (public.is_admin());


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

  -- suspender é privilégio de master (DL-045)
  if novo_status = 'suspended' and not public.is_master_admin() then
    raise exception 'not authorized: suspender exige master';
  end if;

  select p.status, p.role into status_antigo, alvo_role
  from public.profiles p where p.id = target_user_id;

  if not found then
    raise exception 'usuario nao encontrado';
  end if;

  if alvo_role not in ('vet', 'clinic') then
    raise exception 'status so se aplica a vet e clinic';
  end if;

  update public.profiles
  set status = novo_status, updated_at = now()
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

-- 10.2 — os 3 vets e 3 estabelecimentos marcados como "onboarding concluído"
-- preencheram um formulário que era CASCA: nada foi persistido. Voltam ao
-- início para refazer o cadastro, agora de verdade.
update public.profiles
set status = 'incomplete', onboarding_completed = false
where role in ('vet', 'clinic');

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
revoke execute on function public.admin_list_profiles() from anon;
revoke execute on function public.admin_set_user_access(uuid, public.user_role, public.admin_level, public.admin_team) from anon;


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


commit;


-- ============================================================================
-- 13. PROCEDIMENTO DE REVERSÃO
-- ============================================================================
-- Se algo der errado DEPOIS do commit, rode o bloco abaixo. Ele desfaz tudo o
-- que a 0002 criou. NÃO restaura o onboarding_completed dos 6 profissionais:
-- para isso, use o backup. Por isso o backup é obrigatório.
--
-- begin;
--   drop function if exists public.admin_definir_status(uuid, public.user_status, text);
--   drop function if exists public.concluir_onboarding_profissional();
--   drop policy   if exists profiles_select_admin on public.profiles;
--   drop table    if exists public.audit_logs;
--   drop table    if exists public.contatos;
--   drop table    if exists public.animais;
--   drop table    if exists public.clinic_profiles;
--   drop table    if exists public.vet_profiles;
--   alter table   public.profiles drop column if exists status;
--   drop type     if exists public.contato_canal;
--   drop type     if exists public.user_status;
--   drop function if exists public.perfil_esta_ativo(uuid);
--   drop function if exists public.is_admin();
--
--   -- recria a policy removida na 7.1, exatamente como estava
--   create policy profiles_update_own_safe on public.profiles
--     for update to authenticated
--     using (id = auth.uid())
--     with check (
--       id = auth.uid()
--       and role        = (select p.role        from public.profiles p where p.id = auth.uid())
--       and admin_level = (select p.admin_level from public.profiles p where p.id = auth.uid())
--       and admin_team  = (select p.admin_team  from public.profiles p where p.id = auth.uid())
--     );
--
--   -- restaura o WITH CHECK original da policy alterada na 7.2
--   alter policy profiles_update_own_safe_fields on public.profiles
--     with check (
--       id = auth.uid()
--       and role = (select p2.role from public.profiles p2 where p2.id = auth.uid())
--       and coalesce(admin_level, 'none'::admin_level)
--           = coalesce((select p2.admin_level from public.profiles p2 where p2.id = auth.uid()), 'none'::admin_level)
--       and coalesce(admin_team, 'none'::admin_team)
--           = coalesce((select p2.admin_team from public.profiles p2 where p2.id = auth.uid()), 'none'::admin_team)
--     );
--
--   -- as funções removidas na seção 11 estão em 0000_baseline.sql, seções 3.2 e 3.3
-- commit;
