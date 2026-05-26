# 🧠 CONTEXT.md — Cérebro do Projeto Vetria

> **PARE.** Se você é o Claude Code começando uma nova sessão, **leia esse arquivo inteiro antes de qualquer ação**. Não pule, não invente, não improvise.
>
> Esse arquivo existe pra que toda sessão tenha o mesmo contexto e siga as mesmas regras.
>
> **🗺️ Regra viva (roadmap):** sempre que um avanço for grande o suficiente pra mover o status do roadmap (fechar tarefa/bloco, virar de sprint, marco visível), atualizar `app/roadmap/page.tsx` (array `SPRINTS` + const `ATUALIZADO`) **no mesmo commit**. O roadmap é a vitrine de progresso pros donos. Ver DL-037.
>
> **✍️ Regra de copy:** nunca usar travessão (—, em dash) em texto que o usuário vê. Usar vírgula, ponto ou dois-pontos. Ver DL-038.
>
> **Última atualização:** 24 de Maio de 2026 — **bloco visual v2 / fase casca fechada** (DL-031 a DL-036): sidebar shell vet/clínica via route group `(painel)` (TASK-038 ✅), tipografia revertida pra **Inter única** (serif descartada), design system v2 portado pros tokens `@theme`, padrão **GHOST** ("ghost onde ensina, empty seco onde acalma" — refina DL-020, mock de pets removido), **Home pública** em `/`, e itens "em breve" da sidebar ativados como casca navegável. App visualmente completo e pronto pra apresentar (ver `DEMO.md`). **25/05:** rota `/roadmap` viva pros donos (DL-037), travessões removidos (DL-038) e **camada de entrada 100% no domínio oficial** `vetriabrasil.com.br` — login/cadastro/confirmação/recuperação de senha funcionando com email real (DL-039). **Fase 2 ENTREGUE** (DL-040): logo oficial em tudo, 6 emails transacionais, rota `/entrega-fase-2`. Próximo: **Fase 3 / backend pesado** (presencial: schema grande, busca, agenda, validação CRMV, planos).

---

## 1. O QUE É A VETRIA

Plataforma digital que conecta **tutores de pets** a **veterinários, clínicas e empresas do setor pet/agrovet**. Marketplace estilo Doctoralia.

**Visão econômica:**
- Tutores entram pra resolver problema (B2C, gratuito)
- Profissionais pagam pra serem encontrados (B2B, monetização)

**Posicionamento:** plataforma séria, sóbria, profissional. Tom de plano de saúde humano, não wellness app.

**Princípio central:** **1 usuário = 1 role permanente**. Sem multi-role, sem troca de painel.

---

## 2. ESTADO ATUAL (REAL, EM PRODUÇÃO)

### O que JÁ funciona (Sprint 1 — concluída e deployada)
- ✅ Login email + senha (Supabase Auth) — `app/login/page.tsx`
- ✅ Login Google OAuth — botão funcionando, callback configurado
- ✅ Cadastro via signup no mesmo form do login
- ✅ Tabela `profiles` com roles
- ✅ RBAC funcional (5 roles: tutor, vet, clinic, admin, master)
- ✅ `/onboarding` (escolha de role pós Google OAuth) — `app/onboarding/page.tsx + OnboardingClient.tsx`
- ✅ Painéis isolados por role:
  - `/app/tutor` (com layout.tsx + page.tsx)
  - `/app/vet`
  - `/app/clinic`
- ✅ Admin com `/admin` + `AdminPanel.tsx` + `admin_level` (master vs comum)
- ✅ APIs protegidas:
  - `/api/admin/profiles`
  - `/api/admin/set-access`
  - `/api/onboarding/set-role`
- ✅ Deploy contínuo na Vercel
- ✅ GitHub conectado: github.com/VetriaVet/vetria-web

### O que existe MAS é PLACEHOLDER (precisa Sprint 2)
- 🟡 `app/app/vet/onboarding/page.tsx` — só seta `onboarding_completed=true`. Sem captura de CRMV, especialidades.
- 🟡 `app/app/clinic/onboarding/page.tsx` — clone do vet, mesmo placeholder
- 🟡 `app/app/tutor/onboarding/page.tsx` — placeholder, falta nome/cidade/preferências

### O que NÃO EXISTE ainda (Sprint 2 vai criar)
- ❌ Tabela `vet_profiles` no Supabase
- ❌ Tabela `clinic_profiles` no Supabase
- ❌ Campo `status` em `profiles` (enum incomplete|pending_validation|active|suspended)
- ❌ Páginas `/app/vet/aguardando` e `/app/clinic/aguardando` (✅ visuais criadas — DL-022)
- ✅ Pasta `supabase/migrations/` criada + migration 0001 aplicada (DL-027)
- 🟡 Email transacional: Resend integrado como SMTP do Supabase em **modo teste** (DL-030); falta verificar domínio `vetriabrasil.com.br` pra produção

### Sprint 2 — concluído (até 24/05/2026)
- ✅ TASK-000 — Fundação Tailwind v4 + paleta Vetria + Inter + admin fix
- ✅ TASK-001 — `/login` refatorado com identidade Vetria (commit 78a43a1)
- ✅ TASK-002 — `/onboarding` com 3 cards de role (commit b89e49b)
- ✅ TASK-003 — `/cadastro` (escolha pública de role) (commit d59e041)
- ✅ TASK-FIX-002 — `/auth/callback` route handler pra confirmação de email + OAuth (commit 4f7f87e)
- ✅ TASK-FIX-MICRO-001 — logs de debug no callback handler (commit 1861a46)
- ✅ TASK-AH-001 — refator visual ad-hoc do `/app/tutor/onboarding` com form Vetria (commit 4259924)
- ✅ TASK-FIX-006 — `lib/supabase/server` migrado pra API getAll/setAll (commit 84d777d)
- ✅ TASK-FIX-007 — `.select()` + logs no update da Server Action de onboarding tutor (commit 35c56e4)
- ✅ TASK-FIX-008 — remover try/catch que engolia NEXT_REDIRECT no `TutorOnboardingForm` (commit ff26a75)
- ✅ Bug crítico de RLS recursiva em `is_master_admin`/`is_admin_master` fixado via SQL direto (DL-014, fora do repo)
- ✅ TASK-028 — biblioteca `components/ui/` (Button, Input, Select, Card, Label) extraída das telas canônicas; `AuthShell` órfão removido (commit f24d874, DL-017)
- ✅ TASK-034 — header compartilhado `app/app/layout.tsx` refatorado: Server Component com nav por role (commit a93dfb9, DL-018)
- ✅ TASK-008 — dashboard `/app/tutor` refatorado com visual Vetria (commit 4ba2219, DL-019)
- ✅ TASK-012 — dashboard `/app/vet` refatorado (casca fiel ao produto, sem mock) (commit b30c08d, DL-020)
- ✅ TASK-016 — dashboard `/app/clinic` refatorado (coeso com o vet) (commit a52e234, DL-020)
- ✅ TASK-026 — homepage `/` redireciona por sessão (login/app) (commit c45d98a)
- 🚫 TASK-027 — `.vercelignore` dispensada (N/A — `vetria-proto/` já gitignored; DL-021)
- ✅ TASK-035 — higiene do layout raiz: metadata Vetria, lang pt-BR, remoção do Geist (commit 7f4dee7)
- ✅ TASK-036 — 404 Vetria + favicon do logo + limpeza de assets boilerplate (commit 3395111)
- ✅ TASK-013 / TASK-018 / TASK-009 — editores de perfil (vet, clínica, tutor) com preview ao vivo (827e9f9/867ada2/ea8c6ae, DL-022)
- ✅ TASK-014 / TASK-019 — telas de "aguardando validação" (vet, clínica) (14c8f5d/c85e687, DL-022)
- ✅ TASK-017 — equipe da clínica (empty-state honesto) (1d93327, DL-022)
- ✅ TASK-010 / TASK-011 — histórico e avaliações do tutor (empty-states) (fc5982f, DL-022)
- ✅ TASK-015 / TASK-020 — onboardings multi-step vet/clínica (cd119a0/f4877b2, DL-022)
- ✅ Nav do header expandida por role com as telas internas existentes (6e5b749, DL-018)
- ✅ TASK-007 — `/recuperar-senha` (mock visual) + wire no login (4607744)
- ✅ TASK-021 — `/admin` refatorado dark, lógica RBAC preservada (7533d50, DL-024)
- ✅ TASK-022/023/024/025 — admin: usuários (painel RBAC) + validações/moderação/conteúdo (15c38db, DL-024)
- ✅ TASK-004/005/006 — `/cadastro/{tutor,vet,clinica}` forms preparados, signUp como TODO (df1514c/87de08c, DL-023)
- ✅ Chrome do app: sino de notificações + menu hambúrguer mobile + busca vet/clínica (cc887c9/9955bfe, DL-025)
- ✅ TASK-039 — `/cadastro` vira entrada direta do tutor; vet/clínica = funil B2B separado (b1be7ae, DL-026)
- ✅ Migration 0001 — `handle_new_user` lê role do metadata + hardening; pasta `supabase/migrations/` criada (8abdc7a, DL-027) — aplicada em prod
- ✅ signUp LIGADO nos 3 cadastros (role no metadata p/ trigger) (908ba5e, DL-028)
- ✅ TASK-038 — sidebar shell vet/clínica via route group `(painel)` + lucide (1acb678, DL-031)
- ✅ Bloco visual v2: Inter única (DL-032), design system nos tokens `@theme` (DL-033), padrão GHOST/empty seco (DL-034), Home pública (DL-035), itens da sidebar ativados como casca (DL-036)

