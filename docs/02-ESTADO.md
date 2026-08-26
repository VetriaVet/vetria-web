# 02 — ESTADO REAL DO PROJETO

> **Este é o primeiro arquivo que qualquer sessão ou agente lê.**
> Curto de propósito. Se passar de ~150 linhas, está virando log — o log é o `05-DECISOES.md`.
>
> **Última atualização:** 26/08/2026 (auditoria da `0003`) · **Fase:** F3 (S2 aberta) · **Commit base:** `2138fe1`

---

## AGORA

**Fase:** F3 — Núcleo de dados · **Semana:** 2 de 13 · **Entrega:** 25/11/2026

**Em execução:** nada. A **S2 foi aberta em 26/08/2026** com 5 cards, e a auditoria da `0003`
acrescentou mais 4 no mesmo dia: **9 cards** em `03-TAREFAS.md`.

**A `0003` existe em arquivo, foi auditada e foi REPROVADA.** Ela cria o bucket privado
`documentos` e desce `razao_social`, `cnpj` e `responsavel_tecnico` pra `perfil_privado` (fecha
SEC-020 / R-018). **Nada disso está no banco.** O SQL de dado está certo — ordem, cópia,
dependência e reversão percorridas contra o schema real. O que reprova são **salvaguardas que
não fazem o que o comentário diz que fazem**: um pré-voo que declara provar "zero policy" e não
vê a policy que alcança tudo, e a sonda mais importante entregando o veredito por um canal que
o editor não mostra. 13 achados em `docs/relatorios/SEC-2026-08-26-0003.md`. **T-009 a T-012
são os bloqueantes**, e nenhum pede reescrita.

**O trabalho da semana:** matar a casca dos onboardings profissionais. Hoje o "Concluir"
do veterinário e o do estabelecimento só marcam `onboarding_completed = true` e **descartam
tudo que a pessoa digitou**. Ninguém entra na fila de validação, porque `status` continua
`incomplete`. As tabelas (`vet_profiles`, `clinic_profiles`, `perfil_privado`), a RLS e a
função `concluir_onboarding_profissional()` já existem desde a `0002`: falta o código chamar.

**Ordem da S2:** `T-010`/`T-011` (correção da `0003`) e `T-009`/`T-012` (decisões, antes de o
bucket existir) → `T-002` (🔴 presencial, aplicar) → `T-006` (vet persiste) → `T-007`
(estabelecimento persiste) → `T-008` (upload). **`T-003` (Playwright + CI) corre em paralelo
desde o primeiro dia**, porque `vetria-qa` só escreve em `tests/`.

⚠️ **Precisa do Elber:** a `T-002` é 🔴 e **não anda sem sessão presencial**. Ela já escorregou
uma semana. Sem ela não há upload (T-008) e o item 3 do DoD da F3 fica sem documento pra abrir.
**Agende.**

⚠️ **Duas consultas de 10 segundos, no dashboard, ANTES de agendar.** Elas decidem se dois dos
quatro bloqueantes existem de fato:
1. `select policyname, cmd, roles, qual, with_check from pg_policies where schemaname='storage' and tablename='objects';` — **tem que vir vazio.** Se vier linha sem filtro de `bucket_id`, a migration não roda.
2. `do $$ begin raise notice 'teste de notice'; end $$;` — se o texto não aparecer no editor, a Sonda 10 é cega.

**S1 entregou 5 de 6:** governança, baseline, migration `0002`, auditoria (4 rodadas) e o fix
de layout dos onboardings. **Escorregaram pra S2:** T-002 e T-003. **Saiu da S2 por decisão do
maestro:** onboarding do responsável vai pra S3, e foto de perfil e horários não entram (R-019).
**Backup pré-migration:** `supabase/backups/`, fora do versionamento.

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
