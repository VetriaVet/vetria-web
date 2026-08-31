# 02 — ESTADO REAL DO PROJETO

> **Este é o primeiro arquivo que qualquer sessão ou agente lê.**
> Curto de propósito. Se passar de ~150 linhas, está virando log — o log é o `05-DECISOES.md`.
>
> **Última atualização:** 31/08/2026 (5 cards fechados, PR #1 no ar) · **Fase:** F3 (S2) · **Commit base:** `423a823` na `main`

---

## AGORA

**Fase:** F3 — Núcleo de dados · **Semana:** 2 de 13 · **Entrega:** 25/11/2026

**Em execução:** nada. **31/08 fechou 5 cards, e o PR #1 foi MERGEADO E ESTÁ NO AR**
(`423a823`, `22cc5cc..423a823`).

🎉 **Marco: o produto guardou dado de um profissional de verdade pela primeira vez.** Até 31/08 as
~45 telas eram casca. Agora o "Concluir" do onboarding do veterinário grava os 13 campos em
`vet_profiles`, o WhatsApp em `perfil_privado`, e o profissional **entra na fila de validação**.
É o **item 1 do DoD da F3**, fechado e em produção.

**O que fechou em 31/08, uma linha cada** (o detalhe está no Resultado de cada card):

| Card | |
|---|---|
| **T-006** | O onboarding do vet persiste. Prova na preview com `select` real: `status` virou `pending_validation`, 13 campos gravados, `whatsapp` em `perfil_privado`, `slug` nulo |
| **T-003** | Playwright + CI, 13 testes verdes no CI. ⚠️ **Único item aberto do card:** conferir se os 2 testes de login rodaram ou pularam (Actions → job → caixa `Search logs` → digitar `passed`) |
| **T-013** | O `42` apareceu no SQL Editor. **R-026 caiu** |
| **T-014** | Lint de 17 problemas para **0**, e o passo passou a **bloquear** no CI |
| **T-015** | As rotas de admin pararam de devolver stack trace. **R-037 fechado no mesmo dia** |

**Sobra na S2:** **T-007** (onboarding do estabelecimento) e **T-008** (upload do documento).
⚠️ **A T-007 não começa antes do R-034:** a auditoria da T-006 existia só nos comentários do
código e foi **reconstruída, não refeita** — e é esse `actions.ts` que a T-007 vai clonar.

**Três achados novos, todos 🟡 e nenhum bloqueante:** **R-034** (auditoria reconstruída; SEC-053 e
SEC-055 continuam sem dono), **R-035** (o arquivo de verificação afirmava uma medição que ninguém
tinha feito), **R-036** (o onboarding aprova perfil sem canal de contato e com cidade e UF que não
combinam).

⚠️ **Armadilha que vai se repetir na T-007:** a confirmação de email do Supabase é montada a
partir do **Site URL**, então ela **sempre** joga a pessoa em produção. Para testar onboarding em
preview: **confirme em produção e depois LOGUE na preview.** Login não passa por email.

**Antes disso, em 26/08:** a **`0003` foi aplicada em produção** e verificada por 18 sondas, todas
verdes (`a68251d`). Fechou a **T-002**: bucket privado `documentos` (10 MiB, quatro MIME, **zero
policy**), as três colunas de identificação do estabelecimento saíram de `clinic_profiles` para
`perfil_privado`, e a linha passou a guardar a identidade dos **bytes** do documento. Detalhe no
card da T-002 e em **DL-051 a DL-054**; os `md5` que a `0004` vai precisar estão em
`supabase/migrations/README.md`.

⚠️ **Duas perguntas de produto sem dono, e as duas vencem antes do perfil público da F4/S7**
(R-032): endereço e CEP de MEI são vitrine ou dado pessoal, já que em quem atende em casa eles são
o endereço residencial? E por que o estabelecimento que muda de cidade volta para a fila de
validação e o veterinário não? Hoje as duas estão escritas no banco, em `comment on column`, como
pergunta em aberto.

**S1 entregou 5 de 6.** As duas que escorregaram, T-002 e T-003, fecharam. **Saiu da S2:**
onboarding do responsável vai pra S3; foto e horários não entram (R-019).
**Backup:** `supabase/backups/`, fora do repo.

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
| **Testes** | 🟡 **Commitados em 31/08** (`82f59bb`, em branch) e **rodando verde no CI** (execução #2, 1m20s, com os 4 secrets no lugar). Playwright + GitHub Actions (T-003): **13 testes** cobrindo as portas trancadas do `middleware.ts`, as telas públicas, o `noindex` do `/roadmap` e a regra de copy do DL-038, **mais 2 de login** cujo estado (rodaram ou pularam) ainda não foi conferido. ✅ **O lint passou a BLOQUEAR em 31/08** (T-014): `npm run lint` sai com 0 erro e 0 aviso. ⚠️ **A persistência do onboarding continua sem teste** (R-033): a prova da T-006 foi manual. |

---

## O QUE É CASCA (tela existe, dado não)

Todas essas telas estão no ar, bonitas e navegáveis, mas **não persistem nada**:

- Onboarding de **estabelecimento** (multi-step) → F3/S2 (T-007)
- ~~Onboarding de **veterinário**~~ ✅ **deixou de ser casca em 31/08** (T-006, em produção)
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
