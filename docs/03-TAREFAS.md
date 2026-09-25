# 03 — QUADRO DE TAREFAS

> Fila viva. **Uma task em execução por vez** no que escreve código.
> Atualizado por quem executa, no início e no fim de cada task.
>
> **Semana atual:** **S5 (5 de 13), 23/09 a 29/09** · **Fase:** **F4, Motor B2C** · **F3: CONCLUÍDA, 6 de 6**
> (**DL-069**, que revisa o DL-062) · **Entrega:** 25/11/2026 · **Atualizado:** 25/09/2026, `vetria-maestro`
>
> ### 25/09/2026 — a S5 entregou três semanas de plano em três dias
>
> **Em produção, com a prova de cada um** (cards abaixo): **T-027** (`0004`), **T-028** (`0005`: sonda 2
> 33/33 OK, 5571 cidades, "Loja veterinária", slug `larissa-lima-goiania-go` nascido na aprovação),
> **T-029** (CI no `vetria-e2e`, obrigatório na `main`), **T-034** (senha), **T-035** (máscaras, limite de
> especialidades, botão de arquivo: **absorveu a T-030**), **T-036** (link de email por `token_hash`,
> testado pelo Elber em outro navegador) e **T-037** (`/buscar` e os perfis públicos com selo "Verificado
> pela Vetria", PR #7). CI com **88 + 10 testes**.
>
> **O que isso significa em calendário:** o `01-PLANO.md` punha `/buscar` na S6 (até 06/10) e o perfil
> público na S7 (até 13/10). Os dois estão no ar em 25/09. **Estamos ~1,5 semana adiantados na F4**, e o
> atraso de ~1 semana declarado em 23/09 **foi recuperado**. Não é folga para gastar: o que resta da F4 é o
> **contato (S8, zero linhas)** e o **portão de abertura (1 de 6 provados)**, e os dois são 🔴 em parte.
> A folga vai para eles, e o que sobrar, para começar a F5 (construir as LPs, **sem publicar**).
>
> ### 🔴 Precisa de sessão presencial com o Elber — AGENDE: terça 30/09 à noite (sugestão)
>
> 1. **As decisões D1 a D12 da S8** (seção "PLANEJADA — S8", abaixo). Sem elas a `0006` (T-039) não é
>    escrita na forma final.
> 2. **Ligar o Turnstile no painel do Supabase**, só **depois** do deploy da T-031 e da conferência de que o
>    token está indo (DL-063 item 3). E subir o limite em Auth → Rate Limits (SEC-114).
> 3. **Regras do firewall da Vercel** (T-020): `/api/documentos/*`, `/buscar`, `/api/cidades` e, quando
>    existir, `/api/contato`.
> 4. **Aplicar a `0006` no `vetria-e2e`**, se a auditoria já tiver aprovado. Produção só depois do CI verde.
>
> ### Gestos do Elber, de 1 minuto cada, sem card
>
> - **R-064:** a senha mínima foi configurada junto da T-034; **falta a prova**: cadastrar com 7 caracteres e
>   ver recusar, e escrever aqui. Sem isso o item 6 do portão não fecha
> - **Conferir a `RESEND_API_KEY` na Vercel (Production)**: a prova do email foi em `localhost`
> - **Dizer em que plano está o Supabase de produção** (R-073: projeto grátis pausa após 7 dias sem uso)

---

## LEGENDA

**Nível de autonomia** (herdado do `HANDOFF.md`, regra do projeto):
- 🟢 **VERDE** — commit direto com build verde. Visual, copy, docs, assets. Máx. 3 arquivos.
- 🟡 **AMARELO** — mostra o diff e espera aprovação. `lib/`, `middleware.ts`, `/api/*`, config, `components/`, dependência nova, >3 arquivos.
- 🔴 **VERMELHO** — só com Elber presente. Migration, RLS, lógica de auth, `.env`, Stripe, qualquer coisa destrutiva.
- 🟠 **LARANJA** — escopo ambíguo: pergunta antes de começar.

**Estado:** `⬜ fila` · `🔵 em execução` · `⏸️ bloqueada` · `✅ concluída` · `🚫 cancelada`

---

## FORMATO DO CARD (copiar ao criar task nova)

```
### T-NNN — <título curto e imperativo>
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S1
- **Capacidade:** E1   ← obrigatório. Sem E1–E6, a task não entra na fila.
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** T-000 (ou "nada")
- **Por quê:** 1 frase. O que quebra ou falta se isso não for feito.
- **Feito quando:**
  - [ ] critério verificável 1
  - [ ] critério verificável 2
- **Não fazer:** o que está fora desta task e é tentador fazer junto
- **Resultado:** _(preenchido no fim: commit, o que mudou, o que se descobriu)_
```

---

# 🔵 EM EXECUÇÃO

### T-038 — A prévia do perfil público para o próprio profissional, em `/app/*/perfil`
- **Estado:** 🔵 **em execução desde 25/09/2026** (`vetria-ui`)
- **Fase / Semana:** F4 / S5 (o plano punha na S7; adiantada porque a T-037 entregou o componente)
- **Capacidade:** **E5** — *"`/veterinario/[slug]` e `/estabelecimento/[slug]` renderizam dados reais"*: o dono vê o que o público vai ver. E alimenta **E2** (*"o que digita persiste e reaparece"*)
- **Nível:** 🟡 — `components/` e páginas de painel
- **Agente dono:** vetria-ui · **conferência:** vetria-qa
- **Depende de:** **T-037 ✅** (o componente `components/publico/Perfil.tsx` existe)
- **Por quê:** pedido do Elber em 23/09. Hoje `/app/*/perfil` diz *"Ainda em construção"*; o profissional não tem como ver o próprio perfil antes de estar `active`, e depois de `active` só pelo endereço público
- **Feito quando:**
  - [ ] `/app/veterinario/perfil` e `/app/estabelecimento/perfil` renderizam **o mesmo componente** da página pública (não uma cópia: R-017), lendo a linha do dono **com a sessão do dono** (policy `*_own`), nunca com `service_role`
  - [ ] Em `pending_validation`: faixa honesta *"É assim que seu perfil vai aparecer depois de aprovado"*. Em `active`: link para o endereço público (`/veterinario/<slug>`). O `slug` é só lido, nunca escrito (SEC-008)
  - [ ] O bloco de contato **não mostra o número do próprio dono** nem nenhum dado de `perfil_privado`: a prévia é a vitrine, e a vitrine não tem número (DL-047)
  - [ ] Campo vazio vira estado vazio honesto, nunca exemplo inventado. Sem travessão (DL-038). 360 px sem rolagem lateral
  - [ ] Um teste no `vetria-e2e`: o dono vê a própria prévia; outra conta, digitando a rota, cai no painel dela (portão e prefixo, matriz §2)
- **Não fazer:** editar (T-019, F6). Um segundo componente "de prévia". Botão de WhatsApp na prévia.
- **Resultado:** _(a preencher)_

---

# ⬜ FILA — os próximos 5 dias (26/09 a 30/09), montada em 25/09/2026

> **Ordem por dependência real.** Os escritores andam um de cada vez (a `vetria-ui` está na T-038; o
> `vetria-backend` pega a T-033 quando ela abrir espaço). Os auditores rodam em paralelo com tudo.
>
> | # | Card | O que destrava | Cap. | Nível | Quem |
> |:-:|---|---|:---:|:---:|---|
> | 1 | **T-038** prévia do perfil (em execução) | fecha o pedido do Elber de 23/09 | E5 | 🟡 | ui |
> | 2 | **T-033** cabeçalhos + a parte de tela da **SEC-112** | item 5 do portão; ~meio dia; **o `frame-ancestors` protege o botão Aprovar e o `/auth/confirm` ao mesmo tempo** | E3 | 🟡 | backend |
> | 3 | **T-020** teto do bucket + **as regras do firewall** (documentos, `/buscar`, `/api/cidades`) + **R-057** | item 2 do portão; a regra de firewall é gesto do Elber, guiado pelo card | E1, E4 | 🟡 | backend |
> | 4 | **T-031** captcha, **o código** | item 3 do portão; o código precisa estar em produção **antes** da sessão de terça, que liga o painel | E2 | 🟡 código / 🔴 painel | ui + backend |
> | 5 | **T-039** a `0006` do contato, **escrita e auditada, não aplicada** | a S8 inteira. **Só começa depois das decisões D1 a D12**; se a sessão de terça não acontecer, ela é escrita com as recomendações e as decisões viram "confirmar antes de aplicar" | E5 | 🔴 | backend + seguranca |
>
> **Por que T-033 e T-020 antes da S8, e não depois:** são pequenos, não dependem de decisão nenhuma e
> fecham 2 dos 5 itens abertos do portão. A S8 depende de decisão do Elber; enquanto ela não vem, o
> backend fecha portão. **Por que a T-032 (2FA) não está aqui:** é 🔴 com migration em `is_admin()`, tem
> ordem própria (tela, o Elber cadastra o TOTP, só então a migration), e a trava dela é "antes do segundo
> admin", que não está marcado. Vai para a semana de 07/10, junto com a aplicação da `0006` em produção.

---

# ✅ S5 — O QUE A SEMANA ENTREGOU (aberta 23/09; o fechamento formal é 29/09)

> **Semana aberta pelo `vetria-maestro` em 23/09 com 5 cards. Em 25/09, 4 deles fecharam e a semana
> puxou para si o que o plano punha em S6 e S7.**
>
> | # | Card | Estado em 25/09 | A prova |
> |---|---|:---:|---|
> | 1 | **T-027** a `0004` | ✅ | 22/22 `true` em produção, sonda 3 38/38 OK, `estado='ZZ'` recusado; código na `main` (`87eee1a`) |
> | 2 | **T-028** a `0005` | ✅ | `vetria-e2e` e produção; sonda 2 33/33 OK; 5571 cidades; slug `larissa-lima-goiania-go` nascido na aprovação |
> | 3 | **T-029** E2E no projeto de teste | ✅ | DL-064 + DL-069; 70/70 em 23/09, hoje 88 + 10, obrigatório na `main` |
> | 4 | **T-030** onboarding sem atrito | ✅ **pela T-035** | limite no passo 1 e botão "Escolher arquivo" próprio (`b6e8452`) |
> | 5 | **T-020** teto do bucket | ⬜ | não começou; está na fila dos próximos 5 dias |
> | + | **T-034**, **T-035**, **T-036** | ✅ | cards abaixo |
> | + | **T-037** `/buscar` e perfis públicos (S6 e S7 do plano) | ✅ | PR #7; cards e prova abaixo |
>
> ### O portão de abertura (DL-063), como lista de checagem — **1 de 6 provados** em 25/09
>
> | # | Item | Card | Estado |
> |:-:|---|---|:-:|
> | 1 | `0004` aplicada e provada | T-027 | ✅ 23/09 |
> | 2 | Teto do bucket + rate limit da Vercel em `/api/documentos/*` | T-020 | ⬜ |
> | 3 | Captcha Turnstile nas 6 telas de auth | T-031 | ⬜ |
> | 4 | 2FA TOTP de admin e master, na tela e no `is_admin()` | T-032 | ⬜ |
> | 5 | Cabeçalhos de segurança | T-033 | ⬜ |
> | 6 | Senha mínima 8 no Supabase | gesto do Elber (R-064) | 🟡 configurada com a T-034, **falta a prova** (7 caracteres recusados) |
>
> ### Decisões tomadas na abertura de 23/09 (registro)
>
> - **A prévia do perfil público** ia para a S7 dentro do card do perfil público. **Virou a T-038**, em
>   execução, porque o componente já existe.
> - **SEC-091 (trilha de leitura do dossiê):** **F6/S11** (**DL-062** item 4).
> - **Cloudflare: não** (DL-063). **Onboarding do responsável:** continua sem card.

### T-027 — A `0004`: o banco passa a recusar o que a Action recusa
- ✅ **APLICADA EM PRODUÇÃO em 23/09/2026, sessão presencial com o Elber.** Ensaio completo no `vetria-e2e` (montagem 34/34, 0004 22/22 `true`, sondas 1-5 OK, sonda 3 38/38 OK). Produção: pré-voo C1 `bate_com_0002 = true` nas duas funções; C4 listou só 5 CRMVs de conta de teste (confirmado por email); backup das policies em `supabase/backups/` (fora do git); `rolbypassrls = true` (SEC-106); 0004 aplicada com 21/22 `true` e só `vet_profiles_crmv_formato` NOT VALID, como previsto; sonda 3 38/38 OK (a sonda 2 não achou alvo limpo e o caso 1 da sonda 3 fez a mesma prova). Os 5 CRMVs foram normalizados para só dígitos pelo SQL Editor (as 3 contas `active` voltaram para a fila pelo trigger de revalidação, com `actor_id` nulo em `audit_logs`: **esperado, não é incidente**, SEC-111) e a constraint foi validada: **22/22**. Formato do CRMV conferido com número real (`05107`), SEC-110. **Falta:** a prova em tela de uma conclusão com documento (SEC-106) e o push do código.
- **Estado:** ✅ **CONCLUÍDA em 23/09/2026, código na `main` em `87eee1a`** (conferido pelo `vetria-maestro` em 25/09 no `git log`). Os dois "Falta" da linha acima fecharam: o push foi feito, e a conclusão com documento contra a `0004` passou a ser exercitada a cada rodada do CI pelo `fluxos-conta-nova.spec.ts` no `vetria-e2e` (cadastro → onboarding → documento → concluir → fila). **Fecha o R-039** e o item 1 do portão de abertura. _(histórico: 🔵 SQL escrito em 23/09 → aplicado no mesmo dia, na sessão presencial.)_
- **Fase / Semana:** F4 / S5
- **Capacidade:** **E1** (*"`vet_profiles` e `clinic_profiles` existem com RLS"*) e **E3** (*"aprovar muda o status pra `active`"*, e só quem está na fila), mais a transversal **Segurança**
- **Nível:** 🔴 — migration, RLS, função usada em policy
- **Agente dono:** vetria-backend, **com o Elber na sala** · **auditoria obrigatória antes de aplicar:** vetria-seguranca, e **correção volta para a auditoria** (a `0002` levou quatro rodadas)
- **Depende de:** nada para escrever. **A T-028 depende dela** para aplicar
- **Por quê:** cinco achados, um arquivo. Hoje o banco aceita o que a aplicação recusa, e **medido**: em 23/09 o Elber fez `PATCH estado='ZZ'` em `vet_profiles` com a conta de teste, só com a `anon key` e o login, e o banco gravou (restaurado). A regra *"ninguém fica ativo sem passar pela fila"* e *"reprova tem motivo"* (DL-061, R-051) vive só na Server Action. E a finalidade do dossiê (DL-061: só enquanto há validação) vale na tela e não vale no PostgREST
- **O que entra, e de onde vem cada linha:**
  - **T-017 / R-039 / SEC-060** (absorvida em 23/09, **DL-062**): CHECK ou `domain` em `crmv_uf` e `estado` (UF brasileira válida); whitelist em `titulo` e `experiencia` espelhando o `campos.ts`, com o `campos.ts` passando a apontar para a constraint; teto de comprimento em `bio`/`sobre`; **teto de tamanho** nos arrays `especialidades` e `servicos` (a **pertença à lista** vai para a T-028, onde as tabelas nascem); **`clinic_profiles.site` só `http`/`https`**, a linha mais importante
  - **R-059:** formato do **número** do CRMV, no CHECK **e** na Action, pela mesma regra escrita uma vez
  - **SEC-096 (fecha SEC-099):** `admin_definir_status` passa a exigir `status = 'pending_validation'` na origem para os destinos `active` e `incomplete` (`update ... where ... and status = 'pending_validation'` + `if not found then raise`), e **motivo não vazio** quando o destino é `incomplete`. A matriz responde antes se o admin comum pode `active → incomplete`; se puder, é ramo explícito com motivo obrigatório
  - **SEC-097(b):** `perfil_privado_select_admin`, `vet_profiles_select_admin` e `clinic_profiles_select_admin` passam a exigir alvo em `pending_validation` para o admin comum, via função `SECURITY DEFINER`
  - **SEC-093:** as mesmas três policies ganham a cláusula de role (`vet`/`clinic`) que `profiles_select_admin` já tem
  - **SEC-098:** `concluir_onboarding_profissional()` exige que exista objeto em `storage.objects` com `bucket_id = 'documentos'` e `name = documento_path`
- **Feito quando:**
  - [ ] **Antes da primeira linha de SQL**, os `select` que a auditoria não conseguiu fazer, registrados aqui: `pg_get_functiondef` de `admin_definir_status` em produção; `select policyname, cmd, qual, with_check from pg_policies where tablename in ('vet_profiles','clinic_profiles','profiles','perfil_privado')`; a consulta de `documento_path` sem objeto no bucket (item 3 do "Não consegui verificar" da SEC-2026-09-23-T024); e **as linhas que violariam cada CHECK novo** (há dado real desde 31/08: `add constraint` sobre dado fora da regra falha na hora de aplicar)
  - [ ] Matriz `06-PERMISSOES.md` §5 atualizada **antes** do SQL, se a regra do admin comum mudar
  - [ ] `0004` escrita, **aditiva**, com toda função de policy `SECURITY DEFINER` + `SET search_path = public` (DL-014/015)
  - [ ] Auditoria do `vetria-seguranca` **APROVADA**, com a rodada de correção revista
  - [ ] **Backup** e aplicação com o Elber presente
  - [ ] **A prova de depois, a mesma de antes:** o `PATCH estado='ZZ'` é **recusado**; `rpc/admin_definir_status` numa conta `incomplete` para `active` é **recusado**; reprova sem motivo é **recusada**; `GET /rest/v1/perfil_privado?id=eq.<conta active>` com token de admin comum devolve **zero linha**. E a fila do admin **continua cheia** (é a prova de que as policies de leitura não caíram)
  - [ ] Os 41 testes continuam verdes no CI
- **Não fazer:** não mexer em `is_admin()` aqui (é a T-032, e tem ordem própria). Não criar as tabelas de apoio nem o `slug` (T-028). Não encostar no CHECK all-or-nothing de `perfil_privado.documento_*`. Não renomear coluna nem enum (DL-043). Não resolver o R-040 de carona sem DL.
- **Resultado:** ✅ **aplicada em produção em 23/09 (22/22 `true`, sonda 3 38/38 OK), código em `87eee1a`.** Fecha R-039, SEC-093, SEC-096, SEC-097(b), SEC-098 e a parte do CRMV do R-059. Handoff e roteiro abaixo, mantidos como registro.

## HANDOFF — vetria-backend — T-027 — 23/09/2026

**Fiz** (nada aplicado, nada commitado, nenhum banco consultado):
- **`supabase/migrations/0004_banco_recusa_o_que_a_action_recusa.sql`**, uma transação, aditiva (zero `drop`, zero `delete`, zero renomeação; as três policies mudam por `alter policy ... using`), idempotente:
  - **§1 pré-voo** (tudo `raise exception`): 1.1 as duas funções sobrescritas são as da `0002` ou já as da `0004`, por **hash do corpo sem espaço em branco**, calculado a partir do arquivo do repo (sem passo manual; ver o README das migrations); 1.2 não existe policy de SELECT desconhecida nas três tabelas (policy permissiva se soma por OU) e as três `*_select_admin` são as da `0002`; 1.3 o papel que roda lê `storage.objects` e o bucket existe (sem isso ninguém mais conclui o onboarding); 1.4 `is_admin()` e `is_master_admin()` são DEFINER + `search_path`.
  - **§2, 12 CHECKs `NOT VALID`** (T-017 / R-039 / R-059): UF em `vet_profiles.crmv_uf`, `vet_profiles.estado` e `clinic_profiles.estado`; **número do CRMV só algarismos, de 1 a 6** (`^[0-9]{1,6}$`); lista fechada de `titulo` e `experiencia`; tetos de texto (nome 120, cidade 80, bairro 200, bio 500 · nome fantasia 120, endereço 200, cidade 80, sobre 600); CEP com 8 dígitos; teto de array (especialidades: 4 itens e 240 caracteres somados; serviços: 9 e 400); **`site` só `http(s)://` com host não vazio, sem espaço, caractere de controle, aspas, `<>` ou barra invertida, até 300**. A pertença à lista de especialidades e serviços é da T-028, como o DL-062 manda.
  - **§3 e §4, SEC-097(b) + SEC-093:** duas funções novas, `admin_pode_ver_perfil(id, role)` e `admin_pode_ver_dossie(id)`, **SECURITY DEFINER + `SET search_path = public`**, EXECUTE só para `authenticated` (SEC-014 explicada no arquivo). `vet_profiles_select_admin` e `clinic_profiles_select_admin`: o role do alvo tem que ser o da tabela, e o admin comum só lê alvo em `pending_validation` (o `active` ele lê pela policy pública); o master lê qualquer status. `perfil_privado_select_admin`: **só alvo vet/clinic em `pending_validation`, para admin e para master** (DL-066).
  - **§5, SEC-096 + SEC-099:** `admin_definir_status` com `select ... for update`, tabela de transições fechada (fila → `active`; fila → `incomplete` com motivo não vazio; qualquer → `suspended` com motivo, só master; reativar, só master; o resto recusado, inclusive `incomplete → active`, `active → pending_validation` e `active → incomplete`), motivo até 1000 caracteres, e `update ... where status = status_antigo` + `if not found then raise`. **Os códigos de erro são contrato com a Action:** 42501 sem autorização, 55000 fora do estado exigido, 22023 pedido inválido, P0002 conta não encontrada.
  - **§6, SEC-098:** `concluir_onboarding_profissional` exige linha em `storage.objects` com `bucket_id = 'documentos'` e `name = documento_path` (a coluna é o que o dono diz; o objeto é o que a rota de upload escreveu). Recusa com 55000. Ganhou também `for update` e update condicional.
  - **§8** valida cada CHECK que estiver limpo e deixa `NOT VALID` o que tiver linha suja; roda de novo sozinha. **§9** é o select final, único canal de saída. **§10** é a reversão completa, na ordem certa, com os corpos da `0002` colados.
- **`supabase/prevoo-0004.sql`** (só leitura, 7 consultas): o que a auditoria da T-024 não conseguiu medir (corpo das funções, policies das 4 tabelas, documento sem objeto no bucket, quem é admin) e **as linhas que violariam cada CHECK**.
- **`supabase/backup-antes-da-0004.sql`**: `vet_profiles`, `clinic_profiles`, o **corpo real** das duas funções (`pg_get_functiondef`) e as três policies como `alter policy` de volta.
- **`supabase/verificar-apos-0004.sql`**: sonda 1 (os 12 CHECKs e quais validaram); **sonda 2, a prova de antes refeita** (`update vet_profiles set estado = 'ZZ' where id = auth.uid()` como `authenticated`, dentro de `begin ... rollback`, esperando ERRO `vet_profiles_estado_valido`); sonda 3 (tabela de 33 casos com controle positivo: cada CHECK, cada transição, cada leitura e as três portas da conclusão); sonda 4 (a fila REAL continua cheia para o admin comum); sonda 5 (a busca pública não foi tocada).
- **Código, ajuste mínimo ao contrato novo:**
  - `app/app/veterinario/onboarding/campos.ts:79-97`: `CRMV_NUMERO` e `normalizarCrmv()` (tira espaço e ponto de milhar, recusa letra e hífen). **A mesma regra do CHECK**, escrita uma vez aqui e apontada lá. O cabeçalho lista cada lista e o CHECK espelho.
  - `app/app/veterinario/onboarding/actions.ts:209`: a Action valida o CRMV com essa regra (R-059). `:88` e `app/app/estabelecimento/onboarding/actions.ts:101`: 23514 vira frase que não manda "tentar de novo". `:417` e `:447`: 55000 na conclusão vira "o documento não foi encontrado no armazenamento, envie de novo no passo 4".
  - `app/admin/validacoes/[conta]/actions.ts:160`: **o nome de exibição passa a ser lido ANTES da RPC.** Com a `0004`, o admin comum deixa de ler `vet_profiles` de quem acabou de ser reprovado (vira `incomplete`), e o email de reprova sairia sem nome. `:190-200`: 55000 vira "não está mais na fila"; 42501 e 22023 ganham frase própria.
  - `app/app/estabelecimento/onboarding/campos.ts`: o comentário que dizia "não tem um único CHECK" agora aponta para os CHECKs da `0004`.
- **Matriz primeiro:** `docs/06-PERMISSOES.md` §5 ganhou a subseção de 23/09 (T-027), com a tabela de transições e a de leitura, marcada como **escrita, não aplicada**; §3, linha do `perfil_privado`. **DL-066** em `docs/05-DECISOES.md` (proposta: o que o master mantém, e o `NOT VALID`).

**Não fiz:**
- **Aplicar, ou rodar qualquer coisa contra banco.** É 🔴 e a instrução foi explícita. Os `select` que o card pede "antes da primeira linha de SQL" estão escritos no `prevoo-0004.sql`, **não executados**: o SQL foi escrito contra a `0002` e a `0003` do repo, e os pré-voos 1.1 e 1.2 da migration abortam se o banco não for o que o repo diz.
- **`titulo`/`experiencia` do `campos.ts` "lendo" a constraint:** não há mecanismo para isso sem gerar tipos do banco. O que existe é o comentário cruzado dos dois lados e a regra "mudou aqui, muda lá".
- **Cidade × UF** (Goiânia / AP): precisa da tabela de cidades da T-028. O CHECK pega UF inválida, não UF errada.
- **Os comentários dos dois formulários de onboarding** que dizem "SEC-098: a regra ainda NÃO vive no banco" (`VetOnboardingForm.tsx:~98`, `ClinicOnboardingForm.tsx:~85`): só ficam falsos depois de a `0004` entrar. Trocar na mesma leva do push (passo g).
- **Teste E2E novo:** é do `vetria-qa` (T-029), e depende do `vetria-e2e`.

**Estado agora:** nada mudou em banco nenhum. Em código, o que já vale hoje, mesmo sem a migration: o onboarding do vet **recusa CRMV com letra** ("GO-0155") com uma frase no passo 1; o email de reprova lê o nome antes da decisão. Os tratamentos de 55000, 22023 e 23514 ficam dormentes até a `0004` entrar (a função antiga nunca emite esses códigos), então o código pode subir antes ou depois dela, desde que o CRMV das contas de teste seja corrigido antes (Descobri 4).

**Descobri:**
1. ⚠️ **`0000_baseline.sql` não roda num projeto em branco.** Ele cria `trg_profiles_updated_at` apontando para `set_updated_at()` e `on_auth_user_created` apontando para `handle_new_user()` sem criar nenhuma das duas (o corpo está "abreviado", e o `handle_new_user` mora na `0001`). No `vetria-e2e` a ordem precisa ser outra (passo a do roteiro). Isso interessa à T-029 também.
2. ⚠️ **O pré-voo 1.7 da `0003` pode abortar no `vetria-e2e`**: ele compara `md5(prosrc)` cru com o hash medido em PRODUÇÃO, e o texto colado no projeto novo pode diferir por espaço em branco. Foi por isso que a `0004` passou a usar hash sem espaço.
3. **A sonda 10B do `verificar-apos-0003.sql` quebra depois da `0004`** (grava `crmv = 'SP-99999'`). Esperado; anotado no cabeçalho do verificar novo.
4. ⚠️ **O E2E do CI reescreve a linha da conta vet de teste** (`onboarding-vet.spec.ts`, "o que foi salvo continua lá"). Se o CRMV dessa conta for um dos sujos, **o CI quebra no push** (a Action nova recusa o CRMV antes de gravar), e quebraria mesmo sem o push depois da `0004`, porque a linha suja não passa mais pelo CHECK em UPDATE nenhum. Corrigir o CRMV das contas de teste é passo do roteiro, antes do push.
5. `profiles_select_admin` continua deixando o admin comum ler `profiles.phone` e `full_name` de todo vet/clinic, em qualquer status. Não estava no card; fica para a auditoria dizer se entra na `0004` ou vira risco.

**Bloqueios:** auditoria do `vetria-seguranca` (obrigatória; a `0002` levou quatro rodadas) · confirmação do DL-066 pelo Elber · o projeto `vetria-e2e` existir.

**Próximo passo óbvio:** o `vetria-seguranca` audita a `0004`, os três arquivos de apoio e os 5 arquivos de código. Correção volta para ele. Depois, o roteiro abaixo.

**Docs que atualizei:** este card · `docs/06-PERMISSOES.md` (§3, §5) · `docs/05-DECISOES.md` (DL-066) · `supabase/migrations/README.md` (linha da `0004` e os hashes sem espaço).
**Commits:** nenhum.

### Roteiro de aplicação (sessão presencial; cada etapa só começa com a anterior verde)

**(a) Aplicar `0000` a `0004` no `vetria-e2e`.** SQL Editor do projeto de TESTE; conferir o nome do projeto no topo da tela antes de colar cada arquivo.
1. `0000_baseline.sql`, **só as seções 1 a 3** (tipos, `profiles`, funções). ⚠️ As seções 4 e 5 ainda não: elas apontam para funções que ainda não existem.
2. `0001_handle_new_user_role_from_metadata.sql` inteiro.
3. O `set_updated_at()` da `0002` §3.4, sozinho (`create or replace function public.set_updated_at() ...`, 9 linhas).
4. `0000`, **seções 4 e 5** (triggers e policies de `profiles`).
5. `0002_nucleo.sql` inteiro. Esperado: "Success".
6. `0003_storage_documentos.sql` inteiro. ⚠️ Se o pré-voo 1.7 abortar por hash (Descobri 2), o corpo impresso é o que você acabou de colar do repo: troque o hash **na cópia colada no editor**, não no arquivo, e rode de novo. Esperado: o select final da 0003 todo `true`.
7. **`0004` inteira.** Esperado no select final: todas as linhas com `ok_tem_que_ser_true = true` (o banco está vazio, então os 12 CHECKs validam), e as duas linhas `md5_sem_espacos_*` iguais a `52241257ac30590e445c93e1bc39d09a` e `542d156b7723946d987647491dcfde13`.
8. **Contas para as sondas:** Authentication → Add user, três contas (nascem `tutor`). No SQL Editor, uma vira `vet` (`update profiles set role = 'vet', status = 'incomplete' where id = '…'`), uma vira `clinic` (idem) e uma vira `admin` (`role = 'admin', admin_level = 'master', status = 'active'`). Para a sonda 2, uma linha limpa: `insert into vet_profiles (id, crmv, crmv_uf, estado, cidade, nome_exibicao) values ('<id do vet>', '12345', 'SP', 'SP', 'Teste', 'Teste');`.

**(b) `supabase/verificar-apos-0004.sql` no `vetria-e2e`**, uma sonda por vez. Esperado: sonda 1, 12 linhas com `validada = true`; **sonda 2, ERRO 23514 citando `vet_profiles_estado_valido`**; sonda 3, todas as linhas `OK` (a 62 pode vir `NAO MEDIDO`, ver o cabeçalho do arquivo); sonda 4, `OK (com a fila vazia…)`; sonda 5, `0` e `0`. **Qualquer FALHA ou SONDA INVALIDA para aqui: volta para o backend, e a correção volta para a auditoria.**

**(c) Pré-voo em PRODUÇÃO: `supabase/prevoo-0004.sql`**, consulta por consulta, anotando neste card. Esperado: C0, os números de hoje; **C1, `bate_com_0002 = true` nas duas** (se vier `false`, PARE: função editada fora do repo); C2, só as policies da 0002; C3, zero linha (se vier linha, anote os ids: essas contas não concluem mais sem reenviar o documento); **C4, só `vet_profiles_crmv_formato`, com as duas contas de teste ("GO-0155" e "GO 1522")**, e qualquer outra linha em C4 quer dizer mais um CHECK nascendo `NOT VALID` (anote); C5, quem é admin; C6, as quatro colunas `true`.

**(d) Backup de PRODUÇÃO: `supabase/backup-antes-da-0004.sql`**, queries 0 a 4, Export → CSV em `supabase/backups/`, e conferir que o arquivo abre. A query 3 é a que importa (o corpo real das funções).

**(e) Aplicar a `0004` em PRODUÇÃO**, o arquivo inteiro. Esperado no select final: tudo `true` **menos a linha `CHECK vet_profiles.vet_profiles_crmv_formato` = `false`** (NOT VALID por causa das duas contas de teste; é o item 4 do DL-066 funcionando). Os hashes iguais aos do passo a7. Se o pré-voo abortar, nada foi aplicado: leia a mensagem, não force.

**(f) Verificação em PRODUÇÃO:** `verificar-apos-0004.sql`, as cinco sondas. Esperado: sonda 1 igual ao select final; **sonda 2, ERRO `vet_profiles_estado_valido`**; sonda 3, tudo `OK`; **sonda 4, `OK: o admin comum ve a fila inteira`**, com os números iguais à fila de hoje; sonda 5, os dois números iguais. Depois, **as provas pela API, as mesmas de antes** (o card pede): o script de 23/09 com `PATCH estado='ZZ'` agora recebe **HTTP 400 com código 23514**; na tela, `/admin/validacoes` **continua mostrando as mesmas contas**, o detalhe abre e o documento abre. Então **corrigir o CRMV das duas contas de teste** (pela tela, no onboarding em modo revisão, ou `update vet_profiles set crmv = '<só algarismos>' where id = '<id>'` no SQL Editor; em conta `active`, isso a devolve para a fila, pelo trigger), rodar de novo **só a seção 8 da `0004`** (o bloco `$validar$`) e o select da seção 9: tudo `true`. Anotar a data de aplicação no `supabase/migrations/README.md`.

**(g) Push do código**, depois de (f) e **só depois de corrigir os CRMVs de teste** (Descobri 4). No mesmo commit, trocar os dois comentários "SEC-098: a regra ainda NÃO vive no banco" dos formulários. `npm run build` e `npm run lint` verdes. Na tela, em produção: digitar "GO-0155" no CRMV do onboarding → a frase do passo 1 aparece e nada é gravado; concluir o onboarding de uma conta de teste nova com documento → ela vai para a fila.

### T-028 — A `0005`: tabelas de apoio da busca, a regra do `slug` e os índices
- **Estado:** ✅ **CONCLUÍDA em 24-25/09/2026: aplicada no `vetria-e2e` e em produção.** Auditoria APROVADA (`SEC-2026-09-23-T036-0005.md`, 🔴 0 · 🟠 0 · 🟡 2), DL-067 confirmado pelo Elber (DL-070 A), "Loja veterinária" (DL-070 B). _(histórico: 🔵 escrito e ensaiado em 23/09.)_
- **Fase / Semana:** F4 / S5 (`01-PLANO.md` §S5)
- **Capacidade:** **E4** — *"`/buscar` filtra por cidade + especialidade + tipo de atendimento"*
- **Nível:** 🔴 — migration
- **Agente dono:** vetria-backend · decisão do `slug` levada pelo `vetria-maestro`, **decidida pelo Elber** · **auditoria obrigatória:** vetria-seguranca
- **Depende de:** **T-027** para aplicar (as duas mexem na aprovação). Para escrever, de nada
- **Por quê:** a S6 constrói `/buscar`, e hoje não há lista de especialidades, de cidades nem de serviços no banco: há três cópias em `campos.ts` e texto livre de cidade (R-059). E desde a T-024 existem contas `active` **com `slug` nulo** (R-065), então a página pública da S7 não teria endereço para elas
- **Feito quando:**
  - [ ] **DL do `slug` em `05-DECISOES.md` antes do SQL:** formato (ex.: `nome-cidade`), unicidade, o que acontece em colisão, se muda quando o nome muda (e se muda, o que acontece com o link antigo), e **quem gera: o servidor, na aprovação**. O dono continua sem escrever o próprio `slug` (SEC-008)
  - [ ] Tabelas `especialidades`, `cidades` (com UF) e `servicos`, com **seed real**, leitura pública, escrita só por migration. `campos.ts` deixa de ser fonte e passa a ser leitura (ou some)
  - [ ] **Pertença à lista** de `especialidades` e `servicos` nas colunas de perfil (o que a T-027 deixou de fora de propósito, DL-062 item 5), validada contra a tabela, e não contra uma segunda cópia
  - [ ] `slug` gerado na aprovação **e preenchido nas contas que já estão `active`** (R-065). A pergunta *"e o que já está gravado?"* respondida aqui, não depois (R-055)
  - [ ] Índices e full-text em português para os três filtros. **A visibilidade continua sendo a policy** `perfil_esta_ativo(id, role)`: índice não é filtro
  - [ ] Pré-voo com as linhas de hoje que não batem com as listas novas (dado de teste de 31/08 e 20/09), e o que se faz com elas decidido antes de aplicar
  - [ ] Auditoria **APROVADA**, backup, aplicação com o Elber, e um `select` por tabela provando o seed
- **Não fazer:** não construir `/buscar` (S6). Não fazer mapa nem raio (V2). Não trocar Postgres por Typesense/Meilisearch (fora do escopo). Não expor `perfil_privado` em nenhuma view de busca.
- **Resultado:** ✅ **APLICADA em 24-25/09/2026, primeiro no `vetria-e2e` e depois em produção, pelo roteiro abaixo.** Prova: **sonda 2, 33/33 OK**; seed **5571 de 5571** cidades; o serviço "Pet shop" gravado virou **"Loja veterinária"** pela §3.1 (DL-070 B); **prova em tela do item (b6):** uma conta aprovada em `/admin/validacoes` ganhou o endereço **`larissa-lima-goiania-go`**, no formato do DL-067, gerado pelo trigger na aprovação. Os testes da busca com dados foram ligados no CI (`71fd770`). **Fecha o R-065** e a parte de cidade × lista do R-059 (a busca casa por chave; a tela com lista de cidades por UF segue sem card). Ficam abertas **SEC-115** (admin comum reescreve slug pela API) e **SEC-116** (aprovação sem linha de perfil passa sem slug), as duas para a `0006` (T-039). _(texto de 23/09, mantido como registro:)_ 🔵 **SQL ESCRITO e ENSAIADO LOCALMENTE em 23/09/2026, NÃO APLICADO em banco nenhum.** Nada commitado. Falta, nesta ordem: auditoria do `vetria-seguranca` → confirmação do DL-067 (slug) pelo Elber → o roteiro abaixo, começando pelo `vetria-e2e`. Checklist: DL do slug ✅ escrito (DL-067, proposta) · tabelas + seed ✅ escritos (cidades: 5571 do IBGE, seed gerado) · pertença ✅ (trigger contra a tabela) · slug na aprovação + preenchimento ✅ · índices + full-text ✅ · pré-voo ✅ escrito · auditoria, backup e aplicação ⬜. `campos.ts` **continua sendo a fonte da tela** (não "leitura" ainda): a tela só pode ler as tabelas depois da `0005` aplicada, e isso é da S6 (DL-068). **Adendo 23/09 (DL-070 item B), ainda NÃO aplicado:** o serviço "Pet shop" virou **"Loja veterinária"** (slug `loja-veterinaria`) no seed da `0005`, nos dois `campos.ts`/`ClinicProfileForm.tsx`, no pré-voo e na sonda 1; a `0005` ganhou a §3.1, um `update` idempotente que troca "Pet shop" por "Loja veterinária" nas linhas gravadas **antes** de o trigger de pertença existir (sem ele, essas contas ouviriam 23514 no próximo salvamento). Não devolve ninguém para a fila: `revalidar_ao_mudar_dado_sensivel` (versão da `0003`) não olha `servicos`. O select final continua com 36 linhas. Novo no pré-voo: **C3b** conta as linhas com "Pet shop" (esperado 0 ou contas de teste; anotar aqui). ⚠️ Esta mudança da `0005` também precisa passar pela auditoria.

## HANDOFF — vetria-backend — T-028 — 23/09/2026

**Fiz** (nada aplicado, nada commitado):
- **`supabase/migrations/0005_dados_da_busca_e_slug.sql`**, uma transação, aditiva, idempotente, **não reescreve nenhuma função existente**:
  - **§1 pré-voo** (tudo `raise exception`): 1.1 a `0004` está aplicada (os 12 CHECKs e as duas `admin_pode_ver_*`), Postgres 14+, configuração `portuguese`; 1.2 as policies de escrita de `vet_profiles`/`clinic_profiles` são só as da `0002` e as `*_own` ainda pinam o `slug` (SEC-008); 1.3 nenhum objeto com os nomes desta migration que não seja dela (R-006).
  - **§2** funções de texto IMMUTABLE (`sem_acento`, `chave_de_nome`, `slugificar`, `slug_truncado`, `juntar_textos`), com EXECUTE mantido para `anon` de propósito (SEC-014: a busca anônima vai usá-las).
  - **§3** `especialidades` (12), `servicos` (9) e `cidades` (código IBGE, `chave` e `slug` gerados), RLS ligada, **uma** policy de leitura para `anon, authenticated`, grants de escrita revogados.
  - **§4** pertença à lista por trigger `conferir_itens_de_lista` (SECURITY DEFINER + search_path): item fora da lista, nulo ou repetido vira 23514; confere em INSERT e em UPDATE só quando a lista muda.
  - **§5** slug (DL-067): CHECK de formato, `gerar_slug_do_perfil` (sem EXECUTE para ninguém de fora), trigger `trg_profiles_slug_ao_ativar` em `profiles.status` (aprovação e reativação), e o **preenchimento das contas já `active`** (R-065).
  - **§6** coluna gerada `busca` (tsvector português com peso, só colunas públicas, sem `endereco` por causa do R-032) e índices: GIN em `busca`, `(estado, chave_de_nome(cidade))`, `cidades.chave` para autocompletar.
  - **§9** select final (36 linhas, todas `true`), **§10** reversão completa, na ordem certa.
- **`supabase/seed-0005-cidades-ibge.sql`** (205 KB, 5571 municípios, um bloco por UF, idempotente, com conferência por UF no fim), **gerado** por **`supabase/gerar-seed-cidades.mjs`** (Node puro, sem dependência nova; baixa da API do IBGE, confere 27 UFs, código único, zero colisão de nome normalizado na mesma UF e que a normalização do JS e a do SQL batem letra por letra; sha256 da fonte no cabeçalho).
- **`supabase/prevoo-0005.sql`** (9 consultas, só leitura), **`supabase/backup-antes-da-0005.sql`** (4 queries), **`supabase/verificar-apos-0005.sql`** (6 sondas, uma por vez; a sonda 2 tem 33 casos com controle positivo).
- **Docs:** DL-067 (slug, proposta) e DL-068 (modelo dos dados da busca) em `05-DECISOES.md`; `06-PERMISSOES.md` §3 com as linhas do `slug` e das três tabelas; README das migrations; comentário dos dois `campos.ts` apontando para as tabelas e os triggers.

**Ensaio (a lição do DL-050: revisão não substitui execução).** Sem Postgres nem Docker ligados na máquina, rodei tudo num Postgres 18 em WebAssembly (PGlite, instalado só na pasta temporária da sessão, fora do repo), sobre um esboço do que o Supabase fornece (`auth.uid()`, `anon`/`authenticated`, `storage.*`) e o `montar-vetria-e2e.sql` + a `0004` do repo: pré-voo e backup rodaram; a `0005` deu **36/36 `true`**; rodada de novo, **36/36** (idempotente); seed **29/29 `ok`**, e de novo sem duplicar; sondas 1 a 6 **todas verdes, 33/33 OK na sonda 2**; duas contas `active` "Dra. Ana Souza, Goiânia" ganharam `dra-ana-souza-goiania-go` e `-2`; com uma conta vet só, os casos 27/28 viram `NAO MEDIDO`, como previsto; a sonda 6 pegou "Goiânia / AP" e sugeriu "Goiânia/GO"; o pré-voo **parou** sem um CHECK da 0004 (nada entrou) e **parou** com uma policy de escrita desconhecida; a reversão da §10 **removeu tudo** e a `0005` entrou limpa de novo. ⚠️ PGlite não é o Supabase: a diferença de versão (18 × a de produção) e os grants por default privileges só se provam no `vetria-e2e`.

**Não fiz:**
- Aplicar ou consultar qualquer banco do projeto.
- `campos.ts` virar leitura das tabelas: só depois da `0005` aplicada (antes quebraria a tela em produção). É da S6.
- Tornar a cidade obrigatória da lista: o formulário é texto livre; a busca casa por chave normalizada (DL-068). A tela com lista de cidades da UF é card futuro.
- Mexer nas Actions de onboarding: não precisou. Elas já conferem a mesma lista e já traduzem 23514.

**Descobri:**
1. **O IBGE tem 5571 municípios hoje, não 5570:** Boa Esperança do Norte (MT, código 5101837) foi instalado depois da contagem antiga.
2. ~~**Nomenclatura:** o slug do serviço "Pet shop" sai `pet-shop`.~~ **Resolvido pelo DL-070 item B:** o serviço é "Loja veterinária" (`loja-veterinaria`), trocado na `0005` antes de ela ser aplicada, com o dado gravado renomeado na §3.1.
3. Em produção, as 3 contas que estavam `active` voltaram para a fila na aplicação da `0004` (SEC-111). Se continuarem na fila, o preenchimento da §5.4 não acha ninguém, e é a aprovação que gera o slug delas (trigger).

**Bloqueios:** auditoria do `vetria-seguranca` (obrigatória) · confirmação do DL-067 pelo Elber.
**Próximo passo óbvio:** o `vetria-seguranca` audita a `0005` e os quatro arquivos de apoio; correção volta para ele. Depois, o roteiro.
**Docs que atualizei:** este card · `docs/05-DECISOES.md` (DL-067, DL-068) · `docs/06-PERMISSOES.md` §3 · `supabase/migrations/README.md`.
**Commits:** nenhum.

### Roteiro de aplicação da 0005 (sessão presencial; cada etapa só começa com a anterior verde)

⚠️ **SQL Editor:** rode cada arquivo **inteiro** quando o roteiro disser "inteiro", e **uma consulta ou sonda por vez** quando disser "uma por vez". Os marcadores de bloco entre cifrões são só letras (sem número), como na `0004`.

**(a) `vetria-e2e` primeiro** (conferir o nome do projeto no topo da tela antes de colar cada arquivo):
1. `prevoo-0005.sql`, uma consulta por vez. Esperado: C1 `12 | 12 | true` e só as 6 policies da `0002`, as `*_own` com `cita slug=true`; C2, C3, C4 e C6 **zero linhas**; C3b é um número (quantas contas a §3.1 renomeia de "Pet shop" para "Loja veterinária"); C7 `true | true`.
2. `migrations/0005_dados_da_busca_e_slug.sql`, **inteiro**. Esperado: todas as linhas do select final `true` (a linha 30 diz "0 municipios": é o lembrete do seed).
3. `seed-0005-cidades-ibge.sql`, **inteiro** (205 KB; se o editor recusar o tamanho, rode bloco por bloco de UF e o select do fim por último). Esperado: 29 linhas, todas `ok = true`, "5571 de 5571".
4. `verificar-apos-0005.sql`, **uma sonda por vez**. Esperado: sonda 1, 10 linhas `true` (a linha 5 agora também prova `loja-veterinaria` no seed e nenhum "Pet shop" gravado); **sonda 2, todas OK** (27 e 28 podem vir `NAO MEDIDO` se o projeto tiver uma conta vet só); sonda 3, OK em todas (ou vazia); sonda 4, zero linhas; sonda 5, `OK`; sonda 6, informativa. **Qualquer FALHA ou SONDA INVALIDA para aqui: volta para o backend, e a correção volta para a auditoria.**
5. Rodar a `0005` inteira **de novo**: tudo `true` de novo (prova de que ela é idempotente no Supabase de verdade).

**(b) Produção:**
1. `prevoo-0005.sql`, uma por vez, **anotando neste card** C0, C2, C3, C3b, C4 e C5 (C5 é a lista de quem vai ganhar endereço e a prévia de cada um). Se C2, C3 ou C4 vierem com linha: a `0005` aplica mesmo assim (DL-068 item 2), anote os ids.
2. `backup-antes-da-0005.sql`: query 0 anotada, queries 1 a 3 em CSV para `supabase/backups/` (fora do git), conferir que os arquivos abrem.
3. `0005`, **inteira**. Esperado: tudo `true`. Se o pré-voo parar, nada foi aplicado: leia a mensagem, não force.
4. Seed, **inteiro**. Esperado: 29/29 `ok`.
5. Verificar, **uma sonda por vez**, com o mesmo esperado de (a4). A sonda 2 escreve e desfaz tudo no fim (mesmo desenho da sonda 3 da `0004`). Anotar aqui os endereços da sonda 3.
6. **Prova em tela:** aprovar em `/admin/validacoes` uma conta de teste que esteja na fila e, no SQL Editor, `select slug from vet_profiles where id = '<id>'` (ou `clinic_profiles`): o endereço aparece no formato `nome-cidade-uf`. Anotar a data no `supabase/migrations/README.md`.

**Reverter, se precisar:** a §10 da `0005` (ensaiada: remove tudo o que ela criou, e ela volta a entrar limpa). O slug preenchido fica, e é inofensivo; zerar está explicado na §10. **Código:** nada depende da `0005` para subir; os comentários dos `campos.ts` e os docs podem ir no mesmo commit do SQL.

### T-029 — A infraestrutura de E2E e o item 5 do DoD da F3: os itens 1 e 3 ganham teste
- **Estado:** ✅ **CONCLUÍDA em 23/09/2026** (DL-064 + DL-069), 13 dias antes da data dura. _(texto de abertura, mantido como registro:)_ ⬜ fila, S5, item 3. **Data dura: 06/10** (DL-062). A F3 só vira "concluída" quando isto estiver verde no CI. ⚠️ **Travada numa decisão 🔴 do Elber** (abaixo). Já existe trabalho na árvore: o `vetria-qa` escreveu em 23/09 `tests/e2e/admin-validacoes.spec.ts` (**19 testes, segundo ele, nenhum escreve no banco**) e mexeu em `tests/apoio/credenciais.ts` e `tests/apoio/sessao.ts`. A suíte foi de **41 para 60 escritos, sem rodar e sem commit**
- **Fase / Semana:** F4 / S5 e S6 (é dívida da F3, com prazo)
- **Capacidade:** **E2** (item 1: o que se digita persiste e reaparece) e **E3** (item 3: aprovar muda o status e dispara email), mais a transversal **Testes**
- **Nível:** 🟡 para os testes e o `ci.yml` · 🔴 para a **decisão** e para criar o projeto e os secrets (Elber)
- **Agente dono:** vetria-qa (`tests/` e `ci.yml`) · o Elber decide e cria o projeto
- **Depende de:** parte A, de nada. Partes B e C, da **decisão do R-033**
- **Por quê:** o DoD da F3 diz *"E2E cobrindo 1 a 4 passando em CI"*. Cobre 2 e 4. Os dois que faltam são justamente os que mudam dado de gente: gravar o onboarding e aprovar. E a F4 precisa da mesma infra para o E2E dela (DoD da F4 item 5)
- **🔴 A decisão do Elber, recomendada pelo `vetria-qa` e pelo `vetria-maestro`:** um **projeto Supabase só de teste** (`vetria-e2e`), com as migrations `0000` a `0003` (e `0004`/`0005` quando existirem), *"Confirm email"* desligado, e **o CI inteiro apontando para ele**, nunca para produção. A `SUPABASE_SERVICE_ROLE_KEY` **do projeto de teste** vira secret do CI, para criar e apagar conta a cada rodada. Isso **exige um DL** trocando a regra escrita no `ci.yml:11` de *"NUNCA `SUPABASE_SERVICE_ROLE_KEY`"* para *"nunca a de produção"*: a chave de teste ignora a RLS de um banco vazio de gente. Secrets novos: `E2E_TUTOR_*` e `E2E_ADMIN_*` (admin comum, **só no projeto de teste**). É a saída (b) do R-033 com a peça que faltava para ela funcionar
- **Feito quando:**
  - [ ] **Decisão do R-033 registrada em DL**, com a troca da regra do `ci.yml`
  - [ ] **Parte A, sem infra nova e já agora:** o skip calado vira falha. **Se a conta `E2E_VET_EMAIL` sair de `pending_validation`, 16 testes pulam e o CI fica verde sem avisar** (é o R-053 de novo, achado do `vetria-qa`). No CI, `E2E_EXIGIR_FILA=1` transforma esse pulo em falha, e o pré-voo do `ci.yml` confere os secrets novos como já confere os dois primeiros
  - [ ] **Parte A também:** `admin-validacoes.spec.ts` revisado, rodado local e commitado, com os pulos com motivo escrito
  - [ ] **Parte B, com o projeto de teste:** cadastro novo → onboarding → documento → concluir → a conta está na fila (**item 1 inteiro**, incluindo a primeira conclusão `incomplete → pending_validation`); e admin comum de teste aprova → a conta entra no painel (**item 3**). O email **não** é asserção de E2E; a asserção é o `status` e o painel
  - [ ] **Parte C:** o CI rodando **verde contra o projeto de teste**, com o número de testes executados (não pulados) escrito aqui
  - [ ] Enquanto a decisão não existir, a parte B fica **escrita e pulando com o motivo escrito**, nunca verde à toa
- **Descobertas do `vetria-qa` em 23/09, e para onde foram:** (1) o skip calado: parte A deste card. (2) **conta vet aprovada não tem caminho pela interface de volta à fila**: hoje isso só atrapalha o teste (conta de teste aprovada é conta perdida), e o projeto de teste resolve o lado do teste; o lado do produto é o **R-066**, que encosta na T-019. (3) **a Action de concluir sem documento grava os dados antes de recusar**: é o comportamento desenhado na T-024 (a mensagem diz *"Seus dados foram salvos, mas..."*); registrado aqui, sem card
- **Não fazer:** não pôr a `service_role` **de produção** em lugar nenhum do CI. Não criar conta em produção sem combinar como ela é limpa. Não aprovar nem reprovar a conta `E2E_VET_EMAIL` enquanto o CI apontar para produção.
- **Resultado:** ✅ **Decisão do R-033 = DL-064** (projeto `vetria-e2e`, a `service_role` **do teste** só no passo E2E, o pré-voo recusa URL de produção). `7426951` pôs o CI no projeto de teste com `E2E_ALVO=teste` e `E2E_EXIGIR_FILA=1`. **Parte C medida:** CI #22 da PR #4, **70 testes, 70 aprovados, 0 pulados**, incluindo `fluxos-conta-nova.spec.ts` (item 1 inteiro e item 3). Em 25/09 o CI roda **88 + 10** (os 10 são a busca com dados, ligada em `71fd770` depois da `0005` no `vetria-e2e`) e é **obrigatório na `main`** (ruleset: tudo entra por PR). **Fecha o R-033 e o item 5 do DoD da F3** (DL-069). ⚠️ Herdou um risco novo: o `vetria-e2e` é plano grátis e **pausa após 7 dias sem uso** (R-073, card T-044).

### T-030 — O onboarding para de brigar com quem preenche: limite de especialidades e botão de arquivo em português
- **Estado:** ✅ **CONCLUÍDA pela T-035 em 23/09/2026** (`b6e8452`, `dd21dce`). _(abertura: ⬜ fila, S5, item 4)_
- **Fase / Semana:** F4 / S5
- **Capacidade:** **E2** — *"o que o vet/estabelecimento digita no onboarding persiste"*. Hoje ele digita, avança três passos e é mandado de volta ao primeiro
- **Nível:** 🟡 — `components/` e dois formulários
- **Agente dono:** vetria-ui
- **Depende de:** nada
- **Por quê:** **R-060**, visto pelo Elber na prova da T-024: os chips do passo 1 deixam marcar mais especialidades que o limite, e só o passo 4 avisa, mandando de volta ao passo 1. E o `<input type="file">` de `components/app/EnvioDeDocumento.tsx:234` mostra *"Choose file / No file chosen"* em navegador em inglês, no passo que decide se a pessoa entra na fila
- **Feito quando:**
  - [ ] O chip recusa a quinta especialidade **no ato**, com o motivo visível, e o passo 1 não avança fora do limite. **A regra do servidor não muda** e continua sendo a que vale
  - [ ] **Conferido o clone:** o `ClinicOnboardingForm` tem limite parecido (serviços) com o mesmo defeito? Se tiver, sai junto (R-017)
  - [ ] O botão de arquivo é **nosso**, em português, em qualquer idioma de navegador: input nativo escondido, `<label>` visível com texto próprio, nome do arquivo escolhido mostrado por nós, foco visível e ativação por teclado mantidos
  - [ ] De carona, nos mesmos dois formulários: `cursor-pointer` nos 9 `<button>` que não têm (DL-040, achado 9 da T-025)
  - [ ] Sem travessão (DL-038). Responsivo em 360 px. Os testes de `onboarding-vet.spec.ts` continuam verdes
- **Não fazer:** não mexer na Server Action nem no limite. Não mexer em `/api/documentos/upload`. Não construir o editor de perfil (T-019).
- **Resultado:** ✅ **absorvida pela T-035.** A quinta especialidade não entra, com aviso, no próprio passo 1 (teste em `onboarding-vet.spec.ts` clica nela mesmo com `aria-disabled`, `dd21dce`); `EnvioDeDocumento` ganhou o "Escolher arquivo" próprio, em português em qualquer navegador. **Fecha o R-060.** ⚠️ Não conferido por este quadro: o clone do limite de serviços no `ClinicOnboardingForm` e o `cursor-pointer` de carona; se o `vetria-qa` achar falta, vira achado na próxima varredura.

### T-020 — Teto de volume, cota e limpeza do bucket `documentos` (SEC-081) 🟠
- **Estado:** ⬜ **fila dos próximos 5 dias, item 3** (25/09). Não começou na S5. ⛔ **É o item 2 do portão de abertura (DL-063), prazo 20/10.** Enquanto só houver conta de teste, não bloqueia nada
- **Fase / Semana:** F4 / S5 (se não couber, S6). ~~F6/S11~~: saiu de lá em 23/09, porque o portão de abertura vence antes
- **Capacidade:** **E1** mais a transversal obrigatória **LGPD** (`00-ESCOPO.md` §2)
- **Nível:** 🟡 — é a rota, e é `/api/*`. ⚠️ **Vira 🔴 se a saída escolhida for apagar objeto**
- **Agente dono:** vetria-backend · **auditoria obrigatória:** vetria-seguranca
- **Depende de:** **T-008 ✅**
- **Por quê:** **SEC-081, o único 🟠 aberto da auditoria da T-008.** A rota limita o **tamanho de cada arquivo** (10485760, conferido duas vezes) e **não limita mais nada**: nem número de envios, nem total por conta, nem taxa. Cada envio gera caminho novo, e a `0003` §3 decidiu, por escrito, que **o objeto anterior não é apagado**. Cadastro com email descartável nasce `incomplete`, que está em `PODEM_ENVIAR` de propósito, e um laço de `curl` com um arquivo válido de 10 MiB produz **mil objetos, ~10 GB, 999 sem linha que os aponte**. **Não é vazamento** — o bucket tem zero policy. É **custo sem teto e retenção indevida de documento de identidade**, que é o R-023 acontecendo na criação e em escala
- **Feito quando** — direção, não desenho fechado:
  - [ ] Teto de envios por conta por janela, decidido **no servidor**, lendo a contagem de objetos sob o prefixo `<uuid>/` **antes** do passo 7
  - [ ] ⚠️ **Se a saída escolhida for apagar a versão anterior, isso contraria a `0003` §3** (*"o admin pode precisar comparar o que aprovou com o que chegou depois"*) e **vira decisão registrada em `05-DECISOES.md`**, não conserto de rota. E apagar objeto é 🔴
  - [ ] Conferir se o plano do Supabase oferece cota de bucket, antes de escrever código que a emule
  - [ ] **Rate limit no firewall da Vercel** para `/api/documentos/*`, ~20 pedidos/min por IP (painel, sem código, gesto do Elber guiado pelo card; `SEC-2026-09-23-rate-limit-captcha-2fa.md` §1). Conferir no painel e escrever aqui a regra aplicada
  - [ ] De carona, o **R-056** (o corpo do pedido é materializado inteiro antes do teto), que é conserto natural desta mesma rota
  - [ ] **Acrescentado em 25/09:** de carona, o **R-057** (três linhas: recusar quando `Sec-Fetch-Site` não for `same-origin`, nas duas rotas de documento)
  - [ ] **Acrescentado em 25/09 (SEC-119):** a mesma sessão de firewall cria a regra de `/buscar` e `/api/cidades` (sugestão: ~60 pedidos/min por IP; cada GET de `/buscar` faz 7 a 9 consultas). Quando a T-040 existir, `/api/contato` entra com regra própria, mais dura. Escrever aqui as regras aplicadas
- **Não fazer:** não escrever cron. Não antecipar a rotina de exclusão da T-018. Não baixar o teto de 10 MiB sem falar com o produto: documento de identidade fotografado por celular passa de 4 MB com facilidade.
- **Resultado:** _(a preencher)_


> **Cards T-034 a T-037: nasceram durante a S5 sem card escrito antes** (as sessões de 23 e 24/09 foram
> direto ao código). Estão escritos agora, pelo `vetria-maestro`, com a capacidade e a prova, porque
> trabalho sem card é trabalho que a fila não enxerga. **Regra que volta a valer:** card antes do código.

### T-034 — Senha com regra única, erros de login em português e o botão de mostrar senha
- **Estado:** ✅ **CONCLUÍDA em 23/09/2026, em produção** (`19a2917`)
- **Fase / Semana:** F4 / S5 · **Capacidade:** **E2** (*"um profissional consegue se cadastrar"*) e a transversal **Segurança** · **Nível:** 🟡 · **Dono:** vetria-ui
- **Por quê:** a regra de senha só existia na tela e divergia entre telas (R-064); os erros do Supabase Auth chegavam em inglês ou sumiam; `/recuperar-senha` dizia "email enviado" quando o envio falhava
- **Resultado:** ✅ `lib/auth/senha.ts` (8 caracteres, maiúscula, minúscula e número; a mesma regra do painel do Supabase, conferida antes de chamar o servidor), `lib/auth/erros.ts` (todo erro do Auth traduzido, nenhum some), `components/ui/CampoSenha.tsx` (mostrar e ocultar) nas 6 telas. De carona, `9b25fba`: link de senha vencido leva a `/recuperar-senha` com aviso, não à home muda. ⚠️ **O R-064 não fecha só com isto:** falta a prova do lado do servidor (cadastrar com 7 caracteres direto e ver o Supabase recusar), gesto do Elber.

### T-035 — Máscaras nos campos, o limite de especialidades no passo certo e o botão de arquivo em português
- **Estado:** ✅ **CONCLUÍDA em 23/09/2026, em produção** (`b6e8452`, `dd21dce`) · **absorveu a T-030**
- **Fase / Semana:** F4 / S5 · **Capacidade:** **E2** · **Nível:** 🟡 · **Dono:** vetria-ui + vetria-qa (testes)
- **Por quê:** R-060 (a quinta especialidade só era recusada no passo 4) e atrito de digitação no funil que alimenta a busca
- **Resultado:** ✅ `lib/campos/mascaras.ts` + `CampoMascarado`: CRMV só dígitos, CNPJ e CPF com dígito verificador (CNPJ alfanumérico incluso), telefone e WhatsApp com DDD válido, CEP. **A máscara é só visual: o servidor recebe o formato de sempre, e a `0004` continua sendo a regra.** A quinta especialidade não entra, com aviso, no passo 1. `EnvioDeDocumento` com "Escolher arquivo" próprio. Os testes que escrevem (`fluxos-conta-nova`, `admin-validacoes`, `tests/apoio/alvo.ts`) **só escrevem com `E2E_ALVO=teste` e recusam produção**. **Fecha o R-060.**

### T-036 — O link do email funciona em qualquer navegador (`token_hash` + `verifyOtp`)
- **Estado:** ✅ **CONCLUÍDA em 24/09/2026: rota em produção (`d5f64a4`), os 3 templates trocados no painel do Supabase e testado pelo Elber abrindo o link em outro navegador**
- **Fase / Semana:** F4 / S5 · **Capacidade:** **E2** (o profissional confirma o cadastro e recupera a senha) · **Nível:** 🟡 código / 🔴 templates no painel (Elber) · **Dono:** vetria-backend · **Auditoria:** `SEC-2026-09-23-T036-0005.md`, APROVADO, 🔴 0 · 🟠 0 · 🟡 3
- **Por quê:** o fluxo PKCE amarrava o link ao navegador que pediu; quem pedia no computador e abria no celular caía num erro
- **Resultado:** ✅ `/auth/confirm` com botão "Continuar" (POST; o GET não gasta o token, contra antivírus de email que abre links), lista fechada de `type` sem `invite`/`magiclink` (**SEC-113, corrigido na hora**), `recovery` sempre para `/recuperar-senha/nova`, regra anti open redirect reforçada. `/auth/callback` continua para o Google e links antigos. **Ordem seguida:** deploy da rota, depois troca dos templates. **Ficam abertos:** **SEC-112** (injeção de conta: mostrar `Você entrou como a***@dominio` e `frame-ancestors`, vai com a **T-033**) e **SEC-114** (limite de verificação do Supabase, vai com a **T-031**). Riscos R-067 e R-068.

### T-037 — `/buscar` e as páginas públicas `/veterinario/[slug]` e `/estabelecimento/[slug]`
- **Estado:** ✅ **CONCLUÍDA em 25/09/2026, em produção** (PR #7: `0ff5af6`, `07f41d3`, `d4fa47c`, `71fd770`; roadmap na PR #8)
- **Fase / Semana:** F4 / S5 (o plano punha a busca na **S6** e o perfil na **S7**) · **Capacidade:** **E4** (*"`/buscar` filtra por cidade + especialidade + tipo de atendimento... filtro no backend"*) e **E5** (*"renderizam dados reais"*) · **Nível:** 🟡 · **Dono:** vetria-backend + vetria-ui · **Auditoria:** `SEC-2026-09-23-F4-busca-e-perfil-publico.md`, APROVADO, 🔴 0 · 🟠 0 · 🟡 3
- **Depende de:** T-028 ✅ (a página degradava para "a busca abre em breve" até a `0005` entrar)
- **Resultado:** ✅
  - `/buscar` com texto, cidade + UF com sugestões (`/api/cidades`), especialidade, serviço, tipo de atendimento e tipo de conta; ordem alfabética (DL-070 D); paginação com teto de 25 páginas; todos os estados honestos. A busca da Home leva a `/buscar`.
  - **Visibilidade:** o cliente é o **anônimo** (`lib/supabase/publico.ts`, chave anon, sem cookie, sem `service_role`); quem aparece é decidido **só** pela RLS `perfil_esta_ativo`, sem filtro de status na aplicação (matriz §3 regra 2, conferido pela auditoria).
  - Perfis com **404 igual** para inexistente e não ativo; selo **"Verificado pela Vetria"** (DL-070 F); CRMV visível (DL-070 C); do vet só o bairro, do estabelecimento endereço e CEP (DL-070 E); `site` só `http(s)` com `rel="nofollow noopener noreferrer ugc"`; `force-dynamic` nas 3 páginas (**SEC-118 corrigido**).
  - **Telefone e WhatsApp fora do HTML**, conferido por teste (`busca-publica.spec.ts`: "nada de contato no HTML"). O bloco de contato diz "abre em breve" (`CONTATO_PELO_SITE_ABERTO = false`), sem botão falso.
  - **Prova em produção:** o perfil `larissa-lima-goiania-go` abre com dado real. **CI:** grupo A sempre, grupo B (10 testes com dados) ligado no `vetria-e2e` em `71fd770`.
  - ⚠️ **`noindex, nofollow` de propósito** (`lib/publico/indexacao.ts`, `PAGINAS_PUBLICAS_INDEXAVEIS = false`) até o portão de abertura. **O item 3 do DoD da F4 ("indexável pelo Google") só fecha com a T-045.** Aberto: **SEC-119** (consultas por GET sem limite, vai com a T-020).

---

# 🚪 PRÓXIMAS — o portão de abertura (DL-063): cards escritos, fila da S6 e da S7

> **Atualizado em 25/09:** a T-027 fechou o item 1. **T-033 e T-031 (código) sobem para os próximos 5
> dias**, porque a S5 terminou o que tinha antes do previsto. **A T-032 fica na semana de 07/10**, na
> sessão presencial que também aplica a `0006` em produção. **Prazo do portão: 20/10**, sem mudança.

### T-031 — Captcha Turnstile nas 6 telas de autenticação (SEC-102)
- **Estado:** ⬜ **fila dos próximos 5 dias, item 4 (o código).** Ligar no painel: sessão presencial de 30/09, **só depois do deploy**. 🔴 **auth**
- **Fase / Semana:** F4 / S6
- **Capacidade:** **E2** — *"um profissional consegue se cadastrar"*: sem captcha, um script esgota o teto de email do projeto e o cadastro de verdade não recebe a confirmação. Mais a transversal **Segurança**
- **Nível:** 🔴 — auth. O código é 🟡; **ligar no painel do Supabase é 🔴 e é o Elber**
- **Agente dono:** vetria-ui (o widget nas telas) + vetria-backend (conferência) · **auditoria:** vetria-seguranca
- **Depende de:** nada. Chave do Turnstile criada pelo Elber (🔴 `.env`)
- **Por quê:** **R-061.** Login, cadastro e recuperação de senha vão do navegador direto ao Supabase. Firewall da Vercel não vê esse tráfego; Cloudflare também não (DL-063)
- **Feito quando:**
  - [ ] Widget Turnstile em `/login`, nos 3 `/cadastro/*`, em `/recuperar-senha` e nos "reenviar email", passando o token nas chamadas do Supabase Auth
  - [ ] ⚠️ **A ordem, sem exceção:** código → deploy → conferir em produção que o token está indo → **só então** o Elber liga o captcha no painel. Na ordem inversa, ninguém entra, nem o Elber
  - [ ] Prova em tela depois de ligado: cadastrar, entrar, recuperar senha, com conta de teste. E uma chamada sem token **recusada**
  - [ ] Os testes de login do CI continuam passando (a chave de teste do Turnstile existe para isso)
  - [ ] **Acrescentado em 25/09 (SEC-114, R-068):** na mesma sessão, o Elber confere e sobe o limite de verificação de OTP em Auth → Rate Limits, e escreve aqui o valor. O `verifyOtp` da T-036 sai da Vercel, então um script pode esgotar a cota de todos
  - [ ] **Acrescentado em 25/09:** a chave e o widget ficam reutilizáveis, porque a S8 pode pedir o Turnstile invisível no clique do WhatsApp (decisão **D4**). Não ligar lá nesta task
- **Não fazer:** não pôr Cloudflare na frente da Vercel. Não construir limite próprio de tentativas.
- **Resultado:** _(a preencher)_

### T-032 — 2FA obrigatório para admin e master, na tela e no banco (SEC-103)
- **Estado:** ⬜ **semana de 07/10** (reencaixada em 25/09). 🔴 **auth + migration: sessão presencial.** ⛔ **Trava própria, mais cedo que o portão: antes do segundo admin** (R-014), mesmo que a abertura atrase
- **Fase / Semana:** F4 / S7
- **Capacidade:** **E3** — *"`/admin/validacoes` ... aprova ou reprova"*: quem aprova precisa ser quem diz que é. Mais a transversal **Segurança**
- **Nível:** 🔴 — auth, e `is_admin()` é função de policy
- **Agente dono:** vetria-backend · **auditoria obrigatória:** vetria-seguranca
- **Depende de:** **T-027** aplicada (as duas mexem em policies de admin; uma de cada vez)
- **Por quê:** **R-062.** Senha vazada do master entrega o dossiê da base inteira
- **Feito quando:**
  - [ ] Tela de cadastro e desafio do TOTP (Supabase MFA) para `role = 'admin'`
  - [ ] `requireAdmin` (`lib/auth/admin.ts`) exige `aal2`; sem ele, manda para o desafio
  - [ ] ⚠️ **A ordem:** tela no ar → o Elber cadastra o TOTP dele e prova que entra → **só então** a migration faz o `is_admin()` exigir `aal2` no JWT. `SECURITY DEFINER` + `SET search_path = public` (DL-014/015)
  - [ ] Prova: com senha só, a tela manda para o desafio **e** o PostgREST com o token `aal1` devolve zero linha nas tabelas de admin
  - [ ] Plano de recuperação escrito: o que acontece se o Elber perder o celular (códigos de recuperação guardados fora do repositório)
- **Não fazer:** não obrigar 2FA para profissional (§Ideias, mês 4).
- **Resultado:** _(a preencher)_

### T-033 — Cabeçalhos de segurança no `next.config.ts` (SEC-104)
- **Estado:** ⬜ **fila dos próximos 5 dias, item 2** (primeiro do backend, 25/09)
- **Fase / Semana:** F4 / S5-S6
- **Capacidade:** **E3** — o botão *Aprovar* não pode ser clicado dentro de um iframe alheio (clickjacking). Mais a transversal **Segurança**
- **Nível:** 🟡 — config
- **Agente dono:** vetria-backend · **auditoria:** vetria-seguranca
- **Depende de:** nada
- **Por quê:** **R-063.** `next.config.ts` só configura `X-Robots-Tag`
- **Feito quando:**
  - [ ] `frame-ancestors 'none'` / `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
  - [ ] Conferido que o `/entrega-fase-2` e o logo SVG (DL-040, `dangerouslyAllowSVG` com CSP sandbox) continuam funcionando
  - [ ] HSTS medido no domínio de produção (`curl -I https://vetriabrasil.com.br`), com a saída escrita aqui
  - [ ] Teste em `publico.spec.ts` conferindo os cabeçalhos
  - [ ] **Acrescentado em 25/09 (SEC-112, R-067):** o `frame-ancestors 'none'` cobre também `/auth/confirm`; e a tela depois do `verifyOtp` mostra *"Você entrou como a\*\*\*@dominio"* com o caminho de sair, para a vítima de um link de conta alheia perceber em que conta está (é tela: `vetria-ui`, na mesma PR ou logo depois)
- **Não fazer:** CSP completa com nonce (F6).
- **Resultado:** _(a preencher)_


---

# 📋 PLANEJADA — F4 / S8: o contato por WhatsApp e o registro de contatos (escrita em 25/09/2026)

> **Capacidade E5:** *"CTA de WhatsApp funciona e o contato fica registrado."* **DoD da F4, itens 4 e 5:**
> *"Clicar em WhatsApp abre a conversa **e** o contato aparece no histórico do responsável"* e *"E2E do
> fluxo busca → perfil → contato passando em CI"*. É **a última capacidade da F4 que tem zero linhas**.
>
> **O que já está decidido e amarra tudo abaixo** (não se rediscute): DL-047 (o clique é POST no servidor,
> o servidor grava e **só então** devolve o número, sem conta, sem pedir nada antes), DL-049 (o número
> mora em `perfil_privado`, que ninguém de fora lê), matriz §3 regra 3 e §6, e os tipos já prontos em
> `lib/perfil-publico/contato.ts` (`PedidoDeContato`, `RespostaDoContato`, `CONTATO_PELO_SITE_ABERTO`).
> A tabela `contatos` existe desde a `0002` (vazia, sem policy de INSERT, `revoke insert/update/delete`
> para `anon` e `authenticated`).
>
> **Calendário proposto, com a folga que a S5 abriu:** `0006` escrita e auditada até 30/09 → aplicada no
> `vetria-e2e` em 30/09 → rota e botão (T-040, T-041) na semana de 30/09 → `0006` em produção e painéis
> (T-042) na semana de 07/10 → E2E (T-043) até 13/10. **A S8 do plano (14 a 20/10) fica para fechar o
> DoD da F4, o portão e a indexação (T-045)**, e o que sobrar começa a F5 sem publicar nada.

## O desenho recomendado

**1. O que o responsável vê e clica** (no perfil público; D8)
1. Bloco "Contato" com o botão **"Chamar no WhatsApp"**. O HTML não tem número, nem `wa.me`, nem dígito
   do telefone (já é teste hoje).
2. O toque faz `POST /api/contato` com `{ alvo: { tipo, slug }, origem: { cidade, especialidade }, canal }`
   (a origem vem da busca que levou ao perfil, pela URL).
3. O servidor responde `{ ok: true, whatsapp }`. O bloco passa a mostrar o **número formatado**, um botão
   **"Abrir no WhatsApp"** (link `https://wa.me/55<número>?text=<mensagem, D7>`) e **"Copiar número"**.
   **Por que dois toques e não abrir sozinho:** abrir janela depois de um `await` é bloqueado pelo Safari do
   iPhone, e quem está no computador sem WhatsApp precisa do número à vista. É o padrão dos classificados
   e diretórios ("ver telefone").
4. Logo abaixo, o convite: *"Quer acompanhar seus contatos? Crie sua conta."* com **"Agora não"** visível.
   Convite, nunca portão (matriz §6.3).
5. Estados honestos: `sem_whatsapp` (o botão nem aparece; texto *"Este profissional ainda não informou
   WhatsApp"*, ver D9), `muitas_tentativas`, `nao_encontrado` (o perfil saiu do ar), `indisponivel`.

**2. Como o servidor entrega o número sem ele ir no HTML** (D1). **Recomendação: rota nossa + função do
banco que só o servidor pode chamar.** É o padrão de mercado ("click to reveal" registrado no servidor, com
limite) e o menos privilegiado dos dois caminhos.
- **`app/api/contato/route.ts`** (só POST, `Cache-Control: no-store`): confere `Sec-Fetch-Site: same-origin`
  (a lição do R-057), valida o corpo contra listas fechadas (tipo `vet`/`clinic`, slug `^[a-z0-9-]{1,120}$`),
  lê ou cria o cookie do visitante (D2), lê o usuário logado se houver, confere o Turnstile se D4 = sim, e
  chama **uma** função. **Nunca** escreve o número em log.
- **`registrar_contato(...)`**, na `0006`: `SECURITY DEFINER` + `SET search_path = public`, **`EXECUTE`
  revogado de `public`, `anon` e `authenticated` e concedido só a `service_role`**. Numa transação:
  resolve `slug → id` exigindo role certo **e** `active`; aplica o limite por visitante (D3) e a
  deduplicação (D5); lê `perfil_privado.whatsapp` (nulo → `sem_whatsapp`, sem gravar); grava a linha em
  `contatos` (com `anon_id` **sempre**, e `user_id` quando logado); **só então** devolve o número. A origem
  é conferida contra `cidades.slug` / `especialidades.slug` / `servicos.slug` (fora da lista vira nulo: lixo
  não entra na métrica que se vende). Contato de alguém consigo mesmo não é gravado.
- **Por que não a função chamável pelo `anon`:** a chave anon está no bundle. Qualquer um chamaria
  `/rest/v1/rpc/registrar_contato` direto no Supabase, com um `anon_id` novo a cada pedido, **por fora do
  firewall da Vercel e do nosso limite**: é a raspagem que o DL-047 existe para impedir.
- **Por que não a rota com `service_role` lendo `perfil_privado` e inserindo em `contatos`:** duas
  operações sem transação (a lição do R-042) e um cliente com a base inteira na mão numa rota pública. Com
  a função, o `service_role` na rota só alcança **uma** operação estreita.

**3. Anti-abuso, em camadas** (nenhuma sozinha basta)
- **Borda:** regra do firewall da Vercel em `/api/contato` (sugestão: 10 pedidos/min por IP). O IP **não é
  gravado por nós** (DL-047 alternativa c).
- **Banco:** limite por visitante (`anon_id` ou `user_id`) dentro da função (D3), com índice
  `(anon_id, created_at)` e `(user_id, created_at)`.
- **Robô que apaga o cookie a cada pedido:** só a borda e o Turnstile o seguram (D4).
- **CSRF:** `Sec-Fetch-Site` + `SameSite=Lax`.
- **Limite honesto:** um raspador paciente, com muitos IPs, ainda tira números devagar. Aceito: o
  profissional publica o WhatsApp para ser chamado; o que se impede é a base inteira de uma vez.

**4. Cookie `anon_id` e LGPD** (D2, D10, D11)
- Cookie primário `vetria_visitante`, UUID aleatório, `httpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, 180 dias.
- **Recomendação: nasce no primeiro clique de contato, não na primeira visita** (a matriz §6.1 diz "primeira
  visita"). Minimização: quem só olha não ganha identificador. **Muda a matriz: exige DL.**
- É identificador on-line, logo **dado pessoal pseudônimo**. Base legal: **legítimo interesse** (art. 7º,
  IX: segurança contra abuso e o próprio serviço ao visitante), com transparência: uma linha sob o botão
  (*"Registramos este contato para o profissional saber quantas pessoas o procuraram e para evitar
  abuso."*) e o trecho na Política de Privacidade (F6).
- **O `anon_id` é segredo de quem o carrega:** quem o conhece pode, criando conta com ele no cookie, puxar
  o histórico daquele navegador. Por isso **ninguém além do servidor lê essa coluna** (R-074).

**5. O que o profissional vê em "Contatos recebidos"** (D6), `/app/veterinario/contatos` e
`/app/estabelecimento/contatos` (já `SO_ATIVO`, matriz §4)
- **O número grande:** *"12 contatos nos últimos 30 dias"* e o do mês corrente; o mesmo número num cartão do
  painel inicial (plano §S8).
- **A lista:** data e hora, canal (WhatsApp) e a origem (*"veio de uma busca por Clínica geral em
  Goiânia"* ou *"acesso direto ao seu perfil"*). **Sem identidade de quem clicou** na V1.
- Estado vazio honesto: *"Nenhum contato ainda. Quando alguém tocar em Chamar no WhatsApp no seu perfil, ele
  aparece aqui."*
- **Lê pela sessão do dono** (`contatos_select_profissional`), com `anon_id` e `user_id` fora do alcance
  (R-074, `0006`).

**6. O que o responsável vê em `/app/responsavel/historico`**: a tela deixa de prometer *"Seus
agendamentos"* e vira **"Seus contatos"** (DL-047): nome do profissional com link para o perfil (se ainda
`active`; senão *"Este perfil não está mais disponível"*), data, e **"Chamar de novo"** pelo mesmo POST.

## O que é 🔴 e precisa do Elber

- **A `0006`** (T-039): função nova, grants, mudança de privilégio de coluna em `contatos`, trigger do slug
  (SEC-115), mudança do CHECK `contatos_tem_origem` (R-076). **Sessão presencial**, `vetria-e2e` primeiro.
- **A emenda da matriz §6** (cookie no clique, se D2 = sim) e **a §3** (quem lê quais colunas de
  `contatos`), por DL **antes** do SQL.
- **As regras do firewall da Vercel** e, se D4 = sim, o Turnstile no clique (mesma chave da T-031).
- **Ligar `CONTATO_PELO_SITE_ABERTO = true`** é 🟡, mas só depois da `0006` **em produção** (T-041).

## ⚖️ Decisões que o Elber precisa tomar (cada uma com a recomendação do `vetria-maestro`)

| # | Decisão | Recomendação, em uma linha |
|:-:|---|---|
| **D1** | Como o servidor entrega o número | Rota `/api/contato` + função `registrar_contato` com `EXECUTE` **só para `service_role`**: grava e devolve na mesma transação, e o `anon` não a alcança. |
| **D2** | Quando nasce o cookie `anon_id` e por quanto tempo | No **primeiro clique de contato** (não na primeira visita), 180 dias, `httpOnly`/`Secure`/`Lax`, legítimo interesse com aviso de uma linha; emenda a matriz §6.1 por DL. |
| **D3** | Limites | Por visitante no banco: **5 profissionais distintos em 10 min e 20 em 24 h**; por IP na borda da Vercel: **10/min** em `/api/contato`; IP nunca gravado. |
| **D4** | Turnstile invisível no clique | **Sim**, com a chave da T-031; se a T-031 atrasar, a S8 sai sem ele e ele entra **antes da abertura** (vira item do portão). |
| **D5** | Deduplicação | Mesmo visitante + mesmo profissional em **24 h conta 1** (o número volta, a linha não se repete): a métrica que se vende tem que ser honesta. |
| **D6** | O que o profissional vê | **Contagem + data + origem da busca**, sem identidade de quem clicou na V1; `anon_id` e `user_id` ilegíveis para ele. |
| **D7** | Mensagem pré-preenchida | *"Olá! Encontrei seu perfil na Vetria e gostaria de mais informações."*: curta, e diz ao profissional de onde veio o cliente. |
| **D8** | Onde fica o botão | **Só no perfil público** na V1, não no cartão da busca: um lugar só para medir, proteger e testar. |
| **D9** | WhatsApp é obrigatório? | **Sim, para concluir o onboarding a partir de agora** (Action, 🟡); quem já está `active` sem WhatsApp vê aviso no painel. Perfil sem contato é vitrine que não gera lead (R-036, aberto desde 31/08). |
| **D10** | Vincular contatos anônimos à conta | **Só na criação de conta de responsável**, contatos dos últimos 30 dias daquele navegador; não em todo login (computador compartilhado). |
| **D11** | Retenção | Contato anônimo não vinculado **perde o `anon_id` em 12 meses** (a contagem do profissional fica); excluir conta anonimiza a linha em vez de apagar. A rotina é da F6; **a regra (e o CHECK) é da `0006`**. |
| **D12** | Indexação no Google (DoD F4 item 3) | Ligar `PAGINAS_PUBLICAS_INDEXAVEIS` **e** publicar `sitemap` **no dia em que o portão fechar**, com DL (T-045). Antes disso, não. |

**Fora da tabela, mas precisa de resposta:** o projeto Supabase de **produção** está no plano grátis? (R-073.
Se sim, recomendação: **Pro antes da abertura**; site que pausa sozinho não é entrega.) E a **SEC-115**: o
padrão da `0006` é **trigger** recusando mudança de `slug` fora do gerador e do master (em vez de afrouxar a
matriz); se o Elber preferir o DL, é uma linha a menos.

## Os cards da S8

### T-039 — A `0006`: a função que registra o contato e devolve o número, e a leitura de `contatos` sem o `anon_id`
- **Estado:** 🔵 **SQL ESCRITO e ENSAIADO LOCALMENTE em 25/09/2026, NÃO APLICADO em banco nenhum** (branch `t-039-migration-0006`). Falta: auditoria do `vetria-seguranca` → o roteiro do Resultado, `vetria-e2e` primeiro. Decisões D1 a D12 aprovadas pelo Elber em 25/09 como recomendadas
- **Fase / Semana:** F4 / S6-S7 (é o trabalho da S8, adiantado)
- **Capacidade:** **E5** — *"CTA de WhatsApp funciona e o contato fica registrado"*
- **Nível:** 🔴 — migration, função `SECURITY DEFINER`, grants, RLS
- **Agente dono:** vetria-backend, **com o Elber na aplicação** · **auditoria obrigatória:** vetria-seguranca (correção volta para ela, DL-050)
- **Depende de:** **as decisões D1, D2, D3, D5, D6, D10, D11** (sem elas, escreve com as recomendações e marca "confirmar antes de aplicar"); DL novo emendando a matriz §3 e §6 **antes** do SQL
- **Por quê:** sem ela o número não tem como sair do banco para quem não é o dono, e o clique não tem onde ser gravado. É a peça 🔴 da S8
- **Feito quando:**
  - [ ] **DL** com D1 a D11 como decididos, e a matriz §3 (linha `contatos`: quem lê **quais colunas**) e §6 (quando nasce o cookie) atualizadas **antes** do SQL
  - [x] `registrar_contato(tipo, slug, user_id, anon_id, origem_cidade, origem_especialidade)` como no desenho §2: `SECURITY DEFINER` + `SET search_path = public` (DL-014/015), `EXECUTE` só `service_role`, uma transação, número só depois da linha gravada, limites (D3), deduplicação (D5), origem conferida contra as listas _(escrito e ensaiado, não aplicado)_
  - [x] **R-074:** `anon_id` e `user_id` de `contatos` fora do alcance do profissional pelo PostgREST (privilégio por coluna: `revoke select` na tabela e `grant select` só nas colunas que as telas usam), com a sonda provando o `42501` _(ensaiado)_
  - [x] **R-076:** o CHECK `contatos_tem_origem` deixa de impedir a anonimização (excluir a conta de um responsável hoje **falharia**: `user_id` vira nulo pelo `on delete set null` e a linha sem `anon_id` viola o CHECK) _(ensaiado com exclusão real da conta)_
  - [x] `vincular_contatos_do_visitante(user_id, anon_id)`, também só `service_role`, só para conta `tutor`, só linhas sem `user_id` e dos últimos 30 dias (D10) _(ensaiado)_
  - [x] **SEC-115:** trigger recusando mudança de `slug` fora do gerador e do master. **SEC-116:** `raise` quando a aprovação não achar a linha de perfil para gerar o slug _(ensaiado)_
  - [x] Índices para os limites. Pré-voo, backup, verificar e reversão no padrão da `0004`/`0005`
  - [x] **Sondas:** `anon` e `authenticated` chamando `rpc/registrar_contato` recebem recusa; conta `pending_validation` devolve `nao_encontrado`; perfil sem WhatsApp devolve `sem_whatsapp` **e não grava**; 2º clique em 24 h não duplica; o 6º profissional em 10 min devolve `muitas_tentativas`; o profissional lendo `anon_id` recebe `42501` _(sonda 2 do verificar, 58 casos; verde no ensaio, falta rodar no `vetria-e2e` e em produção)_
  - [ ] Auditoria APROVADA → `vetria-e2e` (CI verde) → produção, com o Elber
- **Não fazer:** agendamento, avaliação ou qualquer `canal` além de `whatsapp`. Gravar IP. Tabela nova de "leads" (a `contatos` é a tabela).
- **Resultado:** 🔵 **ESCRITA e ENSAIADA em 25/09/2026, NÃO APLICADA.** Arquivos: `supabase/migrations/0006_contato_registrado_e_slug_protegido.sql`, `supabase/prevoo-0006.sql`, `supabase/backup-antes-da-0006.sql`, `supabase/verificar-apos-0006.sql`.

  **Ensaio (DL-050: revisão não substitui execução).** PGlite (Postgres 18.3) sobre um esboço do Supabase (`auth.uid()`, `auth.role()`, `anon`/`authenticated`/`service_role`, `storage.*`) + `montar-vetria-e2e.sql` + `0004` + `0005` + seed de cidades: select final **26/26 `true`**; rodada de novo, **26/26** (idempotente); **sonda 2: 58/58 OK** num banco com 5 contas e num com 27, e **nada sobra** depois (contas, contatos, slugs e status iguais); a sonda 2 da `0005` continua **100% OK** depois da `0006`; **controle negativo:** num banco sabotado (grant de SELECT de volta, EXECUTE para anon, trigger do slug removido, CHECK antigo) a sonda deu FALHA exatamente nos casos certos; o pré-voo **parou sem mudar nada** com `slug_ao_ativar` editada, com uma policy de INSERT em `contatos` e sem a `0005`; a reversão da §10 voltou as duas funções aos hashes da `0005` e a `0006` entrou limpa de novo; a exclusão **real** da conta de um responsável (R-076) anonimizou as linhas em vez de falhar. ⚠️ PGlite não é o Supabase: grants por default privileges, o `service_role` do SQL Editor e a concorrência (a trava por visitante) só se provam no `vetria-e2e`.

  **Uma exceção à regra "aditiva", pedida pelo card (R-076, D11):** o CHECK `contatos_tem_origem` é trocado por `contatos_tem_origem_ou_anonimizado` (`drop constraint` + `add constraint` na mesma transação; Postgres não altera expressão de CHECK). A regra nova só afrouxa para linha **anonimizada** (carimbada por trigger em `anonimizado_em`); linha nova sem origem continua recusada (sonda 2, casos 54 e 55).

  **Roteiro de aplicação (sessão presencial com o Elber, `vetria-e2e` primeiro, depois produção, nesta ordem):**
  1. **Auditoria APROVADA** do `vetria-seguranca` sobre os 4 arquivos. Sem ela, não roda.
  2. **`vetria-e2e`**, confira o nome do projeto no topo do SQL Editor:
     1. `prevoo-0006.sql`, **uma consulta por vez**. Esperado: consulta 0 `contatos_linhas = 0` e `active_sem_perfil = 0`; consulta 1 tudo `true`/3; consulta 2 igual ao comentário dela; consulta 3 **zero linhas**; consulta 4 `active_sem_slug = 0`, `slug_fora_do_formato = 0`; consulta 5 `posso_assumir_service_role = true`. Anote aqui.
     2. `backup-antes-da-0006.sql`: query 0 anotada, queries 1 a 4 em CSV em `supabase/backups/`.
     3. Leia a §10 (reversão) da migration.
     4. Cole a `0006` **inteira** e rode. Esperado: o select final com **26 linhas, todas `true`**. Se o pré-voo parar, a mensagem diz o quê, e nada entrou.
     5. `verificar-apos-0006.sql`, **uma sonda por vez**: sonda 1 (6 `true`), sonda 2 (**58 OK**; ela precisa de uma conta vet, uma clinic, uma tutor e uma admin), sonda 3 (`linhas = 0`, `sem_origem_TEM_QUE_SER_0 = 0`), sonda 4 (2 OK).
     6. Abra um PR qualquer (ou rode o CI) e confira o **CI verde** contra o `vetria-e2e`: nenhuma tela lê `contatos` hoje, e a aprovação em `/admin/validacoes` continua gerando slug.
  3. **Produção**: os mesmos passos 2.1 a 2.5. Depois, **prova em tela**: aprove uma conta na fila em `/admin/validacoes` e confira que ela ganhou o endereço (o gerador passou pelo trigger novo). Anote a data na tabela do `supabase/migrations/README.md`.
  4. Só então a T-040 liga a rota contra o `vetria-e2e`.

  **HANDOFF — vetria-backend — T-039 — 25/09/2026**

  **Fiz:** `0006_contato_registrado_e_slug_protegido.sql` (917 linhas): pré-voo §1 (0005 aplicada e as duas funções com o hash sem espaço da 0005, `contatos` como a 0002 a deixou e sem policy de escrita, nomes livres); §2 `contatos.anonimizado_em` + trigger `anonimizar_contato` (tira o `anon_id` quando a conta sai, carimba a data) + CHECK trocado (R-076, D11); §3 `revoke` de SELECT/escrita/TRUNCATE na tabela e `grant select` só em `id, profissional_id, canal, origem_cidade, origem_especialidade, created_at` para `authenticated`, `anon` sem nada (R-074, D6); §4 índices `(anon_id, created_at)` e `(user_id, created_at)`; §5 `registrar_contato` (:372, devolve jsonb no formato `RespostaDoContato`, EXECUTE só `service_role` :488-489); §6 `vincular_contatos_do_visitante` (:509, só `tutor` criada há menos de 24 h, só linha sem dono e dos últimos 30 dias); §7 `proteger_slug` (:580) + triggers, `gerar_slug_do_perfil` com a marca `vetria.gerador_de_slug` (:626), `slug_ao_ativar` com `raise` 55000 (:715); §9 select final; §10 reversão. Mais pré-voo, backup, verificar (4 sondas) e o README das migrations (linha da 0006, hashes, e a 0005 marcada como aplicada).
  **Não fiz:** a rota `/api/contato` e o botão (T-040, T-041); o DL com D1 a D12 e a emenda da matriz §3/§6 (é do `vetria-escriba`; o card pede **antes** do SQL ir para produção); a auditoria (não é minha).
  **Estado agora:** nada mudou em banco nenhum. Com a 0006 aplicada, o comportamento novo é: o servidor tem uma porta para registrar o clique e receber o número; um profissional logado que pedir `anon_id` ou `user_id` de `contatos` recebe 42501; um admin comum que tentar trocar o endereço público de alguém recebe 42501; aprovar uma conta sem linha de perfil falha em vez de publicar sem endereço.
  **Descobri:** (1) `select=*` em `contatos` passa a dar 42501 para quem está logado: a T-042 **tem** que pedir as colunas pelo nome, inclusive nas contagens (`.select('id', { count: 'exact', head: true })`). (2) O `anon` tinha TRUNCATE em `contatos` por default privileges (TRUNCATE ignora RLS); a 0006 revoga. (3) A marca do gerador não precisa de limpeza manual: função com `SET search_path` restaura as configurações na saída (sonda 2, caso 68). (4) A checagem "quem está mexendo no slug" usa `current_setting('role')` e não `current_user`, porque dentro de `SECURITY DEFINER` o `current_user` vira o dono; o SQL Editor (papel `postgres`) continua podendo trocar slug, que é o gesto manual do master do DL-067. (5) O `service_role` também fica proibido de trocar slug: nenhuma rota escreve slug hoje; se um dia precisar, é decisão registrada. (6) `vincular_contatos_do_visitante` recusa conta criada há mais de 24 h: a T-042 tem que chamá-la no cadastro (ou na primeira entrada logo depois da confirmação do e-mail), não em login qualquer.
  **Bloqueios:** auditoria do `vetria-seguranca`; o DL das decisões (escriba).
  **Próximo passo óbvio:** `vetria-seguranca` audita os 4 arquivos; aprovada, o Elber aplica no `vetria-e2e` pelo roteiro acima.
  **Docs que atualizei:** este card; `supabase/migrations/README.md`.
  **Commits:** branch `t-039-migration-0006` (hash na resposta ao maestro).

### T-040 — A rota `POST /api/contato` e o cookie do visitante
- **Estado:** ⬜ **semana de 30/09**, depois da T-039 no `vetria-e2e`
- **Fase / Semana:** F4 / S6-S7 · **Capacidade:** **E5** · **Nível:** 🟡 — `/api/*` e `lib/` · **Dono:** vetria-backend · **Auditoria:** vetria-seguranca
- **Depende de:** **T-039** aplicada no `vetria-e2e`; **T-031** se D4 = sim
- **Por quê:** é a única porta pela qual o número sai. Tem que estar certa antes de o botão existir
- **Feito quando:**
  - [ ] Só POST; `Sec-Fetch-Site` diferente de `same-origin` é recusado; corpo validado contra listas fechadas; resposta no formato `RespostaDoContato`; `Cache-Control: no-store`
  - [ ] Cookie `vetria_visitante` criado no primeiro clique (D2), com os atributos do desenho §4
  - [ ] Chama `registrar_contato` pelo `lib/supabase/admin.ts` (`server-only`) e nada mais com esse cliente
  - [ ] Número e `anon_id` **nunca** em log (só o `code` do erro, como no resto do projeto)
  - [ ] Turnstile conferido no servidor, se D4 = sim
  - [ ] **Gesto do Elber, guiado por este card:** regra do firewall da Vercel em `/api/contato` (D3), escrita aqui
  - [ ] Teste de API no CI: sem `Sec-Fetch-Site` recusa; slug inválido recusa; o número só vem no corpo da resposta do POST
- **Não fazer:** o botão (T-041). Server Action no lugar da rota (a regra de firewall precisa de caminho fixo).
- **Resultado:** _(a preencher)_

### T-041 — O botão "Chamar no WhatsApp", a revelação do número e o convite, no perfil público
- **Estado:** ⬜ **semana de 30/09** (pode ser construída contra o `vetria-e2e`; **liga em produção só depois da T-039 em produção**)
- **Fase / Semana:** F4 / S7 · **Capacidade:** **E5** · **Nível:** 🟡 — `components/` · **Dono:** vetria-ui
- **Depende de:** **T-040**
- **Por quê:** é o que o responsável toca. DoD da F4 item 4, primeira metade
- **Feito quando:**
  - [ ] `BlocoDeContato` (`components/publico/Perfil.tsx`) com o fluxo do desenho §1: botão → POST → número formatado + "Abrir no WhatsApp" (`wa.me/55…?text=` com D7) + "Copiar número" → convite com "Agora não"
  - [ ] Os quatro estados de erro com texto honesto; `sem_whatsapp` não desenha botão (D9)
  - [ ] A linha de transparência sob o botão (D2)
  - [ ] `CONTATO_PELO_SITE_ABERTO = true` **no mesmo commit que liga a rota em produção, e só então**
  - [ ] O HTML inicial continua **sem** número (o teste de hoje continua verde). Toque com teclado e leitor de tela; 360 px; sem travessão
- **Não fazer:** botão no cartão da busca (D8). Abrir o WhatsApp sozinho depois do `await`. Pedir nome ou conta antes do número.
- **Resultado:** _(a preencher)_

### T-042 — "Contatos recebidos" do profissional, "Seus contatos" do responsável e o vínculo na criação de conta
- **Estado:** ⬜ **semana de 07/10**
- **Fase / Semana:** F4 / S7-S8 · **Capacidade:** **E5** (*"o contato fica registrado"*) e o DoD F4 item 4, segunda metade · **Nível:** 🟡 · **Dono:** vetria-ui (telas) + vetria-backend (vínculo)
- **Depende de:** **T-039** em produção, **T-041**
- **Por quê:** o número de contatos é o que o plano pago vende (matriz §6); o histórico é o que faz o responsável criar conta
- **Feito quando:**
  - [ ] `/app/veterinario/contatos` e `/app/estabelecimento/contatos` deixam de ser casca: contagem de 30 dias e do mês, lista com data, canal e origem, estado vazio honesto (desenho §5). Cartão com a contagem no painel inicial
  - [ ] `/app/responsavel/historico` vira **"Seus contatos"** (desenho §6), sem nenhuma menção a agendamento
  - [ ] Vínculo: ao **criar** conta de responsável, o servidor chama `vincular_contatos_do_visitante` (D10) e o histórico aparece
  - [ ] Leitura sempre pela sessão do dono (policies da `0002`); nenhuma tela lê `anon_id`
  - [ ] Isolamento: o profissional A não vê contato do B; o responsável não vê contato de outro (teste)
- **Não fazer:** gráfico, exportação, filtro por período além dos dois números, identidade de quem clicou (D6).
- **Resultado:** _(a preencher)_

### T-043 — E2E do fluxo busca → perfil → contato no CI (DoD F4 item 5)
- **Estado:** ⬜ **semana de 07/10**, escrito em paralelo desde a T-040
- **Fase / Semana:** F4 / S7-S8 · **Capacidade:** **E5**, transversal **Testes** · **Nível:** 🟡 · **Dono:** vetria-qa
- **Depende de:** T-040, T-041 (T-042 para a parte do histórico)
- **Feito quando:**
  - [ ] Busca → cartão → perfil → **o HTML não contém o número** → toque → número aparece → a linha existe em `contatos` (conferida pelo cliente de serviço do **teste**)
  - [ ] 2º toque em 24 h não duplica; o limite devolve `muitas_tentativas`; conta `pending_validation` não tem botão nem perfil
  - [ ] `rpc/registrar_contato` com a chave anon é recusado; o profissional pedindo `anon_id` pelo PostgREST recebe `42501`
  - [ ] O profissional vê a contagem 1; o responsável logado vê o contato em "Seus contatos"; o anônimo que cria conta vê o contato vinculado
  - [ ] Verde no CI, com o número de testes executados (não pulados) escrito aqui
- **Resultado:** _(a preencher)_

### T-044 — O `vetria-e2e` não pode dormir: CI agendado a cada 3 dias
- **Estado:** ⬜ **semana de 30/09**, em paralelo (é do `vetria-qa`, 30 minutos)
- **Fase / Semana:** F4 / S6 · **Capacidade:** **E5**, transversal **Testes** (o DoD da F4 item 5 é "passando em CI", e o CI mora nesse projeto) · **Nível:** 🟡 — `ci.yml` · **Dono:** vetria-qa
- **Por quê:** **R-073.** Projeto grátis do Supabase pausa após 7 dias sem uso; o CI quebraria na primeira semana sem PR (feriado, doença, semana de decisão), e voltaria a ser o CI que ninguém confere
- **Feito quando:** [ ] `schedule` no `ci.yml` (ex.: a cada 3 dias) rodando a suíte ou um pedido leve ao `vetria-e2e` · [ ] uma execução agendada verde, com o link escrito aqui
- **Não fazer:** mexer no projeto de produção (a pergunta do plano de produção é do Elber, R-073).
- **Resultado:** _(a preencher)_

### T-045 — Fechar a F4: indexação no Google e `sitemap`, depois do portão
- **Estado:** ⬜ **S8 (14 a 20/10)**, **só com o portão fechado** e o DL da D12
- **Fase / Semana:** F4 / S8 · **Capacidade:** **E5** — o DoD F4 item 3 diz *"indexável pelo Google"* · **Nível:** 🟡 (uma constante + `app/sitemap.ts`) · **Dono:** vetria-backend
- **Depende de:** portão de abertura 6 de 6 (DL-063) e DL da D12
- **Feito quando:** [ ] `PAGINAS_PUBLICAS_INDEXAVEIS = true` num commit que cite o DL · [ ] `app/sitemap.ts` com os perfis `active` (lidos como anônimo) e `robots.ts` apontando para ele · [ ] `/buscar` continua `noindex` (`robotsDaBusca`) · [ ] conferido em produção (`curl` do HTML e do `sitemap.xml`), saída escrita aqui
- **Não fazer:** blog, SEO de conteúdo (fora do escopo).
- **Resultado:** _(a preencher)_

---

# ✅ FECHADA — F3 / S3 (aberta 09/09, fechada 20/09/2026)

**A S3 entregou, e desta vez entregou em produção:**

| Card | O que virou verdade em `eb6e2d6` |
|---|---|
| **T-007** | O onboarding do estabelecimento **persiste**. O item 1 do DoD passou a valer para as **duas** personas |
| **T-016** | O portão de status e o isolamento de role por prefixo existem no servidor. **R-001 e R-038 fecham** |
| **T-008** | O upload do documento, duas rotas novas (`/api/documentos/upload` e `/abrir`), e o bucket `documentos` **deixou de estar vazio** pela primeira vez desde 26/08 |
| fora de card | Os três funis de cadastro consertados (estado de confirmação + botão), o `/ajuda` do **DL-058**, o pré-voo do `ci.yml` (**R-053**) e a suíte de **15 para 40 testes** |

**O que a S3 NÃO entregou:** a **T-017** (🔴, presencial, não começou) e o **item 3 do DoD** —
`/admin/validacoes` continua sem uma linha escrita. Os dois já estavam previstos para a S4 no
`01-PLANO.md`; o que mudou é que agora a S4 é a última semana da fase.

---

## ✅ O DEFINITION OF DONE DA F3, ITEM POR ITEM, COM A PROVA DE CADA UM

> Regra da casa: **item sem prova é item não feito.** Prova é comando rodado, teste passando ou
> tela conferida. Abaixo, cada item com a medição que o sustenta — e o que falta, quando falta.

| # | Item do DoD (`01-PLANO.md` §F3) | A prova, e quem a fez | Veredito |
|:-:|---|---|:-:|
| **1** | Cadastro novo de vet → onboarding preenchido → sair e voltar → **os dados estão lá** | **vet:** prova manual da T-006, 31/08, conta real. **clinic:** prova do **Elber** em 20/09, conta de estabelecimento real — o `select` devolveu `whatsapp = 62992653278` da linha que a Action da T-007 gravou | ✅ **fechado, nas duas personas** |
| **2** | Esse veterinário vê "aguardando" e **não consegue** entrar no dashboard | **9 navegações em tela**, conta `vet` real em `pending_validation`, feitas pelo **Elber** em 20/09: `/app` → `/aguardando`; `/app/veterinario`, `/contatos`, `/plano` e `/agenda` **voltam**; `/perfil` e `/ajuda` **abrem**. Mais `tests/e2e/portao-status.spec.ts` verde no CI | ✅ **fechado e medido** |
| **3** | **Admin aprova → o veterinário entra no dashboard e recebe o email** | **PROVADO EM TELA em 23/09/2026 pelo Elber (T-024, `localhost` contra o Supabase de produção):** conta vet nova criada por `/cadastro/veterinario`, onboarding concluído (o servidor **recusou** concluir sem documento, SEC-088(a)), admin aprovou, faixa *"O email foi enviado"*, **email "Olá, Tiego Oliveira! Validamos seu cadastro" recebido**, a conta caiu no dashboard. Reprovação com motivo provada em duas contas (motivo na caixa âmbar do onboarding). `audit_logs` com 4 linhas `definir_status` e o uuid do admin em `actor_id` | ✅ **FECHADO e em produção** (`6a8d86a`, push de 23/09 · o verde do CI ainda não foi conferido por ninguém) |
| **4** | Um responsável logado que digite `/app/veterinario` é redirecionado | Na mesma passada de 20/09: a conta `vet` digitando `/app/estabelecimento` e `/admin` **foi devolvida ao painel dela**. É o mesmo mapa de prefixo do `middleware.ts`, exercitado em dois cruzamentos, mais o teste *"a conta vet nao entra no painel do estabelecimento nem no admin"* verde no CI | ✅ **FECHADO em 23/09/2026, ao pé da letra:** o Elber entrou com conta `tutor` em `localhost:3000`, digitou `/app/veterinario` e **foi devolvido** para `/app/responsavel/onboarding` (a conta ainda não concluiu o onboarding do responsável, então é o destino certo dela). Nada do painel vet apareceu |
| **5** | Teste E2E cobrindo 1 a 4 passando em CI | CI de 20/09: **40 testes, todos verdes** — a primeira execução completa da suíte na história do projeto. `portao-status.spec.ts` (10) e `onboarding-vet.spec.ts` (9) nasceram nesta semana | 🟡 **PARCIAL, e é o único item que não fechou:** cobre os itens 2 e 4. **Os itens 1 e 3 não têm E2E** (**R-033**: conta nova a cada rodada, sem lugar limpo para criá-la). Virou a **T-029**, data dura **06/10** (DL-062). Em 23/09 o `vetria-qa` escreveu `admin-validacoes.spec.ts` (19 testes de leitura, **sem rodar e sem commit**) |
| **6** | Relatório de segurança da fase **sem achado 🔴 aberto** | **Quatro** relatórios na fase: `SEC-2026-09-15-T007` (🔴 0 · 🟠 0 · 🟡 3), `SEC-2026-09-16-T016`, `SEC-2026-09-16-T008` (🔴 0 · 🟠 1 · 🟡 9) e `SEC-2026-09-21-T023` (🔴 0 · 🟠 0 · 🟡 5), **o primeiro em que um usuário lê a linha de outra pessoa**. **Zero 🔴 em todos** · **23/09:** `SEC-2026-09-23-T024` (🔴 0 · 🟠 2 · 🟡 4) e a avaliação de rate limit, captcha e 2FA (🔴 0 · 🟠 2 · 🟡 2). **Continua zero 🔴** | ✅ **fechado** · ⚠️ o 🟠 que sobra é a **SEC-081** (volume e limpeza do bucket), virou **T-020**, e tem trava escrita: **antes do primeiro profissional de fora** |

### ⛔ 23/09/2026 — A F3 ENCERRA COM 5 DE 6. Ela NÃO é uma fase concluída, e este quadro não vai chamá-la assim.

**Reconferido item por item pelo `vetria-maestro` em 23/09, no fechamento (DL-062):** 1 ✅ · 2 ✅ ·
**3 ✅** (fechou hoje, em produção) · **4 ✅** (fechou hoje, ao pé da letra) · **5 🟡** · 6 ✅.

**Por que 5 de 6 e não "6 de 6 com ressalva":** item parcial é item não feito. Contar metade como
inteiro é o **R-034**, que já custou duas auditorias a este projeto. **Por que a F4 começa assim
mesmo:** o que falta é rede de teste, não capacidade; nada da F4 depende do item 5 (no DL-059 era o
contrário: a busca dependia do item 3, e por isso a F3 não fechou em 20/09). **O que obriga:** o item
5 tem card (T-029), dono (`vetria-qa`), decisão com dono (o Elber, R-033) e data (06/10). A F3 vira
"concluída" no dia em que o CI rodar os itens 1 e 3 verdes, e **o `/roadmap` diz "5 de 6
comprovados"** até lá. **E a T-017, que o DL-059 mandou decidir se a F3 terminasse sem ela:** entrou na
T-027, com sessão presencial até 29/09 e prazo duro antes da S7.

_(O texto de 20/09, quando a F3 estava com 5 de 6 e o item que faltava era o 3, está no DL-059.)_

---

# ✅ FECHADA — F3 / S4 (aberta 21/09, fechada 23/09/2026) · a última semana da fase

**A S4 entregou, e em produção:** **T-023** (a fila real do admin), **T-024** (aprovar e reprovar com motivo, o email, a trilha; **fecha o item 3**), **T-025** (o caminho de volta ao onboarding) e **T-021** (doc). **T-022** decidida (DL-061) e implementada dentro da T-024. **T-026** fechada por medição. **Não entregou:** a T-017 (absorvida pela T-027) e o item 5 do DoD (T-029). A T-020 passou para a S5.

_(O texto abaixo é o da abertura, de 21/09, mantido como registro.)_

> **Semana aberta pelo `vetria-maestro` em 21/09.** **4 cards na fila** (a **T-021** já fechou;
> sobram três), mais quatro que correm
> por fora e não disputam ordem com ninguém. **O item 3 do DoD está no topo, e é o único motivo
> pelo qual esta semana existe.**
>
> **Ordem de execução, por dependência real:**
>
> | # | Card | O que destrava | Nível |
> |---|---|---|:---:|
> | 1 | **T-023** a fila real do admin | **sem ela nada do item 3 existe.** É a tela que lê `pending_validation` e abre o documento que a T-008 acabou de tornar possível | 🟡 |
> | 2 | **T-024** aprovar e reprovar com motivo, e o email | **fecha o item 3 do DoD da F3**, o único que falta. Leva junto o **R-051**, o motivo da reprova que hoje ninguém lê | 🟡 |
> | 3 | **T-025** o caminho de volta ao onboarding existe na interface | o **DL-046** promete por escrito que *"enquanto espera, ele edita"*, os dois portões deixam entrar, e **só chega lá quem digita a URL**. É um link, não é arquitetura | 🟡 |
> | ~~4~~ | ✅ **T-021** a varredura de órfãos para de chamar órfão de esperado | **FEITA em 21/09.** Era **doc**, e consertou **três** cópias da mesma promessa errada, não duas. O card está em ✅ CONCLUÍDAS | 🟢 |
>
> **Por que T-023 antes de T-024, e não um card só:** são leitura e escrita, e a escrita dispara
> email e escreve `audit_logs` em linha de gente real. **Task que cresce, para** (regra 4): um
> card único para "a validação inteira" é exatamente o card que se descobre no meio que era dois.
>
> ### Correm por fora da fila
>
> | Card | Por que não está na fila |
> |---|---|
> | **T-017** 🔴 | migration, presencial, **sem data pela quarta semana seguida**. Não bloqueia nenhum card desta fila; quem está bloqueado é ela, pela agenda. **AGENDE** |
> | **T-022** | é **decisão do Elber**, não implementação: a obrigatoriedade do documento vive na Server Action ou na fila do admin? |
> | **T-020** 🟠 | teto de volume e limpeza do bucket. **Não bloqueia esta semana; bloqueia abrir o onboarding para conta de fora** |
> | **T-026** | WhatsApp gravado antes do conserto do R-041. **Medir é 🟢 e é do Elber; corrigir é 🔴** |
>
> ### 📏 Três medições de 30 segundos que fecham item aberto, e as três são do Elber
>
> 1. **A passada com conta `tutor`:** logar como responsável e digitar `/app/veterinario`.
>    **Fecha o item 4 do DoD ao pé da letra.** Hoje ele está provado pelo mecanismo, não pela
>    frase.
> 2. **A varredura de órfãos** do item 3 da seção 🔒 da T-008, que o card manda rodar **ao
>    fechar a T-008** e que ninguém rodou. ✅ **A T-021 fechou em 21/09, então a trava caiu:
>    a consulta não classifica mais, e são duas** — a varredura e o complemento de uma linha
>    que lista objeto fora da convenção `<uuid>/`. **Zero linha nas duas fecha o assunto.**
> 3. **O `select` do WhatsApp sujo** (T-026), que diz se isso é dado de teste ou dado de gente.

### T-023 — `/admin/validacoes` lê a fila real e o detalhe abre o documento
- **Prova em tela (23/09/2026, Elber, conta admin, `localhost:3000` contra o Supabase de produção): ✅ PASSOU.**
  - **A fila veio cheia: 4 contas**, *"Página 1 de 1 · 4 contas na fila · horário de Brasília"*, e o cabeçalho diz *"4 contas esperando"*. Fila cheia é a única prova de que as quatro policies de leitura do admin estão de pé (ponto 8 do Resultado), e **estão**
  - **As 4 linhas:** Elder Lucas (vet, atualizado 31/08 15:45, **sem documento**) · Jhonas Brother (estabelecimento, 16/09 11:33, **sem documento**) · Elder no Teste Vetria (vet, 16/09 12:54, **sem documento**) · Larissa lima (vet, 20/09 21:14, **documento em 20/09 21:13**). Ordem por quem espera há mais tempo, como o card pede
  - **O detalhe da Larissa abriu completo:** documento com data de envio, tamanho (15 KB) e SHA256 (`a62c1f98…669c08c`); cadastro profissional com especialidades, formas de atendimento, bairro e bio; e o bloco *"Identificação e contato"* rotulado *"Dado privado. Visível para admin e master (matriz §5)"*
  - **O botão *"Abrir documento em uma aba nova"* mostrou o contador (55 s) e o documento ABRIU**, confirmado pelo Elber
  - **O que a prova mostrou além do que ela media:** 3 de 4 contas estão na fila sem documento, todas anteriores à T-008. É a **SEC-088 / T-022 em dado real**, e o badge âmbar do ponto 5 funciona como prometido. O cadastro do Elder Lucas é incoerente (CRMV de uma UF, número com a sigla de outra, cidade de um estado com UF de outro) e virou o **R-059**
  - ⏭️ **Falta só o push** para esta task sair de 🟡. Ele vai junto com o da T-025, depois da prova dela
- **Estado:** ✅ **CONCLUÍDA. Em produção desde `22fbefd` (23/09).** _(anterior:)_ 🟡 **commitada em 21/09 (`4a355b0`), auditada e APROVADA, prova em tela ✅ em 23/09, aguardando push.** `npm run build` e `npm run lint` verdes. A auditoria do `vetria-seguranca` saiu em `docs/relatorios/SEC-2026-09-21-T023-fila-de-validacao.md`: **APROVADO para merge, 🔴 0 · 🟠 0 · 🟡 5**, com a frase *"dá para colocar gente real nesta tela hoje"*. ⚠️ **NÃO EMPURRADA para a `origin/main` de propósito:** push na `main` dispara deploy em produção, e falta o gesto que fecha esta task, que é do Elber e não é código: **abrir `/admin/validacoes` com conta admin e ver a fila cheia.** Ponto 8 do Resultado: fila vazia e policy revogada produzem a mesma tela
- **Fase / Semana:** F3 / S4
- **Capacidade:** **E3** — *"`/admin/validacoes` lista fila real, abre o documento"* (`00-ESCOPO.md` §2)
- **Nível:** 🟡 — páginas de admin, leitura de dado de terceiro, mais de 3 arquivos
- **Agente dono:** vetria-backend (a leitura) + vetria-ui (a tela) · **auditoria obrigatória:** vetria-seguranca
- **Depende de:** **T-008 ✅** (é ela que põe documento no bucket e escreve `documento_path`) · **T-007 ✅** e **T-016 ✅**, que são quem produz `pending_validation` de verdade
- **Por quê:** o item 3 do DoD da F3 não tem uma linha escrita, e ele é metade do `00-ESCOPO.md` §1: *"um profissional consegue se cadastrar, preencher o perfil, **ser validado por um admin** e aparecer na busca"*. Hoje a tela é casca e a fila existe só no banco.
- **Feito quando:**
  - [x] `/admin/validacoes` lista **`status = 'pending_validation'`**, das duas personas, com o filtro **no servidor** e paginação. Estado vazio honesto, **sem dado fake**
  - [x] O detalhe mostra o que o admin precisa para decidir: os campos públicos de `vet_profiles`/`clinic_profiles` **e** os privados de `perfil_privado` (CRMV, CNPJ, razão social, responsável técnico) que a matriz §5 dá a admin e master
  - [x] **Abrir o documento passa por `/api/documentos/abrir`**, que já existe, já grava `audit_logs` antes de devolver a URL e já assina por **60 segundos**. **Não escrever uma segunda rota de leitura.** Não usar `next/image` em nada vindo de usuário (R-004)
  - [x] **"Sem documento" é estado de primeira classe na lista:** a SEC-088 provou que dá para concluir sem enviar, e enquanto a T-022 não for decidida a fila recebe esses cadastros
  - [x] **Leva o R-054 junto, e são 3 linhas:** `/admin/usuarios` passa a exigir `admin_level === 'master'` **no servidor** (`redirect("/app")`), e o `else` da renderização some por ter ficado inalcançável. A matriz §2 diz ❌ para admin comum, e **esta é a semana que cria a persona "admin comum"**
  - [x] Nada de `service_role` na página. A leitura é do admin, sob RLS, pelas policies que a `0002` já escreveu
- **Não fazer:** não escrever aprovação nem reprovação aqui (é a T-024). Não tocar em `/api/admin/set-access`. Não construir moderação nem conteúdo. Não escrever migration.
- **Resultado (21/09/2026, `vetria-backend`): a fila existe, lê o banco e abre o documento. 8 arquivos.** _(o texto abaixo foi escrito antes do commit e dizia "nada commitado"; os 8 arquivos entraram em `4a355b0`, junto com o relatório da auditoria. **Não empurrado para a `origin/main`:** ver o Estado acima.)_
  - **4 novos:** `lib/auth/admin.ts` (o guard `requireAdmin` / `requireMaster`), `app/admin/validacoes/fila.ts` (toda a leitura), `app/admin/validacoes/[conta]/page.tsx` (o detalhe) e `app/admin/validacoes/BotaoDocumento.tsx` (cliente). **4 tocados:** `app/admin/validacoes/page.tsx` (era casca), `app/admin/usuarios/page.tsx` (**R-054**), `app/admin/layout.tsx` e `app/admin/page.tsx` (o item "Usuários" some do menu e do dashboard de quem não é master).
  - **1. A tela deixou de mentir.** `/admin/validacoes` renderizava um `AdminEmptyScreen` fixo dizendo *"Nenhuma validação pendente"* com um `TODO` no lugar da consulta — e há gente esperando no banco desde as provas de 20/09. Agora lista `status = 'pending_validation'` **e** `role in ('vet','clinic')`, as duas cláusulas no Postgres, ordenada por quem espera há mais tempo, 20 por página, com `?pagina=N` e teto contra `?pagina=999999999`.
  - **2. Zero `service_role`, zero SQL.** A leitura sai da sessão do admin, sob RLS, pelas quatro policies que a `0002` já tinha escrito (`profiles_select_admin`, `vet_profiles_select_admin`, `clinic_profiles_select_admin`, `perfil_privado_select_admin`). **Nenhuma policy faltou**, e por isso nenhum card 🔴 nasceu aqui. O `role in (…)` é redundante para admin comum (a policy já o impõe) e **obrigatório para o master**, que lê a base inteira por `profiles_select_all_master`: sem ele, a fila do master seria outra fila.
  - **3. O dado privado aparece uma conta por vez, e só no detalhe.** CNPJ, razão social, responsável técnico, WhatsApp e telefone (matriz §5) estão em `/admin/validacoes/<uuid>`, nunca na lista: vinte linhas de HTML com telefone é superfície que ninguém pediu. **WhatsApp é texto, nunca link `wa.me`** (DL-047). **Nada disso vai para log** — o tipo do registrador de erro recusa `details`, clonado da SEC-056 — **nem para URL**: a rota carrega um uuid. `documento_path` não chega ao navegador.
  - **4. O documento abre pela rota que já existia.** `BotaoDocumento` faz um POST em `/api/documentos/abrir` com `{ dono }` e mais nada; a rota é quem lê o caminho da tabela, grava `audit_logs` **antes** e assina por 60 s. **Nenhuma rota nova de leitura foi escrita.** O link aparece na tela com a contagem regressiva visível e some quando expira, em vez de `window.open` depois do `await`, que o navegador bloqueia. Nada de `next/image`, `<img>` ou `<iframe>` em arquivo de usuário (R-004).
  - **5. "Sem documento" é badge âmbar na lista e bloco explícito no detalhe** (SEC-088). Enquanto a **T-022** não for decidida, a fila recebe esses cadastros e a tela os mostra como são.
  - **6. R-054 fechado no servidor.** `/admin/usuarios` passou a exigir `admin_level = 'master'` (`requireMaster()` → `redirect("/app")`), e o `else` da renderização saiu por ter ficado inalcançável. O que separava admin de master ali era um `? :` de renderização, e agora é uma decisão antes do primeiro byte de HTML. De quebra, o item "Usuários" sumiu do menu e do dashboard de quem não é master — **essas duas linhas passaram do que o card pediu e são separáveis**, se o `vetria-maestro` preferir.
  - **7. ⚠️ O que a T-024 herda pronto:** o guard, a leitura do cadastro inteiro (`carregarCadastro`), a rota de detalhe onde os botões cabem e a garantia de que admin e master enxergam a mesma fila. **O que ela ainda constrói:** a Server Action chamando `admin_definir_status` (não foi tocada aqui), o motivo obrigatório na reprova, os dois emails, e a outra metade do **R-051** (o `status_motivo` exibido no onboarding das duas personas).
  - **8. ⚠️ O ponto cego, e ele é honesto:** fila vazia e policy revogada produzem **a mesma tela**, porque RLS não devolve erro, devolve zero linha. Enquanto houver conta em `pending_validation` no banco, a tela cheia é a prova de que as policies estão lá.

### T-024 — Aprovar e reprovar com motivo, o email, e a trilha em `audit_logs`
- **Estado:** ✅ **CONCLUÍDA. Em produção desde `6a8d86a` (push de 23/09; o verde do CI falta conferir).** Provada em tela em 23/09/2026 pelo Elber. Aprovar (2 contas, uma delas conta nova ponta a ponta), reprovar com motivo (2 contas), 404 do detalhe depois da decisão, recusa sem documento, email de aprovação **recebido** pelo Resend, trilha em `audit_logs`. Auditoria: `docs/relatorios/SEC-2026-09-23-T024-aprovar-e-reprovar.md`, APROVADO, 🔴 0 · 🟠 2 · 🟡 4, com SEC-097(a), SEC-100, SEC-098 (comentário) e SEC-101 (frase) aplicados no mesmo diff. Os 🟠 restantes vão para a **T-027** (migration, trava: antes do primeiro admin comum). _(Estado anterior:)_ 🟡 **escrita em 23/09/2026, na árvore de trabalho, PARADA NO DIFF.** `npm run build` (`EXIT=0`) e `npm run lint` (`EXIT=0`) verdes. Nenhum `git add`, nenhum commit, nada empurrado. Falta: (1) a **auditoria do `vetria-seguranca`** (obrigatória no card), (2) a aprovação do diff pelo Elber, (3) a **`RESEND_API_KEY`** no `.env.local` e na Vercel (🔴 `.env`, gesto do Elber; sem ela a decisão funciona e o email sai como "desligado"), (4) a prova em tela, que é o item 3 do DoD
- **Fase / Semana:** F3 / S4
- **Capacidade:** **E3** — *"aprovar ou reprovar. Aprovar muda o status pra `active` e dispara email"*
- **Nível:** 🟡 — escreve `profiles.status` de terceiro e dispara email. ⚠️ **Vira 🔴 se pedir migration ou policy nova.** A RPC `admin_definir_status` já existe (`0002:697-712`) e é por ela que a escrita passa. **Se alguém propuser escrever `profiles.status` direto da aplicação, para:** `status` nunca é escrito fora da RPC, e nunca pelo próprio usuário
- **Agente dono:** vetria-backend · **auditoria obrigatória:** vetria-seguranca
- **Depende de:** **T-023** — não se aprova o que não se lê
- **Por quê:** **é o item 3 do DoD da F3, e é o único que falta.** Sem ele o profissional entra na fila e nunca sai: a T-016 fechou as portas do painel para `pending_validation` e **não existe nada no produto que mova alguém para `active`**
- **Feito quando:**
  - [x] Aprovar → `status = 'active'` **pela RPC `admin_definir_status`**, nunca por `update` direto · Reprovar → `incomplete` + `status_motivo` preenchido, que é o contrato que a `0002:702-712` já escreveu
  - [x] **Motivo obrigatório na reprova.** Reprova sem motivo é o laço mudo do **R-051** _(na aplicação; no banco a RPC ainda aceita motivo nulo, ver Resultado, Descobri 1)_
  - [x] **O R-051 fecha aqui, e esta é a outra metade dele:** o `page.tsx` do onboarding das **duas** personas passa a ler `status_motivo` e a **exibi-lo** quando `status = 'incomplete'` e o motivo não for nulo. É leitura da própria linha, **sem migration e sem policy**. Hoje o reprovado recebe formulário em modo "novo", reenvia o mesmo dado, e a fila recicla
  - [x] **Email de aprovação e email de reprova com o motivo.** Os 3 emails do app estão versionados e **desligados esperando a F3**; saem de `contato@vetriabrasil.com.br` pelo Resend, que já está verificado _(código pronto; acende quando a `RESEND_API_KEY` existir no ambiente)_
  - [x] **`audit_logs` registra toda ação de admin**, com `actor_id` preenchido. ⚠️ `authenticated` **não tem INSERT em `audit_logs`** (`0002` §11b): a trilha sai por `service_role`, com `actor_id` **explícito**, como a rota `/api/documentos/abrir` já faz _(corrigido na leitura do código: a RPC é SECURITY DEFINER e já grava a trilha na mesma transação, com `actor_id = auth.uid()` do admin. Nada duplicado, ver Resultado)_
  - [x] **(23/09, Elber: ver a linha 3 da tabela do DoD)** **Prova em tela, e ela é o item 3 do DoD:** aprovar a conta `vet` de teste que está em `pending_validation` desde 31/08 → ela **entra no dashboard** → **o email chega**. Registrada aqui, com o que aconteceu
  - [ ] **→ T-029.** E2E do caminho, na medida em que o **R-033** permitir. Se não permitir, o teste fica **escrito e pulando com o motivo escrito** — nunca verde à toa
- **Não fazer:** não escrever `status` fora da RPC. Não mandar email para endereço de gente que não é conta de teste. Não construir suspensão em massa. Não encostar no enum de `role` (DL-043).
- **Resultado:**

## HANDOFF — vetria-backend — T-024 — 23/09/2026

**Fiz** (DL-061 inteiro, mais o card; zero migration, zero policy, zero `.env`):
- **Matriz primeiro.** `docs/06-PERMISSOES.md:173` ganhou a subseção de §5 do DL-061: o detalhe `/admin/validacoes/<uuid>` só abre conta em `pending_validation`, para admin **e** master, e aprovar/reprovar só aceita conta na fila.
- **SEC-092 (a) no código.** `app/admin/validacoes/fila.ts:388`: `carregarCadastro` ganhou `.eq("status", "pending_validation")` **dentro do select**. Conta ativa, reprovada ou suspensa nem chega ao processo, e `lerPrivado` nem roda: vira `notFound()`. O aviso antigo "esta conta não está mais na fila" saiu do detalhe por ter ficado inalcançável.
- **Aprovar e reprovar.** 3 arquivos novos em `app/admin/validacoes/[conta]/`: `actions.ts` (Server Action `decidirValidacao`), `DecisaoForm.tsx` (cliente) e `decisao.ts` (tipo e limites compartilhados). A Action faz, nesta ordem: `requireAdmin()` (`actions.ts:83`) → valida entrada (uuid, decisão de lista fechada, motivo de 10 a 1000 caracteres na reprova) → relê a conta **com a sessão do admin, sob RLS** e exige `pending_validation` (`:151`) → chama `admin_definir_status` **com a sessão do admin** (`:158`) → relê o status e só segue se bater (DL-011) → email → `redirect` para a fila com `?decisao=` e `?email=`, dois valores de lista fechada, sem nome, email nem motivo na URL (`:220`). Nenhum `redirect` dentro de `try/catch` (DL-016). **`profiles.status` não é escrito por nenhuma linha da aplicação.** Aprovar pede um segundo clique ("Confirmar aprovação"); reprovar fica desabilitado até o motivo ter 10 caracteres, e o servidor confere de novo. Todos os botões novos têm `cursor-pointer` (DL-040).
- **O detalhe** (`[conta]/page.tsx:177`) ganhou a seção "Decisão". Se a conta já foi devolvida antes, um aviso âmbar mostra o motivo anterior (`:93`), porque a RPC de conclusão não limpa `status_motivo`.
- **A fila** (`app/admin/validacoes/page.tsx:58`) mostra o resultado: verde quando o email saiu, âmbar quando não saiu, dizendo por quê e mandando avisar por outro canal. `AdminEmptyScreen` ganhou o prop opcional `aviso`, porque aprovar a última conta esvazia a fila e o aviso sumiria justo ali.
- **Os emails.** `lib/email/validacao.ts` (novo, `server-only`): aprovado e reprovado com o motivo, portados dos templates 05 e 06, remetente `Vetria <contato@vetriabrasil.com.br>`, `reply_to` igual, HTML e texto puro. Envio por `fetch` na API HTTP do Resend, **sem SDK** (a única dependência nova autorizada pelo DL-061 é `server-only`). Nome e motivo entram **escapados**. Destinatário: o email de login em `auth.users`, lido por `service_role` (`getUserById`), que é o único uso de `service_role` da task. **A função nunca lança**: devolve `enviado`, `falhou` ou `desligado` (sem `RESEND_API_KEY`), com tempo limite de 8 s, e o log leva o uuid da conta e o código do erro, **nunca o endereço**. Falha de email não desfaz a decisão, que já está gravada quando o envio começa.
- **Copy dos emails corrigida em relação aos templates:** o 05 dizia *"tutores podem encontrar você na busca"*, e a busca é F4. Virou *"o painel completo já está liberado"* + *"quando a busca da Vetria abrir ao público, é por ela que os responsáveis vão encontrar o seu perfil"*. "tutores/clínicas" viraram "responsáveis/estabelecimentos". Os `.html` de `email-templates/` não foram tocados.
- **Trilha.** A RPC já grava `audit_logs` na mesma transação (`0002:714-722`): `actor_id = auth.uid()` (o admin, porque a chamada vai com a sessão dele), `acao = 'definir_status'`, `alvo_id`, `detalhe = {de, para, motivo}`, `created_at`. **Não dupliquei.** O card mandava gravar por `service_role` com `actor_id` explícito; isso contaria a mesma ação duas vezes.
- **T-022 / SEC-088 (a).** `app/app/veterinario/onboarding/actions.ts:332` e `app/app/estabelecimento/onboarding/actions.ts:382`: na conclusão (`status = 'incomplete'`), antes da RPC, a Action lê `perfil_privado.documento_enviado_em` e recusa com *"Seus dados foram salvos, mas o cadastro só segue para validação com o documento do CRMV. Envie o documento no passo 4 e conclua de novo."* (estabelecimento: *"...com o documento enviado..."*). Quem já está na fila e volta para corrigir continua salvando.
- **R-051, a outra metade.** As duas `onboarding/page.tsx` leem `status_motivo` no mesmo `select` de `profiles` e passam `motivoReprova` só quando `status = 'incomplete'`. Os dois formulários mostram uma caixa âmbar no topo, em todos os passos: *"A equipe Vetria devolveu seu cadastro para ajuste."* + o motivo (texto, nunca HTML) + *"Corrija o que foi apontado e conclua de novo: o cadastro volta para a fila de validação."* O comentário dos formulários que dizia *"a Action não recusa por falta de documento"* foi corrigido.
- **R-058 / SEC-089 (a).** `npm i server-only` e `import "server-only"` em `lib/supabase/admin.ts`. Build verde prova que nenhum Client Component o importa.

**Não fiz:**
- **O E2E do caminho.** A suíte roda contra o Supabase de produção e o CI só tem conta `vet`; um teste que aprova ou reprova mudaria o status de conta real a cada rodada e derrubaria os testes do portão, que dependem da conta de teste em `pending_validation`. Precisa de conta admin de teste e de conta descartável por rodada (**R-033**). Fica para o `vetria-qa`, escrito e pulando com esse motivo.
- **A prova em tela.** É do Elber, e o roteiro está abaixo.
- **Fechar a regra de origem no banco.** Ver Descobri 1: pede migration, é 🔴.

**Estado agora:** o produto passa a ter o gesto que faltava: admin aprova e a conta sai de `pending_validation` para `active` e entra no painel; admin reprova com motivo e a conta volta ao onboarding **vendo o motivo**. Conta nova não entra mais na fila sem documento. As 3 contas antigas sem documento continuam na fila com o badge âmbar, e o detalhe avisa, perto do botão de aprovar, que elas não enviaram documento. **Os emails estão escritos e desligados até a `RESEND_API_KEY` existir**; sem ela, a tela diz ao admin que o email não saiu.

**Descobri:**
1. ⚠️ **`admin_definir_status` não confere o status de origem nem exige motivo.** A conferência de `pending_validation` e o motivo obrigatório vivem na Server Action. Um admin comum que chame a RPC direto pelo PostgREST, com o próprio token, consegue aprovar conta `incomplete` que nunca passou pela fila e reprovar sem motivo. Não é escalada (admin tem autoridade para aprovar, e fica tudo em `audit_logs` com o nome dele), mas é a regra do DL-061 e do R-051 escrita só na aplicação. Consequência menor do mesmo buraco: dois admins decidindo a mesma conta no mesmo segundo geram duas linhas de trilha e dois emails. **Fechar isso é migration** (a RPC passar a exigir `status_antigo = 'pending_validation'` para `active`/`incomplete` e motivo não nulo para `incomplete`): **é 🔴 e pede card próprio e sessão presencial.** Não fiz.
2. ⚠️ **A `RESEND_API_KEY` não existe.** O `.env.local` tem só as três variáveis do Supabase. O Resend hoje é apenas o SMTP do Supabase Auth: o app nunca mandou email por código. A chave precisa ser criada no painel do Resend (permissão de envio, domínio `vetriabrasil.com.br`) e posta no `.env.local` e nas variáveis da Vercel (Production). É 🔴 `.env`, do Elber.
3. O destinatário certo é o email de **login** (`auth.users`), não `perfil_privado.email_contato`, que não tem campo em tela e está vazio. Ler `auth.users` só dá com `service_role`: é o único uso dele na task.
4. O template 05 prometia busca que não existe. Corrigido no código, e os `.html` ficam como referência visual.

**Bloqueios:** auditoria do `vetria-seguranca` (obrigatória, e o Descobri 1 é o ponto para ele olhar primeiro) · aprovação do diff · `RESEND_API_KEY` (só para o email; a decisão funciona sem ela).

**Próximo passo óbvio:** o `vetria-seguranca` audita o diff. Depois, o Elber põe a chave do Resend no `.env.local` e faz a prova abaixo. ⚠️ **Não aprove a conta do `E2E_VET_EMAIL`**: os testes do portão pulam quando ela sai de `pending_validation`.

**Roteiro da prova em tela (item 3 do DoD):**
1. `.env.local` com `RESEND_API_KEY`, `npm run dev`. Use contas de teste cuja caixa de entrada você abre.
2. Conta admin → `/admin/validacoes` → a fila mostra as contas esperando.
3. **Aprovar:** abrir uma conta `vet` de teste → seção "Decisão" → "Aprovar esta conta" → "Confirmar aprovação". Volta para a fila com a faixa verde *"Conta aprovada. Ela já entra no painel completo. O email foi enviado."*, e a conta sumiu da lista.
4. Colar de novo a URL `/admin/validacoes/<uuid>` daquela conta → **404** (SEC-092).
5. Em janela anônima, entrar com a conta aprovada → `/app` leva ao **dashboard** `/app/veterinario`, não a `/aguardando`.
6. Na caixa de entrada: *"Seu cadastro foi aprovado na Vetria"*, de `contato@vetriabrasil.com.br`.
7. **Reprovar:** outra conta de teste → o botão "Reprovar com este motivo" fica apagado até 10 caracteres → escrever o motivo → reprovar → faixa *"Cadastro devolvido com o motivo..."*. Entrar com essa conta → cai no **onboarding**, com a caixa âmbar mostrando o motivo. Email *"Seu cadastro na Vetria precisa de um ajuste"*, com o motivo dentro.
8. **A trilha**, no SQL Editor: `select actor_id, acao, alvo_id, detalhe, created_at from audit_logs where acao = 'definir_status' order by created_at desc limit 5;` → duas linhas, `actor_id` = seu uuid de admin, `detalhe` com `de`/`para` e o motivo na reprova.
9. **Sem a chave (opcional, prova que falha de email não desfaz a decisão):** tirar a `RESEND_API_KEY`, decidir uma conta → a faixa fica âmbar dizendo que o email NÃO foi enviado, e a conta foi decidida do mesmo jeito.
10. **T-022 (se houver conta `incomplete` de teste sem documento, R-033):** no passo 4 do onboarding, tirar o `disabled` do botão pelo DevTools e clicar → a mensagem *"Seus dados foram salvos, mas o cadastro só segue para validação..."*, e a conta continua fora da fila.

**Auditoria (23/09/2026, `vetria-seguranca`):** relatório em `docs/relatorios/SEC-2026-09-23-T024-aprovar-e-reprovar.md`, **APROVADO para commit, 🔴 0 · 🟠 2 · 🟡 4**. Quatro correções aplicadas no mesmo diff, e build e lint continuam verdes (`EXIT=0` nos dois):
- **SEC-097 (a):** em `app/api/documentos/abrir/route.ts`, quando quem pede não é o dono (admin abrindo documento de terceiro), a rota lê o `profiles` do alvo sob RLS com `.eq("status","pending_validation").in("role",["vet","clinic"])`, a mesma cláusula de `carregarCadastro`, e responde **404** se a consulta não devolver linha. Isso acontece **antes** da trilha e da assinatura da URL. Quando o dono abre o próprio documento, nada muda.
- **SEC-100:** `getUserById` em `[conta]/actions.ts` corre com teto de tempo (`Promise.race`, o mesmo `TEMPO_LIMITE_MS` de 8 s do Resend, agora exportado por `lib/email/validacao.ts`). Se estourar, o email fica como `"falhou"`.
- **SEC-098:** o comentário dos dois formulários de onboarding agora diz a verdade: a Action recusa concluir sem documento, a RPC `concluir_onboarding_profissional()` ainda não. Isso fecha na **T-027** (migration, 🔴).
- **SEC-101:** no `DecisaoForm`, perto do campo de motivo: *"Não cole no motivo o conteúdo do documento, CPF, CNPJ nem dado de outra pessoa. Diga o que corrigir, sem repetir o dado."*

**Docs que atualizei:** `docs/06-PERMISSOES.md` (§5, DL-061) · este card.
**Commits:** nenhum. Task 🟡, parada no diff. Com as correções da auditoria, `app/api/documentos/abrir/route.ts` entrou na lista de modificados. 4 arquivos novos (`app/admin/validacoes/[conta]/actions.ts`, `DecisaoForm.tsx`, `decisao.ts`, `lib/email/validacao.ts`) e 14 modificados (`app/admin/AdminEmptyScreen.tsx`, `app/admin/validacoes/fila.ts`, `app/admin/validacoes/page.tsx`, `app/admin/validacoes/[conta]/page.tsx`, as duas `onboarding/actions.ts`, as duas `onboarding/page.tsx`, os dois formulários de onboarding, `lib/supabase/admin.ts`, `package.json`, `package-lock.json`, `docs/06-PERMISSOES.md`), mais este card.

### T-025 — O caminho de volta ao onboarding existe na interface
- **Estado:** ✅ **CONCLUÍDA. Em produção desde `22fbefd` (23/09).** Commitada em 23/09/2026 (`46cd9e6`), aprovada pelo Elber (*"decida por mim"*, depois da prova em tela das duas personas), aguardando push junto com a T-023.** _(texto de 21/09, antes da aprovação:)_ escrita em 21/09, na árvore de trabalho, aguardando aprovação do diff pelo Elber. `npm run build` e `npm run lint` **verdes** (build `EXIT=0`, eslint sem uma linha de saída). 4 arquivos de código mais este card, nenhum `git add`, nada empurrado para a `origin`. A task é 🟡 pelo semáforo do `CLAUDE.md` (mexe em `components/` e passa de 3 arquivos), então ela **para no diff**
- **Fase / Semana:** F3 / S4
- **Capacidade:** **E2** — *"o que o vet/estabelecimento digita no onboarding persiste e reaparece"*. Reaparecer só para quem sabe a URL não é reaparecer
- **Nível:** 🟡 — são as duas `aguardando/page.tsx` e provavelmente os dois `perfil`; passa de 3 arquivos
- **Agente dono:** vetria-ui
- **Depende de:** **T-016 ✅** (é ela que decide quem alcança `/onboarding`, e ela **deixa entrar**: a constante `ONBOARDING` e o teste *"/onboarding continua alcancavel para quem espera validacao"* provam isso)
- **Por quê:** **medido no código em 20/09: não existe um único `href` para `/onboarding` em `app/` nem em `components/`.** O **DL-046** promete por escrito que *"enquanto espera, ele edita"*, os dois portões deixam passar, o formulário abre preenchido com o dado do banco desde a T-006/T-007 — **e o único jeito de chegar lá é digitar a URL na barra de endereço.** A capacidade existe e o produto não a oferece
- **Feito quando:**
  - [x] `/aguardando`, nas duas personas, tem um caminho visível para rever e corrigir o cadastro
  - [x] O texto diz a verdade sobre o que acontece ao salvar de novo. ⚠️ **Não prometa o que não foi decidido:** mexer em `crmv`, `crmv_uf` ou `nome_exibicao` dispara o trigger de revalidação (`0002:379-386`) e devolve o profissional para a fila. **Isso ainda não está decidido nem escrito** — é a T-019, F6/S11 — então a tela **não promete** que editar é grátis
  - [x] **Sem travessão** no texto visível (DL-038). Sem dado fake. Estado vazio honesto
  - [x] O link **não aparece** para quem a matriz §4 não deixa entrar: `suspended` vai para `/bloqueado` e fica lá, que é o que impede laço de redirect
- **Não fazer:** **não construir o editor de perfil** — é a **T-019**, cortada para a F6/S11 por decisão do Elber em 16/09 (DL-056), e ressuscitá-la por inércia é exatamente o que o corte existe para impedir. Não mexer em `lib/auth/status.ts`: o portão já deixa passar; o que falta é o link.
- **Prova em tela (23/09/2026, Elber, `localhost:3000`): ✅ PASSOU NAS DUAS PERSONAS.**
  - **Veterinário (conta Larissa lima):** `/app/veterinario/aguardando` mostra o cartão *"Rever e corrigir o cadastro"*, a caixa âmbar *"Antes de salvar de novo:"* encostada nele e o cartão novo *"Ver a prévia do seu perfil público"*. O clique abriu o onboarding **no passo 1, preenchido com o dado do banco** (nome, `GO-0155`/AC, as 4 especialidades com Clínica geral como principal, "1 a 3 anos"), com o painel lateral *"Seu cadastro está em validação."*
  - **Estabelecimento (conta Jhonas Brother):** o mesmo trio de cartões, com o aviso citando **CNPJ, razão social e nome fantasia**. O clique abriu o onboarding preenchido (nome fantasia, razão social, CNPJ `52276855000143`, responsável técnico), com *"O cadastro está em validação."*
  - Nada foi salvo nas duas passadas
- **Resultado (21/09/2026, `vetria-ui`): o link existe, e o aviso que ele exige existe com ele. 4 arquivos, nenhum commit.**
  - **Tocados (zero arquivos novos):** `components/app/cascas.tsx` (o `AguardandoCasca` passou a receber `rever`, e o cartão de ação virou função `AcaoDeEspera` para os dois links serem o mesmo cartão), `app/app/veterinario/(painel)/aguardando/page.tsx`, `app/app/estabelecimento/(painel)/aguardando/page.tsx` e `tests/e2e/portao-status.spec.ts` (um teste novo). **`lib/auth/status.ts` não foi tocado**, nenhuma migration, nenhuma Server Action, nenhum editor de perfil (T-019 continua cortada).
  - **1. A medição do card se confirmou antes de qualquer linha:** `grep -rn "onboarding" app/ components/` devolve 50 ocorrências, e `href=` para `/onboarding` **zero**. A capacidade estava inteira (portão, guard da página, formulário pré-preenchido) e a única porta era a barra de endereço.
  - **2. O caminho agora é um cartão clicável nas duas personas**, dentro do bloco *"Enquanto isso, você pode"* que já existia: **"Rever e corrigir o cadastro"**, com ícone `FilePen`, apontando para `/app/veterinario/onboarding` e `/app/estabelecimento/onboarding`. A descrição diz o que o formulário faz de verdade, inclusive a parte que morde: *"As alterações só são gravadas quando você chega ao fim e salva"* (o `VetOnboardingForm` salva no passo 4, não a cada passo).
  - **3. ⚠️ O item delicado, e a frase exata que foi para a tela.** Caixa âmbar (`bg-warning-soft`, `TriangleAlert`) **encostada no link**, não no fim da tela, começando por **"Antes de salvar de novo:"**. Veterinário: *"a validação passa a conferir a versão mais nova do cadastro. Mexer no CRMV, na UF do CRMV, no nome de exibição ou no documento enviado altera justamente o dado que está sendo conferido, então a conferência pode recomeçar, e a gente ainda não garante que a sua posição na fila se mantém. Depois de aprovado, mudar esses campos devolve o perfil para revisão, e ele sai da busca até a nova conferência."* Estabelecimento: idêntica, com **CNPJ, razão social e nome fantasia** no lugar dos campos do vet, e *"a posição do estabelecimento na fila"*. **Nada ali promete que editar é grátis** e **nada ali promete que a posição na fila se mantém**: as duas coisas são exatamente o que a T-019 vai decidir.
  - **4. Por que a frase é essa e não outra, lido no trigger antes de escrever** (`0002_nucleo.sql:388-436`): `revalidar_ao_mudar_dado_sensivel()` é `after update` em `vet_profiles`, `clinic_profiles` **e `perfil_privado`** (SEC-023, o documento entra na lista, por isso ele está na frase), e o `update` dele é `where id = new.id and status = 'active'`. **Quem já está em `pending_validation` não muda de status ao salvar de novo**, então dizer "você volta para a fila" seria falso. O que é verdade e ficou escrito: o dado conferido muda, a conferência pode recomeçar, a posição não é garantida, e **depois de aprovado** mudar esses campos derruba o perfil da busca até a nova conferência.
  - **5. A posição na fila não é promessa vazia de cautela.** `app/admin/validacoes/fila.ts:209` ordena por `updated_at` ascendente, e o comentário da própria T-023 já dizia que *"uma edição posterior do cadastro move este carimbo também"*. Hoje as duas Actions de onboarding **só leem** `profiles` (os três `.from("profiles")` são `select`), então `profiles.updated_at` não se move e a posição na prática se mantém. **Isso é acidente de implementação, não contrato**, e é por isso que a tela não o promete.
  - **6. A condição do link espelha a lista, não copia:** `const podeRever = (ONBOARDING as readonly string[]).includes(status)`, com `ONBOARDING` **importado de `lib/auth/status.ts`**, a mesma constante que o `middleware.ts` aplica. `requirePainel` já devolvia `status`; nenhuma consulta nova ao banco. Hoje a comparação é verdadeira para todo mundo que chega em `/aguardando` (`SO_ESPERANDO` só deixa entrar `pending_validation`), e escrever o link direto estaria certo **por coincidência de duas listas que ninguém prometeu manter iguais**. `suspended` não alcança esta tela: vai para `/bloqueado` e fica lá. O `aviso` viaja **dentro do mesmo objeto `rever`**, então é impossível mostrar o texto sem o link ou o link sem o texto.
  - **7. Teste novo, e ele mede o gesto certo:** *"de /aguardando da para CLICAR no caminho de volta ao cadastro"* em `tests/e2e/portao-status.spec.ts`. O teste que já existia (*"/onboarding continua alcancavel"*) **navega**, e ficava verde justamente enquanto não havia `href` nenhum; este **clica**. Ele pula com motivo escrito se a conta de teste sair de `pending_validation`, como todos os vizinhos.
  - **8b. ⚠️ CORRIGIDO em 23/09, e o item 8 abaixo estava errado:** a copy *"Ver a prévia do seu perfil público · Mostra como o responsável vai ver você na busca… o que vale hoje é o que você mandou no cadastro"* **também mentia.** `VetProfileForm` e `ClinicProfileForm` **não leem o banco**: todo `useState` nasce vazio, exceto o nome. A tela não é prévia de nada. O Elber pediu que a prévia *"seja realista e guarde exatamente os dados escolhidos"*, e ela não é, então a copy virou **"Ver a tela do perfil público · Ainda em construção: por enquanto ela não mostra o que você mandou no cadastro, e salvar não funciona. O que a equipe confere é o cadastro."** **A prévia real (ler `vet_profiles`/`clinic_profiles` e mostrar só leitura) é pedido do Elber e não tem card:** vai para o `vetria-maestro` decidir se é E2 na S4/S5 ou se anda com a T-019. **O rodapé *"Passou de 48h? … a gente te avisa por email"* fica como está, por decisão do Elber em 23/09** ("depois ajustamos se os donos da Vetria pedirem"), sabendo que hoje nenhum email está ligado e nada conta as 48h.
  - **8. ⚠️ Passou do que o card pediu, e é separável:** o cartão que aponta para `/perfil` dizia *"Adiantar foto e bio · Deixe seu perfil pronto pra aparecer na busca assim que validar"*, e o `VetProfileForm`/`ClinicProfileForm` tem **"Salvar (em breve)" desabilitado** até a T-019. Era promessa falsa ao lado do link novo, então virou *"Ver a prévia do seu perfil público"* / *"Mostra como o responsável vai ver você na busca. Salvar ainda não está disponível nessa tela: o que vale hoje é o que você mandou no cadastro."* **Se o `vetria-maestro` preferir, são duas linhas de copy e saem sozinhas.**
  - **9. Fora do escopo desta task, achado e não corrigido:** as duas `onboarding/page.tsx` guardam com `const PODEM_EDITAR_AQUI = ["incomplete","pending_validation"]`, que é uma **cópia** da constante `ONBOARDING`, não uma importação. São duas terceiras cópias da matriz §4 em arquivos de guard, e mexer nelas é aperto de autorização, que volta ao `vetria-seguranca`. Junto: os **9 `<button>`** dos dois formulários de onboarding não têm `cursor-pointer` (**DL-040**), e é para lá que este link novo manda a pessoa.

### T-022 — DECISÃO DO ELBER: a obrigatoriedade do documento vive na Server Action ou na fila do admin? (SEC-088)
- **Estado:** ✅ **DECIDIDA em 23/09/2026: (a), a Server Action recusa concluir sem documento** (**DL-061** item 2), e **implementada dentro da T-024** (`6a8d86a`). Provada em tela: o servidor recusou concluir sem documento. O furo que sobra (a RPC chamada direto) é a **SEC-098**, na T-027. _(anterior:)_ fila, correndo por fora. É uma decisão, não uma implementação
- **Fase / Semana:** F3 / S4 — **antes da T-023, se possível:** é ela que define se a fila precisa tratar "sem documento" como estado de primeira classe
- **Capacidade:** **E3** — é a qualidade da fila que o admin valida
- **Nível:** 🟠 — escopo ambíguo, pergunta antes
- **Agente dono:** o `vetria-maestro` leva, **o Elber decide**
- **Depende de:** nada
- **Por quê:** **SEC-088.** Hoje a obrigatoriedade do documento é **regra de tela**: o botão de concluir fica `disabled` sem `documento_enviado_em`, e as duas `actions.ts` **não conferem documento nenhum**. Duas portas, e a primeira nem é ataque: (1) DevTools, remover o `disabled`, clicar — a Action roda, chama a RPC, e o profissional entra em `pending_validation` **sem documento**; (2) POST com `Next-Action`, que o portão de rota não alcança. **Não vaza dado e não cruza usuário** — o admin simplesmente reprova. O custo é **operacional**. ⚠️ **A alternativa que não pode ficar é a de hoje: nenhuma das duas está escrita em lugar nenhum**
- **Feito quando:**
  - [x] O Elber escolhe **uma**: **(a)** a Server Action passa a exigir `documento_enviado_em` não nulo antes de chamar a RPC — fila limpa, e a pessoa **trava no passo 4** se o upload falhar; ou **(b)** a fila do admin assume o filtro, e a T-023 mostra "sem documento" como estado de primeira classe
  - [x] A escolha vira **DL** em `05-DECISOES.md`, com "o que se perde" escrito (DL-061)
  - [x] Se for **(a)**, vira uma linha no card das duas Actions e **volta ao `vetria-seguranca`** (SEC-2026-09-23-T024) — aperto de autorização também volta para revisão
- **Não fazer:** não implementar as duas. Não deixar a decisão implícita no código de quem chegar primeiro.
- **Resultado:** _(a preencher)_

### T-026 — O WhatsApp gravado antes do conserto do R-041 continua sujo
- **Estado:** ✅ **FECHADA em 23/09/2026 por medição, sem `update` nenhum.** A medição achou **uma** linha suja (`62 99265327`, conta de teste). A dona corrigiu pela própria interface: *"Rever e corrigir o cadastro"* (T-025) → fim do onboarding → *"Salvar alterações"*, e a Action normalizou na escrita. **A mesma consulta rodou de novo: zero linha.** O 🔴 de corrigir nunca precisou existir, pelo mesmo motivo do R-047: com conta de teste, o dono salva e a escrita conserta. _(Estado anterior:)_ fila, correndo por fora. 🟢 para medir · 🔴 para corrigir
- **Fase / Semana:** F3 / S4 para a medição. A correção, se for preciso, **agenda-se**
- **Capacidade:** **E5** — *"CTA de WhatsApp funciona"*. Número sujo é CTA que não abre conversa
- **Nível:** 🟢 medir · 🔴 corrigir
- **Agente dono:** o **Elber** mede. Corrigir é sessão presencial
- **Depende de:** nada
- **Por quê:** **a normalização do R-041 vale na ESCRITA.** `lib/contato/whatsapp.ts` existe desde `08dd42b` e as duas Actions passam por ela — mas **a linha que já estava gravada continuou suja até o Elber salvar o perfil dele à mão**. Foi medido: o `select` de 20/09 devolveu `62 992653278`, **com espaço**, para o veterinário. **Hoje isso são contas de teste.** No dia em que a base tiver gente de verdade, o mesmo padrão vira `update` em linha de terceiro, que é 🔴 — e o **DL-047** diz que é esse valor que o servidor devolve no evento de contato e que conta como lead entregue
- **Feito quando:**
  - [ ] A medição existe, escrita aqui: `select id, whatsapp from perfil_privado where whatsapp is not null and whatsapp !~ '^[0-9]+$';`
  - [ ] **Zero linha** → fecha com a medição escrita, e o **R-055** fecha junto
  - [ ] **Mais que zero** → cada linha é conta de teste ou conta de gente. Se houver conta de gente, **é sessão presencial**, e a regra de sempre vale: backup antes, `update` sobre `id` conhecido, nunca em massa
  - [ ] Fica escrito que **normalização na escrita não retroage**, e que a próxima normalização que este projeto adotar nasce com a pergunta *"e o que já está gravado?"* respondida dentro do card
- **Não fazer:** **não rodar `update` sem o Elber.** Não normalizar na leitura para esconder o problema: dado sujo escondido é dado sujo que ninguém conserta.
- **Resultado:** fechada por medição em 23/09 (ver Estado). Uma linha suja, conta de teste, corrigida pela dona pela interface; a consulta voltou zero. **R-055 fechado.** Nenhum `update` 🔴.

---
## 🗂️ HISTÓRICO — a fila da S3, aberta em 09/09 e FECHADA em 20/09

> **Mantido na íntegra, e não reescrito.** É aqui que estão registrados o corte dos
> editores de perfil (DL-056) e a ordem de deploy da T-007 com a T-016 (DL-057) — as duas
> decisões que sustentaram esta semana. **As duas venceram bem:** a ordem escolhida
> dispensou o `update` 🔴 do R-047, e a medição que ela exigia foi feita e **deu zero**.
> O corte liberou os 6 dias que produziram o PR #2.

⚠️ **Uma coisa que este bloco previu e errou na direção certa:** ele dizia, em 16/09, que
*"a T-008 não começou e é o caminho crítico"*. **Ela começou e fechou no mesmo dia** — o
que não fechou foi o item 3 do DoD, que nunca foi da T-008 e sempre foi da S4.

> **Semana aberta em 09/09/2026 pelo `vetria-maestro`.** **4 cards**, mais a T-003 em paralelo.
> **T-007 e T-008 são dívida da S2** e continuam com o número e o histórico delas; o que mudou
> é a semana em que estão sendo executadas.
>
> **Ordem de execução, por dependência real e não por facilidade:**
>
> | # | Card | O que destrava | Nível |
> |---|---|---|:---:|
> | 1 | **T-007** onboarding do estabelecimento | metade dos profissionais que a Vetria vende passa a chegar na fila de validação. É o **item 1 do DoD da F3** para `clinic` | 🟡 |
> | 2 | **T-008** upload do documento | **destrava a S4 inteira:** sem documento no bucket o admin não tem o que abrir, e o **item 3 do DoD** não fecha | 🟡 |
> | 3 | **T-016** portão de status | não destrava outra task, mas é o **item 2 do DoD da F3** e leva junto o **R-001**, o único 🔴 crítico aberto do projeto | 🟡 |
> | — | **T-017** constraints de conteúdo | corre por fora: **🔴, presencial.** Não é pré-requisito de nada desta semana | 🔴 |
>
> **Por que T-007 antes de T-016**, e não o contrário: as duas quase não se tocam (a T-016 mexe
> em `requirePainel` e nas páginas de painel; a T-007, no diretório de onboarding do
> estabelecimento). Mas a T-007 é a **única task que faz existir um `clinic` em
> `pending_validation` de verdade**, e esse é exatamente o estado contra o qual o portão da
> T-016 precisa ser provado. Invertida, a T-016 fecha sem ter contra o que ser testada.
>
> **A T-003 continua em paralelo** desde o primeiro dia: `vetria-qa` escreve só em `tests/` e
> não disputa arquivo com ninguém.
>
> ### ✅ 09/09, fim do dia — a T-008 deixou de ter pergunta em aberto
>
> O **R-042 (SEC-063)** cobrava do card duas respostas que ele não dava: **em que ordem os
> passos 7 e 8 rodam** e **quem apaga o objeto quando o 8 falha**. As duas estão escritas agora,
> na seção 🔒 do card, com o custo da escolhida e o da recusada: **ordem 7 → 8**, **compensação
> dentro da própria rota**, **varredura por `select` quando ela não bastar** — e a admissão de
> que ela nem sempre basta. Junto vieram a linha de deploy do **R-047** e a confirmação do
> escopo do **R-029** dentro da task, que **não cresce lá**.
>
> **Isso não é uma linha de código.** A T-008 continua ⬜ na fila, atrás da T-007, e continua
> valendo o corte escrito: **se em 15/09 ela não estiver fechada, os editores de perfil da S3
> escorregam para a F6/S11.** O que mudou é que quem pegar a task não vai decidir sozinho, às
> onze da noite, o que fazer com um documento de identidade que ficou no bucket.
>
> ⛔ **16/09 — o corte foi ACIONADO. A T-008 continua sem uma linha escrita, e agora ela é o
> caminho crítico da fase inteira, sem nada dividindo a semana com ela.** Ver **DL-056**.
>
> Nasceu também a **T-018** (F6/S11), na seção *Plantadas para fases futuras*: é o card da
> exclusão de dados, que o **R-023** mandava anotar desde 26/08 e que não existia para receber a
> anotação.

---

## ⛔ 16/09/2026 — O CORTE FOI ACIONADO. Decisão do Elber.

**O corte estava escrito desde 09/09**, duas vezes neste arquivo (linhas 27 e 125), nestes
termos: *"se em 15/09 a T-008 não estiver fechada, os editores de perfil da S3 escorregam para
a F6/S11"*. **Hoje é 16/09. A T-008 não fechou: ela não começou.** A condição foi atingida, o
`vetria-maestro` levou a decisão ao Elber, e **o Elber acionou**.

| Campo | |
|---|---|
| **O quê** | Editores de perfil das **3 personas** (`/app/responsavel/perfil`, `/app/veterinario/perfil`, `/app/estabelecimento/perfil`) carregam e salvam de verdade |
| **De onde sai** | F3 / S3 (`01-PLANO.md` §S3) |
| **Para onde vai** | **F6 / S11** — card **T-019**, na seção 🌱 *Plantadas para fases futuras* |
| **Por quê** | O corte era **escrito e condicional**, e a condição foi atingida. Não é improviso de sexta |
| **Quando** | 16/09/2026 |
| **Quem decidiu** | **Elber.** Registrado em **DL-056** |

### ✅ Isto NÃO é corte de escopo contratado. Conferido contra o `00-ESCOPO.md`, não suposto.

- **`00-ESCOPO.md` §2 não cita editor de perfil em nenhuma das seis capacidades.** E2 é
  *"o que o vet/estabelecimento digita no onboarding persiste e reaparece"* — é o **onboarding**,
  e ele é a T-006 (feita) e a T-007 (implementada). E5 é perfil **público**, que é leitura.
- **Nenhum dos 6 itens do Definition of Done da F3 depende do editor.** Itens 1, 2 e 3 são
  cadastro → onboarding → fila → aprovação (T-007, T-016, S4). Item 4 é isolamento de role
  (T-016). Itens 5 e 6 são teste e relatório.
- **Logo: não há emenda a fazer no `00-ESCOPO.md` §5.** Emenda existe para escopo **contratado**
  que sai; o editor de perfil nunca esteve contratado. É reprogramação **dentro** das 13 semanas,
  não redução do que foi prometido. **A entrega de 25/11/2026 continua inteira.**
- É o mesmo precedente de foto de perfil e horários, cortados da S2 em 26/08 pela mesma razão
  (ver R-019 e o histórico da S2, mais abaixo).

### O que o corte libera, e é o único motivo dele existir

**Restam 6 dias de F3** (16/09 → 22/09). Eles ficam inteiros para **T-007, T-008 e T-016**, que
são os **itens 1, 2 e 3 do DoD da F3**. Nenhum outro card entra na fila desta semana.

| Item do DoD da F3 | Quem fecha | Onde está hoje |
|---|---|---|
| 1. Onboarding persiste e reaparece | **T-007** (para `clinic`; para `vet` já fechou em 31/08) | implementada, aprovada, **3 travas do Elber** |
| 2. Vê "aguardando" e não entra no dashboard | **T-016** | implementada, **em revisão de segurança agora** |
| 3. Admin aprova e o profissional entra | **T-008** + a S4 | **T-008 não começou.** É o caminho crítico |
| 4. Responsável que digita `/app/veterinario` é redirecionado | **T-016** (R-001) | dentro do mesmo diff |
| 5. E2E cobrindo 1 a 4 em CI | T-003 / `vetria-qa` | esbarra em **R-033** e **R-053** |
| 6. Relatório de segurança sem 🔴 aberto | `vetria-seguranca` | T-007 aprovada; T-016 em curso |

⚠️ **A fila foi executada FORA DA ORDEM, e o quadro registra isso em vez de arrumar a história.**
A ordem publicada em 09/09 era **T-007 → T-008 → T-016**. O que aconteceu foi
**T-007 → T-016**, e a **T-008 foi pulada**. A T-016 é o item 2 do DoD e não foi trabalho
perdido — mas ela *"não destrava outra task"*, por escrito no próprio quadro, e a T-008
*"destrava a S4 inteira"*. **Foi feito primeiro o que destrava menos.** A S4 começa em 6 dias
e continua sem ter o que abrir.

⚠️ **O corte não salva a F3 sozinho, e este quadro não vai fingir que salva.** A **T-008 é o
item que não tem nada escrito na árvore**, e sem ela o item 3 do DoD não fecha nem com a S4
perfeita: **o bucket está vazio e o admin não tem o que abrir.** O corte comprou dias para ela;
quem os gasta é quem pegar o card. **A próxima linha de código desta fase é a T-008.**

### Onde mais isto foi registrado

`01-PLANO.md` §S3 (riscado, com o porquê) e §S11 (recebido) · `02-ESTADO.md` §AGORA ·
`05-DECISOES.md` **DL-056** · card **T-019** em 🌱 *Plantadas*.

---

## 🚢 16/09/2026 — A ORDEM DE DEPLOY DA T-007 E DA T-016. Decidida, com o custo escrito.

O `vetria-backend` levantou isto por escrito no Resultado da T-016 (*Descobri 2*) e
**deliberadamente não decidiu**, o que é o comportamento certo. A decisão é do
`vetria-maestro` e está aqui. Registrada em **DL-057**.

### A decisão: **as duas sobem JUNTAS, no mesmo push. Nunca uma sem a outra.**

E, dentro disso, uma ordem que não é intercambiável: **se por algum motivo forem dois pushes,
a T-007 vai primeiro e a T-016 logo atrás. A T-016 SOZINHA ANTES DA T-007 é a única
combinação proibida.**

**Por que proibida, e isto é achado novo, não preferência:** a T-016 faz `/app` rotear por
`profiles.status`. Com ela no ar e a T-007 fora, a conta `clinic` órfã do **R-047**
(`status = 'incomplete'`) passa a ser mandada para `/app/estabelecimento/onboarding` — que em
produção ainda é a **página velha, com a Server Action inline** que grava
`onboarding_completed = true` **e não move o `status`** (`page.tsx:33-59`, o arquivo que a
T-007 apaga). Ela conclui, é devolvida para `/app`, o `status` continua `incomplete`, e volta
para o onboarding. **Isso é um laço**, e ele alcança **toda** conta `clinic` incompleta, não só
as órfãs. A ordem inversa troca uma conta parada por uma conta girando.

### O que cada opção custa

| Opção | O que ganha | O que custa | Veredito |
|---|---|---|---|
| **A — juntas, um push** | O **R-047 deixa de precisar do `update` 🔴** e da sessão presencial: o órfão é roteado para o onboarding **novo**, o guard da T-007 aceita `incomplete`, ele conclui e entra na fila. O conserto vira **código já escrito**, não agenda | **Nenhuma sobe até as duas estarem prontas.** A T-007 está aprovada desde 15/09 e passa a esperar a revisão da T-016, que pode voltar com correção | ✅ **ESCOLHIDA** |
| **B — T-007 sozinha** | A T-007, que já está aprovada, sobe hoje. O item 1 do DoD fecha para `clinic` antes | O **`update` 🔴 do R-047 volta a ser necessário** se a medição der mais que zero: sessão presencial, escrita em linha de produção, num dia em que há 6 restando na fase. E a conta órfã segue invisível no intervalo | ⬜ plano B |
| **C — T-016 sozinha antes** | nada | o laço de redirect descrito acima | 🚫 **proibida** |

### A trava, com data, para o caso de a revisão voltar com correção

A T-016 **está em revisão de segurança neste momento** e a regra da casa é que correção de
segurança volta para revisão, sempre (`AGENTES.md`). Amarrar as duas sem trava é como um
atraso de um card vira atraso de dois.

⛔ **PONTO DE DECISÃO: 18/09/2026, fim do dia.** Se até lá a T-016 **não** estiver com revisão
fechada e diff pronto para o Elber, **o plano A morre e vale o B**: a T-007 sobe sozinha, e o
**`update` 🔴 do R-047 volta para a mesa como sessão presencial.** Quem constata é quem abrir o
dia 19/09. **A data existe para que a espera tenha fim escrito, não para que ela se estenda por
inércia.**

### ⚠️ A medição do R-047 CONTINUA VALENDO. Não foi dispensada, e não é opcional.

`select count(*) from profiles where role='clinic' and onboarding_completed and status='incomplete';`

A decisão acima muda **quem conserta** (código, não sessão presencial). **Não muda que ninguém
sabe quantas contas são.** A medição continua sendo do Elber, continua sendo um `select` de dez
segundos, e agora serve para três coisas:

1. **Zero** → o R-047 fecha com a medição escrita, qualquer que seja a ordem de deploy.
2. **Mais que zero** → é o tamanho do conjunto que **se conserta sozinho no próximo login** com
   o plano A. Sem o número, "se conserta sozinho" é fé.
3. **Muito mais que zero** → aí existe uma pergunta nova, que hoje não tem dono: essas pessoas
   precisam ser **avisadas** para voltar e concluir? Isso é email transacional, e **não** está
   na fila desta semana. Se o número pedir, vira card; enquanto ninguém contou, não vira nada.

⚠️ **A medição é `select`, é leitura, e o `vetria-backend` tentou rodar em 16/09:** o ambiente
recusou acesso a dado de produção. **Não há caminho de agente para esta linha.** É gesto do
Elber, e é o mais barato dos três que faltam.

---

> **Histórico da abertura da S2, em 26/08** — mantido porque é onde está registrado o que saiu
> do plano, e por quê:

> **Semana aberta em 26/08/2026 pelo `vetria-maestro`.** 5 cards. **Mais 4 em 26/08, vindos da
> auditoria da `0003`** (T-009 a T-012), **os quatro fechados no mesmo dia**. **Mais 1 da
> segunda rodada** (T-013, SEC-046).
> **Com a `0003` aplicada e a T-002 fechada, sobram 5 na fila: T-006 → T-007 → T-008, com
> T-003 em paralelo e T-013 como acompanhamento.**
>
> **O que mudou em relação ao `01-PLANO.md` §S2, e por quê:**
> - **T-002 e T-003 escorregaram da S1** e abriram a S2. **A T-002 fechou em 26/08**, com a `0003` aplicada em produção; a T-003 continua na fila.
> - **Onboarding do responsável saiu da S2 e vai pra S3**, junto com os editores de perfil. Motivo: os itens 1 a 4 do Definition of Done da F3 são todos do caminho do **profissional**; o responsável não tem nenhum item de DoD. Com uma 🔴 herdada da semana anterior dentro da fila, a S2 protege o caminho crítico primeiro.
> - **Foto de perfil (vet) e horários (estabelecimento) não entram na S2.** O plano prometeu os dois, mas não existe nem campo no formulário nem coluna no banco para nenhum deles, e criar coluna é migration (🔴). Ver **R-019**. Nenhum dos dois está no `00-ESCOPO.md` §2, então não é corte de escopo contratado.

> ### ✅ T-009 a T-012 nasceram da auditoria da `0003` e **fecharam em 26/08**
>
> A v1 foi reprovada (`docs/relatorios/SEC-2026-08-26-0003.md`, SEC-033 a SEC-045); os quatro
> cards eram os bloqueantes do veredito. A **v2** os fechou e foi **aprovada**
> (`docs/relatorios/SEC-2026-08-26-0003-v2.md`). Os quatro cards estão em **✅ CONCLUÍDAS**,
> com o Resultado preenchido.
>
> ⚠️ **Os Resultados desses quatro falam de SQL "não aplicado". Isso descreve o dia em que foram
> escritos:** a `0003` foi aplicada em produção horas depois, em 26/08. O que ficou no banco está
> no card da **T-002**.

### T-017 — Constraints de conteúdo em `vet_profiles` e `clinic_profiles` (R-039 / SEC-060) 🔴
- 📏 **MEDIDO em 23/09/2026 pelo Elber: o furo é REAL.** Script só com `anon key` + login da conta vet de teste (Elder Lucas, `e5a1a020…`), sem `service_role`: leu `estado = "AP"`, fez `PATCH estado='ZZ'` direto no PostgREST → **HTTP 200, e a releitura devolveu `"ZZ"`**. O banco gravou uma UF que não existe, passando por cima da Action. **Restaurado para `"AP"` no `finally`, conferido ✅.** O card não encolhe nem morre: **é 🔴 de verdade e precisa da sessão presencial**, agora sabendo exatamente o que consertar. Candidato a andar com a T-027 (SEC-096/097b/098 da auditoria da T-024) numa migration só.
- **Estado:** 🚫 **ABSORVIDA PELA T-027 em 23/09/2026 (DL-062).** O card fica aqui como registro da medição e do raciocínio; **o trabalho mora na T-027**, e a pertença à lista de especialidades e serviços mora na T-028. _(anterior:)_ ⏸️ **aguardando sessão presencial com o Elber. AGENDE. ⚠️ Carregada da S3 para a S4 em 21/09, sem data pela quarta semana seguida — e a F3 acaba nesta semana.** O card mora aqui, na fila, e não em BLOQUEADAS, porque ele **não bloqueia ninguém** — quem está bloqueado é ele, pela agenda
- **Fase / Semana:** F3 / **S3 se a sessão couber nesta semana; senão S4.** **Prazo duro: dentro da F3.** A F4/S7 (perfil público, 07/10–13/10) é onde a coluna `site` vira link clicável numa página pública, e depois disso a correção deixa de ser preventiva
- **Capacidade:** **E1** — núcleo de dados: *"`vet_profiles` e `clinic_profiles` existem com RLS"* — mais a transversal obrigatória **Segurança**
- **Nível:** 🔴 — **é migration.** Migration, RLS e mudança de policy são 🔴 por regra do projeto e **não acontecem sem o Elber presente**. Nenhum agente aplica isto sozinho, e nenhum agente escreve a `0004` "só pra deixar pronta" antes de a medição abaixo existir
- **Agente dono:** vetria-backend, **com o Elber na sala** · **auditoria obrigatória antes de aplicar:** vetria-seguranca. A `0002` levou **quatro rodadas**, e em todas houve achado nascido da correção anterior — um deles teria desligado a busca pública inteira
- **Depende de:** nada. **Não é pré-requisito da T-007**, e o parecer de 09/09 diz isso com todas as letras
- **Por quê:** `campos.ts:5-8` declara a garantia por escrito — *"Se a lista de valores só existir no cliente, o servidor aceita qualquer string e a busca herda lixo. A lista mora aqui, e a Server Action valida contra ela."* **A premissa é falsa:** a Server Action não é o servidor, é **um** dos escritores. As colunas de `vet_profiles` são `text`, `text[]` e `boolean` **sem um único CHECK**, e `vet_profiles_update_own` (`0002:517-524`) pina no WITH CHECK **só `id` e `slug`**. A anon key e a URL estão no bundle (`lib/supabase/browser.ts:5-6`) e o token da sessão está no cookie: um `PATCH` em `/rest/v1/vet_profiles?id=eq.<meu uuid>` grava `estado = 'ZZ'`, milhares de especialidades e megabytes de `bio` — **em tabela de leitura pública** — e, como o trigger de revalidação vigia só `crmv`, `crmv_uf` e `nome_exibicao` (`0002:379-386`), um vet `active` faz isso **sem voltar para a fila e sem deixar linha em `audit_logs`**. **Não é escalada de privilégio** — `status`, `role`, `admin_level` e `slug` seguem pinados — e é por isso que é 🟠 e não 🔴.
- **⚠️ O QUE DÁ URGÊNCIA A ESTE CARD, e não está em `vet_profiles`: `clinic_profiles.site`.** A `0003:1301` declara a coluna, textualmente, *"PÚBLICA por decisão. É vitrine."* É **URL escrita pelo dono da conta, sem validação de esquema em lugar nenhum**, e é **destinada a virar link numa página pública na F4/S7**. **`javascript:` passa hoje. `data:` passa hoje.** Não é explorável agora porque a página não existe; **passa a ser no dia em que ela existir, e quem escrever essa página vai acreditar no `campos.ts` clonado.** É por isso que este card não escorrega para a F6.
- **⚠️ ANTES DA SESSÃO, a medição de dois minutos** — item 3 de *"Não consegui verificar"* do relatório de 09/09, e o relatório diz, dele mesmo, que **essa medição vale mais que o relatório inteiro para dimensionar esta task**:
  - [ ] **Exercitar o PATCH numa conta de teste na preview.** O achado inteiro foi **deduzido da leitura da policy e nunca executado contra o banco** — e não foi executado de propósito, porque escreveria numa linha real. Conta de teste na preview fecha isso em dois minutos. **Se o PATCH for recusado, este card encolhe ou morre.** Meça antes de escrever SQL
  - [ ] No mesmo fôlego, os itens 1 e 2 da mesma lista, que são um `select` cada: `select policyname, cmd, with_check from pg_policies where tablename in ('vet_profiles','clinic_profiles','profiles');` — porque **todo o SEC-060 depende de a RLS em produção ser a das migrations**. O R-006 fechou o descompasso, mas policy criada pelo painel não estaria no repositório, e a única prova é `select` no banco
- **Feito quando** — direção, não desenho fechado: o desenho sai na sessão, **depois** da medição:
  - [ ] A medição acima **está feita e registrada por escrito**, antes de existir uma linha de SQL
  - [ ] CHECK ou `domain` em `crmv_uf` e `estado`: duas letras, UF brasileira válida
  - [ ] CHECK de whitelist em `titulo` e `experiencia`, **espelhando o `campos.ts`** — e o `campos.ts` passa a apontar para a constraint, para os dois não divergirem em silêncio, que é o defeito de origem deste achado
  - [ ] Teto de comprimento nas colunas de texto (`bio`, `sobre`) e teto de tamanho nos arrays `especialidades` e `servicos`, mais whitelist neles. **As duas tabelas são de leitura pública:** hoje uma `bio` de vários MB é servida ao visitante anônimo e entra na agregação de facetas da busca da F4/S6, sem teto nenhum
  - [ ] **`clinic_profiles.site`: esquema restrito a `http` e `https`, no banco.** É a linha mais importante deste card
  - [ ] **Alternativa que a sessão pode escolher no lugar de tudo acima:** revogar UPDATE do dono nas duas tabelas e fazer toda escrita passar por RPC `SECURITY DEFINER` + `SET search_path = public`, no molde de `concluir_onboarding_profissional()`. ⚠️ **Continua sendo migration e continua sendo 🔴**, e toda função usada em policy tem que ser `SECURITY DEFINER` com `search_path` fixo (DL-014/015): `SECURITY INVOKER` já causou recursão infinita e derrubou o banco
  - [ ] **Migration aditiva, backup antes, e constraint validada contra o dado que já existe.** Há linha real em `vet_profiles` desde 31/08: `alter table ... add constraint` sobre dado fora da regra **falha na hora de aplicar**
  - [ ] **O que NÃO muda, e tem que continuar não mudando:** `status`, `role`, `admin_level` e `slug` seguem pinados pelas policies — as quatro foram reconferidas em 09/09 e estão certas. **`status` nunca é escrito pelo próprio usuário**, e isso é regra do projeto, não detalhe desta task
- **Não fazer:** **não aplicar nada sem o Elber.** Não aproveitar a sessão para "já resolver" o R-040 pinando `onboarding_completed` no WITH CHECK: a correção barata dele é **sem migration** e está na T-016 — se a sessão quiser resolver os dois, é decisão do Elber e vira linha em `05-DECISOES.md`. Não encostar em `perfil_privado.documento_*`: o CHECK all-or-nothing está certo e a T-008 depende dele. Não renomear coluna nenhuma.
- **Resultado:** _(a preencher)_


### T-003 — Instalar Playwright + CI
- **Estado:** ✅ **O item que faltava FECHOU em 20/09: o CI rodou a suíte inteira, 40 testes, todos verdes** — sessão real, cookie real e `middleware.ts` real exercitados pela primeira vez. **O R-053 fecha junto.** A suíte foi de **15 para 40** no PR #2 (`7460d36`), com `portao-status.spec.ts` (10) e `onboarding-vet.spec.ts` (9) nascendo na S3, e o pré-voo do `ci.yml` passou a recusar suíte verde sem credencial (`f33b295`). ⚠️ **Um teste lia `innerText()` contra um elemento com `text-transform: uppercase` e quebrava ao comparar com regex sensível a maiúscula** — derrubou o CI na primeira execução real e foi consertado em `8674e3a`. **Bug do teste, não do produto**, e é o tipo de coisa que só aparece quando a suíte roda de verdade. _(estado anterior, mantido:)_ 🟡 escrita, verde e COMMITADA em 31/08 (`82f59bb`, branch `f3-s2/onboarding-vet-e-ci`, na `main` pelo PR #1). ✅ **15/09 — o item que estava aberto FECHOU: os 2 testes de login PULARAM** (medição no Adendo abaixo). **O item de DoD do login continua aberto**, e continua só fechando quando rodar verde: os 4 secrets estão **declarados** no workflow, mas `E2E_VET_EMAIL` e `E2E_VET_SENHA` chegam ausentes ou vazios — **e ninguém confere isso** (**R-053**)
- **Fase / Semana:** F3 / S2 _(escorregou da S1)_
- **Capacidade:** transversal obrigatória **Testes** (`00-ESCOPO.md` §2), ancorada em **E2** — o primeiro fluxo de produto coberto é o onboarding profissional, e o item 5 do DoD da F3 exige E2E em CI
- **Nível:** 🟡
- **Agente dono:** vetria-qa
- **Depende de:** nada. **Roda em paralelo** com a T-006 e a T-007, porque `vetria-qa` escreve só em `tests/` e não disputa arquivo com ninguém
- **Por quê:** são 12 semanas de mudança em código que já está em produção. Sem rede de segurança, regressão vira descoberta do cliente. E a S2 é exatamente a semana em que o banco entra por baixo de telas que já estão no ar (R-003).
- **Feito quando:**
  - [x] Playwright instalado, `npm run test:e2e` funcionando — `@playwright/test@1.62.1`, Chromium, `playwright.config.ts` na raiz. **13 testes verdes em 39,4s**, 2 pulados por falta de credencial
  - [x] Workflow do GitHub Actions rodando build + lint + E2E em push na `main` — `.github/workflows/ci.yml`, também em todo pull request e em `workflow_dispatch`. ⚠️ **O passo de lint NÃO bloqueia ainda:** ver T-014
  - [ ] Primeiro teste real: login com credencial de teste → chega no painel certo — **escrito** (`tests/e2e/login.spec.ts`, 2 testes), **pulando** até os secrets existirem. Só fecha quando rodar verde de verdade
  - [x] Usuários de teste **não** vêm de `.env` commitado — vêm de secret do GitHub, lidos por `tests/apoio/credenciais.ts`. `.env*` já estava no `.gitignore`; o novo `/test-results/`, `/playwright-report/` e `/blob-report/` entraram junto, porque **trace e screenshot de tela logada são dado pessoal**
  - [x] `README.md` explica como rodar teste local — seção **Testes (E2E com Playwright)**, com as duas camadas, as quatro variáveis e o aviso de que a `SUPABASE_SERVICE_ROLE_KEY` nunca entra em CI nem em teste
  - [ ] **Se a T-006 fechar dentro da semana:** segundo teste cobrindo cadastro de vet → onboarding preenchido → sair e voltar → o dado está lá (item 1 do DoD da F3) — **não escrito de propósito.** Ver Resultado, ponto 4
- **Não fazer:** não escrever teste de tela que ainda é casca. Testa só o que já é real. Não criar usuário de teste em produção sem combinar como ele é limpo depois.
- **Resultado (28/08/2026, `vetria-qa`): a rede existe, está verde, e falta 1 gesto do Elber.**
  - **8 arquivos.** Novos: `playwright.config.ts`, `tests/apoio/credenciais.ts`, `tests/e2e/publico.spec.ts`, `tests/e2e/login.spec.ts`, `.github/workflows/ci.yml`. Tocados: `package.json` (3 scripts + `@playwright/test` em `devDependencies`), `.gitignore`, `README.md`. **Nenhum arquivo de produção foi tocado**, como a regra de `vetria-qa` exige.
  - **1. `npm run build` continua verde** e o `npm run lint` continua com os **mesmos 17 problemas de antes** (14 erros, 3 avisos): a task não introduziu dívida nova, e nada em `tests/` ou no `playwright.config.ts` acusa.
  - **2. A suíte roda contra o build de produção, não contra o `next dev`.** O `dev` não reproduz Server Action minificada, nem cache, nem o comportamento real do middleware — e é exatamente aí que a T-006 e a T-007 vão viver. O `webServer` do Playwright constrói e sobe sozinho; no CI, só sobe, porque o build é passo anterior.
  - **3. O teste mais valioso não é o de login, é o das portas trancadas.** Seis rotas de `/app` e `/admin` provam que visitante sem sessão cai no `/login`. Isso é o `middleware.ts`, que o **R-001** registra como **ainda não isolando painel por role**: o que ele já faz passa a ter prova antes de alguém mexer nele pra consertar o R-001. Junto vieram duas guardas de regra do projeto que se perdem calado num refactor: o **`noindex` do `/roadmap`** (DL-039) e a **ausência de travessão** no texto visível da home (DL-038).
  - **4. ⚠️ O 2º teste (persistência do onboarding) NÃO foi escrito, e a razão é uma pergunta em aberto, não falta de tempo.** Ele precisa de **conta `vet` nova a cada rodada**, e o próprio card proíbe criar conta de teste em produção sem combinar como ela é limpa depois. As duas saídas são decisão do Elber e nenhuma é óbvia: (a) a suite cria e apaga a conta com `service_role`, o que **coloca a chave que ignora RLS inteira dentro do CI** e é exatamente o que este arquivo de workflow diz que nunca vai acontecer; ou (b) um projeto Supabase separado só pra teste, que custa tempo de setup e passa a ter schema pra manter em sincronia. **Virou R-033.**
  - **5. Falta 1 gesto, e ele é de celular:** criar 4 secrets em `Settings > Secrets and variables > Actions` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `E2E_VET_EMAIL`, `E2E_VET_SENHA`) e ter uma conta `vet` de teste. **Sem os 2 primeiros o workflow para com erro escrito** (há um passo de conferência só pra isso), em vez de ficar verde à toa com 500 em toda rota. Sem os 2 últimos, os testes de login aparecem **pulados com o motivo escrito** — nunca verdes.
  - **6. Nasceu a T-014**, do passo de lint que hoje não bloqueia.

  ---

  ## ADENDO — 15/09/2026, `vetria-escriba`: os 2 testes de login PULARAM, e o CI não avisa

  **O item aberto desde 31/08 era "conferir se os 2 testes de login rodaram ou pularam". Resposta:
  PULARAM.**

  **A medição:** `npx playwright test --list` local devolve **`Total: 15 tests in 2 files`** — **13
  em `tests/e2e/publico.spec.ts`** e **2 em `tests/e2e/login.spec.ts`**. O CI reportou **13 verdes**,
  que é exatamente o `publico.spec.ts` inteiro. **Se os de login tivessem rodado, seriam 15.** Logo
  o `test.skip(credencial === null, SEM_CREDENCIAL)` de `login.spec.ts:20` disparou:
  **`E2E_VET_EMAIL` / `E2E_VET_SENHA` chegaram ausentes ou vazios no workflow.**

  **⚠️ E o achado vale mais que o item.** O pré-voo de `.github/workflows/ci.yml:54-62` barra a
  ausência de `NEXT_PUBLIC_SUPABASE_URL` e de `NEXT_PUBLIC_SUPABASE_ANON_KEY` **e mais nada**. As
  duas credenciais de teste estão declaradas no `env` do job (`ci.yml:34-37`) e **não são conferidas
  por ninguém**: sem elas o CI fica **verde, sem erro e sem aviso**, e a única cobertura de **sessão
  real, cookie real, `middleware.ts` real e isolamento entre painéis** não roda. É literalmente o
  modo de falha que `tests/apoio/credenciais.ts:32-34` foi escrito para evitar — *"Pular é diferente
  de passar… e não como suíte verde mentindo"* —, acontecendo **uma camada acima**, no workflow, que
  é onde se decide se a cobertura roda.

  **Virou o R-053.** ⚠️ **O conserto do `ci.yml` está sendo feito em paralelo, nesta mesma sessão, e
  não por esta passagem de docs** (o arquivo aparece como `M` no `git status` de 15/09). **O risco só
  fecha quando o CI rodar com 15 testes**, não quando o arquivo mudar.


---

# ⏸️ BLOQUEADAS

**23/09 — nenhuma task bloqueada por outra task.** O que espera é **gente e agenda**, e está escrito
no topo deste quadro: a sessão presencial da T-027/T-028 (até 29/09) e a decisão do R-033, que trava
as partes B e C da T-029. A T-017 saiu desta seção: foi absorvida pela T-027.

---

# 🌱 PLANTADAS PARA FASES FUTURAS

> **Não estão na fila de nenhuma semana, e não disputam prioridade com ninguém.** Existem por
> um de dois motivos:
>
> 1. **Um card de hoje precisava anotar alguma coisa "no card de lá", e o card de lá não
>    existia.** Anotação em card que não existe é anotação perdida. É o caso da **T-018**.
> 2. **Trabalho que estava previsto numa semana e foi CORTADO para outra fase, por decisão
>    registrada.** Ele ganha card aqui no ato do corte, para que o corte tenha destino e não
>    vire desaparecimento silencioso. É o caso da **T-019** (16/09, DL-056).

### T-019 — Os editores de perfil das 3 personas carregam e salvam de verdade
- **Estado:** ⬜ **plantada. Chegou aqui vindo da S3 em 16/09/2026, pelo corte acionado pelo Elber** (DL-056). Não é da S3, não está na fila de nenhuma semana desta fase e **não bloqueia nada**
- **Fase / Semana:** **F6 / S11** (`01-PLANO.md` §S11)
- **Capacidade:** **E2** — *"o que o vet/estabelecimento digita no onboarding **persiste e reaparece**"*. O editor é o segundo tempo do mesmo verbo: o onboarding grava uma vez, o editor grava de novo. ⚠️ **Ancorado em E2, não coberto por E2:** o `00-ESCOPO.md` §2 descreve E2 pelo **onboarding**, e nenhum dos 6 itens do DoD da F3 cita editor. É por isso que ele pôde escorregar sem emenda
- **Nível:** 🟡 — três formulários, escrita em `vet_profiles`, `clinic_profiles`, `profiles` e `perfil_privado`. ⚠️ **Vira 🔴 na hora em que pedir migration ou policy**, e há chance real disso: ver *Por quê*
- **Agente dono:** vetria-backend (persistência) + vetria-ui (as três telas) · **auditoria obrigatória:** vetria-seguranca
- **Depende de:** **T-016** (é ela que decide quem alcança `/app/*/perfil`: pela matriz §4, `pending_validation` alcança, e é DL-046) · **T-017** (as constraints de conteúdo; sem elas o editor é o segundo caminho de escrita sem CHECK, e o primeiro já é o problema do R-039) · e da **auditoria de RLS da própria S11**, que toca exatamente as policies de UPDATE que este card exercita
- **Por quê:** hoje as três telas de `/app/*/perfil` são **casca**: existem, são bonitas, e não carregam nem salvam nada (`02-ESTADO.md` §casca). O **DL-046** promete por escrito que *"enquanto espera, ele edita o perfil"* — e essa promessa é **a única coisa que o profissional em `pending_validation` tem para fazer**. ⚠️ **E é aqui que isto encosta em 🔴:** editar perfil depois de aprovado mexe em `crmv`, `crmv_uf` e `nome_exibicao`, que o trigger de revalidação vigia (`0002:379-386`) — **mudar um deles devolve o profissional para a fila**. O que o editor pode e não pode mudar sem custar a validação **não está decidido em lugar nenhum**, e encosta no **R-032** (por que o estabelecimento que muda de cidade volta para a fila e o veterinário não)
- **Por que F6/S11, e não F4:** porque é a fase em que a auditoria completa de RLS já vai estar lendo as policies de UPDATE das quatro tabelas. Fazer o editor ali é uma passada; fazer antes é duas, e a segunda descobre o furo da primeira
- **Feito quando** — direção, não desenho fechado:
  - [ ] As três telas **carregam** o dado real da linha do próprio usuário e **salvam** de volta, no servidor
  - [ ] **A pergunta do trigger de revalidação está RESPONDIDA E REGISTRADA em `05-DECISOES.md` antes da primeira linha de código:** quais campos um profissional `active` pode editar sem voltar para a fila, e o que a tela avisa antes de ele salvar um que o faça voltar. Hoje ele voltaria **sem ser avisado**
  - [ ] **`status`, `role`, `admin_level` e `slug` continuam pinados.** Regra do projeto, não detalhe deste card: `status` **nunca** é escrito pelo próprio usuário
  - [ ] `perfil_privado` (whatsapp, telefone) é editável pelo dono, e **nada disso vai para tabela de leitura pública**
  - [ ] O editor **valida contra a mesma fonte** que a T-017 fixou no banco, e não contra uma segunda cópia da lista — foi assim que o R-039 nasceu
  - [ ] E2E: editar, sair, voltar, o dado está lá. É o mesmo teste da T-006, no outro verbo
- **Não fazer:** não construir foto de perfil (R-019, sem coluna e sem bucket, e está em §Ideias do `04-RISCOS.md`). Não construir horários (mesma coisa). Não antecipar este card para dentro da F3 ou da F4 sem passar pelo `vetria-maestro`: **ele foi cortado por decisão escrita do Elber em 16/09**, e voltar por inércia é exatamente o que o corte existe para impedir
- **Resultado:** _(a preencher na F6)_

### T-018 — Excluir a conta apaga o documento do bucket, e a varredura de órfãos existe
- **Estado:** ⬜ **plantada.** Não é da S3, não entra na fila desta semana e não bloqueia nada
- **Fase / Semana:** **F6 / S11** (`01-PLANO.md`: *"Exclusão de conta (soft delete + anonimização) e exportação de dados do titular"*)
- **Capacidade:** transversal obrigatória **LGPD** (`00-ESCOPO.md` §2), ancorada em **E1** — é o outro lado de *"documentos sobem pro Storage"*: o que sobe tem que poder descer
- **Nível:** 🔴 — apagar objeto de Storage e linha de titular é destrutivo por definição
- **Agente dono:** vetria-backend, **com o Elber na sala**
- **Depende de:** **T-008** (é ela que fixa a convenção de caminho `<uuid>/` e escreve `documento_path`)
- **Por quê:** **R-023 / SEC-039.** `perfil_privado.id` tem `on delete cascade` para `profiles`: apagar a conta derruba a linha e o `documento_path` junto. **O objeto no bucket não é tocado por cascade nenhum** — `storage` é outro serviço. Resultado: RG, CNH e comprovante de CRMV de quem **pediu exclusão** continuam no projeto, agora órfãos, sem nem a linha que dizia de quem eram. LGPD art. 18 VI atendido pela metade, e a metade que fica é a mais sensível.
- **Feito quando** — direção, não desenho fechado:
  - [ ] A rotina de exclusão **apaga o objeto do bucket antes de apagar a linha**, com `service_role`, e falha ruidosamente se não conseguir. Depois do cascade o caminho já não existe em lugar nenhum: **a ordem aqui é o inverso da T-008, e é de propósito**
  - [ ] **A varredura de órfãos entra na rotina**, e a consulta **NÃO é copiada para cá**: ela vive num lugar só, o card da **T-008**, item 3 da seção 🔒. É um `left join` de `storage.objects` com `perfil_privado` por `documento_path`, mais uma segunda consulta de uma linha que lista os objetos fora da convenção `<uuid>/`. **Ela não classifica:** devolve `caminho`, `dono_uuid`, `created_at`, `bytes`, `dono_ainda_existe`, `caminho_atual_da_linha` e `enviado_em_da_linha`, e **quem lê decide**. Ela é o segundo par de olhos sobre a T-008 e a única rede quando o processo morre entre os passos 7 e 8
  - [ ] ⚠️ **O que esta rotina NÃO pode supor:** que a varredura diga qual objeto é órfão e qual é versão anterior de reenvio legítima. **Nada no banco de hoje distingue os dois** (nenhuma tabela guarda histórico de caminhos), e quem escrever esta rotina vai querer essa distinção para decidir o que apagar. **Distinguir com certeza exige tabela de histórico: é MIGRATION, é 🔴, e é OUTRO CARD** — não se resolve aqui nem na T-008. Sem ela, apagar é decisão humana caso a caso, com o Elber presente
  - [ ] **Rodar a varredura é 🟢** (`select`). **Apagar o que ela encontrar é 🔴** e só com o Elber presente
  - [ ] Decidir e registrar em `05-DECISOES.md` o que acontece com o documento de quem é excluído **enquanto ainda está na fila de validação**, e por quanto tempo o objeto sobrevive à conta (retenção). Hoje não há resposta escrita
- ⚠️ **21/09 — o pressuposto deste card MUDOU: o bucket deixou de estar vazio em 20/09.** A T-008 subiu e há documento de identidade real dentro de `documentos` (conta de teste, mas real: 64 hex de hash, 15683 bytes). O *"hoje o bucket está vazio"* de baixo **descreve um mundo que acabou** — fica registrado como a data em que este risco deixou de ser preventivo e virou retenção. A convenção `<uuid>/` **foi cumprida** pela T-008, que é o que torna a varredura possível. ✅ **21/09 — a SEC-083 foi corrigida pela T-021, e este card deixou de ter cópia própria da consulta.** Onde estava escrito que a varredura classifica *conta apagada · órfão do passo 8 · versão anterior de reenvio*, agora está escrito que ela **não classifica** e que o card da T-008 é o único lugar onde o SQL existe.
- **Não fazer:** não escrever cron. Não antecipar esta task para a F3 — ~~**hoje o bucket está vazio** e não há documento de gente real para ficar órfão~~ (verdade até 20/09) — o que a T-008 tinha que garantir era que a convenção de caminho continuasse sendo `<uuid>/`, **e garantiu**.
- **Resultado:** _(a preencher na F6)_

---

# ✅ CONCLUÍDAS

### T-021 — A varredura de órfãos para de classificar órfão real como "esperado" (SEC-083)
- **Estado:** ✅ **CONCLUÍDA em 21/09/2026**, commitada na `main` local em `53fa96c` (🟢 doc, **não empurrada**). **Só `docs/`**, nenhuma linha de código de produção tocada. ⚠️ **A varredura continua sem ter sido RODADA** — rodar é do Elber, é 🟢, e está na lista de medições da S4. **O que esta task entrega é uma consulta que não mente; a medição é outro gesto.** Nem o **R-042** nem o **R-023** fecham aqui
- **Fase / Semana:** F3 / S4
- **Capacidade:** **E1** — núcleo de dados: o que sobe para o Storage tem que ser rastreável
- **Nível:** 🟢 — **não é código.** São dois cards em `docs/03-TAREFAS.md` — e **três cópias** da mesma promessa errada, não duas: a terceira apareceu durante a execução
- **Agente dono:** vetria-escriba
- **Depende de:** nada
- **Por quê:** **SEC-083.** A coluna `classe` do `select` decide por comparação de tempo e só reconhece o órfão **mais novo** que o último envio bem-sucedido. O órfão **mais velho** — que é o caso normal de falha: envia A às 10:00, o processo morre entre o passo 7 e o 8, reenvia B às 10:05 e o 8 grava — cai no `else` e é rotulado **"VERSÃO ANTERIOR DE REENVIO (esperado)"**. **A única rede sob o buraco que o backend admitiu por escrito não pega o caso mais provável dele**, e a medição que *"fecha o assunto no dia"* fecha errado. Segundo defeito no mesmo `select`: `split_part(o.name,'/',1)::uuid` num `left join` — **um objeto com primeiro segmento que não seja uuid derruba a query inteira**
- **Feito quando:**
  - [x] O `select` do item 3 da seção 🔒 da **T-008** para de prometer classificação que o dado não sustenta: devolve `dono_uuid`, `created_at` e `enviado_em_da_linha` e **deixa o humano decidir**. É a saída (a) do relatório, e é **uma linha a menos**, não a mais
  - [x] O cast para `uuid` acontece **depois** do filtro de `bucket_id` e de um `~` de uuid, numa subconsulta
  - [x] **A mesma correção no card da T-018** (F6/S11), que copia a consulta. Duas cópias divergindo em silêncio é o defeito de origem do R-039
  - [x] Fica escrito, nos dois cards, que **criar histórico de caminhos é migration, é 🔴, e é outro card** — não se resolve aqui
- **Não fazer:** não escrever migration. Não escrever cron. Não rodar a varredura — rodar é do Elber e é 🟢; **apagar o que ela achar é 🔴**.
- **Resultado:**

  ## HANDOFF — vetria-escriba — T-021 — 21/09/2026

  **Fiz:** três lugares em `docs/03-TAREFAS.md`, e um deles ninguém tinha visto.

  **1. O `select` da T-008 (item 3 da seção 🔒) parou de classificar.** A coluna `classe`
  **saiu inteira** — eram 6 linhas de `case`, é a saída (a) da SEC-083, e é uma linha a menos.
  No lugar dela entraram três colunas de **fato**, não de juízo: `dono_ainda_existe`
  (`pf.id is not null`), `caminho_atual_da_linha` (`pp2.documento_path`) e `enviado_em_da_linha`
  (`pp2.documento_enviado_em`), junto com `caminho`, `dono_uuid`, `created_at` e `bytes`.
  **O que o `case` afirmava e o banco não sustenta:** que `o.created_at > documento_enviado_em`
  separa órfão de reenvio legítimo. Só separa o órfão **mais novo** que o último envio
  bem-sucedido. O órfão **mais velho** — sobe A às 10:00, o processo morre entre o 7 e o 8,
  sobe B às 10:05 e o 8 grava — caía no `else` e saía rotulado *"VERSAO ANTERIOR DE REENVIO
  (esperado)"*. **O caso normal de falha, e o único que a varredura existe para pegar, era
  justamente o que ela mandava ignorar.**

  **2. O cast saiu do `left join`.** `split_part(o.name,'/',1)::uuid` aparecia em **dois**
  `left join`, avaliado sem garantia de que o filtro de `bucket_id` viesse antes: um objeto com
  primeiro segmento que não fosse uuid derrubava a varredura inteira com
  `invalid input syntax for type uuid`. Agora ele está dentro de uma CTE
  **`with objetos as materialized`** cujo `where` filtra `bucket_id = 'documentos'` **e** um
  `~*` de uuid; `materialized` é barreira de otimização no Postgres 12+, então o cast só vê
  linha que passou pelos dois filtros. Os `join` passaram a usar `ob.dono_uuid`, já castado
  uma vez, em vez de repetir o `split_part` três vezes.

  **3. O filtro de uuid esconde algo, e agora tem uma consulta que o mostra.** Ao filtrar por
  `~*` de uuid, todo objeto **fora** da convenção `<uuid>/` desaparece da varredura — e uma
  varredura que existe para achar o que ninguém aponta não pode ter ponto cego por desenho.
  Entrou uma segunda consulta de **uma linha** (`!~*` do mesmo padrão), com a regra escrita:
  **zero linha nas duas é a medição; uma sem a outra não é.**

  **4. O card da T-018 deixou de ter cópia.** Ele não carregava o SQL, carregava a **descrição**
  dele — *"classificando conta apagada · órfão do passo 8 · versão anterior de reenvio"* —, que
  é a mesma promessa errada em prosa. Em vez de corrigir a cópia, **a cópia foi eliminada:** o
  card agora **aponta** para o item 3 da T-008 e diz que a consulta não classifica. É o que o
  **R-039** e o **R-017** ensinaram três vezes: **clone herda defeito, e corrigir os dois clones
  é só adiar a terceira divergência.** Um lugar, uma verdade.

  **5. ⚠️ HAVIA UMA TERCEIRA CÓPIA, e ela era a pior.** O **item 6 deste mesmo card da T-008**
  — o texto que a **`0004` tem que copiar palavra por palavra** para dentro de uma migration —
  dizia *"a consulta classifica, e quem varre não confunde as duas coisas"*. Ninguém tinha
  contado essa cópia: a SEC-083 aponta duas (T-008 e T-018), e o card da T-021 pedia duas.
  **Se a `0004` tivesse sido escrita antes desta task, a promessa errada teria virado comentário
  de migration aplicada em produção** — e migration aplicada é histórico, não se edita
  (é a regra que o item 6 gasta três linhas defendendo sobre a `0003`). Corrigida também.

  **6. Ficou escrito nos dois cards que a saída (b) é outro card.** Distinguir órfão de versão
  anterior **com certeza** exige tabela de histórico de caminhos: **é migration, é 🔴, e não se
  resolve nem aqui nem na T-018.** Na T-018 isso está como critério próprio, porque é lá que
  alguém vai querer a distinção para decidir o que apagar.

  **O que a consulta agora deixa EXPLICITAMENTE para o humano decidir:** duas leituras são
  mecânicas e ficaram escritas como tal — `dono_ainda_existe = false` é **conta apagada**
  (R-023) e `caminho_atual_da_linha is null` é **órfão do passo 8** (R-042), e as duas pedem
  ação. **A terceira não é:** com as duas colunas preenchidas, o objeto pode ser órfão do
  passo 8 **ou** versão anterior de reenvio legítima, e **as duas têm a mesma aparência no
  banco de hoje**. O card manda comparar `created_at` com `enviado_em_da_linha` **sabendo que
  mais velho não quer dizer esperado** e contar quantos objetos existem sob o mesmo
  `dono_uuid`. A consulta entrega **dado, não veredito**.

  **Não fiz:** não rodei a varredura (é do Elber, é 🟢, e está na lista de medições da S4).
  Não escrevi migration nem cron. Não toquei em `.ts`/`.tsx`. Não plantei card para a tabela de
  histórico: criar tabela é decisão do Elber, e a saída (a) foi escolhida para não precisar
  dela — fica escrito nos dois cards, não na fila.

  **Estado agora:** a consulta do card **não mente mais** e pode ser rodada. **O bucket
  continua exatamente como estava**: um documento real dentro, nenhum órfão conhecido, nenhum
  órfão descartado — porque **ninguém contou ainda**.

  **Descobri:** (1) a terceira cópia, no texto destinado à `0004`, que a SEC-083 não viu;
  (2) que a correção do cast **cria** um ponto cego (objeto fora da convenção some da lista) e
  que ele precisa da consulta complementar para não ficar silencioso; (3) que a T-018 não
  copiava SQL, copiava **prosa** — o que é pior, porque prosa não dá erro de sintaxe e ninguém
  a executa para descobrir que está errada.

  **Bloqueios:** nenhum para código. Para **fechar o assunto órfão**, falta um gesto de 30
  segundos do Elber: rodar as duas consultas no SQL Editor e colar o resultado no item 3.

  **Próximo passo óbvio:** a **T-024**, que é o item 3 do DoD da F3 e o único que falta. A
  varredura é do Elber e não disputa ordem com card nenhum.

  **Docs que atualizei:** `docs/03-TAREFAS.md` (cards T-008, T-018 e T-021), `docs/04-RISCOS.md`
  (R-042 e R-023), `docs/02-ESTADO.md`, `docs/05-DECISOES.md` (**DL-060**).

  **Commits:** `53fa96c` (os quatro docs). ⚠️ **Não empurrado para a `origin/main`:** push na `main` dispara deploy em produção e é gesto do Elber.


### T-007 — Onboarding do estabelecimento passa a persistir
- **Estado:** ✅ **CONCLUÍDA em 20/09/2026.** Mergeada na `main` pelo **PR #2** (`eb6e2d6`) e **provada em tela pelo Elber** com conta de estabelecimento real — o último critério que estava aberto neste card. As três travas caíram, e as três por medição: ver o **adendo de fechamento** no fim deste card.
  _(histórico do estado anterior, mantido:)_ 🟨 **IMPLEMENTADA em 09/09, REVISADA E APROVADA EM 15/09, AGUARDANDO APROVAÇÃO DO DIFF.** Não está concluída e não foi commitada: a task é 🟡, o Elber não estava na máquina, e tudo continua na árvore de trabalho. `npm run build`, `npm run lint` e `npx tsc --noEmit` verdes.
  ✅ **A revisão do `vetria-seguranca` CAIU em 15/09** (`docs/relatorios/SEC-2026-09-15-T007-revisao-do-clone.md`): **aprovado para merge, sem correção obrigatória** — **🔴 0 · 🟠 0 · 🟡 3**. Os três 🟡 são **SEC-071, SEC-072 e SEC-073** (viraram **R-050, R-051 e R-052**) e **nenhum dos três é conserto desta task**: um é texto de card, um é T-016 ou S4, e o terceiro é defesa em profundidade que se corrige junto com a gêmea do veterinário.
  ✅ **A condição pré-deploy R-048 também CAIU em 15/09, por medição.** A deleção da sonda **não está na árvore**: `supabase/verificar-apos-0003.sql` está intocado desde `a68251d`, com 945 linhas, e a sonda de `pg_trigger` sobre `perfil_privado` está nas linhas 672-685. Nada a reverter.
  ⛔ **Sobram TRÊS travas, e as três são do Elber:** (1) **aprovar o diff** dos 5 arquivos, (2) **medir o R-047** — a única condição pré-deploy que resta —, (3) a **prova de persistência** com conta de estabelecimento nova
- **Fase / Semana:** F3 / S2, **executando na S3** (dívida carregada; ver o cabeçalho da fila)
- **Capacidade:** E2
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** **nada que ainda esteja aberto.** ✅ **T-002** (as três colunas de identificação só existem em `perfil_privado` depois da `0003`, aplicada em 26/08) · ✅ **T-006**, e do handoff dela, não só do commit · ✅ **R-034 DEIXOU DE SER BLOQUEIO EM 09/09.** Este card dizia "a T-007 não começa antes do R-034", e isso **deixou de valer**: a revisão independente foi feita, leu `actions.ts` e `page.tsx` linha a linha **sem usar os comentários do código como guia** (era esse o ponto cego), reconferiu quatro achados contra o código e o schema, e concluiu que **não há defeito 🔴 nem 🟠 dentro desses dois arquivos**. Os cinco achados reconstruídos estão corretos e **as cinco correções valem a pena clonar**. SEC-053 e SEC-055 continuam não recuperados como história e ficam assim para sempre: o R-034 fechou **por cobertura, não por memória**. O que sobra não é bloqueio, é **condição de partida**, e está na seção abaixo.
- **Por quê:** mesmo buraco da T-006, no outro painel. Sem isso, metade dos profissionais que a Vetria vende não chega na fila de validação.
- **⚠️ Este card foi corrigido em 26/08.** Ele mandava gravar `razao_social`, `cnpj` e `responsavel_tecnico` em `clinic_profiles`. **Depois da `0003` esses três vivem em `perfil_privado`.** O impedimento acabou: a migration rodou no mesmo dia, e a Sonda 7A mediu em produção que `anon` selecionando `cnpj` de `clinic_profiles` recebe `42703: column "cnpj" does not exist`. **A coluna não existe mais**, então escrever pro schema antigo agora é que quebra.
- **🔒 CONDIÇÃO DE PARTIDA — as quatro linhas da tabela "herda ou não"**, da revisão independente de 09/09 (`docs/relatorios/SEC-2026-09-09-T006-revisao-independente.md`). **Entra antes da primeira linha de código, e é a condição do parecer.** A T-007 é clone, e clone herda defeito com a mesma facilidade com que herda correção — foi assim que o R-017 nasceu duplicado.

  | Achado / risco | O que a T-007 herda ao clonar | O que ela faz a respeito |
  |---|---|---|
  | **SEC-060 / R-039** | **SIM, e pior.** `clinic_profiles` tem a policy gêmea (`0002:546-553`, WITH CHECK pinando só `slug`), nenhum CHECK de conteúdo, e uma coluna que `vet_profiles` não tem: **`site`** | **(a) `site` não é gravado sem validar esquema `http(s)`.** A `0003:1301` declara a coluna *"PÚBLICA por decisão. É vitrine"*, ela é **URL escrita pelo dono** e **vira link numa página pública na F4/S7**. Hoje `javascript:` passa. ⚠️ **Divergência conferida no código hoje, 09/09:** o `ClinicOnboardingForm.tsx` **não tem campo `site`** — os 11 campos são nome fantasia, razão social, CNPJ, responsável, endereço, CEP, cidade, estado, sobre, serviços e WhatsApp — embora o "Feito quando" deste card liste `site` entre as colunas a gravar. **Então: ou a T-007 tira `site` do payload e a coluna fica nula, ou, se acrescentar o campo, a validação de esquema é obrigatória no servidor. As duas saídas servem; escolher em silêncio, não.** Isto **não** substitui a T-017: o dono continua alcançando a coluna por PATCH direto |
  | **SEC-061 / R-040** | **SIM se clonar o `page.tsx` do estabelecimento; NÃO se clonar o do veterinário** | **(b) guard por `profiles.status`, e a Server Action confere `role` no servidor antes de escrever.** ⚠️ A Server Action **inline** de `app/app/estabelecimento/onboarding/page.tsx:33-59` **confere sessão e NÃO confere role** — reconferido no código em 09/09 — e escreve `onboarding_completed` para qualquer logado que alcance o id da action. **Ela é para APAGAR, não para clonar.** O padrão certo é `actions.ts:110` (role antes de qualquer escrita) mais o guard por status de `veterinario/onboarding/page.tsx:42-79` |
  | **SEC-062 / R-041** | **SIM**, mesmas colunas de `perfil_privado`, e no estabelecimento com mais formatos plausíveis: fixo com DDD, 0800, ramal | **(c) normalizar `whatsapp` para dígitos na escrita**, no servidor, e recusar o que não tem cara de telefone brasileiro. Pelo **DL-047** é esse valor que o servidor devolve no evento de contato e que conta como lead entregue. Verificação de posse por SMS é outra conversa e está fora dos 3 meses |
  | **SEC-064 / R-043** | **SIM, e muda de natureza:** o formulário coleta `responsavel_tecnico`, que a `0003:1290` descreve como *"PESSOA FÍSICA, que pode nem ser a titular da conta e nunca consentiu em virar dado público"* | **(d) uma frase na tela em que o titular declara ter autorização do responsável técnico.** **A T-007 é o primeiro ponto do produto em que a Vetria coleta dado pessoal de um terceiro que não está na tela.** Custa um parágrafo agora e custa um incidente depois. É **uma frase**, não a rotina de consentimento versionado — essa é F6/S11 e não se constrói aqui |

  **Do mesmo relatório, fora da tabela:** **SEC-059 / R-038** a T-007 herda integralmente, e **não é dela**: é a **T-016**. **Não invente o portão de status dentro da T-007** — o parecer é explícito nisso. E **SEC-063 / R-042** (três escritas sem transação) na T-007 é baixo e autocorrigível; onde vira documento órfão é na **T-008**.

- **Feito quando:**
  - [x] Server Action grava em `clinic_profiles` **só o que é público**: `nome_fantasia`, `endereco`, `cep`, `cidade`, `estado`, `sobre`, `servicos`. ~~`site`~~ **fica FORA do payload, por decisão registrada no Resultado** (não há campo em tela e a coluna vira link público na F4/S7 sem validação de esquema)
  - [x] **`razao_social`, `cnpj` e `responsavel_tecnico` vão pra `perfil_privado`**, na linha do próprio `auth.uid()` (`0003`, SEC-020 / R-018). Nunca em tabela de leitura pública
  - [x] **Nada de CNPJ no `signUp`.** Feito, e o campo saiu da tela junto: coletar identificador só pra descartar seria pior que não coletar. Tirar o campo `cnpj` do `data` em `app/cadastro/estabelecimento/page.tsx:47`: hoje ele fica pra sempre em `auth.users.raw_user_meta_data` e viaja no JWT, fora do alcance da rotina de exportação e exclusão da F6 (SEC-042 / R-024). Os funis de veterinário e de responsável não mandam identificador nenhum, e este é o único outlier
  - [x] WhatsApp em `perfil_privado`, mesma regra da T-006, **e normalizado para dígitos na escrita** (R-041)
  - [x] Conclusão pela mesma RPC `concluir_onboarding_profissional()`
  - [x] **Prova de persistência igual à da T-006, com conta de estabelecimento nova.** ✅ **FEITA PELO ELBER EM 20/09**, e ela achou o que três revisões não tinham achado — ver o adendo de fechamento
  - [x] Mesmo tratamento de erro e mesma releitura de `status`
  - [x] **Clona o `page.tsx` do VETERINÁRIO**, não o do estabelecimento, e **apaga** a Server Action inline atual (`estabelecimento/onboarding/page.tsx:33-59`) em vez de preservá-la. É condição do parecer, não preferência de estilo
  - [x] **Copia o TIPO do parâmetro de `mensagemDoBanco`** (`app/app/veterinario/onboarding/actions.ts:66-69`), não só o comportamento: o tipo **não aceita `details`**, o que transforma "não logar dado do banco" em **erro de compilação** em vez de disciplina. **Na T-007 o `details` do Postgres carrega CNPJ e razão social.** O relatório chama isso de melhor detalhe do arquivo clonado, e não é exagero
- **Não fazer:** horários não entram (não existe campo no formulário nem coluna na tabela, ver R-019). Não exibir CNPJ, razão social ou nome do responsável técnico em nada público: os três são privados por decisão registrada (DL-053) e não estão mais em tabela de leitura pública. Não construir perfil público (F4/S7).
- **🚢 ORDEM DE DEPLOY DECIDIDA EM 16/09 — esta task NÃO sobe sozinha.** Ela sobe **junto com a
  T-016, no mesmo push** (DL-057, bloco *A ordem de deploy* no cabeçalho desta fila). Com o
  `/app` da T-016 roteando por `profiles.status`, a conta órfã do **R-047** é mandada para o
  onboarding **novo** desta task, o guard aceita `incomplete`, ela conclui e entra na fila —
  e o **`update` 🔴 do R-047 deixa de ser necessário**. ⛔ **Trava com data: se em 18/09 a T-016
  não estiver com revisão fechada, esta task sobe sozinha e o `update` 🔴 volta para a mesa.**
  🚫 **A combinação proibida é a T-016 sozinha antes desta:** vira laço de redirect contra a
  Server Action inline que este diff apaga. **A medição do R-047 continua valendo de qualquer
  jeito** — ela diz quantas contas são, e ninguém contou.
- **⚠️ ANTES DO DEPLOY — eram duas medições, sobrou UMA. Nenhuma é conserto de código:**
  1. **R-047 / SEC-068 — conte as contas órfãs.** `select count(*) from profiles where role='clinic' and onboarding_completed and status='incomplete';` A Action inline que este diff apaga escrevia `onboarding_completed = true` sem mover o `status`; depois do merge, `/app` lê `onboarding_completed`, manda essa conta pro painel, e **nada nunca a leva ao onboarding novo nem à fila de validação**. **Zero** → fecha com a medição escrita. **Mais que zero** → é `update` de linha, **🔴, sessão presencial**. É o objetivo declarado desta task falhando **sem erro, sem log e sem sintoma**: só se descobre contando.
  2. ✅ **R-048 / SEC-069 — CAIU EM 15/09, POR MEDIÇÃO.** A deleção de `supabase/verificar-apos-0003.sql:678-684` **não está na árvore**: o arquivo está **intocado desde `a68251d`**, tem **945 linhas**, e a sonda de `pg_trigger` sobre `perfil_privado` está nas **linhas 672-685**, com os quatro triggers esperados no comentário logo acima. O `git status` de 15/09 lista só os **5 arquivos desta task** e **nenhum arquivo em `supabase/`**. **Nada a reverter, nada a justificar.** O risco está em ✅ FECHADOS do `04-RISCOS.md`
- **Resultado:**

  ## HANDOFF — vetria-backend — T-007 — 09/09/2026

  ⚠️ **IMPLEMENTADA, NÃO CONCLUÍDA.** Nada foi commitado e nada foi enviado. A task é 🟡, o Elber
  não estava na máquina, e o diff inteiro está na árvore de trabalho esperando aprovação. Nenhuma
  migration foi escrita e nenhuma policy foi tocada.

  **Fiz:**
  - `app/app/estabelecimento/onboarding/actions.ts` (**novo**) — `salvarOnboardingClinic`. Confere
    sessão, **confere `role === 'clinic'` antes de qualquer escrita** (`actions.ts:214`), aplica a
    lista de permitidos de status (SEC-052/054), valida e normaliza o payload, grava o público em
    `clinic_profiles` por `upsert` com `.select().single()` (DL-011), grava
    `whatsapp` + `razao_social` + `cnpj` + `responsavel_tecnico` em `perfil_privado`, chama
    `concluir_onboarding_profissional()` só se ainda estiver `incomplete` (com a releitura da
    SEC-057) e **relê `profiles.status`** antes de escolher o destino. `mensagemDoBanco` veio com
    **o tipo do parâmetro**, que não aceita `details`: CNPJ e razão social não chegam ao log da
    Vercel por barreira de compilação, não por disciplina (SEC-056).
  - `app/app/estabelecimento/onboarding/campos.ts` (**novo**) — listas, limites e tipos
    compartilhados entre form e Action. Payload **separado** do payload do veterinário, de
    propósito (SEC-044).
  - `app/app/estabelecimento/onboarding/page.tsx` (**reescrito, clone do veterinário**) — guard por
    `profiles.status` com lista de permitidos, **a Server Action inline das linhas 33-59 foi
    APAGADA** (ela conferia sessão e não conferia role, e escrevia `onboarding_completed` com a
    sessão do usuário), e o formulário passou a abrir preenchido com o que está no banco.
  - `app/app/estabelecimento/onboarding/ClinicOnboardingForm.tsx` (**reescrito**) — mesma casca
    visual, agora com estado inicial vindo do banco, modo "revisao", erro do servidor em tela e a
    **declaração de autorização do responsável técnico** (R-043).
  - `app/cadastro/estabelecimento/page.tsx` — **`cnpj` saiu do `signUp`** (R-024 / SEC-042) e o
    campo saiu da tela junto.

  **Decisão registrada — `site`: fica FORA.** A Action não grava a coluna e o formulário não ganhou
  campo. Motivo: `clinic_profiles.site` é pública por decisão e vira link em página pública na
  F4/S7; hoje `javascript:` e `data:` passariam, e o dono ainda alcança a coluna por PATCH direto
  (isso é T-017, migration). Criar o campo agora seria criar a superfície antes de existir a
  defesa. Está escrito em `campos.ts:22-27`: quem acrescentar o campo depois **valida esquema
  `http(s)` no servidor antes de gravar**.

  **Duas decisões menores que também não foram tomadas em silêncio:**
  1. **CNPJ aceita letra nas 12 primeiras posições.** O CNPJ alfanumérico entrou em vigor em 2026
     ("12 alfanuméricos + 2 dígitos verificadores"). Exigir 14 dígitos recusaria estabelecimento
     novo e legítimo. Não confere dígito verificador: quem valida é uma pessoa, na fila da S4.
  2. **O WhatsApp fica gravado como dígitos, DDD + número, SEM o `55`.** Quem montar o `wa.me` da
     F4 acrescenta o código do país. Está escrito no comentário da função.

  **Não fiz:** a **prova de persistência** (único critério aberto, é manual). Não construí o portão
  de status do painel (R-038, é a **T-016**), não escrevi migration nem toquei em policy (R-039 é a
  **T-017**), não mexi em `middleware.ts`, não construí perfil público, não toquei em horários,
  não escrevi `site`, `slug`, `status` nem `onboarding_completed`, e não toquei no onboarding do
  veterinário.

  **Estado agora:** o onboarding do estabelecimento **deixou de ser casca na árvore de trabalho**.
  Produção continua rodando o código antigo, que descarta os 11 campos e marca
  `onboarding_completed`. `npm run build` e `npm run lint` verdes.

  **Descobri:**
  1. **O `/app` continua roteando por `onboarding_completed`** (`app/app/page.tsx:20`), e não por
     `profiles.status`. É o R-040, e a correção (rotear por `status`) é de uma linha. **Não foi
     feita aqui de propósito:** o parecer manda a T-007 não improvisar portão.

     ⚠️ **CORRIGIDO EM 15/09 — o que estava escrito aqui era FALSO (SEC-071 / R-050).** A frase
     antiga dizia que um `clinic` que concluiu e digita `/app` *"volta pro onboarding em modo
     revisao em vez de ir pra `/aguardando`"*. **Não volta, e isso foi conferido no SQL:**
     `concluir_onboarding_profissional()` escreve `status = 'pending_validation'` **e**
     `onboarding_completed = true` no **mesmo `update`**
     (`supabase/migrations/0002_nucleo.sql:753-755`), e `app/app/page.tsx:20` só manda pro
     onboarding quem tem `onboarding_completed` **falso**. **O destino real é
     `/app/estabelecimento`, o painel** — que não lê `profiles.status` (R-038) e renderiza para
     quem acabou de entrar na fila de validação.

     **Isto não é sintoma cosmético: é exatamente a lacuna que a T-016 fecha.** Quem dimensionasse
     a T-016 pela frase antiga ("volta pro formulário") dimensionaria errado o que ela precisa
     cobrir. Nada vaza hoje, porque as páginas do painel são casca — o custo é de registro, e é o
     mecanismo do **R-034** outra vez.
  2. **O mesmo vale pro CTA do painel** (`(painel)/page.tsx:54`): vai continuar dizendo "Completar
     cadastro" para quem já está na fila. Cosmético e idêntico ao do veterinário.
  3. **A guarda da SEC-044 agora tem um caminho feliz exercitado:** esta é a primeira escrita do
     produto que grava `cnpj` em `perfil_privado`, e ela depende do `role = clinic` da linha.

  **Bloqueios:**
  1. **Aprovação do diff pelo Elber** (🟡, 5 arquivos).
  2. ✅ **CAIU EM 15/09 — a revisão do `vetria-seguranca` saiu e APROVOU.**
     `docs/relatorios/SEC-2026-09-15-T007-revisao-do-clone.md`: *"O diff da T-007 pode ser mergeado
     como está"*, **🔴 0 · 🟠 0 · 🟡 3**. Segunda leitura independente do mesmo diff, reconferida
     contra `0002` e `0003` em vez de contra o relatório de 09/09: as **5 correções da T-006** e as
     **7 garantias estruturais** do original foram herdadas, a Server Action inline foi **apagada**
     (uma única `"use server"` em todo `app/app/estabelecimento/`), e `redirect()` está fora de
     `try/catch` (não há um `try` no arquivo). Os três 🟡 viraram **R-050 a R-052** e nenhum é
     conserto desta task. _(O motivo original do bloqueio continua válido como regra: é código de
     autorização, e o R-017 já nasceu duplicado uma vez por clone.)_
  3. **A prova de persistência precisa de conta de estabelecimento nova** e do caminho que a T-006
     documentou: **confirmar o email em produção e depois LOGAR na preview**, porque o link de
     confirmação sempre aponta pro Site URL. `concluir_onboarding_profissional()` só sai de
     `incomplete` uma vez.

  **Próximo passo óbvio:** aprovar o diff, `vetria-seguranca` revisar, e então a prova de
  persistência na preview, com estes `select`:
  `select status, onboarding_completed from profiles where id = '<uuid>';` (esperado:
  `pending_validation` e `onboarding_completed` **ainda false**) ·
  `select nome_fantasia, endereco, cep, cidade, estado, sobre, servicos, site, slug from clinic_profiles where id = '<uuid>';`
  (esperado: preenchido, `site` e `slug` **nulos**) ·
  `select whatsapp, razao_social, cnpj, responsavel_tecnico from perfil_privado where id = '<uuid>';`
  (esperado: preenchido, `whatsapp` e `cnpj` **só com dígitos/alfanuméricos, sem pontuação**) ·
  `select raw_user_meta_data from auth.users where id = '<uuid>';` (esperado: **sem `cnpj`**) ·
  e `select count(*) from clinic_profiles;` como anon, pra confirmar que `cnpj` não existe mais lá.

  **Docs que atualizei:** `03-TAREFAS.md` (este card).

  **Commits:** **nenhum, de propósito.** Tudo na árvore de trabalho.

- **✅ ADENDO DE FECHAMENTO — 20/09/2026, `vetria-maestro`.** O Resultado acima **não foi
  alterado**: handoff não se reescreve. Isto é o que aconteceu depois dele.

  **As três travas do Elber caíram, e nenhuma caiu por opinião:**
  1. **Diff aprovado e mergeado.** PR #2 na `main`, `eb6e2d6`, junto com a T-016, exatamente como
     o **DL-057** mandava. A combinação proibida (T-016 sozinha antes desta) **não aconteceu**.
  2. **R-047 medido: ZERO contas `clinic` órfãs.** O `update` 🔴 que ele exigiria **nunca precisou
     existir**. O risco fecha com a medição escrita — ver ✅ FECHADOS em `04-RISCOS.md`.
  3. **Persistência provada em conta de estabelecimento real.** O `select` devolveu
     `whatsapp = 62992653278`, **só dígitos**, que é a normalização desta Action funcionando.
     **O item 1 do DoD da F3 passou a valer para as duas personas.**

  ⚠️ **E a prova achou um defeito que TRÊS auditorias de segurança não acharam.** O mesmo `select`
  devolveu **`62 992653278`, com espaço**, para o **veterinário**. A T-007 escreveu a normalização
  do R-041 **só no arquivo dela**, e as três revisões leram o código do **estabelecimento** — o
  arquivo novo, o que estava sendo revisado. **O gêmeo velho não foi lido por ninguém.**
  Consertado em `08dd42b`: a função saiu dos dois arquivos e virou `lib/contato/whatsapp.ts`,
  uma fonte só.

  **É o R-017 pela terceira vez neste projeto: clone herda defeito.** E é a segunda vez que o
  padrão aparece com este agravante: **revisar o clone não é revisar o par.** Quem revisar o
  próximo clone lê **os dois arquivos**, ou não revisou nada.

  ⚠️ **O dado velho sobreviveu ao conserto.** A normalização vale na **escrita**, então a linha já
  gravada continuou suja até o Elber salvar o perfil dele à mão. **O teste do `vetria-qa` cobrou
  exatamente isso e segurou o merge.** Virou o card **T-026** e o risco **R-055**.

  **Commits:** `3db99bf` (a task), `08dd42b` (o R-041 do lado do vet), na `main` por `eb6e2d6`.

### T-008 — Upload do documento de validação
- **Estado:** ✅ **CONCLUÍDA em 20/09/2026.** Mergeada na `main` pelo **PR #2** (`eb6e2d6`, commit `a69e63e`), auditada (`SEC-2026-09-16-T008`, 🔴 0 · 🟠 1 · 🟡 9) e **provada em tela ponta a ponta pelo Elber numa conta `vet` real**. **O bucket `documentos` deixou de estar vazio pela primeira vez desde 26/08.** Ver o **adendo de fechamento** no fim deste card. _(estado anterior, mantido:)_ 🔵 escrita na árvore em 16/09; esperava, nesta ordem: **(1)** o diff aprovado pelo Elber (é 🟡), **(2)** a auditoria do `vetria-seguranca`, **(3)** a prova em tela com conta logada, que nenhum agente faz sozinho. Ver Resultado _(desbloqueada em 26/08: o bucket `documentos` existe em produção)_ · ✅ **09/09 — a pergunta em aberto do R-042 (SEC-063) FOI FECHADA**, pelo `vetria-maestro`, na seção **A ORDEM, A COMPENSAÇÃO E A VARREDURA** logo abaixo. **Nenhuma linha de código foi escrita:** isto é contrato, e existe para que quem pegar a task não decida isso às onze da noite, sozinho, dentro de um `try/catch`
- **Fase / Semana:** F3 / S2, **executando na S3** (dívida carregada; ver o cabeçalho da fila)
- **Capacidade:** E1
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** **T-002 ✅** (o bucket existe desde 26/08, privado, 10 MiB, quatro MIME, **vazio**) e T-006
- **Por quê:** o passo 4 do onboarding pede o documento do CRMV e hoje só mostra um aviso. Sem documento no Storage, o admin da S4 não tem o que abrir e o item 3 do DoD da F3 não fecha.
- **Feito quando:**
  - [ ] Upload passa **pelo servidor**, não do navegador direto pro bucket
  - [ ] Nome do arquivo **gerado pelo servidor**, no formato que o CHECK exige (ver T-002). Nome escolhido pelo usuário não chega ao caminho
  - [ ] Validação de MIME por whitelist (`pdf`, `jpg`, `jpeg`, `png`, `webp`) **e** de tamanho, no servidor. **SVG e HTML barrados** (R-004: o admin abre esse arquivo dentro do painel de maior privilégio do sistema)
  - [ ] `perfil_privado.documento_path` escrito pelo dono; `documento_enviado_em` carimbado pelo trigger, **nunca pelo cliente**
  - [ ] Nenhuma URL pública em lugar nenhum: só URL assinada, e só para o dono e o admin
  - [ ] Falha de upload **impede** a conclusão. O profissional não pode sair achando que enviou o documento quando não enviou
  - [ ] **A rota implementa a ordem, a compensação e as mensagens da seção 🔒 abaixo**, e **nenhuma resposta de sucesso sai sem a linha gravada**
- **Herdado da auditoria da `0003` (26/08). Leia antes de começar:**
  - ✅ **SEC-036 decidida em 26/08 (T-012): o upload passa por Route Handler nosso.** Nada de `createSignedUploadUrl`, nenhum token de escrita no cliente. O critério de MIME acima passa a ser entregável, e ele é por **assinatura mágica dos primeiros bytes**, nunca pelo `content-type` declarado nem pela extensão do nome: `%PDF-` / `FF D8 FF` / `89 50 4E 47 0D 0A 1A 0A` / `RIFF`…`WEBP`. A extensão do caminho é derivada do tipo detectado. O contrato completo, oito passos, está na seção 2.b da `0003`: leia antes de escrever a rota.
  - [ ] **A rota grava `documento_path`, `documento_hash` (sha256 hex dos bytes que ela mesma escreveu) e `documento_tamanho` num único UPDATE** (SEC-033 / T-009). O CHECK `perfil_privado_documento_completo` recusa dois de três, e é de propósito: documento sem identidade dos bytes não é estado válido.
  - [ ] **A rota nunca reemite URL de upload pra caminho que já existe** (SEC-033 / T-009). Trocar os bytes sem trocar a string deixa um perfil aprovado exibindo documento que ninguém conferiu
  - [ ] ⚠️ **O passo 8 grava a linha com a SESSÃO DO USUÁRIO, não com `service_role`** (SEC-051 / R-031, 2ª auditoria de 26/08). ✅ **DECIDIDO PELO ELBER EM 31/08 — DL-055. Deixou de ser recomendação e virou critério.** Duas consequências que entram nesta task junto: **(1)** a linha passa a ser escrita **sob RLS**, então a rota tem que **falhar ruidosamente** se a policy do dono não alcançar — nunca cair para `service_role` como plano B; **(2)** ⚠️ **esbarra no R-029**: a guarda `recusar_dado_de_estabelecimento_em_pessoa_fisica` levanta em **todo** UPDATE da linha de quem trocou de `clinic` para `vet` sem limpar as três colunas, **inclusive neste passo 8, que nem toca nelas** — o caminho legítimo do upload quebra para essa conta e a mensagem não diz como sair. **A correção do R-029 entra aqui, no escopo fechado do item 4 da seção 🔒.** ⚠️ **O R-031 não fecha com a decisão:** ele só fecha quando o texto do passo 8, dentro de um arquivo de migration, disser isto, porque é esse arquivo que a `0004` vai copiar. **O texto exato que a `0004` tem que carregar está no item 6 da seção 🔒.** Com `service_role`, `auth.uid()` é nulo e o `insert into audit_logs` do trigger de revalidação grava **`actor_id = null`**: a trilha diz que o perfil voltou pra fila e não diz quem mexeu. **O desenho antigo, de URL assinada, gravava com a sessão do usuário e o `actor_id` saía certo — a arquitetura nova apagou um dado da trilha sem ninguém decidir isso.** Com a sessão, o `actor_id` sai certo e a policy `perfil_privado_update_own` vira segunda porta de graça. **Só o passo 7 (o bucket) precisa de `service_role`.** ⚠️ Não confundir com a gravação de `documento_visualizado` do item abaixo: **aquela** sai por `service_role`, porque `authenticated` não tem INSERT em `audit_logs`
  - [ ] **Registrar em `audit_logs` (`acao = 'documento_visualizado'`, `alvo_id` = dono do documento) antes de devolver a URL assinada** (SEC-040). ⚠️ Grave com `service_role`: a `0002` revogou INSERT em `audit_logs` de `authenticated` (seção 11b), então gravar com a sessão do admin devolve `permission denied` e a trilha some junto com o erro. Os quatro passos da seção 2.b da `0003` são sessão, autorização, URL curta e nunca aceitar caminho do cliente. Falta o quinto: a leitura do documento de identidade de terceiro é o acesso mais sensível do sistema e é o único fora da trilha automática
  - [x] **Anotado no card da exclusão de dados da F6** que apagar conta tem que apagar o objeto do bucket (SEC-039 / R-023). ✅ **09/09: esse card passou a existir — é a T-018**, na seção *PLANTADAS PARA FASES FUTURAS*, e leva dentro dele o R-023 e a varredura do item 3 da seção 🔒. O `on delete cascade` derruba a linha e deixa o arquivo órfão, pra sempre. A convenção de caminho `<uuid>/` que esta task fixa é o que torna a varredura possível depois
  - [x] ⚠️ **NOVO em 09/09 (R-042 / SEC-063): este card tem que dizer, POR ESCRITO, em que ordem os passos 7 e 8 rodam e quem apaga o objeto quando o 8 falha.** ✅ **Diz, na seção 🔒 abaixo.** O problema, para quem chegar depois: a Action da T-006 já faz **três escritas sem transação e sem compensação**; lá o efeito é baixo e autocorrigível, **aqui não é**: o passo 7 escreve no bucket com `service_role` e o passo 8 grava a linha com a sessão do usuário (DL-055) — **dois sistemas diferentes, sem transação entre eles**. Passo 7 grava e passo 8 é recusado (CHECK all-or-nothing, guarda da SEC-044/R-029, `documento_hash` malformado, qualquer coisa) e sobra **documento de identidade órfão no bucket**. É o **R-023** inteiro nascendo na criação em vez de na exclusão, e nasce sozinho na primeira falha de rede

- **🔒 A ORDEM, A COMPENSAÇÃO E A VARREDURA — decisão fechada em 09/09/2026 (R-042 / SEC-063).**
  **Isto é contrato desta task.** Quem executar não reabre a discussão dentro do código; se discordar, para, escreve por quê e chama o Elber (regra 8 do `AGENTES.md`).

  **1. A ordem é 7 → 8: o objeto vai para o bucket ANTES da linha ir para o banco.**

  **A saída recusada, e por que — gravar a linha primeiro (8 → 7).** Antes, uma correção do enunciado, porque ela muda a conversa: **o CHECK all-or-nothing NÃO é o que impede a ordem invertida.** O caminho é montado no **passo 6**, antes do upload, e a rota tem os bytes na mão desde o passo 3 — então `documento_path`, `documento_hash` e `documento_tamanho` são **os três conhecidos** antes de o objeto existir, e o UPDATE único passaria no CHECK sem truque nenhum. O que recusa a ordem invertida é outra coisa, e é pior: **a linha gravada não é registro passivo, é gatilho.** Escrever as três colunas carimba `documento_enviado_em` (trigger `trg_perfil_privado_carimbo`) e, pela seção 6 da `0003`, **dispara a revalidação**: o `status` se move, o profissional entra na fila do admin, e o trigger escreve uma linha em `audit_logs`. Se o upload falhar depois disso, o estado é **um profissional na fila de validação com um documento que não existe**, mais uma linha de trilha que ninguém desfaz, mais um carimbo posto por trigger que a sessão do usuário não controla. A compensação da ordem invertida seria "zerar as três colunas" — o CHECK aceita as três nulas —, mas **a trilha e o carimbo ficam**, e o admin já viu a fila. E ela quebra de frente o critério que este card tem desde 26/08: *"o profissional não pode sair achando que enviou o documento quando não enviou"*. **Linha sem objeto é uma mentira, e a mentira aponta para o lado de "validado" — que é exatamente o que a Vetria vende.**

  **O custo da escolhida, dito sem maquiagem:** o órfão passa a ser possível. Um documento de identidade pode ficar no bucket sem linha que o aponte. **Ele é inerte** — o bucket tem zero policy, `anon` e `authenticated` não o alcançam, nem o dono; só `service_role` — **e não é anônimo:** o primeiro segmento do caminho é o uuid do dono, por decisão da T-002, então dá para saber de quem é e apagar. É custo de **retenção indevida** (LGPD), não de vazamento. O custo da recusada seria de **integridade da fila de validação**, que é o produto. Entre guardar um arquivo a mais que ninguém alcança e pôr na fila um profissional cujo documento não existe, esta task escolhe o arquivo a mais.

  **2. Quem apaga o objeto quando o passo 8 falha: a própria rota, no mesmo pedido.**
  - **Onde:** `app/api/documentos/upload/route.ts` — a rota de escrita desta task; a de leitura fica na mesma pasta. Função local `compensarObjetoOrfao(caminho)`, **no arquivo da rota, não em `lib/`**: ninguém mais usa isso, e pôr em `lib/` é convidar a próxima rota a chamar sem entender.
  - **O quê:** qualquer erro no passo 8 — recusa de policy, CHECK, guarda da SEC-044/R-029, hash malformado, timeout — leva a rota a chamar `storage.from('documentos').remove([caminho])` **com o mesmo cliente `service_role` do passo 7**, e só então responder erro. **Nunca responde sucesso.** A mensagem ao profissional diz que o envio não foi concluído e que ele pode tentar de novo, **e o `documento_path` dele continua exatamente como estava** (nulo, ou apontando para o documento anterior, que segue válido).
  - **Quando a própria compensação falhar** — e ela pode: o Storage pode estar fora no mesmo minuto em que o Postgres recusou —, **a rota não engole.** Registra no log do servidor a marca fixa `DOCUMENTO_ORFAO` com o **caminho** e o **código do erro do passo 8**, e responde ao usuário o mesmo erro de sempre. **Nada de bytes, nada do nome de arquivo que veio do navegador, e nada de `details` do Postgres** (é o tipo de `mensagemDoBanco` da T-006/T-007, e aqui esse campo carrega dado de documento).
  - ⚠️ **A compensação NÃO fecha o buraco, e este card não vai fingir que fecha.** Ela cobre "o passo 8 devolveu erro". Ela **não cobre** o processo morrer entre o 7 e o 8: função encerrada, deploy no meio, rede caindo depois do upload e antes do UPDATE. Aí ninguém apaga nada e **ninguém fica sabendo**. É por isso que o item 3 existe e **não é opcional**: sem varredura, a compensação é promessa que só vale enquanto o servidor está vivo o bastante para cumpri-la.
  - ⚠️ **O multiplicador do R-029:** para a conta travada pela guarda, **toda** tentativa de reenvio gera caminho novo (epoch em ms) e falha nova. Sem compensação, essa conta sozinha produz um órfão por clique.
  - **Não é o admin.** Não existe tela de Storage para o admin nos 3 meses, o bucket é privado, e mandar um humano caçar objeto no painel é como se perde documento de identidade de gente real.
  - **Não é cron.** Não há infraestrutura de job agendado neste projeto, e criar uma não está no `00-ESCOPO.md` §2. A varredura é **procedimento**, com dono e data, no item 3.

  **3. Como um órfão é detectado depois de nascer: DOIS `select` no SQL Editor — e eles só são possíveis porque a T-002 fixou o caminho `<uuid>/`.**
  `storage.objects` é tabela, e `perfil_privado.documento_path` guarda exatamente o `name` do objeto (é o que o CHECK `perfil_privado_documento_do_dono` amarra). Então a varredura é um `left join`:

  ⚠️ **Esta consulta vive AQUI e em lugar nenhum mais.** Nenhum outro card a copia: o card da
  **T-018** aponta para este item em vez de repetir o SQL, porque duas cópias divergindo em
  silêncio é o defeito de origem do **R-039**, e o **R-017** já apareceu três vezes neste projeto
  por isso. **Corrigida em 21/09 pela T-021 (SEC-083).**

  ```sql
  -- VARREDURA DE ÓRFÃOS do bucket `documentos`. Só leitura. SQL Editor, produção.
  -- NÃO CLASSIFICA, de propósito (SEC-083 / T-021): devolve o que o dado sustenta
  -- e quem lê decide. O cast para uuid roda DEPOIS do filtro, dentro da CTE.
  with objetos as materialized (
    select o.name                           as caminho,
           split_part(o.name, '/', 1)::uuid as dono_uuid,
           o.created_at,
           (o.metadata->>'size')::bigint    as bytes
      from storage.objects o
     where o.bucket_id = 'documentos'
       and split_part(o.name, '/', 1)
           ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  )
  select ob.caminho,
         ob.dono_uuid,
         ob.created_at,
         ob.bytes,
         (pf.id is not null)      as dono_ainda_existe,
         pp2.documento_path       as caminho_atual_da_linha,
         pp2.documento_enviado_em as enviado_em_da_linha
    from objetos ob
    left join public.perfil_privado pp  on pp.documento_path = ob.caminho
    left join public.profiles       pf  on pf.id  = ob.dono_uuid
    left join public.perfil_privado pp2 on pp2.id = ob.dono_uuid
   where pp.id is null
   order by ob.dono_uuid, ob.created_at;
  ```

  **E o complemento, que é uma linha e mede o que a consulta acima esconde:** o filtro de uuid
  deixa de fora todo objeto cujo primeiro segmento não seja uuid, e objeto fora da convenção
  é **invisível** para a varredura. **Tem que dar zero.**

  ```sql
  -- O QUE A VARREDURA NÃO VÊ. Zero linha = convenção `<uuid>/` respeitada por todos.
  select o.name, o.created_at
    from storage.objects o
   where o.bucket_id = 'documentos'
     and split_part(o.name, '/', 1)
         !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  ```

  - **Zero linha nas duas = zero órfão, e as duas juntas são a medição.** Uma sem a outra não é: a primeira lista o que nenhuma linha aponta, a segunda lista o que a primeira nem enxerga.
  - ⚠️ **Por que NÃO existe coluna `classe`, e é isto que a T-021 corrigiu:** a `0003` §3 decidiu, por escrito, que **o caminho antigo NÃO é apagado no reenvio** (o admin pode precisar comparar o que aprovou com o que chegou depois). Logo **todo reenvio legítimo aparece nesta varredura** — e **nada no banco distingue "versão anterior de reenvio" de "órfão do passo 8"**, porque nenhuma tabela guarda histórico de caminhos. Tempo é tudo que há, e tempo não basta. A versão anterior desta consulta classificava por tempo e **errava exatamente o caso mais provável**: 10:00 sobe A, o processo morre entre o 7 e o 8; 10:05 sobe B e o 8 grava. A é **mais velho** que `documento_enviado_em`, caía no `else` e era rotulado *"VERSAO ANTERIOR DE REENVIO (esperado)"*. **O único órfão que a varredura existe para pegar era o que ela mandava ignorar.** Agora ela devolve `dono_uuid`, `created_at` e `enviado_em_da_linha` e **quem lê decide** — é a saída (a) da SEC-083, e é **uma linha a menos**, não a mais.
  - **Como ler o resultado sem inventar certeza:** `dono_ainda_existe = false` → **conta apagada**, é o **R-023** e pede ação. `caminho_atual_da_linha is null` → a linha não aponta para documento nenhum, então **o objeto é órfão**, é o **R-042** e pede ação. **Com as duas preenchidas, o dado não diz qual é qual:** olhe `created_at` contra `enviado_em_da_linha` sabendo que **mais velho não quer dizer esperado**, e conte quantos objetos existem sob o mesmo `dono_uuid`. Órfão do passo 8 e versão anterior de reenvio **têm a mesma aparência no banco de hoje**, e a consulta não finge o contrário.
  - ⚠️ **Distinguir os dois com certeza é MIGRATION, é 🔴, e é OUTRO CARD.** É a saída (b) da SEC-083: uma tabela que registre todo caminho gerado, escrita no passo 6 ou 7 da rota. Ela **não existe**, não se resolve nesta seção nem na T-018, e enquanto não existir **a varredura entrega dado, não veredito.** A T-021 **não a plantou como task de propósito:** criar tabela é decisão do Elber, e a saída (a) foi escolhida justamente para não precisar dela.
  - **Por que o cast está dentro da CTE:** `split_part(o.name,'/',1)::uuid` dentro de um `left join` é avaliado sem garantia nenhuma de que o filtro de `bucket_id` veio antes, e **um único objeto com primeiro segmento que não seja uuid derrubava a query inteira** (`invalid input syntax for type uuid`) — a varredura inteira, não a linha. Filtrar por `bucket_id` **e** pelo `~*` de uuid numa CTE `materialized`, que é barreira de otimização no Postgres 12+, é o que faz o cast só ver linha que já passou pelos dois filtros.
  - **Quem roda e quando:** o Elber, no SQL Editor. **(a)** uma vez ao fechar a T-008, com o resultado colado no Resultado do card; **(b)** toda vez que a fila do admin da S4 mostrar *"documento não encontrado no armazenamento"*; **(c)** dentro da **T-018**, antes de a rotina de exclusão da F6/S11 existir.
  - ⚠️ **A passada (a) NÃO foi feita.** A T-008 fechou em 20/09 e ninguém rodou a varredura; ela está na lista de medições da S4, em `02-ESTADO.md`. **Ela esperava a T-021 de propósito:** rodar a consulta antiga rotularia órfão real como esperado, e a medição que *"fecha o assunto no dia"* fecharia errado. Agora a consulta está corrigida e a medição pode ser feita.
  - **Rodar é 🟢** (é `select`). **Apagar o que ela encontrar é 🔴:** é destrutivo, é documento de identidade, e não acontece sem o Elber presente.

  **4. R-029 — o escopo, em uma frase, e ele não cresce aqui.** **A T-008 trata a recusa da guarda como falha nomeada** — compensa o objeto, não cai para `service_role`, e devolve mensagem dizendo que a conta está travada por dado de estabelecimento em linha de pessoa física e que isso é caso de suporte — **e escreve, no item 6, a frase que a `0004` tem que levar para dentro da exceção**. A T-008 **não** faz `create or replace` de `recusar_dado_de_estabelecimento_em_pessoa_fisica`: isso é migration, e migration é 🔴. E a regra de que trocar role de `clinic` obriga a limpar as três colunas **continua sendo do primeiro card que tocar `/api/admin/set-access`** — não é desta.

  **5. R-047 (SEC-068) — a regra de deploy que este card carrega, porque é o mesmo padrão de falha silenciosa em outro lugar.** ⚠️ **Antes de qualquer deploy que mude o roteamento do onboarding** — o do estabelecimento na T-007, o `app/app/page.tsx` na T-016, ou esta rota, se ela mexer em para onde a pessoa é levada depois do envio — **mede-se, e é um `select`:**
  `select count(*) from profiles where role='clinic' and onboarding_completed and status='incomplete';`
  **Zero** → fecha com a medição escrita. **Mais que zero** → são contas que ninguém nunca leva ao onboarding novo e que nunca chegam à fila de validação; o conserto é `update` de linha, **🔴, sessão presencial**. **Não é conserto de código, e não se descobre por sintoma: descobre-se contando.**

  **6. O texto que a `0004` tem que carregar — e o R-031 só fecha quando ele existir num arquivo aplicado.** **NÃO EDITE A `0003`:** ela está aplicada em produção desde 26/08, e migration aplicada é histórico. A `0004` copia a seção 2.b, e **ao copiar substitui os passos 7 e 8 e o parágrafo do órfão por este texto, palavra por palavra:**

  ```
  --   7. escrever no bucket com `service_role`. É o ÚNICO passo desta rota que
  --      usa `service_role`.
  --   8. só então gravar a linha, COM A SESSÃO DO USUÁRIO — nunca com
  --      `service_role` (DL-055, decisão do Elber em 31/08/2026):
  --      `documento_path`, `documento_hash` (sha256 em hex minúsculo dos MESMOS
  --      bytes que foram escritos) e `documento_tamanho`. Os três juntos, num
  --      único UPDATE: o CHECK da seção 4 recusa dois de três. Sob RLS, pela
  --      policy `perfil_privado_update_own`, para que `auth.uid()` fique
  --      preenchido e o `insert into audit_logs` do trigger de revalidação grave
  --      QUEM trocou o documento. Se a policy não alcançar, a rota FALHA E DIZ
  --      QUE FALHOU: não existe plano B com `service_role`.
  --
  --   A ORDEM É ESTA, 7 ANTES DE 8, e o custo foi escolhido (T-008 / R-042):
  --   objeto sem linha é inerte, porque o bucket não tem policy e ninguém o
  --   alcança sem `service_role`; linha sem objeto é uma mentira que carimba
  --   `documento_enviado_em`, dispara a revalidação da seção 6, move o `status`,
  --   põe o profissional na fila do admin com um arquivo que não existe e deixa
  --   em `audit_logs` uma linha que ninguém desfaz.
  --
  --   SE O PASSO 8 FALHAR, A PRÓPRIA ROTA APAGA O OBJETO, no mesmo pedido, com o
  --   mesmo `service_role` do passo 7, e só então responde erro. Nunca responde
  --   sucesso sem a linha gravada. Se a compensação também falhar, registra no
  --   log do servidor a marca `DOCUMENTO_ORFAO` com o caminho e responde erro
  --   assim mesmo.
  --
  --   O ÓRFÃO CONTINUA POSSÍVEL: o processo pode morrer entre o 7 e o 8, e aí a
  --   compensação nem chega a rodar. Por isso ele tem que ser DETECTÁVEL, e é: o
  --   primeiro segmento do caminho é o uuid do dono (seção 3), então a varredura
  --   é um `left join` de `storage.objects` com `perfil_privado` por
  --   `documento_path`. A consulta vive num lugar só, o item 3 da seção "A ordem,
  --   a compensação e a varredura" do card da T-008, e nenhum outro card a copia.
  --   Reenvio legítimo aparece nela, porque o caminho antigo não é apagado, e ela
  --   NÃO tenta classificar: nada no banco de hoje distingue "versão anterior de
  --   reenvio" de "órfão do passo 8", então ela devolve `created_at` e
  --   `documento_enviado_em` e quem varre decide (SEC-083 / T-021). APAGAR o que
  --   ela encontrar é destrutivo e só acontece com o Elber presente.
  ```

  E, dentro da exceção da guarda `recusar_dado_de_estabelecimento_em_pessoa_fisica`, a `0004` acrescenta **esta frase** (R-029): *"Para destravar esta linha, um UPDATE que zere `cnpj`, `razao_social` e `responsavel_tecnico` passa: trocar o role de `clinic` para outro obriga a limpar as três."*

  ⚠️ **Enquanto esse texto não estiver num arquivo de migration aplicado, o R-031 continua ABERTO.** A decisão do DL-055 existe, o card existe, e o arquivo que a `0004` vai copiar continua omisso. **Decisão registrada em doc não vira contrato de código sozinha.**

- **Não fazer:** não construir a tela de leitura do documento pelo admin (S4). Não usar `next/image` em nada vindo de usuário (R-004). Não aceitar arquivo checando só a extensão. **Não editar a `0003`** (aplicada; o texto do item 6 é para a `0004`). **Não fazer `create or replace` de função nenhuma** — é 🔴. **Não apagar o objeto anterior no reenvio** (a `0003` §3 decidiu que ele fica). **Não cair para `service_role` no passo 8** em circunstância nenhuma, nem "só quando a policy falhar". **Não escrever cron nem job de varredura:** a varredura é `select` operado por gente, e é assim de propósito.
- **Resultado:**

  ## HANDOFF — vetria-backend — T-008 — 16/09/2026

  **Fiz:**
  - `app/api/documentos/upload/route.ts` (novo, 🟡) — a rota de escrita, os oito passos da
    seção 2.b da `0003` na ordem, mais a seção 🔒 deste card. Sessão (`:191`), role e status
    por conta própria (`:216-265`, SEC-079), bytes com teto de 10485760 medido **duas vezes**
    no servidor (`:277-300`), tipo real por assinatura mágica (`:71-100`), extensão derivada do
    tipo detectado, caminho `<uuid>/documento-<epoch ms>.<ext>` gerado no servidor e conferido
    contra a mesma regex do CHECK **antes** do upload (`:117-127`), sha256 hex dos bytes,
    passo 7 com `service_role` e `upsert: false`, passo 8 **com a sessão do usuário** e as três
    colunas juntas (DL-055).
  - `compensarObjetoOrfao()` **dentro do arquivo da rota** (`:150-183`), recebendo o mesmo
    cliente `service_role` do passo 7 por parâmetro. Toda falha do passo 8 apaga o objeto e só
    então responde erro; quando a remoção também falha, sai a marca fixa `DOCUMENTO_ORFAO` com
    caminho e código.
  - Falhas nomeadas do passo 8: **P0001** → a mensagem do R-029 (conta travada por dado de
    estabelecimento em linha de pessoa física, caso de suporte); **42501/PGRST301** → falha
    ruidosa, sem nenhum plano B com `service_role`.
  - `app/api/documentos/abrir/route.ts` (novo, 🟡) — a rota de leitura, os cinco passos: sessão,
    autorização explícita (dono **ou** admin), caminho lido da tabela e nunca do cliente,
    `audit_logs` (`documento_visualizado`, `alvo_id` = dono, `actor_id` explícito, por
    `service_role`) **antes** da URL, e só então `createSignedUrl` de 60 segundos. Sem trilha,
    sem URL. Objeto ausente devolve "Documento não encontrado no armazenamento" com o caminho
    (SEC-033), não 404 mudo.
  - `components/app/EnvioDeDocumento.tsx` (novo) — o passo 4 deixou de ser aviso. **Um
    componente para as duas personas**; o que muda entre elas é texto, por prop.
  - `VetOnboardingForm.tsx` e `ClinicOnboardingForm.tsx` — placeholder substituído, e o botão
    de conclusão só habilita com documento gravado.
  - `veterinario/onboarding/page.tsx` e `estabelecimento/onboarding/page.tsx` — passam a ler
    `documento_enviado_em` (e **só** ele: `documento_path` e `documento_hash` não vão para o
    HTML).

  **Não fiz:** nenhuma migration, nenhuma policy, nenhum `.env`, nenhum
  `create or replace`. Nada em `middleware.ts`, `lib/`, `app/cadastro/*` ou `tests/`. Não
  construí `/admin/validacoes` (S4). As Server Actions de onboarding **não** foram tocadas:
  a obrigatoriedade do documento é regra de tela, e quem reprova cadastro sem documento é a
  fila do admin.

  **Estado agora:** o bucket deixa de estar vazio quando alguém enviar. O passo 4 do onboarding
  envia de verdade, nas **duas** personas, com o mesmo componente e o mesmo comportamento.
  **Nada foi provado em tela ainda** (precisa de conta logada). `npm run lint` e `npm run build`
  verdes. **Nada commitado.**

  **Descobri:**
  1. **A linha de `perfil_privado` pode não existir na hora do envio.** Nada a cria no cadastro,
     e o passo 4 vem antes do "Concluir". Um `update` que não alcança linha volta **sem erro**,
     o que seria resposta de sucesso sem linha gravada. Por isso o passo 8 é `upsert` por `id`,
     ainda **uma escrita**, com as três colunas juntas e sob as mesmas policies.
  2. **Teto de corpo da plataforma.** O bucket aceita 10 MiB, mas função serverless na Vercel
     recusa corpo acima de ~4,5 MB **antes** de a rota rodar. Foto de celular passa disso. O
     cliente trata o 413 com mensagem honesta, mas **o teto real de produção não é 10 MB**.
  3. O `try/catch` do passo 8 não é estilo: sem ele, uma exceção (e não um `error`) pularia a
     compensação e criaria órfão em silêncio.

  **Bloqueios:** nenhum bloqueio de schema. Precisa de (1) diff aprovado pelo Elber, (2)
  auditoria do `vetria-seguranca`, (3) prova em tela com conta logada.

  **Próximo passo óbvio:** provar em tela com a conta `clinic` da T-007 e rodar a varredura de
  órfãos do item 3 desta seção 🔒 (esperado: `VERSAO ANTERIOR DE REENVIO` ou zero linha).

  **Docs que atualizei:** `03-TAREFAS.md` (este card).

  **Commits:** **nenhum, de propósito.** Tudo na árvore de trabalho.

- **✅ ADENDO DE FECHAMENTO — 20/09/2026, `vetria-maestro`.** O Resultado acima **não foi
  alterado**. Isto é a prova que faltava, feita pelo Elber, e o que ela mediu.

  **A prova em tela, numa conta `vet` real, ponta a ponta:**
  1. O botão de concluir **estava apagado** sem documento — a regra de tela da SEC-088 fazendo o
     que promete.
  2. O documento foi enviado e a tela passou a dizer **"Documento recebido em 20/09/2026,
     21:13"**.
  3. O botão **acendeu**, e a conclusão levou a **`/aguardando`** — que é o portão da T-016
     trabalhando em cima desta task.

  **O `select` provou as três colunas, e o CHECK all-or-nothing está satisfeito de verdade:**
  `documento_path`, `documento_hash` com **64 hex**, `documento_tamanho` **15683**,
  `documento_enviado_em` **carimbado pelo banco** (trigger, não cliente) e
  `status = pending_validation`.

  **A URL assinada expira em 60 segundos, e isso não foi lido no código: foi medido no payload do
  próprio JWT** (`exp − iat = 60`).

  **O que a auditoria devolveu, e onde cada coisa foi parar:** 🔴 0 · 🟠 1 · 🟡 9. Três correções
  obrigatórias aplicadas antes do merge (**SEC-085**, **SEC-087**, **SEC-090**) mais a SEC-084
  qualificada. **SEC-081** (🟠, volume e limpeza do bucket) → **T-020**, com trava escrita.
  **SEC-083** (a varredura classifica órfão real como "esperado") → **T-021**. **SEC-088**
  (obrigatoriedade do documento) → **T-022, decisão do Elber**. **SEC-082**, **SEC-086** e
  **SEC-089** continuam abertas e recomendadas: viraram **R-056**, **R-057** e **R-058**.

  ⚠️ **Correção de registro que a SEC-082 obriga, e é doc que mentia:** o item 2 do *Descobri*
  acima diz que *"função serverless na Vercel recusa corpo acima de ~4,5 MB antes de a rota
  rodar"*. **Esse número está errado.** Vercel Functions aceita corpo de requisição de até 100 MB,
  a plataforma **não estrangula este caminho**, e **o teto real de produção é o de 10 MiB da
  própria rota**. O tratamento de 413 no cliente continua válido como defesa; ele só não é o
  gargalo que o handoff descreveu.

  ❌ **O que este card mandava fazer ao fechar e NÃO foi feito:** a **varredura de órfãos** do item
  3 da seção 🔒 (*"uma vez ao fechar a T-008, com o resultado colado no Resultado do card"*)
  **não foi rodada, e não há resultado colado.** Está na fila da S4 como medição do Elber, e
  **depois da T-021** — hoje a consulta classifica órfão real como esperado, então rodá-la antes
  seria medir errado e fechar o assunto com o número errado.

  **Commits:** `a69e63e` (a task), `8e18b64` (o `/ajuda` do DL-058), na `main` por `eb6e2d6`.

### T-016 — O portão de status passa a existir no servidor (R-038 / SEC-059)
- **Estado:** ✅ **CONCLUÍDA em 20/09/2026.** Mergeada na `main` pelo **PR #2** (`eb6e2d6`, commit `9f8b4f8`), auditada (`SEC-2026-09-16-T016`) e **provada em tela pelo Elber: as 9 navegações bateram.** **R-001 — o único 🔴 crítico aberto do projeto — e R-038 fecham por esta prova.** Ver o **adendo de fechamento** no fim deste card. _(estado anterior, mantido:)_ 🔵 escrita na árvore em 16/09, esperando diff aprovado, auditoria e prova com conta logada
- **Fase / Semana:** F3 / **S3** — justificativa abaixo, em *Por que a S3*
- **Capacidade:** transversal obrigatória **Segurança** (`00-ESCOPO.md` §2, "RBAC no middleware"), ancorada em **E2**. Não existe card sem capacidade, e esta é direta: o **item 2 do Definition of Done da F3** é literalmente este portão — *"esse veterinário vê a tela 'aguardando' e não consegue entrar no dashboard"*. Sem T-016, o item 2 não fecha e **a F3 não fecha**
- **Nível:** 🟡 — o semáforo nomeia `middleware.ts`, `lib/` e ">3 arquivos" como 🟡, e o `01-PLANO.md` §S3 já prevê a reescrita do middleware nesta semana. **Não é 🔴 porque nada de login, sessão, `.env`, policy ou migration entra junto.** ⚠️ Se durante a execução a correção pedir migration ou mudança de policy, **para, marca ⏸️ e vira 🔴** (regra 8 do `AGENTES.md`). O diff vai inteiro pro Elber antes do merge
- **Agente dono:** vetria-backend · **auditoria obrigatória depois:** vetria-seguranca — correção de segurança volta pra revisão, sempre (`AGENTES.md`)
- **Depende de:** **T-007** — não tecnicamente, e sim **para poder ser provada**. A T-007 é a primeira task que faz existir um `clinic` em `pending_validation` de verdade; sem ela, metade do portão fecha sem ter contra o que ser testada
- **Por quê:** **R-038.** `requirePainel` seleciona exatamente **uma** coluna, `role` (`lib/auth/painel.ts:14`, reconferido no código em 09/09), e **nenhuma das 8 páginas do painel do veterinário lê `profiles.status`**. A matriz §4 de `06-PERMISSOES.md` diz que `incomplete` alcança **só** `/onboarding`, que `pending_validation` alcança **só** `/aguardando`, `/perfil` e `/configuracoes`, e que **o resto é bloqueado no servidor, não escondido no menu**. Hoje o único sustentáculo do portão é o `redirect()` do fim da Server Action, que é **sugestão de navegação, não guard**: um vet `incomplete` digita `/app/veterinario/contatos` na barra de endereço e a página renderiza. Sem devtools, sem ferramenta nenhuma.
- **Por que a S3, e não depois — três razões, nesta ordem:**
  1. **É o item 2 do DoD da F3, e a F3 fecha em 22/09.** Depois desta semana só existe a S4, que já está cheia com a validação pelo admin. Não há terceira janela dentro da fase.
  2. **O `01-PLANO.md` §S3 já marca a reescrita do `middleware.ts` para esta semana, e o R-001 mora nela.** O R-001 é o **único 🔴 crítico aberto** do projeto. O auditor recomenda juntar os dois, e ele tem razão: **uma reescrita de RBAC é mais barata e mais segura que duas**, e RBAC mexido duas vezes em duas semanas é exatamente como um furo passa despercebido.
  3. **O impacto hoje é nenhum** — as 8 páginas são casca — **e vira 🔴 na F4/S8 sem uma linha de código mudar**, no dia em que `/contatos` mostrar lead real e `/plano` mostrar cobrança. Fazer agora custa um card. Fazer quando doer custa tela de produto pago aberta para quem não foi validado — e isso não é bug, é o modelo de negócio vazando.
- **Feito quando:**
  - [ ] `requirePainel` passa a **receber o conjunto de status permitido** e a selecionar `role, status`, no padrão de **lista de permitidos** da SEC-052 — nunca lista de proibidos
  - [ ] A matriz §4 é codificada **célula por célula**: `incomplete` → só `/onboarding` · `pending_validation` → só `/aguardando`, `/perfil`, `/configuracoes` · `active` → painel completo · `suspended` → tela de bloqueio com motivo
  - [ ] Vale para **os dois painéis**: `app/app/veterinario/(painel)/` (8 páginas) e `app/app/estabelecimento/(painel)/` (as mesmas 8, mais `equipe`)
  - [ ] **Leva o R-001 junto:** isolamento de role por prefixo de rota no `middleware.ts`. Um `tutor` logado que digite `/app/veterinario` é redirecionado — **item 4 do DoD da F3**
  - [ ] **Limpa o resíduo do R-002:** o código morto `NAV_BY_ROLE["master"]` em `app/app/layout.tsx:23`, que ensina errado a quem lê
  - [ ] **Fecha o agravante do caminho feliz:** `actions.ts:366` faz `depois?.status ?? perfil.status`; se a releitura falhar por rede, `statusFinal` volta a `incomplete` e a linha 377 **deposita no painel quem acabou de entrar na fila**. Com o portão no servidor isso deixa de ser alcançável — **prove que deixou**
  - [ ] **`app/app/page.tsx:20` passa a rotear por `profiles.status`**, e não por `onboarding_completed` (**R-040 / SEC-061**). É a correção barata e **sem migration**: a coluna é gravável pelo próprio usuário, e o próprio repositório é a prova de conceito disso
  - [ ] **Prova executada, não opinião:** conta `vet` de teste em `incomplete` e outra em `pending_validation`, logadas, digitando `/app/veterinario`, `/contatos`, `/plano` e `/agenda` na barra de endereço. **As quatro redirecionam.** Mesma passada no estabelecimento. Cada uma registrada no Resultado
  - [ ] **Teste E2E** cobrindo os itens 2 e 4 do DoD da F3 (`vetria-qa`, em paralelo). ⚠️ Esbarra no **R-033** (conta nova a cada rodada, sem lugar limpo pra criar): se o R-033 não estiver decidido, o teste fica escrito e **pulando com o motivo escrito**, nunca verde à toa
  - [ ] Apagar o comentário de `aguardando/page.tsx:6` que aponta para **TASK-032** em `BACKLOG.md`, arquivo **congelado** da fase visual. É o R-034 em miniatura: controle que existe só em comentário de código não existe
- **💡 SUGESTÃO DE ESCOPO, NÃO ESCOPO FECHADO — SEC-072 / R-051 é candidato natural a entrar aqui.**
  O `page.tsx` do onboarding seleciona só `role, status` (nos **dois** painéis). Passar a selecionar
  **`status_motivo`** e exibi-lo quando `status = 'incomplete'` e o motivo não for nulo fecha o laço
  de reprova mudo: `admin_definir_status` devolve `onboarding_completed = false` ao reprovar
  **justamente para levar a pessoa até a tela onde o motivo aparece** (`0002:702-712`, com o porquê
  escrito no comentário), **e essa tela não existe**. Hoje o reprovado recebe um formulário
  pré-preenchido em modo "novo", reenvia o mesmo dado, e a fila da S4 recicla.
  **É leitura da própria linha: sem migration e sem policy**, e encosta no mesmo roteamento por
  `status` que este card já toca. ⚠️ **Quem fecha o escopo deste card é o `vetria-maestro`** — isto
  entra como sugestão do `vetria-escriba`, vinda da revisão de 15/09, e a alternativa registrada no
  risco é um **card da S4**, junto com a fila de validação, que é quem produz a reprova.
- **Não fazer:** não tocar em policy, RLS ou migration — se o portão pedir isso, para e vira 🔴. Não "esconder do menu" no lugar de bloquear no servidor: a matriz §4 proíbe por escrito. Não construir a tela de bloqueio do `suspended` com dado fake. Não reescrever as rotas `/api/admin/*`, que já foram na T-015. Não encostar no enum de `role` (DL-043).
- **Resultado (16/09/2026, `vetria-backend`): o portão existe, e a rota `/aguardando` deixou de ser uma tela que ninguém alcança.**

  ## HANDOFF — vetria-backend — T-016 — 16/09/2026

  **Fiz:** **27 arquivos, nenhum commit.** 3 nascem, 24 mudam. **Nenhuma migration, nenhuma policy, nenhum `.env`** — e nenhum dos 5 arquivos congelados da T-007 foi tocado.

  - **`lib/auth/status.ts` (NOVO) — a matriz §4 vira dado, num lugar só.** Módulo puro, sem banco e sem `next/headers`, porque o `middleware.ts` roda no Edge e precisa importar dele tanto quanto as páginas. Exporta os conjuntos permitidos (`ONBOARDING`, `SO_ESPERANDO`, `ESPERANDO_OU_ATIVO`, `SO_ATIVO`, `SO_SUSPENSO`), o mapa de **role por prefixo de rota** (R-001), o mapa de **status por segmento** e o `destinoPorStatus()`, que é a mesma tabela lida ao contrário. **Tudo lista de permitidos** (SEC-052/SEC-054): o padrão de segmento não listado é `active`, e o `default` do `destinoPorStatus` é a tela de bloqueio — status novo no enum nasce barrado, sem ninguém editar arquivo nenhum.
  - **`lib/auth/painel.ts`** — `requirePainel(role, statusPermitidos)` passa a selecionar **`role, status` no mesmo `select`** e a aplicar a lista. Ganhou a irmã `requireContaBloqueada(role)`, que lê `status_motivo` junto.
  - **`middleware.ts`** — leva o **R-001** junto: role por prefixo (`/app/responsavel` → `tutor`, `/app/veterinario` → `vet`, `/app/estabelecimento` → `clinic`, `/admin` → `admin`) **e** o portão de status por prefixo, que é o que o **DL-046** manda (*"o bloqueio vive no `middleware.ts` por prefixo de rota, não espalhado por página"*). Uma consulta por requisição, e só quando a rota pertence a alguma persona.
  - **`app/app/page.tsx`** — roteia por **`profiles.status`** via `destinoPorStatus()`, e não mais por `onboarding_completed` (**R-040 / R-050**). Responsável e admin continuam como estavam, de propósito: a matriz §4 se chama *"O portão de status (vet e estabelecimento)"*, e os dois nascem `active` (`0002:796-797`).
  - **As 17 páginas de painel** (8 do vet, 9 do estabelecimento) passam a declarar quem entra nelas. Os 5 guards inline que liam só `role` (os 2 dashboards, os 2 `perfil`, o `equipe`) viraram `requirePainel`. Os 2 `layout.tsx` do route group ganharam o piso `ESPERANDO_OU_ATIVO`.
  - **`app/app/{veterinario,estabelecimento}/bloqueado/page.tsx` + `components/app/ContaBloqueada.tsx` (NOVOS)** — a tela de bloqueio com motivo da matriz §4. O motivo é `profiles.status_motivo`, dado real da própria linha; quando é nulo a tela **diz que não há motivo registrado** em vez de inventar um.
  - **Resíduos que o card mandava limpar, os dois limpos:** `NAV_BY_ROLE["master"]` saiu de `app/app/layout.tsx` (**R-002**, item 1) e o comentário que apontava o gating para a **TASK-032** saiu das duas `aguardando/page.tsx` (`BACKLOG.md` é arquivo congelado — era o R-034 em miniatura).

  **Não fiz:**
  1. **A prova executada com conta logada.** Nenhum agente loga no app. As 8 navegações estão escritas abaixo, em *Bloqueios*, para serem feitas em 3 minutos.
  2. **A medição do R-047** (`select count(*) from profiles where role='clinic' and onboarding_completed and status='incomplete';`). Tentei rodar como leitura pura e **o ambiente recusou acesso a dado de produção**. Continua sendo do Elber, e **passou a importar mais** — ver *Descobri 2*.
  3. **O R-051 / SEC-072** (exibir `status_motivo` no onboarding), como a instrução mandou: o `page.tsx` do estabelecimento é um dos 5 congelados. Recomendação abaixo, em *Próximo passo*.
  4. **O teste E2E** do item 2 do DoD: `tests/` é do `vetria-qa` e esbarra no **R-033**.
  5. **Nenhuma migration.** Nada no portão pediu uma: `status` já existe, já é `not null default 'incomplete'`, já é pinado contra o próprio usuário e `status_motivo` já é legível pelo dono. **O card não vira 🔴.**

  **Estado agora — o que passou a funcionar, em comportamento:**
  - Um profissional em **`pending_validation` cai em `/aguardando`**, e não mais no painel. Era o buraco central: `concluir_onboarding_profissional()` grava `status` e `onboarding_completed` no mesmo `update` (`0002:753-755`), e o `/app` olhava a segunda coluna.
  - **`/contatos`, `/plano`, `/agenda`, `/avaliacoes`, `/equipe` e o dashboard exigem `active`.** Digitados na barra de endereço por quem não é, redirecionam antes de renderizar. **Duas vezes:** no middleware e na página.
  - **`incomplete` só alcança `/onboarding`**; **`suspended` só alcança `/bloqueado`**, que agora existe e mostra o motivo.
  - **Um `tutor` logado que digite `/app/veterinario` é redirecionado** (item 4 do DoD da F3, R-001). O mesmo vale para todo cruzamento de painel.
  - **O CTA parou de mentir:** quem chega no dashboard está validado, então o botão é "Editar perfil" e os dois primeiros passos do pipeline aparecem concluídos. "Completar cadastro" para quem já está na fila deixou de existir.
  - **O agravante do caminho feliz (`actions.ts:366`) deixou de ser alcançável.** Se a releitura de status falhar por rede, o `redirect("/app/veterinario")` continua acontecendo — mas agora ele é **sugestão de navegação sobre um portão**: o destino é recalculado a partir da linha do banco, não do valor obsoleto em memória. O profissional acaba em `/aguardando` de qualquer jeito.
  - **Continua casca:** todo o conteúdo das 17 páginas. O portão decide quem entra, não o que se vê lá dentro.

  **Descobri:**
  1. **A tela de bloqueio não é enfeite, é o que impede um laço de redirect.** Sem um destino terminal para `suspended`, o portão manda a conta suspensa para um lugar que ele próprio fecha, e ela fica girando sem nunca ler uma frase. O mesmo vale para um valor que o enum ganhe amanhã: `/bloqueado` é o sumidouro, e é por isso que ela tem guard próprio (`requireContaBloqueada`) em vez de uma lista fixa — a porta de saída não pode apontar para si mesma.
  2. ⚠️ **A T-016 provavelmente CONSERTA o R-047 sozinha, e isso muda a ordem de deploy.** O órfão do R-047 é uma conta `clinic` com `onboarding_completed = true` e `status = 'incomplete'`, que o `/app` antigo mandava para o painel e nada nunca levava ao onboarding novo. Com o `/app` roteando por `status`, ela passa a ser mandada **para o onboarding**, o guard da T-007 aceita `incomplete`, ela conclui e entra na fila. **Se a T-016 subir junto com a T-007 ou antes dela, o `update` de linha 🔴 do R-047 deixa de ser necessário.** Se a T-007 subir sozinha, continua sendo. **A medição ainda vale**, porque é ela que diz quantas contas dependem disso — mas o conserto passa a ser código, não sessão presencial. **Quem decide a ordem é o `vetria-maestro`.**
  3. **`/ajuda` não está em lugar nenhum da matriz §4** — nem na coluna "Alcança" de `pending_validation`, nem na de "Bloqueado". Apliquei **deny by default** (`SO_ATIVO`), que é a regra da casa, e **registro aqui que é uma escolha, não uma leitura**: quem está esperando validação não alcança a página de ajuda, e ajuda é justamente onde ele procuraria o email do suporte. **Se a intenção da matriz era outra, é uma linha em `lib/auth/status.ts` mais uma linha na matriz — e a matriz muda antes do código.** Enquanto isso, `/aguardando` já traz o caminho de contato.
  4. **`/admin/usuarios` contraria a matriz §2 hoje, e não é desta task.** A matriz diz ❌ para admin comum e ✅ só para master; a página confere `role === 'admin'` e depois só usa `admin_level` para decidir o que renderiza (`app/admin/usuarios/page.tsx:20-26`). As rotas `/api/admin/*` estão certas (T-015). **Achado novo, candidato a risco, não corrigido aqui** porque o card proíbe encostar em `/api/admin/*` e porque escopo de card não se amplia sozinho.
  5. **O comentário da T-007 em `estabelecimento/onboarding/page.tsx:67-69` envelheceu** no minuto em que este diff existiu: ele diz *"As páginas de `(painel)/` continuam sem ler `status`"*. **Não toquei** — é arquivo congelado. É uma linha de comentário para a passada seguinte.
  6. **Os dois `page.tsx` de onboarding repetem à mão a lista que agora tem nome** (`ONBOARDING`, em `lib/auth/status.ts`). Os valores são idênticos, então não há divergência hoje. **Não unifiquei de propósito:** o do estabelecimento está congelado, e mexer só no do veterinário quebraria a simetria dos gêmeos, que este projeto trata como ativo. Depois do merge da T-007, os dois importam a constante numa passada só.

  **Bloqueios — a prova que falta, e ela é de 3 minutos com o navegador aberto.** A conta `vet` real em `pending_validation` desde 31/08 é o caso de teste vivo: **logada, ela tem que cair em `/app/veterinario/aguardando`**, e as quatro URLs digitadas na barra de endereço — `/app/veterinario`, `/app/veterinario/contatos`, `/app/veterinario/plano`, `/app/veterinario/agenda` — **têm que voltar todas para `/aguardando`**, enquanto `/app/veterinario/perfil` **abre**. Mesma passada no estabelecimento depois que a T-007 subir, e uma conta `tutor` digitando `/app/veterinario` para fechar o R-001. **Cada uma registrada aqui, com o que aconteceu.**

  **Próximo passo óbvio:** o diff inteiro para o `vetria-seguranca` antes de qualquer merge (correção de segurança volta para revisão, sempre), e **a decisão de escopo do R-051 com o `vetria-maestro`**: minha leitura é que ele **cabe na T-016 numa segunda passagem, depois do merge da T-007** — é o mesmo roteamento por `status`, é leitura da própria linha, sem migration e sem policy, e são os dois `page.tsx` de onboarding mais o texto do formulário. **O que não cabe é agora**, com o diff revisado da T-007 congelado na árvore. Se a S4 preferir levá-lo junto com a fila de validação, que é quem produz a reprova, também fecha — o que não pode é ficar sem dono, que é como o R-034 nasceu.

  **Docs que atualizei:** este card (Estado + Resultado). **`04-RISCOS.md` não foi tocado:** R-038, R-001, R-002, R-040 e R-050 só fecham quando o diff for aprovado e o comportamento for medido em tela — risco não fecha porque o código existe, fecha quando o comportamento muda (é a regra que segurou o R-020 até o último minuto).

  **Commits:** nenhum. É 🟡: o diff espera aprovação.

- **📌 ADENDO DO `vetria-maestro` — 16/09/2026. As três decisões que o `vetria-backend`
  levantou por escrito e não tomou, decididas.** O Resultado acima **não foi alterado**: ele é
  o handoff de quem executou, e handoff não se reescreve. Isto é resposta, não correção.

  **(a) Ordem de deploy — DECIDIDA: as duas juntas, no mesmo push. Ver DL-057** e o bloco
  *🚢 A ordem de deploy da T-007 e da T-016* no cabeçalho desta fila, que tem a tabela de custo
  das três opções e a trava de 18/09. **O *Descobri 2* estava certo, e faltava metade:** a
  T-016 conserta o R-047 quando sobe **com ou depois** da T-007, e **cria um laço de redirect**
  se subir **antes** dela sozinha — porque em produção o onboarding do estabelecimento ainda é
  a página velha, com a Server Action inline que grava `onboarding_completed` sem mover o
  `status`. **A medição do R-047 não foi dispensada.**

  **(b) `/ajuda` — a matriz passou a responder, e a resposta é o contrário do que o código
  faz hoje.** O deny by default aplicado aqui **era a escolha certa para uma lacuna**, e
  registrá-lo como escolha e não como leitura foi o que permitiu esta decisão existir.
  **A matriz mudou primeiro** (`06-PERMISSOES.md` §4, com o porquê, e **DL-058**):
  **`/ajuda` entra em "Alcança" para `pending_validation`.** `incomplete` e `suspended`
  continuam como estavam.

  **Sim, o código precisa mudar junto, e é uma linha:** `/ajuda` sai de `SO_ATIVO` e passa a
  `ESPERANDO_OU_ATIVO` no mapa de status por segmento de `lib/auth/status.ts`, nos dois
  painéis. ⚠️ **Não entra agora, e não é hesitação:** o diff está **em revisão de segurança
  neste momento**, e mexer no artefato que o auditor está lendo invalida a revisão. A linha
  entra **na mesma passada que tratar o que a revisão devolver**, e — mesmo que a revisão
  volte 🔴 0 · 🟠 0 — **ela volta ao `vetria-seguranca` como delta explícito**, porque alarga
  uma permissão, e permissão alargada sem segundo par de olhos é como furo passa
  (`AGENTES.md`, *correção de segurança volta pra revisão, sempre*). **Custo: uma releitura
  curta. Não é rodada nova.** Se por qualquer razão não couber antes de 18/09, **a T-016 sobe
  com `SO_ATIVO` mesmo** e a linha vira ajuste de uma linha na semana seguinte: a matriz já
  está escrita, e é ela que manda. **O que não podia continuar era a lacuna.**

  **(c) `/admin/usuarios` — virou R-054, e NÃO ganha card nesta fase.** Conferido no código
  pelo `vetria-maestro` em 16/09 e o achado procede: `app/admin/usuarios/page.tsx:24` exige só
  `role === 'admin'`, e a matriz §2 dá ❌ para admin comum. **O que o achado não dizia, e muda
  a gravidade: não vaza dado nenhum** — o `AdminPanel`, que lista a base inteira, está dentro
  do ramo `isMaster` (`:36-44`); o admin comum recebe uma tela que diz que ele não tem acesso.
  **É divergência entre matriz e código, não exposição.** Detalhe, prazo e por que espera estão
  no **R-054**. **Está em confirmação pela revisão da T-016 em curso**, e se o
  `vetria-seguranca` classificar 🟠, aí ganha card.

  **Bônus, porque o card pedia e ficar sem dono é como o R-034 nasceu — o escopo do R-051 /
  SEC-072 está FECHADO: não entra na T-016, vai para a S4.** O backend escreveu *"o que não
  cabe é agora"* e tem razão. Mas a segunda passada que ele propõe também não cabe: **restam 6
  dias e a T-008 não começou.** A reprova com motivo só passa a existir quando **alguém
  reprovar**, e quem reprova é a fila de validação da S4 — então o dono natural é o card da S4,
  onde a tela de motivo nasce junto com o que a produz. **Isto não abre card hoje**; abre
  quando a S4 for aberta, e o R-051 fica com essa linha escrita para não voltar a ficar órfão.


- **✅ ADENDO DE FECHAMENTO — 20/09/2026, `vetria-maestro`.** O Resultado e o adendo de 16/09
  **não foram alterados**. Isto é a prova que os dois pediam, feita pelo Elber com conta real no
  preview, em 20/09.

  **As 9 navegações, e as 9 bateram:**

  | # | O que foi digitado | O que aconteceu |
  |:-:|---|---|
  | 1 | `/app` | → **`/aguardando`**. O buraco central fechou: quem está na fila para de ser depositado no painel |
  | 2 | `/app/veterinario` | **volta** |
  | 3 | `/app/veterinario/contatos` | **volta** |
  | 4 | `/app/veterinario/plano` | **volta** |
  | 5 | `/app/veterinario/agenda` | **volta** |
  | 6 | `/app/veterinario/perfil` | **abre** — a exceção da matriz §4 |
  | 7 | `/app/veterinario/ajuda` | **abre** — é o **DL-058** em produção (`8e18b64`) |
  | 8 | `/app/estabelecimento` | **devolve a conta ao painel dela** |
  | 9 | `/admin` | **devolve a conta ao painel dela** |

  **O que isso fecha, com a medição escrita:**
  - **R-001** — o `middleware.ts` isola painel por role. Era o **único 🔴 crítico aberto do
    projeto**, e estava aberto desde 26/08.
  - **R-038** — o portão de status da matriz §4 existe no servidor, e não só no menu.
  - **Itens 2 e 4 do Definition of Done da F3**, cumpridos e medidos.
  - **R-002, item 1** — `NAV_BY_ROLE["master"]` saiu de `app/app/layout.tsx`, conferido no código.
    Os itens 2 e 3 do R-002 continuam abertos.
  - **R-040, a metade barata** — `app/app/page.tsx` roteia por `profiles.status`, conferido no
    código. **O risco não fecha:** a policy continua sem pinar `onboarding_completed` e o admin
    continua usando a coluna como mecanismo de reprova.

  ⚠️ **O que a prova NÃO cobriu, e por isso não fecha junto:**
  - **A passada com conta `tutor`.** O item 4 do DoD fala, ao pé da letra, de *"um responsável
    logado que digite `/app/veterinario`"*. O que foi exercitado foi o cruzamento inverso, pela
    mesma tabela de prefixo. **O mecanismo está provado; a frase, não.** É **uma navegação**, e
    está na fila da S4 como medição.
  - **A passada no estabelecimento.** Não há conta `clinic` de teste em `pending_validation`, que
    é o **R-033** cobrando de novo. O código é o mesmo e a matriz é a mesma — e isso é argumento,
    não medição.

  **Onde foram parar as três pendências deste card:** o **R-051** (exibir `status_motivo`) entrou
  no card **T-024** da S4, junto com quem produz a reprova · o **R-054** (`/admin/usuarios`)
  entrou no **T-023**, como as 3 linhas que o próprio risco previu · a linha do `/ajuda` do
  **DL-058** **entrou em produção** e tem teste (`8e18b64`).

  **Commits:** `9f8b4f8` (a task), `8e18b64` (o delta do `/ajuda`), na `main` por `eb6e2d6`.

### T-015 — Tirar o stack trace das rotas de admin e conferir sessão antes do corpo
- **Estado:** ✅ **CONCLUÍDA em 31/08/2026.** Card aberto e fechado no mesmo dia, direto do R-037.
- **Fase / Semana:** F3 / S2
- **Capacidade:** transversal obrigatória **Segurança** (`00-ESCOPO.md` §2), ancorada em **E5**
- **Nível:** 🟡 — toca `/api/*`, que é 🟡 por regra
- **Agente dono:** vetria-backend
- **Depende de:** T-014, que é onde o achado nasceu
- **Por quê:** **R-037.** As duas rotas de admin devolviam `{ error, stack }` no `catch` final. Nas
  duas, o `try` abre na linha 17, a autenticação é na 30/36 e a autorização na 48/56 — então tudo
  que estourasse antes da checagem de sessão saía como stack trace para quem chamou. No
  `set-access` a primeira linha dentro do `try` era `await req.json()`: **um POST com JSON
  malformado, sem cookie nenhum, devolvia 500 com o stack.** Sem conta, sem ser admin, na rota que
  troca o role de qualquer usuário do sistema.
- **Feito quando:**
  - [x] `stack` **sai** da resposta das duas rotas. O rastro vai pro `console.error` do servidor,
    que é onde sempre devia ter estado
  - [x] O `req.json()` do `set-access` **passa para depois da autorização**. Quem não é `master`
    não chega perto do parser
  - [x] JSON inválido vira **400 do cliente**, não 500 de servidor, por um `try` estreito em volta
    só do parse — não atravessa mais o `catch` geral
  - [x] O corpo é lido com estreitamento por `typeof`, sem `any` e sem mudar o contrato:
    `admin_level: new_admin_level ?? "admin"` continua caindo em `"admin"` quando o campo não vem
  - [x] `npm run lint` continua em 0, `npm run build` verde, 13 testes E2E passando
- **Não fazer:** não reescrever a lógica de RBAC destas rotas — isso é a S3 (R-001, R-002), e o
  **R-029** já está esperando lá. Não mexer no `debug: { userId, email, admin_level }` que a
  `profiles` devolve: é o dado **do próprio chamador**, não de terceiro, e tirar aquilo é limpeza
  de rota, não segurança.
- **Resultado:**

  ## HANDOFF — vetria-backend — T-015 — 31/08/2026

  **Fiz:** dois arquivos.
  - **`app/api/admin/set-access/route.ts`** — a ordem do `try` foi invertida: **sessão →
    autorização → corpo**. O `await req.json()` saiu da linha 18 e foi para depois do
    `admin_level !== "master"`, dentro de um `try` estreito que devolve **400** em JSON inválido.
    O corpo passou a ser lido por `typeof` campo a campo (`CorpoSetAccess`), sem `any`. O `catch`
    geral virou `console.error(...)` mais `{ error: "server error" }`.
  - **`app/api/admin/profiles/route.ts`** — mesmo tratamento no `catch`. É GET e não tem
    `req.json()`, então não tinha o gatilho fácil; mas o `try` também abre antes da sessão.

  **O contrato não mudou para quem usa a tela.** `admin_level: new_admin_level ?? "admin"`
  continua se comportando igual, porque o campo ausente virou `null` em vez de `undefined` e os
  dois caem no mesmo lado do `??`.

  **O que mudou para quem ataca:** POST sem cookie com corpo quebrado devolvia **500 com stack
  trace**; agora devolve **401**. O parser nem roda.

  **Não fiz:** não toquei no RBAC destas rotas (S3) nem no `debug` da `profiles`, pelas razões do
  "Não fazer".

  **Descobri:** nada novo além do que o R-037 já dizia. Vale registrar o caminho, porque ele se
  repete: **o achado estava escondido atrás de um `any`.** `{ stack: e?.stack }` com `e: any` não
  chama atenção de ninguém; a mesma linha com `unknown` obriga a olhar o que sai. **A T-014 não
  achou isso apesar de ser uma task de tipo — achou por ser uma task de tipo.**

  **Estado agora:** as três rotas de API do projeto devolvem mensagem e mais nada em erro de
  servidor. **R-037 fechado.**

  **Bloqueios:** nenhum.

  **Próximo passo óbvio:** o merge do PR #1. Depois dele, **R-034** (revisão independente do
  `actions.ts`) antes da **T-007**.

  **Docs que atualizei:** `03-TAREFAS.md` (este card), `04-RISCOS.md` (R-037 fechado),
  `02-ESTADO.md`.

  **Commits:** _(este)_

### T-014 — Zerar o lint e tornar o passo bloqueante no CI
- **Estado:** ✅ **CONCLUÍDA em 31/08/2026.** `npm run lint` sai com **0 erro e 0 aviso**, e o passo do CI passou a bloquear.
- **Fase / Semana:** F3 / S2
- **Capacidade:** transversal obrigatória **Testes** (`00-ESCOPO.md` §2)
- **Nível:** 🟡 — toca `middleware.ts` e rotas de `/api/*`, que são 🟡 por regra
- **Agente dono:** vetria-backend _(não é `vetria-qa`: os 14 erros estão todos em arquivo de produção, e `vetria-qa` escreve só em `tests/`)_
- **Depende de:** T-003 (o workflow precisa existir pra ter o que destravar)
- **Por quê:** o `.github/workflows/ci.yml` roda `npm run lint` com **`continue-on-error: true`**. Enquanto essa linha existir, **lint não é rede de segurança nenhuma no CI**: ele reporta e segue. A linha foi escrita assim de propósito, porque CI que nasce vermelho ninguém olha depois — mas ela é dívida com data, não desenho.
- **O que está acusando hoje (14 erros, 3 avisos, todos anteriores à T-003):**
  - `@typescript-eslint/no-explicit-any` — **9 erros**: `app/admin/AdminPanel.tsx` (3), `app/api/admin/set-access/route.ts` (4), `app/api/admin/profiles/route.ts` (1), `app/api/onboarding/set-role/route.ts` (1). ⚠️ **Sete deles estão em rota de API de admin**, que é a superfície de maior privilégio do sistema: `any` ali é onde o tipo para de ajudar exatamente onde ele mais valeria
  - `react-hooks/immutability` e mais um `any` — **2 erros** em `app/onboarding/OnboardingClient.tsx:56` (`window.location.href = "/app"`)
  - `@next/next/no-html-link-for-pages` — **1 erro** em `app/login/page.tsx:82` (`<a href="/">` no logo, devia ser `<Link>`)
  - `prefer-const` — **1 erro** em `middleware.ts:5`
  - `Parsing error: Maximum call stack size exceeded` — **1 erro** em `vetria-proto/assets/lucide.min.js`. ⚠️ **Este é falso trabalho:** a pasta está no `.gitignore` e **não existe no CI**, então o erro só aparece na máquina do Elber. O conserto é acrescentar `vetria-proto/**` ao `globalIgnores` do `eslint.config.mjs` — e vale fazer primeiro, porque é uma linha e limpa o ruído de quem for atacar os outros 13
  - 3 avisos de variável não usada (`LucideIcon`, `GhostRow`) e uma diretiva `eslint-disable` inútil
- **Feito quando:**
  - [x] `npm run lint` sai com **0 erro** — e com **0 aviso** também, que o card não pedia
  - [x] O passo `Lint` perdeu o `continue-on-error: true` e o comentário de dívida. No lugar ficou o motivo de nunca devolvê-lo
  - [x] O aviso da seção **CI** do `README.md` saiu
  - [x] `npm run build` continua verde, e **os 13 testes E2E continuam passando** (a troca de `<a>` por `<Link>` mexeu numa tela que 2 testes visitam)
- **Não fazer:** não silenciar erro com `eslint-disable` linha a linha — isso troca uma dívida visível por uma invisível. Trocar `any` por tipo de verdade, e onde o tipo for mesmo desconhecido, `unknown` com estreitamento. Não aproveitar a passagem pra refatorar as rotas de admin: a task é de tipo, não de comportamento.
- **Resultado:**

  ## HANDOFF — vetria-backend — T-014 — 31/08/2026

  **Fiz:** 17 problemas viraram 0, em 10 arquivos.
  - **`eslint.config.mjs`** — `vetria-proto/**` entrou no `globalIgnores`. Era 1 dos 14 erros e
    **falso trabalho**: a pasta está no `.gitignore` e não existe no CI, então o
    `Parsing error: Maximum call stack size exceeded` do `lucide.min.js` só aparecia na máquina
    do Elber, escondendo os 13 reais no meio do ruído. Foi o primeiro a sair, de propósito.
  - **Os 9 `any`** viraram tipo de verdade, nenhum `eslint-disable`:
    `AdminPanel.tsx` ganhou `SetAccessPayload` (os campos têm que casar com o destructuring de
    `set-access/route.ts:19` — errar um nome ali não falha em lugar nenhum, o servidor lê
    `undefined` e escreve o que não devia) e um `mensagemDoErro()` que estreita `unknown`;
    os `catch (e: any)` das três rotas viraram `catch (e: unknown)` com `e instanceof Error`.
  - **Os três `(error as any).details/hint/code`** de `set-access` **simplesmente saíram**: o
    `error` do Supabase já é `PostgrestError` e **já declara as três**. O cast não contornava
    tipo faltando, apagava tipo existente.
  - **`login/page.tsx:82`** — `<a href="/">` virou `<Link>`, com o import.
  - **`middleware.ts:5`** — `let` virou `const`.
  - **`OnboardingClient.tsx:56`** — `window.location.href = "/app"` virou
    `window.location.assign("/app")`. A regra `react-hooks/immutability` acusa a **atribuição**;
    `assign()` tem efeito idêntico, inclusive a recarga completa, que aqui é o que se quer.
  - **3 avisos:** `LucideIcon` e `GhostRow` não usados saíram dos imports, e a diretiva
    `eslint-disable-next-line react-hooks/exhaustive-deps` do `AdminPanel` saiu porque **não
    silenciava nada** — diretiva inútil ensina que existe uma exceção aprovada onde não existe.
  - **`ci.yml`** — o passo virou `- name: Lint` sem `continue-on-error`. **`README.md`** perdeu o
    aviso.

  **Não fiz, e é o item mais importante deste handoff:** ⚠️ **não mexi no corpo das respostas das
  rotas de admin, e elas devolvem stack trace do servidor.** Ver **R-037**. O card proíbe
  ("a task é de tipo, não de comportamento") e a regra 8 do `AGENTES.md` manda parar e perguntar.
  As duas rotas foram tipadas com o corpo **byte a byte igual**, e o R-037 está citado em
  comentário dentro das duas.

  **Descobri:** os `any` **escondiam** o achado. `{ error: e?.message, stack: e?.stack }` com
  `e: any` não chama atenção de ninguém; a mesma linha com `unknown` obriga a olhar o que sai.
  **O `try` das duas rotas abre na linha 17, a autenticação é na 30/36 e a autorização na 48/56.**
  No `set-access` a linha 18 é `await req.json()`: **um POST com JSON malformado, sem cookie
  nenhum, devolve 500 com o stack.** Não é vazamento de credencial nem furo de RLS — é
  reconhecimento gratuito da rota de maior privilégio do sistema.

  **Estado agora:** lint é rede de segurança de verdade no CI. Erro novo derruba o pipeline.

  **Bloqueios:** nenhum. **Não conferido ainda:** se os 2 testes de login rodaram verdes no CI ou
  continuaram pulados — localmente pulam, porque a máquina não tem os secrets.

  **Próximo passo óbvio:** decidir o R-037. É deleção de duas linhas mais mover o `req.json()`;
  o caro é escolher onde ele mora, porque não existe card destas rotas e a S3 é a porta natural.

  **Docs que atualizei:** `03-TAREFAS.md` (este card), `04-RISCOS.md` (R-037), `02-ESTADO.md`.

  **Commits:** _(este)_

### T-006 — Onboarding do veterinário passa a persistir
- **Estado:** ✅ **CONCLUÍDA em 31/08/2026.** Prova de persistência feita na preview pelo Elber, com `select` real. Todos os 7 critérios fechados.
- **Fase / Semana:** F3 / S2
- **Capacidade:** E2
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** T-001 ✅ (não depende da T-002)
- **Por quê:** hoje o botão "Concluir" de `app/app/veterinario/onboarding/page.tsx` só faz `update profiles set onboarding_completed = true` e **joga fora tudo que o profissional digitou nos 4 passos**. Ninguém entra na fila de validação, porque `status` continua `incomplete`. É o item 1 do DoD da F3 e é a espinha da semana: a T-007 é o mesmo padrão aplicado de novo.
- **Feito quando:**
  - [x] Server Action grava em `vet_profiles` (`nome_exibicao`, `titulo`, `crmv`, `crmv_uf`, `especialidades`, `experiencia`, `bio`, `cidade`, `estado`, `bairro`, `atende_presencial`, `atende_domiciliar`, `atende_teleorientacao`) na linha do próprio `auth.uid()`
  - [x] **WhatsApp vai para `perfil_privado`, nunca para `vet_profiles`** (SEC-002). Telefone em tabela de leitura pública entrega a base inteira pela API anônima
  - [x] A conclusão chama `concluir_onboarding_profissional()` por RPC. O `status` vira `pending_validation` **no servidor**. O cliente não escreve `status` em hipótese nenhuma: a policy levanta exceção, e é assim que tem que ser
  - [x] **Prova de persistência FEITA em 31/08**, na preview `vetria-web-n5un-git-f3-s2-...`, com a conta `contatolojalemon@gmail.com`. **`status` = `pending_validation`**, os 13 campos gravados, `whatsapp` em `perfil_privado`, `slug` nulo. Resultado completo no Resultado abaixo
  - [x] Erro do banco vira mensagem legível na tela. Hoje o caminho de erro é `redirect("...?error=1")` e a tela não mostra nada
  - [x] Nenhum `redirect()` dentro de `try/catch` (DL-016)
  - [x] Se o perfil já estiver `active`, a Action **relê `profiles.status` depois de salvar**: o trigger de revalidação (SEC-016/023) devolve o perfil para `pending_validation` quando CRMV ou documento mudam, e a resposta do update **não diz nada sobre isso**. Sem a releitura, a tela mente para um profissional que acabou de sair do ar
- **Não fazer:** não escrever `slug` (é pinado pela RLS e a regra só nasce na F4/S5). Não fazer upload de arquivo (T-008). Não tocar em `middleware.ts` nem no portão de status (S3). Não mexer no formulário do estabelecimento (T-007). Não inventar campo que a tabela não tem.
- **Resultado:**

  ## HANDOFF — vetria-backend — T-006 — 28/08/2026 _(escrito em 31/08, ver "Descobri")_

  **Fiz:** a Server Action `salvarOnboardingVet` (`app/app/veterinario/onboarding/actions.ts`,
  378 linhas, nova) grava os 13 campos públicos em `vet_profiles` por `upsert` com
  `.select().single()` (DL-011: sem isso, gravação que não alcança linha nenhuma volta sem erro
  e a tela manda a pessoa pra fila como se tivesse dado certo), o WhatsApp em `perfil_privado`
  (SEC-002), chama `concluir_onboarding_profissional()` por RPC só se ainda estiver
  `incomplete`, e **relê `profiles.status`** antes de decidir o destino (`actions.ts:355-377`).
  `campos.ts` (novo) centraliza listas, limites e tipos. `page.tsx` passou a abrir o formulário
  preenchido com o que já está no banco — sem isso, quem voltasse pra corrigir uma linha salvaria
  o formulário vazio por cima do resto. `VetOnboardingForm.tsx` passou a mostrar erro do banco em
  tela.

  **Não fiz:** **a prova de persistência**, que é o último item de DoD aberto e é manual. Ver
  Bloqueios. Não escrevi `slug`, `status`, as três colunas de estabelecimento nem as do
  documento — cada uma por um motivo diferente, listados em `actions.ts:29-42` e na tabela do
  relatório.

  **Estado agora:** o onboarding do veterinário **deixou de ser casca** — mas só na branch
  `f3-s2/onboarding-vet-e-ci`. **Produção continua rodando o código antigo, que descarta o que a
  pessoa digita.** `npm run build` verde. Lint sem dívida nova.

  **Descobri (e é o achado desta task, não do código):** **a auditoria desta task existia só nos
  comentários do código.** O `actions.ts` cita SEC-052, 054, 056, 057 e 058, e os cinco números
  não existiam em nenhum outro arquivo do repositório. A sessão de 28/08 terminou com tudo na
  árvore de trabalho, sem commit, e o relatório nunca foi escrito. Em 31/08 ele foi
  **reconstruído a partir do código** em `docs/relatorios/SEC-2026-08-28-T006.md`. ⚠️ **SEC-053 e
  SEC-055 não foram recuperados** e não aparecem em lugar nenhum. Virou o **R-034**.

  **Bloqueios:**
  1. **A prova de persistência precisa da preview da Vercel desta branch** e de uma conta `vet`
     nova, porque `concluir_onboarding_profissional()` só sai de `incomplete` uma vez.
  2. **Não há teste automatizado deste caminho** (R-033), então a prova é manual, com `select`
     rodado à mão.

  **Próximo passo óbvio:** a prova de persistência na preview. **Depois dela**, e não antes,
  `vetria-seguranca` revisa este arquivo contra a matriz de `06-PERMISSOES.md` (R-034) — porque
  **a T-007 clona este `actions.ts`**, e foi assim que o R-017 nasceu duplicado.

  **Docs que atualizei:** `02-ESTADO.md`, `03-TAREFAS.md` (este card e o da T-008),
  `04-RISCOS.md` (R-031 decidido, R-034 novo), `05-DECISOES.md` (DL-055),
  `relatorios/SEC-2026-08-28-T006.md` (novo).

  **Commits:** `445cfde` (código) · `82f59bb` (T-003, em paralelo) · `b5728ad` e `68dd2bb` (docs).

  ---

  ## ADENDO — 31/08/2026: a prova de persistência passou

  **Como foi feita:** a confirmação de email do Supabase é montada a partir do **Site URL** do
  projeto, então ela **sempre** joga a pessoa em produção, não na preview. Por isso o caminho não
  foi "cadastrar na preview": foi **cadastrar e confirmar em produção, depois LOGAR na preview** e
  preencher o onboarding lá. Login não passa por email, então a preview aceita a sessão
  normalmente. **Fica registrado porque a T-007 vai precisar do mesmo caminho.**

  **De quebra, o bug ficou documentado antes de ser corrigido.** A mesma conta passou pelo
  onboarding em **produção** primeiro, e o `select` mostrou `onboarding_completed = true`,
  `status = incomplete`, **zero linha em `vet_profiles` e zero em `perfil_privado`** — que é
  exatamente o que o código antigo faz (`22cc5cc`: um `update profiles set onboarding_completed =
  true` e mais nada). Depois, o mesmo cadastro na preview:

  | Campo | Medido | Veredito |
  |---|---|---|
  | `status` | `pending_validation` | ✅ a RPC rodou no servidor |
  | `nome_exibicao`, `crmv`, `crmv_uf` | `Elder Lucas`, `GO-0155`, `AL` | ✅ |
  | `especialidades` | `["Clínica geral"]` | ✅ array, dentro da whitelist |
  | `experiencia`, `cidade`, `estado`, `bairro` | `1a3`, `Goiânia`, `AP`, `Residencial Itaipu` | ✅ |
  | `atende_presencial` / `teleorientacao` | `true` / `true` | ✅ |
  | `whatsapp` | preenchido, **em `perfil_privado`** | ✅ SEC-002 |
  | `slug` | `null` | ✅ pinado pela RLS |
  | `titulo`, `bio` | `null` | ✅ opcionais, não preenchidos |
  | `cnpj`, `razao_social`, `responsavel_tecnico` | `null` | ✅ **por construção**: se não fossem, a guarda da SEC-044 teria levantado e o save teria falhado |

  **As duas guardas de entrada foram exercitadas à mão e as duas seguraram:** concluir sem
  nenhuma forma de atendimento é barrado, e concluir sem CRMV é barrado, os dois com alerta em
  vermelho na tela.

  ⚠️ **O que a prova revelou de novo, e não é elogio:** o formulário aceita perfil **sem nenhum
  canal de contato** e aceita **cidade e UF que não combinam** (`Goiânia` com `AP` passou). Os
  dois produzem um profissional aprovado que o produto não consegue entregar. **Virou o R-036** —
  não é regressão desta task, é buraco que ela deixou visível.

  ---

  ## NOTA DE CORREÇÃO — 15/09/2026, pelo `vetria-escriba` (SEC-071 / R-050)

  A revisão do clone da T-007 registrou que *"o handoff da T-006 carrega a mesma frase"* sobre o
  destino de quem conclui o onboarding. **Ele não carrega:** o Resultado acima nunca afirmou isso,
  e a frase errada existia só no handoff da **T-007**, onde foi corrigida no mesmo dia. **Fica
  registrado para ninguém procurar o que não está aqui.**

  **O que vale para o veterinário é o comportamento, e ele fica escrito agora, porque é o mesmo par
  de arquivos:** `concluir_onboarding_profissional()` escreve `status = 'pending_validation'` **e**
  `onboarding_completed = true` no **mesmo `update`**
  (`supabase/migrations/0002_nucleo.sql:753-755`), e `app/app/page.tsx:20` só manda pro onboarding
  quem tem `onboarding_completed` **falso**. Logo o vet que concluiu e digita `/app` **não volta pro
  formulário e não vai pra `/aguardando`: vai pra `/app/veterinario`, o painel** — que não lê
  `profiles.status` (**R-038**) e renderiza para quem está em `pending_validation`. **Nada vaza
  hoje** (as 8 páginas são casca), e **é a lacuna que a T-016 fecha**, não um detalhe de navegação.

### T-013 — Medir se o editor renderiza `select` que não é o último comando, e só então mexer nas três sondas
- **Estado:** ✅ **concluída em 31/08/2026** — medida rodada pelo Elber, `42` apareceu, achado derrubado
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟢 pra medir (é um `select` de leitura, em rollback) · 🟡 se a correção das sondas for necessária
- **Agente dono:** vetria-backend
- **Depende de:** nada. ⚠️ **Deixou de ser pré-requisito da T-002 em 26/08:** a migration foi aplicada e as 18 sondas foram rodadas **com o veredito lido na tela**, uma a uma. Isso não invalida o achado — invalida a urgência. O card vira **acompanhamento**: conserta o arquivo de verificação para a próxima vez que alguém o rodar (reversão da `0003`, ambiente novo, ou a `0004` copiando o padrão)
- **Por quê:** SEC-046. As sondas 3, 7C e 9 do `verificar-apos-0003.sql` terminam em `rollback;` **depois** do `select` que carrega o veredito. O próprio arquivo declara, em `:49-50`, que "o editor do Supabase mostra só o resultado da última query" — e usa esse modelo para justificar o select pós-`commit` da migration. Sob o mesmo modelo, o último comando dessas três é `rollback`, que não devolve linha, e o veredito some. **É a SEC-035 com o canal trocado, e nasceu dentro da correção da SEC-038.** A Sonda 3 é a pior das três: sucesso é `0`, falha é qualquer número maior, e os dois casos são "Success" com o mesmo aspecto.
- **Feito quando:**
  - [x] Rodado no dashboard em **31/08/2026**. **`42` APARECEU** — o SQL Editor devolveu uma tabela com a coluna `prova` e o valor `42`
  - [x] **`42` apareceu, então o achado caiu inteiro.** Muda **uma frase** do cabeçalho do arquivo de verificação, dizendo que `select` dentro de transação revertida aparece sim. Fim do card
  - [x] ~~**Se `42` não aparecer:**~~ **não se aplica.** as sondas 3, 7C e 9 adotam o padrão que as 10, 10B e 13B já usam (tabela temporária + `select` como último comando, fora de transação), com a troca de papel saindo por `perform set_config('role','anon',true)` em vez de `set local role`
- **Não fazer:** ⚠️ **não mexer nas três sondas antes de medir.** Reescrever sonda que já funciona é como se fabrica achado na rodada seguinte (R-016). Não tocar nas 7A e 7B: elas esperam **erro** como sucesso, e erro aparece em vermelho. Não tocar nas 10, 10B e 13B: o padrão delas está certo.
- **Resultado:**

  ## HANDOFF — vetria-backend — T-013 — 31/08/2026

  **Fiz:** nada no código. A task era uma medição, e a medição foi feita pelo Elber no SQL
  Editor do projeto: `begin; select 42 as prova; rollback;` **devolveu uma tabela com `prova` =
  `42`**. O modelo que sustentava a SEC-046 estava errado: o editor mostra o resultado do último
  comando **que devolve linhas**, e `rollback` não devolve nenhuma. **As sondas 3, 7C e 9
  funcionam como estão.**

  **Não fiz:** não reescrevi as três sondas, que era o caminho alternativo do card. Fazer isso
  seria exatamente o R-016 — reescrever sonda que já funciona é como se fabrica achado na
  rodada seguinte.

  **Descobri, e é mais interessante que o resultado:** ⚠️ **a correção já estava no arquivo,
  escrita em 26/08 no commit `a68251d`.** O cabeçalho de `verificar-apos-0003.sql:50-56` já
  dizia, com estas palavras, que o `42` imprime na tela e que as três sondas não deviam ser
  reescritas. **Só que no mesmo dia, no mesmo commit, o R-026 registrava que a medição NÃO tinha
  sido registrada, e este card continuava pedindo que ela fosse feita.** Ou seja: o arquivo
  afirmava um número que ninguém tinha medido. **Hoje o número bateu — mas isso é sorte, não
  processo.** Um arquivo de verificação que afirma medição não feita é o mesmo defeito que a
  SEC-025 descreve em sonda: parecer verificado sem ter sido. **Virou o R-035.**

  **Estado agora:** nenhuma mudança de arquivo foi necessária. O cabeçalho já está correto, e
  agora tem evidência atrás dele.

  **Bloqueios:** nenhum.

  **Próximo passo óbvio:** nenhum a partir daqui. O R-027, o R-028 e o R-030 continuam abertos e
  **não são fechados por esta medição** — eles são sobre o texto da `0003` e do pré-voo, não
  sobre o que o editor renderiza.

  **Docs que atualizei:** `03-TAREFAS.md` (este card), `04-RISCOS.md` (R-026 fechado, R-035 novo).

  **Commits:** _(este)_


### T-002 — Bucket de documentos no Storage
- **Estado:** ✅ **concluída em 26/08/2026** — `0003_storage_documentos.sql` **aplicada em produção**
- **Fase / Semana:** F3 / S2 _(escorregou da S1)_
- **Capacidade:** E1
- **Nível:** 🔴 presencial — foi aplicada em sessão com o Elber, como a regra exige
- **Agente dono:** vetria-backend + Elber
- **Depende de:** T-001 ✅ · T-009 a T-012 ✅
- **Por quê:** validação de CRMV é manual pelo admin (V1) e precisa do documento em algum lugar seguro. Sem bucket não havia T-008, e o item 3 do DoD da F3 (admin aprova) não tinha o que olhar.
- **Feito quando:**
  - [x] Bucket `documentos` criado, **privado** — Sonda 1: `public = false`, 10 MiB, os quatro MIME, **0 objetos dentro**
  - [x] **Sem policy alguma** em `storage.objects` — Sonda 2: RLS ligada em `storage.objects` e `storage.buckets`, **zero policy**, lista de policies nula. ⚠️ **Este critério foi reescrito em 26/08.** Ele pedia "policy: o dono lê e escreve no próprio prefixo `<uuid>/`", e essa linha foi **superada pela decisão de zero policy** tomada na sessão da própria T-002 (DL-054)
  - [x] **Provado que zero policy é zero** (SEC-034) — Sonda 2 mais **Sonda 4**: `rolbypassrls` é `true` em `service_role` e `postgres`, `false` em `anon` e `authenticated`. O modelo é medido, não suposto. Sonda 3: `anon` conta 0 objetos no bucket
  - [ ] Acesso por URL assinada com expiração curta, nunca por URL pública — **não é verificável nesta task e passa inteiro pra T-008.** O bucket está vazio e não existe rota que emita URL. O que a T-002 entregou é a condição que torna isso possível: nenhum caminho alternativo de leitura existe
  - [x] Limite de tamanho e whitelist de MIME definidos e registrados em `05-DECISOES.md` — **DL-052**
  - [x] **Regra do nome do arquivo documentada** (SEC-028) — seção 2.b passo 5 da `0003`: o nome é **gerado pelo servidor**, a extensão é derivada do tipo real detectado, e o formato é o que o CHECK exige, `^<uuid>/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$`
  - [x] Confirmado no banco que o trigger de carimbo está no lugar — Sonda 12: os **quatro** triggers em `perfil_privado`, incluindo o `trg_perfil_privado_dado_de_estabelecimento` novo, e RLS ligada nas sete tabelas do `public`. Sonda 11: `carimbo_segue_o_hash` = `true`, ou seja o corpo que está rodando é o que recarimba quando o hash muda
- **Aproveite a sessão aberta:** decidir a **SEC-020 / R-018**. ✅ **Decidido e aplicado.** Ver Resultado 4 e DL-053.
- **Não fazer:** não subir documento nenhum (T-008); não criar bucket público de foto de perfil (R-019). ✅ Nenhum dos dois foi feito: o bucket saiu da sessão com **zero objeto** dentro.
- **Resultado (1 — 26/08/2026, `vetria-backend`): SQL escrito, nada aplicado ainda.**
  - Entregues: `supabase/migrations/0003_storage_documentos.sql` e `supabase/verificar-apos-0003.sql`. O `supabase/backup-antes-da-0003.sql` já existia.
  - **Decisões do Elber nesta sessão, embutidas no arquivo:** (a) o bucket não tem policy nenhuma em `storage.objects`; (b) 10 MiB e quatro MIME; (c) `razao_social`, `cnpj` e `responsavel_tecnico` descem para `perfil_privado`, e `endereco`, `cep`, `cidade` e `estado` continuam públicos, agora por `comment on column` e não por omissão.
  - **Consequência que a T-008 herda:** o dono deixa de ler o próprio documento direto do Storage. A autorização vira rota de servidor (seção 2.b).
- **Resultado (2 — auditoria da v1, 26/08/2026, `vetria-seguranca`): 🔴 REPROVADA para aplicação.**
  - Relatório: `docs/relatorios/SEC-2026-08-26-0003.md`. **13 achados, SEC-033 a SEC-045**: quatro 🟠, nove 🟡, nenhum 🔴. Commit de docs: `7c44c08`.
  - **Reprova estreita, e o motivo importa: não era o SQL de dado.** Ordem de execução, cópia, varredura de dependência e reversão foram percorridas contra o schema real e estavam corretas. O que reprovou foram **salvaguardas que não faziam o que o comentário dizia** — o padrão do R-016, o mesmo que reprovou a `0002` duas vezes.
  - **Os quatro bloqueantes viraram card:** T-009 (SEC-033), T-010 (SEC-034), T-011 (SEC-035), T-012 (SEC-036). **Viraram risco:** R-020 a R-025.
- **Resultado (3 — auditoria da v2, 26/08/2026, `vetria-seguranca`): ✅ APROVADA para aplicação.**
  - Relatório: `docs/relatorios/SEC-2026-08-26-0003-v2.md`. **6 achados novos, SEC-046 a SEC-051**: um 🟠, cinco 🟡, nenhum 🔴. Commit de docs: `84fcd46`.
  - **Os quatro bloqueantes fecharam com prova.** A v2 acrescentou 785 linhas (810 → 1598) e o arquivo de verificação foi de 14 para **18 sondas**, sem introduzir um único erro de SQL. O 🟠 virou a **T-013**; os cinco 🟡 viraram **R-027 a R-031**.
- **Resultado (4 — APLICAÇÃO EM PRODUÇÃO, 26/08/2026, sessão presencial com o Elber): ✅ NO BANCO, verificada por 18 sondas.**
  - **Commits:** `a68251d` versiona os três `.sql` que estavam só no disco de uma máquina (a migration, o backup e o arquivo de verificação): até esse commit, produção tinha um schema que o repositório não descrevia, que é o **R-006**. Mais `7c44c08` e `84fcd46` (as duas auditorias) e o commit de docs desta rodada, que registra a aplicação e traz DL-052 a DL-054.
  - **Select de resultado da própria migration (seção 9.c), as onze colunas:** `bucket_privado`, `bucket_10mib`, `bucket_mime_ok`, `zero_policy_no_storage`, `colunas_sairam_do_publico`, `colunas_chegaram_no_privado`, `checks_do_documento`, `check_all_or_nothing` e `quatro_triggers_no_privado` **todas `true`**, e **`copia_linhas = 0`**.
  - **O que passou a existir no banco:** bucket privado `documentos` (10 MiB; `application/pdf`, `image/jpeg`, `image/png`, `image/webp`; **zero policy**); `razao_social`, `cnpj` e `responsavel_tecnico` **fora** de `clinic_profiles` e **dentro** de `perfil_privado`; `documento_hash` (sha256) e `documento_tamanho` com CHECK all-or-nothing; `responsavel_tecnico`, `endereco`, `cep`, `cidade` e `estado` na revalidação; e a guarda que impede conta não-`clinic` de gravar dado de estabelecimento.
  - **⚠️ Os dois `md5(prosrc)` novos, que são o que o pré-voo da `0004` vai precisar** (também em `supabase/migrations/README.md`, que é onde a próxima migration procura):
    - `revalidar_ao_mudar_dado_sensivel` → `4f6d1130f05888eb9b47e7cc4a2ef538`
    - `carimbar_envio_documento` → `5b3f7ca858e6c31d0436afc100d401c4`
    - Valores **de antes** da `0003`, só referência histórica: `035f8c64c139f2b6e1865341b4995fb7` e `ec641daea0efa102859b787d364a98ad`.
  - **As 18 sondas, todas verdes. O que merece ficar registrado:**
    - **7A e 7B: o dado está atrás de duas portas independentes, e por motivos diferentes.** `anon` selecionando `cnpj` de `clinic_profiles` recebe **`42703: column "cnpj" does not exist`** — não é permissão negada, a coluna **não existe mais**: a SEC-020 foi fechada na raiz, não escondida. `anon` em `perfil_privado` recebe **`42501: permission denied`**.
    - **7C é o ator plausível que a `0002` não tinha como medir:** conta logada lê a própria linha (1), lê **zero** linhas de outra conta, e o `auth.uid()` lido bate com a conta que espiava — o claim plantado funcionou, então a sonda não mediu porta soldada.
    - **Sonda 9: a busca pública não quebrou.** `anon` vê o estabelecimento quando `active` (1) e para de ver quando ele volta para a fila (0). Era o que a SEC-014 quase derrubou na `0002`.
    - **Sonda 10, sete linhas OK, e a linha do `documento_hash` é a SEC-033 fechada na prática:** `cnpj`, `razao_social`, `responsavel_tecnico`, `documento_hash` e `documento_tamanho` devolvem o perfil para `pending_validation`; `telefone` e `email_contato` não. **Trocar os bytes de um documento aprovado agora derruba o perfil, o que ontem não acontecia.**
    - **Sonda 10B, doze linhas OK**, ramos do vet e do clinic intactos. ⚠️ **A linha 5 (`vet_profiles.cidade` continua `active`) é a assimetria deliberada:** o estabelecimento que muda de cidade volta para a fila, o veterinário não. Está na tela de propósito e **continua sendo pergunta em aberto** (R-018, DL-053).
    - **Sonda 13B, três linhas OK:** conta `vet` gravando `cnpj` levanta exceção; conta `clinic` grava normal; conta `vet` grava telefone normal. **A SEC-044 fechada sem pegar caminho legítimo junto.**
    - **Sonda 11:** `carimbo_segue_o_hash`, `revalidacao_segue_o_hash`, `responsavel_tecnico_vigiado` e `endereco_vigiado` todos `true`. O catálogo confirma que as condições estão no corpo que está rodando, não só no arquivo.
    - **Sonda 8, nada se perdeu:** `clinic_profiles 0` · `perfil_privado 0` · `com_dado_migrado 0` · `com_documento 0` · `com_hash 0` · `contas_auth 18` · `profiles 18`, com `com_hash` igual a `com_documento`.
  - **O que a aplicação NÃO resolveu, e continua aberto:** a **SEC-041 item 1** (em MEI e em quem atende em casa, `endereco` e `cep` são o endereço residencial, e nada no schema, no formulário ou no consentimento distingue os dois casos) e a **assimetria do `vet_profiles`**. As duas são pergunta de produto, sem resposta escrita, e vencem **antes do perfil público da F4/S7**. Seguem no R-018 e no DL-053. SEC-039, SEC-042, SEC-047 e SEC-049 a SEC-051 continuam como estavam.
  - **Decisões registradas:** **DL-052** (10 MiB, whitelist de MIME e as quatro listas que mudam juntas), **DL-053** (o que é privado e o que é vitrine em `clinic_profiles`) e **DL-054** (zero policy em `storage.objects`). O **DL-051 continua 🔵**: a metade dele que é banco está aplicada, a metade que é rota é a T-008.

### T-009 — Amarrar a linha do banco ao objeto que está no bucket
- **Estado:** ✅ concluída em 26/08/2026
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟠 — decisão de arquitetura, pergunta antes de escrever código
- **Agente dono:** vetria-backend + Elber
- **Depende de:** nada (é pré-requisito da T-002)
- **Por quê:** SEC-033. A revalidação da SEC-023 está amarrada ao **texto** de `documento_path`. Trocar os bytes no mesmo caminho não muda a string, não dispara o trigger e não carimba data: o perfil aprovado segue `active` exibindo um documento que ninguém conferiu. É o cheque em branco vitalício da SEC-016 voltando pela porta que a `0003` abre.
- **Feito quando:**
  - [ ] Decidido e registrado em `05-DECISOES.md` **como** a linha se amarra ao objeto: caminho imutável por envio, upload sem `upsert`, e algo que o bucket controle guardado na linha (não só o caminho)
  - [ ] Respondido no card: **o token de `createSignedUploadUrl` permite `upsert` na versão do SDK que a T-008 vai usar, e quanto tempo ele vive?** Sem essa resposta a decisão é chute
  - [ ] O card da T-008 passa a dizer, explicitamente, que a rota **nunca reemite URL de upload para caminho que já existe**
  - [ ] Tratado o caso de negação de serviço: caminho apontando pra objeto inexistente não pode virar 404 mudo na fila do admin
- **Não fazer:** não escrever a rota de upload (é a T-008). Não criar policy de Storage "só pra resolver isso": a decisão de zero policy está tomada e reabri-la é assunto do Elber, não efeito colateral de card.
- **Resultado:** 🟡 escrito na `0003` v2, **não aplicado**, volta pro `vetria-seguranca` (R-016). A linha passa a guardar a identidade dos BYTES: `perfil_privado.documento_hash` (sha256 hex, CHECK de 64 caracteres) e `documento_tamanho` (inteiro, teto igual ao `file_size_limit` do bucket), mais o CHECK `perfil_privado_documento_completo` (caminho, hash e tamanho vivem e morrem juntos: documento sem identidade deixa de ser estado válido). O ramo `perfil_privado` do trigger de revalidação passa a vigiar as duas colunas novas, e `carimbar_envio_documento` passa a recarimbar `documento_enviado_em` quando o hash muda (era o "carimbo da conferência que aconteceu sobre o arquivo antigo"). O caminho vira imutável por envio: epoch em **milissegundos**, sem `upsert`, e caminho que já existe é ERRO e não sobrescrita (seção 3 e passo 6 da 2.b). O token de upload deixou de existir (ver T-012), então o primeiro vetor da SEC-033 morreu na arquitetura, e a pergunta do card sobre tempo de vida e `upsert` do `createSignedUploadUrl` deixou de ter objeto. **Medido em produção em 26/08:** o ramo `perfil_privado` da função é literalmente `new.documento_path is distinct from old.documento_path`, só a string. SEC-033 confirmada contra o banco, não contra o repo.
  **✅ FECHADO em 26/08 pela 2ª auditoria** (`SEC-2026-08-26-0003-v2.md`): os três CHECKs foram exercitados estado a estado e aguentam os parciais (hash sem path barrado, path sem tamanho barrado, tamanho 0 e negativo barrados, arquivo de zero byte barrado pelo par). **Ressalva registrada como SEC-048 / R-028:** `add column if not exists` com CHECK inline é **uma** instrução, então se a coluna já existir o Postgres pula o CHECK junto, e não há pré-voo para as cinco colunas novas. Probabilidade baixíssima e não bloqueia; o conserto é um pré-voo 1.9 de três linhas.

### T-010 — O pré-voo da `0003` exige zero policy de verdade
- **Estado:** ✅ concluída em 26/08/2026
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟡 — o arquivo **não está aplicado**; mostra o diff. Aplicar continua 🔴, dentro da T-002
- **Agente dono:** vetria-backend
- **Depende de:** nada (é pré-requisito da T-002)
- **Por quê:** SEC-034. O pré-voo 1.3 aborta só se a policy **citar a string** `documentos`. Policy sem filtro de `bucket_id` alcança todos os buckets, não contém essa string, e é a forma que os templates do painel do Supabase geram. Se existir uma legada, a partir da T-008 qualquer conta logada lê documento de identidade de toda a base — com a migration declarando por escrito que a superfície é zero.
- **Feito quando:**
  - [ ] Rodada no dashboard, e o resultado colado neste card: `select policyname, cmd, roles, qual, with_check from pg_policies where schemaname='storage' and tablename='objects';` **Se vier qualquer linha, a migration não roda até alguém decidir o que fazer com ela**
  - [ ] O pré-voo 1.3 aborta com **zero policy em `storage.objects`, ponto**. Sem `like '%documentos%'`
  - [ ] A Sonda 2 do `verificar-apos-0003.sql` trata `policies_no_storage > 0` como **falha**, e o comentário que hoje diz que "não é falha automática" sai
- **Não fazer:** não apagar policy de storage por conta própria. Se aparecer alguma, ela é de alguém, pra alguma coisa: descobrir qual antes.
- **Resultado:** ✅ corrigido na `0003` v2 (não aplicada). **Consulta rodada no dashboard em 26/08: veio VAZIO** — zero policy em `storage.objects` hoje, então o cenário de exploração da SEC-034 não existe no banco atual e a correção vale como endurecimento, não como conserto de exposição ativa. Está escrito assim no comentário do pré-voo 1.3, com data. O pré-voo agora aborta com **qualquer** policy em `storage.objects`, sem filtro por string, e imprime nome, `cmd` e `roles` de cada uma. A Sonda 2 trata `> 0` como falha, o texto que a desqualificava saiu, e ela ganhou uma coluna com os nomes encontrados. Anotado nos dois arquivos: quando a F4/S7 criar o bucket público de foto, a regra muda de "zero policy" para "nenhuma policy sem filtro de `bucket_id`", e os dois lugares mudam juntos.
  **✅ FECHADO em 26/08 pela 2ª auditoria:** a 1.3 agora exige zero policy, ponto. **SEC-034 encerrada.**

### T-011 — As sondas da `0003` passam a reportar o que descobrem
- **Estado:** ✅ concluída em 26/08/2026
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** nada (é pré-requisito da T-002)
- **Por quê:** SEC-035. A Sonda 10 é a que justifica o arquivo de verificação, e ela fala por `raise notice`. No Studio do Supabase o resultado é "Success. No rows returned" **tanto quando o trigger passa quanto quando falha**. É o degrau seguinte do DL-050: execução que não reporta não é execução.
- **Feito quando:**
  - [ ] Rodado no dashboard, e o resultado anotado: `do $$ begin raise notice 'teste de notice'; end $$;` — **se o texto aparecer no editor, este card encolhe pro item do pré-voo e mais nada**
  - [ ] A Sonda 10 devolve **result set**: uma linha por asserção, com uma coluna `ok` legível na tela
  - [ ] O `raise warning` do pré-voo 1.2 (RLS de `storage.buckets`) vira `raise exception`
  - [ ] Acrescentada sonda para os ramos `vet_profiles` e `clinic_profiles` do trigger reescrito. Hoje só o ramo de `perfil_privado` é testado, e `create or replace` reescreve o corpo inteiro (SEC-038)
  - [ ] Acrescentada sonda que assume o papel **`authenticated`** e prova que a conta A não lê a linha da conta B em `perfil_privado`. A 7B mede `anon`, que nunca teve grant ali (SEC-038)
  - [ ] `notify pgrst, 'reload schema';` no fim da migration (SEC-038)
  - [ ] A Sonda 9 conta só a linha que ela mesma ativou, em vez de exigir `count = 1` no total (SEC-038)
- **Não fazer:** não transformar o arquivo de verificação em suíte de teste. Ele é lido por humano no SQL Editor, uma sonda por vez, e essa é a razão de ele existir separado da migration.
- **Resultado:** ✅ corrigido nos dois arquivos (não aplicados). **O teste de NOTICE foi rodado no dashboard em 26/08 e devolveu "Success. No rows returned", sem imprimir o texto: SEC-035 CONFIRMADA.** Este card não encolheu, cresceu. Varredura feita: **zero** `raise notice` e **zero** `raise warning` sobraram nos dois arquivos — o `raise warning` do pré-voo 1.2 virou `raise exception`, a notice que "confirmava a cópia" na seção 5 saiu, e as cinco notices da Sonda 10 saíram. A Sonda 10 acumula `(ordem, cenario, esperado, obtido, veredito)` numa tabela temporária e termina em `select`. Sondas novas: **7C** (`authenticated` de outra conta lendo `perfil_privado` alheio, com controle positivo para não medir porta soldada), **10B** (ramos `vet_profiles` e `clinic_profiles`, com controle negativo em `bio`, `sobre` e `site`) e **13B** (a guarda da SEC-044). A Sonda 9 conta só o alvo que ela mesma ativou e ganhou controle negativo: o mesmo alvo, fora de `active`, tem que sumir. `notify pgrst, 'reload schema'` entrou antes do `commit`. E a migration ganhou um `select` de resultado **depois do commit**, com uma coluna booleana por consequência: é o único canal de saída dela. **Limite honesto anotado no arquivo:** o recarimbo de `documento_enviado_em` quando o hash muda NÃO é verificável por sonda, porque `now()` é o timestamp da transação e dentro de um rollback o valor antigo e o novo são o mesmo; ficou coberto pelo catálogo (Sonda 11) e pelo item (d) da Sonda 14.
  **✅ FECHADO em 26/08 pela 2ª auditoria**, nos quatro itens da SEC-038, e o limite honesto do recarimbo foi julgado **procedente**: `now()` é o timestamp da transação, então a asserção pedida na v1 reprovaria um banco correto. **Ressalva que virou card:** a entrega do resultado das sondas 7C e 9 (e da 3) é a **SEC-046 / T-013** — as três terminam em `rollback` depois do `select` do veredito. As 10, 10B e 13B **não** são afetadas: o padrão delas está certo e foi inventado neste card.

### T-012 — Decidir a arquitetura de upload, e corrigir o que o card da T-008 promete
- **Estado:** ✅ concluída em 26/08/2026
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟠 — decisão de arquitetura, pergunta antes
- **Agente dono:** vetria-backend + Elber
- **Depende de:** nada (é pré-requisito da T-002 e da T-008)
- **Por quê:** SEC-036. A seção 2.c da `0003` diz que a validação de MIME do servidor é "a primeira porta" e a whitelist do bucket é "a segunda". Com `createSignedUploadUrl` **não existe primeira porta**: o cliente faz PUT direto no storage-api, o byte nunca passa pelo Next.js, e tudo que o servidor pode validar é uma string que o cliente mandou antes. As duas portas são a mesma, e é a fraca. O risco caro não é o vazamento: é a **T-008 ser escrita acreditando num controle que não tem**.
- **Feito quando:**
  - [ ] Decidido e registrado em `05-DECISOES.md`: ou o upload passa pelo servidor de verdade (primeira porta existe, ao custo de trafegar até 10 MiB pela função), ou se aceita por escrito que a validação é **declarativa** e a defesa real é a whitelist mais a origem separada
  - [ ] O comentário da seção 2.c da migration passa a dizer o que o desenho de fato faz
  - [ ] O card da T-008 é corrigido pra não prometer validação que o desenho escolhido não entrega
  - [ ] Registrado no card **o que continua fechado**, pra ninguém reabrir por engano: `image/svg+xml` e `text/html` estão fora das duas whitelists, e a URL assinada vive em `*.supabase.co`, origem diferente da do app. **O R-004 não reabre.**
  - [ ] Acrescentado ao card da T-008 o passo que falta na seção 2.b: **registrar em `audit_logs` (`acao = 'documento_visualizado'`) antes de devolver a URL assinada do documento de terceiro** (SEC-040)
- **Não fazer:** não implementar o upload aqui. Este card decide e escreve; quem constrói é a T-008.
- **Resultado:** ✅ decidido pelo Elber em 26/08 e escrito nas seções 2.b e 2.c da `0003` v2. Falta o DL em `05-DECISOES.md`, que é do `vetria-escriba`. **O upload passa por um Route Handler nosso:** a rota lê os bytes, confere a **assinatura mágica** do tipo real (não o `content-type` declarado), deriva a extensão do tipo detectado, gera o caminho, escreve com `service_role` e só então grava a linha com caminho, sha256 e tamanho. `createSignedUploadUrl` **não é usada em lugar nenhum** e nenhum token de escrita chega ao cliente. Com isso a "primeira porta" da 2.c deixou de ser mentira: ela é o passo 4 da rota, sobre os bytes. Custo aceito por escrito: até 10 MiB trafegam pela função, num arquivo por profissional, uma vez. A 2.c passou a listar **quatro** listas que mudam juntas (MIME do bucket, extensão do CHECK, tabela de assinatura mágica, limite de bytes) e traz os magic numbers de pdf, jpeg, png e webp. Registrado que **o R-004 não reabre**: `image/svg+xml` e `text/html` estão fora de todas as listas, e a URL assinada vive em origem diferente da do app. A rota de leitura ganhou o quinto passo da SEC-040 (grava `documento_visualizado` em `audit_logs`, com o dono em `alvo_id`, **antes** de emitir a URL) e o tratamento do 404 mudo na fila do admin.
  **✅ FECHADO em 26/08 pela 2ª auditoria: SEC-036 encerrada.** O julgamento acrescentou uma precisão que passa a valer: com o upload pela nossa rota, **a whitelist do bucket deixa de ser porta e vira alarme** sobre o nosso próprio código, porque quem declara o `content-type` passamos a ser nós. A defesa contra atacante é a assinatura mágica. **R-004 continua fechado por três barreiras independentes:** SVG não tem assinatura mágica e não entra na tabela do passo 4; `.svg` está fora da whitelist de extensão do CHECK; e o objeto é servido de `*.supabase.co`, origem diferente da do app.
  **O DL que faltava foi registrado: DL-051.**
  **Achado novo herdado pela T-008: SEC-051 / R-031** — o passo 8 não diz com qual cliente grava a linha, e com `service_role` o `actor_id` de `audit_logs` sai nulo.

### T-005 — Onboarding profissional estoura a largura da tela
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** removido o `-m-6 sm:-m-8` de `VetOnboardingForm.tsx:92` e `ClinicOnboardingForm.tsx:69`, e o `min-h-[calc(100vh-4rem)]` virou `min-h-screen`. A margem negativa furava o padding de um container pai que deixou de existir quando os onboardings saíram do route group `(painel)`. Varredura confirmou que eram as duas únicas ocorrências no `app/`. Build verde.

### T-004 — Auditoria de segurança inicial (linha de base)
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** virou auditoria da própria migration `0002`, em **4 rodadas**. Relatório em `docs/relatorios/SEC-2026-08-26.md` (2854 linhas). Achou 2 críticos (responsável entrava na busca como veterinário; base de telefones vazava pela API), 12 altos e vários médios. Alimentou R-011 a R-017 e as decisões DL-049 e DL-050.

### T-001 — Migration 0002: núcleo de dados
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** `0002_nucleo.sql` aplicada em produção. Criou `profiles.status` e `status_motivo`, `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais`, `contatos`, `audit_logs`, com RLS codificando `06-PERMISSOES.md`. Mais `is_admin()`, `perfil_esta_ativo()`, `tem_role()`, `admin_definir_status()`, `concluir_onboarding_profissional()` e dois triggers de revalidação. Removeu `current_user_role()` (INVOKER sem search_path, mina do DL-014), `is_admin_master()` (duplicata, fecha R-005) e a policy `profiles_update_own_safe` (superada, e mantê-la anularia o pin de `status`).
- **Auditoria:** 4 rodadas. v1 reprovada com 2 críticos (responsável entrava na busca como veterinário; base de telefones vazava pela API). v2 fechou os dois e abriu quatro nas próprias correções, incluindo um que desligaria a busca pública inteira sem aparecer em teste com usuário logado. v5 aprovada. Relatório: `docs/relatorios/SEC-2026-08-26.md`, 2854 linhas.
- **Descoberto ao aplicar:** a migration **não rodava**. `perfil_esta_ativo()` é `LANGUAGE sql` e consulta `profiles.status`, mas era criada antes da coluna existir. As 4 auditorias revisaram semântica e autorização; nenhuma percorreu a ordem de execução contra um banco real. Corrigido trocando as seções 2 e 3 de lugar.
- **Verificado:** 9 sondas. Destaques: busca pública funciona para o anônimo (Sonda 2 = 1); `perfil_privado` inacessível ao anônimo; o profissional **não** consegue se auto-aprovar (WITH CHECK levanta); travessia de caminho e SVG barrados; 18 contas e 18 profiles depois de um cadastro real de ponta a ponta.
- **Commits:** `2846ec2` → `52bd9b9`

### T-000b — Baseline do schema atual versionado
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** `0000_baseline.sql` versiona o schema que existia antes desta pasta (fecha R-006). Corrigiu três coisas que a documentação afirmava errado: `profiles` **tem** `full_name` e `phone` (o DL-019 dizia que não); `master` não é role, é `admin_level`; o enum `admin_level` é `('none','admin','master')` e `comum` nunca existiu, o que torna o R-002 item 3 improcedente.

### T-000 — Instalar sistema de governança e agentes
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** `docs/` criado (escopo congelado, plano de 13 semanas, estado, tarefas, riscos, decisões, protocolo de agentes). 6 agentes definidos em `.claude/agents/`. `HANDOFF.md` reescrito como protocolo de entrada de sessão. `CONTEXT.md` e `BACKLOG.md` congelados como histórico.

---

## REGRAS DA FILA

1. **Sem capacidade E1–E6, não entra.** Ideia sem capacidade vai pra `04-RISCOS.md` §Ideias.
2. **Uma task 🔵 por vez** entre os agentes que escrevem código. Auditores rodam quando quiserem.
3. **Achado de auditoria vira card** — nunca correção direta no meio de outra task.
4. **Task que cresce, para.** Se a real for maior que o card, marca ⏸️, escreve o que descobriu e pergunta. Não segue empurrando.
5. **Card sem "Resultado" preenchido não é ✅.** Task sem rastro é task que ninguém vai conseguir continuar.
