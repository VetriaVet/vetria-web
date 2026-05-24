# 📋 VETRIA — BACKLOG DE TASKS AUTÔNOMAS

> Tasks organizadas por **fase**, **nível de autonomia** e **dependência**.
> Cada uma tem prompt pronto pra colar no Claude Code.

> **Como usar:**
> Elber pede "próxima task" no chat 2 → chat 2 consulta esse arquivo → entrega prompt → Elber cola no Claude Code → após conclusão Elber avisa → chat 2 marca como ✅

> **Legenda de autonomia:**
> 🟢 VERDE = push direto autorizado (Claude Code commita+pusha sem aprovação)
> 🟡 AMARELO = diff obrigatório antes de commit (Elber aprova)
> 🔴 VERMELHO = NÃO autônomo (sessão presencial obrigatória)

---

## 🟢 FASE 1 — Telas estáticas (push direto autorizado)

### TASK-001 — Refatorar `/login` 🟢
**Status:** ✅ feita em 28/04/2026 (commit 78a43a1)
**Pré-req:** assets em `public/vetria/` (logo-square.png, vet-portrait.jpg)
**Tempo:** 45-60 min

**Prompt pronto:**
```
Task: Refatorar app/login/page.tsx visual seguindo vetria-proto/login.html.
Nível de autonomia: 🟢 VERDE — push direto autorizado.

Contexto: Tela de login atualmente é inline style sem identidade visual. Precisa virar
visual Vetria oficial com Tailwind v4 + paleta + Inter já configurados. Lógica de
auth deve ser PRESERVADA (Supabase signInWithPassword, signInWithOAuth google, signUp).

Pré-requisitos confirmados:
- Tailwind v4 com paleta Vetria configurada (DL-006)
- Inter como fonte oficial (já configurada no globals.css)
- Assets em public/vetria/: logo-square.png, vet-portrait.jpg
- Lógica atual: signInWithPassword, signInWithOAuth google, signUp no mesmo form,
  hard navigate window.location.href = "/app"

Etapa 1 — Auditoria (silenciosa, sem aguardar aprovação):
1. Lê app/login/page.tsx (estado atual)
2. Lê vetria-proto/login.html (referência visual)
3. Lê classes em vetria-proto/assets/styles.css: auth-layout, auth-image-side,
   auth-form-side, auth-form-logo, btn-google, input-base, input-pill,
   auth-form-bottom, auth-form-footer
4. Resume plano em 5-8 tópicos no início da resposta (pra log)

Etapa 2 — Implementação:
- "use client" (mantém)
- Estados: email, password, msg, loading, mode (login | signup)
- Layout: grid min-h-screen md:grid-cols-2
- Aside esquerda: <Image fill> com /vetria/vet-portrait.jpg, hidden md:block,
  object-cover object-center, priority
- Section direita: form max-w-[420px] w-full px-6 py-12, mx-auto, flex flex-col
- Logo no topo: <Image src="/vetria/logo-square.png" w=36 h=36>, junto wordmark "Vetria"
- Headline: "É bom te ver de novo." em text-titulo font-bold text-[28px] tracking-tight mb-2
- Subtítulo: "Entre na sua conta ou crie uma nova" em text-corpo-texto text-[15px] mb-8
- Botão Google: w-full rounded-pill bg-titulo text-white py-3.5 px-6 inline-flex items-center
  justify-center gap-3 font-medium hover:bg-black/90, com SVG inline da Google (4 cores)
- Divisor "ou com email": flex items-center gap-3 my-5, com linhas cinzas dos lados
  (border-t border-gray-200) e texto centralizado text-corpo-texto text-xs uppercase tracking-wider
- Inputs pill: w-full rounded-pill bg-fundo-claro/40 border border-transparent
  px-5 py-3.5 text-[15px] focus:bg-white focus:border-principal focus:ring-2
  focus:ring-principal/20 focus:outline-none transition
- Labels: text-titulo font-medium text-sm mb-1.5 block
- Senha: input com botão olho (toggle showPassword), SVG inline
- Link "Esqueceu sua senha?": text-blue-600 text-sm hover:underline (mode=login só, leva pra "#")
- Botão primário "Fazer login": w-full rounded-pill bg-principal text-white py-3.5
  font-semibold text-[15px] hover:bg-[#142E33] transition disabled:opacity-50
- Bottom (login mode): "Ainda não tem conta? Cadastre-se" — link que troca mode pra signup
- Bottom (signup mode): "Já tem conta? Faça login" — link que troca mode pra login
- Mensagens: msg.startsWith('✅') ? text-principal : text-red-600, font-medium text-sm mt-3
- Mobile: aside esconde abaixo de md:, section ocupa tela
- Acessibilidade: <label htmlFor>, autoComplete="email" e "current-password",
  aria-busy={loading}, role="alert" em msg de erro

Constraints:
- Não mexer em nenhum arquivo além de app/login/page.tsx
- Não criar componentes em components/ (helpers SVG ficam inline)
- Build deve passar verde (npm run build)
- Manter exato comportamento de auth (não tocar no Supabase calls)

Saídas esperadas:
1. Plano em 5-8 tópicos (pra log)
2. Implementação
3. npm run build verde
4. Commit direto: style(login): refatorar tela de login com visual Vetria
5. git push origin main
6. Descrição em 3 linhas: "Login refatorado com foto à esquerda + form à direita.
   Botão Google preto, paleta Vetria, mobile responsivo. Lógica de auth preservada."

Salvaguardas:
- Se build falhar, NÃO pusha. Avisa Elber com erro completo.
- Se descobrir conflito com estado atual, PARA e avisa antes de codar.
```

