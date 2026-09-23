# 02 — ESTADO REAL DO PROJETO

> **Este é o primeiro arquivo que qualquer sessão ou agente lê.**
> Curto de propósito. Se passar de ~150 linhas, está virando log — o log é o `05-DECISOES.md`.
>
> **Última atualização:** 23/09/2026, noite (`vetria-maestro`, fechamento da F3 e abertura da S5) ·
> **Fase:** **F4 (S5)** · **Último commit em produção:** `6a8d86a` (a T-024; o verde do CI ainda não foi
> conferido por ninguém).

---

## AGORA

**Fase:** **F4 — Motor B2C**, começou hoje · **Semana:** **S5 (5 de 13), 23/09 a 29/09** · **Entrega:** 25/11/2026

⛔ **A F3 ENCERROU EM 23/09 COM 5 DE 6, E NÃO SE DECLARA CONCLUÍDA** (**DL-062**). O item 3 (admin
aprova, a pessoa entra no painel e recebe o email) **fechou hoje, provado em tela pelo Elber e em
produção** (`6a8d86a`). O item 4 fechou ao pé da letra com conta `tutor`. **O item 5 ficou parcial:**
os itens 1 e 3 não têm E2E porque o **R-033** (onde criar conta de teste nova) não tem decisão desde
28/08. Virou a **T-029**, com **data dura 06/10**. A F3 só vira "concluída" quando o CI rodar isso verde.

⚠️ **Estamos cerca de uma semana atrás em trabalho** (não em calendário). A S3 fechou 5 dias tarde, a
S4 foi espremida em três dias, e a F4 herda três dívidas: o item 5, a T-017 (agora dentro da T-027) e
~3 dias de endurecimento que o plano não tinha. **O buffer da S13 está intacto.** O plano de
recuperação está no `01-PLANO.md` §Atraso; o gatilho é a sessão presencial até 29/09.

🔴 **SESSÃO PRESENCIAL COM O ELBER — AGENDE, ATÉ 29/09.** A S5 inteira depende dela:
- **T-027**, a `0004`: o banco passa a recusar o que a Action recusa. **Absorveu a T-017**, cujo furo
  foi **medido em 23/09** (`PATCH estado='ZZ'` aceito pelo banco, restaurado), mais SEC-096 (a RPC de
  aprovação exige a conta na fila e motivo na reprova), SEC-097(b), SEC-098, SEC-093 e o formato do CRMV
- **T-028**, a `0005`: tabelas de especialidades, cidades e serviços, a regra do `slug` e os índices.
  **Sem ela a S6 não tem o que buscar**, e as contas já aprovadas têm `slug` nulo (**R-065**)
- **A decisão do R-033** (projeto Supabase só de teste, T-029)

**Fila da S5**, em ordem de dependência: **T-027** 🔴 → **T-028** 🔴 → **T-029** (QA, em paralelo) →
**T-030** (o limite de especialidades no passo certo e o botão de arquivo em português) → **T-020**
(teto do bucket e rate limit da Vercel; se não couber, abre a S6).

🚪 **O portão de abertura (DL-063): nenhum profissional de fora antes destes 6, provados. Prazo 20/10.**
⬜ T-027 `0004` · ⬜ T-020 teto do bucket + rate limit · ⬜ T-031 captcha · ⬜ T-032 2FA do admin
(trava própria: antes do segundo admin) · ⬜ T-033 cabeçalhos · ⬜ senha mínima 8 no Supabase.
**Cloudflare: não** (DL-063).

📏 **Gestos do Elber, 1 minuto cada:** senha mínima 8 no painel do Supabase (R-064) · conferir o CI de
`6a8d86a` no GitHub · **conferir a `RESEND_API_KEY` nas variáveis da Vercel (Production)**: a prova do
email foi em `localhost`; sem a chave na Vercel, em produção a decisão funciona e o email não sai.

📝 **Na árvore, sem commit:** o `vetria-qa` escreveu `tests/e2e/admin-validacoes.spec.ts` (19 testes de
leitura, segundo ele) e mexeu em `tests/apoio/credenciais.ts` e `sessao.ts`. **Não rodado.** É da T-029.

