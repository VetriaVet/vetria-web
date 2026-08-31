# 02 — ESTADO REAL DO PROJETO

> **Este é o primeiro arquivo que qualquer sessão ou agente lê.**
> Curto de propósito. Se passar de ~150 linhas, está virando log — o log é o `05-DECISOES.md`.
>
> **Última atualização:** 31/08/2026 (T-003 e T-006 commitadas em branch) · **Fase:** F3 (S2) · **Commit base:** `445cfde`, branch `f3-s2/onboarding-vet-e-ci`

---

## AGORA

**Fase:** F3 — Núcleo de dados · **Semana:** 2 de 13 · **Entrega:** 25/11/2026

**Em execução:** nada. **T-003 e T-006 estão escritas, verdes e commitadas** na branch
`f3-s2/onboarding-vet-e-ci` (`82f59bb` e `445cfde`), **e nenhuma das duas fechou.**

⚠️ **A S2 continua sem card 🔴, mas voltou a ter coisa esperando o Elber** — quatro gestos, e
três deles são de celular:
1. **A prova de persistência da T-006**, na preview da Vercel desta branch. É o último item de
   DoD aberto do card e é **manual** (R-033). Precisa de uma conta `vet` nova, porque
   `concluir_onboarding_profissional()` só sai de `incomplete` uma vez.
2. **Os 4 secrets do GitHub**, sem os quais os 2 testes de login da T-003 nunca saem de "pulado".
3. **`begin; select 42 as prova; rollback;`** no SQL Editor, que fecha a T-013 sozinha.
4. **Fazer o merge desta branch**, porque **produção ainda roda o código antigo do onboarding.**

⚠️ **O que se descobriu em 31/08, e vale mais que o código:** a auditoria da T-006 **existia só
nos comentários do código**. Cinco achados (SEC-052, 054, 056, 057, 058) estavam corrigidos e
comentados no `actions.ts`, e **nenhum dos cinco existia em `docs/relatorios/`, em `04-RISCOS.md`
ou em qualquer outro arquivo** — a sessão de 28/08 terminou sem commit e o relatório morreu com
ela. O relatório foi **reconstruído a partir do código**
(`relatorios/SEC-2026-08-28-T006.md`), e a reconstrução não alcança tudo: **SEC-053 e SEC-055
continuam sem dono.** Virou o **R-034**, e ele **vence antes da T-007**, que clona esse arquivo.

**A `0003` foi aplicada em produção em 26/08 e verificada por 18 sondas, todas verdes** (commit
`a68251d`; o select de onze colunas da própria migration veio todo `true`, `copia_linhas = 0`).
**A T-002 fechou.** O banco ganhou o bucket privado `documentos` (10 MiB, quatro MIME, **zero
policy**); `cnpj`, `razao_social` e `responsavel_tecnico` **saíram** de `clinic_profiles` e vivem
em `perfil_privado`; e a linha passou a guardar a identidade dos **bytes** do documento
(`documento_hash` + `documento_tamanho`). Medido em produção: `anon` pedindo `cnpj` recebe
"coluna não existe" (a SEC-020 foi fechada na raiz, não escondida); conta logada não lê a linha
de outra conta; **a busca pública continua funcionando**; e trocar os bytes de um documento
aprovado devolve o perfil para a fila, o que ontem não acontecia. Duas auditorias: a v1 foi
reprovada, a v2 aprovada. Decisões em **DL-051 a DL-054**; os `md5` das funções, que a `0004`
vai precisar, em `supabase/migrations/README.md`.

**O trabalho da semana:** matar a casca dos onboardings profissionais. ⚠️ **A metade do
veterinário já está escrita (T-006), mas só na branch: EM PRODUÇÃO o "Concluir" continua
descartando tudo.** Hoje, no ar, o "Concluir" do
veterinário e o do estabelecimento só marcam `onboarding_completed = true` e **descartam tudo que
a pessoa digitou**. Ninguém entra na fila de validação, porque `status` continua `incomplete`. As
tabelas, a RLS e `concluir_onboarding_profissional()` existem desde a `0002`: falta o código
chamar.

**Ordem da S2:** **T-006 → T-007 → T-008** (desbloqueada em 26/08: o bucket existe e está vazio).
**T-003 (Playwright + CI) corre em paralelo**, porque `vetria-qa` só escreve em `tests/`.
**T-013** virou acompanhamento: conserta o arquivo de verificação para a próxima vez que alguém
o rodar.

⚠️ **Duas perguntas de produto sem dono, e as duas vencem antes do perfil público da F4/S7**
(R-032): endereço e CEP de MEI são vitrine ou dado pessoal, já que em quem atende em casa eles são
o endereço residencial? E por que o estabelecimento que muda de cidade volta para a fila de
validação e o veterinário não? Hoje as duas estão escritas no banco, em `comment on column`, como
pergunta em aberto.

**S1 entregou 5 de 6:** governança, baseline, migration `0002`, auditoria e o fix de layout dos
onboardings. **Escorregaram pra S2:** T-002 e T-003 — a T-002 fechou em 26/08, a T-003 continua
na fila. **Saiu da S2:** onboarding do responsável vai pra S3; foto e horários não entram (R-019).
**Backup:** `supabase/backups/`, fora do repo.

---

## O QUE FUNCIONA DE VERDADE HOJE

