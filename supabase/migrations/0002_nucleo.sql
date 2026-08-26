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
--   3. Rode INTEIRA, de uma vez. Ela é uma transação só: ou entra tudo, ou
--      não entra nada.
--   4. DEPOIS, rode `supabase/verificar-apos-0002.sql`, uma sonda por vez.
--
-- Referências: DL-044 a DL-047 · docs/06-PERMISSOES.md · T-001
-- Escrita em: 26/08/2026
--
-- HISTÓRICO DE REVISÃO
--   v1  26/08  primeira versão. REPROVADA na auditoria (SEC-2026-08-26):
--              2 achados 🔴 e 4 🟠. Nunca foi aplicada.
--   v5  26/08  conferência final: APROVADA. Mais dois 🟡 fechados de véspera:
--              SEC-028  o carimbo da data cobria UPDATE e deixava o INSERT, e
--                       a PRIMEIRA data de envio é a que importa. Agora TG_OP.
--              SEC-032  `perfil_privado` não tinha guarda de role: o responsável
--                       inseria linha, o trigger o punha em pending_validation e
--                       admin_definir_status recusava o alvo. A conta ficava
--                       presa num estado do qual nem o admin tirava. Quarta
--                       rodada seguida em que o achado nasce do ENCONTRO de uma
--                       correção nova com um pendente antigo.
--
--   v4  26/08  terceira auditoria: modelo de segurança FECHADO (nenhum caminho
--              de vazamento restante). Os 3 pendentes eram rede de segurança:
--              SEC-024  a REVERSÃO restaurava as policies e esquecia
--                       handle_new_user, que a seção 9 sobrescreve. Depois de
--                       reverter, a coluna some e a função continua inserindo
--                       nela: NINGUÉM MAIS CRIA CONTA, nem por email nem por
--                       Google. Sintoma longe da causa, no meio do incidente.
--              SEC-023  a revalidação cobria CRMV e CNPJ (o que o público vê) e
--                       deixava de fora o DOCUMENTO, que é a prova. Agora o
--                       trigger também cobre perfil_privado, e a data de envio é
--                       carimbada pelo servidor pra não ser retroagida.
--              SEC-025  a verificação continuava verde com a busca pública
--                       quebrada. Virou sonda que assume o papel `anon` de
--                       verdade, em arquivo separado.
--              SEC-026  a regex aceitava .svg e .html: o admin abre o documento
--                       pra validar o CRMV e leva XSS na sessão de maior
--                       privilégio do sistema. Whitelist de extensão.
--              SEC-027  a revalidação automática não entrava em audit_logs, e o
--                       admin recebia o perfil de volta na fila sem saber por
--                       quê. Reaprovação no automático = revalidação de teatro.
--
--   v3  26/08  segunda auditoria: os dois 🔴 confirmados fechados, mas 4 🟠
--              novos, TRÊS DELES NASCIDOS DAS PRÓPRIAS CORREÇÕES da v2:
--              SEC-014  o revoke de EXECUTE em perfil_esta_ativo DESLIGARIA a
--                       busca pública. Expressão de policy é avaliada como o
--                       usuário da consulta, e o SECURITY DEFINER só troca o
--                       contexto DEPOIS da checagem de EXECUTE. Invisível em
--                       dev, porque o dev está sempre logado. Agora revoga de
--                       PUBLIC e concede explicitamente a anon/authenticated.
--              SEC-015  o CHECK do documento ancorava prefixo, não formato:
--                       `<uuid>/../<vitima>/doc.pdf` passava e o Storage
--                       normalizava o `..`. Virou regex de formato.
--              SEC-016  só o slug estava pinado, então um vet aprovado trocava
--                       o CRMV por PATCH e seguia no ar sem revalidação. Trigger
--                       devolve pra pending_validation quando dado de
--                       identificação muda.
--              SEC-017  o bloco de reversão NÃO RODAVA: dropava colunas ainda
--                       referenciadas por policy. Reordenado.
--              Mais: slug bloqueado também no INSERT; audit_logs volta a ser
--              legível pelo master; reprovar devolve onboarding_completed=false
--              pra que o reprovado alcance a tela onde o motivo aparece.
--
--   v2  26/08  primeira correção. Principais mudanças:
--              SEC-001  perfil_esta_ativo() e as policies de INSERT/UPDATE
--                       passam a exigir o ROLE, não só o status. Antes, uma
--                       conta de responsável (que nasce 'active') inseria uma
--                       linha em vet_profiles e aparecia na busca pública.
--              SEC-002  contato e documento saíram de vet_profiles e
--                       clinic_profiles para `perfil_privado`. RLS é ROW-level:
--                       liberar a linha liberava todas as colunas dela, e a API
--                       anônima entregaria a base inteira de telefones.
--              SEC-003  CHECK obriga documento_path a começar com o uuid do
--                       dono, fechando o "deputado confuso".
--              SEC-004  admin comum lê só vet e clinic, não a base inteira.
--              SEC-005  suspender E reativar exigem master.
--              SEC-006  admin passa a poder escrever nos perfis (moderação).
--              SEC-007  status_motivo em profiles, legível pelo reprovado.
--              SEC-008  o dono não troca o próprio slug.
--              SEC-009  funções de policy não são chamáveis por anon.
--              SEC-010  revoke por descoberta de assinatura, não fixo.
--              SEC-012  a migração de dados virou condicional (reexecutável).
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

