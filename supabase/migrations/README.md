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
| `0002_nucleo.sql` | **26/08/2026** ✅ | núcleo de dados + RLS da matriz de permissões. Verificada por 9 sondas |
| `0003_storage_documentos.sql` | **26/08/2026** ✅ | bucket `documentos` + SEC-020/R-018 + identidade dos bytes. Verificada por 18 sondas |

---

## Estado do banco versionado

| Arquivo | O que é | Aplicado em produção |
|---|---|---|
| `0000_baseline.sql` | **Documental.** Registra o schema que já existia, criado direto no dashboard antes desta pasta existir. **Não rodar.** | (já estava) |
| `0001_handle_new_user_role_from_metadata.sql` | Trigger lê role do metadata + hardening | 24/05/2026 |

| `0002_nucleo.sql` | Núcleo de dados: `status`, `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais`, `contatos`, `audit_logs`, RLS da matriz de permissões | **26/08/2026** ✅ |
| `0003_storage_documentos.sql` | Bucket privado `documentos` (10 MiB, 4 MIME, **zero policy** em `storage.objects`); `razao_social`, `cnpj` e `responsavel_tecnico` descem de `clinic_profiles` para `perfil_privado`; `documento_hash` e `documento_tamanho` amarram a linha aos bytes; `responsavel_tecnico`, `endereco`, `cep`, `cidade` e `estado` entram na revalidação; guarda que impede conta não-`clinic` de gravar dado de estabelecimento | **26/08/2026** ✅ |

> A `0002` substituiu `handle_new_user` (acrescentando `status`). Verificado em produção
> em 26/08/2026 com cadastro real: conta nasce `vet` / `incomplete` / `onboarding_completed=false`.

> A `0003` foi verificada por **18 sondas** (`../verificar-apos-0003.sql`), todas verdes, e pelo
> select de onze colunas da própria migration (seção 9.c): **todas `true`, `copia_linhas = 0`**.
> Duas auditorias: a v1 foi reprovada (SEC-033 a SEC-045), a v2 aprovada
> (`docs/relatorios/SEC-2026-08-26-0003-v2.md`). Decisões em DL-051 a DL-054.

## ⚠️ Estado conhecido das funções — leia antes de escrever a `0004`

O pré-voo de toda migration que **substitua** uma função existente compara `md5(prosrc)` com o
valor esperado, e aborta se divergir. Se divergir, alguém editou a função fora do repo (R-006) e
`create or replace` apagaria essa edição em silêncio — foi assim que a SEC-024 nasceu.

**Estado depois da `0003`, medido em produção em 26/08/2026:**

| Função | `md5(prosrc)` |
|---|---|
| `revalidar_ao_mudar_dado_sensivel` | `4f6d1130f05888eb9b47e7cc4a2ef538` |
| `carimbar_envio_documento` | `5b3f7ca858e6c31d0436afc100d401c4` |

Valores **anteriores** à `0003`, só para referência histórica (não use em pré-voo):
`035f8c64c139f2b6e1865341b4995fb7` e `ec641daea0efa102859b787d364a98ad`.

⚠️ **Hash não substitui leitura** (SEC-050 / R-030). Comparar produção com produção cinco minutos
depois não prova nada sobre adulteração: quem prova é ler o corpo linha a linha contra o arquivo
que o criou. Anote sempre contra qual arquivo e quais linhas a leitura foi feita.

## Ferramentas de leitura (nunca alteram nada)

- `../introspect.sql` — schema, enums, colunas, RLS, policies, funções, triggers, índices, dados
- `../introspect-funcoes.sql` — corpo das funções e grants, quebrado linha a linha pra não truncar no editor

Rode uma query por vez: o editor do Supabase mostra só o resultado da última.

## Antes de aplicar qualquer migration

1. **Backup do banco.** Sem isso, não roda.
2. Revisão de segurança das policies (agente `vetria-seguranca`).
3. Ler a seção de reversão da própria migration.
4. Depois de aplicar, anotar a data na tabela acima.
