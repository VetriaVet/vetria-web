# Avaliação de segurança: rate limit, Cloudflare, captcha, 2FA e cabeçalhos — 23/09/2026
**Base:** commit `6a8d86a` · só leitura · **Autor:** `vetria-seguranca` (arquivo salvo pela sessão principal, texto do auditor)
**Motivo:** pergunta do Elber: *"estamos seguros? vi algo sobre rate limit, Cloudflare, captcha e 2FA"*.

## Resumo
Dá pra seguir. Não há 🔴 novo. **Uma** coisa precisa estar pronta antes de abrir para profissional de fora: o
**captcha** no cadastro, no login e na recuperação de senha, porque sem ele alguém de fora consegue travar todos os
cadastros por uma hora. O **2FA para o admin** custa pouco e deveria vir junto. **Cloudflare não precisa.**

**O que muda a conversa:** login, cadastro e recuperação de senha **não passam pelo nosso servidor**. O navegador fala
direto com o Supabase (`app/login/page.tsx:30,41`, `app/cadastro/*/page.tsx:54-86`, `app/recuperar-senha/page.tsx:28`).
Firewall da Vercel e Cloudflare **não protegem o login**; o que protege são os limites do Supabase e o captcha.

## 1. Rate limit
**O que o Supabase já faz (padrões, não confirmados no painel):** login e cadastro ~30 a cada 5 min por IP;
verificação ~30 a cada 5 min por IP; **envio de email com teto do projeto inteiro** (~30/h com SMTP próprio) e 60 s
entre emails para o mesmo endereço. Não há bloqueio de conta por senha errada, só por IP.

### SEC-102 · 🟠 · o teto de email vira arma
- **Como explorar:** um script chama cadastro ou recuperação de senha com 30 endereços quaisquer e esgota o teto da
  hora; o profissional de verdade que se cadastra em seguida não recebe a confirmação. Repetível a cada hora, de um IP.
  Emails para endereços inexistentes voltam e sujam a reputação do domínio (R-009).
- **Correção:** captcha (item 3). Aumentar o teto só encarece o ataque.
- **Quando:** antes de abrir para gente de fora · **Custo:** zero · **Semáforo:** 🔴 (auth).

**Rotas próprias:** `/api/documentos/*` sem limite de volume já está em SEC-081 e SEC-082/R-056. Actions de
onboarding: spam só na própria conta, 🟡 depois. Decisão do admin e email: só o admin dispara, nada a fazer.
**Opção mais barata:** regra de rate limit no **firewall da Vercel** (painel, sem código) para `/api/documentos/*`,
~20 pedidos/min por IP, junto com o SEC-081. Upstash só se um dia precisar de limite por usuário.

## 2. Cloudflare: não
A Vercel já tem firewall, DDoS e BotID básico; Cloudflare na frente da Vercel dá problema de cache, SSL e IP do
visitante, e não veria o tráfego de login. Só o **Turnstile** interessa, e ele funciona sem a Cloudflare na frente.

## 3. Captcha: Turnstile, antes de abrir
- Supabase aceita Turnstile e hCaptcha de fábrica. **Turnstile:** grátis, quase sempre invisível.
- ⚠️ **Armadilha de ordem:** ligar o captcha no painel faz **toda** chamada exigir o token. São 6 telas (`/login`, os 3
  `/cadastro/*`, `/recuperar-senha`, os "reenviar email"). **Primeiro o código com o widget, depois o deploy, só então
  ligar no painel**, senão ninguém entra, nem o Elber.
- 🟠 (fecha SEC-102) · custo zero · ~meio dia · 🔴.

## 4. 2FA
### SEC-103 · 🟠 · admin e master sem segundo fator
- A conta master enxerga documento, CRMV e CNPJ de todo mundo; uma senha vazada basta.
- **Correção:** TOTP do Supabase (grátis) e exigir `aal2`, no `requireAdmin` (`lib/auth/admin.ts`) **e** no
  `is_admin()` do banco olhando o `aal` do JWT, senão o PostgREST segue aceitando só a senha (lição da SEC-096/097).
- ~1 dia · 🔴 · **prazo firme: antes do primeiro admin comum (R-014)**, mesmo que a abertura atrase.

**Profissionais:** opcional, depois da entrega. Obrigar agora aumenta abandono sem ganho à altura.

## 5. Outras lacunas
### SEC-104 · 🟡 · faltam cabeçalhos de segurança
`next.config.ts` só configura `X-Robots-Tag`. Clickjacking: um site carrega `/admin/validacoes/<conta>` num iframe
invisível e induz o admin a clicar em "Aprovar". **Correção:** `frame-ancestors 'none'` / `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. CSP com
nonce fica para a F6. ~1 h · 🟡 · antes de abrir. Confirmar HSTS no domínio.

### SEC-105 · 🟡 · senha mínima de 8 só na tela
O Supabase aceita 6 por padrão, e o modo "criar conta" do `/login` (`app/login/page.tsx:30`) nem confere. **Correção:**
mínimo 8 no painel do Supabase. 1 min · 🔴 · **agora**.

**Sessão:** tempo de inatividade e bloqueio de senha vazada (HaveIBeenPwned) só no plano pago do Supabase; se for Pro,
ligar para admin; senão, depois da entrega.

## O que fazer e quando
| O quê | Sev. | Quando | Custo | Esforço | Semáforo |
|---|---|---|---|---|---|
| Senha mínima 8 no painel (SEC-105) | 🟡 | agora | 0 | 1 min | 🔴 |
| Cabeçalhos de segurança (SEC-104) | 🟡 | antes de abrir | 0 | 1 h | 🟡 |
| Captcha Turnstile nas 6 telas (SEC-102) | 🟠 | antes de abrir | 0 | meio dia | 🔴 |
| 2FA obrigatório admin/master, tela e banco (SEC-103) | 🟠 | antes de abrir (no máximo antes do 2º admin) | 0 | 1 dia | 🔴 |
| Rate limit Vercel em `/api/documentos/*`, com SEC-081 | 🟠 | antes de abrir | no plano | 1 h | 🟡 |
| CSP completa com nonce | 🟡 | F6 | 0 | 1 dia | 🟡 |
| Inatividade e senha vazada (Pro) | 🟡 | depois da entrega | Pro | 15 min | 🔴 |
| 2FA opcional para profissional | 🟡 | depois da entrega | 0 | 1 dia | 🔴 |
| Cloudflare | não fazer | — | — | — | — |
| Upstash | não agora | só se precisar de limite por usuário | — | — | — |

## Não consegui verificar
Números reais de rate limit no painel do Supabase, planos do Supabase e da Vercel, mínimo de senha configurado hoje,
HSTS no domínio de produção.