---

### TASK-002 — Refatorar `/onboarding` (escolha de role) 🟢
**Status:** ✅ feita em 28/04/2026 (commit b89e49b)
**Pré-req:** TASK-001 mergeada
**Tempo:** 30-45 min

**Prompt pronto:**
```
Task: Refatorar app/onboarding/page.tsx + OnboardingClient.tsx pra ser 3 cards visuais
em vez de 3 botões empilhados.
Nível de autonomia: 🟢 VERDE — push direto autorizado.

Contexto: Após Google OAuth, usuário sem role cai em /onboarding. Hoje vê 3 botões
inline style. Precisa virar 3 cards com ícones e descrição.

Pré-requisitos:
- TASK-001 mergeada (padrão visual estabelecido)
- /api/onboarding/set-role já existe e funciona

Etapa 1 — Auditoria silenciosa:
1. Lê app/onboarding/page.tsx + OnboardingClient.tsx
2. Lê vetria-proto/cadastro.html (referência: 3 cards de role)
3. Resume plano

Etapa 2 — Implementação:
- 3 cards lado-a-lado (grid md:grid-cols-3 gap-4, mobile 1 col)
- Cada card:
  * Ícone grande emoji centralizado: 🐶 tutor / 🩺 vet / 🏥 clínica (text-5xl mb-4)
  * Título: text-titulo font-bold text-xl mb-2
    - "Sou tutor de pet"
    - "Sou veterinário"
    - "Sou uma clínica"
  * Descrição em text-corpo-texto text-sm leading-relaxed:
    - tutor: "Encontre profissionais perto de você, agende consultas e cuide melhor do seu pet."
    - vet: "Crie seu perfil profissional, seja encontrado por tutores e organize sua agenda."
    - clinic: "Cadastre sua clínica, gerencie sua equipe e fortaleça sua marca regional."
  * Card: rounded-2xl border-2 border-gray-200 bg-white p-8 hover:border-principal
    hover:shadow-lg cursor-pointer transition-all
  * Estado loading: durante POST, spinner no card escolhido, outros desabilitados (opacity-50)
- Headline acima: "Como você quer usar a Vetria?" em text-titulo font-bold text-3xl mb-3
- Subtítulo: "Escolha seu perfil. Cada um tem um painel próprio com ferramentas específicas."
  em text-corpo-texto text-base mb-10 max-w-xl
- Container centralizado: max-w-5xl mx-auto px-6 py-16

Constraints:
- Manter chamada POST /api/onboarding/set-role
- Manter hard navigate pra /app após sucesso
- Não criar arquivos novos
- Mobile responsivo

Saídas esperadas:
1. Plano
2. Implementação
3. Build verde
4. Commit + push: feat(onboarding): 3 cards visuais pra escolha de role
5. Descrição em 3 linhas
```

---

### TASK-003 — Criar `/cadastro` (escolha de role pública) 🟢
**Status:** ✅ feita em 28/04/2026 (commit d59e041)
**Pré-req:** TASK-001
**Tempo:** 30-45 min