-- 2.2 — o perfil é publicamente visível? Usada nas policies de leitura PÚBLICA.
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

-- 2.4 — o usuário logado tem este role? Guarda os INSERT/UPDATE dos perfis
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

-- SEC-007: sem isto, o motivo da reprova só existe em `audit_logs`, que é
-- master-only, e o profissional reprovado nunca descobre por que foi reprovado.
alter table public.profiles
  add column if not exists status_motivo text;

comment on column public.profiles.status_motivo is
  'Motivo da última mudança de status, legível pelo próprio usuário. Escrito só por admin_definir_status().';

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


commit;


-- ============================================================================
-- 13. PROCEDIMENTO DE REVERSÃO
-- ============================================================================
-- ⚠️ SEC-017 — A ORDEM AQUI IMPORTA E JÁ ESTAVA ERRADA UMA VEZ.
-- A versão anterior dropava `status` e `status_motivo` enquanto a policy do 7.2
-- ainda os referenciava: sem CASCADE dava erro, com CASCADE derrubava a policy
-- e o `alter policy` seguinte falhava. Reversão que não roda é pior que não ter
-- reversão, porque você só descobre no pior momento possível.
--
-- Ordem correta: primeiro devolve as policies ao estado da 0000 (o que solta a
-- dependência das colunas), depois derruba o resto.
--
-- begin;
--   -- 1) policies primeiro, exatamente como estavam na 0000
--   drop policy if exists profiles_select_admin on public.profiles;
--
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
--   -- 2) funções e triggers
--   drop function if exists public.admin_definir_status(uuid, public.user_status, text);
--   drop function if exists public.concluir_onboarding_profissional();
--   drop function if exists public.revalidar_ao_mudar_dado_sensivel() cascade;
--   drop function if exists public.carimbar_envio_documento() cascade;
--
--   -- 3) tabelas (as policies delas caem junto)
--   drop table if exists public.audit_logs;
--   drop table if exists public.contatos;
--   drop table if exists public.animais;
--   drop table if exists public.perfil_privado;
--   drop table if exists public.clinic_profiles;
--   drop table if exists public.vet_profiles;
--
--   -- 4) só agora as colunas, já sem policy dependendo delas
--   alter table public.profiles drop column if exists status_motivo;
--   alter table public.profiles drop column if exists status;
--
--   -- 4b) ⚠️ SEC-024 — RESTAURAR handle_new_user. NÃO PULE ESTE PASSO.
--   -- A seção 9 é a ÚNICA do arquivo que SOBRESCREVE um objeto que já existia.
--   -- Se a coluna `status` sumir e a função continuar inserindo nela, NINGUÉM
--   -- mais cria conta: nem por email, nem por Google. E o sintoma aparece longe
--   -- da causa, horas depois, no meio do incidente.
--   -- Esta é a versão da migration 0001, sem `status`.
--   create or replace function public.handle_new_user()
--   returns trigger language plpgsql security definer set search_path = public
--   as $function$
--   declare
--     meta_role text := new.raw_user_meta_data ->> 'role';
--   begin
--     insert into public.profiles (id, role, full_name)
--     values (
--       new.id,
--       case
--         when meta_role in ('tutor', 'vet', 'clinic') then meta_role::user_role
--         else 'tutor'::user_role
--       end,
--       coalesce(
--         nullif(new.raw_user_meta_data ->> 'full_name', ''),
--         nullif(new.raw_user_meta_data ->> 'name', '')
--       )
--     )
--     on conflict (id) do nothing;
--     return new;
--   end;
--   $function$;
--
--   -- 5) tipos e funções de autorização, por último
--   drop type     if exists public.contato_canal;
--   drop type     if exists public.user_status;
--   drop function if exists public.perfil_esta_ativo(uuid, public.user_role);
--   drop function if exists public.tem_role(public.user_role);
--   drop function if exists public.is_admin();
-- commit;
--
-- Nota: isto NÃO restaura o `onboarding_completed` dos profissionais alterados
-- na seção 10.2. Para isso, use o backup de `supabase/backups/`. É exatamente
-- por isso que o backup é obrigatório antes de rodar.
--
-- As funções removidas na seção 11 (current_user_role, is_admin_master) estão
-- em `0000_baseline.sql`, seções 3.2 e 3.3.


-- ============================================================================
-- 14. VERIFICAÇÃO PÓS-APLICAÇÃO
-- ============================================================================
-- As sondas de verificação vivem em arquivo separado:
--
--     supabase/verificar-apos-0002.sql
--
-- Estão fora daqui de propósito: misturar migration com verificação no mesmo
-- arquivo faz alguém colar tudo de uma vez e rodar as duas coisas juntas.
--
-- Rode-as DEPOIS de aplicar esta migration, uma por vez. Elas assumem o papel
-- `anon` de verdade e olham o que ele enxerga, em vez de conferir permissões
-- no catálogo. A Sonda 2 é a que pega o erro da SEC-014, que desligaria a busca
-- pública sem aparecer em nenhum teste feito com usuário logado.
