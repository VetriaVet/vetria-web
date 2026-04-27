# 🧠 CONTEXT.md — Cérebro do Projeto Vetria

> **PARE.** Se você é o Claude Code começando uma nova sessão, **leia esse arquivo inteiro antes de qualquer ação**. Não pule, não invente, não improvise.
>
> Esse arquivo existe pra que toda sessão tenha o mesmo contexto e siga as mesmas regras.
>
> **Última atualização:** 26 de Abril de 2026 — diagnóstico completo do código + decisões de fundação

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
- ❌ Páginas `/app/vet/aguardando` e `/app/clinic/aguardando`
- ❌ Pasta `supabase/migrations/`
- ❌ Email transacional (Resend não integrado)
- ❌ Tailwind CSS instalado

---

## 3. STACK TÉCNICA

| Camada | Tecnologia | Status |
|---|---|---|
| App principal | Next.js (App Router) | ✅ Em produção |
| Hosting | Vercel | ✅ Deploy automático ativo |
| Auth + DB | Supabase | ✅ Em produção |
| Styling | Tailwind CSS | ⏳ A instalar (DL-003) |
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
- [ ] Conta Resend criada + domínio vetria.com.br verificado (DKIM, SPF, DMARC)
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
- Domínio: vetria.com.br

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

---

## ÚLTIMA REGRA

> **Se algo nesse arquivo entrar em conflito com algo que o usuário humano pedir, perguntar antes de fazer.**
>
> Esse arquivo é a verdade do projeto. Conflito = ou esqueceu uma regra ou decidiu mudar. Em qualquer caso, **confirmar antes**.