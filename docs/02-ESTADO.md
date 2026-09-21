# 02 — ESTADO REAL DO PROJETO

> **Este é o primeiro arquivo que qualquer sessão ou agente lê.**
> Curto de propósito. Se passar de ~150 linhas, está virando log — o log é o `05-DECISOES.md`.
>
> **Última atualização:** 21/09/2026 (**PR #2 mergeado**; S3 fechada; **S4 aberta**; **R-001,
> R-038, R-047 e R-053 fechados por medição**; **T-023 commitada**; **T-021 fechada**;
> **DL-059, DL-060**) · **Fase:** F3 (S4) · **Commit base:** `eb6e2d6` na `main`,
> mais 5 commits locais **não empurrados** (push na `main` faz deploy e é gesto do Elber)

---

## AGORA

**Fase:** F3 — Núcleo de dados · **Semana:** **S4 (4 de 13), aberta em 21/09** · **Entrega:** 25/11/2026

🎉 **20/09 — O PR #2 ENTROU NA `main` (`eb6e2d6`): 14 commits, 61 arquivos, +7512 −619**, e o CI
rodou **40 testes, todos verdes** — a primeira vez que a suíte inteira executa e passa. Entraram
**T-007** (o onboarding do estabelecimento **persiste**), **T-016** (portão de status e
isolamento de role por prefixo) e **T-008** (o upload do documento, duas rotas novas, e o
**bucket deixou de estar vazio** pela primeira vez desde 26/08), mais os três funis de cadastro
consertados, o `/ajuda` do DL-058 e o pré-voo do `ci.yml`.

⚠️ **E o custo, que é o número que importa desta fase:** a `main` estava em **`e07f967`, de
31/08**. **Vinte dias sem uma linha de código em produção**, com o trabalho escrito, revisado e
aprovado na árvore. **O gargalo da F3 não foi escrever; foi mergear.**

✅ **AS PROVAS EM TELA FORAM FEITAS PELO ELBER, em 20/09, com conta real.** Neste projeto risco
não fecha porque o código existe: fecha quando o comportamento muda em tela. **Mudou.**
As **9 navegações** do portão bateram (`/app` → `/aguardando`; `/app/veterinario`, `/contatos`,
`/plano`, `/agenda` **voltam**; `/perfil` e `/ajuda` **abrem**; `/app/estabelecimento` e `/admin`
**devolvem a conta ao painel dela**). O **upload funcionou ponta a ponta** numa conta `vet` real,
e o `select` provou `documento_hash` com 64 hex, `documento_tamanho` 15683,
`documento_enviado_em` **carimbado pelo banco** e `status = pending_validation`. A **URL assinada
expira em 60 s**, medido no payload do próprio JWT. **O R-047 mediu ZERO** contas `clinic` órfãs:
o `update` 🔴 que ele exigiria **nunca precisou existir**.
**Fecharam: R-001** (era o **único 🔴 crítico aberto do projeto**, desde 26/08), **R-038**,
**R-047** e **R-053**.

⛔ **A F3 FECHA COM 5 DE 6 ITENS DO DoD, e não se declara concluída** (**DL-059**, decisão do
Elber). O **item 3** — *admin aprova, o profissional entra no dashboard e recebe o email* —
**não tem uma linha escrita**: `/admin/validacoes` é casca. Ele vai para a **S4**, que é onde o
`01-PLANO.md` sempre o colocou. **Forçar o item 3 em dois dias é repetir o que gerou a dívida da
S2, e chamar a fase de "concluída" com 5 de 6 é o R-034 outra vez.**

**Fila da S4:** ✅ **T-021 fechada em 21/09** (doc) e 🟨 **T-023 commitada em 21/09** (`4a355b0`,
auditada e aprovada, **esperando a prova em tela**). **Sobram duas:** **T-024** (aprovar e
reprovar com motivo, o email, `audit_logs` — **fecha o item 3 do DoD**) → **T-025** (o caminho de
volta ao onboarding, que o DL-046 promete e a interface **não oferece**: não existe um único
`href` para `/onboarding` no código).
**Correm por fora:** **T-017** 🔴, **T-020** 🟠, **T-022** (decisão) e **T-026**.

🔴 **A T-017 continua sem data, pela quarta semana seguida, e o prazo duro dela é dentro da F3.
É migration. AGENDE.**

⚠️ **Três bugs saíram das provas, e os três já estão consertados em produção.** O maior:
**o R-041 estava aberto do lado do veterinário e ninguém sabia** — a T-007 normalizou só no
arquivo dela e **três auditorias não pegaram, porque as três leram o código do estabelecimento**.
Virou `lib/contato/whatsapp.ts` (`08dd42b`). **É o R-017 pela terceira vez: clone herda defeito,
e revisar o clone não é revisar o par.** Os outros dois: um teste lia `innerText()` contra CSS
`uppercase` e derrubou o CI (`8674e3a`, bug do teste); e **o dado velho sobreviveu ao conserto**,
porque normalização vale na escrita — **R-055** e card **T-026**.

