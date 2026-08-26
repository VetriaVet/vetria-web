-- ============================================================================
-- VERIFICAÇÃO APÓS A MIGRATION 0002
--
-- Rode DEPOIS de aplicar `migrations/0002_nucleo.sql`, uma sonda por vez.
-- NENHUMA delas altera dado: as que escrevem estão dentro de transação com
-- `rollback`.
--
-- Por que sondas e não `has_function_privilege`: a versão anterior desta
-- verificação continuava verde com a busca pública quebrada. Verificação que
-- não pode falhar não verifica nada. Estas assumem o papel `anon` de verdade.
-- ============================================================================


-- ####### SONDA 1 — o que o VISITANTE ANÔNIMO consegue ler #######
-- Prova o isolamento. Quatro dos seis números TÊM que ser zero.
begin;
  set local role anon;
  select
    (select count(*) from public.vet_profiles)    as vet_visiveis_ok_ser_0_agora,
    (select count(*) from public.clinic_profiles) as clinic_visiveis_ok_ser_0_agora,
    (select count(*) from public.perfil_privado)  as privado_TEM_QUE_SER_0,
    (select count(*) from public.contatos)        as contatos_TEM_QUE_SER_0,
    (select count(*) from public.audit_logs)      as audit_TEM_QUE_SER_0,
    (select count(*) from public.animais)         as animais_TEM_QUE_SER_0;
rollback;
-- Os dois primeiros são 0 agora porque nenhum profissional está `active` ainda.
-- Os quatro últimos são o teste de vazamento: qualquer valor > 0 é falha grave.


-- ####### SONDA 2 — CONTROLE POSITIVO: a busca pública funciona? #######
-- Esta é a que pega a SEC-014. Ativa um veterinário DENTRO da transação, vira
-- anon, e conta. Tem que retornar 1. Se retornar 0, a busca pública está morta
-- e você só descobriria com o site no ar e um visitante reclamando.
begin;
  update public.profiles set status = 'active'
  where id = (select id from public.profiles where role = 'vet' limit 1);

  insert into public.vet_profiles (id)
  select id from public.profiles where role = 'vet' and status = 'active' limit 1
  on conflict (id) do nothing;

  set local role anon;
  select count(*) as TEM_QUE_SER_1 from public.vet_profiles;
rollback;


-- ####### SONDA 3 — o profissional consegue se auto-aprovar? #######
-- Assume a identidade de um vet e tenta escrever no próprio `status`.
-- Tem que dar 0 linhas afetadas. Se afetar 1, o modelo de negócio caiu.
begin;
  set local role authenticated;
  set local request.jwt.claims to '{"sub":"9350b97e-b081-4dee-9bbd-203194f69e4c","role":"authenticated"}';
  update public.profiles set status = 'active' where id = auth.uid();
  -- olhe o "UPDATE n" no rodapé do editor: TEM QUE SER "UPDATE 0"
rollback;


-- ####### SONDA 4 — o vet enxerga o telefone de outro profissional? #######
-- Tem que ser 0 (ele só lê o próprio).
begin;
  set local role authenticated;
  set local request.jwt.claims to '{"sub":"9350b97e-b081-4dee-9bbd-203194f69e4c","role":"authenticated"}';
  select count(*) as TEM_QUE_SER_0_OU_1_SO_O_PROPRIO from public.perfil_privado;
rollback;


-- ####### SONDA 5 — estado dos dados depois da migração #######
-- Esperado: tutor e admin em 'active'; vet e clinic em 'incomplete'
-- com onboarding_completed = false.
select role, status, onboarding_completed, count(*) as total
from public.profiles
group by role, status, onboarding_completed
order by role, status;


-- ####### SONDA 6 — RLS ativa em TODA tabela nova #######
-- Toda linha tem que vir true. Uma tabela sem RLS é vazamento aberto.
select relname as tabela, relrowsecurity as rls_ativa
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;


-- ####### SONDA 7 — as contas continuam de pé #######
-- Os dois números têm que ser 17 e 17.
select (select count(*) from auth.users)      as contas_auth,
       (select count(*) from public.profiles) as profiles;


-- ####### SONDA 8 — o CHECK do documento barra travessia #######
-- As três primeiras TÊM que ser false, a última true.
select
  '11111111-1111-1111-1111-111111111111/../vitima/doc.pdf'
    ~ '^11111111-1111-1111-1111-111111111111/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$' as travessia_TEM_QUE_SER_false,
  '11111111-1111-1111-1111-111111111111/x.svg'
    ~ '^11111111-1111-1111-1111-111111111111/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$' as svg_TEM_QUE_SER_false,
  E'11111111-1111-1111-1111-111111111111/ok.pdf
../vitima/x.pdf'
    ~ '^11111111-1111-1111-1111-111111111111/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$' as newline_TEM_QUE_SER_false,
  '11111111-1111-1111-1111-111111111111/crmv.pdf'
    ~ '^11111111-1111-1111-1111-111111111111/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$' as valido_TEM_QUE_SER_true;
