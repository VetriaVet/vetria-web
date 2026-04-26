# 🧠 CONTEXT.md — Cérebro do Projeto Vetria

> **PARE.** Se você é o Claude Code começando uma nova sessão, **leia esse arquivo inteiro antes de qualquer ação**. Não pule, não inventa, não improvisa.
>
> Esse arquivo existe pra que toda sessão tenha o mesmo contexto e siga as mesmas regras. Ele substitui a necessidade de eu (humano) explicar o projeto de novo.
>
> **Última atualização:** _data quando você atualizar_

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

### O que já funciona (Sprint 1 — concluída)
- ✅ Login email + senha (Supabase Auth)
- ✅ Login Google OAuth
- ✅ Tabela `profiles` com roles
- ✅ RBAC (5 roles: tutor, vet, clinic, admin, master)
- ✅ Painéis isolados por role
- ✅ Redirecionamento inteligente após login
- ✅ Admin com `/admin`, `admin_level`
- ✅ Deploy contínuo na Vercel

### O que NÃO existe ainda
- ❌ Tabelas `vet_profiles`, `clinic_profiles` (criar na Sprint 2)
- ❌ Campo `status` em profiles
- ❌ Onboarding de identidade real
- ❌ Email transacional (Resend não integrado)
- ❌ Perfis públicos
- ❌ Busca pública
- ❌ Agendamento
- ❌ Stripe

---

## 3. STACK TÉCNICA

| Camada | Tecnologia |
|---|---|
| Frontend público (futuro) | WordPress (Hostinger) |
| App principal | Next.js (App Router) |
| Hosting | Vercel |
| Auth + DB | Supabase |
| Email transacional | Resend |
| Pagamentos (Sprint 6) | Stripe |
| OAuth | Google Cloud |
| Versionamento | GitHub |

### Estrutura de rotas no Next.js
```
/login
/onboarding              ← escolha de role após Google OAuth sem role
/cadastro
  /tutor
  /vet
  /clinic
  /empresa
/app
  /tutor
  /vet
  /clinic
/admin
/api/*
```

