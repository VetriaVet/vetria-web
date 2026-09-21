# 03 — QUADRO DE TAREFAS

> Fila viva. **Uma task em execução por vez** no que escreve código.
> Atualizado por quem executa, no início e no fim de cada task.
>
> **Semana atual:** **S4, aberta em 21/09/2026** · **Anterior:** a **S3, FECHADA em 20/09** —
> ver o bloco de fechamento abaixo · **Fase:** F3 · **Entrega:** 25/11/2026
>
> ### 🎉 20/09/2026 — o PR #2 foi mergeado, e a `main` voltou a andar depois de 20 dias
>
> `eb6e2d6` na `main`: **14 commits, 61 arquivos, +7512 −619**. Entraram **T-007**, **T-016** e
> **T-008**, os três funis de cadastro consertados, o `/ajuda` do **DL-058**, o pré-voo do
> `ci.yml` (**R-053**) e a suíte de testes indo de **15 para 40**. O CI rodou os **40, todos
> verdes** — a primeira vez na história do projeto que a suíte inteira executa e passa.
>
> ⚠️ **E o custo, dito em número:** antes disso a `main` estava em **`e07f967`, de 31/08**.
> **Vinte dias de calendário sem uma linha de código em produção.** O trabalho existia — estava
> escrito, revisado e aprovado, na árvore — e não estava no ar. **O gargalo desta fase não foi
> escrever; foi mergear.** Se a S4 repetir isso, a fase termina com código pronto e produto
> parado, que é a forma mais cara de atraso que existe.
>
> ⚠️ **Divergência de doc corrigida aqui, porque o código é a verdade:** este quadro e o
> `02-ESTADO.md` diziam, em 16/09, que *"o último commit da `main` continua sendo `451b2e4`"*.
> **Não era.** `git log --first-parent main` mostra a `main` pulando direto de **`e07f967`
> (31/08)** para **`eb6e2d6` (20/09)**: `451b2e4` era o topo da **branch**, não da `main`. O
> número que o quadro citava estava errado, o fato que ele descrevia estava certo — e era
> **pior** do que o quadro dizia.
>
> ### 🔴 Precisa de sessão presencial com o Elber — AGENDE
>
> 1. **A T-017 é migration.** Continua 🔴, continua **sem data**, e continua sem começar. É a
>    quarta semana seguida em que ela aparece aqui. **Prazo duro: dentro da F3** — depois da
>    F4/S7 a coluna `clinic_profiles.site` vira link clicável em página pública e a correção
>    deixa de ser preventiva. **Agende.**
> 2. **A T-026** (WhatsApp gravado antes do conserto do R-041) é 🟢 para **medir** e 🔴 para
>    **corrigir**: `update` em dado de produção não acontece sem o Elber na sala. **Meça
>    primeiro** — se der zero, a sessão nem precisa existir.

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

_(vazio)_

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
| **3** | **Admin aprova → o veterinário entra no dashboard e recebe o email** | **Nenhuma. `/admin/validacoes` é casca e não há uma linha escrita.** Não há o que provar | ❌ **NÃO FECHADO** → S4, cards **T-023** e **T-024** |
| **4** | Um responsável logado que digite `/app/veterinario` é redirecionado | Na mesma passada de 20/09: a conta `vet` digitando `/app/estabelecimento` e `/admin` **foi devolvida ao painel dela**. É o mesmo mapa de prefixo do `middleware.ts`, exercitado em dois cruzamentos, mais o teste *"a conta vet nao entra no painel do estabelecimento nem no admin"* verde no CI | ✅ **o mecanismo está provado** · ⚠️ **a passada literal com conta `tutor` não foi feita** — é **uma navegação**, e está na fila da S4 como medição |
| **5** | Teste E2E cobrindo 1 a 4 passando em CI | CI de 20/09: **40 testes, todos verdes** — a primeira execução completa da suíte na história do projeto. `portao-status.spec.ts` (10) e `onboarding-vet.spec.ts` (9) nasceram nesta semana | 🟡 **parcial, e a parte que falta é nomeada:** cobre os itens 2 e 4. **O item 1 continua sem E2E** (**R-033**: conta nova a cada rodada) e o item 3 não existe para ser testado |
| **6** | Relatório de segurança da fase **sem achado 🔴 aberto** | Três relatórios na fase: `SEC-2026-09-15-T007` (🔴 0 · 🟠 0 · 🟡 3), `SEC-2026-09-16-T016` e `SEC-2026-09-16-T008` (🔴 0 · 🟠 1 · 🟡 9). **Zero 🔴 em todos** | ✅ **fechado** · ⚠️ o 🟠 que sobra é a **SEC-081** (volume e limpeza do bucket), virou **T-020**, e tem trava escrita: **antes do primeiro profissional de fora** |

