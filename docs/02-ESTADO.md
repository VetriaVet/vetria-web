# 02 — ESTADO REAL DO PROJETO

> **Este é o primeiro arquivo que qualquer sessão ou agente lê.**
> Curto de propósito. Se passar de ~150 linhas, está virando log — o log é o `05-DECISOES.md`.
>
> **Última atualização:** 28/10/2026, terça (`vetria-maestro`, retomada depois da pausa e replanejamento até 25/11; `vetria-escriba`, DL-073 e DL-074) ·
> **Fase:** **F4 (fechamento) com F5 e F6 comprimidas** · **Último commit na `main`:** `4eb7824` (PR #14, 25/09).
> **Tudo entra por PR**: o CI é obrigatório na `main` (ruleset) e `git push` direto é recusado.

---

## AGORA

**Fase:** **F4, Motor B2C, por fechar** · **Semana:** **1 de 4 até a entrega (28/10 a 03/11)** · **Entrega:** 25/11/2026 (faltam 28 dias)

⏸️ **O projeto ficou pausado por decisão do Elber de 25/09 a 28/10.** Nenhum commit nesse período. As semanas S6 a S9
do plano não aconteceram. Retomado em 28/10.

🔴 **O número honesto: o buffer acabou.** Em 25/09 estávamos ~1,5 semana adiantados; a pausa consumiu 4,5 semanas.
Saldo: **~3 semanas de atraso contra o plano original**. O que o plano punha em 7 semanas (fim da S8, F5, F6 e o
buffer da S13) agora cabe em 4, **sem nenhum dia de folga**. Calendário novo em `01-PLANO.md` §Reavaliação de 28/10.

**Prioridade do Elber (28/10):** (1) o aplicativo funcionando ponta a ponta, com o contato por WhatsApp;
(2) portão de segurança e uma rodada de testes internos de segurança e QA; (3) landing pages no fim.
⚠️ **As landing pages são a capacidade E6, contratada** (`00-ESCOPO.md` §2). Elas ficam na última semana, na versão
mínima, e **não saem do contrato sem emenda** (ver R-078).

⚠️ **R-073 ACONTECEU:** com a pausa, o Supabase de produção (plano grátis) pausou sozinho depois de 7 dias sem uso. O
Elber restaurou em 28/10 e o site voltou (conferido hoje: `/api/cidades`, `/buscar` e o perfil
`larissa-lima-goiania-go` respondem 200). **O `vetria-e2e` quase certamente também está pausado** (último CI em 25/09,
33 dias); não conferido daqui, porque a URL dele não está no repositório. **Restaurar o `vetria-e2e` é gesto do Elber.**

✅ **Decidido em 28/10: produção FICA no plano grátis** (confirma o DL-072). **O item 7 do portão está fechado** com
essa decisão. Consequência: **a T-044 (manter os dois bancos acordados) é a prioridade zero da fila.** O R-073 continua
valendo daqui para frente; a mitigação é a T-044 e mais nada (**DL-073**).

✅ **Decidido em 28/10, delegado pelo Elber (DL-074):** sessões presenciais diárias até 25/11 · página de preço como
vitrine "em breve", sem depoimentos, texto até 14/11 (R-077) · Termos e Política rascunhados por agente até 10/11,
aprovados pelo Elber, advogado depois da entrega · gatilho de 10/11: se a F4 não fechar, a meta de Lighthouse >= 90 vira
só medição · demonstração de 31/10 no ambiente de teste, produção só a partir de 04/11.

**O que entrou desde a última atualização (25/09), conferido no código:**
- **T-038** (prévia do perfil em `/app/*/perfil`, mesmo componente da página pública): **em produção** (PR #11, `81784e1`).
  Falta o teste do item 5 do card (vai para a T-043).
- **T-033** (cabeçalhos + "Você entrou como"): **em produção** (PR #13). Prova de hoje: `curl -I` em produção devolve
  `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e HSTS.
- **T-039** (a `0006` do contato): **escrita, ensaiada e auditada (APROVADA), NÃO aplicada.** Mora na **PR #15**, que
  está **em conflito com a `main` só no `docs/03-TAREFAS.md`**. O SQL não conflita. O texto do card já foi trazido
  para a `main` nesta atualização, então resolver o conflito é ficar com a versão da `main`.

🚪 **Portão de abertura (DL-063): 3 de 7 provados. O prazo de 20/10 venceu.** Prazo novo: **10/11**.
✅ T-027 `0004` · ✅ T-033 cabeçalhos (28/10) · ✅ item 7, plano do Supabase decidido (grátis, 28/10) ·
⬜ T-020 teto do bucket + firewall · ⬜ T-031 captcha · ⬜ T-032 2FA do admin · 🟡 senha mínima 8 (falta a prova:
cadastrar com 7 caracteres e ver recusar). Pela auditoria da `0006` (SEC-120), **o Turnstile no clique de contato é
obrigatório antes de ligar o botão em produção**: a T-031 deixou de ser opcional para o contato.

**Fila dos próximos 5 dias (28/10 a 03/11):** **T-044** bancos acordados → **PR #15** sem conflito → 🔴 **`0006` no
`vetria-e2e`** → **T-040** rota do contato → **T-046** WhatsApp obrigatório → **T-041** o botão. Detalhe em `03-TAREFAS.md`.

🎯 **Resultado para mostrar:** **sexta 31/10**, o contato completo **no ambiente de teste** (`vetria-e2e` por localhost
ou preview: busca, perfil, "Chamar no WhatsApp", número aparece, contato gravado). **Terça 04/11**, o mesmo em
`vetriabrasil.com.br`, com Turnstile. Produção não entra antes de 04/11 (DL-074 item 5).

🔴 **SESSÕES PRESENCIAIS:** **Elber disponível todo dia até 25/11 (DL-074).** Os marcos continuam: **sessão A, quarta
29/10 à noite** (restaurar o `vetria-e2e`, aplicar a `0006` nele, criar a chave do Turnstile) e **sessão B, segunda 03/11
à noite** (`0006` em produção, Turnstile ligado no painel, firewall da Vercel, prova da senha 8). Outro 🔴 entra no dia
em que ficar pronto.

📏 **Gesto do Elber ainda aberto (desde 25/09):** conferir a `RESEND_API_KEY` na Vercel (Production).

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
| **Cabeçalhos e prévia** | ✅ Cabeçalhos de segurança em todas as rotas (T-033, conferido em produção em 28/10). Prévia do perfil público no painel do profissional (T-038). |
| **Testes** | ✅ **88 + 10 no CI, no projeto de teste `vetria-e2e`** (DL-064), pulo vira falha (`E2E_EXIGIR_FILA=1`). Cobrem cadastro com conta nova, aprovação, portão, busca, perfil e cabeçalhos. Não cobrem contato (não existe). ⚠️ **Último CI em 25/09; o `vetria-e2e` provavelmente está pausado (R-073) e o próximo CI falha até ele ser restaurado.** |

---

## O QUE É CASCA (tela existe, dado não)

- `/admin/moderacao`, `/admin/conteudo` → sem card (não são item de DoD)
- Onboarding do responsável (coleta cidade e animal e descarta) → sem card
- Editores de perfil das 3 personas → T-019, **só se sobrar tempo** (não é capacidade contratada, DL-056). A **prévia** (só leitura) está no ar (T-038)
- **Contatos recebidos** (vet e estabelecimento) e **histórico do responsável** ("Seus agendamentos") → T-042, semana de 04/11
- Agenda, avaliações, plano → fora do escopo dos 3 meses

---

## O QUE NÃO EXISTE AINDA

- O **evento de contato** (T-039 escrita e não aplicada; T-040 a T-043) e o vínculo do contato anônimo à conta nova
- Captcha, 2FA do admin, teto do bucket (portão de abertura, DL-063)
- Indexação no Google das páginas públicas e `sitemap` (T-045, depois do portão)
- As 6 landing pages (F5, E6 contratada): semana de 18/11, versão mínima (T-050); preço como vitrine "em breve" (DL-074)
- Consentimento, exportação e exclusão de dados, Termos e Política (LGPD, transversal contratada): semana de 11/11 (T-049); rascunho dos Termos até 10/11 (DL-074)

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
| Pagamento | nenhum | **fora do escopo dos 3 meses.** O plano original dizia Stripe; a proposta da rodada 2 recomenda Asaas (`docs/07-RODADA-2.md` §4, não decidido) |

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
| O que vem depois de 25/11 (cobrança e o resto) | `docs/07-RODADA-2.md` (proposta para decisão) |
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
