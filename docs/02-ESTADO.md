# 02 — ESTADO REAL DO PROJETO

> **Este é o primeiro arquivo que qualquer sessão ou agente lê.**
> Curto de propósito. Se passar de ~150 linhas, está virando log — o log é o `05-DECISOES.md`.
>
> **Última atualização:** 25/09/2026 (`vetria-maestro`, planejamento da S8 e reavaliação do atraso) ·
> **Fase:** **F4 (S5)** · **Último commit em produção:** `7b7a3f9` (PR #8). **Tudo entra por PR**: o CI é
> obrigatório na `main` (ruleset) e `git push` direto é recusado.

---

## AGORA

**Fase:** **F4 — Motor B2C** · **Semana:** **S5 (5 de 13), 23/09 a 29/09** · **Entrega:** 25/11/2026

✅ **A F3 está CONCLUÍDA, 6 de 6** (**DL-069**): o item 5 fechou por medição no CI do `vetria-e2e` (70 de 70
em 23/09). O DL-062 ("5 de 6") ficou como registro histórico.

🟢 **Estamos ADIANTADOS na F4, cerca de 1,5 semana.** Em 3 dias a S5 entregou o que o plano punha em
S5, S6 e S7: a `0004` e a `0005` aplicadas em produção, `/buscar`, `/veterinario/[slug]` e
`/estabelecimento/[slug]` no ar. **O atraso de ~1 semana do dia 23/09 foi recuperado.** O buffer da S13
continua intacto. **O que ainda não fecha a F4:** o contato por WhatsApp (S8, nada escrito), o portão de
abertura (1 de 6 provado) e a indexação no Google (desligada de propósito até o portão). Detalhe e
calendário novo em `01-PLANO.md` §Reavaliação de 25/09.

**Em produção desde 24-25/09, com a prova:**
- **T-027** (`0004`): aplicada em 23/09, 22/22 `true`, sonda 3 38/38 OK, o `estado='ZZ'` agora é recusado.
- **T-028** (`0005`): aplicada no `vetria-e2e` e em produção. Sonda 2 **33/33 OK**, **5571 cidades**,
  "Pet shop" virou **"Loja veterinária"** (DL-070 B). **O slug nasce na aprovação, provado em produção:**
  `larissa-lima-goiania-go`.
- **Busca e perfis públicos** (PR #7, card **T-037**): filtros, 404 igual para inexistente e não ativo,
  selo **"Verificado pela Vetria"**, CRMV visível (DL-070 C), `noindex` até o portão.
- **T-034** (senha com regra única e erros em português), **T-035** (máscaras, limite de especialidades no
  passo 1, botão de arquivo em português: **a T-030 inteira**), **T-036** (link de email por `token_hash`,
  templates trocados no painel e **testado pelo Elber em outro navegador**).
- **CI:** 88 + 10 testes no `vetria-e2e`, obrigatório na `main`.

🔵 **Em execução:** **T-038**, a prévia do perfil público para o próprio profissional (`vetria-ui`).

**Fila dos próximos 5 dias (26/09 a 30/09):** T-038 prévia → **T-033** cabeçalhos (+ SEC-112) → **T-020**
teto do bucket + regras de firewall → **T-031** captcha (código) → **T-039** a `0006` do contato, **escrita
e auditada, não aplicada**. Detalhe em `03-TAREFAS.md`.

🔴 **SESSÃO PRESENCIAL COM O ELBER — AGENDE: terça 30/09 à noite (sugestão, horário fixo semanal).**
Pauta: responder as decisões D1 a D12 da S8 (em `03-TAREFAS.md`) · ligar o Turnstile **depois** do deploy
da T-031 · subir o limite de verificação em Auth → Rate Limits (SEC-114) · regras do firewall da Vercel
(T-020) · provar a senha mínima 8 (tentar 7) · aplicar a `0006` no `vetria-e2e` se a auditoria aprovar.

🚪 **Portão de abertura (DL-063), prazo 20/10: 1 de 6 provados.**
✅ T-027 `0004` · ⬜ T-020 teto do bucket + rate limit · ⬜ T-031 captcha · ⬜ T-032 2FA do admin (trava
própria: antes do segundo admin) · ⬜ T-033 cabeçalhos · 🟡 senha mínima 8 (configurada junto da T-034,
**falta a prova escrita**: cadastrar com 7 caracteres e ver recusar).

⚠️ **Pergunta que pode virar 🔴:** o projeto Supabase de **produção** está no plano grátis? Projeto grátis
**pausa depois de 7 dias sem uso** (R-073). Em produção isso é site fora do ar; no `vetria-e2e` é CI quebrado.

📏 **Gesto do Elber ainda aberto:** conferir a `RESEND_API_KEY` na Vercel (Production). A prova do email da
aprovação foi em `localhost`.

---

## O QUE FUNCIONA DE VERDADE HOJE

| Área | Estado |
|---|---|
| **Auth** | ✅ Email/senha + Google + confirmação + recuperação. **Desde 24/09 o link do email funciona em qualquer navegador** (`/auth/confirm`, `token_hash`, T-036). Senha com regra única (T-034). ⚠️ Sem captcha (T-031) e admin sem 2FA (T-032). |
| **Domínio e email** | ✅ `vetriabrasil.com.br` na Vercel, Resend verificado, templates novos no Supabase. O app manda email de aprovação e reprova. ⚠️ `RESEND_API_KEY` na Vercel não conferida. |
| **RBAC** | ✅ `middleware.ts` isola painel por prefixo e aplica o portão de status (matriz §4); as páginas reconferem por `requirePainel`. |
| **Onboarding profissional** | ✅ Persiste nas duas personas, com documento, máscaras e limite no passo certo (T-035). Ao concluir vai a `pending_validation`. ⚠️ Possível bug de "pausar e voltar" relatado pelo QA, **não reproduzido** (R-072). ⚠️ WhatsApp é **opcional** (R-036, aberto desde 31/08). |
| **Admin** | ✅ Fila real, documento por URL de 60 s, aprovar e reprovar com motivo, email, `audit_logs`. **O banco impõe as transições desde a `0004`.** Moderação e conteúdo continuam casca. |
| **Banco** | ✅ `0002` a `0005` aplicadas. CHECKs de conteúdo (0004), listas de especialidades, serviços e 5571 cidades, slug `nome-cidade-uf` gerado na aprovação, full-text em português (0005). `contatos` existe e está **vazia**. |
| **Busca e perfil público** | ✅ **No ar desde 25/09.** Leitura como visitante anônimo; quem aparece é decidido pela RLS `perfil_esta_ativo`. Telefone e WhatsApp fora do HTML (conferido por teste). `noindex` de propósito até o portão. Contato mostra "abre em breve" (`CONTATO_PELO_SITE_ABERTO = false`). |
| **Storage** | ✅ Bucket privado `documentos`, zero policy. ⚠️ Sem teto de volume (T-020). |
| **Testes** | ✅ **88 + 10 no CI, no projeto de teste `vetria-e2e`** (DL-064), pulo vira falha (`E2E_EXIGIR_FILA=1`). Cobrem cadastro com conta nova, aprovação, portão, busca e perfil. Não cobrem contato (não existe). |

---

## O QUE É CASCA (tela existe, dado não)

- `/admin/moderacao`, `/admin/conteudo` → sem card (não são item de DoD)
- Onboarding do responsável (coleta cidade e animal e descarta) → sem card
- Editores de perfil das 3 personas → F6/S11 (T-019, DL-056). A **prévia** (só leitura) é a T-038, agora
- **Contatos recebidos** (vet e estabelecimento) e **histórico do responsável** ("Seus agendamentos") → S8, T-042
- Agenda, avaliações, plano → fora do escopo dos 3 meses

---

## O QUE NÃO EXISTE AINDA

- O **evento de contato** (S8: T-039 a T-043) e o vínculo do contato anônimo à conta nova
- Captcha, 2FA do admin, cabeçalhos, teto do bucket (portão de abertura, DL-063)
- Indexação no Google das páginas públicas e `sitemap` (T-045, depois do portão)
- As 6 landing pages (F5)
- Consentimento, exportação e exclusão de dados (LGPD, F6)

---

## STACK

| Camada | Escolha | Nota |
|---|---|---|
| Framework | Next.js 16 (App Router) | React 19.2 |
| Estilo | Tailwind v4 via `@theme inline` em `app/globals.css` | Sem `tailwind.config` |
| Fonte | Inter, única (DL-032) | Serif foi tentada e revertida |
| Auth + DB + Storage | Supabase (produção + `vetria-e2e`) | Resend como SMTP; ícones `lucide-react` |
| Hospedagem | Vercel, deploy no merge da PR na `main` | |
| Testes | Playwright + GitHub Actions | CI obrigatório na `main` (ruleset) |
| Pagamento | Stripe | **fora do escopo dos 3 meses** |

---

## MAPA DE ROTAS (real, hoje)

```
PÚBLICO   /  ·  /buscar  ·  /veterinario/[slug]  /estabelecimento/[slug]
          /login  /cadastro  /cadastro/{responsavel,veterinario,estabelecimento}
          /recuperar-senha[/nova]  /auth/callback  /auth/confirm  ·  /roadmap  /entrega-fase-2 (noindex)
RESPONSÁVEL (role tutor, chrome header)   /app/responsavel  + /onboarding /perfil /historico /avaliacoes
VETERINÁRIO (role vet, sidebar)           /app/veterinario/onboarding · /app/veterinario + /agenda
          /aguardando /ajuda /avaliacoes /bloqueado /configuracoes /contatos /perfil /plano
ESTABELECIMENTO (role clinic, sidebar)    /app/estabelecimento/onboarding · /app/estabelecimento
          + os mesmos do vet, mais /equipe
ADMIN (role admin, chrome dark)           /admin + /usuarios /validacoes /moderacao /conteudo
API       /api/admin/profiles  /api/admin/set-access  /api/onboarding/set-role  /api/cidades
          /api/documentos/upload  /api/documentos/abrir
```

> ⚠️ **Nomenclatura.** Rotas em português, **valores de role no banco** `tutor`/`vet`/`clinic` (DL-043).
>
> ⚠️ **As duas rotas de documento ficam FORA do `matcher` do `middleware.ts` e se defendem sozinhas.**

---

## ONDE ESTÃO AS COISAS

| Preciso de... | Está em |
|---|---|
| O que foi contratado | `docs/00-ESCOPO.md` 🔒 |
| **Quem acessa o quê** | **`docs/06-PERMISSOES.md`** — vira RLS e middleware |
| O plano das 13 semanas | `docs/01-PLANO.md` |
| A fila de tasks | `docs/03-TAREFAS.md` |
| Bugs, dívidas e riscos | `docs/04-RISCOS.md` |
| Por que decidimos X | `docs/05-DECISOES.md` (DL-041+) e `CONTEXT.md` (DL-001 a DL-040, histórico) |
| Como os agentes trabalham | `docs/AGENTES.md` |
| Relatórios de segurança/QA/UX | `docs/relatorios/` |
| O que os **donos** veem | rota `/roadmap` (viva, noindex) e `/entrega-fase-2` |
| Como entrar numa sessão nova | `HANDOFF.md` e `RETOMAR.md` |
| Referência visual | `design-system (1).html`, `vetria-proto/` (gitignored) |
| Marca, copy, briefing | pasta `..` (Desktop/Vetria): manual da marca, copies `.docx` |

> **Arquivos históricos, congelados, não escreva neles:** `CONTEXT.md` (DL-001 a DL-040) ·
> `BACKLOG.md` (TASK-001 a 039) · `DEMO.md` · `../VETRIA_PROJETO.md` (desatualizado, válido pelo mapa de
> telas e pelos backlogs V2/V3).
