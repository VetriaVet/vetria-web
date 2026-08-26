-- ============================================================================
-- VERIFICAÇÃO APÓS A MIGRATION 0002
--
-- Rode DEPOIS de aplicar `migrations/0002_nucleo.sql`, uma sonda por vez.
-- NENHUMA altera dado: as que escrevem estão dentro de transação com `rollback`.
--
-- Por que sondas e não `has_function_privilege`: a versão anterior desta
-- verificação continuava VERDE com a busca pública quebrada. Verificação que
-- não pode falhar não verifica nada. Estas assumem o papel `anon` de verdade.
--
-- ⚠️ Duas sondas ESPERAM ERRO como resultado de sucesso (1B e 1C). Está escrito
-- em cada uma. Erro ali é a prova de que a proteção funcionou.
-- ============================================================================


-- ####### SONDA 1A — o que o anônimo lê nas tabelas que ele PODE consultar ####
-- Os quatro números TÊM que ser 0.
-- (vet e clinic dão 0 porque nenhum profissional está `active` ainda; contatos e
--  animais dão 0 porque a RLS não deixa o anônimo ver linha nenhuma)
begin;
  set local role anon;
  select
    (select count(*) from public.vet_profiles)    as vet_TEM_QUE_SER_0,
    (select count(*) from public.clinic_profiles) as clinic_TEM_QUE_SER_0,
    (select count(*) from public.contatos)        as contatos_TEM_QUE_SER_0,
    (select count(*) from public.animais)         as animais_TEM_QUE_SER_0;
rollback;


-- ####### SONDA 1B — perfil_privado (o telefone) ##############################
-- ✅ SUCESSO = ERRO `permission denied for table perfil_privado`.
-- Se retornar QUALQUER número, inclusive 0, o anônimo alcança a tabela e o
-- revoke da seção 11b não pegou. Aí é falha.
begin;
  set local role anon;
  select count(*) from public.perfil_privado;
rollback;


-- ####### SONDA 1C — audit_logs ##############################################
-- ✅ SUCESSO = ERRO `permission denied for table audit_logs`.
begin;
  set local role anon;
  select count(*) from public.audit_logs;
rollback;


-- ####### SONDA 2 — CONTROLE POSITIVO: a busca pública funciona? #############
-- A mais importante. Ativa um veterinário DENTRO da transação, vira anônimo e
-- conta. TEM QUE RETORNAR 1.
--   0                                          → a leitura pública está morta
--   ERRO "permission denied for function
--   perfil_esta_ativo"                         → a SEC-014 voltou. PARE TUDO.
begin;
  update public.profiles set status = 'active'
  where id = (select id from public.profiles where role = 'vet' limit 1);

  insert into public.vet_profiles (id)
  select id from public.profiles where role = 'vet' and status = 'active' limit 1
  on conflict (id) do nothing;

  set local role anon;
  select count(*) as TEM_QUE_SER_1 from public.vet_profiles;
rollback;


-- ####### SONDA 3 — o profissional consegue se auto-aprovar? #################
-- ⚠️ Esta sonda se AUTOVALIDA. Ela avisa quando ela mesma não testou nada, em
-- vez de dar verde silencioso. Leia o texto que ela devolve, não o "UPDATE n".
--
-- Quando a proteção funciona o resultado é EXCEÇÃO, não "UPDATE 0": o `USING`
-- filtra em silêncio, o `WITH CHECK` levanta. Esperar a coisa errada faria a
-- sonda aprovar um banco quebrado.
do $$
declare
  alvo   uuid;
  antes  public.user_status;
begin
  select p.id, p.status into alvo, antes
  from public.profiles p
  where p.role = 'vet' and p.status <> 'active'
  limit 1;

  if alvo is null then
    raise notice 'SONDA INVALIDA: nao ha vet fora de active para testar. Conserte a sonda, nao interprete o resultado.';
    return;
  end if;

  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', alvo::text, 'role', 'authenticated')::text, true);

    if auth.uid() is distinct from alvo then
      raise notice 'SONDA INVALIDA: auth.uid() nao leu o claim (deu %). Este projeto le request.jwt.claim.sub. Conserte a sonda.', auth.uid();
      return;
    end if;

    update public.profiles set status = 'active' where id = auth.uid();

    if found then
      raise warning 'FALHA GRAVE: o profissional se auto-aprovou. O modelo de negocio caiu.';
    else
      raise notice 'OK (por USING): a RLS filtrou a linha, nenhuma foi afetada.';
    end if;
  exception
    when insufficient_privilege then
      raise notice 'OK: RLS barrou a auto-aprovacao (WITH CHECK levantou). Este e o resultado esperado.';
  end;

  raise exception 'rollback intencional da sonda';