### ⛔ A F3 FECHA COM 5 DE 6. Ela NÃO é uma fase concluída, e este quadro não vai chamá-la assim.

**Decisão do Elber, registrada em DL-059.** O item 3 — *admin aprova, o profissional entra e
recebe o email* — **não tem uma linha escrita** e vai para a **S4**, que é exatamente onde o
`01-PLANO.md` sempre o colocou. **Não é escorregão de escopo: é a fase acabando com a semana que
faltava dentro dela.**

**Por que não se força o item 3 em dois dias:** foi assim que a dívida da S2 nasceu — código
escrito no limite, sem tempo de prova, parado na árvore por semanas. E **declarar a fase
"concluída" com 5 de 6 é o R-034 outra vez**: doc que afirma mais do que aconteceu, que é o
mecanismo pelo qual este projeto já perdeu duas auditorias de vista.

**O que isso obriga:** o `/roadmap`, que é a janela dos donos, passa a dizer **F3 em andamento,
5 de 6, item 3 na S4** — e **não** "F3 concluída". Ver o handoff de 20/09.

---

# ⬜ FILA — F3 / S4 (aberta 21/09/2026) · a última semana da fase

> **Semana aberta pelo `vetria-maestro` em 21/09.** **4 cards na fila**, mais quatro que correm
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
> | 4 | **T-021** a varredura de órfãos para de chamar órfão de esperado | é **doc**, é o conserto de dois cards, e é a única rede sob o buraco que a T-008 admitiu por escrito | 🟢 |
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
>    fechar a T-008** e que ninguém rodou. ⚠️ Rode **depois** da T-021: hoje a consulta
>    classifica órfão real como "esperado".
> 3. **O `select` do WhatsApp sujo** (T-026), que diz se isso é dado de teste ou dado de gente.

### T-023 — `/admin/validacoes` lê a fila real e o detalhe abre o documento
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S4
- **Capacidade:** **E3** — *"`/admin/validacoes` lista fila real, abre o documento"* (`00-ESCOPO.md` §2)
- **Nível:** 🟡 — páginas de admin, leitura de dado de terceiro, mais de 3 arquivos
- **Agente dono:** vetria-backend (a leitura) + vetria-ui (a tela) · **auditoria obrigatória:** vetria-seguranca
- **Depende de:** **T-008 ✅** (é ela que põe documento no bucket e escreve `documento_path`) · **T-007 ✅** e **T-016 ✅**, que são quem produz `pending_validation` de verdade
- **Por quê:** o item 3 do DoD da F3 não tem uma linha escrita, e ele é metade do `00-ESCOPO.md` §1: *"um profissional consegue se cadastrar, preencher o perfil, **ser validado por um admin** e aparecer na busca"*. Hoje a tela é casca e a fila existe só no banco.
- **Feito quando:**
  - [ ] `/admin/validacoes` lista **`status = 'pending_validation'`**, das duas personas, com o filtro **no servidor** e paginação. Estado vazio honesto, **sem dado fake**
  - [ ] O detalhe mostra o que o admin precisa para decidir: os campos públicos de `vet_profiles`/`clinic_profiles` **e** os privados de `perfil_privado` (CRMV, CNPJ, razão social, responsável técnico) que a matriz §5 dá a admin e master
  - [ ] **Abrir o documento passa por `/api/documentos/abrir`**, que já existe, já grava `audit_logs` antes de devolver a URL e já assina por **60 segundos**. **Não escrever uma segunda rota de leitura.** Não usar `next/image` em nada vindo de usuário (R-004)
  - [ ] **"Sem documento" é estado de primeira classe na lista:** a SEC-088 provou que dá para concluir sem enviar, e enquanto a T-022 não for decidida a fila recebe esses cadastros
  - [ ] **Leva o R-054 junto, e são 3 linhas:** `/admin/usuarios` passa a exigir `admin_level === 'master'` **no servidor** (`redirect("/app")`), e o `else` da renderização some por ter ficado inalcançável. A matriz §2 diz ❌ para admin comum, e **esta é a semana que cria a persona "admin comum"**
  - [ ] Nada de `service_role` na página. A leitura é do admin, sob RLS, pelas policies que a `0002` já escreveu
