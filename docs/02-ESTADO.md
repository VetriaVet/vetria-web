# 02 — ESTADO REAL DO PROJETO

> **Este é o primeiro arquivo que qualquer sessão ou agente lê.**
> Curto de propósito. Se passar de ~150 linhas, está virando log — o log é o `05-DECISOES.md`.
>
> **Última atualização:** 31/08/2026 (T-006 e T-013 fechadas) · **Fase:** F3 (S2) · **Commit base:** branch `f3-s2/onboarding-vet-e-ci`, PR #1 aberto e **não mergeado**

---

## AGORA

**Fase:** F3 — Núcleo de dados · **Semana:** 2 de 13 · **Entrega:** 25/11/2026

**Em execução:** nada. ✅ **A T-006 FECHOU em 31/08** — a prova de persistência foi feita na
preview, com `select` real: `status` virou `pending_validation`, os 13 campos gravaram, o
`whatsapp` foi pra `perfil_privado` e o `slug` ficou nulo. ✅ **A T-013 fechou junto** (o `42`
apareceu). **A T-003 está verde no CI** (execução #2, 1m20s) e só não fechou porque falta
confirmar se os 2 testes de login rodaram ou continuaram pulados.

⚠️ **A T-014 fechou em 31/08:** os 17 problemas de lint foram zerados e o passo passou a
bloquear no CI. Ela produziu o **R-037**, que é o achado mais sério em aberto hoje: as duas rotas
de admin devolvem **stack trace do servidor**, e a de POST faz isso **sem autenticação nenhuma**
(o `try` abre antes da checagem de sessão, e a primeira linha dentro dele é `req.json()`). Não é
credencial nem furo de RLS, mas é reconhecimento de graça na rota de maior privilégio. **Não foi
consertado de propósito:** o card da T-014 é de tipo, não de comportamento.

⚠️ **Sobrou uma coisa esperando o Elber: o MERGE.** **Produção ainda roda o código antigo do
onboarding**, que descarta os 4 passos. Enquanto o PR #1 não entrar na `main`, o item 1 do DoD da
F3 está resolvido na branch e aberto no produto.

**Como testar onboarding em preview, porque isso vai se repetir na T-007:** a confirmação de
email do Supabase é montada a partir do **Site URL**, então ela **sempre** joga a pessoa em
produção. O caminho que funciona é **confirmar em produção e depois LOGAR na preview** — login
não passa por email.

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

**Ordem da S2:** ~~T-006~~ ✅ → **T-007 → T-008**. ~~T-013~~ ✅ ~~T-014~~ ✅. **T-003 verde,
falta confirmar os 2 testes de login.** **Sobra na fila: T-007 e T-008.**
⚠️ **A T-007 não deve começar antes do R-034** (revisão independente do `actions.ts` que ela vai
clonar) e herda o **R-036** (perfil aprovado sem canal de contato e sem coerência cidade/UF).

⚠️ **Duas perguntas de produto sem dono, e as duas vencem antes do perfil público da F4/S7**
(R-032): endereço e CEP de MEI são vitrine ou dado pessoal, já que em quem atende em casa eles são
o endereço residencial? E por que o estabelecimento que muda de cidade volta para a fila de
validação e o veterinário não? Hoje as duas estão escritas no banco, em `comment on column`, como
pergunta em aberto.

**S1 entregou 5 de 6:** governança, baseline, migration `0002`, auditoria e o fix de layout dos
onboardings. **Escorregaram pra S2:** T-002 e T-003 — **as duas fecharam**, a T-002 em 26/08 e a
T-003 em 31/08 (falta só confirmar os 2 testes de login). **Saiu da S2:** onboarding do responsável vai pra S3; foto e horários não entram (R-019).
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
| **Banco** | ✅ Núcleo (`0002`) + storage e privacidade (`0003`), as duas aplicadas em 26/08. `profiles.status`, `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais`, `contatos`, `audit_logs`, com RLS codificando a matriz. Identificação do estabelecimento (`cnpj`, `razao_social`, `responsavel_tecnico`) e identidade dos bytes do documento (`documento_hash`, `documento_tamanho`) vivem em `perfil_privado`. **`vet_profiles` e `perfil_privado` deixaram de estar vazias em 31/08**, na prova da T-006 (1 linha, conta de teste). As demais continuam vazias. |
| **Storage** | 🟡 Bucket privado `documentos` existe (10 MiB; pdf/jpeg/png/webp; **zero policy**, só `service_role` alcança). **Está vazio:** falta a rota que sobe o arquivo (T-008). |
| **Emails transacionais** | 🟡 3 do Supabase ativos; 3 do app versionados e desligados (esperam a F3). |
| **Testes** | 🟡 **Commitados em 31/08** (`82f59bb`, em branch) e **rodando verde no CI** (execução #2, 1m20s, com os 4 secrets no lugar). Playwright + GitHub Actions (T-003): **13 testes** cobrindo as portas trancadas do `middleware.ts`, as telas públicas, o `noindex` do `/roadmap` e a regra de copy do DL-038, **mais 2 de login** cujo estado (rodaram ou pularam) ainda não foi conferido. ✅ **O lint passou a BLOQUEAR em 31/08** (T-014): `npm run lint` sai com 0 erro e 0 aviso. ⚠️ **A persistência do onboarding continua sem teste** (R-033): a prova da T-006 foi manual. |

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