**Decisões de hoje:** **DL-062** (F3 encerra com 5 de 6; T-017 entra na T-027; SEC-091 para a F6/S11,
aceito pelo Elber) · **DL-063** (portão de abertura; Cloudflare não). A **prévia real do perfil
público** que o Elber pediu vai para a **S7**, como o mesmo componente da página pública (E5).

---

## O QUE FUNCIONA DE VERDADE HOJE

| Área | Estado |
|---|---|
| **Auth** | ✅ Real. Email/senha + Google OAuth + confirmação + recuperação de senha, validados em produção (DL-039). |
| **Domínio e email** | ✅ Real. `vetriabrasil.com.br` na Vercel; Resend verificado; envio de `contato@vetriabrasil.com.br`. **O app manda email por código desde a T-024** (aprovação e reprova com motivo, pela API do Resend): **provado em `localhost` em 23/09, email recebido**. ⚠️ Em produção depende da `RESEND_API_KEY` na Vercel, **não conferida**. |
| **RBAC** | ✅ **Real desde 20/09.** O `middleware.ts` isola painel por **prefixo de rota** e aplica o **portão de status** da matriz §4, e as páginas reconferem por `requirePainel(role, statusPermitidos)`. Lista de permitidos em `lib/auth/status.ts`, um lugar só. **R-001 e R-038 fechados por prova em tela.** |
| **Telas** | ✅ ~45 telas no design system v2 (Inter + tokens `@theme` do Tailwind v4), estados honestos, sem dado fake. **Nasceram as duas `/bloqueado`**, com o motivo lido de `profiles.status_motivo` e a frase honesta quando ele é nulo. |
| **Onboarding profissional** | ✅ **Persiste nas duas personas** (T-006, T-007) e o documento sobe (T-008). Ao concluir, o `status` vai a `pending_validation` pela RPC e a pessoa cai em `/aguardando`. **Conta nova não conclui sem documento** (DL-061, na Action). **O caminho de volta ao cadastro existe** em `/aguardando` (T-025). Reprovado vê o motivo. ⚠️ O limite de especialidades só avisa no passo 4 (R-060, T-030). |
| **Admin** | ✅ **A validação é real desde 23/09:** `/admin/validacoes` lista a fila do banco, abre o documento (URL de 60 s, com trilha), **aprova e reprova com motivo**, dispara o email e grava `audit_logs`. O detalhe só abre conta que está na fila (DL-061). `/admin/usuarios` só para master (R-054 fechado). **Moderação e conteúdo continuam casca.** ⚠️ Admin entra só com senha (R-062, T-032). |
| **Banco** | ✅ Núcleo (`0002`) + storage e privacidade (`0003`), aplicadas em 26/08. `profiles.status`, `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais`, `contatos`, `audit_logs`, com RLS codificando a matriz. **`clinic_profiles` deixou de estar vazia em 20/09.** `animais` e `contatos` continuam vazias. ⚠️ **Nenhuma coluna de conteúdo tem CHECK, e foi MEDIDO em 23/09: o banco grava `estado='ZZ'`** (R-039 → **T-027** 🔴). **Existem contas `active` desde 23/09, todas com `slug` nulo** (R-065 → T-028). |
| **Storage** | ✅ **Bucket privado `documentos` deixou de estar vazio em 20/09** (10 MiB, quatro MIME, **zero policy**, só `service_role` alcança). Rotas `/api/documentos/upload` e `/abrir`; URL assinada de 60 s, medida. ⚠️ **Sem teto de volume e sem limpeza** (SEC-081 / **T-020**). |
| **Testes** | ✅ **41 testes na suíte** (40 verdes no CI de 20/09; o 41º veio com a T-025). Mais 19 escritos em 23/09, sem rodar (T-029). ⚠️ Se a conta de teste sair da fila, 16 testes pulam e o CI fica verde calado (T-029, parte A). Histórico: **40 testes, todos verdes no CI de 20/09** — primeira execução completa da suíte. `publico` (10), `login` (2), `onboarding-vet` (9), `portao-status` (10) mais os parametrizados. Lint bloqueia desde 31/08. ⚠️ **A persistência do onboarding continua sem E2E** (**R-033**): falta conta nova a cada rodada, e é por isso que o estabelecimento não tem prova automatizada nenhuma. |

---

## O QUE É CASCA (tela existe, dado não)