```
Task: Criar app/cadastro/page.tsx — tela pública com 3 cards de escolha de role pra
usuários novos antes do signup.
Nível de autonomia: 🟢 VERDE.

Contexto: vetria-proto/cadastro.html mostra esta tela. Após escolha, redireciona pra
/cadastro/tutor, /cadastro/vet ou /cadastro/clinica (criadas em tasks separadas).

Pré-requisitos:
- TASK-001 mergeada (link "criar conta" no /login leva pra /cadastro)

Etapa 1 — Auditoria silenciosa:
1. Verifica se app/cadastro/ existe
2. Lê vetria-proto/cadastro.html
3. Plano

Etapa 2 — Implementação:
- Cria app/cadastro/page.tsx (server component)
- Header público: logo Vetria à esquerda, "Já tem conta? Entrar →" à direita (link /login)
- Hero: max-w-3xl mx-auto px-6 py-16 text-center
  * Headline: "Bem-vindo à Vetria. Crie sua conta." text-titulo font-bold text-4xl
  * Subtítulo: "Escolha seu perfil. Você pode mudar depois? Não — é permanente, então
    escolha com cuidado." text-corpo-texto text-lg
- 3 cards (mesmo padrão da TASK-002):
  * Tutor → <Link href="/cadastro/tutor">
  * Veterinário → <Link href="/cadastro/vet">
  * Clínica → <Link href="/cadastro/clinica">

Constraints:
- Apenas criar app/cadastro/page.tsx
- Rotas destino /cadastro/tutor etc são placeholders (404 OK por enquanto, criadas em tasks separadas)

Mensagem: feat(cadastro): criar /cadastro com escolha de role
```

---

### TASK-004 — Criar `/cadastro/tutor` (form de signup tutor) 🟢
**Status:** ✅ feita em 24/05/2026 (commit df1514c; signUp ligado em 908ba5e) — DL-023→DL-028. Também é alvo de `/cadastro` (DL-026)
**Pré-req:** TASK-003
**Tempo:** 45-60 min

```
Task: Criar app/cadastro/tutor/page.tsx — formulário de cadastro do tutor.
Nível de autonomia: 🟢 VERDE.

Contexto: Tutor não passa por validação CRMV. Após signup vai direto pra /app/tutor/onboarding.

Etapa 1 — Auditoria:
1. Lê app/login/page.tsx (signup logic — copiar padrão Supabase)
2. Lê vetria-proto/cadastro.html (visual)
3. Plano

Etapa 2 — Implementação:
- "use client" page
- Layout: similar ao login (foto à esquerda + form à direita), foto opcional
- Form fields:
  * Nome completo (text, required)
  * Email (email, required)
  * Senha (password, required, min 8 chars)
  * Confirmar senha (password, required)
  * Cidade (text, required)
  * Aceito termos de uso (checkbox, required)
- Submit:
  * Valida senhas iguais
  * Chama supabase.auth.signUp({ email, password, options: { data: { full_name, cidade } }})
  * Após sucesso: redireciona pra /app/tutor/onboarding (placeholder existe)
  * Se erro Supabase: mostra mensagem
- Visual segue padrão da TASK-001 (inputs pill, paleta, Inter)

Constraints:
- Mantém padrão de auth do login (mesmas helpers)
- Cria APENAS app/cadastro/tutor/page.tsx
- Não modifica nada em app/login/

Mensagem: feat(cadastro): formulário de cadastro do tutor
```

---

### TASK-005 — Criar `/cadastro/vet` (form de signup vet) 🟢
**Status:** ✅ feita em 24/05/2026 (commit 87de08c; signUp ligado em 908ba5e) — DL-023→DL-028 (funil B2B, DL-026)
**Pré-req:** TASK-003
**Tempo:** 45-60 min

```
Task: Criar app/cadastro/vet/page.tsx — formulário de cadastro do veterinário.
Nível de autonomia: 🟢 VERDE.

Diferenças do tutor:
- Aside verde (gradient principal-soft) com features ("Perfil profissional verificado",
  "Encontrado por tutores", "Reputação validada") — copiar de vetria-proto/cadastro-vet.html
- Form mais corporativo
- Após signup: redireciona pra /app/vet/onboarding (que vai capturar CRMV em task futura)

Resto do padrão segue TASK-004.

Mensagem: feat(cadastro): formulário de cadastro do veterinário
```

---

### TASK-006 — Criar `/cadastro/clinica` 🟢
**Status:** ✅ feita em 24/05/2026 (commit 87de08c; signUp ligado em 908ba5e) — DL-023→DL-028 (com CNPJ; funil B2B, DL-026)
**Pré-req:** TASK-003
**Tempo:** 45-60 min

```
[Padrão similar a TASK-005, mas com CNPJ no form e referência vetria-proto/cadastro-clinica.html]

Mensagem: feat(cadastro): formulário de cadastro da clínica
```

---

### TASK-007 — Criar `/recuperar-senha` 🟢
**Status:** ✅ feita em 24/05/2026 (commit 4607744) — mock visual + wire no login
**Pré-req:** TASK-001
**Tempo:** 20-30 min