> 🥚 **CASCA COMPLETA (fase visual fechada)** — app visualmente completo em todos os painéis e fluxos (público + Home, tutor, vet, clínica, admin), no design v2 (Inter + tokens). Estados honestos (ghost onde ensina, seco onde acalma); **sem dado/preço fake**; pontos de integração marcados com `// TODO`. Pronto pra apresentar — roteiro em `DEMO.md`.

### Próximas (priorizadas)
- ✅ Roteamento de role + onboarding validados (DL-028); fase visual v2 fechada (DL-031 a DL-036).
- ✅ **Camada de entrada completa (DL-039):** domínio `vetriabrasil.com.br` no ar (Vercel), Resend com domínio verificado, email real (`contato@vetriabrasil.com.br`), recuperação de senha funcionando ponta a ponta. Login/cadastro/confirmação/recuperação = 100%.
- ✅ TASK-007b — recuperação de senha real ligada (resetPasswordForEmail + tela de nova senha) (DL-039). *(Falta só customizar os templates de email do §9 — opcional.)*
- 🔴 **FASE BACKEND PESADO** (próximo grande bloco) — TASK-029 → 031 → 032: migration grande (status + vet/clinic_profiles) → onboarding real (persistir dados) → middleware por status. Daí cascateiam: busca + perfil público, agenda, contatos/mensagens, avaliações reais, métricas reais, validação de CRMV, convite de equipe, captura de pets, planos/Stripe (Sprint 6).
- 🟢 Polimento cosmético adiado: SVG inline → lucide nos formulários (perfil/onboarding) — render idêntico, sem urgência
- ⬜ TASK-FIX-003 — set-role idempotente (não urgente)

---

## 3. STACK TÉCNICA

| Camada | Tecnologia | Status |
|---|---|---|
| App principal | Next.js (App Router) | ✅ Em produção |
| Hosting | Vercel | ✅ Deploy automático ativo |
| Auth + DB | Supabase | ✅ Em produção |
| Styling | Tailwind CSS v4 | ✅ Em produção (DL-006) |
| Email transacional | Resend | ❌ A integrar (Sprint 2) |
| Pagamentos | Stripe | ❌ Sprint 6 |
| OAuth | Google Cloud | ✅ Funcionando |
| Versionamento | GitHub | ✅ |
| Site institucional (futuro) | WordPress (Hostinger) | Não iniciado |

### Estrutura de rotas no Next.js (real, hoje)
```
/login                              → app/login/page.tsx (inline styles, sem identidade)
/onboarding                         → app/onboarding/page.tsx (escolha de role, 3 botões)
/app                                → app/app/page.tsx
/app/tutor                          → app/app/tutor/page.tsx
/app/tutor/onboarding               → PLACEHOLDER
/app/vet                            → app/app/vet/page.tsx
/app/vet/onboarding                 → PLACEHOLDER
/app/clinic                         → app/app/clinic/page.tsx
/app/clinic/onboarding              → PLACEHOLDER
/admin                              → app/admin/page.tsx + AdminPanel.tsx
/api/admin/profiles                 → route.ts
/api/admin/set-access               → route.ts
/api/onboarding/set-role            → route.ts
```

### Estrutura de pastas no repo
```
vetria-web/
├── app/                            ← Next.js App Router (código de produção)
├── lib/                            ← funções utilitárias, supabase clients
├── public/                         ← assets estáticos
├── supabase/migrations/            ← SQL versionado (CRIAR na Sprint 2)
├── vetria-proto/                   ← protótipo HTML (gitignored, só local)
├── middleware.ts                   ← RBAC server-side
├── next.config.ts
├── package.json
├── .env.local                      ← gitignored
├── .gitignore                      ← inclui .env*, vetria-proto/
└── CONTEXT.md                      ← este arquivo
```

---

## 4. REGRAS DE ARQUITETURA

### 4.1 — Hierarquia de roles (5 roles)

| Role | Acesso | Quem é |
|---|---|---|
| `tutor` | `/app/tutor` | Dono do pet, busca atendimento |
| `vet` | `/app/vet` | Profissional veterinário individual |
| `clinic` | `/app/clinic` | Clínica/hospital (multi-profissionais) |
| `admin` | `/admin` | Operação da plataforma (`admin_level=comum`) |
| `master` | total | Admin nível superior (`admin_level=master`) |

### 4.2 — Tabela `profiles` (em produção)
```
id                       uuid (= auth.users.id)
role                     enum (tutor|vet|clinic|admin|master)
admin_level              enum (comum|master)
admin_team               text
onboarding_completed     boolean
status                   enum (incomplete|pending_validation|active|suspended)  ← ADICIONAR Sprint 2
created_at               timestamptz
updated_at               timestamptz
```

### 4.3 — Status de usuário (vet/clinic)
- `incomplete` → onboarding não terminou, NÃO aparece na busca
- `pending_validation` → CRMV/docs em revisão pelo admin
- `active` → ativo, aparece na busca
- `suspended` → suspenso (futuro)

**Transições:**
```
incomplete → pending_validation  (após onboarding completo + upload docs)
pending_validation → active      (admin aprova)
pending_validation → incomplete  (admin reprova)
active → suspended               (admin suspende, futuro)
```

### 4.4 — Regra de visibilidade na busca
Pra um vet ou clínica aparecer na busca pública:
1. `role IN ('vet', 'clinic')`
2. `status = 'active'`
3. (Sprint 6+: `plano_ativo = true`)

**Filtro acontece no backend, não no frontend.**

---

## 5. ROADMAP DE SPRINTS

```
✅ Sprint 1 — Base técnica + Auth + RBAC                 [CONCLUÍDA, em produção]
🟢 Sprint 2 — Onboarding + identidade + Resend           [EM ANDAMENTO]
🟡 Sprint 3 — Perfis públicos + busca
🟠 Sprint 4 — Agendamento (Google Calendar)
🔵 Sprint 5 — Retenção (favoritos, histórico, avaliações)
🟣 Sprint 6 — Monetização (Stripe — só aqui)
⚫ Sprint 7 — Escala (chat, telemedicina, IA, mobile)
```

### Sprint 2 — escopo e ordem de execução

**Pré-requisitos (fundação técnica):**
- [ ] Decisão de styling fechada → instalar Tailwind CSS
- [ ] Configurar `tailwind.config.ts` com paleta oficial Vetria + Inter
- [ ] Atualizar `app/globals.css` com base
- [ ] Refatorar `app/login/page.tsx` no novo padrão visual

**Schema (Supabase migration):**
- [ ] Criar pasta `supabase/migrations/`
- [ ] Migration `001_sprint2_schema.sql`:
  - [ ] Adicionar `status` em `profiles` (enum)
  - [ ] Criar tabela `vet_profiles` (1:1 com profiles)
  - [ ] Criar tabela `clinic_profiles` (1:1 com profiles)
  - [ ] RLS policies para cada tabela
  - [ ] Trigger `updated_at` automático

**Páginas (UI + lógica):**
- [ ] Refatorar `app/onboarding/page.tsx` (escolha de role) → 3 cards visuais
- [ ] Reescrever `app/app/vet/onboarding/page.tsx` → multi-step CRMV
- [ ] Reescrever `app/app/clinic/onboarding/page.tsx` → dados institucionais
- [ ] Reescrever `app/app/tutor/onboarding/page.tsx` → form leve
- [ ] Criar `app/app/vet/aguardando/page.tsx` (estado pending_validation)
- [ ] Criar `app/app/clinic/aguardando/page.tsx`
- [ ] Lógica no middleware: vet/clinic com `status != active` redireciona pra aguardando

**Integração Resend:**
- [ ] Conta Resend criada + domínio vetriabrasil.com.br verificado (DKIM, SPF, DMARC)
- [ ] `RESEND_API_KEY` cadastrada nos 3 ambientes da Vercel
- [ ] Pasta `lib/email/` com função `sendEmail()`
- [ ] Templates: welcome, password-reset, vet-aprovado, vet-rejeitado, clinic-aprovado, clinic-rejeitado

**O que NÃO entra na Sprint 2:**
- Busca pública (Sprint 3)
- Perfis públicos `/vet/[slug]` (Sprint 3)
- Agendamento (Sprint 4)
- Stripe (Sprint 6)
- Avaliações públicas (Sprint 5)

---

## 6. REFERÊNCIA VISUAL — PROTÓTIPO

A pasta `vetria-proto/` no repo (gitignored) tem **25 telas HTML estáticas** que mostram exatamente como cada tela deve ficar visualmente.