| Área | Estado |
|---|---|
| **Auth** | ✅ Real. Email/senha + Google OAuth + confirmação + recuperação de senha, validados em produção (DL-039). |
| **Domínio e email** | ✅ Real. `vetriabrasil.com.br` na Vercel; Resend verificado; envio de `contato@vetriabrasil.com.br` (DL-039/040). |
| **RBAC** | 🟡 Parcial. Roteia por role e `requirePainel` guarda as páginas de painel — mas o `middleware.ts` não isola painel por role. **Ver R-001.** Matriz alvo definida em `docs/06-PERMISSOES.md` (DL-044 a DL-047). |
| **Telas** | ✅ ~45 telas no design system v2 (Inter + tokens `@theme` do Tailwind v4), estados honestos, sem dado fake. |
| **Admin** | 🟡 Painel dark completo; RBAC de usuários é real; validações/moderação/conteúdo são casca. |
| **Banco** | ✅ Núcleo (`0002`) + storage e privacidade (`0003`), as duas aplicadas em 26/08. `profiles.status`, `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais`, `contatos`, `audit_logs`, com RLS codificando a matriz. Identificação do estabelecimento (`cnpj`, `razao_social`, `responsavel_tecnico`) e identidade dos bytes do documento (`documento_hash`, `documento_tamanho`) vivem em `perfil_privado`. **Tabelas vazias:** as telas ainda não escrevem nelas (F3/S2). |
| **Storage** | 🟡 Bucket privado `documentos` existe (10 MiB; pdf/jpeg/png/webp; **zero policy**, só `service_role` alcança). **Está vazio:** falta a rota que sobe o arquivo (T-008). |
| **Emails transacionais** | 🟡 3 do Supabase ativos; 3 do app versionados e desligados (esperam a F3). |
| **Testes** | 🟡 **Commitados em 31/08** (`82f59bb`, em branch). Playwright + workflow de CI (T-003): **13 testes verdes** cobrindo as portas trancadas do `middleware.ts`, as telas públicas, o `noindex` do `/roadmap` e a regra de copy do DL-038. **2 testes de login pulam** até os secrets do GitHub existirem. ⚠️ **Lint no CI ainda não bloqueia** (T-014), e **a persistência do onboarding ainda não tem teste** (R-033). |

---

## O QUE É CASCA (tela existe, dado não)

Todas essas telas estão no ar, bonitas e navegáveis, mas **não persistem nada**:

- Onboarding de **estabelecimento** (multi-step) → F3/S2 (T-007)
- Onboarding de **veterinário** → ⚠️ **resolvido na branch (T-006), ainda casca em produção até o merge**
- Onboarding do responsável (coleta cidade e um animal, e descarta os dois) → F3/S3
- Editores de perfil das 3 personas → F3/S3
- `/admin/validacoes`, `/admin/moderacao`, `/admin/conteudo` → F3/S4
- Agenda, contatos, avaliações, plano (nos painéis B2B) → fora do escopo dos 3 meses
- Busca da Home (não leva a lugar nenhum) → F4/S6

---

## O QUE NÃO EXISTE AINDA

- **A rota de upload do documento (T-008).** O bucket existe e está vazio; nenhum profissional
  consegue enviar nada, e o admin da S4 não tem o que abrir
- Rotas `/buscar`, `/veterinario/[slug]`, `/estabelecimento/[slug]`
- As 6 landing pages
- Consentimento, exportação e exclusão de dados (LGPD)
- Qualquer teste automatizado ou pipeline de CI

---

## STACK

| Camada | Escolha | Nota |
|---|---|---|
| Framework | Next.js 16 (App Router) | React 19.2 |
| Estilo | Tailwind v4 via `@theme inline` em `app/globals.css` | Sem `tailwind.config` |
| Fonte | Inter, única (DL-032) | Serif foi tentada e revertida |
| Auth + DB + Storage | Supabase | Resend como SMTP; ícones `lucide-react` |
| Hospedagem | Vercel, deploy em push na `main` | |
| Testes | Playwright + GitHub Actions | 🟡 commitados em 31/08 em branch, aguardando os 4 secrets (T-003) |
| Pagamento | Stripe | **fora do escopo dos 3 meses** |

---

## MAPA DE ROTAS (real, hoje)

```
PÚBLICO   /  ·  /login  /cadastro  /cadastro/{responsavel,veterinario,estabelecimento}
          /recuperar-senha[/nova]  /auth/callback  ·  /roadmap  /entrega-fase-2 (noindex)
RESPONSÁVEL (role tutor, chrome header)   /app/responsavel  + /onboarding /perfil /historico /avaliacoes
VETERINÁRIO (role vet, sidebar)           /app/veterinario/onboarding · /app/veterinario + /agenda
          /aguardando /ajuda /avaliacoes /configuracoes /contatos /perfil /plano
ESTABELECIMENTO (role clinic, sidebar)    /app/estabelecimento/onboarding · /app/estabelecimento
          + os mesmos do vet, mais /equipe
ADMIN (role admin, chrome dark)           /admin + /usuarios /validacoes /moderacao /conteudo
API       /api/admin/profiles  /api/admin/set-access  /api/onboarding/set-role
```

> ⚠️ **Atenção à nomenclatura.** As **rotas** são em português, mas os **valores de role no
> banco** continuam `tutor`/`vet`/`clinic` (DL-043, commit `b815ca5`). Trocar isso agora
> quebraria o banco em produção.

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
