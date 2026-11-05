# 02 — ESTADO REAL DO PROJETO

> **Este é o primeiro arquivo que qualquer sessão ou agente lê.**
> Curto de propósito. Se passar de ~150 linhas, está virando log: o log é o `05-DECISOES.md`.
>
> **Última atualização:** 04/11/2026, terça à noite (`vetria-escriba`, fechamento do dia: PRs #21 e #23 a #36, DL-076 a DL-079) ·
> **Fase:** **F4 (fechamento) com F5 e F6 comprimidas** · **Último commit na `main`:** `0ab4199` (PR #35, 04/11).
> **Tudo entra por PR com merge automático** (CI obrigatório na `main`; `git push` direto é recusado).

---

## AGORA

**Fase:** **F4 por fechar** · **Semana:** **2 de 4 até a entrega (04/11 a 10/11)** · **Entrega:** 25/11/2026 (faltam 21 dias)
· **Andamento estimado: ~78%** do contratado (E1 a E5 de pé; faltam o portão, a LGPD e a E6).

✅ **O contato existe de ponta a ponta, e está desligado em produção de propósito.** A `0006` foi **aplicada em
produção em 04/11** (sessão B, por `npm run banco`: 27/27 `true`, sonda 1 8/8, sonda 2 69/69, sonda 3 zero, sonda 4
OK, nada sobrou). Rota, botão, "Contatos recebidos", "Seus contatos" e o vínculo na criação de conta estão na `main`.
No `vetria-e2e` a jornada inteira roda no CI: cadastro do vet, onboarding com WhatsApp, fila, aprovação, busca, perfil,
número revelado, limite real de 5 visitas (T-043). Em produção a rota responde 503 e o perfil diz "abre em breve"
até `CONTATO_PELO_SITE_ABERTO` **e** `TURNSTILE_NO_CONTATO` virarem `true`.

🔒 **Revisão de segurança completa em 04/11** (`docs/relatorios/SEC-2026-11-04.md`): sem 🔴. Corrigido no mesmo dia:
Next 16.1.5 para 16.4.5 (RCE no otimizador de imagem, bypass de middleware, SSRF; `npm audit --omit=dev` = 0),
`set-access` com lista fechada e trilha, CSRF nas 5 rotas de sessão, limite de 5 envios de documento por hora,
travas do `npm run banco`, CI só leitura. **Abertos e com card:** B-1 🟠 (T-056), lote 🟡 de banco (T-059), SEC-138
restante (T-062), decisões do Elber (T-058).

⚠️ **R-079: o `vetria-e2e` divergia de produção** (faltava a FK `profiles_id_fkey`). A `0007` cria a FK onde falta e
`supabase/paridade-schema.sql` compara os dois bancos. **`0007` aplicada no `vetria-e2e` em 04/11 (7/7, idempotente);
em produção, não** (lá a FK já existe, será no-op; precisa do "pode aplicar" do Elber, DL-076).

✅ **Autorizações do Elber em 04/11 (DL-076):** migration no `vetria-e2e` sem perguntar; produção só com "pode aplicar"
escrito no chat; ritmo PR + auto-merge segue.

🚪 **Portão de abertura (DL-063): 3 de 7 provados. Prazo: 10/11.**
✅ T-027 `0004` · ✅ T-033 cabeçalhos · ✅ item 7, plano do Supabase decidido (grátis) ·
⬜ T-020 teto do bucket + firewall (o limite de 5 envios por hora entrou no #36; teto e firewall não) ·
⬜ T-031 captcha · ⬜ T-032 2FA do admin · 🟡 senha mínima 8 (falta a prova com 7 caracteres).

🟢 **Para ligar o botão do contato em produção, falta exatamente isto** (card T-041):
1. **T-031** Turnstile no clique, conferido no servidor (`TURNSTILE_NO_CONTATO = true`)
2. **SEC-131** siteverify exige `hostname` canônico e `action = contato`
3. **SEC-127** regra `contato-por-ip` no firewall da Vercel (10/min, IPv6 por /64), escrita no card (gesto do Elber)
4. **SEC-132** Política de Privacidade **publicada** (`/privacidade`, T-049) para a linha sob o botão
5. **SEC-133** medir Safari anterior ao 16.4 (sem `Sec-Fetch-Site` recebe 403)
6. **Pelo menos 1 profissional ativo** em produção (a sessão de 04/11 informou 0 contas `active` lá)

**Fila dos próximos dias (05 a 10/11):** **T-031** Turnstile → **T-041** aceites e o botão ligado → **T-056** (B-1, 🔴) e
**T-059** (lote de banco, 🔴) → **T-049** (Elber responde as perguntas dos Termos e da Política; depois aceite, exportar,
excluir) → **T-048** rodada interna → **T-045** indexação, só com o portão 7 de 7. Detalhe em `03-TAREFAS.md`.

📏 **Gestos do Elber abertos:** conferir a `RESEND_API_KEY` na Vercel (desde 25/09) · regras do firewall da Vercel
(SEC-127, R-071) · trocar a senha do `postgres` de produção depois de cada sessão (SEC-138 e) · responder a T-058 ·
"pode aplicar" da `0007` em produção.

---

## O QUE FUNCIONA DE VERDADE HOJE

| Área | Estado |
|---|---|
| **Auth** | ✅ Email/senha + Google + confirmação + recuperação. Depois de criar conta, tela clara "Falta só confirmar o seu email" (#26). ⚠️ Sem captcha (T-031), admin sem 2FA (T-032). ⚠️ Conta criada pelo Google vira responsável e não tem caminho para vet/estabelecimento (A-4, decisão na T-058). |
| **Domínio e email** | ✅ `vetriabrasil.com.br` na Vercel, Resend verificado. ⚠️ `RESEND_API_KEY` na Vercel não conferida. |
| **RBAC** | ✅ `middleware.ts` isola painel por prefixo e aplica o portão de status; as páginas reconferem por `requirePainel`. `set-access` só para master, lista fechada, sem auto-rebaixamento, sem zerar masters, trilha em `audit_logs` (#36). ⚠️ `middleware.ts` está deprecated no Next 16 (T-060). |
| **Onboarding profissional** | ✅ Salva cada passo no "Continuar" e reabre onde parou (T-051, R-072 fechado). **WhatsApp obrigatório para concluir** nas duas personas, na tela e no servidor (T-046). Quem está `active` sem WhatsApp vê aviso no painel e em `/perfil`. ⚠️ A aprovação do admin ainda não exige WhatsApp (T-058). |
| **Admin** | ✅ Fila real, documento por URL de 60 s, aprovar e reprovar com motivo, email, `audit_logs`, rotas sem `debug` nem erro cru (#36). ⚠️ B-1: o profissional pode trocar CRMV ou documento entre o admin abrir e aprovar (T-056). |
| **Contato (E5)** | ✅ Na `main` e no banco de produção: `POST /api/contato` + `registrar_contato` (só `service_role`, limites, deduplicação 24 h, freio global de 30/min), botão "Chamar no WhatsApp", "Contatos recebidos" (30 dias, mês, lista com origem), "Seus contatos" do responsável, vínculo na criação de conta. **Desligado em produção** (ver AGORA). ⚠️ A origem da busca chega nula (T-061). ⚠️ Conta criada pelo Google ou sem role não vincula (T-063). |
| **Banco** | ✅ `0002` a `0006` aplicadas em produção. `0007` aplicada só no `vetria-e2e`. SQL do repositório roda por `npm run banco` (DL-077). ⚠️ Corpos de `admin_list_profiles` e `admin_set_user_access` não versionados (T-059). |
| **Busca e perfil público** | ✅ No ar desde 25/09. Visibilidade pela RLS. Número fora do HTML (testado). `noindex` até o portão (T-045). |
| **Storage** | ✅ Bucket privado `documentos`, zero policy, 5 envios por hora por conta. ⚠️ Sem teto de volume e documento antigo não é apagado (T-020). |
| **Testes** | ✅ **145 testes verdes, 0 pulados** no CI da PR #31 contra o `vetria-e2e`, com `E2E_ALVO=teste` e pulo virando falha. CI roda só em PR, com `permissions: contents: read`. ✅ `manter-acordado.yml` roda todo dia e mantém os dois bancos acordados (T-044, verde de 29/10 a 04/11). `npm run dev:teste` sobe o site local contra o `vetria-e2e` na porta 3001. |
| **Dependências** | ✅ Next 16.4.5, `npm audit --omit=dev` = 0 (#34). |

---

## O QUE É CASCA (tela existe, dado não)

- `/admin/conteudo` e `/admin/moderacao` (fora do menu desde a T-055) → sem card
- Onboarding do responsável (pergunta pelo animal e descarta) → decisão na T-058
- Editores de perfil das 3 personas → T-019, **só se sobrar tempo**. A prévia está no ar (T-038)
- Agenda, avaliações, equipe → fora do escopo; as rotas devolvem para o painel (T-055)

---

## O QUE NÃO EXISTE AINDA

- Captcha, 2FA do admin, teto do bucket, regras do firewall (portão de abertura, DL-063)
- Indexação no Google e `sitemap` (T-045, depois do portão)
- As 6 landing pages (E6 contratada): semana de 18/11, versão mínima (T-050); preço como vitrine "em breve" (DL-074)
- LGPD: aceite no cadastro, exportar e excluir a conta, `/termos` e `/privacidade` publicados (T-049). **O texto existe
  em rascunho** em `docs/legal/` (#29), com 18 perguntas para o Elber no fim dos dois arquivos

---

## STACK

| Camada | Escolha | Nota |
|---|---|---|
| Framework | Next.js 16.4.5 (App Router) | React 19.2 |
| Estilo | Tailwind v4 via `@theme inline` em `app/globals.css` | Sem `tailwind.config` |
| Fonte | Inter, única (DL-032) | Serif foi tentada e revertida |
| Auth + DB + Storage | Supabase (produção + `vetria-e2e`, os dois no grátis) | Resend como SMTP; ícones `lucide-react` |
| Hospedagem | Vercel, deploy no merge da PR na `main` | |
| Testes | Playwright + GitHub Actions | CI obrigatório na `main` (ruleset) |
| Banco por comando | `npm run banco -- <teste\|producao> <arquivo.sql>` (`scripts/banco.mjs`, `pg`) | Conexão em `.env.banco.local` (gitignored). DL-077 |
| Pagamento | nenhum | **fora do escopo dos 3 meses** (`docs/07-RODADA-2.md` §4, não decidido) |

---

## MAPA DE ROTAS (real, hoje)

```
PÚBLICO   /  ·  /buscar  ·  /veterinario/[slug]  /estabelecimento/[slug]
          /login  /cadastro  /cadastro/{responsavel,veterinario,estabelecimento}
          /recuperar-senha[/nova]  /auth/callback  /auth/confirm  ·  /roadmap  /entrega-fase-2 (noindex, sai na T-057)
RESPONSÁVEL (role tutor, chrome header)   /app/responsavel  + /onboarding /perfil /historico ("Seus contatos")
VETERINÁRIO (role vet, sidebar)           /app/veterinario/onboarding · /app/veterinario + /contatos /perfil /plano
          /configuracoes /ajuda /aguardando /bloqueado   (agenda e avaliações devolvem ao painel)
ESTABELECIMENTO (role clinic, sidebar)    /app/estabelecimento/onboarding · /app/estabelecimento + os mesmos do vet
ADMIN (role admin, chrome dark)           /admin + /usuarios /validacoes  (moderação e conteúdo fora do menu)
API       /api/contato  /api/admin/profiles  /api/admin/set-access  /api/onboarding/set-role  /api/cidades
          /api/documentos/upload  /api/documentos/abrir
```

> ⚠️ **Nomenclatura.** Rotas em português, **valores de role no banco** `tutor`/`vet`/`clinic` (DL-043).
>
> ⚠️ **As duas rotas de documento ficam FORA do `matcher` do `middleware.ts` e se defendem sozinhas** (sessão, origem
> por `lib/http/origem.ts`, limite).

---

## ONDE ESTÃO AS COISAS

| Preciso de... | Está em |
|---|---|
| O que foi contratado | `docs/00-ESCOPO.md` 🔒 |
| O que vem depois de 25/11 (cobrança e o resto) | `docs/07-RODADA-2.md` (proposta para decisão) |
| **Quem acessa o quê** | **`docs/06-PERMISSOES.md`**: vira RLS e middleware |
| O plano das 13 semanas | `docs/01-PLANO.md` |
| A fila de tasks | `docs/03-TAREFAS.md` |
| Bugs, dívidas e riscos | `docs/04-RISCOS.md` |
| Por que decidimos X | `docs/05-DECISOES.md` (DL-041+) e `CONTEXT.md` (DL-001 a DL-040, histórico) |
| Como os agentes trabalham | `docs/AGENTES.md` |
| Relatórios de segurança/QA/UX | `docs/relatorios/` (o mais recente: `SEC-2026-11-04.md`) |
| Rascunho de Termos e Política | `docs/legal/` (não publicado; perguntas para o Elber no fim) |
| Estado de cada migration | `supabase/migrations/README.md` |
| O que os **donos** veem | rota `/roadmap` (viva, noindex) |
| Como entrar numa sessão nova | `HANDOFF.md` e `RETOMAR.md` |

> **Arquivos históricos, congelados, não escreva neles:** `CONTEXT.md` (DL-001 a DL-040) ·
> `BACKLOG.md` (TASK-001 a 039) · `DEMO.md` · `../VETRIA_PROJETO.md`.
