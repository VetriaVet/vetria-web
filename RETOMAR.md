# RETOMAR — onde a sessão parou

> **Escrito em 21/09/2026.** Este arquivo é curto de propósito e tem **prazo de validade**:
> ele vale enquanto as pendências abaixo existirem. Quando elas fecharem, apague ou reescreva.
>
> **Ele não substitui nada.** O protocolo de entrada continua em [`HANDOFF.md`](HANDOFF.md), o
> estado do projeto em [`docs/02-ESTADO.md`](docs/02-ESTADO.md) e a fila em
> [`docs/03-TAREFAS.md`](docs/03-TAREFAS.md). Isto aqui é só o **bilhete na porta da geladeira**.

---

## O prompt pra colar numa sessão nova

```
Leia RETOMAR.md e docs/02-ESTADO.md. Estou voltando pra continuar
a S4 da F3. Me diga o que está pendente e o que eu preciso fazer.
```

⚠️ **Abra a sessão na pasta certa**, senão os 6 agentes não existem:
`cd "C:/Users/Elber Desinger/Desktop/Vetria/Vetria Brasil"`. Confira com `/agents` —
`vetria-maestro` tem que aparecer.

---

## 1. Estado do git, e ele é a primeira coisa a conferir

```
4a355b0  feat(T-023): /admin/validacoes le a fila real     ← LOCAL, não empurrado
1fbabcb  docs: a S3 fechou, a S4 abriu                     ← LOCAL, não empurrado
eb6e2d6  Merge pull request #2  (F3/S3)                    ← este está na origin
```

**Dois commits locais que nunca foram empurrados**, e foi de propósito: push na `main` dispara
deploy em produção, e os dois esperam prova em tela. A árvore está **limpa**.

Confira ao voltar:
```bash
git log --oneline origin/main..HEAD    # esperado: 2 commits
git status --short                      # esperado: vazio
```

**A `main` na origin está em `eb6e2d6`, de 20/09**, e é o que está em produção: T-007, T-016,
T-008, os três cadastros, o `/ajuda` e 40 testes verdes no CI.

---

## 2. O que a F3 ainda deve: **1 item de 6**

| # | Item do DoD | Estado |
|:-:|---|---|
| 1 | Cadastro → onboarding → sair e voltar → os dados estão lá | ✅ nas duas personas |
| 2 | O profissional vê "aguardando" e não entra no dashboard | ✅ medido em tela |
| 3 | **Admin aprova → ele entra no dashboard e recebe o email** | ❌ **é o que falta** |
| 4 | Responsável logado em `/app/veterinario` é redirecionado | ✅ mecanismo medido · ⚠️ a passada literal com conta `tutor` nunca foi feita |
| 5 | Teste E2E cobrindo 1 a 4 no CI | 🟡 40 verdes, mas o item 1 segue sem E2E (R-033) |
| 6 | Relatório de segurança sem 🔴 aberto | ✅ 5 relatórios, zero 🔴 |

**A F3 fecha com 5 de 6 e o roadmap diz "em andamento"** — decisão registrada no **DL-059**, com o
motivo. O item 3 é a **T-024**, e ela está destravada por duas decisões que ainda não foram
tomadas (seção 4 abaixo).

---

## 3. O que o Elber precisa fazer — **4 coisas, ~7 minutos**

> Nada disto depende de código novo. Tudo já está escrito e esperando prova.

### 3.1 · Abrir `/admin/validacoes` no preview · 2 min

Com a conta **admin**, no preview da branch (ou local com `npm run dev`). As contas criadas em
20/09 têm que aparecer, e o documento tem que abrir.

⚠️ **Por que esta é a mais importante das quatro:** RLS não devolve erro, devolve zero linha. Uma
policy derrubada e um dia sem fila **produzem exatamente a mesma tela**. Enquanto houver conta em
`pending_validation`, **a tela cheia é a única prova de que as policies estão lá.**

### 3.2 · A medição da T-017 · 2 min

O card inteiro da T-017 nasceu de **leitura de policy e nunca foi executado contra o banco**, e ele
mesmo diz: *"se o PATCH for recusado, este card encolhe ou morre."*

Peça ao Claude o `curl` exato. O teste é mandar um `PATCH` direto na API do Supabase, com conta de
teste no preview, tentando gravar `estado = 'ZZ'` em `vet_profiles`.

- **Recusado** → a T-017 encolhe ou morre, e não precisa de sessão presencial
- **Aceito** → é 🔴 de verdade, e aí a sessão vale, já sabendo o que consertar

### 3.3 · A passada com conta `tutor` · 30 seg

Logar como responsável e digitar `/app/veterinario`. **Fecha o item 4 do DoD ao pé da letra** — o
que foi medido foi o cruzamento inverso (`vet` → clinic e `vet` → admin).

### 3.4 · Dois `select` · 1 min

```sql
-- WhatsApp legado (R-055): linhas gravadas antes do conserto do R-041
select id, whatsapp from perfil_privado
where whatsapp is not null and whatsapp !~ '^[0-9]+$';

-- a pré-condição do SEC-093: existe linha de perfil_privado cujo dono não é profissional?
select p.role, count(*) from perfil_privado pp
join profiles p on p.id = pp.id group by 1;
```

