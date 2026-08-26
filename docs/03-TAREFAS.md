# 03 — QUADRO DE TAREFAS

> Fila viva. **Uma task em execução por vez** no que escreve código.
> Atualizado por quem executa, no início e no fim de cada task.
>
> **Semana atual:** **S2 aberta em 26/08** · **Anterior:** S1 ✅ fechada em 26/08 (5 de 6) · **Fase:** F3
>
> **Ordem de execução da S2:** T-002 (🔴 presencial, agendar já) → T-006 → T-007 → T-008.
> **T-003 corre em paralelo do primeiro dia**, porque `vetria-qa` não disputa arquivo com ninguém.

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

> **Semana aberta em 26/08/2026 pelo `vetria-maestro`.** 5 cards, na ordem de execução abaixo.
>
> **O que mudou em relação ao `01-PLANO.md` §S2, e por quê:**
> - **T-002 e T-003 escorregaram da S1** e abrem a S2. A T-002 continua 🔴: **sem sessão presencial com o Elber ela não anda, e a T-008 não existe sem ela.**
> - **Onboarding do responsável saiu da S2 e vai pra S3**, junto com os editores de perfil. Motivo: os itens 1 a 4 do Definition of Done da F3 são todos do caminho do **profissional**; o responsável não tem nenhum item de DoD. Com uma 🔴 herdada da semana anterior dentro da fila, a S2 protege o caminho crítico primeiro.
> - **Foto de perfil (vet) e horários (estabelecimento) não entram na S2.** O plano prometeu os dois, mas não existe nem campo no formulário nem coluna no banco para nenhum deles, e criar coluna é migration (🔴). Ver **R-019**. Nenhum dos dois está no `00-ESCOPO.md` §2, então não é corte de escopo contratado.

### T-002 — Bucket de documentos no Storage
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S2 _(escorregou da S1)_
- **Capacidade:** E1
- **Nível:** 🔴 presencial — **precisa de sessão presencial com o Elber, agende**
- **Agente dono:** vetria-backend + Elber
- **Depende de:** T-001 ✅
- **Por quê:** validação de CRMV é manual pelo admin (V1) e precisa do documento em algum lugar seguro. Enquanto não existir bucket, a T-008 não existe e o item 3 do DoD da F3 (admin aprova) não tem o que olhar.
- **Feito quando:**
  - [ ] Bucket `documentos` criado, **privado**
  - [ ] Policy: o dono lê e escreve **só dentro do próprio prefixo `<uuid>/`**; admin lê tudo; `anon` não lê nada
  - [ ] Acesso por URL assinada com expiração curta, nunca por URL pública
  - [ ] Limite de tamanho e whitelist de MIME (`pdf`, `jpg`, `jpeg`, `png`, `webp`) definidos e registrados em `05-DECISOES.md`
  - [ ] **Regra do nome do arquivo documentada** (SEC-028): o nome é **gerado pelo servidor**, minúsculo, sem acento e sem espaço, no formato que o CHECK de `perfil_privado.documento_path` exige: `^<uuid>/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$`. Hoje isso não está escrito em lugar nenhum, e quem for fazer a T-008 vai errar sem saber por quê
  - [ ] Confirmado no banco que o trigger `trg_perfil_privado_carimbo` cobre INSERT e UPDATE (correção SEC-028 da v5)
- **Aproveite a sessão aberta (custo marginal quase zero):** decidir a **SEC-020 / R-018** — `clinic_profiles` publica `cnpj`, `razao_social`, `responsavel_tecnico`, `endereco` e `cep` para `anon` em toda linha `active`. Ou essas colunas são vitrine por decisão registrada, ou descem para `perfil_privado`, e descer é migration. **Decidir agora evita uma terceira sessão presencial antes da F4.**
- **Não fazer:** não subir documento nenhum (isso é a T-008). Não criar bucket público de foto de perfil (R-019, fora da S2). Não mexer em RLS de tabela nesta sessão além do que a SEC-020 exigir, e só se houver decisão.

### T-006 — Onboarding do veterinário passa a persistir
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S2
- **Capacidade:** E2
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** T-001 ✅ (não depende da T-002)
- **Por quê:** hoje o botão "Concluir" de `app/app/veterinario/onboarding/page.tsx` só faz `update profiles set onboarding_completed = true` e **joga fora tudo que o profissional digitou nos 4 passos**. Ninguém entra na fila de validação, porque `status` continua `incomplete`. É o item 1 do DoD da F3 e é a espinha da semana: a T-007 é o mesmo padrão aplicado de novo.
- **Feito quando:**
  - [ ] Server Action grava em `vet_profiles` (`nome_exibicao`, `titulo`, `crmv`, `crmv_uf`, `especialidades`, `experiencia`, `bio`, `cidade`, `estado`, `bairro`, `atende_presencial`, `atende_domiciliar`, `atende_teleorientacao`) na linha do próprio `auth.uid()`
  - [ ] **WhatsApp vai para `perfil_privado`, nunca para `vet_profiles`** (SEC-002). Telefone em tabela de leitura pública entrega a base inteira pela API anônima
  - [ ] A conclusão chama `concluir_onboarding_profissional()` por RPC. O `status` vira `pending_validation` **no servidor**. O cliente não escreve `status` em hipótese nenhuma: a policy levanta exceção, e é assim que tem que ser
  - [ ] **Prova de persistência:** cadastro novo de vet → preencher os 4 passos → sair, deslogar, voltar → os dados estão no banco (conferir com `select` real, não pela tela)
  - [ ] Erro do banco vira mensagem legível na tela. Hoje o caminho de erro é `redirect("...?error=1")` e a tela não mostra nada
  - [ ] Nenhum `redirect()` dentro de `try/catch` (DL-016)
  - [ ] Se o perfil já estiver `active`, a Action **relê `profiles.status` depois de salvar**: o trigger de revalidação (SEC-016/023) devolve o perfil para `pending_validation` quando CRMV ou documento mudam, e a resposta do update **não diz nada sobre isso**. Sem a releitura, a tela mente para um profissional que acabou de sair do ar