**Riscos vivos que valem a leitura:** **R-033** (sem conta de teste nova, o item 1 do DoD segue
sem E2E e o estabelecimento segue sem prova), **R-039**/**T-017**, **R-057** (origem do pedido
nas rotas de documento), **R-036**, **R-032**, **R-054**, **R-055**.

📏 **Três medições de 30 s, todas do Elber, e nenhuma foi feita:** a passada com conta `tutor` em
`/app/veterinario` (fecha o item 4 do DoD) · a **varredura de órfãos** (card da T-008, item 3 da
seção 🔒) — **destravada pela T-021 em 21/09: a consulta parou de rotular órfão real como
"esperado" (DL-060), são duas consultas, e zero linha nas duas é a medição; enquanto ninguém
roda, R-042 e R-023 ficam abertos** · o `select` do WhatsApp sujo (T-026).

---

## O QUE FUNCIONA DE VERDADE HOJE

| Área | Estado |
|---|---|
| **Auth** | ✅ Real. Email/senha + Google OAuth + confirmação + recuperação de senha, validados em produção (DL-039). |
| **Domínio e email** | ✅ Real. `vetriabrasil.com.br` na Vercel; Resend verificado; envio de `contato@vetriabrasil.com.br`. **Os 3 emails do app continuam desligados** — acendem na T-024. |
| **RBAC** | ✅ **Real desde 20/09.** O `middleware.ts` isola painel por **prefixo de rota** e aplica o **portão de status** da matriz §4, e as páginas reconferem por `requirePainel(role, statusPermitidos)`. Lista de permitidos em `lib/auth/status.ts`, um lugar só. **R-001 e R-038 fechados por prova em tela.** |
| **Telas** | ✅ ~45 telas no design system v2 (Inter + tokens `@theme` do Tailwind v4), estados honestos, sem dado fake. **Nasceram as duas `/bloqueado`**, com o motivo lido de `profiles.status_motivo` e a frase honesta quando ele é nulo. |
| **Onboarding profissional** | ✅ **Persiste nas duas personas** (T-006, T-007) e o documento sobe (T-008). Ao concluir, o `status` vai a `pending_validation` pela RPC e a pessoa cai em `/aguardando`. ⚠️ **Não há link na interface que leve de volta ao onboarding** (T-025). |
| **Admin** | 🟡 Painel dark completo; RBAC de usuários é real; **validações, moderação e conteúdo continuam casca**. `/admin/usuarios` renderiza para admin comum contra a matriz §2 (**R-054**, sem vazar dado, conserto dentro da T-023). |
| **Banco** | ✅ Núcleo (`0002`) + storage e privacidade (`0003`), aplicadas em 26/08. `profiles.status`, `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais`, `contatos`, `audit_logs`, com RLS codificando a matriz. **`clinic_profiles` deixou de estar vazia em 20/09.** `animais` e `contatos` continuam vazias. ⚠️ **Nenhuma coluna de conteúdo tem CHECK** (R-039 / T-017 🔴). |
| **Storage** | ✅ **Bucket privado `documentos` deixou de estar vazio em 20/09** (10 MiB, quatro MIME, **zero policy**, só `service_role` alcança). Rotas `/api/documentos/upload` e `/abrir`; URL assinada de 60 s, medida. ⚠️ **Sem teto de volume e sem limpeza** (SEC-081 / **T-020**). |
| **Testes** | ✅ **40 testes, todos verdes no CI de 20/09** — primeira execução completa da suíte. `publico` (10), `login` (2), `onboarding-vet` (9), `portao-status` (10) mais os parametrizados. Lint bloqueia desde 31/08. ⚠️ **A persistência do onboarding continua sem E2E** (**R-033**): falta conta nova a cada rodada, e é por isso que o estabelecimento não tem prova automatizada nenhuma. |

---

## O QUE É CASCA (tela existe, dado não)

Telas no ar, bonitas e navegáveis, que **não persistem nada**:

- `/admin/validacoes`, `/admin/moderacao`, `/admin/conteudo` → **F3/S4, e é o item 3 do DoD**
- Onboarding do responsável (coleta cidade e um animal, e descarta os dois) → **sem card**
- Editores de perfil das 3 personas → ⛔ cortado da S3 em 16/09 → F6/S11 (T-019, DL-056)
- Agenda, contatos, avaliações, plano (nos painéis B2B) → fora do escopo dos 3 meses
- Busca da Home (não leva a lugar nenhum) → F4/S6
- ~~Onboarding de veterinário~~ ✅ 31/08 · ~~Onboarding de estabelecimento~~ ✅ **20/09**

---

## O QUE NÃO EXISTE AINDA

- **A validação pelo admin.** Nada no produto move alguém para `active` (**T-023 + T-024**)
- Rotas `/buscar`, `/veterinario/[slug]`, `/estabelecimento/[slug]`
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
