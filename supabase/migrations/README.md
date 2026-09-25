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
| `0004_banco_recusa_o_que_a_action_recusa.sql` | ✅ **23/09/2026** (ensaio no `vetria-e2e` e produção). Produção: 21/22 `true` na aplicação, `vet_profiles_crmv_formato` validada depois de normalizar 5 CRMVs de conta de teste; sonda 3 com 38/38 OK nos dois projetos | T-027: CHECKs de conteúdo (T-017/R-039/R-059), `admin_definir_status` confere a origem (SEC-096/099), leitura do admin só da fila (SEC-097b/093), conclusão exige o objeto no bucket (SEC-098). Ensaio no `vetria-e2e` antes de produção (DL-064). Arquivos de apoio: `../prevoo-0004.sql`, `../backup-antes-da-0004.sql`, `../verificar-apos-0004.sql` |
| `0005_dados_da_busca_e_slug.sql` | ✅ **24-25/09/2026** (`vetria-e2e` e produção; ver o card T-028). _(registro de 23/09:)_ Ensaiada localmente (PGlite, Postgres 18) sobre 0000-0004 montados do repo: select final 36/36 `true`, idempotente, reversão da §10 executada, 6 sondas verdes | T-028: tabelas `especialidades`, `servicos`, `cidades` (leitura pública); pertença à lista por trigger (DL-062 item 5); slug gerado quando a conta vira `active` e preenchido nas que já são (DL-067, R-065); coluna `busca` e índices (DL-068). **Não reescreve função existente** (sem hash para anotar). Depois dela, rodar o seed `../seed-0005-cidades-ibge.sql` (5571 municípios do IBGE, gerado por `../gerar-seed-cidades.mjs`). Apoio: `../prevoo-0005.sql`, `../backup-antes-da-0005.sql`, `../verificar-apos-0005.sql` |
| `0006_contato_registrado_e_slug_protegido.sql` | ⬜ **escrita em 25/09/2026, NÃO aplicada.** Ensaiada localmente (PGlite, Postgres 18) sobre `montar-vetria-e2e` + 0004 + 0005 + seed: select final 26/26 `true`, idempotente, reversão da §10 executada e reaplicada, sonda 2 com 58/58 OK (com 5 contas e com 27 contas no banco; nada sobra depois) (e FALHA em todos os casos certos num banco sabotado), a sonda 2 da 0005 continua 100% OK depois dela | T-039: `registrar_contato` e `vincular_contatos_do_visitante` (EXECUTE só `service_role`, D1/D3/D5/D10); `contatos` com privilégio por coluna (R-074), `anonimizado_em` e o CHECK trocado para aceitar linha anonimizada (R-076, D11: a única troca de constraint, pedida pelo card); trigger `proteger_slug` (SEC-115); `slug_ao_ativar` falha sem linha de perfil (SEC-116). **Reescreve** `gerar_slug_do_perfil` e `slug_ao_ativar` (hashes abaixo). Apoio: `../prevoo-0006.sql`, `../backup-antes-da-0006.sql`, `../verificar-apos-0006.sql` |

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

**A partir da `0004`, o pré-voo usa o hash SEM ESPAÇO EM BRANCO** (`md5(regexp_replace(prosrc, '[[:space:]]+', '', 'g'))`).
Motivo: a `0003` mediu que o `md5(prosrc)` de produção diferia do arquivo só por espaço em branco, o que obrigava a
medir em produção antes de escrever a constante. Sem espaço, o hash sai do ARQUIVO do repo e continua pegando qualquer
mudança de conteúdo. Valores calculados sobre o corpo entre `$$` e `$$`:

| Função | corpo da `0002` | corpo da `0004` |
|---|---|---|
| `admin_definir_status` | `51f27f5c43ca5c48aea0a3a21850cad2` | `52241257ac30590e445c93e1bc39d09a` |
| `concluir_onboarding_profissional` | `0be00dee7bb30fddae30e7fde73293e0` | `542d156b7723946d987647491dcfde13` |

Depois de aplicar a `0004`, o select final dela imprime o hash sem espaços medido no banco: tem que bater com a coluna
da direita.

A `0006` reescreve duas funções da `0005` (medido no ensaio, PGlite, 25/09/2026):

| Função | corpo da `0005` | corpo da `0006` |
|---|---|---|
| `gerar_slug_do_perfil` | `8aca1eb4e4a72bd79ffc175938df18e8` | `8cdba6b87eded20e7e9c3ab16bb09a7f` |
| `slug_ao_ativar` | `0b6c06345e6bd0ce493b0cecc8a52b5c` | `6e2da6385b4ddca66cd51863b207e8ce` |

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
