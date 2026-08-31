# 03 — QUADRO DE TAREFAS

> Fila viva. **Uma task em execução por vez** no que escreve código.
> Atualizado por quem executa, no início e no fim de cada task.
>
> **Semana atual:** **S2 aberta em 26/08** · **Anterior:** S1 ✅ fechada em 26/08 (5 de 6) · **Fase:** F3
>
> **Ordem de execução da S2:** **T-006 → T-007 → T-008.**
> **T-003 corre em paralelo do primeiro dia**, porque `vetria-qa` não disputa arquivo com ninguém.
> **T-013 vira acompanhamento:** as sondas já foram rodadas e o veredito saiu, então ela deixa
> de ser pré-requisito de qualquer coisa e vira ajuste do arquivo de verificação.
>
> ✅ **A `0003` foi APLICADA EM PRODUÇÃO em 26/08/2026** e verificada por 18 sondas, todas
> verdes. **A T-002 fechou.** Com isso **a T-008 deixou de estar bloqueada** e a T-007 deixou
> de estar impedida: as três colunas de identificação já vivem em `perfil_privado`.
> **T-009 a T-012 fecharam junto**, na v2 da migration.

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

# ⬜ FILA — F3 / S2

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

### T-007 — Onboarding do estabelecimento passa a persistir
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S2
- **Capacidade:** E2
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** **T-002 ✅** (as três colunas de identificação só existem em `perfil_privado` depois da `0003`, aplicada em 26/08) e T-006 — **e do handoff dela, não só do commit.** O formulário do estabelecimento é clone do de veterinário (foi assim que o R-017 nasceu duplicado); clonar antes de a T-006 ser revisada duplica o defeito junto. ⚠️ **31/08 — e agora depende também do R-034:** a auditoria da T-006 existia só nos comentários do código e foi **reconstruída**, não refeita. **SEC-053 e SEC-055 continuam sem dono.** Clonar este arquivo antes de uma revisão independente é literalmente o mecanismo do R-017, com a agravante de que desta vez sabemos que o registro está incompleto
- **Por quê:** mesmo buraco da T-006, no outro painel. Sem isso, metade dos profissionais que a Vetria vende não chega na fila de validação.
- **⚠️ Este card foi corrigido em 26/08.** Ele mandava gravar `razao_social`, `cnpj` e `responsavel_tecnico` em `clinic_profiles`. **Depois da `0003` esses três vivem em `perfil_privado`.** O impedimento acabou: a migration rodou no mesmo dia, e a Sonda 7A mediu em produção que `anon` selecionando `cnpj` de `clinic_profiles` recebe `42703: column "cnpj" does not exist`. **A coluna não existe mais**, então escrever pro schema antigo agora é que quebra.
- **Feito quando:**
  - [ ] Server Action grava em `clinic_profiles` **só o que é público**: `nome_fantasia`, `endereco`, `cep`, `cidade`, `estado`, `sobre`, `servicos`, `site`
  - [ ] **`razao_social`, `cnpj` e `responsavel_tecnico` vão pra `perfil_privado`**, na linha do próprio `auth.uid()` (`0003`, SEC-020 / R-018). Nunca em tabela de leitura pública
  - [ ] **Nada de CNPJ no `signUp`.** Tirar o campo `cnpj` do `data` em `app/cadastro/estabelecimento/page.tsx:47`: hoje ele fica pra sempre em `auth.users.raw_user_meta_data` e viaja no JWT, fora do alcance da rotina de exportação e exclusão da F6 (SEC-042 / R-024). Os funis de veterinário e de responsável não mandam identificador nenhum, e este é o único outlier
  - [ ] WhatsApp em `perfil_privado`, mesma regra da T-006
  - [ ] Conclusão pela mesma RPC `concluir_onboarding_profissional()`
  - [ ] Prova de persistência igual à da T-006, com conta de estabelecimento nova
  - [ ] Mesmo tratamento de erro e mesma releitura de `status`
- **Não fazer:** horários não entram (não existe campo no formulário nem coluna na tabela, ver R-019). Não exibir CNPJ, razão social ou nome do responsável técnico em nada público: os três são privados por decisão registrada (DL-053) e não estão mais em tabela de leitura pública. Não construir perfil público (F4/S7).