- **Não fazer:** não escrever aprovação nem reprovação aqui (é a T-024). Não tocar em `/api/admin/set-access`. Não construir moderação nem conteúdo. Não escrever migration.
- **Resultado:** _(a preencher)_

### T-024 — Aprovar e reprovar com motivo, o email, e a trilha em `audit_logs`
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S4
- **Capacidade:** **E3** — *"aprovar ou reprovar. Aprovar muda o status pra `active` e dispara email"*
- **Nível:** 🟡 — escreve `profiles.status` de terceiro e dispara email. ⚠️ **Vira 🔴 se pedir migration ou policy nova.** A RPC `admin_definir_status` já existe (`0002:697-712`) e é por ela que a escrita passa. **Se alguém propuser escrever `profiles.status` direto da aplicação, para:** `status` nunca é escrito fora da RPC, e nunca pelo próprio usuário
- **Agente dono:** vetria-backend · **auditoria obrigatória:** vetria-seguranca
- **Depende de:** **T-023** — não se aprova o que não se lê
- **Por quê:** **é o item 3 do DoD da F3, e é o único que falta.** Sem ele o profissional entra na fila e nunca sai: a T-016 fechou as portas do painel para `pending_validation` e **não existe nada no produto que mova alguém para `active`**
- **Feito quando:**
  - [ ] Aprovar → `status = 'active'` **pela RPC `admin_definir_status`**, nunca por `update` direto · Reprovar → `incomplete` + `status_motivo` preenchido, que é o contrato que a `0002:702-712` já escreveu
  - [ ] **Motivo obrigatório na reprova.** Reprova sem motivo é o laço mudo do **R-051**
  - [ ] **O R-051 fecha aqui, e esta é a outra metade dele:** o `page.tsx` do onboarding das **duas** personas passa a ler `status_motivo` e a **exibi-lo** quando `status = 'incomplete'` e o motivo não for nulo. É leitura da própria linha, **sem migration e sem policy**. Hoje o reprovado recebe formulário em modo "novo", reenvia o mesmo dado, e a fila recicla
  - [ ] **Email de aprovação e email de reprova com o motivo.** Os 3 emails do app estão versionados e **desligados esperando a F3**; saem de `contato@vetriabrasil.com.br` pelo Resend, que já está verificado
  - [ ] **`audit_logs` registra toda ação de admin**, com `actor_id` preenchido. ⚠️ `authenticated` **não tem INSERT em `audit_logs`** (`0002` §11b): a trilha sai por `service_role`, com `actor_id` **explícito**, como a rota `/api/documentos/abrir` já faz
  - [ ] **Prova em tela, e ela é o item 3 do DoD:** aprovar a conta `vet` de teste que está em `pending_validation` desde 31/08 → ela **entra no dashboard** → **o email chega**. Registrada aqui, com o que aconteceu
  - [ ] E2E do caminho, na medida em que o **R-033** permitir. Se não permitir, o teste fica **escrito e pulando com o motivo escrito** — nunca verde à toa
