# 03 — QUADRO DE TAREFAS

> Fila viva. **Uma task em execução por vez** no que escreve código.
> Atualizado por quem executa, no início e no fim de cada task.
>
> **Semana atual:** S1 (26/08 → 01/09) · **Fase:** F3

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

### T-001 — Migration 0002: núcleo de dados
- **Estado:** 🔵 SQL pronto e **APROVADO na auditoria**. Aguarda o Elber aplicar.
- **Onde parou:** 4 rodadas de auditoria (v1 reprovada com 2 críticos → v5 aprovada). Backup feito e conferido. Falta: aplicar em produção e rodar `supabase/verificar-apos-0002.sql`.
- **Relatório:** `docs/relatorios/SEC-2026-08-26.md` (2854 linhas, 4 rodadas)
- **Antes de aplicar:** avisar Marília e Durval de que o cadastro deles será refeito uma vez.

---

# ⬜ FILA — F3 / S1

### T-000b — Baseline do schema atual versionado
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S1
- **Capacidade:** E1
- **Nível:** 🟡 (só leitura no banco, escreve arquivo no repo)
- **Agente dono:** vetria-backend
- **Depende de:** Elber rodar `supabase/introspect.sql` e colar o resultado
- **Por quê:** fecha o R-006. Hoje só a migration `0001` está versionada; `profiles`, funções, triggers e policies foram criados direto no dashboard. Sem baseline, ninguém consegue revisar o que está em produção lendo o repo, e a `0002` seria escrita no escuro.
- **Feito quando:**
  - [ ] `supabase/migrations/0000_baseline.sql` versionado, com o schema real (tabelas, enums, funções, triggers, policies, índices)
  - [ ] Marcado no cabeçalho como **documental, já aplicado** — nunca rodar de novo em produção
  - [ ] Valores reais dos enums `user_role` e `admin_level` confirmados e registrados em `06-PERMISSOES.md` §1
  - [ ] R-002 item 3 resolvido: sabemos se `set-access` escreve um valor de `admin_level` válido
  - [ ] R-005 resolvido: sabemos quais funções de admin existem de fato e qual é a canônica
- **Não fazer:** não alterar nada no banco. Esta task só lê e transcreve.

### T-001 — Migration 0002: núcleo de dados
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S1
- **Capacidade:** E1, E5
- **Nível:** 🔴 **presencial — Elber aplica**
- **Agente dono:** vetria-backend (escreve o SQL) + Elber (aplica)
- **Depende de:** T-000b (baseline) + backup do banco de produção
- **Por quê:** sem `status` e sem as tabelas de perfil, nenhuma das 6 capacidades do escopo existe. É a task que destrava as 12 semanas seguintes.
- **Feito quando:**
  - [ ] Backup do banco de produção feito e confirmado
  - [ ] `supabase/migrations/0002_nucleo.sql` versionado, 100% aditivo (zero `DROP`)
  - [ ] `profiles.status` enum (`incomplete|pending_validation|active|suspended`), default `incomplete`
  - [ ] `vet_profiles` e `clinic_profiles` 1:1 com `profiles`, com `slug` único
  - [ ] `contatos` com `user_id` **nulável**, `anon_id`, `canal` (`whatsapp` hoje) e origem da busca (DL-047)
  - [ ] `audit_logs` criada
  - [ ] RLS **ativa** em todas as tabelas novas, codificando `docs/06-PERMISSOES.md` §3 célula por célula
  - [ ] `status` **não** é escrito pelo próprio usuário: a policy de update do dono exclui a coluna
  - [ ] Toda função usada em policy é `SECURITY DEFINER` + `SET search_path = public` (DL-015 — isso já causou recursão infinita antes)
  - [ ] Trigger de `updated_at` em cada tabela nova
  - [ ] Procedimento de reversão escrito antes de aplicar
  - [ ] `vetria-seguranca` revisou as policies **antes** de aplicar
  - [ ] Aplicada em produção e conferida
- **Não fazer:** não criar tabela de `reviews`, `appointments`, `favoritos` ou `planos` — fora do escopo dos 3 meses. Não alterar nem renomear nada existente em `profiles`. Não renomear o enum `user_role` (DL-043).

### T-002 — Bucket de documentos no Storage
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S1
- **Capacidade:** E1
- **Nível:** 🔴 presencial
- **Agente dono:** vetria-backend + Elber
- **Depende de:** T-001
- **Por quê:** validação de CRMV é manual pelo admin (V1) e precisa do documento em algum lugar seguro.
- **Feito quando:**
  - [ ] Bucket `documentos` criado, **privado**
  - [ ] Policy: o dono lê e escreve o próprio; admin lê tudo; público não lê nada
  - [ ] Acesso por URL assinada com expiração curta, nunca por URL pública
  - [ ] Limite de tamanho e de MIME type definidos e documentados
- **Não fazer:** não subir documento nenhum ainda — o upload é a T-004.

### T-003 — Instalar Playwright + CI
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S1
- **Capacidade:** transversal (testes)
- **Nível:** 🟡
- **Agente dono:** vetria-qa
- **Depende de:** nada — pode rodar em paralelo com T-001
- **Por quê:** são 12 semanas de mudança em código que já está em produção. Sem rede de segurança, regressão vira descoberta do cliente.
- **Feito quando:**
  - [ ] Playwright instalado, `npm run test:e2e` funcionando
  - [ ] Workflow do GitHub Actions rodando build + lint + E2E em push na `main`
  - [ ] Primeiro teste real: login com credencial de teste → chega no painel certo
  - [ ] Usuários de teste **não** vêm de `.env` commitado — vêm de secret do GitHub
  - [ ] `README.md` explica como rodar teste local
- **Não fazer:** não escrever teste de tela que ainda é casca. Testa só o que já é real.

### T-004 — Auditoria de segurança inicial (linha de base)
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S1
- **Capacidade:** transversal (segurança)
- **Nível:** somente leitura — produz relatório, não toca código
- **Agente dono:** vetria-seguranca
- **Depende de:** nada — roda em paralelo
- **Por quê:** precisamos saber o tamanho do buraco antes de construir em cima. Já há suspeita confirmada em R-001.
- **Feito quando:**
  - [ ] `docs/relatorios/SEC-2026-08-XX.md` escrito
  - [ ] Achados classificados 🔴 / 🟠 / 🟡 com prova (arquivo:linha e como explorar)
  - [ ] Cada achado 🔴 virou card de task nesta fila
  - [ ] `04-RISCOS.md` atualizado
- **Não fazer:** não corrigir nada. Auditor não conserta — auditor reporta.

---

# ⏸️ BLOQUEADAS

_(vazio)_

---

# ✅ CONCLUÍDAS

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
