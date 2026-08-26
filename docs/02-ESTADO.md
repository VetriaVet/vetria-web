# 02 — ESTADO REAL DO PROJETO

> **Este é o primeiro arquivo que qualquer sessão ou agente lê.**
> Curto de propósito. Se passar de ~150 linhas, está virando log — o log é o `05-DECISOES.md`.
>
> **Última atualização:** 26/08/2026 (2ª auditoria da `0003`, aprovada) · **Fase:** F3 (S2 aberta) · **Commit base:** `7ce2518`

---

## AGORA

**Fase:** F3 — Núcleo de dados · **Semana:** 2 de 13 · **Entrega:** 25/11/2026

**Em execução:** nada. **6 cards na fila** em `03-TAREFAS.md`. A auditoria da `0003` abriu 4
cards em 26/08 e **os quatro fecharam no mesmo dia**; sobrou **T-013**, que é uma medição.

**A `0003` v2 está APROVADA e aguarda a sessão presencial. Nada dela está no banco ainda.**
Ela cria o bucket privado `documentos`, desce `razao_social`, `cnpj` e `responsavel_tecnico`
pra `perfil_privado` (fecha SEC-020 / R-018) e amarra a linha aos **bytes** do documento
(`documento_hash` + `documento_tamanho`). A v1 foi reprovada; a v2 fechou os quatro bloqueantes
com prova e cresceu de 810 pra **1598 linhas sem um único erro de SQL**. 6 achados novos,
nenhum bloqueante e nenhum de vazamento, em `docs/relatorios/SEC-2026-08-26-0003-v2.md`.

⚠️ **Precisa do Elber: a `T-002` é 🔴 e não anda sem sessão presencial.** Ela já escorregou uma
semana. Sem ela não há upload (T-008) e o item 3 do DoD da F3 fica sem documento pra abrir.
**Agende.**

**Os quatro passos que antecedem a aplicação** (detalhe e as consultas inteiras no card da
T-002): **(1)** três consultas de dez segundos no dashboard, **antes de agendar** — se o editor
mostra `select` dentro de transação revertida (T-013), se `storage.objects` e `storage.buckets`
têm RLS ligada, e se existe conta `clinic` **e** `vet` (sem as duas, cinco sondas se declaram
inválidas); **(2)** `md5(prosrc)` de `carimbar_envio_documento`, **lendo o corpo** contra
`0002_nucleo.sql:453-470`, e colar no pré-voo 1.7; **(3)** backup inteiro, com CSV exportados;
**(4)** colar a migration de uma vez e **ler a tabela de onze colunas** que ela devolve, toda
`true` e `copia_linhas = 0`. **Só então as sondas**, uma por vez, começando pela 4.

**O trabalho da semana, depois disso:** matar a casca dos onboardings profissionais. Hoje o
"Concluir" do veterinário e o do estabelecimento só marcam `onboarding_completed = true` e
**descartam tudo que a pessoa digitou**. Ninguém entra na fila de validação, porque `status`
continua `incomplete`. As tabelas, a RLS e `concluir_onboarding_profissional()` existem desde a
`0002`: falta o código chamar.

**Ordem da S2:** `T-013` (medir) → `T-002` (🔴 presencial, aplicar) → `T-006` → `T-007` →
`T-008`. **`T-003` (Playwright + CI) corre em paralelo desde o primeiro dia**, porque
`vetria-qa` só escreve em `tests/`.

**S1 entregou 5 de 6:** governança, baseline, migration `0002`, auditoria e o fix de layout dos
onboardings. **Escorregaram pra S2:** T-002 e T-003. **Saiu da S2:** onboarding do responsável
vai pra S3; foto e horários não entram (R-019). **Backup:** `supabase/backups/`, fora do repo.

---

## O QUE FUNCIONA DE VERDADE HOJE

