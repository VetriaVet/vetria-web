# Auditoria de segurança — T-024, aprovar e reprovar com motivo — 23/09/2026
**Escopo:** `app/admin/validacoes/[conta]/actions.ts`, `decisao.ts`, `DecisaoForm.tsx`, `[conta]/page.tsx`,
`app/admin/validacoes/fila.ts` (`carregarCadastro`), `app/admin/validacoes/page.tsx`, `app/admin/AdminEmptyScreen.tsx`,
`lib/email/validacao.ts`, `lib/supabase/admin.ts`, as duas `onboarding/actions.ts`, as duas `onboarding/page.tsx` e os
dois formulários, `package.json`, `docs/06-PERMISSOES.md` §5. Lidos contra `0002_nucleo.sql` §6/§7/§8/§11b,
`0003_storage_documentos.sql` §4/§6, `app/api/documentos/abrir/route.ts`, `app/api/documentos/upload/route.ts`,
`lib/auth/admin.ts`, o DL-061 e o Resultado do card T-024.
**Base:** árvore de trabalho sobre `051d07d`, **nada commitado** (4 arquivos novos, 14 modificados).
**Autor:** `vetria-seguranca` (somente leitura). Arquivo salvo pela sessão principal, texto do auditor.

> Primeira auditoria em que a aplicação **escreve** `profiles.status` de terceiro e **manda email para terceiro**.

## Resumo

**Dá para colocar gente real nisso hoje, com o Elber como único admin.** A Action é tri-gatada: `requireAdmin()`
no servidor, depois a releitura sob RLS exigindo `pending_validation`, depois a RPC `SECURITY DEFINER` com
`is_admin()`. O status só muda pela RPC. `redirect` está fora de `try/catch`, o email não desfaz a decisão, e
nome e motivo entram escapados. Nenhum endereço aparece em log ou URL.

O que sobra é que **as duas regras novas do DL-061 moram na aplicação e não no banco**: a decisão só sobre quem
está na fila, e o dossiê só enquanto há validação. Quem tem token de admin contorna as duas pelo PostgREST ou pela
rota do documento. Hoje isso não é explorável por ninguém além do Elber (R-014). **Precisa fechar antes do primeiro
admin comum de verdade.**

**Contagem: 🔴 0 · 🟠 2 · 🟡 4.**

---

## Achados

### SEC-096 — `admin_definir_status` aceita qualquer origem e reprova sem motivo: a regra do DL-061 e do R-051 vive só na Action · 🟠
- **Onde:** `supabase/migrations/0002_nucleo.sql:668-725` (a RPC). A conferência que falta no banco está só em
  `app/admin/validacoes/[conta]/actions.ts:151` (origem) e `:98-116` (motivo).
- **O quê:** a RPC confere `is_admin()`, o alvo `vet`/`clinic` e o master para `suspended`. **Não confere
  `status_antigo`** e **não exige `motivo`** quando o destino é `incomplete`. O banco aceita aprovar e reprovar a
  partir de qualquer origem que não seja `suspended`, e também aceita `active → pending_validation`.
- **Como explorar:** admin comum logado, com o `access_token` do próprio cookie e a `anon key` pública do bundle.
  1. `rpc/admin_definir_status` com `{"target_user_id":"<uuid incomplete>","novo_status":"active"}`: uma conta que
     nunca concluiu o cadastro nem enviou documento vira `active`.
  2. `{"novo_status":"incomplete"}` sem `motivo`: o laço mudo do R-051 de volta.
  3. `active → pending_validation`, abrir `/admin/validacoes/<uuid>`, depois devolver para `active`: **a SEC-092(a)
     contornada** com duas linhas de trilha.
- **Impacto:** "ninguém fica ativo sem passar pela fila" depende de disciplina do admin. Não é escalada de role, e
  tudo fica em `audit_logs` com `actor_id`. Por isso 🟠 e não 🔴.
- **Como corrigir:** migration. `update ... where id = target_user_id and status = 'pending_validation'` para os
  destinos `active` e `incomplete`, com `if not found then raise`; motivo obrigatório e não vazio quando o destino é
  `incomplete`. Decidir na matriz se o admin comum pode `active → incomplete` e, se puder, por ramo explícito com
  motivo obrigatório. Manter `SECURITY DEFINER` + `SET search_path = public` (DL-014/015).
