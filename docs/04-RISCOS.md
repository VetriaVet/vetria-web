# 04 — RISCOS, BUGS E DÍVIDAS

> Tudo que sabemos que está errado, pode dar errado, ou vai dar errado depois.
> Alimentado pelos agentes `vetria-seguranca`, `vetria-qa` e `vetria-ui`.
>
> **Gravidade:** 🔴 crítico (para a fila) · 🟠 alto (entra na semana) · 🟡 médio (entra na fase) · ⚪ baixo (backlog)

---

## 🔴 ABERTOS — CRÍTICOS

### R-001 — `middleware.ts` não isola painel por role
- **Descoberto:** 26/08/2026, na auditoria de abertura
- **Onde:** `middleware.ts:36-52`
- **O quê:** o middleware só checa duas coisas: se `/app` ou `/admin` exige login, e se `/admin` exige `role === "admin"`. **Não há nenhuma checagem de role entre os painéis.** Um usuário com role `tutor`, logado, que digite `/app/veterinario/perfil` passa pelo middleware.
- **O que segura hoje:** `lib/auth/painel.ts` (`requirePainel`) faz o guard página a página no route group `(painel)`. Funciona — mas é defesa em profundidade dependendo de o desenvolvedor lembrar de chamar em toda página nova. Uma página esquecida = vazamento.
- **Por que importa mais a partir de agora:** hoje as telas são casca e não mostram dado de ninguém. A partir da F3 elas mostram CRMV, CNPJ e documento. O custo do furo muda de categoria.
- **Contradiz:** `VETRIA_PROJETO.md` §3 — "multi-persona com isolamento total, sem acesso cruzado".
- **Corrige em:** F3 / S3 (reescrita do middleware)
- **Task:** a criar na S3

### R-002 — Role `master` é barrado do próprio `/admin`
- **Descoberto:** 26/08/2026
- **Onde:** `middleware.ts:45` — `if (!profile || profile.role !== "admin")`
- **O quê:** a documentação descreve 5 roles, sendo `master` uma delas, e `app/app/layout.tsx` tem entrada de nav pra `master`. Mas o middleware só aceita literalmente `"admin"`. Se existir alguém com `role = 'master'` no banco, esse alguém é redirecionado pra `/app` ao tentar entrar no admin, e no `/app` cai no fallback.
- **Causa provável:** ambiguidade real no modelo — o `CONTEXT.md` §4.1 trata master ora como role, ora como `admin_level`. **Isso precisa ser decidido, não remendado.**
- **Corrige em:** F3 / S3, junto com R-001, e a decisão vai pro `05-DECISOES.md`

---

## 🟠 ABERTOS — ALTOS

### R-003 — Zero testes automatizados em código que já está em produção
- **O quê:** ~45 telas, auth real, RBAC, e nenhuma verificação automática. Nas próximas 12 semanas o banco inteiro entra por baixo dessas telas.
- **Corrige em:** F3 / S1 — T-003

### R-004 — `dangerouslyAllowSVG: true` no `next.config.ts`
- **O quê:** necessário pra logo SVG renderizar via `next/image` (DL-040). Está mitigado por CSP sandbox. Vira risco real se algum dia entrar SVG enviado por usuário (foto de perfil, documento).
- **Regra:** **nunca** servir SVG de origem de usuário por `next/image`. Upload de imagem de usuário aceita só raster (jpg/png/webp).
- **Corrige em:** F3 / S2, como validação de MIME no upload

### R-005 — Duplicação `is_master_admin` / `is_admin_master`
- **Herdado de:** DL-014/015 (a versão `SECURITY INVOKER` causou recursão infinita de RLS)
- **O quê:** duas funções com o mesmo propósito vivem no banco, criadas fora do repo. Nenhuma está versionada em `supabase/migrations/`.
- **Por que importa:** a T-001 vai escrever policies novas. Se apoiarem na função errada, o bug de recursão volta.
- **Corrige em:** F3 / S1, dentro da T-001 (consolidar e versionar)

### R-006 — Toda a estrutura do banco vive fora do repo
- **O quê:** só a migration `0001` está versionada. `profiles`, as funções de admin, os triggers e as policies existentes foram criados direto no dashboard do Supabase.
- **Consequência:** não existe forma de recriar o ambiente do zero, nem de revisar o que está em produção lendo o repo.
- **Corrige em:** F3 / S1 — dump do schema atual versionado como `0000_baseline.sql` antes da `0002`

---

## 🟡 ABERTOS — MÉDIOS

### R-007 — `NEXT_PUBLIC_SITE_URL` não setada na Vercel
- Herdado de DL-039/040. Canonical `www` × apex não padronizado. Vira problema de SEO quando os perfis públicos forem indexáveis (F4/S7).

### R-008 — Documentação fragmentada e contraditória
- `VETRIA_PROJETO.md` (raiz do Desktop) fala de Poppins + Cormorant, revertidos em DL-032. Diz que "Supabase será refeito", o que não aconteceu.
- **Mitigação:** `02-ESTADO.md` é agora a única fonte de verdade sobre estado. Os arquivos antigos estão marcados como históricos.

### R-009 — Aquecimento de domínio de email
- Emails caem em spam no começo (DL-039). Piora na F3/S4, quando aprovação e reprovação passam a disparar email de verdade.
- **Mitigação:** DMARC único, marcar "não é spam", monitorar taxa de entrega no Resend.

### R-010 — `.claude/settings.local.json` com ~90 permissões de commit hardcoded
- Cada mensagem de commit virou uma permissão literal. Não escala e polui. Simplificar pra padrões amplos quando incomodar.

---

## ⚪ RISCOS DE PROJETO (não são bugs)

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| **Deriva de escopo** — "já que estamos aqui, vamos fazer avaliações também" | Alta | Fatal pro prazo | `00-ESCOPO.md` congelado + regra de capacidade obrigatória no card + emenda com "o que sai em troca" |
| **T-001 escorregar** | Média | Alto — bloqueia 12 semanas | É 🔴 presencial. Agendar a sessão na S1, não na S2. |
| **Perda de contexto entre sessões** | Alta | Médio | `02-ESTADO.md` + protocolo de handoff obrigatório em toda task |
| **Migration destruir dado de produção** | Baixa | Fatal | Backup obrigatório antes; migration aditiva; revisão de segurança antes de aplicar |
| **Esteticismo comendo a funcionalidade** | Média | Alto | `vetria-ui` reporta, mas polimento visual só entra na fila depois do DoD da fase |

---

## 💡 IDEIAS FORA DE ESCOPO (não fazer agora — mês 4+)

> Aqui mora tudo que é boa ideia mas não foi contratado pras 13 semanas.
> Registrar aqui é o que permite dizer "não" sem perder a ideia.

- _(vazio — anotar aqui quando surgir)_

---

## ✅ FECHADOS

_(vazio)_