```
Task: Criar app/recuperar-senha/page.tsx — tela visual de recuperação de senha.
Nível: 🟢 VERDE.

Contexto: Por enquanto só visual. Integração Supabase Auth resetPasswordForEmail vem
quando Resend estiver integrado (Sprint 2 backend).

Implementação:
- Layout centrado, card simples
- Logo no topo
- Headline: "Recuperar senha"
- Subtítulo: "Digite seu email e enviaremos um link de recuperação"
- Input email (pill, padrão TASK-001)
- Botão "Enviar link" (rounded-pill bg-principal)
- Link "← Voltar pra login"
- Submit por enquanto mostra: "✅ Se este email existir, enviaremos instruções." (mock)

Mensagem: feat(auth): página visual de recuperação de senha
```

---

## 🟢 FASE 2 — Painel do tutor (push direto autorizado)

### TASK-008 — Refatorar `/app/tutor` (dashboard) 🟢
**Status:** ✅ feita em 23/05/2026 (commit 4ba2219) — ver DL-019
**Pré-req:** TASK-001
**Tempo:** 60-90 min

```
Task: Refatorar app/app/tutor/page.tsx seguindo vetria-proto/app/tutor/index.html.
Nível: 🟢 VERDE.

Tom: humano, leve, fluído (CONTEXT.md). Acolhedor.

Conteúdo (seguir protótipo):
- Topbar com nav: Início (active), Histórico, Avaliações, Perfil
- Greeting hero: "Oi {nome}, e a {pet}?" — usa profile.full_name por enquanto, pet
  mockado se não tiver
- Search bar: "Buscar veterinário, especialidade ou clínica..."
- 3 cards de quick action: Buscar profissional, Meus agendamentos, Avaliar atendimento
- Seção "Próximas consultas" (placeholder vazio com "Tudo tranquilo por enquanto")
- Seção "Meus pets" (mockada — TODO: integrar com banco)

Constraints:
- Lógica de auth/role check no layout (não duplica)
- Mocks com comentário // TODO: integrar com banco
- Não criar dependências de banco que não existem

Mensagem: refactor(tutor): refatorar dashboard com visual Vetria
```

---

### TASK-009 — `/app/tutor/perfil` 🟢
**Status:** ✅ feita em 24/05/2026 (commit ea8c6ae) — ver DL-022
**Pré-req:** TASK-008
**Tempo:** 45-60 min

```
[Seguir vetria-proto/app/tutor/perfil.html]
Mensagem: refactor(tutor): refatorar perfil do tutor
```

---

### TASK-010 — `/app/tutor/historico` 🟢
**Status:** ✅ feita em 24/05/2026 (commit fc5982f) — ver DL-022 (empty-state)
**Pré-req:** TASK-008
**Tempo:** 45 min

```
[Seguir vetria-proto/app/tutor/historico.html]
Mensagem: feat(tutor): criar página de histórico de agendamentos
```

---

### TASK-011 — `/app/tutor/avaliacoes` 🟢
**Status:** ✅ feita em 24/05/2026 (commit fc5982f) — ver DL-022 (empty-state)
**Pré-req:** TASK-008
**Tempo:** 45 min

```
[Seguir vetria-proto/app/tutor/avaliacoes.html]
Mensagem: feat(tutor): criar página de avaliações
```

---

## 🟢 FASE 3 — Painel do veterinário (push direto autorizado)

### TASK-012 — Refatorar `/app/vet` (dashboard) 🟢
**Status:** ✅ feita em 24/05/2026 (commit b30c08d) — ver DL-020 (casca fiel ao produto, sem mock)
**Pré-req:** TASK-001
**Tempo:** 60-90 min

```
Task: Refatorar app/app/vet/page.tsx seguindo vetria-proto/app/vet/index.html.
Nível: 🟢 VERDE.

Tom: corporativo, denso, profissional. Ferramenta de trabalho.

[Especificação detalhada baseada no protótipo]

Mensagem: refactor(vet): refatorar dashboard do veterinário
```

---

### TASK-013 — `/app/vet/perfil` 🟢
**Status:** ✅ feita em 24/05/2026 (commit 827e9f9) — ver DL-022 (editor + preview)
**Pré-req:** TASK-012
**Tempo:** 60 min

```
[Seguir vetria-proto/app/vet/perfil.html — form editor + preview]
Mensagem: refactor(vet): refatorar editor de perfil profissional
```

---

### TASK-014 — `/app/vet/aguardando` 🟢
**Status:** ✅ feita em 24/05/2026 (commit 14c8f5d) — ver DL-022
**Pré-req:** TASK-012
**Tempo:** 30 min