**Elementos do protótipo:**
- Tipografia: **Inter** (única, conforme manual oficial)
- Paleta: 5 cores nomeadas
- Componentes: pill (radius 999px) em inputs e botões
- Logo: PNG oficial em `vetria-proto/assets/logo-square.png`

**Mapeamento HTML → arquivo Next.js:**
- `vetria-proto/login.html` → `app/login/page.tsx`
- `vetria-proto/cadastro-vet.html` → fluxo de cadastro vet
- `vetria-proto/app/vet/onboarding.html` → `app/app/vet/onboarding/page.tsx`
- `vetria-proto/app/vet/aguardando.html` → `app/app/vet/aguardando/page.tsx`
- `vetria-proto/app/vet/index.html` → `app/app/vet/page.tsx`
- (mesmo padrão pra clinic e tutor)

---

## 7. REGRAS DE OURO (não quebrar nunca)

### 7.1 — Não inventar feature
> "Não inventar funcionalidades. Não assumir comportamentos. Não extrapolar escopo."

Se não está no roadmap ou nesse arquivo, **pergunta antes de implementar.**

### 7.2 — Não pular sprint
Stripe NÃO entra antes da Sprint 6. Busca pública NÃO entra antes da Sprint 3.

### 7.3 — Backend valida tudo
RBAC, status, validações — sempre no backend. **Nunca confiar só no frontend.**

### 7.4 — Não mexer em produção sem migration
Toda alteração de schema vai em arquivo SQL versionado em `supabase/migrations/NNN_descricao.sql`.

### 7.5 — Não commitar secrets
`.env.local` está no `.gitignore`. Antes de qualquer push, conferir.

### 7.6 — Não destruir dados de prod
Toda migration deve ser **aditiva**. `DROP TABLE` precisa de procedimento de backup primeiro.

### 7.7 — Diff antes de commit
Toda alteração de código pelo Claude Code deve mostrar **diff explícito** antes de commitar. Humano aprova.

### 7.8 — Conferir resultado em produção
Toda task que sobe pra produção, **conferir visualmente no navegador** depois do deploy.

---

## 8. SEGURANÇA — CHECKLIST CONTÍNUO