### Estrutura de pastas no repo
```
projeto-vetria/
├── app/                  ← Next.js App Router
├── lib/                  ← funções utilitárias, supabase clients
├── public/               ← assets estáticos servidos
├── supabase/migrations/  ← SQL versionado (criar)
├── vetria-proto/         ← protótipo HTML (REFERÊNCIA, não vai pra produção)
├── middleware.ts         ← RBAC server-side
└── ...
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

### 4.2 — Tabela `profiles` (já existe em produção)
```
id                       uuid (= auth.users.id)
role                     enum (tutor|vet|clinic|admin|master)
admin_level              enum (comum|master)  -- só relevante se role=admin
admin_team               text                  -- ex: ops, suporte, conteudo
onboarding_completed     boolean
status                   enum (incomplete|pending_validation|active|suspended)  -- ADICIONAR Sprint 2
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
pending_validation → incomplete  (admin reprova, pede info)
active → suspended               (admin suspende, futuro)
```

### 4.4 — Regra de visibilidade na busca
Pra um vet ou clínica aparecer na busca pública:
1. `role IN ('vet', 'clinic')`
2. `status = 'active'`
3. (Sprint 6+: `plano_ativo = true`)

**Filtro acontece no backend, não no frontend.** O backend nunca retorna registros que não atendem essas condições.

---

## 5. ROADMAP DE SPRINTS

```
✅ Sprint 1 — Base técnica + Auth + RBAC                 [CONCLUÍDA]
🟢 Sprint 2 — Onboarding + identidade + Resend           [PRÓXIMA]
🟡 Sprint 3 — Perfis públicos + busca
🟠 Sprint 4 — Agendamento (Google Calendar)
🔵 Sprint 5 — Retenção (favoritos, histórico, avaliações)
🟣 Sprint 6 — Monetização (Stripe — só aqui)
⚫ Sprint 7 — Escala (chat, telemedicina, IA, mobile)
```

### Sprint 2 — escopo congelado
**Objetivo:** transformar usuários genéricos em entidades reais.

**Entregáveis:**
- [ ] Tabela `vet_profiles` no Supabase com RLS
- [ ] Tabela `clinic_profiles` no Supabase com RLS
- [ ] Campo `status` em `profiles` com enum
- [ ] Página `/onboarding` (escolha de role pós Google OAuth) — 3 cards
- [ ] Página `/app/vet/onboarding` (multi-step CRMV)
- [ ] Página `/app/clinic/onboarding`
- [ ] Página `/app/tutor/onboarding`
- [ ] Página `/app/vet/aguardando` (estado pending_validation)
- [ ] Lógica de bloqueio: `status != active` redireciona pra aguardando
- [ ] Resend integrado: confirmação de email + notificação de aprovação CRMV
- [ ] Triggers Supabase: `updated_at` automático
- [ ] RLS policies para cada role poder ler/escrever só seus próprios dados

**O que NÃO entra na Sprint 2:**
- Busca pública (Sprint 3)
- Perfis públicos `/vet/[slug]` (Sprint 3)
- Agendamento (Sprint 4)
- Stripe (Sprint 6)
- Avaliações públicas (Sprint 5)

---

## 6. REFERÊNCIA VISUAL — PROTÓTIPO

A pasta `vetria-proto/` no repo tem **25 telas HTML estáticas** que mostram exatamente como cada tela deve ficar visualmente. **É a referência, não código de produção.**

Pra ver as telas:
```bash
# Abrir o menu visual
open vetria-proto/_index.html
```

Essas telas seguem:
- Tipografia: **Inter** (única, conforme manual oficial)
- Paleta: 5 cores nomeadas no `:root`
- Componentes: pill (radius 999px) em inputs e botões
- Logo: PNG oficial em `vetria-proto/assets/logo-square.png`

**Quando implementar uma tela em Next.js, abre a HTML correspondente e segue.** Não inventa visual diferente.

---

## 7. REGRAS DE OURO (não quebrar nunca)

### 7.1 — Não inventar feature
> "Não inventar funcionalidades. Não assumir comportamentos. Não extrapolar escopo."

Se não está no roadmap ou nesse arquivo, **pergunta antes de implementar.**

### 7.2 — Não pular sprint
Stripe NÃO entra antes da Sprint 6. Busca pública NÃO entra antes da Sprint 3. Cada coisa no seu tempo.

### 7.3 — Backend valida tudo
RBAC, status, validações — sempre no backend. **Nunca confiar só no frontend.**

### 7.4 — Não mexer em produção sem migration
Toda alteração de schema vai em arquivo SQL versionado em `supabase/migrations/NNN_descricao.sql`.

### 7.5 — Não commitar secrets
`.env.local` está no `.gitignore`. Antes de qualquer push, conferir.

### 7.6 — Não destruir dados de prod
Toda migration deve ser **aditiva** (não destrutiva). `ALTER TABLE ADD COLUMN` é OK. `DROP TABLE` precisa de procedimento de backup primeiro.

---

## 8. SEGURANÇA — CHECKLIST CONTÍNUO

- [ ] `.env.local` no `.gitignore`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **nunca** no client (sem `NEXT_PUBLIC_`)
- [ ] `NEXTAUTH_SECRET` único por ambiente (gerado com `openssl rand -base64 32`)
- [ ] RLS ativo em **todas** as tabelas (sem exceção)
- [ ] Middleware `middleware.ts` valida role em rotas protegidas
- [ ] APIs em `/app/api/*` validam sessão e role
- [ ] `vercel env ls` confere variáveis nos 3 ambientes
- [ ] Branch `main` protegida no GitHub (PR obrigatória pra merge)

---

## 9. EMAIL TRANSACIONAL (Resend)

### Templates a criar (Sprint 2)
- `welcome.tsx` — após cadastro confirmado
- `password-reset.tsx` — recuperação de senha
- `vet-approved.tsx` — quando admin aprova CRMV
- `vet-rejected.tsx` — quando admin reprova com motivo
- `clinic-approved.tsx` — clínica aprovada
- `clinic-rejected.tsx` — clínica reprovada

### Padrão dos emails
- Logo da Vetria no topo
- Tom: profissional, direto, sem exagero
- Cor principal: `#1E4349` (verde-petróleo)
- Footer com CNPJ, endereço, link de unsubscribe

---

## 10. COMO USAR ESSE ARQUIVO

**No início de cada sessão do Claude Code:**

1. Ler esse arquivo inteiro
2. Conferir qual sprint está ativa
3. Ver o checklist da sprint
4. Pegar UMA task do checklist
5. Implementar
6. Atualizar esse arquivo se decidiu algo novo
7. Commitar

**Esse arquivo é vivo.** Decidiu algo? Documenta aqui. Mudou algo? Atualiza aqui. Daqui a 6 meses você não vai lembrar — mas esse arquivo lembra.

---

## 11. CONTATOS E RECURSOS

- Dashboard Supabase: https://app.supabase.com/project/_______
- Dashboard Vercel: https://vercel.com/_______
- Dashboard Resend: https://resend.com/_______
- GitHub: https://github.com/_______
- Domínio: vetria.com.br

_(preencher os links acima)_

---

## ÚLTIMA REGRA

> **Se algo nesse arquivo entrar em conflito com algo que o usuário (humano) pedir, perguntar antes de fazer.**
>
> Esse arquivo é a verdade do projeto. Se o usuário pedir algo que conflita, ou ele esqueceu uma regra ou ele decidiu mudar — em qualquer caso, **confirmar antes**.
