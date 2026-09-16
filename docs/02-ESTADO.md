# 02 — ESTADO REAL DO PROJETO

> **Este é o primeiro arquivo que qualquer sessão ou agente lê.**
> Curto de propósito. Se passar de ~150 linhas, está virando log — o log é o `05-DECISOES.md`.
>
> **Última atualização:** 16/09/2026 (**o corte foi acionado**; **T-016 escrita e em revisão**; ordem de deploy decidida em DL-057; `/ajuda` entrou na matriz §4 em DL-058; R-054 aberto) · **Fase:** F3 (S3) · **Commit base:** `451b2e4` na `main`

---

## AGORA

**Fase:** F3 — Núcleo de dados · **Semana:** **S3 (3 de 13), aberta em 09/09** · **Entrega:** 25/11/2026

**Em execução:** **T-016**, escrita na árvore e **em revisão de segurança**. **Fila da S3, e é só
ela:** **T-007** (aprovada, 3 travas do Elber) · **T-008** (⚠️ **não começou, e é o caminho
crítico**) · **T-016**, com **T-017 🔴 esperando sessão presencial com o Elber** e a T-003 em
paralelo. **Os editores de perfil saíram da S3** — ver o corte abaixo.

✅ **15/09 — a T-007 foi REVISADA E APROVADA.** A segunda revisão independente do clone saiu
(`docs/relatorios/SEC-2026-09-15-T007-revisao-do-clone.md`) e o veredito é **merge sem correção
obrigatória: 🔴 0 · 🟠 0 · 🟡 3**. Os três 🟡 viraram **R-050, R-051 e R-052**, e **nenhum é
conserto desta task**. **Das cinco travas do card, duas caíram** — a revisão de segurança e o
**R-048**, medido no mesmo dia: a deleção da sonda **não está na árvore**,
`supabase/verificar-apos-0003.sql` está intocado desde `a68251d`, com 945 linhas e a sonda de
`pg_trigger` nas linhas 672-685. **As três que sobram são todas do Elber:** aprovar o diff, medir o
**R-047** (é um `select`, e ainda não foi medido) e a prova de persistência com conta de
estabelecimento nova. **O código continua na árvore de trabalho, sem commit.**

⚠️ **Um dos três achados é sobre este quadro, não sobre o código (R-050):** o handoff da T-007
descrevia errado para onde vai o estabelecimento que concluiu. Ele **não** volta ao formulário: vai
pro **painel**, que não lê `profiles.status`. Corrigido nos cards em 15/09 — **é a lacuna que a
T-016 fecha, não um detalhe de navegação.** Doc que mente dimensiona task errado, e é o R-034 de
novo.

⚠️ **O CI está verde sem a cobertura que mais importa (R-053).** Medido em 15/09: são **15 testes**;
**13 rodaram verdes e os 2 de login PULARAM**. Os 4 secrets estão **declarados** no workflow
(`ci.yml:34-37`), mas `E2E_VET_EMAIL` e `E2E_VET_SENHA` chegam vazios e **o pré-voo não guarda
isso** — então sessão real, cookie real e `middleware.ts` real não são exercitados por ninguém.
Fecha o item que estava aberto na T-003 desde 31/08. **O conserto do `ci.yml` corre em paralelo,
fora desta passagem de docs.**

⚠️ **Restam 6 dias até o fim da F3 (22/09), e o que está previsto para eles não cabe:** a dívida da
S2 (T-007, T-008), a S3 inteira do plano e a S4 inteira. Eram 13 dias em 09/09 e a conta não
encolheu: **entre 01/09 e 08/09 não houve um único commit**, os quatro de 09/09 são **todos de
doc**, e **o último commit da `main` continua sendo `451b2e4`, de 09/09**. **A última linha de
código commitada é de 31/08** (`61e29c7`, T-015). O buffer da S13 continua intacto.
⛔ **16/09 — O CORTE FOI ACIONADO, pelo Elber** (**DL-056**). *"Se em 15/09 a T-008 não estiver
fechada, os editores de perfil da S3 escorregam para a F6/S11"*: **a T-008 não começou**, a condição
foi atingida, e os editores das 3 personas viraram o card **T-019**, na F6/S11. **Não é corte de
escopo contratado** — o `00-ESCOPO.md` §2 não cita editor de perfil, nenhum item do DoD da F3
depende dele, e **não há emenda a fazer**. **Os 6 dias que restam são de T-007, T-008 e T-016**, que
são os itens 1, 2 e 3 do DoD. ⚠️ **O corte não salva a F3:** a T-008 continua sendo o único item da
fase sem uma linha escrita.

