# Migrations — Vetria

SQL **versionado** do banco (Supabase/Postgres). Como ainda não usamos o Supabase CLI,
o fluxo é **manual e controlado**:

1. Cada arquivo `NNNN_descricao.sql` é uma migration **aditiva** (nunca destrutiva sem backup).
2. Aplicar **na ordem** numérica, copiando o conteúdo no **Supabase → SQL Editor** e rodando.
3. Depois de aplicar, anotar aqui embaixo a data em que foi aplicada em produção.
4. Regras de ouro (CONTEXT §7): aditivo, RLS sempre, funções `SECURITY DEFINER` +
   `SET search_path = public` (DL-015), nada de `DROP`/`DELETE` sem procedimento.

> Observação: vários fixes da Sprint 1/2 foram aplicados direto no SQL Editor antes
> desta pasta existir (ex.: `is_master_admin` SECURITY DEFINER — DL-014). Vamos
> reconciliar esses no versionamento conforme formos mexendo.

## Histórico de aplicação

| Arquivo | Aplicado em produção | Obs |
|---|---|---|
| `0001_handle_new_user_role_from_metadata.sql` | 24/05/2026 (Success) | trigger lê role do metadata + hardening |
