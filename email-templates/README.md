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
| `01-confirmacao-cadastro.html` | Supabase (signup) | Supabase → Auth → Email Templates → **Confirm signup** | `{{ .ConfirmationURL }}` |
| `02-recuperacao-senha.html` | Supabase (reset) | Supabase → Auth → Email Templates → **Reset Password** | `{{ .ConfirmationURL }}` |
| `03-confirmacao-novo-email.html` | Supabase (troca de email) | Supabase → Auth → Email Templates → **Change Email Address** | `{{ .ConfirmationURL }}` |
| `04-boas-vindas.html` | App (após confirmar) — fase futura | enviado via Resend no código | link fixo `/app` |
| `05-perfil-aprovado.html` | App (validação CRMV) — fase futura | enviado via Resend no código | link fixo `/app` |
| `06-perfil-ajuste.html` | App (validação CRMV) — fase futura | enviado via Resend no código | link fixo `/app` |

## Como aplicar os 3 do Supabase (1, 2, 3)
Supabase → **Authentication → Email Templates** → escolher o template → colar o HTML no corpo → salvar.
As variáveis `{{ .ConfirmationURL }}` já estão no lugar certo (botão + link de fallback).

## Observação
Os emails 4, 5 e 6 ainda não disparam — entram na fase de backend (envio transacional via Resend pelo app). Ficam versionados aqui como fonte única.