- [x] `.env.local` no `.gitignore`
- [x] `vetria-proto/` no `.gitignore`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` confirmada **só** server-side (sem `NEXT_PUBLIC_`)
- [ ] RLS ativo em **todas** as tabelas (Sprint 2)
- [x] Middleware `middleware.ts` valida role
- [x] APIs em `/app/api/*` validam sessão
- [ ] `vercel env ls` confere variáveis nos 3 ambientes
- [ ] Branch `main` protegida no GitHub (PR obrigatória)
- [ ] Política: tokens NUNCA em chat, sempre placeholder

---

## 9. EMAIL TRANSACIONAL (Resend) — Sprint 2

### Templates a criar
- `welcome.tsx` — após cadastro confirmado
- `password-reset.tsx` — recuperação
- `vet-approved.tsx` / `vet-rejected.tsx`
- `clinic-approved.tsx` / `clinic-rejected.tsx`

### Padrão dos emails
- Logo Vetria no topo
- Tom: profissional, direto, sem exagero
- Cor principal: `#1E4349`
- Footer com CNPJ, endereço, link de unsubscribe

---

## 10. COMO USAR ESSE ARQUIVO

**No início de cada sessão do Claude Code:**

1. Ler esse arquivo inteiro
2. Conferir qual sprint está ativa
3. Pegar UMA task do checklist
4. Mostrar plano antes de executar
5. Executar
6. Mostrar diff
7. Aguardar aprovação humana antes de commit
8. Após commit, atualizar este arquivo se decidiu algo novo
9. Marcar a task como concluída

---

## 11. CONTATOS E RECURSOS

- Dashboard Supabase: https://app.supabase.com/project/_______
- Dashboard Vercel: https://vercel.com/_______
- Dashboard Resend: https://resend.com/_______ (após criar)
- GitHub: https://github.com/VetriaVet/vetria-web
- Domínio: vetriabrasil.com.br

_(preencher links acima)_

---

## 12. DECISÕES DE ARQUITETURA (DECISION LOG)

### DL-001 — Repositório único
**Data:** 26 Abril 2026
**Decisão:** Manter `vetria-proto/` no repo Next.js, mas via `.gitignore` (não vai pra produção).
**Razão:** Permitir consulta local fácil. Evitar 2 repos. Deploy não é afetado.

### DL-002 — Token na URL do remote
**Data:** 26 Abril 2026
**Decisão:** Autenticação Git via token embutido em `git remote set-url`.
**Razão:** Resolver conflito de credenciais (2 contas GitHub no PC). Token em `.git/config` local.
**Status:** Token expira em ~90 dias — agendar rotação.

### DL-003 — Styling: Tailwind CSS
**Data:** 26 Abril 2026
**Decisão:** Instalar Tailwind CSS como solução de styling oficial do projeto.
**Razão:** Stack padrão da indústria (Next.js + Vercel + Tailwind). Mapeamento direto das CSS variables do protótipo. Velocidade de desenvolvimento. Compatibilidade com contratação futura.
**Alternativas consideradas:** CSS global custom (descartada — não escala), inline styles (descartada — atual estado, não funciona).

### DL-004 — Sprint 2 reescreve onboardings stub
**Data:** 26 Abril 2026
**Decisão:** Os arquivos `app/app/{vet,clinic,tutor}/onboarding/page.tsx` serão **reescritos por completo** na Sprint 2.
**Razão:** Lógica atual é stub funcional, mas não captura nenhum dado real necessário pras tabelas `vet_profiles`/`clinic_profiles`.

### DL-005 — Tailwind versão pinada em v3 (REVOGADA)
**Data:** 26 Abril 2026
**Status:** REVOGADA pela DL-006 (mesma data).
**Razão da revogação:** Premissa errada — não havíamos auditado `package.json`,
que já tinha Tailwind v4 instalado pelo scaffolding do Next.js 16. Decisão de
downgrade não tinha justificativa técnica suficiente pra pagar o custo de reverter.

### DL-006 — Tailwind v4 mantido (substitui DL-005)
**Data:** 26 Abril 2026
**Decisão:** Manter Tailwind v4 (já instalado via scaffolding do Next.js 16).
Configurar paleta Vetria + Inter + radius pill via bloco `@theme` no `app/globals.css`.
**Razão:** v4 já está funcionando. Reverter pra v3 seria operação destrutiva sem ganho
concreto. Resultado visual idêntico em ambas as versões. shadcn/ui já tem suporte v4
(correção da informação anterior). Configuração via CSS é o padrão atual da Tailwind.
**Reavaliar:** apenas se algum bloqueio técnico aparecer (improvável) ou se shadcn/ui
tiver problema concreto na Sprint 3 (verificar antes de adotar).

### DL-007 — Dívida técnica: middleware deprecated no Next.js 16
**Data:** 26 Abril 2026
**Status:** Pendente (não-bloqueante)
**Contexto:** Next.js 16 emite warning: "The middleware file convention is
deprecated. Please use proxy instead."
**Decisão:** Manter `middleware.ts` por enquanto. Não migrar agora porque é mudança
que merece task própria com testes (afeta RBAC).
**Quando resolver:** Sprint 3+ ou quando alguma feature precisar tocar em middleware
mesmo. Não adiar pra deprecation hard (Next.js 17+).

### DL-008 — Lockfile residual fora do projeto
**Data:** 26 Abril 2026
**Status:** Pendente (não-bloqueante)
**Contexto:** Existe um `package-lock.json` em `C:\Users\Elber Desinger\` (fora do
projeto). Next.js detecta múltiplos lockfiles e infere root errado.
**Decisão:** Deletar o lockfile residual em ~/, manter só o do projeto.
**Ação:** humano (Elber) executa `rm "C:\Users\Elber Desinger\package-lock.json"`
em sessão separada. Sem impacto no build atual.

### DL-009 — Email confirmation ON no Supabase mantido em produção
**Data:** 28 Abril 2026
**Sprint:** 2
**Contexto:** Em desenvolvimento ativo de auth, email confirmation poderia ser
desligado no Supabase pra acelerar testes. Decisão consciente de manter ON
desde Sprint 1, mesmo antes de ter Resend integrado.
**Decisão:** Manter ON em produção. Mais seguro, alinhado com cenário de
produção real desde o início. Trade-off explícito: emails vêm do Supabase
built-in (baixa entregabilidade) até TASK-030 integrar Resend.
**Implicação operacional:** Em desenvolvimento, usar emails reais que você
consiga acessar. Considerar provedores variados (Outlook, ProtonMail,
descartáveis) pra contornar rate limit (DL-010).
**Status:** Em vigor.

### DL-010 — Rate limit do Supabase email built-in (~2-4 por hora)
**Data:** 28 Abril 2026
**Sprint:** 2
**Contexto:** Durante debug do callback handler (TASK-FIX-002), criamos várias
contas de teste (`teste+001`, `teste+002`, etc) e batemos no rate limit
silencioso do Supabase built-in. Resposta vem como `email rate limit exceeded`
mas é fácil ignorar — parece "nada acontece após signup".
**Decisão:** Registrar como limite operacional conhecido. Não atuar agora —
TASK-030 (Resend) elimina.
**Implicações:**
- Em desenvolvimento ativo de auth, fácil bater no limite
- Boa prática: ter 3-4 emails de provedores diferentes prontos pra rotacionar
- Resend tem limites bem maiores (3000/dia free tier)
**Status:** Mitigação operacional até TASK-030.

### DL-011 — Padrão de logs em handlers de auth
**Data:** 28 Abril 2026
**Sprint:** 2 — estabelecido em TASK-FIX-MICRO-001 (commit 1861a46) e reforçado
em TASK-FIX-007 (commit 35c56e4).
**Contexto:** Vercel Hobby plan oculta stack traces detalhados em runtime logs.
Durante debug do callback handler, isso forçou adicionar logs estruturados
explícitos pra ter triagem direta nos runtime logs sem precisar de stack trace.
**Decisão:** Padrão estabelecido — handlers auth-related sempre incluem:
- `console.log` na entrada com flags resumidas (sem tokens completos, só
  prefixo de 12 chars)
- `console.error` em cada caminho de erro com objeto
  `{message, status, name, code}` do error retornado pelo Supabase
- `console.log` no caminho de sucesso com `{userId, hasRole, destination}` ou
  equivalente
**Aplicar em:** handlers futuros como `/api/auth/*`, `/api/onboarding/set-role`
(ver TASK-FIX-003), qualquer rota que toque auth ou role. Server Actions
também (já aplicado em `completeOnboarding` do tutor).
**Status:** Em vigor.

### DL-012 — Padrão Server Component + Server Action + Client Form
**Data:** 28 Abril 2026
**Sprint:** 2 — estabelecido em TASK-AH-001 (commit 4259924), refator visual
ad-hoc do `/app/tutor/onboarding`.
**Contexto:** Refatorações visuais de telas em `/app/*` que precisam de
`useState`, `useTransition` ou interação client-side colidem com a arquitetura
Sprint 1 (RBAC server-side, guards no topo da página, sem `"use client"` no
arquivo de rota).
**Decisão:** Padrão de 2 arquivos por tela:
- `page.tsx` — Server Component com guards SSR (auth, role, status) no topo +
  Server Action `"use server"` inline pra mutações
- `XxxForm.tsx` — Client Component (`"use client"`) recebendo a Server Action
  via prop tipada `(formData: FormData) => Promise<void>`

A Server Action faz tudo que envolve banco/auth dentro do contexto SSR; o
Client Form cuida apenas de useState/useTransition/UX. Form usa
`<form action={handleAction}>` invocando a Server Action via `startTransition`
(ver DL-016 pra forma correta).
**Aplicar em:** refatorações futuras de `/app/tutor/perfil`,
`/app/tutor/historico`, `/app/vet/onboarding`, `/app/clinic/onboarding` quando
exigirem interação client-side.
**Status:** Aplicado em onboarding tutor.

### DL-013 — Migração lib/supabase/server pra API getAll/setAll
**Data:** 28 Abril 2026
**Sprint:** 2 — TASK-FIX-006 (commit 84d777d).
**Contexto:** Helper `createClient` em `lib/supabase/server.ts` (Sprint 1)
usava API legada de cookies do `@supabase/ssr` (`get`/`set`/`remove`). Essa
API tem comportamento inconsistente em Server Actions — refresh token rotation
não consegue escrever cookie atualizado em alguns contextos, resultando em
`auth.uid()` null e RLS rejeitando updates silenciosamente. Era débito
Sprint 1 que precisava ser pago de qualquer jeito.
**Decisão:** Migrar pra API atual `getAll`/`setAll` recomendada pelo
`@supabase/ssr` 0.8+. `setAll` envolto em try/catch silencioso é o padrão
oficial pra Server Components que não podem set cookies. Tipagem com
`CookieOptions` importado direto do pacote.
**Implicação:** Sem breaking changes nos 11 consumidores (assinatura externa
preservada). Não resolveu sozinho o bug de persistência do
`onboarding_completed` — esse era causado por DL-014.
**Status:** Resolvido.

### DL-014 — BUG CRÍTICO: is_master_admin/is_admin_master SECURITY INVOKER causava recursão infinita de RLS
**Data:** 28 Abril 2026
**Sprint:** 2 — fixado via SQL direto no Supabase Dashboard (fora do fluxo
Claude Code, fora do repo).
**Contexto:** Bug de persistência onde Server Action `completeOnboarding`
chamava `redirect("/app/tutor")` (303) mas `profiles.onboarding_completed`
continuava `false`. Diagnose foi longa: TASK-FIX-006 (cookies) e TASK-FIX-007
(`.select()` + logs) ajudaram a identificar o sintoma — `data` vazio ou erro
PostgreSQL `stack depth limit exceeded` (code 54001) — mas não resolveram a
causa raiz.
**Causa raiz:** Funções `is_master_admin()` e `is_admin_master()` no banco
estavam definidas como `SECURITY INVOKER` (default do Postgres). Como ambas
fazem `SELECT FROM profiles` e a policy `profiles_update_all_master` usa
`is_master_admin()` no `qual`, isso criava recursão infinita: UPDATE em
`profiles` → policy avaliada → função executada como caller (tutor) → SELECT
em `profiles` → policy avaliada de novo → ... → stack overflow.
**Fix aplicado:** `CREATE OR REPLACE FUNCTION` em ambas com
`SECURITY DEFINER` + `SET search_path = public`. Aplicado direto no SQL
Editor do Supabase Dashboard — alteração de função via migration ainda não
está estabelecida (Sprint 2 cria a pasta `supabase/migrations/`).
**Implicação:** Onboarding tutor passou a persistir `onboarding_completed=true`
corretamente. TASK-FIX-006/007/008 ficaram como diagnóstico+blindagem (ainda
valiosos isoladamente).
**Pendência:** Versionar essa alteração de função em SQL versionado quando
Sprint 2 oficialmente criar `supabase/migrations/`.
**Status:** Resolvido em produção, não versionado no repo.

### DL-015 — Lição: TODA função customizada em RLS deve ser SECURITY DEFINER + SET search_path = public
**Data:** 28 Abril 2026
**Sprint:** 2 — derivado de DL-014.
**Contexto:** O bug de DL-014 não foi código do projeto — era padrão SQL.
`SECURITY INVOKER` (default do Postgres) executa a função com permissões do
caller, o que aplica RLS na função. Se a função consulta a mesma tabela cuja
policy chama a função, vira recursão.
**Decisão:** Padrão Vetria, alinhado com docs oficiais do Supabase:
- TODA função customizada usada em policy de RLS declara `SECURITY DEFINER`
- TODA função `SECURITY DEFINER` declara `SET search_path = public` pra
  prevenir hijack via search_path (regra de hardening Postgres)
**Aplicar em:** futuras funções helper em RLS. Migration 001 (Sprint 2) que
vier criar funções helper pra `vet_profiles`/`clinic_profiles` deve seguir
esse padrão por default.
**Status:** Padrão estabelecido. Aguardando primeira aplicação versionada
em migration.

### DL-016 — useTransition + Server Action: callback síncrono sem try/catch
**Data:** 28 Abril 2026
**Sprint:** 2 — TASK-FIX-008 (commit ff26a75).
**Contexto:** Form do onboarding tutor usava
`startTransition(async () => { try { await action(formData); } catch { setMsg("Erro..."); }})`.
NEXT_REDIRECT (exceção especial do Next.js que sinaliza redirect) era
capturado pelo catch como "erro genérico", causando flash visual de mensagem
vermelha por ~200ms antes do redirect efetivo.
**Decisão:** Padrão correto pra Client Forms invocando Server Action:

```ts
function handleAction(formData: FormData) {
  setMsg("");
  startTransition(() => {
    action(formData);  // sem await, sem try/catch
  });
}
```

NEXT_REDIRECT borbulha pro framework normalmente. Erros legítimos da Server
Action vão pro error boundary do Next.js (próximo `error.tsx` ascendente).
**Implicação:** Aplicar em todos os Client Forms futuros (TutorOnboardingForm
já feito, VetOnboardingForm, ClinicOnboardingForm pendentes). Se feedback de
erro for crítico em alguma rota, criar `error.tsx` ali — não envolver Server
Action em try/catch.
**Status:** Aplicado em `TutorOnboardingForm.tsx`.

### DL-017 — Biblioteca `components/ui/`: telas de produção são a fonte canônica
**Data:** 23 Maio 2026
**Sprint:** 2 — TASK-028 (commit f24d874).
**Contexto:** Já existia um `components/ui/` versionado (commit 081e51b: Button,
Input, AuthShell) que NÃO batia com o visual das telas de produção (login/
onboarding/cadastro) e não era importado por nenhuma tela — código órfão de uma
tentativa abandonada. A task pedia "extrair os padrões exatos das telas".
**Decisão:** As telas de produção são a fonte visual canônica. `Button` e `Input`
foram reescritos pra bater EXATAMENTE com elas (primary `hover:bg-[#142E33]`,
`font-semibold`, `text-[15px]`, `py-3.5`; input pill `bg-fundo-claro/40` +
`border-transparent` + `focus:bg-white`). Criados `Select` (clone do SelectPill do
TutorOnboardingForm), `Card` (base dos cards de role do `/cadastro`) e `Label`
separado. `AuthShell.tsx` removido como dead code. Variantes `secondary`/`ghost` do
Button NÃO foram criadas (sem referência em tela); variante `google` incluída
(existe no `/login`).
**Implicações:**
- Não há `tailwind-merge` no projeto. Como o merge de `className` é só concatenação,
  utilitários conflitantes (ex.: `p-6` sobre o `p-8` base do `Card`) NÃO são
  resolvidos pela ordem da string — a ordem no CSS gerado decide. Regra prática:
  não sobrescrever via `className` um utilitário já presente na base; ajustar a base
  ou criar variante.
- As telas existentes ainda NÃO foram refatoradas pra usar os componentes (task futura).
**Status:** Resolvido.

### DL-018 — Header compartilhado `/app/*` vira Server Component com navegação por role
**Data:** 23 Maio 2026
**Sprint:** 2 — TASK-034 (commit a93dfb9).
**Contexto:** `app/app/layout.tsx` era placeholder estático (logo serif inline,
`<hr>`, nav fixa "Dashboard/Admin/Login" que ignorava role e mostrava "Login" pra
quem já estava logado).
**Decisão:** O layout virou Server Component async que busca `role` em `profiles`
(padrão DL-012: createClient server + getUser + select) e monta a navegação
contextual via um mapa `NAV_BY_ROLE`. Política firmada: a nav linka APENAS rotas que
já existem — nunca linka 404. Como as telas internas (perfil/histórico/avaliações/
equipe/aguardando) ainda não existem, hoje cada role vê só "Painel" + "Sair"; novas
entradas entram conforme as rotas forem criadas. `LogoutButton` restilizado (pill
ghost) com prop `className` opcional — lógica de signOut intacta.
**Implicações:**
- Trade-off aceito: o layout faz `getUser` + 1 query em `profiles` por render de
  `/app/*`, além da query da própria page. Aceitável pro estágio atual.
- Role ausente é tratado de forma defensiva (header mínimo, sem quebrar).
**Status:** Resolvido.

### DL-019 — `profiles` não tem `full_name`: identidade do usuário vem de `user_metadata`
**Data:** 23 Maio 2026
**Sprint:** 2 — TASK-008 (commit 4ba2219).
**Contexto:** A refatoração do dashboard `/app/tutor` precisava saudar o usuário pelo
nome ("Oi {nome}"). A auditoria confirmou que `profiles` NÃO tem coluna `full_name`
(só role, admin_level, admin_team, onboarding_completed, status, timestamps) e que
nenhum dado de pet é persistido (o onboarding só seta `onboarding_completed`).
**Decisão:** O greeting usa `user.user_metadata` (Google OAuth traz `full_name`/
`name`) com fallback pro prefixo do email e, por fim, "tutor". O dashboard é casca:
busca e quick-cards são visuais (sem destino — busca real é Sprint 3) e "Meus pets"
é mock com `// TODO`. A page não tem topbar próprio (o header da DL-018 cobre); o
`LogoutButton` duplicado do corpo foi removido.
**Implicações:**
- TASK-004 (`/cadastro/tutor`) deve gravar o nome em `user_metadata` (ou em coluna
  nova de `profiles` na migration 001) pra alimentar greeting/perfil.
- Telas de perfil (TASK-009 etc) e captura real de pets dependem do schema da TASK-029.
**Status:** Registrado.

### DL-020 — Dashboards de role são "casca fiel ao produto": sem mock, estado honesto + pipeline de status scaffolded
**Data:** 24 Maio 2026
**Sprint:** 2 — TASK-012 (`/app/vet`, commit b30c08d) e TASK-016 (`/app/clinic`, commit a52e234).
**Contexto:** Os protótipos de dashboard (vet/clínica) trazem métricas, feeds de
atividade, equipe e contatos com dados fictícios ricos. Surgiu a opção de portar
esses mocks pra impressionar numa apresentação aos donos. Mas tudo é pushado direto
na `main` → produção pública: números fake ("3 contatos, 47 visualizações", equipe
fictícia, plano R$ 499,90/mês) seriam vistos por qualquer usuário real como verdade,
e virariam dívida de limpeza quando o backend chegasse.
**Decisão:** Os dashboards são casca **fiel ao produto**, sem dado inventado. Mantêm
a estrutura corporativa densa (greeting, stat cards, painéis), mas em **estados
honestos**: métricas em "—/Em breve", listas em empty-state, e um card "Ativação do
perfil" que faz **scaffold do fluxo real de status** do §4.3 (incomplete →
pending_validation → active), hoje derivado de `onboarding_completed`. Mock pra demo,
se necessário, vai em preview deploy/branch separado — nunca na `main`.
**Implicações:**
- Padrão pros próximos painéis e telas internas (admin, perfil, etc): estrutura
  pensada pro futuro + estado honesto + `// TODO` em cada ponto de integração.
- Cada bloco "liga" ao backend na fase técnica (migration 029, busca Sprint 3, planos
  Sprint 6) sem mock a remover.
- CTAs nunca apontam pra rota inexistente (404): quando o destino ainda não existe,
  viram botão visual desabilitado com `// TODO` da task que o criará.
- O card de plano/cobrança da clínica foi omitido de propósito (monetização = Sprint 6).
**Status:** Aplicado em `/app/vet` e `/app/clinic` (coeso com `/app/tutor`, DL-019).

### DL-021 — `.vercelignore` dispensada: `vetria-proto/` já é invisível ao build
**Data:** 24 Maio 2026
**Sprint:** 2 — TASK-027 (não executada).
**Contexto:** A TASK-027 pedia criar `.vercelignore` com `vetria-proto/` pra evitar
que o protótipo fosse pro build da Vercel. A auditoria mostrou que `vetria-proto/` já
está no `.gitignore` (confirmado por `git check-ignore`) e não é rastreado
(`git ls-files` vazio). Como a Vercel buildA a partir do repo Git, o protótipo nunca
chega ao build — o `.vercelignore` seria redundante (e não há Vercel CLI instalado
pra deploy local).
**Decisão:** Não criar o arquivo. TASK-027 marcada N/A no BACKLOG.
**Implicações:** Se um dia `vetria-proto/` sair do `.gitignore` ou passar a ser
rastreado, reavaliar.
**Status:** Registrado (N/A).

### DL-022 — Catálogo de padrões de tela da casca (editor+preview, multi-step, aguardando, empty-state)
**Data:** 24 Maio 2026
**Sprint:** 2 — bloco de casca TASK-013/014/017/018/019/009/010/011/015/020 (commits 827e9f9..f4877b2).
**Contexto:** Ao refatorar perfis, onboardings, telas de espera e listas internas
dos 3 painéis, consolidaram-se padrões de tela reaproveitáveis, todos seguindo a
casca fiel ao produto (DL-020). Registrados como molde pro painel admin e telas futuras.
**Padrões estabelecidos:**
- **Editor + preview ao vivo** (perfil vet/clínica/tutor): Server Component com guards
  + Client form (DL-012); campos em estado client alimentam um preview sticky;
  `Salvar` desabilitado ("em breve") enquanto não há tabela de destino (vet/clinic_profiles
  — migration 031). Reusa `components/ui` Input/Label/Select.
- **Onboarding multi-step** (vet/clínica): sidebar verde de progresso (4 passos),
  navegação client (next/back), dados só visuais; `Concluir` chama a Server Action que
  apenas marca `onboarding_completed` (.select()+logs DL-011, submit DL-016) e
  redireciona pra a respectiva tela de `aguardando`.
- **Aguardando / timeline** (vet/clínica): header pulsante + timeline de 3 etapas
  espelhando o fluxo de status do §4.3; acessível pra visualizar (gating real = TASK-032).
- **Empty-state honesto** (histórico, avaliações, equipe, atividade): estrutura + copy
  do que virá, sem dado fictício, com `// TODO` no ponto de integração.
**Implicações:** TASK-021-025 (admin) e telas futuras devem reusar esses moldes. CTAs
nunca apontam pra rota inexistente — quando o destino não existe, viram botão
desabilitado com `// TODO`.
**Status:** Aplicado nos painéis tutor/vet/clínica.

### DL-023 — Cadastros: casca preparada com signUp escrito mas NÃO-ligado
**Data:** 24 Maio 2026
**Sprint:** 2 — TASK-004/005/006 (commits df1514c, 87de08c).
**Contexto:** Os forms de `/cadastro/{tutor,vet,clinica}` criariam conta via
`supabase.auth.signUp` — auth, que o HANDOFF marca como sensível e que o Elber não
consegue testar fora do navegador/Vercel.
**Decisão:** Entregar os forms como casca: visual Vetria (reusa `components/ui`) +
validação client (senha ≥8, senhas iguais, termos), mas com o `signUp` escrito como
bloco `// TODO` comentado (padrão exato do `/login`: `data` com full_name/cidade/role
+ `emailRedirectTo`). Submit válido mostra estado "ativado na próxima fase" — nada de
auth ao vivo em produção não-testada. Fecha os 404 dos cards de `/cadastro`.
**Implicações:** na fase pesada, descomentar o bloco liga o cadastro de verdade
(redireciona pro onboarding do role). Wire junto da migration/Resend.
**Status:** Forms no ar; `signUp` pendente de ligar.

### DL-024 — Admin dark: dashboard vira overview e /admin/usuarios hospeda o painel RBAC
**Data:** 24 Maio 2026
**Sprint:** 2 — TASK-021-025 (commits 7533d50, 15c38db).
**Contexto:** O `/admin` da Sprint 1 tinha layout/page inline + `AdminPanel`
FUNCIONAL (fetch `/api/admin/profiles` + ações `/api/admin/set-access`). O refator
visual dark exigia preservar essa lógica e organizar as 5 telas (021-025).
**Decisão:** Layout admin dark com sidebar própria (separada do header `/app`). O
**dashboard `/admin` virou overview** (stat cards "em breve" + cards de seção) e o
**painel funcional de RBAC migrou pra `/admin/usuarios`** (master-gated, lógica 100%
preservada — mesmo `AdminPanel`). `/admin/validacoes`, `/moderacao` e `/conteudo` são
empty-states dark honestos (sem backend; `// TODO` migration 031 / Sprint 5).
**Implicações:** a gestão de usuários agora vive em `/admin/usuarios`, não no
dashboard. Guards `role=admin` + gating `master` mantidos.
**Status:** Aplicado.

### DL-025 — Chrome do /app e layout por role (tutor=header, vet/clínica=sidebar — sidebar ADIADA)
**Data:** 24 Maio 2026
**Sprint:** 2 — chrome em cc887c9/9955bfe; decisão de layout registrada.
**Contexto:** Elber pediu "cara de app" (menu, sidebar, busca, notificação) e definiu:
**tutor = header topo clean** (experiência rápida, sem distração); **vet/clínica =
sidebar lateral** (tom corporativo, como os protótipos).
**Decisão (entregue agora):** no header `/app` entraram sino de notificações (dropdown
vazio honesto), menu hambúrguer mobile (`AppHeaderNav`) e busca in-page nos dashboards
vet/clínica — casca preparada, sem dado fake, `// TODO` pra ligar.
**Decisão (ADIADA):** a migração vet/clínica pra sidebar é refator de arquitetura —
exige **route group** pra tirar os onboardings do shell (senão fica sidebar dupla, já
que o onboarding tem sidebar de progresso própria) e reorganiza o layout raiz. Como
reformata todo o `/app` e o build verde NÃO garante a UX, **fica pra uma sessão com
navegador** (não fazer no escuro/mobile). Registrada como TASK-038.
**Implicações:** próxima sessão com browser pega a TASK-038 (sidebar + route group do
onboarding + busca na topbar). Tutor permanece no header.
**Status:** Chrome aplicado; sidebar pendente (TASK-038).

### DL-026 — Separação tutor (humano/B2C) × vet+clínica (B2B): login único, separação no cadastro/funil
**Data:** 24 Maio 2026
**Sprint:** 2 — TASK-039 (commit b1be7ae).
**Contexto:** Elber detalhou a visão fundadora (estilo Doctoralia): dois públicos com
dois funis que se cruzam o mínimo possível. O **tutor** é o lado HUMANO/B2C — está com
o pet doente, com pressa → fluxo simples e aberto, SEM escolhas/travas, gratuito (não
paga; "paga" com dados/uso); é o rosto público (busca, comunidade) e NÃO pode sentir o
lado empresarial. **Vet/clínica** são o lado B2B — pagam, verificação técnica mais
longa, linguagem comercial, entram por FORA do fluxo do tutor (landings de
profissionais já prototipadas, linkadas no rodapé/tráfego B2B).
**Decisão:** A separação NÃO é no login — é no cadastro/funil. **1 login compartilhado**
(`/login`) pra todos; pós-login cada conta já tem `role` → vai direto pro painel certo,
sem perguntar nada. `/cadastro` deixou de ser a vitrine de 3 cards (misturava
tutor+vet+clínica) e virou **entrada direta do tutor** (`redirect("/cadastro/tutor")`);
vet/clínica seguem em `/cadastro/vet` e `/cadastro/clinica`, alcançados só pelas
landings B2B (a escolha "vet ou clínica" vive no lado B2B, nunca no fluxo do tutor). A
tela genérica de escolha de role (`/onboarding`, 3 cards) fica aposentada pra esse fim.
Código marcado com comentários `// HUMANO/consumidor` vs `// B2B/empresarial`.
**Implicações:**
- Decisão permanente — não quebrar sem confirmar com o Elber. Linguagem/tom das landings
  B2B = fora de escopo por enquanto (foco é casca + rotas).
- Homepage `/` futura = cara consumidor (busca + destaques); parte empresarial no rodapé.
- Sustenta-se no `role` vindo do metadata (DL-027) com default `tutor`.
**Status:** Roteamento/funil aplicado (b1be7ae). Validação no navegador pendente (Elber).

### DL-027 — Migration 0001 + pasta `supabase/migrations/`: trigger `handle_new_user` lê role do metadata + hardening
**Data:** 24 Maio 2026
**Sprint:** 2 — commit 8abdc7a; SQL aplicado em prod (Supabase SQL Editor, "Success").
**Contexto:** O trigger antigo inseria só o `id` em `profiles`, então `role` caía sempre
no DEFAULT (a escolha de role do cadastro era ignorada). Além disso a função era
`SECURITY DEFINER` SEM `SET search_path` (gap de hardening, DL-015). A pasta
`supabase/migrations/` ainda não existia (CONTEXT §3 a pedia desde a Sprint 2).
**Decisão:** Criada a pasta `supabase/migrations/` (com README do fluxo manual — sem
Supabase CLI, aplica-se copiando o SQL no SQL Editor e anotando a data). Migration
`0001_handle_new_user_role_from_metadata.sql` (`CREATE OR REPLACE`, aditiva, idempotente,
não toca contas existentes) faz o trigger:
- ler `role` de `raw_user_meta_data` (aceita só `tutor`/`vet`/`clinic`); **default `tutor`**
  quando ausente (login/Google) — isso é INTENCIONAL (consumidor padrão, DL-026), não bug;
- `admin` NUNCA aceito via metadata (admin só concedido no banco);
- popular `full_name` (do cadastro ou do nome do Google);
- `SET search_path = public` (corrige o gap da DL-015).
**Implicações:**
- 1ª migration versionada do projeto. Falta versionar a redefinição de
  `is_master_admin`/`is_admin_master` (DL-014, TASK-FIX-009) e a migration grande de
  schema (TASK-029: `status` + `vet_profiles`/`clinic_profiles`).
- "vet/clínica nascem com o role certo" só vale com os cadastros mandando role no signUp
  (DL-028).
**Status:** Aplicada em prod 24/05/2026; versionada no repo.

### DL-028 — signUp LIGADO nos 3 cadastros (atualiza DL-023)
**Data:** 24 Maio 2026
**Sprint:** 2 — commit 908ba5e.
**Contexto:** Pela DL-023, os forms de `/cadastro/{tutor,vet,clinica}` tinham o `signUp`
escrito como bloco `// TODO` comentado (casca, sem auth ao vivo). Com a migration 0001
aplicada (DL-027), o caminho ficou seguro pra ligar.
**Decisão:** Os 3 forms agora chamam `supabase.auth.signUp` de verdade (mesmo padrão do
`/login`), passando `role` no metadata (`tutor`/`vet`/`clinic`) + `full_name`/`cidade`
(e `cnpj` na clínica) e `emailRedirectTo` pro `/auth/callback`. Botão com estado
`loading`; mensagens reais de erro/sucesso ("confirme o email"). Email confirmation ON
(DL-009) continua valendo. Fluxo de ponta a ponta:
`/cadastro/vet → signUp(role:vet) → email de confirmação → /auth/callback → /app/vet/onboarding`
(idem tutor e clínica pros respectivos onboardings).
**Implicações:**
- DL-023 fica superada nesta parte (signUp deixou de ser TODO).
**Status:** ✅ Validado no navegador (24/05/2026): cadastro tutor/vet/clínica por rota →
cai no painel certo (`/app/vet`, `/app/clinic`, `/app/tutor`); onboarding dos dois
funcional. signUp + role via metadata + trigger confirmado de ponta a ponta. (A entrega
de email passou a funcionar via DL-030.)

### DL-029 — Referências locais de design (HTML/zip) gitignored, mas preservadas
**Data:** 24 Maio 2026
**Sprint:** 2 — commit 20a9c3d.
**Contexto:** Surgiram na raiz arquivos de referência de design (`design-system.html`,
`vetria-visualizador-v2.html`, `vetria-proto-completo.zip`). NÃO devem ir pra produção,
mas NÃO devem ser apagados — são peças-base pra criar o design das telas (mesmo espírito
da DL-001/DL-021 do `vetria-proto/`).
**Decisão:** Adicionados `/*.html` e `/*.zip` ao `.gitignore` (raiz) — ficam só no disco
local, fora do repo/build. (Next.js não tem HTML rastreável na raiz, então o padrão é seguro.)
**Implicações:** novas referências de design soltas na raiz (`.html`/`.zip`) são
auto-ignoradas. Se algum HTML de raiz precisar ser versionado um dia, reavaliar o padrão.
**Status:** Aplicado.

### DL-030 — Resend integrado como Custom SMTP do Supabase (modo teste validado; produção depende do domínio)
**Data:** 24 Maio 2026
**Sprint:** 2 — TASK-030 (config no painel, sem código no repo).
**Contexto:** Na validação da DL-028, confirmou-se na prática o que DL-009/DL-010 previam:
os emails de confirmação do **servidor built-in do Supabase NÃO chegavam** (nem no spam) —
baixa entregabilidade + rate limit. O login social (Google) funcionava por não depender
de email. Sem email, os funis B2B (vet/clínica, que são email+senha por causa do role —
DL-026/027) ficavam sem como confirmar conta.
**Decisão:** Integrar o **Resend como Custom SMTP** no Supabase (Authentication → Emails →
SMTP Settings). Validado em **MODO TESTE**: sender `onboarding@resend.dev`, host
`smtp.resend.com`, porta `465`, user `resend`, password = API key do Resend (guardada só
no painel do Supabase, NUNCA no repo). Nesse modo o Resend só entrega pro email da própria
conta Resend — o teste foi feito com o email da Vetria cadastrado no Resend e **o email
chegou**. O **"Confirm email" foi religado** (DL-009 restaurado) — durante a Parte 1 da
investigação ele foi desligado temporariamente só pra provar que o roteamento de role
funciona sem depender de email (provou: ✅).
**Implicações:**
- Pra enviar pra **qualquer endereço** e com remetente **@vetriabrasil.com.br**, falta
  **verificar o domínio `vetriabrasil.com.br` no Resend** (DKIM/SPF/DMARC no DNS do Hostinger).
  O Elber fará quando configurar o domínio + email corporativo da Vetria.
- Com o domínio no ar, dá pra ligar de verdade a recuperação de senha (`/recuperar-senha`
  hoje é mock, TASK-007) e os templates de email (welcome/aprovado/rejeitado — §9).
- A API key vive no Supabase. Se rotacionada no Resend, atualizar no painel.
**Status:** Modo teste validado (24/05/2026). Verificação de domínio = pendente (Elber).

### DL-031 — Sidebar shell premium pra vet/clínica via route group `(painel)` (fecha TASK-038)
**Data:** 24 Maio 2026
**Sprint:** 2 — bloco visual v2, commit 1acb678.
**Contexto:** Os painéis vet/clínica usavam só o header topo (DL-018). A referência v2 desenha
um shell com sidebar à esquerda. O risco (DL-025) era sidebar dupla: um único `layout.tsx`
envolvia tudo, inclusive o onboarding (que tem sidebar de progresso própria).
**Decisão:** Criado `components/app/AppShell.tsx` (sidebar com seções Principal/Conta + rodapé
avatar/nome/sair + topbar com hambúrguer→drawer mobile, busca, sino; ícones lucide-react). As
telas de painel foram movidas pra um **route group `(painel)`** em `app/app/{vet,clinic}/` com
um `layout.tsx` próprio que aplica o shell; o **onboarding fica fora do grupo** (sem sidebar
dupla). URLs inalteradas (`(painel)` é invisível na rota). Imports relativos → alias `@/`.
Adicionada dep `lucide-react`. Layout raiz `/app` virou role-aware: tutor segue no header topo,
vet/clínica = passthrough (chrome vem do route group).
**Implicações:** novas telas de painel criadas dentro de `(painel)` herdam a sidebar
automaticamente. Tutor permanece no header (lado humano).
**Status:** ✅ Validado no navegador (sidebar + drawer + onboarding sem dupla).

### DL-032 — Tipografia: Inter ÚNICA (tentativa de serif Poppins+Cormorant revertida)
**Data:** 24 Maio 2026
**Sprint:** 2 — bloco visual v2, commits c6d2a9f (tentativa) → b31bae4 (revert).
**Contexto:** Uma versão divergente de referência (`design-system (1).html`) sugeria corpo
**Poppins** + títulos **Cormorant Garamond** (serif). Foi aplicado via `next/font` (DL-031 chegou
a registrar isso). Ao revisar com o `vetria-visualizador-v2.html` (a referência REAL, "corrigida
com manual oficial"), o Elber confirmou: o manual manda **Inter única** no corpo e nos títulos, e
a serif "não ficou boa".
**Decisão:** Revertida a serif. `app/layout.tsx` carrega **Inter** via `next/font` (var
`--font-inter` → `--font-sans`); `globals.css` não tem mais `--font-display`. Vale pra todo o app.
**Implicações:** o "Inter única" do CONTEXT §6/DL-006 volta a valer (a tentativa de troca foi
descartada). Fonte de verdade do design = `vetria-visualizador-v2.html` (ignorar o `design-system
(1).html` quando conflitar).
**Status:** ✅ Aplicado e no ar.

### DL-033 — Design system v2 portado pros tokens `@theme` do Tailwind v4
**Data:** 24 Maio 2026
**Sprint:** 2 — bloco visual v2, commits b31bae4, 9940849.
**Contexto:** O `globals.css` tinha só as 5 cores oficiais + radius pill. A referência define um
sistema bem maior (variações deep/soft, neutros, estados, escala de raios, sombras, easing).
**Decisão:** Portado o `:root` da referência pros tokens `@theme` → viram utilitários Tailwind
(`bg-principal`, `text-titulo`, `shadow-md`, `rounded-lg`, `border-neutro-border` etc.). Paleta:
principal `#1E4349`, fundo-claro `#F5F0E1`, título `#1A1A1A`, corpo-texto `#4A6064`,
fundo-destaque `#EAFAF5` + principal-deep/soft, neutros, estados (success/error/warning/whatsapp/
focus), raios sm..pill, sombras sm/md/lg/focus.
**Implicações:** componentes seguem em React/Tailwind usando os tokens (não CSS global). **Fix
não-óbvio (9940849):** a regra global `h1..h6 {color: titulo}` pintava de preto títulos sobre
fundo escuro (o "Olá, {nome}" do card verde sumia); corrigido com `.text-white :is(h1..h6){color:
inherit}`.
**Status:** ✅ Aplicado e no ar.

### DL-034 — Estado GHOST: "ghost onde ensina, empty seco onde acalma" (refina DL-020)
**Data:** 24 Maio 2026
**Sprint:** 2 — bloco visual v2, commits 7b6e600, c736d52, eb8a73e, 3979e9f.
**Contexto:** A casca mostrava muitos "em breve" secos — o Elber não conseguia "ver o que tem
dentro das telas". A referência é toda populada com dado de exemplo, mas o DL-020 proíbe dado
fake ("47 visualizações"). Conflito entre ver o design vivo × não mentir dado.
**Decisão:** Criado `components/ui/EmptyState.tsx` (+ `Skeleton`, `GhostRow`). Padrão GHOST:
mostra o **esqueleto do conteúdo** (linhas/cards fantasma `animate-pulse`) + **texto honesto** do
que vai aparecer. Equilíbrio definido com o Elber: **ghost** onde é lista/tabela/feed e a forma
ensina (atividade, contatos, avaliações, equipe, filas do admin, novos perfis); **empty seco**
onde o vazio é calmo/positivo (próximas consultas, pets, agenda) — ghost ali pareceria
"carregando pra sempre". Removido o **mock** de pets "Mel/Pingo" do dashboard tutor (era violação
do DL-020). Ícones inline migrados pra lucide no caminho.
**Implicações:** ao alinhar qualquer tela da casca, escolher ghost vs seco pela regra (não default
ghost). Quando o backend ligar, o ghost dá lugar a dado real + vazio honesto pra quem não tem dados.
**Status:** ✅ Aplicado em dashboards (vet/clínica/tutor), tutor histórico/avaliações, clínica
equipe, admin (validações/moderação/conteúdo via `AdminEmptyScreen`).

### DL-035 — Home pública do consumidor em `/`
**Data:** 24 Maio 2026
**Sprint:** 2 — bloco visual v2, commit 99a971d.
**Contexto:** `/` era só `redirect` (DL/TASK-026). A referência tem a landing pública do
consumidor (única tela estrutural que faltava).
**Decisão:** `app/page.tsx` agora renderiza a Home pública (header + hero com busca +
categorias + como funciona + "Novos perfis" + confiança + CTA B2B + blog + footer), fiel ao
`vetria-visualizador-v2.html`. Honesto: busca e newsletter **desabilitadas** ("em breve"), "Novos
perfis" em **ghost** (sem profissional inventado), blog marcado "em breve". CTA B2B aponta pros
funis reais (`/cadastro/vet`, `/cadastro/clinica`). **Routing:** deslogado vê a Home; logado
redireciona pro `/app`. Ícones de marca (Instagram etc.) viraram texto — a versão do `lucide-react`
removeu brand icons por trademark.
**Implicações:** a busca real + perfil público (fase de backend) substituem o estado desabilitado/
ghost. Se quiser logado também ver a Home, trocar o redirect por header adaptativo.
**Status:** ✅ No ar.

### DL-036 — Itens "em breve" da sidebar ativados como casca navegável
**Data:** 24 Maio 2026
**Sprint:** 2 — bloco visual v2, commit e90aaca.
**Contexto:** Os itens da sidebar sem rota (Contatos, Agenda, Avaliações, Meu plano,
Configurações, Ajuda) eram rótulos desabilitados (`soon:true`, anti-404 do DL-025). O Elber pediu
pra deixá-los clicáveis.
**Decisão:** Criadas as 12 páginas (6 itens × vet+clínica) dentro do `(painel)`, com conteúdo
compartilhado em `components/app/cascas.tsx` + helper `lib/auth/painel.ts` (`requirePainel(role)`
centraliza o guard). Sidebar: `soon:true` → `href` nos dois layouts. Tratamento por item: Contatos/
Avaliações = ghost; Agenda = empty seco; Configurações = nome/email reais (read-only) + ações "em
breve"; Ajuda = FAQ + contato; **Meu plano = "Gratuito · beta" SEM preço** (respeita a decisão de
não pré-anunciar valor — planos = Sprint 6, ver DL-020/§ dashboard clínica).
**Implicações:** nenhum item morto na sidebar. As páginas backend-gated dão lugar a dado real na
fase pesada; Meu plano ganha tabela de preço só com Stripe (Sprint 6).
**Status:** ✅ No ar (47 rotas no build).

### DL-037 — Rota `/roadmap` viva (status real, isolada, noindex)
**Data:** 25 Maio 2026
**Sprint:** 2 — bloco visual v2, commit 7e529a6.
**Contexto:** O Elber quer um roadmap pros donos da Vetria que tire a ansiedade de
ver o negócio crescer, mostrando o que já foi feito de verdade. Havia um desenho
(`roadmap.html`, ref local gitignored), mas com status incongruente com a realidade.
**Decisão:** Criada a rota **`/roadmap`** (`app/roadmap/page.tsx`): isolada (não
linkada em nenhuma navegação; acessível só por link direto), `robots: {index:false,
follow:false}`, mas commitada e no mesmo domínio. Conteúdo vem de um array tipado
`SPRINTS` (status `done|doing|todo` por sprint e por item) + const `ATUALIZADO`; a
barra de progresso e contadores derivam do array. **Status reconciliado à realidade,
não ao desenho:** Sprint 1 done; Sprint 2 doing com a casca visual de todo o produto
+ Home + telas de onboarding marcadas done (marco visível), e persistência/estados/
bloqueio de busca como doing/todo (dependem do backend); Sprints 3-7 planejadas.
Tokens v2 + lucide, sem travessão.
**Implicações (REGRA VIVA):** a cada avanço grande o suficiente pra mover o status
(fechar tarefa/bloco, virar de sprint, marco visível), atualizar o array `SPRINTS` +
`ATUALIZADO` no mesmo commit. Se a realidade divergir do que o design representa,
ajustar o design.
**Status:** ✅ No ar (48 rotas no build).

### DL-038 — Política de copy: sem travessão (em dash) no texto visível
**Data:** 25 Maio 2026
**Sprint:** 2 — bloco visual v2, commit 54250f3.
**Contexto:** O travessão (—) virou "tell" de texto gerado por IA; o Elber apontou
que tira credibilidade (donos pensam que foi feito só por IA).
**Decisão:** Varredura removendo `—` de todo texto que renderiza pro usuário
(descrições, placeholders, títulos, metadata, mensagens, FAQ, `DEMO.md`), trocando
por vírgula, ponto ou dois-pontos conforme o contexto. Comentários de código e docs
internos (CONTEXT/BACKLOG) não foram varridos (não são vistos por usuário/donos).
**Implicações:** ao escrever QUALQUER copy/UI nova, não usar `—`. O `·` (ponto médio)
é aceitável como separador.
**Status:** ✅ Aplicado (16 arquivos + DEMO.md).

### DL-039 — Camada de entrada completa: domínio oficial + email real + recuperação de senha
**Data:** 25 Maio 2026
**Sprint:** 2 (fecha a meta "login perfeito" definida pelo Elber pra esta etapa).
**Contexto:** A meta de fechamento era entregar a camada de entrada (login, cadastro,
confirmação, recuperação de senha) 100% funcional no domínio oficial — mesmo que os dados
de teste sejam zerados depois.
**Decisão/execução:** Domínio `vetriabrasil.com.br` (Hostinger) apontado pra Vercel — site
no ar no domínio. Resend com domínio verificado (DKIM/SPF/DMARC) → SMTP do Supabase enviando
de `contato@vetriabrasil.com.br`. Recuperação de senha ligada de verdade (commit 5f3277f):
`/recuperar-senha` chama `resetPasswordForEmail`; `/auth/callback` honra `?next`; nova tela
`/recuperar-senha/nova` (`updateUser`). **Bug resolvido:** o link de reset caía em `/?code=`
na home porque o site responde em `www` e a Redirect URL do Supabase só tinha o host sem
`www` → o Supabase ignorava o redirect e caía na Site URL. Fix = adicionar os DOIS hosts
(`https://vetriabrasil.com.br/**` e `https://www.vetriabrasil.com.br/**`) nas Redirect URLs.
**Implicações:** cadastro→confirmação→login e recuperação→nova senha validados ponta a ponta
em produção (25/05/2026). Emails novos caem em spam no começo (aquecimento de domínio); DMARC
ÚNICO (`v=DMARC1`) + marcar "não é spam" resolvem com o tempo. Pendência menor: setar
`NEXT_PUBLIC_SITE_URL` na Vercel + padronizar canonical www/apex.
**Status:** ✅ Validado em produção.

### DL-040 — Fechamento da Fase 2: marca, emails, infra e rota de entrega
**Data:** 25 Maio 2026
**Sprint:** 2 (fechamento). Commits: logos b/734.., next.config, cursor, emails, /entrega-fase-2.
**Contexto:** Reta final da Fase 2 — aplicar a marca oficial, emails transacionais e o doc de entrega.
**Decisões/execução:**
- **Logo oficial**: SVGs `logo-vetria-fundo-claro.svg` (verde, p/ fundo claro) e `logo-vetria-fundo-escuro.svg` (creme, p/ fundo escuro) aplicadas em todas as telas. **`next.config.ts` tem `images.dangerouslyAllowSVG: true` + CSP sandbox — NÃO REMOVER** (sem isso o next/image quebra a logo SVG). **Lição:** arquivos em `public/` precisam ser `git add`ados — os SVGs ficaram untracked e davam 404 só em produção.
- **cursor:pointer global** no `globals.css` (Tailwind v4 parou de aplicar em `<button>`).
- **Emails transacionais**: 6 templates HTML em `email-templates/` (tabelas+inline, logo PNG pois email não renderiza SVG: topo = `logo-square.png` circular, rodapé = `logo-email.png` horizontal gerada da SVG via sharp). Os 3 do Supabase (confirm/reset/change email) aplicados no dashboard com `{{ .ConfirmationURL }}`; os 3 do app (boas-vindas/aprovado/ajuste) versionados e marcados "NÃO ATIVO" (fase backend).
- **Rota `/entrega-fase-2`**: HTML estático em `public/entrega-fase-2.html` + rewrite e header `X-Robots-Tag: noindex` no `next.config`. **Padrão reutilizável** pras próximas fases (fase 3/4 = copiar HTML p/ public + 1 rewrite + 1 header). O HTML-fonte na raiz é gitignored; o que vai pro ar é a cópia em `public/`.
**Pendências menores (abertas, não bloqueiam):**
- Setar `NEXT_PUBLIC_SITE_URL=https://vetriabrasil.com.br` na Vercel (Production) + padronizar canonical www × apex.
- Tela de consentimento OAuth do Google (nome "Vetria"+logo) — não precisa billing (ver memória).
- Aquecimento de email (cai em spam no início): DMARC único + marcar "não é spam".
- Customizar templates de email do §9 (estético, opcional).
**Status:** ✅ Fase 2 entregue. Camada de entrada 100% no domínio oficial; produto visual completo; relatório em `/entrega-fase-2`. Próximo: Fase 3 (backend pesado) — migration grande.

---

## ÚLTIMA REGRA

> **Se algo nesse arquivo entrar em conflito com algo que o usuário humano pedir, perguntar antes de fazer.**
>
> Esse arquivo é a verdade do projeto. Conflito = ou esqueceu uma regra ou decidiu mudar. Em qualquer caso, **confirmar antes**.