- **Não fazer:** não escrever `status` fora da RPC. Não mandar email para endereço de gente que não é conta de teste. Não construir suspensão em massa. Não encostar no enum de `role` (DL-043).
- **Resultado:** _(a preencher)_

### T-025 — O caminho de volta ao onboarding existe na interface
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S4
- **Capacidade:** **E2** — *"o que o vet/estabelecimento digita no onboarding persiste e reaparece"*. Reaparecer só para quem sabe a URL não é reaparecer
- **Nível:** 🟡 — são as duas `aguardando/page.tsx` e provavelmente os dois `perfil`; passa de 3 arquivos
- **Agente dono:** vetria-ui
- **Depende de:** **T-016 ✅** (é ela que decide quem alcança `/onboarding`, e ela **deixa entrar**: a constante `ONBOARDING` e o teste *"/onboarding continua alcancavel para quem espera validacao"* provam isso)
- **Por quê:** **medido no código em 20/09: não existe um único `href` para `/onboarding` em `app/` nem em `components/`.** O **DL-046** promete por escrito que *"enquanto espera, ele edita"*, os dois portões deixam passar, o formulário abre preenchido com o dado do banco desde a T-006/T-007 — **e o único jeito de chegar lá é digitar a URL na barra de endereço.** A capacidade existe e o produto não a oferece
- **Feito quando:**
  - [ ] `/aguardando`, nas duas personas, tem um caminho visível para rever e corrigir o cadastro
  - [ ] O texto diz a verdade sobre o que acontece ao salvar de novo. ⚠️ **Não prometa o que não foi decidido:** mexer em `crmv`, `crmv_uf` ou `nome_exibicao` dispara o trigger de revalidação (`0002:379-386`) e devolve o profissional para a fila. **Isso ainda não está decidido nem escrito** — é a T-019, F6/S11 — então a tela **não promete** que editar é grátis
  - [ ] **Sem travessão** no texto visível (DL-038). Sem dado fake. Estado vazio honesto
  - [ ] O link **não aparece** para quem a matriz §4 não deixa entrar: `suspended` vai para `/bloqueado` e fica lá, que é o que impede laço de redirect
- **Não fazer:** **não construir o editor de perfil** — é a **T-019**, cortada para a F6/S11 por decisão do Elber em 16/09 (DL-056), e ressuscitá-la por inércia é exatamente o que o corte existe para impedir. Não mexer em `lib/auth/status.ts`: o portão já deixa passar; o que falta é o link.
- **Resultado:** _(a preencher)_

### T-021 — A varredura de órfãos para de classificar órfão real como "esperado" (SEC-083)
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S4
- **Capacidade:** **E1** — núcleo de dados: o que sobe para o Storage tem que ser rastreável
- **Nível:** 🟢 — **não é código.** São dois cards em `docs/03-TAREFAS.md`
- **Agente dono:** vetria-escriba
- **Depende de:** nada
- **Por quê:** **SEC-083.** A coluna `classe` do `select` decide por comparação de tempo e só reconhece o órfão **mais novo** que o último envio bem-sucedido. O órfão **mais velho** — que é o caso normal de falha: envia A às 10:00, o processo morre entre o passo 7 e o 8, reenvia B às 10:05 e o 8 grava — cai no `else` e é rotulado **"VERSÃO ANTERIOR DE REENVIO (esperado)"**. **A única rede sob o buraco que o backend admitiu por escrito não pega o caso mais provável dele**, e a medição que *"fecha o assunto no dia"* fecha errado. Segundo defeito no mesmo `select`: `split_part(o.name,'/',1)::uuid` num `left join` — **um objeto com primeiro segmento que não seja uuid derruba a query inteira**
- **Feito quando:**
  - [ ] O `select` do item 3 da seção 🔒 da **T-008** para de prometer classificação que o dado não sustenta: devolve `dono_uuid`, `created_at` e `enviado_em_da_linha` e **deixa o humano decidir**. É a saída (a) do relatório, e é **uma linha a menos**, não a mais
  - [ ] O cast para `uuid` acontece **depois** do filtro de `bucket_id` e de um `~` de uuid, numa subconsulta
  - [ ] **A mesma correção no card da T-018** (F6/S11), que copia a consulta. Duas cópias divergindo em silêncio é o defeito de origem do R-039
  - [ ] Fica escrito, nos dois cards, que **criar histórico de caminhos é migration, é 🔴, e é outro card** — não se resolve aqui