```
Task: Criar app/app/vet/aguardando/page.tsx — tela visual de "aguardando validação CRMV".
Nível: 🟢 VERDE.

[Seguir vetria-proto/app/vet/aguardando.html]

Lógica de redirect (status != active redireciona pra cá) NÃO entra agora — vem na
task vermelha de RBAC. Por enquanto, qualquer vet logado consegue acessar essa rota
diretamente pra visualizar.

Mensagem: feat(vet): criar página visual de aguardando validação
```

---

### TASK-015 — `/app/vet/onboarding` (visual) 🟢
**Status:** ✅ feita em 24/05/2026 (commit cd119a0) — ver DL-022 (multi-step)
**Pré-req:** TASK-012
**Tempo:** 60-90 min

⚠️ Esta task é APENAS visual. A lógica real de submissão (gravar em vet_profiles, mudar
status pra pending_validation) vem em task vermelha presencial após migration 001.

```
Task: Refatorar app/app/vet/onboarding/page.tsx visualmente seguindo
vetria-proto/app/vet/onboarding.html (multi-step com sidebar de progresso).
Nível: 🟢 VERDE.

Multi-step:
- Passo 1: Dados profissionais (nome, CPF, CRMV, UF)
- Passo 2: Especialidades (seleção múltipla)
- Passo 3: Localização (cidade, estado, modos de atendimento)
- Passo 4: Bio + foto (descrição profissional, upload — só visual por enquanto)

Sidebar verde escuro com indicador de step atual.

Submit por enquanto preserva lógica atual (apenas seta onboarding_completed=true).
TODO comments marcando onde vai entrar a lógica real.

Mensagem: refactor(vet): refatorar onboarding multi-step visual
```

---

## 🟢 FASE 4 — Painel da clínica (push direto autorizado)

### TASK-016 — `/app/clinic` (dashboard) 🟢
**Status:** ✅ feita em 24/05/2026 (commit a52e234) — ver DL-020 (casca fiel ao produto; card de plano omitido = Sprint 6)
### TASK-017 — `/app/clinic/equipe` 🟢
**Status:** ✅ feita em 24/05/2026 (commit 1d93327) — ver DL-022 (empty-state)
### TASK-018 — `/app/clinic/perfil` 🟢
**Status:** ✅ feita em 24/05/2026 (commit 867ada2) — ver DL-022 (editor + preview)
### TASK-019 — `/app/clinic/aguardando` 🟢
**Status:** ✅ feita em 24/05/2026 (commit c85e687) — ver DL-022
### TASK-020 — `/app/clinic/onboarding` (visual) 🟢
**Status:** ✅ feita em 24/05/2026 (commit f4877b2) — ver DL-022 (multi-step)

```
[Cada uma segue padrão da Fase 3, com referência aos HTMLs correspondentes em
vetria-proto/app/clinic/]
```

---

## 🟢 FASE 5 — Painel admin (push direto autorizado, mas tom diferente)

### TASK-021 — Refatorar `/admin` 🟢
**Status:** ✅ feita em 24/05/2026 (commit 7533d50) — ver DL-024 (dark, RBAC preservado; dashboard virou overview)
### TASK-022 — `/admin/usuarios` 🟢
**Status:** ✅ feita em 24/05/2026 (commit 15c38db) — ver DL-024 (hospeda o painel RBAC funcional, master-gated)
### TASK-023 — `/admin/validacoes` 🟢
**Status:** ✅ feita em 24/05/2026 (commit 15c38db) — empty-state dark (DL-024)
### TASK-024 — `/admin/moderacao` 🟢
**Status:** ✅ feita em 24/05/2026 (commit 15c38db) — empty-state dark (DL-024)
### TASK-025 — `/admin/conteudo` 🟢
**Status:** ✅ feita em 24/05/2026 (commit 15c38db) — empty-state dark (DL-024)

```
[Tom dark, denso, técnico. Referências em vetria-proto/admin/]
```

---

## 🟡 FASE 6 — Tasks técnicas (diff obrigatório)

### TASK-026 — Resolver homepage `/` 🟡
**Status:** ✅ feita em 24/05/2026 (commit c45d98a)
**Pré-req:** TASK-001
**Tempo:** 20 min

```
Task: Substituir app/page.tsx (homepage default do Next.js) por redirect inteligente.
Nível: 🟡 AMARELO — diff obrigatório.

Lógica:
- Server component
- Se usuário não autenticado → redirect("/login")
- Se autenticado → redirect("/app")

Mensagem: feat(home): substituir página default por redirect baseado em sessão
```