exception
  when others then
    if sqlerrm = 'rollback intencional da sonda' then
      raise notice 'Sonda 3 concluida. Nada foi alterado.';
    else
      raise;
    end if;
end $$;


-- ####### SONDA 4 — o vet enxerga o telefone de OUTRO profissional? ##########
-- ⚠️ A versão anterior desta sonda NÃO PODIA FALHAR: `perfil_privado` está
-- vazia, então contar dava 0 de qualquer jeito. Esta insere a linha de uma
-- vítima dentro da transação, aí sim pergunta.
-- Tem que retornar 0.
begin;
  insert into public.perfil_privado (id, whatsapp)
  select id, '11999999999' from public.profiles
  where role = 'clinic' limit 1
  on conflict (id) do nothing;

  set local role authenticated;
  set local request.jwt.claims to '{"role":"authenticated"}';
  -- sem `sub` válido, auth.uid() é nulo: representa o pior caso, um token
  -- qualquer tentando ler a tabela
  select count(*) as TEM_QUE_SER_0 from public.perfil_privado;
rollback;


-- ####### SONDA 5 — estado dos dados depois da migração ######################
-- Esperado: tutor e admin em 'active'; vet e clinic em 'incomplete' com
-- onboarding_completed = false.
select role, status, onboarding_completed, count(*) as total
from public.profiles
group by role, status, onboarding_completed
order by role, status;


-- ####### SONDA 6 — RLS ativa em TODA tabela ################################
-- Toda linha tem que vir true. Tabela sem RLS é vazamento aberto.
select relname as tabela, relrowsecurity as rls_ativa
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;


-- ####### SONDA 7 — as contas continuam de pé ###############################
-- Os dois números têm que ser 17 e 17.
select (select count(*) from auth.users)      as contas_auth,
       (select count(*) from public.profiles) as profiles;


-- ####### SONDA 8 — o CHECK do documento barra travessia e SVG ##############
-- As quatro primeiras TÊM que ser false, a última true.
select
  '11111111-1111-1111-1111-111111111111/../vitima/doc.pdf'
    ~ '^11111111-1111-1111-1111-111111111111/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$' as travessia_false,
  '11111111-1111-1111-1111-111111111111/x.svg'
    ~ '^11111111-1111-1111-1111-111111111111/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$' as svg_false,
  '11111111-1111-1111-1111-111111111111/x.html'
    ~ '^11111111-1111-1111-1111-111111111111/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$' as html_false,
  E'11111111-1111-1111-1111-111111111111/ok.pdf\n../vitima/x.pdf'
    ~ '^11111111-1111-1111-1111-111111111111/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$' as newline_false,
  '11111111-1111-1111-1111-111111111111/crmv.pdf'
    ~ '^11111111-1111-1111-1111-111111111111/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$' as valido_TEM_QUE_SER_true;


-- ####### SONDA 9 — a que nenhum SQL faz por você ############################
-- `handle_new_user` foi SUBSTITUÍDA pela migration, e o cadastro é o único
-- caminho JÁ EM PRODUÇÃO que ela altera. Nenhuma sonda cobre isso.
--
-- Vá em https://vetriabrasil.com.br/cadastro/veterinario e crie uma conta de
-- teste de verdade. Depois rode:
--
-- select p.id, p.role, p.status, p.onboarding_completed, u.email, p.created_at
-- from public.profiles p join auth.users u on u.id = p.id
-- order by p.created_at desc limit 3;
--
-- Esperado: role 'vet', status 'incomplete', onboarding_completed false.
-- Se a linha NÃO aparecer, o trigger quebrou e ninguém mais cria conta.


-- ============================================================================
-- OPERAÇÃO: aprovar os sócios sem esperar a fila
-- ============================================================================
-- Marília e Durval refazem o onboarding uma vez (o anterior era casca e não
-- salvou nada). Depois ficam em `pending_validation`. Estes comandos aprovam na
-- hora, sem passar pelo painel.

-- 1) Quem está esperando validação
select p.id, p.full_name, p.role, p.status, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.status = 'pending_validation'
order by p.updated_at desc;

-- 2) Aprovar um específico. Pelo SQL Editor você é `postgres`, então
--    `admin_definir_status()` levanta 'not authorized' (auth.uid() é nulo).
--    Para operação manual de dono do banco, use o UPDATE direto:
--
-- update public.profiles
-- set status = 'active', status_motivo = 'Aprovado manualmente (socio).', updated_at = now()
-- where id = 'COLE-O-UUID-AQUI';
--
-- 3) Conferir
-- select id, full_name, role, status from public.profiles
-- where status = 'active' and role in ('vet','clinic');