- **Quando:** **depois do merge, com trava.** O diff da T-024 não piora nada: a Action é mais estreita que a RPC que
  já existia. Trava: **antes de existir admin comum que não seja o Elber.**
- **Vira task:** T-027 (🔴 migration, sessão presencial), junto com a SEC-093 e a T-017.

### SEC-097 — O dossiê "só enquanto há validação" vale na tela, não vale no documento nem no PostgREST · 🟠
- **Onde:** `app/api/documentos/abrir/route.ts:86-89` (`ehAdmin` autoriza qualquer dono em qualquer status) ·
  `0002_nucleo.sql:564-565` (`perfil_privado_select_admin`: `using (is_admin())`, sem status) × `06-PERMISSOES.md` §5.
- **Como explorar:** admin comum que já decidiu a conta X, agora `active`.
  1. `POST /api/documentos/abrir` com `{"dono":"<uuid-X>"}`: **URL assinada do documento de identidade de uma conta
     `active`**, com trilha.
  2. `GET /rest/v1/perfil_privado?id=eq.<uuid-X>&select=*`: CNPJ, razão social, responsável técnico, WhatsApp,
     telefone, email de contato, **sem trilha** (SEC-091).
- **Impacto:** a decisão de finalidade da LGPD do DL-061 fica cosmética para o dado mais sensível do produto.
- **Como corrigir:** (a) **na rota, sem migration:** quando `!ehProprio`, exigir alvo `pending_validation` e
  `role in ('vet','clinic')` sob RLS, 404 se não vier linha. 🟡, **no mesmo push da T-024**. (b) **na policy:**
  `perfil_privado_select_admin` (e as de `vet_profiles`/`clinic_profiles`, SEC-093) exigir alvo em
  `pending_validation` para admin comum, via função `SECURITY DEFINER`. Migration, na T-027.

### SEC-098 — A recusa sem documento (SEC-088) está no servidor, mas o servidor não é o único caminho · 🟡
- **Onde:** as duas `onboarding/actions.ts` (≈345-363 e ≈395-413) × `0002:730-759`
  (`concluir_onboarding_profissional`, executável por `authenticated`, não olha documento) × `0002:580-589`
  (`perfil_privado_update_own` deixa o dono escrever `documento_path`, hash e tamanho).
- **Como explorar:** (1) chamar `rpc/concluir_onboarding_profissional` direto: `pending_validation` sem documento.
  (2) `PATCH perfil_privado` com `documento_path`, hash e tamanho falsos: o trigger carimba `documento_enviado_em` e
  a conta aparece na fila **sem o badge âmbar**; abrir o documento dá erro de objeto inexistente.
- **Impacto:** operacional; não vaza dado nem cruza usuário. Mantém o 🟡 da SEC-088.
- **Como corrigir:** mover a exigência para dentro de `concluir_onboarding_profissional`, conferindo que existe
  `storage.objects` com `bucket_id = 'documentos'` e `name = documento_path`. Migration, na T-027. Até lá, corrigir o
  comentário dos formulários.

### SEC-099 — Dois admins decidindo a mesma conta ao mesmo tempo · 🟡
- **Onde:** `actions.ts:134-151` (check) → `:158` (RPC), TOCTOU; a RPC não tem `where status = ...`.
- **Impacto:** o último a escrever vence e a pessoa recebe dois emails contraditórios. Só existe com dois admins.
- **Como corrigir:** o `where status = 'pending_validation'` + `if not found then raise` da SEC-096 fecha isto.

### SEC-100 — `getUserById` sem tempo limite, depois de a decisão estar gravada · 🟡
- **Onde:** `actions.ts:247`. O `fetch` do Resend tem 8 s; a chamada ao Auth Admin API não tem limite.
- **Como corrigir:** `Promise.race` com o mesmo teto, caindo em `"falhou"`.