---

### TASK-027 — Adicionar `.vercelignore` 🟡
**Status:** 🚫 N/A (24/05/2026) — redundante: `vetria-proto/` já está no `.gitignore` e não é rastreado, logo nunca chega ao build da Vercel. Ver DL-021.
**Pré-req:** —
**Tempo:** 10 min

```
Task: Criar .vercelignore na raiz pra garantir que vetria-proto/ nunca vai pro build.
Nível: 🟡 AMARELO (toca config raiz).

Conteúdo:
vetria-proto/

Mensagem: chore(deploy): adicionar .vercelignore
```

---

### TASK-028 — Componentes reutilizáveis (botão, input, card) 🟡
**Status:** ✅ feita em 23/05/2026 (commit f24d874) — ver DL-017
**Pré-req:** TASK-001 + TASK-008 (precisa de uso real)
**Tempo:** 60 min
**Obs (divergência do prompt original):** entregue = Button (primary+google), Input
(pill, label separado), Select, Card, Label. `secondary`/`ghost` NÃO criados (sem
referência em tela); `AuthShell` órfão do commit 081e51b removido. Telas existentes
NÃO refatoradas ainda (continua task futura).

```
Task: Extrair componentes reutilizáveis pra components/ui/ baseado nos padrões já
estabelecidos nas telas refatoradas.
Nível: 🟡 AMARELO — afeta reuso futuro.

Componentes:
- <Button variant="primary|secondary|ghost" size="sm|md|lg">
- <Input label="" type="" />
- <Card>

Refactor das telas existentes pra usar os componentes (em commit separado).

Mensagem: feat(ui): criar componentes reutilizáveis Button, Input, Card
```

---

### TASK-FIX-003 — Trocar update por upsert em /api/onboarding/set-role 🟡
**Status:** ⬜ pendente (não urgente)
**Pré-req:** —
**Tempo:** 15 min

```
Task: Em app/api/onboarding/set-role/route.ts, trocar .update() por .upsert()
na tabela profiles, mais defensivo contra falha de trigger SQL.
Nível de autonomia: 🟡 AMARELO — diff obrigatório (mexe em /api/*).

Auditoria descobriu que o endpoint hoje assume row em profiles existe (criada
por trigger handle_new_user no signup). Se trigger falhar uma vez, set-role
falha silenciosamente. .upsert() torna fluxo idempotente.

Adiciona também log conforme padrão DL-011 (logs em handlers de auth):
- console.log de entrada com {userId, role}
- console.error em error de DB com {message, code}
- console.log de sucesso com {userId, role, action: 'inserted' | 'updated'}

Mensagem: refactor(api): tornar set-role idempotente com upsert
```

---

## 🟢 FIXES E AD-HOC (concluídas — Sprint 2 bloco auth/onboarding)

### TASK-FIX-002 — Auth callback handler `/auth/callback` 🟢
**Status:** ✅ feita em 28/04/2026 (commit 4f7f87e)

Criado `app/auth/callback/route.ts` pra processar `?code=` de email
confirmation + corrigir Google OAuth que estava broken silenciosamente.
Documentado em DL-009. Padrão de exchangeCodeForSession + getUser +
maybeSingle em profiles.

---

### TASK-FIX-MICRO-001 — Logs de debug no callback handler 🟢
**Status:** ✅ feita em 28/04/2026 (commit 1861a46)

Adicionou logs estruturados no callback handler pra triagem em runtime
logs da Vercel (Hobby plan oculta stack traces). Estabeleceu padrão
formal de logs em handlers de auth — DL-011.

---

### TASK-AH-001 — Refator visual ad-hoc do `/app/tutor/onboarding` 🟢
**Status:** ✅ feita em 28/04/2026 (commit 4259924)

Refator visual com form Vetria + dados do pet (nome, espécie, idade,
peso, cidade). Lógica de persistência ainda placeholder (apenas seta
`onboarding_completed=true` — captura real dos dados depende de
migration futura). Estabeleceu padrão Server Component + Server Action
+ Client Form — DL-012.

---

### TASK-FIX-006 — Migrar `lib/supabase/server` pra API getAll/setAll 🟡
**Status:** ✅ feita em 28/04/2026 (commit 84d777d)

API legada de cookies (`get`/`set`/`remove`) substituída por
`getAll`/`setAll` recomendada pelo `@supabase/ssr` 0.8+. Documentado
em DL-013. Sem breaking change pros 11 consumidores.

---

### TASK-FIX-007 — `.select()` + logs no update da Server Action 🟡
**Status:** ✅ feita em 28/04/2026 (commit 35c56e4)