Telas no ar, bonitas e navegáveis, que **não persistem nada**:

- ~~`/admin/validacoes`~~ ✅ **real desde 23/09** · `/admin/moderacao`, `/admin/conteudo` → sem card (não são item de DoD)
- Onboarding do responsável (coleta cidade e um animal, e descarta os dois) → **sem card**
- Editores de perfil das 3 personas → ⛔ cortado da S3 em 16/09 → F6/S11 (T-019, DL-056). A **prévia** do perfil (só leitura) vem antes, na F4/S7, com o perfil público
- Agenda, contatos, avaliações, plano (nos painéis B2B) → fora do escopo dos 3 meses
- Busca da Home (não leva a lugar nenhum) → F4/S6
- ~~Onboarding de veterinário~~ ✅ 31/08 · ~~Onboarding de estabelecimento~~ ✅ **20/09**

---

## O QUE NÃO EXISTE AINDA

- Rotas `/buscar` (S6), `/veterinario/[slug]`, `/estabelecimento/[slug]` (S7), e o registro do contato (S8)
- Tabelas de especialidades, cidades e serviços, e a regra do `slug` (S5, T-028)
- Captcha, 2FA do admin e cabeçalhos de segurança (portão de abertura, DL-063)
- As 6 landing pages
- Consentimento, exportação e exclusão de dados (LGPD)

---

## STACK

| Camada | Escolha | Nota |
|---|---|---|
| Framework | Next.js 16 (App Router) | React 19.2 |
| Estilo | Tailwind v4 via `@theme inline` em `app/globals.css` | Sem `tailwind.config` |
| Fonte | Inter, única (DL-032) | Serif foi tentada e revertida |
| Auth + DB + Storage | Supabase | Resend como SMTP; ícones `lucide-react` |
| Hospedagem | Vercel, deploy em push na `main` | |
| Testes | Playwright + GitHub Actions | ✅ 40 testes verdes no CI (20/09) |
| Pagamento | Stripe | **fora do escopo dos 3 meses** |

---

## MAPA DE ROTAS (real, hoje)

```
PÚBLICO   /  ·  /login  /cadastro  /cadastro/{responsavel,veterinario,estabelecimento}
          /recuperar-senha[/nova]  /auth/callback  ·  /roadmap  /entrega-fase-2 (noindex)
RESPONSÁVEL (role tutor, chrome header)   /app/responsavel  + /onboarding /perfil /historico /avaliacoes
VETERINÁRIO (role vet, sidebar)           /app/veterinario/onboarding · /app/veterinario + /agenda
          /aguardando /ajuda /avaliacoes /bloqueado /configuracoes /contatos /perfil /plano
ESTABELECIMENTO (role clinic, sidebar)    /app/estabelecimento/onboarding · /app/estabelecimento
          + os mesmos do vet, mais /equipe
ADMIN (role admin, chrome dark)           /admin + /usuarios /validacoes /moderacao /conteudo
API       /api/admin/profiles  /api/admin/set-access  /api/onboarding/set-role
          /api/documentos/upload  /api/documentos/abrir
```

> ⚠️ **Atenção à nomenclatura.** As **rotas** são em português, mas os **valores de role no
> banco** continuam `tutor`/`vet`/`clinic` (DL-043, commit `b815ca5`). Trocar isso agora
> quebraria o banco em produção.
>
> ⚠️ **As duas rotas de documento ficam FORA do `matcher` do `middleware.ts` e se defendem
> sozinhas:** sessão, role e status reconferidos por conta própria, antes de ler o corpo.

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
| Como entrar numa sessão nova | `HANDOFF.md` |
| Referência visual | `design-system (1).html`, `vetria-proto/` (gitignored) |
| Marca, copy, briefing | pasta `..` (Desktop/Vetria): manual da marca, copies `.docx` |

> **Arquivos históricos, congelados, não escreva neles:** `CONTEXT.md` (DL-001 a DL-040) ·
> `BACKLOG.md` (TASK-001 a 039, fase visual) · `DEMO.md` · `../VETRIA_PROJETO.md`, o documento
> mãe de abril, **desatualizado** (fala de Poppins/Cormorant, revertidos em DL-032) mas ainda
> válido pelo mapa de telas e pelos backlogs V2/V3.
