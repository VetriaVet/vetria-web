# RETOMAR — onde a sessão parou

> **Escrito em 21/09/2026.** Este arquivo é curto de propósito e tem **prazo de validade**:
> ele vale enquanto as pendências abaixo existirem. Quando elas fecharem, apague ou reescreva.
>
> **Ele não substitui nada.** O protocolo de entrada continua em [`HANDOFF.md`](HANDOFF.md), o
> estado do projeto em [`docs/02-ESTADO.md`](docs/02-ESTADO.md) e a fila em
> [`docs/03-TAREFAS.md`](docs/03-TAREFAS.md). Isto aqui é só o **bilhete na porta da geladeira**.

## ⏸️ ONDE PAROU EM 23/09/2026 (o Elber saiu do computador no meio do roteiro)

**Feito hoje, tudo provado em tela ou por consulta:**
- ✅ **T-023** provada: fila com 4 contas, detalhe completo, documento abriu
- ✅ **T-025** provada nas duas personas e **commitada** (`46cd9e6`). A copy do cartão de `/perfil` foi corrigida, porque a tela não lê o banco e não é prévia de nada
- ✅ **Item 4 do DoD** fechado com conta `tutor`
- ✅ **Varredura de órfãos: zero nas duas consultas** (R-042 e R-023 seguem abertos por mecanismo)
- ✅ **R-055 / T-026 fechados:** 1 WhatsApp sujo achado e corrigido pela própria interface, e a consulta voltou zero
- ➕ **R-059** novo (número do CRMV livre, cidade × estado sem conferência)

**Falta, nesta ordem:**
1. **Passo 7 · teste da T-017** (PATCH `estado = 'ZZ'` com a conta vet de teste). Peça o script ao Claude
2. **Passo 8 · as 3 decisões** da seção 4 abaixo (SEC-092, T-022, `server-only`)
3. **Push**, depois de `npm run build` verde. Leva a T-023 e a T-025 para produção

**Pedidos do Elber sem card, para o `vetria-maestro` encaixar:** a prévia real do perfil público (ler o banco, só leitura) e o botão de arquivo sempre em português (hoje é o nativo do navegador, que segue o idioma do Chrome).

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
040ab24  docs: o estado para de contar commits locais       ← LOCAL (T-021)
3c7e672  docs: o card da T-021 e o DL-060 citam o hash       ← LOCAL (T-021)
53fa96c  docs: a varredura entrega dado, nao veredito        ← LOCAL (T-021, DL-060)
4147a5d  docs: o card da T-023 para de dizer nao commitada   ← LOCAL
b14a33a  docs: RETOMAR.md                                    ← LOCAL
4a355b0  feat(T-023): /admin/validacoes le a fila real       ← LOCAL, espera prova em tela
1fbabcb  docs: a S3 fechou, a S4 abriu                       ← LOCAL
eb6e2d6  Merge pull request #2  (F3/S3)                      ← este está na origin
```

**Sete commits locais que nunca foram empurrados**, e foi de propósito: push na `main` dispara
deploy em produção, e o único de código entre eles (`4a355b0`, a T-023) espera prova em tela. Os
outros seis são doc. A árvore está **limpa**.

⚠️ **Não confira por contagem, que envelhece a cada commit.** Confira por conteúdo:
```bash
git log --oneline origin/main..HEAD    # o topo da origin tem que ser eb6e2d6
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

## 3. O que o Elber precisa fazer — **5 coisas, ~8 minutos**

> A quinta nasceu em 21/09, quando a T-021 fechou e destravou a varredura de órfãos: está no fim
> da seção 3.4.

> Nada disto depende de código novo. Tudo já está escrito e esperando prova.

### 3.1 · Abrir `/admin/validacoes` · 2 min

⚠️ **NÃO existe preview pra isso, e é fácil perder tempo procurando:** a T-023 está num commit
**local** (`4a355b0`), nunca empurrado, e branch que não sobe não gera preview na Vercel. **É
`npm run dev` e `localhost:3000/admin/validacoes`.**

Com a conta **admin**, no preview da branch (ou local com `npm run dev`). As contas criadas em
20/09 têm que aparecer, e o documento tem que abrir.

⚠️ **Por que esta é a mais importante das quatro:** RLS não devolve erro, devolve zero linha. Uma
policy derrubada e um dia sem fila **produzem exatamente a mesma tela**. Enquanto houver conta em
`pending_validation`, **a tela cheia é a única prova de que as policies estão lá.**

### 3.2 · A medição da T-017 · 2 min

O card inteiro da T-017 nasceu de **leitura de policy e nunca foi executado contra o banco**, e ele
mesmo diz: *"se o PATCH for recusado, este card encolhe ou morre."*

O teste é mandar um `PATCH` direto na API do Supabase, com a conta `vet` **de teste**, tentando
gravar `estado = 'ZZ'` em `vet_profiles`. Peça ao Claude o script, que já foi escrito uma vez com a
restauração do valor original embutida num `finally`.

⚠️ **Duas coisas que o card não diz e mudam como se lê o resultado.** (1) Não há banco de preview:
o `.env.local` aponta pro mesmo Supabase de produção (é o R-033), então **só com conta de teste**.
(2) **`200` com `[]` não é sucesso, é recusa**, porque RLS devolve zero linha em vez de erro — e só
se distingue de "não existe linha" se a leitura da própria linha for conferida **antes** do PATCH.

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

✅ **A trava da varredura de órfãos CAIU em 21/09: a T-021 fechou** (`53fa96c`, **DL-060**). A
consulta do card da T-008 parou de classificar e passou a devolver dado: `dono_ainda_existe`,
`caminho_atual_da_linha` e `enviado_em_da_linha`, **e quem lê decide**. O cast para `uuid` foi para
dentro de uma CTE filtrada, então um objeto fora da convenção `<uuid>/` **não derruba mais a query**
(ele passou a sair numa segunda consulta, que existe só pra isso).

**Então virou um quinto item de 30 segundos pra você:** rodar as **duas** consultas do item 3 da
seção 🔒 do card da **T-008**, no SQL Editor. ⚠️ **Ler o resultado não é automático, de
propósito:** `dono_ainda_existe = false` é conta apagada (R-023) e `caminho_atual_da_linha is null`
é órfão do passo 8 (R-042), as duas pedem ação. Com as **duas** colunas preenchidas, órfão do passo
8 e reenvio legítimo **têm a mesma aparência no banco de hoje** — e **mais velho não quer dizer
esperado**, que era justamente o erro que a T-021 tirou. ⛔ **Apagar o que ela achar é 🔴 e não
acontece sem sessão presencial.**

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
| **T-021** | corrigir a varredura de órfãos nos cards da T-008 e T-018 · é doc | ✅ **fechada em 21/09** (`53fa96c`, DL-060). Achou uma **terceira** cópia da promessa errada, no item 6 da T-008, que a `0004` ia copiar palavra por palavra pra dentro de uma migration |

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
