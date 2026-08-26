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

---

## Estado do banco versionado

| Arquivo | O que é | Aplicado em produção |
|---|---|---|
| `0000_baseline.sql` | **Documental.** Registra o schema que já existia, criado direto no dashboard antes desta pasta existir. **Não rodar.** | (já estava) |
| `0001_handle_new_user_role_from_metadata.sql` | Trigger lê role do metadata + hardening | 24/05/2026 |
| `0002_nucleo.sql` | Núcleo de dados: `status`, `vet_profiles`, `clinic_profiles`, `animais`, `contatos`, `audit_logs`, RLS da matriz de permissões | ⏳ pendente |

## Ferramentas de leitura (nunca alteram nada)

- `../introspect.sql` — schema, enums, colunas, RLS, policies, funções, triggers, índices, dados
- `../introspect-funcoes.sql` — corpo das funções e grants, quebrado linha a linha pra não truncar no editor

Rode uma query por vez: o editor do Supabase mostra só o resultado da última.

## Antes de aplicar qualquer migration

1. **Backup do banco.** Sem isso, não roda.
2. Revisão de segurança das policies (agente `vetria-seguranca`).
3. Ler a seção de reversão da própria migration.
4. Depois de aplicar, anotar a data na tabela acima.