- **Não fazer:** não escrever migration. Não escrever cron. Não rodar a varredura — rodar é do Elber e é 🟢; **apagar o que ela achar é 🔴**.
- **Resultado:** _(a preencher)_

### T-020 — Teto de volume, cota e limpeza do bucket `documentos` (SEC-081) 🟠
- **Estado:** ⬜ **fila, correndo por fora da S4.** ⛔ **Trava escrita: fechada ANTES de o onboarding ser aberto para conta de fora.** Enquanto só houver conta de teste, não bloqueia nada
- **Fase / Semana:** F3 / S4 se couber; **senão F6/S11, junto com a T-018**
- **Capacidade:** **E1** mais a transversal obrigatória **LGPD** (`00-ESCOPO.md` §2)
- **Nível:** 🟡 — é a rota, e é `/api/*`. ⚠️ **Vira 🔴 se a saída escolhida for apagar objeto**
- **Agente dono:** vetria-backend · **auditoria obrigatória:** vetria-seguranca
- **Depende de:** **T-008 ✅**
- **Por quê:** **SEC-081, o único 🟠 aberto da auditoria da T-008.** A rota limita o **tamanho de cada arquivo** (10485760, conferido duas vezes) e **não limita mais nada**: nem número de envios, nem total por conta, nem taxa. Cada envio gera caminho novo, e a `0003` §3 decidiu, por escrito, que **o objeto anterior não é apagado**. Cadastro com email descartável nasce `incomplete`, que está em `PODEM_ENVIAR` de propósito, e um laço de `curl` com um arquivo válido de 10 MiB produz **mil objetos, ~10 GB, 999 sem linha que os aponte**. **Não é vazamento** — o bucket tem zero policy. É **custo sem teto e retenção indevida de documento de identidade**, que é o R-023 acontecendo na criação e em escala
- **Feito quando** — direção, não desenho fechado:
  - [ ] Teto de envios por conta por janela, decidido **no servidor**, lendo a contagem de objetos sob o prefixo `<uuid>/` **antes** do passo 7
  - [ ] ⚠️ **Se a saída escolhida for apagar a versão anterior, isso contraria a `0003` §3** (*"o admin pode precisar comparar o que aprovou com o que chegou depois"*) e **vira decisão registrada em `05-DECISOES.md`**, não conserto de rota. E apagar objeto é 🔴
  - [ ] Conferir se o plano do Supabase oferece cota de bucket, antes de escrever código que a emule
- **Não fazer:** não escrever cron. Não antecipar a rotina de exclusão da T-018. Não baixar o teto de 10 MiB sem falar com o produto: documento de identidade fotografado por celular passa de 4 MB com facilidade.
- **Resultado:** _(a preencher)_

