-- 0001 — handle_new_user: role a partir do metadata do signup + hardening
--
-- Contexto: o trigger antigo inseria só o `id` em profiles, então o `role` caía
-- sempre no DEFAULT 'tutor' (a escolha de role do cadastro era ignorada). Além
-- disso a função era SECURITY DEFINER SEM `SET search_path` (gap de hardening, DL-015).
--
-- Decisão (separação tutor/B2B): o tutor (consumidor) é o DEFAULT — quem entra
-- sem role declarado (ex.: login/Google) nasce 'tutor'. Os funis B2B (cadastro
-- de vet/clínica) mandam `role` no metadata do signUp → o trigger honra isso.
-- `admin` NUNCA é aceito via metadata (segurança — admin só é concedido no banco).
--
-- Aditivo e idempotente (CREATE OR REPLACE). Não altera contas existentes —
-- só afeta novos signups. Aplicar no Supabase SQL Editor.

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