Update do `onboarding_completed` em `app/app/tutor/onboarding/page.tsx`
agora usa `.select()` pra forçar PostgREST retornar rows afetadas (sem
isso, RLS rejection silencia error). Logs estruturados em 3 caminhos
conforme padrão DL-011. Querystring `?error=...` placeholder pra futura
UI de feedback.

---

### TASK-FIX-008 — Remover try/catch que engolia NEXT_REDIRECT 🟡
**Status:** ✅ feita em 28/04/2026 (commit ff26a75)

Em `TutorOnboardingForm.tsx`, callback de `startTransition` virou
síncrono fire-and-forget sem try/catch. NEXT_REDIRECT agora borbulha
pro framework. Documentado em DL-016.

---

## 🟢 BACKLOG novo descoberto durante a Sprint 2

### TASK-034 — Refator do header compartilhado `app/app/layout.tsx` 🟢
**Status:** ✅ feita em 23/05/2026 (commit a93dfb9) — ver DL-018
**Pré-req:** —
**Tempo:** 30-45 min

```
Task: Refatorar header compartilhado em app/app/layout.tsx pra padrão Vetria.
Nível: 🟢 VERDE.

Contexto: Header atual é inline-style serif Sprint 1 (placeholder). Aparece em
todas as rotas /app/* (tutor, vet, clinic). Refator visual isolado, sem mudar
lógica de RBAC.

Implementação:
- Logo Vetria à esquerda (vetria/logo-square.png + wordmark)
- Nav contextual à direita (depende da role — começar simples)
- Inter, paleta Vetria, h-16 px-6 border-b border-gray-100
- Mobile responsivo

Mensagem: style(app): refatorar header compartilhado com identidade Vetria
```

---

## 🔴 FASE 7 — NÃO autônomo (sessão presencial obrigatória)

### TASK-029 — Migration 001: schema Sprint 2 🔴
**Status:** 🔴 NÃO autônomo
**Por quê:** Mexe em banco de produção, precisa de Elber presente pra confirmar SQL,
testar em Supabase staging primeiro, garantir RLS correto.

Quando rodar: sessão presencial dedicada de 1-2 horas.

### TASK-030 — Integração Resend 🔴
**Status:** 🔴 NÃO autônomo
**Por quê:** Exige API key, configuração de DNS (DKIM, SPF, DMARC), Elber precisa
estar presente pra rotacionar variáveis na Vercel.

### TASK-031 — Reescrever onboarding vet/clinic com banco real 🔴
**Pré-req:** TASK-029 (migration 001) + TASK-015 (visual)
**Status:** 🔴 NÃO autônomo
**Por quê:** Lógica de status, upload pra Supabase Storage, RLS policies pra docs.

### TASK-032 — Middleware: bloquear vet/clinic com status != active 🔴
**Pré-req:** TASK-029
**Status:** 🔴 NÃO autônomo
**Por quê:** Toca middleware de RBAC, erro = vazamento de dados.

### TASK-033 — Sprint 6: Stripe 🔴
**Status:** 🔴 NÃO autônomo
**Quando:** Sprint 6 (longe)

### TASK-FIX-009 — Consolidar duplicação `is_master_admin` e `is_admin_master` 🔴
**Status:** 🔴 NÃO autônomo (não urgente)
**Pré-req:** ✅ Pasta `supabase/migrations/` já criada (DL-027) — pré-req satisfeito
**Por quê:** Funções idênticas no banco, ambas SECURITY DEFINER + SET
search_path = public após fix de DL-014. Decidir qual manter, dropar a
outra atualizando policies que a referenciem. Mexe em RLS policies +
funções SQL — vermelha por padrão.

**Quando rodar:** sessão presencial junto com migration 001 (TASK-029),
versionando também a redefinição já aplicada via SQL Editor (DL-014/015).

---

## 📊 ROTEIRO RECOMENDADO

**Semana 1 (background):**
- Dia 1: TASK-001 (login)
- Dia 2: TASK-002 + TASK-007 (onboarding role + recuperar senha)
- Dia 3: TASK-003 + TASK-004 (cadastro escolha + tutor)
- Dia 4: TASK-005 + TASK-006 (cadastro vet + clínica)
- Dia 5: TASK-026 + TASK-027 (homepage + vercelignore — amarelas, revisa)

**Semana 2 (background painéis):**
- TASK-008 + TASK-009 + TASK-010 + TASK-011 (tutor completo)
- TASK-012 + TASK-013 + TASK-014 (vet base)