⚠️ **A varredura de órfãos da T-008 NÃO deve ser rodada ainda.** Rode só **depois da T-021**: hoje
a consulta do card classifica órfão real como "esperado" (SEC-083).

---

## 4. Três decisões que travam a T-024

A **T-024** herda `carregarCadastro()` exatamente como está. Estas respostas precisam existir
**antes**, não depois.

### 4.1 · SEC-092 — qual é o escopo de leitura do admin?

O detalhe de `/admin/validacoes/<uuid>` **não filtra `status`**. Entrega o dossiê completo de
qualquer `vet`/`clinic` por uuid, em qualquer estado, para sempre. Depois da T-024, todo aprovado
vira um uuid conhecido, e os uuids se acumulam no trabalho normal do admin.

- **(a)** O detalhe só abre quem está em `pending_validation`, e a moderação ganha tela própria
- **(b)** Mantém o acesso amplo porque é o que moderar exige — **e aí a trilha do SEC-091 vira
  obrigatória**, e a matriz §5 ganha uma linha dizendo isso

**É pergunta de matriz, não de código.** A matriz muda antes do código, sempre.

### 4.2 · T-022 / SEC-088 — documento obrigatório onde?

Hoje o botão de concluir desabilita sem documento, mas **a Server Action continua gravando sem
ele**. Por DevTools ou por POST direto, dá pra entrar na fila sem enviar nada.

- **(a)** Exigir na Action → a fila nasce limpa, e a pessoa trava no passo 4 se o upload falhar
- **(b)** A fila do admin filtra → a S4 mostra "sem documento" como estado de primeira classe

**A alternativa que não pode ficar é a de hoje: nenhuma das duas está escrita.**

### 4.3 · R-058 / SEC-089 — instalar `server-only`?

Uma linha em `lib/supabase/admin.ts`, o arquivo que carrega a chave de `service_role`. Transforma
*"essa chave nunca vai pro cliente"* de disciplina em **erro de build**. É dependência nova
(`npm i`), por isso não foi feito sozinho.

---

## 5. A fila da S4, em ordem de dependência

| Card | O quê | Estado |
|---|---|---|
| **T-023** | a fila real do admin | ✅ escrita, auditada, **aguardando prova em tela** |
| **T-024** | aprovar/reprovar + motivo + email + `audit_logs` · **fecha o item 3** | ⬜ travada pelas decisões 4.1 e 4.2 |
| **T-025** | o link de volta ao onboarding, que não existe em lugar nenhum | ⬜ |
| **T-021** | corrigir a varredura de órfãos nos cards da T-008 e T-018 · é doc | ⬜ |

**Por fora:** T-020 (🟠 teto do bucket, trava antes do primeiro profissional de fora) · T-017 (🔴,
ver 3.2) · T-026 (WhatsApp legado, só se o `select` der mais que zero) · SEC-093 (migration, 🔴,
candidato a andar junto com a T-017).

---

## 6. O que a sessão anterior aprendeu, e não pode se perder

**Três bugs foram achados por prova em tela, e nenhum dos cinco relatórios de segurança pegou:**

1. **O WhatsApp do veterinário nunca foi normalizado.** Um `select` do Elber devolveu
   `62 992653278` com espaço, e `62992653278` para o estabelecimento. A T-007 escreveu a
   normalização só no arquivo dela, e as três auditorias liam o do estabelecimento. **É o R-017
   pela terceira vez: clone herda defeito.** A função virou `lib/contato/whatsapp.ts`, uma só para
   os dois.
2. **Um teste lia `innerText()` contra um elemento com `text-transform: uppercase`** e comparava
   com regex sensível a maiúscula. Derrubou o CI na primeira execução real dos 40.
3. **O dado velho sobreviveu ao conserto.** Normalização vale na escrita, então a linha já gravada
   continuou suja até o dono salvar o perfil. **O teste cobrou e segurou o merge.**

**A regra que vale mais que qualquer parecer, e está escrita em todos os cards:** neste projeto
**risco não fecha porque o código existe, fecha quando o comportamento muda em tela.**

**E duas correções de fato** que a sessão descobriu e vale não repetir: a `main` **nunca esteve em
`451b2e4`** (aquilo era o topo da branch — ela ficou **20 dias** parada, não 11), e o item 4 do DoD
**não foi medido ao pé da letra**.

---

## 7. Onde está cada coisa

| Preciso de... | Está em |
|---|---|
| Como entrar no projeto | `HANDOFF.md` |
| Onde o projeto está hoje | `docs/02-ESTADO.md` |
| A fila e os cards | `docs/03-TAREFAS.md` |
| Riscos abertos | `docs/04-RISCOS.md` |
| Por que decidimos X | `docs/05-DECISOES.md` (DL-059 é o mais recente) |
| Quem acessa o quê | `docs/06-PERMISSOES.md` |
| As 5 auditorias | `docs/relatorios/` |
| Como os agentes trabalham | `docs/AGENTES.md` |