- **Não fazer:** não escrever `slug` (é pinado pela RLS e a regra só nasce na F4/S5). Não fazer upload de arquivo (T-008). Não tocar em `middleware.ts` nem no portão de status (S3). Não mexer no formulário do estabelecimento (T-007). Não inventar campo que a tabela não tem.

### T-007 — Onboarding do estabelecimento passa a persistir
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S2
- **Capacidade:** E2
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** T-006 — **e do handoff dela, não só do commit.** O formulário do estabelecimento é clone do de veterinário (foi assim que o R-017 nasceu duplicado); clonar antes de a T-006 ser revisada duplica o defeito junto
- **Por quê:** mesmo buraco da T-006, no outro painel. Sem isso, metade dos profissionais que a Vetria vende não chega na fila de validação.
- **Feito quando:**
  - [ ] Server Action grava em `clinic_profiles` (`nome_fantasia`, `razao_social`, `cnpj`, `responsavel_tecnico`, `endereco`, `cep`, `cidade`, `estado`, `sobre`, `servicos`, `site`)
  - [ ] WhatsApp em `perfil_privado`, mesma regra da T-006
  - [ ] Conclusão pela mesma RPC `concluir_onboarding_profissional()`
  - [ ] Prova de persistência igual à da T-006, com conta de estabelecimento nova
  - [ ] Mesmo tratamento de erro e mesma releitura de `status`
- **Não fazer:** horários não entram (não existe campo no formulário nem coluna na tabela, ver R-019). Não exibir CNPJ, razão social ou nome do responsável técnico em nada público enquanto a SEC-020 / R-018 não tiver decisão registrada. Não construir perfil público (F4/S7).

### T-008 — Upload do documento de validação
- **Estado:** ⏸️ bloqueada por T-002
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** **T-002** (sem bucket não há upload) e T-006
- **Por quê:** o passo 4 do onboarding pede o documento do CRMV e hoje só mostra um aviso. Sem documento no Storage, o admin da S4 não tem o que abrir e o item 3 do DoD da F3 não fecha.
- **Feito quando:**
  - [ ] Upload passa **pelo servidor**, não do navegador direto pro bucket
  - [ ] Nome do arquivo **gerado pelo servidor**, no formato que o CHECK exige (ver T-002). Nome escolhido pelo usuário não chega ao caminho
  - [ ] Validação de MIME por whitelist (`pdf`, `jpg`, `jpeg`, `png`, `webp`) **e** de tamanho, no servidor. **SVG e HTML barrados** (R-004: o admin abre esse arquivo dentro do painel de maior privilégio do sistema)
  - [ ] `perfil_privado.documento_path` escrito pelo dono; `documento_enviado_em` carimbado pelo trigger, **nunca pelo cliente**
  - [ ] Nenhuma URL pública em lugar nenhum: só URL assinada, e só para o dono e o admin
  - [ ] Falha de upload **impede** a conclusão. O profissional não pode sair achando que enviou o documento quando não enviou
- **Não fazer:** não construir a tela de leitura do documento pelo admin (S4). Não usar `next/image` em nada vindo de usuário (R-004). Não aceitar arquivo checando só a extensão.

### T-003 — Instalar Playwright + CI
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S2 _(escorregou da S1)_
- **Capacidade:** transversal obrigatória **Testes** (`00-ESCOPO.md` §2), ancorada em **E2** — o primeiro fluxo de produto coberto é o onboarding profissional, e o item 5 do DoD da F3 exige E2E em CI
- **Nível:** 🟡
- **Agente dono:** vetria-qa
- **Depende de:** nada. **Roda em paralelo** com a T-006 e a T-007, porque `vetria-qa` escreve só em `tests/` e não disputa arquivo com ninguém
- **Por quê:** são 12 semanas de mudança em código que já está em produção. Sem rede de segurança, regressão vira descoberta do cliente. E a S2 é exatamente a semana em que o banco entra por baixo de telas que já estão no ar (R-003).
- **Feito quando:**
  - [ ] Playwright instalado, `npm run test:e2e` funcionando
  - [ ] Workflow do GitHub Actions rodando build + lint + E2E em push na `main`
  - [ ] Primeiro teste real: login com credencial de teste → chega no painel certo
  - [ ] Usuários de teste **não** vêm de `.env` commitado — vêm de secret do GitHub
  - [ ] `README.md` explica como rodar teste local
  - [ ] **Se a T-006 fechar dentro da semana:** segundo teste cobrindo cadastro de vet → onboarding preenchido → sair e voltar → o dado está lá (item 1 do DoD da F3)
- **Não fazer:** não escrever teste de tela que ainda é casca. Testa só o que já é real. Não criar usuário de teste em produção sem combinar como ele é limpo depois.

---

# ⏸️ BLOQUEADAS

- **T-008 — Upload do documento de validação.** Bloqueada por **T-002**, que é 🔴 e depende
  de sessão presencial com o Elber. O card fica acima, na fila da S2. Se a T-002 não
  acontecer nesta semana, a T-008 escorrega para a S3 e leva junto o item 3 do DoD da F3.

---

# ✅ CONCLUÍDAS

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