### T-008 — Upload do documento de validação
- **Estado:** ⬜ fila _(desbloqueada em 26/08: o bucket `documentos` existe em produção)_
- **Fase / Semana:** F3 / S2
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
- **Herdado da auditoria da `0003` (26/08). Leia antes de começar:**
  - ✅ **SEC-036 decidida em 26/08 (T-012): o upload passa por Route Handler nosso.** Nada de `createSignedUploadUrl`, nenhum token de escrita no cliente. O critério de MIME acima passa a ser entregável, e ele é por **assinatura mágica dos primeiros bytes**, nunca pelo `content-type` declarado nem pela extensão do nome: `%PDF-` / `FF D8 FF` / `89 50 4E 47 0D 0A 1A 0A` / `RIFF`…`WEBP`. A extensão do caminho é derivada do tipo detectado. O contrato completo, oito passos, está na seção 2.b da `0003`: leia antes de escrever a rota.
  - [ ] **A rota grava `documento_path`, `documento_hash` (sha256 hex dos bytes que ela mesma escreveu) e `documento_tamanho` num único UPDATE** (SEC-033 / T-009). O CHECK `perfil_privado_documento_completo` recusa dois de três, e é de propósito: documento sem identidade dos bytes não é estado válido.
  - [ ] **A rota nunca reemite URL de upload pra caminho que já existe** (SEC-033 / T-009). Trocar os bytes sem trocar a string deixa um perfil aprovado exibindo documento que ninguém conferiu
  - [ ] ⚠️ **O passo 8 grava a linha com a SESSÃO DO USUÁRIO, não com `service_role`** (SEC-051 / R-031, 2ª auditoria de 26/08). ✅ **DECIDIDO PELO ELBER EM 31/08 — DL-055. Deixou de ser recomendação e virou critério.** Duas consequências que entram nesta task junto: **(1)** a linha passa a ser escrita **sob RLS**, então a rota tem que **falhar ruidosamente** se a policy do dono não alcançar — nunca cair para `service_role` como plano B; **(2)** ⚠️ **esbarra no R-029**: a guarda `recusar_dado_de_estabelecimento_em_pessoa_fisica` levanta em **todo** UPDATE da linha de quem trocou de `clinic` para `vet` sem limpar as três colunas, **inclusive neste passo 8, que nem toca nelas** — o caminho legítimo do upload quebra para essa conta e a mensagem não diz como sair. **A correção do R-029 (uma frase na exceção) entra aqui.** ⚠️ **O R-031 não fecha com a decisão:** ele só fecha quando o texto do passo 8, dentro da `0003`, disser isto, porque é esse arquivo que a `0004` vai copiar. O contrato da seção 2.b diz "escrever no bucket com `service_role`" no passo 7 e **não diz nada** no passo 8. Com `service_role`, `auth.uid()` é nulo e o `insert into audit_logs` do trigger de revalidação grava **`actor_id = null`**: a trilha diz que o perfil voltou pra fila e não diz quem mexeu. **O desenho antigo, de URL assinada, gravava com a sessão do usuário e o `actor_id` saía certo — a arquitetura nova apagou um dado da trilha sem ninguém decidir isso.** Com a sessão, o `actor_id` sai certo e a policy `perfil_privado_update_own` vira segunda porta de graça. **Só o passo 7 (o bucket) precisa de `service_role`.** ⚠️ Não confundir com a gravação de `documento_visualizado` do item acima: **aquela** sai por `service_role`, porque `authenticated` não tem INSERT em `audit_logs`
  - [ ] **Registrar em `audit_logs` (`acao = 'documento_visualizado'`, `alvo_id` = dono do documento) antes de devolver a URL assinada** (SEC-040). ⚠️ Grave com `service_role`: a `0002` revogou INSERT em `audit_logs` de `authenticated` (seção 11b), então gravar com a sessão do admin devolve `permission denied` e a trilha some junto com o erro. Os quatro passos da seção 2.b da `0003` são sessão, autorização, URL curta e nunca aceitar caminho do cliente. Falta o quinto: a leitura do documento de identidade de terceiro é o acesso mais sensível do sistema e é o único fora da trilha automática
  - [ ] **Anotar no card da exclusão de dados da F6** que apagar conta tem que apagar o objeto do bucket (SEC-039 / R-023). O `on delete cascade` derruba a linha e deixa o arquivo órfão, pra sempre. A convenção de caminho `<uuid>/` que esta task fixa é o que torna a varredura possível depois
- **Não fazer:** não construir a tela de leitura do documento pelo admin (S4). Não usar `next/image` em nada vindo de usuário (R-004). Não aceitar arquivo checando só a extensão.

### T-003 — Instalar Playwright + CI
- **Estado:** 🟡 **escrita, verde e COMMITADA em 31/08 (`82f59bb`, branch `f3-s2/onboarding-vet-e-ci`). Aguarda os 4 secrets do Elber** para os 2 testes de login saírem de "pulado"
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

# ⏸️ BLOQUEADAS

_(vazia desde 26/08/2026.)_

A T-008 e a T-007 estavam paradas atrás da **T-002**, que era 🔴 e exigia sessão presencial.
A `0003` foi aplicada em produção em 26/08 e as duas foram liberadas no mesmo dia. **A S2 não
tem mais nenhum card 🔴 e nenhum card esperando o Elber.**

---

# ✅ CONCLUÍDAS

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