**Semana 3 (background painéis):**
- TASK-015 (vet onboarding visual) — apenas visual, lógica vem depois
- TASK-016 + TASK-017 + TASK-018 + TASK-019 + TASK-020 (clinic completa)
- TASK-028 (componentes reutilizáveis — amarela)

**Semana 4 (background painel admin):**
- TASK-021 a TASK-025 (admin completo)

**Final da Semana 4:**
- 25 telas todas no padrão Vetria, em produção
- App parece pronto visualmente mas é casca (lógica de banco ainda placeholder)

**Semana 5 (PRESENCIAL):**
- TASK-029: Migration 001 (com Elber)
- TASK-030: Resend (com Elber)

**Semana 6 (PRESENCIAL):**
- TASK-031: Onboardings reais com banco
- TASK-032: Middleware status check

**Sprint 2 fechada após Semana 6.** Aí app está VIVO de verdade.

---

## 📌 COMO ATUALIZAR ESSE BACKLOG

Toda task concluída:
1. Marca `Status: ✅ feita em DD/MM`
2. Atualiza CONTEXT.md (decision log se houver decisão arquitetural)
3. Sugere próxima task em ordem lógica

Se uma task se mostrar maior:
1. Marca `Status: 🟡 em andamento + obs: descobriu X`
2. Pede orientação a Elber

Se descoberta task nova (bug, refactor, decisão):
1. Adiciona ao BACKLOG no lugar correto
2. Marca prioridade
3. Avisa Elber

---

### TASK-039 — Separar rotas tutor/B2B + ligar signUp + migration 0001 🟡
**Status:** ✅ feita em 24/05/2026 — ver DL-026/027/028
**Commits:** b1be7ae (rotas), 8abdc7a (migration 0001 versionada), 908ba5e (signUp ligado)

Bloco de 3 passos (estilo Doctoralia — separação tutor/B2B):
1. `/cadastro` deixou de ser vitrine de 3 cards → `redirect("/cadastro/tutor")` (entrada
   direta do tutor); vet/clínica seguem em `/cadastro/{vet,clinica}`, alcançados só pelas
   landings B2B. Comentários `// HUMANO` vs `// B2B` no código (DL-026).
2. Pasta `supabase/migrations/` criada + migration `0001_handle_new_user_role_from_metadata.sql`
   (trigger lê role do metadata, default tutor intencional, hardening search_path) —
   aplicada em prod 24/05 (DL-027).
3. signUp ligado nos 3 cadastros (role no metadata p/ trigger) — DL-028.

**Pendente:** Elber validar no navegador (criar conta por rota → confirmar email → painel certo).

---

## 🚦 STATUS ATUAL (24 Maio 2026) — separação tutor/B2B + 1ª migration versionada

```
✅ Públicas — login · /cadastro (→tutor) + /cadastro/{tutor,vet,clinica} (signUp LIGADO, DL-028) · /recuperar-senha · homepage redirect · 404
✅ Tutor — dashboard · perfil · histórico · avaliações (DL-019/022)
✅ Vet — dashboard · perfil · aguardando · onboarding multi-step (DL-020/022)
✅ Clínica — dashboard · perfil · aguardando · equipe · onboarding multi-step (DL-020/022)
✅ Admin (dark) — dashboard · usuários (RBAC real) · validações · moderação · conteúdo (DL-024)
✅ Infra — components/ui (DL-017) · header por role + nav + sino + busca + hambúrguer mobile (DL-018/025) · higiene layout/404 (035/036)
✅ Arquitetura — separação tutor(B2C)/vet+clínica(B2B): login único, separação no funil (DL-026)
✅ DB — pasta supabase/migrations/ + migration 0001 (trigger lê role do metadata) aplicada (DL-027)
✅ TASK-037 — nav mobile (hambúrguer) entregue no header (DL-025)
✅ TASK-039 — rotas tutor/B2B + signUp ligado + migration 0001 (DL-026/027/028)
🚫 TASK-027 — .vercelignore N/A (DL-021)

PENDENTE:
🧪 Elber valida cadastros no navegador (criar conta por rota → confirmar email → painel certo) — já no ar (DL-028)
🟡 TASK-038 — sidebar vet/clínica (route group pro onboarding) — testar no navegador (DL-025)
🔴 TASK-029 → 031 → 032 → 030 — presencial: migration GRANDE (status + vet/clinic_profiles) → onboarding real → middleware por status → Resend
⬜ TASK-FIX-003 — set-role idempotente (não urgente)
🔴 TASK-FIX-009 — consolidar is_master_admin/is_admin_master (vermelha futura; versionar DL-014/015)
```