### T-022 — DECISÃO DO ELBER: a obrigatoriedade do documento vive na Server Action ou na fila do admin? (SEC-088)
- **Estado:** ⬜ **fila, correndo por fora. É uma decisão, não uma implementação.** Sai como linha em `05-DECISOES.md`
- **Fase / Semana:** F3 / S4 — **antes da T-023, se possível:** é ela que define se a fila precisa tratar "sem documento" como estado de primeira classe
- **Capacidade:** **E3** — é a qualidade da fila que o admin valida
- **Nível:** 🟠 — escopo ambíguo, pergunta antes
- **Agente dono:** o `vetria-maestro` leva, **o Elber decide**
- **Depende de:** nada
- **Por quê:** **SEC-088.** Hoje a obrigatoriedade do documento é **regra de tela**: o botão de concluir fica `disabled` sem `documento_enviado_em`, e as duas `actions.ts` **não conferem documento nenhum**. Duas portas, e a primeira nem é ataque: (1) DevTools, remover o `disabled`, clicar — a Action roda, chama a RPC, e o profissional entra em `pending_validation` **sem documento**; (2) POST com `Next-Action`, que o portão de rota não alcança. **Não vaza dado e não cruza usuário** — o admin simplesmente reprova. O custo é **operacional**. ⚠️ **A alternativa que não pode ficar é a de hoje: nenhuma das duas está escrita em lugar nenhum**
- **Feito quando:**
  - [ ] O Elber escolhe **uma**: **(a)** a Server Action passa a exigir `documento_enviado_em` não nulo antes de chamar a RPC — fila limpa, e a pessoa **trava no passo 4** se o upload falhar; ou **(b)** a fila do admin assume o filtro, e a T-023 mostra "sem documento" como estado de primeira classe
  - [ ] A escolha vira **DL** em `05-DECISOES.md`, com "o que se perde" escrito
  - [ ] Se for **(a)**, vira uma linha no card das duas Actions e **volta ao `vetria-seguranca`** — aperto de autorização também volta para revisão
- **Não fazer:** não implementar as duas. Não deixar a decisão implícita no código de quem chegar primeiro.
- **Resultado:** _(a preencher)_

### T-026 — O WhatsApp gravado antes do conserto do R-041 continua sujo
- **Estado:** ⬜ **fila, correndo por fora.** 🟢 **para medir** (é um `select`, e é do Elber) · 🔴 **para corrigir** (`update` em dado de produção)
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
- **Resultado:** _(a preencher)_

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
- **Estado:** ⏸️ **aguardando sessão presencial com o Elber. AGENDE. ⚠️ Carregada da S3 para a S4 em 21/09, sem data pela quarta semana seguida — e a F3 acaba nesta semana.** O card mora aqui, na fila, e não em BLOQUEADAS, porque ele **não bloqueia ninguém** — quem está bloqueado é ele, pela agenda
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

**21/09 — a S4 tem um card ⏸️, e é o mesmo de sempre: a T-017.** O card dela mora **na fila**,
não aqui: ela é 🔴, é migration e espera sessão presencial com o Elber — mas **não bloqueia
nenhuma outra task**. Quem está bloqueado é ela, pela agenda, **pela quarta semana seguida**, e
o prazo duro dela é **dentro da F3, que acaba nesta semana**. **🔴 Agende.**

**Nada mais na fila da S4 espera terceiro.** T-007, T-008 e T-016 fecharam em 20/09 e estão em
✅ CONCLUÍDAS. As quatro medições que faltam (a conta `tutor`, a varredura de órfãos, o `select`
do WhatsApp e a decisão da T-022) **são do Elber e não bloqueiam nenhum card** — nenhuma delas
impede a T-023 de começar hoje.

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
  - [ ] **A varredura de órfãos entra na rotina**, e é a mesma consulta escrita no card da **T-008**, item 3 da seção 🔒 (`left join` de `storage.objects` com `perfil_privado` por `documento_path`, classificando conta apagada · órfão do passo 8 · versão anterior de reenvio). Ela é o segundo par de olhos sobre a T-008 e a única rede quando o processo morre entre os passos 7 e 8
  - [ ] **Rodar a varredura é 🟢** (`select`). **Apagar o que ela encontrar é 🔴** e só com o Elber presente
  - [ ] Decidir e registrar em `05-DECISOES.md` o que acontece com o documento de quem é excluído **enquanto ainda está na fila de validação**, e por quanto tempo o objeto sobrevive à conta (retenção). Hoje não há resposta escrita