| Área | Estado |
|---|---|
| **Auth** | ✅ Real. Email/senha + Google OAuth + confirmação + recuperação de senha, validados em produção (DL-039). |
| **Domínio e email** | ✅ Real. `vetriabrasil.com.br` na Vercel; Resend verificado; envio de `contato@vetriabrasil.com.br` (DL-039/040). |
| **RBAC** | 🟡 Parcial. Roteia por role e `requirePainel` guarda as páginas de painel — mas o `middleware.ts` não isola painel por role. **Ver R-001.** Matriz alvo definida em `docs/06-PERMISSOES.md` (DL-044 a DL-047). |
| **Telas** | ✅ ~45 telas no design system v2 (Inter + tokens `@theme` do Tailwind v4), estados honestos, sem dado fake. |
| **Admin** | 🟡 Painel dark completo; RBAC de usuários é real; validações/moderação/conteúdo são casca. |
| **Banco** | ✅ Núcleo aplicado (`0002`, 26/08). `profiles.status`, `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais`, `contatos`, `audit_logs`, com RLS codificando a matriz. **Tabelas vazias:** as telas ainda não escrevem nelas (F3/S2). |
| **Emails transacionais** | 🟡 3 do Supabase ativos; 3 do app versionados e desligados (esperam a F3). |
| **Testes** | ❌ Não existem. Playwright + CI entram na F3/S2. |

---

## O QUE É CASCA (tela existe, dado não)

Todas essas telas estão no ar, bonitas e navegáveis, mas **não persistem nada**:

- Onboarding de veterinário e de estabelecimento (multi-step) → F3/S2
- Onboarding do responsável (coleta cidade e um animal, e descarta os dois) → F3/S3
- Editores de perfil das 3 personas → F3/S3
- `/admin/validacoes`, `/admin/moderacao`, `/admin/conteudo` → F3/S4
- Agenda, contatos, avaliações, plano (nos painéis B2B) → fora do escopo dos 3 meses
- Busca da Home (não leva a lugar nenhum) → F4/S6

---

## O QUE NÃO EXISTE AINDA

- Bucket de documentos no Storage (T-002)
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
| Auth + DB + Storage | Supabase | |
| Email | Resend como SMTP do Supabase | |
| Hospedagem | Vercel, deploy em push na `main` | |
| Ícones | `lucide-react` | |
| Testes | Playwright + GitHub Actions | **a instalar — F3/S2** |
| Pagamento | Stripe | **fora do escopo dos 3 meses** |

---

## MAPA DE ROTAS (real, hoje)

```
PÚBLICO
  /                              Home do consumidor (busca ainda não funciona)
  /login  /cadastro  /cadastro/{responsavel,veterinario,estabelecimento}
  /recuperar-senha  /recuperar-senha/nova
  /auth/callback
  /roadmap  /entrega-fase-2      (noindex, docs vivos)

RESPONSÁVEL (role tutor)  — chrome: header
  /app/responsavel  /onboarding  /perfil  /historico  /avaliacoes

VETERINÁRIO (role vet)  — chrome: sidebar, route group (painel)
  /app/veterinario/onboarding
  /app/veterinario  /agenda /aguardando /ajuda /avaliacoes /configuracoes
                    /contatos /perfil /plano

ESTABELECIMENTO (role clinic) — chrome: sidebar, route group (painel)
  /app/estabelecimento/onboarding
  /app/estabelecimento  /agenda /aguardando /ajuda /avaliacoes /configuracoes
                        /contatos /equipe /perfil /plano

ADMIN (role admin)  — chrome: dark
  /admin  /usuarios  /validacoes  /moderacao  /conteudo

API
  /api/admin/profiles  /api/admin/set-access  /api/onboarding/set-role
```

> ⚠️ **Atenção à nomenclatura.** As **rotas** são em português
> (`responsavel`/`veterinario`/`estabelecimento`), mas os **valores de role no banco**
> continuam `tutor`/`vet`/`clinic`. Trocar isso agora quebraria o banco em produção.
> Renomeação feita no commit `b815ca5`.

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

---

## ARQUIVOS HISTÓRICOS (leitura só quando precisar de contexto antigo)

**Congelados, não escreva neles.** `CONTEXT.md` (DL-001 a DL-040) · `BACKLOG.md` (TASK-001 a
039, fase visual) · `DEMO.md` (roteiro de apresentação) · `../VETRIA_PROJETO.md`, documento mãe
de abril, **desatualizado** (fala de Poppins/Cormorant, revertidos em DL-032) mas ainda válido
pelo mapa de telas e pelos backlogs V2/V3.