🆕 **16/09 — a T-016 foi ESCRITA na árvore** (3 arquivos novos, 24 modificados, build e lint verdes,
**nada commitado**) e está **em revisão pelo `vetria-seguranca` agora**. Três decisões saíram dela:
**DL-057** — T-007 e T-016 **sobem juntas, no mesmo push**, e isso **dispensa o `update` 🔴 do
R-047** (a T-016 conserta o órfão sozinha); ⛔ trava em **18/09**, e a **T-016 sozinha antes da
T-007 é proibida** (vira laço de redirect). **A medição do R-047 continua valendo** e continua sendo
do Elber. **DL-058** — `/ajuda` passou a alcançar `pending_validation` na matriz §4; o código muda
depois da revisão. **R-054** — `/admin/usuarios` renderiza para admin comum contra a matriz §2; **não
vaza dado**, não ganha card nesta fase, entra na abertura da S4.

🎉 **Marco, de 31/08: o produto guardou dado de um profissional de verdade pela primeira vez.** O
"Concluir" do onboarding do veterinário grava os 13 campos em `vet_profiles`, o WhatsApp em
`perfil_privado`, e o profissional **entra na fila de validação** — **item 1 do DoD da F3**, em
produção (PR #1, `423a823`). **Para `clinic` ainda não é verdade: depende da T-007.** Fecharam
junto **T-003** (Playwright + CI), **T-013**, **T-014** (lint bloqueia) e **T-015** (as rotas de
admin pararam de devolver stack trace).

**Em 09/09:** a S3 abriu, a **T-007 foi liberada** (o R-034 fechou por cobertura), nasceram a
**T-016** (R-038, o portão de status da matriz §4 **não existe em lugar nenhum do código**) e a
**T-017** (R-039, constraints de conteúdo; **é migration, logo 🔴 — agende**), e a **T-008 deixou de
ter pergunta em aberto**: ordem **7 → 8**, compensação na própria rota e varredura de órfãos por
`select`. Nasceu a **T-018** (F6/S11), onde o **R-023** finalmente tem card. **Nada disso é código
ainda.**

**Riscos vivos que valem a leitura:** **R-047** (contas `clinic` órfãs — a medição continua sendo do
Elber, mesmo depois do DL-057), **R-035**, **R-036**, **R-032**, os quatro de 15/09 (**R-050 a
R-053**) e o novo **R-054**.

⚠️ **Armadilha que vai se repetir na T-007:** a confirmação de email do Supabase é montada a partir
do **Site URL**, então ela **sempre** joga a pessoa em produção. Para testar onboarding em preview:
**confirme em produção e depois LOGUE na preview.** Login não passa por email.

**Antes disso, em 26/08:** a **`0003` foi aplicada em produção** e verificada por 18 sondas, todas
verdes (`a68251d`), fechando a **T-002**: bucket privado `documentos` (10 MiB, quatro MIME, **zero
policy**), as três colunas de identificação do estabelecimento saíram de `clinic_profiles` para
`perfil_privado`, e a linha passou a guardar a identidade dos **bytes** do documento. Detalhe no
card da T-002 e em **DL-051 a DL-054**; os `md5` que a `0004` vai precisar estão em
`supabase/migrations/README.md`. **Backup:** `supabase/backups/`, fora do repo.

⚠️ **Duas perguntas de produto sem dono vencem antes do perfil público da F4/S7** (**R-032**):
endereço e CEP de MEI são vitrine ou dado pessoal? E por que o estabelecimento que muda de cidade
volta para a fila de validação e o veterinário não?

---

## O QUE FUNCIONA DE VERDADE HOJE

| Área | Estado |
|---|---|
| **Auth** | ✅ Real. Email/senha + Google OAuth + confirmação + recuperação de senha, validados em produção (DL-039). |
| **Domínio e email** | ✅ Real. `vetriabrasil.com.br` na Vercel; Resend verificado; envio de `contato@vetriabrasil.com.br` (DL-039/040). |
| **RBAC** | 🟡 Parcial. Roteia por role e `requirePainel` guarda as páginas de painel — mas o `middleware.ts` não isola painel por role. **Ver R-001.** Matriz alvo definida em `docs/06-PERMISSOES.md` (DL-044 a DL-047). |
| **Telas** | ✅ ~45 telas no design system v2 (Inter + tokens `@theme` do Tailwind v4), estados honestos, sem dado fake. |
| **Admin** | 🟡 Painel dark completo; RBAC de usuários é real; validações/moderação/conteúdo são casca. As 3 rotas de `/api/*` devolvem só mensagem em erro de servidor (T-015, R-037 fechado). |
| **Banco** | ✅ Núcleo (`0002`) + storage e privacidade (`0003`), as duas aplicadas em 26/08. `profiles.status`, `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais`, `contatos`, `audit_logs`, com RLS codificando a matriz. Identificação do estabelecimento (`cnpj`, `razao_social`, `responsavel_tecnico`) e identidade dos bytes do documento (`documento_hash`, `documento_tamanho`) vivem em `perfil_privado`. **`vet_profiles` e `perfil_privado` deixaram de estar vazias em 31/08**, na prova da T-006 (1 linha, conta de teste). As demais continuam vazias. |
| **Storage** | 🟡 Bucket privado `documentos` existe (10 MiB; pdf/jpeg/png/webp; **zero policy**, só `service_role` alcança). **Está vazio:** falta a rota que sobe o arquivo (T-008). |
| **Emails transacionais** | 🟡 3 do Supabase ativos; 3 do app versionados e desligados (esperam a F3). |
| **Testes** | 🟡 Playwright + GitHub Actions (T-003), na `main` desde o PR #1 e rodando em todo push. **São 15 testes, e é o que foi MEDIDO em 15/09: 13 rodaram verdes e os 2 de login PULARAM.** Os 13 cobrem as portas trancadas do `middleware.ts`, as telas públicas, o `noindex` do `/roadmap` e a regra de copy do DL-038. ⚠️ **Os 4 secrets estão DECLARADOS no workflow (`ci.yml:34-37`), mas os dois de credencial de teste chegam vazios, e o pré-voo não guarda isso** (**R-053**): sem eles a suíte fica verde sem exercitar sessão real. ✅ **O lint passou a BLOQUEAR em 31/08** (T-014): 0 erro, 0 aviso. ⚠️ **A persistência do onboarding continua sem teste** (R-033): a prova da T-006 foi manual. |

---

## O QUE É CASCA (tela existe, dado não)

Todas essas telas estão no ar, bonitas e navegáveis, mas **não persistem nada**:

- Onboarding de **estabelecimento** (multi-step) → F3/S2 (T-007)
- ~~Onboarding de **veterinário**~~ ✅ **deixou de ser casca em 31/08** (T-006, em produção)
- Onboarding do responsável (coleta cidade e um animal, e descarta os dois) → F3/S3
- Editores de perfil das 3 personas → ⛔ **cortado da S3 em 16/09 → F6/S11** (T-019, DL-056)
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

---

## STACK

| Camada | Escolha | Nota |
|---|---|---|
| Framework | Next.js 16 (App Router) | React 19.2 |
| Estilo | Tailwind v4 via `@theme inline` em `app/globals.css` | Sem `tailwind.config` |
| Fonte | Inter, única (DL-032) | Serif foi tentada e revertida |
| Auth + DB + Storage | Supabase | Resend como SMTP; ícones `lucide-react` |
| Hospedagem | Vercel, deploy em push na `main` | |
| Testes | Playwright + GitHub Actions | 🟡 15 testes: 13 verdes no CI, 2 de login pulando por credencial ausente (T-003, R-053) |
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