### SEC-101 — LGPD: email e motivo saem para operador estrangeiro, e o motivo fica em `audit_logs` para sempre · 🟡
- **Onde:** `lib/email/validacao.ts:76-92` · `0002:716-723` (`detalhe.motivo`) · `profiles.status_motivo`.
- **O quê:** o Resend passa a ser operador de dado pessoal por código (registro de operações e política de
  privacidade, transferência internacional). O motivo é texto livre sobre terceiro e fica em `audit_logs.detalhe`.
- **Como corrigir:** inventário de operadores (F6); uma frase no `DecisaoForm` orientando a não colar documento nem
  dado de terceiro no motivo; retenção de `audit_logs.detalhe` decidida na T-018.

---

## Verificado e OK

- **Autorização:** `requireAdmin()` é a primeira linha (`actions.ts:83`), redireciona fora de `try/catch`, lê o
  `role` do banco. Next confere Origin × Host (CSRF).
- **Entrada:** uuid por `ehUuid`, decisão de lista fechada, motivo `trim` + 10..1000 **no servidor**.
- **Status só pela RPC**, com a sessão do admin: `auth.uid()` vira `actor_id` na trilha, gravada na mesma transação,
  sem duplicar.
- **Releitura pós-RPC (DL-011)** antes do email. **DL-016:** o único `redirect` (`:220`) está fora de `try`.
- **URL de retorno** revalidada por lista fechada; nada de nome, email ou motivo na barra. Duplo clique cai em
  `NAO_ESTA_NA_FILA`.
- **`carregarCadastro` (SEC-092a):** filtro na cláusula do select (`fila.ts:388`), vale para o master também.
- **`status_motivo` no onboarding:** linha do próprio dono, texto React, sem `dangerouslySetInnerHTML`.
- **Email:** nome e motivo escapados, assunto fixo, `AbortController` de 8 s, a função nunca lança, nenhum `console.*`
  leva endereço, nome ou motivo.
- **`service_role`:** um só uso novo, `auth.admin.getUserById` depois da decisão gravada, só `email` consumido.
- **`server-only`** em `lib/supabase/admin.ts:7` e `lib/email/validacao.ts:1`; nenhum importador cliente.
- **Segredos:** `RESEND_API_KEY` só no servidor, sem `NEXT_PUBLIC_`; nenhuma chave na árvore nem no histórico.
- **DL-038/DL-043** respeitados.

## Não consegui verificar

1. Se a `admin_definir_status` em produção é a da `0002`:
   `select pg_get_functiondef('public.admin_definir_status(uuid,public.user_status,text)'::regprocedure);`
2. Se o Storage devolve erro em `createSignedUrl` para objeto inexistente (variante 2 da SEC-098).
3. Se já existe `perfil_privado` com `documento_path` sem objeto no bucket:
   `select pp.id from perfil_privado pp left join storage.objects o on o.bucket_id='documentos' and o.name=pp.documento_path where pp.documento_path is not null and o.id is null;`
4. O comportamento real do email: a `RESEND_API_KEY` ainda não existe.
5. Quantas contas têm `role='admin'` hoje: `select id, admin_level from profiles where role='admin';`

## Pendência herdada

**SEC-091 (trilha de leitura do dossiê)** não foi decidida na T-024 nem no DL-061. A exposição pela tela caiu com a
SEC-092(a); o PostgREST continua lendo tudo sem trilha (SEC-097). **Precisa de uma linha em `05-DECISOES.md`.**

Para o `vetria-qa`: o aviso "Esta conta já foi devolvida ao cadastro antes" (`[conta]/page.tsx:~93`) também aparece
quando o `status_motivo` veio do trigger de revalidação, e aí a frase é falsa.

---

## Veredito

> **APROVADO para commit.** 🔴 0 · 🟠 2 · 🟡 4.
>
> Nada no diff abre um caminho que não existisse antes dele. **Os dois 🟠 são o DL-061 escrito só na aplicação**, com
> a régua: **fechar antes do primeiro admin comum que não seja o Elber.** A SEC-097(a) é barata (a rota, sem
> migration) e deveria ir no mesmo push. A SEC-096, a SEC-097(b) e a SEC-098 são um card só de migration (T-027), 🔴,
> em sessão presencial.
