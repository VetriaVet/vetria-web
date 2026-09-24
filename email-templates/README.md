# Templates de email — Vetria

HTMLs dos emails transacionais (tabelas + CSS inline, compatível com clientes de email).
Marca: Inter/Arial, verde-petróleo #1E4349, creme #F5F0E1, verde-água #EAFAF5.

## Logos (email não renderiza SVG, por isso PNG)
- **Topo:** `logo-square.png` (símbolo quadrado, 48px) com `border-radius:50%` (círculo).
- **Rodapé:** `logo-email.png` (logo horizontal oficial em verde, 360×59, gerada da SVG `logo-vetria-fundo-claro.svg` via sharp), exibida a 132px.
- Ambas em `public/vetria/` e servidas por URL absoluta (`https://vetriabrasil.com.br/vetria/...`).

## Arquivos e onde cada um é usado

| Arquivo | Disparado por | Onde configurar | Variável do link |
|---|---|---|---|
| `01-confirmacao-cadastro.html` | Supabase (signup) | Supabase → Auth → Email Templates → **Confirm signup** | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app` |
| `02-recuperacao-senha.html` | Supabase (reset) | Supabase → Auth → Email Templates → **Reset Password** | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/recuperar-senha/nova` |
| `03-confirmacao-novo-email.html` | Supabase (troca de email) | Supabase → Auth → Email Templates → **Change Email Address** | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/app` |
| `04-boas-vindas.html` | App (após confirmar) — fase futura | enviado via Resend no código | link fixo `/app` |
| `05-perfil-aprovado.html` | App (validação CRMV) — fase futura | enviado via Resend no código | link fixo `/app` |
| `06-perfil-ajuste.html` | App (validação CRMV) — fase futura | enviado via Resend no código | link fixo `/app` |

## Como aplicar os 3 do Supabase (1, 2, 3)
Supabase → **Authentication → Emails → Templates** → escolher o template → colar o HTML no corpo → salvar.

**Desde a T-036 (23/09/2026) o link não é mais `{{ .ConfirmationURL }}`.** Ele aponta para a nossa rota
`/auth/confirm`, que verifica o `token_hash` no servidor. Por quê: o `{{ .ConfirmationURL }}` passa pelo
Supabase e volta com um `code` do fluxo PKCE, que só pode ser trocado no **mesmo navegador** que pediu o
email. Abrir o link no celular depois de pedir no computador falhava. Com o `token_hash`, funciona em
qualquer navegador e aparelho.

- **`{{ .SiteURL }}` vem do painel** (Authentication → URL Configuration → Site URL). Tem que ser
  `https://vetriabrasil.com.br`, **sem barra no fim**. Consequência: o link do email sempre leva à
  produção, mesmo quando o pedido saiu do `localhost`. Para testar a rota local, copie o link do email e
  troque o domínio por `http://localhost:3000`.
- **Ordem segura:** primeiro o deploy com a rota `/auth/confirm`, depois a troca do template. Os links
  antigos, que já estão na caixa de entrada de alguém, continuam indo para o `/auth/callback`, que não
  foi removido.
- A rota mostra uma página com o botão **Continuar** antes de gastar o link: antivírus de email abrem
  os links sozinhos, e o link é de uso único.

## Observação
Os emails 4, 5 e 6 ainda não disparam — entram na fase de backend (envio transacional via Resend pelo app). Ficam versionados aqui como fonte única.