- ⚠️ **21/09 — o pressuposto deste card MUDOU: o bucket deixou de estar vazio em 20/09.** A T-008 subiu e há documento de identidade real dentro de `documentos` (conta de teste, mas real: 64 hex de hash, 15683 bytes). O *"hoje o bucket está vazio"* de baixo **descreve um mundo que acabou** — fica registrado como a data em que este risco deixou de ser preventivo e virou retenção. A convenção `<uuid>/` **foi cumprida** pela T-008, que é o que torna a varredura possível. ⚠️ **A consulta copiada neste card tem o defeito da SEC-083** e é corrigida pela **T-021**, na S4: até lá ela classifica órfão real como "esperado".
- **Não fazer:** não escrever cron. Não antecipar esta task para a F3 — ~~**hoje o bucket está vazio** e não há documento de gente real para ficar órfão~~ (verdade até 20/09) — o que a T-008 tinha que garantir era que a convenção de caminho continuasse sendo `<uuid>/`, **e garantiu**.
- **Resultado:** _(a preencher na F6)_

---

# ✅ CONCLUÍDAS

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

  **3. Como um órfão é detectado depois de nascer: um `select` no SQL Editor — e ele só é possível porque a T-002 fixou o caminho `<uuid>/`.**
  `storage.objects` é tabela, e `perfil_privado.documento_path` guarda exatamente o `name` do objeto (é o que o CHECK `perfil_privado_documento_do_dono` amarra). Então a varredura é um `left join`:

  ```sql
  -- VARREDURA DE ÓRFÃOS do bucket `documentos`. Só leitura. SQL Editor, produção.
  select o.name                        as caminho,
         split_part(o.name, '/', 1)    as dono_uuid,
         o.created_at,
         (o.metadata->>'size')::bigint as bytes,
         case
           when pf.id is null then 'CONTA APAGADA (R-023)'
           when pp2.documento_path is null then 'ORFAO DO PASSO 8 (R-042)'
           when o.created_at > pp2.documento_enviado_em then 'ORFAO DO PASSO 8, em reenvio (R-042)'
           else 'VERSAO ANTERIOR DE REENVIO (esperado)'
         end as classe
    from storage.objects o
    left join public.perfil_privado pp  on pp.documento_path = o.name
    left join public.profiles       pf  on pf.id  = split_part(o.name, '/', 1)::uuid
    left join public.perfil_privado pp2 on pp2.id = split_part(o.name, '/', 1)::uuid
   where o.bucket_id = 'documentos'
     and pp.id is null
   order by o.created_at;
  ```

  - **Zero linha = zero órfão.** É essa a medição que fecha o assunto no dia.
  - ⚠️ **A classificação não é enfeite:** a `0003` §3 decidiu, por escrito, que **o caminho antigo NÃO é apagado no reenvio** (o admin pode precisar comparar o que aprovou com o que chegou depois). Logo, **todo reenvio legítimo aparece nesta varredura**. Sem a coluna `classe`, a varredura vira ruído e, três meses depois, ninguém a roda. `VERSAO ANTERIOR DE REENVIO` é esperado; as outras três classes são para agir.
  - **Quem roda e quando:** o Elber, no SQL Editor. **(a)** uma vez ao fechar a T-008, com o resultado colado no Resultado do card; **(b)** toda vez que a fila do admin da S4 mostrar *"documento não encontrado no armazenamento"*; **(c)** dentro da **T-018**, antes de a rotina de exclusão da F6/S11 existir.
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
  --   `documento_path`. A consulta está no card da T-008 e no card da exclusão de
  --   dados da F6 (T-018 / SEC-039). Reenvio legítimo aparece nela, porque o
  --   caminho antigo não é apagado: a consulta classifica, e quem varre não
  --   confunde as duas coisas. APAGAR o que ela encontrar é destrutivo e só
  --   acontece com o Elber presente.
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
