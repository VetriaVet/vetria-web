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

## 🟠 ABERTOS — ALTOS

### R-002 — Modelo de `master` inconsistente entre doc, código e enum ⚠️ RECLASSIFICADO
- **Descoberto:** 26/08/2026 · **Reclassificado:** 26/08/2026, após leitura de `app/api/admin/*`
- **Classificação original (errada):** "role `master` é barrado do próprio `/admin`". Não procede.
- **O que é de fato:** `master` **não é um `role`**. É `role = 'admin'` + `admin_level = 'master'`, e o código já funciona assim (`api/admin/profiles/route.ts:57` e `api/admin/set-access/route.ts:52` autorizam por `admin_level === "master"`). Logo `middleware.ts:45` (`role !== "admin"`) está **correto** e não barra ninguém. Decidido e registrado em DL-045 e `06-PERMISSOES.md` §1.
- **O que sobra de problema real, em três frentes:**
  1. **Código morto que ensina errado:** `app/app/layout.tsx:23` tem `NAV_BY_ROLE["master"]`, inalcançável. Quem ler acredita que `master` é role. 🟡
  2. **Documentação errada:** `CONTEXT.md` §4.1 lista `master` como role. Congelado, mas ainda é o que uma sessão desavisada lê. 🟡
  3. **Bug latente 🟠:** `set-access/route.ts:66` escreve `admin_level: new_admin_level ?? "admin"`, mas `CONTEXT.md` §4.2 diz que o enum é `comum|master`. **Se o enum não aceitar `"admin"`, promover alguém a admin sem passar o nível explícito falha.** Nunca foi exercitado porque o painel sempre manda o nível.
- **Depende de:** confirmar os valores reais do enum via `supabase/introspect.sql` (bloco 1)
- **Corrige em:** F3 / S3, junto com R-001

### R-011 — Veterinário e estabelecimento entregam o mesmo produto por preços diferentes
- **Descoberto:** 26/08/2026 · **Gravidade:** 🟠 de negócio, não de código
- **O quê:** `app/app/veterinario/(painel)/` e `app/app/estabelecimento/(painel)/` têm exatamente os mesmos itens (agenda, aguardando, ajuda, avaliações, configurações, contatos, perfil, plano). A única diferença é `equipe`, no estabelecimento, e `equipe` está na **V2**.
- **Por que importa:** são dois planos vendidos por preços diferentes entregando funcionalidade idêntica na V1. As LPs de preço da **F5** vão precisar listar o que diferencia um do outro, e hoje não existe resposta.
- **Não é bug.** É pergunta de produto sem dono, e ela vence antes do mês 4, quando o Stripe entra e o preço vira real.
- **Precisa de decisão até:** F5 / S10 (LPs de preço)
- **Registrado em:** `06-PERMISSOES.md` §7

### R-003 — Zero testes automatizados em código que já está em produção
- **O quê:** ~45 telas, auth real, RBAC, e nenhuma verificação automática. Nas próximas 12 semanas o banco inteiro entra por baixo dessas telas.
- **Corrige em:** F3 / **S2** — T-003. **Escorregou da S1 sem ninguém decidir que escorregaria**, que é a forma mais comum de dívida crescer. Se escorregar de novo, o item 5 do DoD da F3 fica sem chance de fechar em quatro semanas.

### R-004 — `dangerouslyAllowSVG: true` no `next.config.ts`
- **O quê:** necessário pra logo SVG renderizar via `next/image` (DL-040). Está mitigado por CSP sandbox. Vira risco real se algum dia entrar SVG enviado por usuário (foto de perfil, documento).
- **Regra:** **nunca** servir SVG de origem de usuário por `next/image`. Upload de imagem de usuário aceita só raster (jpg/png/webp).
- **Corrige em:** F3 / S2 — **T-008**, como validação de MIME no upload. O CHECK de `documento_path` já barra `.svg` no banco (SEC-026); falta barrar no servidor, antes de o arquivo existir.

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

### R-018 — `clinic_profiles` publica CNPJ, razão social e o nome do responsável técnico para `anon` (SEC-020)
- **Descoberto:** 26/08/2026, auditoria da `0002` (2ª revisão). **Nunca foi decidido, e a `0002` foi aplicada assim.**
- **O quê:** a policy `clinic_profiles_select_publico` libera a **linha inteira** de todo estabelecimento `active`. RLS é ROW-level: liberar a linha libera `cnpj`, `razao_social`, `responsavel_tecnico`, `endereco` e `cep` junto com o que é vitrine. `responsavel_tecnico` é **nome de pessoa física**.
- **Por que não explodiu ainda:** não existe nenhum estabelecimento `active` no banco. A conta só vence quando o primeiro for aprovado (F3/S4) e, principalmente, quando o perfil público existir (F4/S7).
- **A decisão que falta:** ou as cinco colunas são vitrine por decisão registrada em `05-DECISOES.md`, ou descem para `perfil_privado` — e descer é **migration**, ou seja, 🔴 e sessão presencial.
- **Onde decidir sem custo:** na mesma sessão da **T-002**, com o banco já aberto. Está no card.
- **Prazo máximo:** antes da F3/S4 (primeira aprovação real). 🟡

### R-019 — O plano promete foto de perfil e horários, e não existe nem campo nem coluna para nenhum dos dois
- **Descoberto:** 26/08/2026, na abertura da S2, conferindo o `01-PLANO.md` §S2 contra o código e o schema
- **O quê:** o plano da S2 diz "foto" para o veterinário e "horários" para o estabelecimento. Na realidade: `vet_profiles` não tem coluna de foto, `clinic_profiles` não tem coluna de horários, o `ClinicOnboardingForm` **não coleta horário nenhum**, e o `VetOnboardingForm:229` já avisa honestamente "Upload de foto chega em breve".
- **Consequência de fazer agora:** coluna nova é migration (🔴) e foto pública é **outro bucket**, público, com regra própria. Some com a semana.
- **Não é corte de escopo:** o `00-ESCOPO.md` §2 não menciona foto nem horário em E1 a E6. É imprecisão do plano, não do contrato.
- **Onde entra de fato:** foto pesa na **F4/S7** (perfil público sem foto converte mal). Horário é candidato natural a mês 4. Quem decidir, registra em `05-DECISOES.md`. 🟡

### R-017 — Margens negativas órfãs depois da reestruturação do chrome ✅ CORRIGIDO
- **Descoberto:** 26/08/2026, no primeiro cadastro real de ponta a ponta
- **O quê:** telas escritas quando o layout pai tinha padding usam `-m-6 sm:-m-8` pra furá-lo. Quando o chrome foi reestruturado (DL-025/DL-031) e os onboardings saíram do route group `(painel)`, esse padding sumiu e a margem negativa passou a jogar o conteúdo pra fora da viewport.
- **Por que ninguém tinha visto:** a fase visual foi conferida com as telas navegadas **por dentro do app**, não entrando por um link de confirmação de email. E ninguém tinha feito um cadastro real de ponta a ponta desde a reestruturação.
- **Corrigido em:** T-005, commit `2ca98cf` (26/08/2026), nos dois formulários. Varredura confirmou que eram as duas únicas ocorrências no `app/`.
- **Lição pro `vetria-qa`, que continua valendo:** conferir tela navegando por dentro do app esconde bug de layout de tela alcançada por link externo.

### R-007 — Canonical `www` × apex não padronizado
- Herdado de DL-039/040. Vira problema de SEO quando os perfis públicos forem indexáveis (F4/S7). 🟡

### R-008 — Documentação fragmentada e contraditória
- `VETRIA_PROJETO.md` (raiz do Desktop) fala de Poppins + Cormorant, revertidos em DL-032. Diz que "Supabase será refeito", o que não aconteceu.
- **Mitigação:** `02-ESTADO.md` é agora a única fonte de verdade sobre estado. Os arquivos antigos estão marcados como históricos.

### R-009 — Aquecimento de domínio de email
- Emails caem em spam no começo (DL-039). Piora na F3/S4, quando aprovação e reprovação passam a disparar email de verdade.
- **Mitigação:** DMARC único, marcar "não é spam", monitorar taxa de entrega no Resend.

### R-013 — Agentes não carregam se a sessão abrir na pasta errada
- **Descoberto:** 26/08/2026, ao tentar invocar `vetria-seguranca` pela primeira vez
- **O quê:** o Claude Code resolve `.claude/agents/` a partir do diretório onde a sessão foi aberta. Sessão aberta em `Desktop/Vetria` (a pasta de cima) não enxerga nenhum dos 6 agentes, e também não lê o `CLAUDE.md`. O erro é `Agent type 'vetria-seguranca' not found`, que parece problema de configuração e não é.
- **Por que importa:** todo o sistema de governança depende dos agentes existirem. Se a sessão abre na pasta errada, o trabalho continua acontecendo, mas sem segurança, sem QA e sem as regras da matriz de permissões. Falha silenciosa, que é a pior categoria.
- **Mitigação:** aviso no topo do `HANDOFF.md` e do `CLAUDE.md`. Conferir com `/agents` no começo da sessão.
- **Corrige de vez em:** avaliar cópia em `~/.claude/agents/`, aceitando o custo de manter duas cópias sincronizadas.
- **Decisão do maestro na abertura da S2:** **não virou card.** Não aponta para nenhuma capacidade E1 a E6, e card sem capacidade não entra na fila (regra 1 da fila). Continua como mitigação por aviso no `CLAUDE.md` e no `HANDOFF.md`. Se a falha se repetir uma segunda vez, aí sim vira card e come tempo de semana.

### R-016 — Um só par de olhos revisando não teria bastado
- **Descoberto:** 26/08/2026, olhando a curva das 4 auditorias da migration `0002`
- **O quê:** v1 tinha 2 furos por onde dado real sairia. A v2 fechou os dois e **abriu quatro nas próprias correções**. A v3 fechou os quatro e deixou três. A v4 fechou os três e a conferência achou mais dois, um deles nascido do encontro de uma correção nova com um pendente antigo.
- **O padrão:** em **quatro rodadas seguidas** houve achado nascido da correção anterior. Um deles (SEC-014) teria desligado a busca pública inteira **sem aparecer em nenhum teste feito com usuário logado**.
- **A regra que sai disso:** correção de segurança **volta pra revisão**. Não existe "já corrigi, pode aplicar". Está no `docs/AGENTES.md`.
- **Status:** ✅ virou processo, não fica aberto.

### R-014 — Não está definido quem OPERA o painel admin
- **Descoberto:** 26/08/2026, ao conferir de quem são as 17 contas do banco
- **O quê:** existem apenas 2 contas de admin (1 master, 1 comum). Os sócios da Vetria não são admin: o Durval está no banco como `vet`. A partir da **F3/S4**, quando a validação de CRMV e CNPJ ficar real, alguém precisa abrir a fila diariamente, conferir documento e aprovar.
- **Por que importa:** se só o Elber aprova, ele vira o gargalo de toda entrada de profissional na plataforma. É exatamente o que o DL-045 tentou evitar ao separar admin comum de master.
- **A decidir até a F3/S4:**
  1. Marília e Durval recebem conta de **admin comum** para aprovar profissionais?
  2. Se o Durval também quiser **perfil público de veterinário**, precisa de **duas contas com emails diferentes**. `1 usuário = 1 role` é a regra que sustenta o RBAC inteiro (DL-044), e abrir exceção para sócio é abrir para todo mundo.
- **Não bloqueia a F3/S1.** Bloqueia o uso real da S4.

### R-015 — Token do GitHub em texto puro na URL do remote
- **Herdado de:** DL-002, quando resolver rápido era o certo
- **O quê:** o token fica no `.git/config` em texto puro e aparece em qualquer `git remote -v`. Expirou em 26/08/2026 e travou o push.
- **Por que importa agora:** são 3 meses de commits pela frente, e o `credential.helper` já está configurado como `manager` nesta máquina. Dá pra deixar o remote limpo e autenticar uma vez pelo navegador.
- **Corrige em:** F3/S2, junto com as outras tarefas de infraestrutura. 🟡

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

- **Horários de funcionamento do estabelecimento.** Boa ideia, e o `01-PLANO.md` §S2 chegou a prometer. Não existe campo no formulário nem coluna na tabela, e criar coluna é migration presencial. Fora do escopo dos 3 meses (`00-ESCOPO.md` §2 não cita horário em nenhuma das seis capacidades). **Anotada pro mês 4.** Ver R-019.
- **Foto de perfil com upload.** Precisa de um segundo bucket, público, com regra própria de moderação de imagem. Não é requisito de E1 a E6. Volta como decisão na F4/S7, quando o perfil público existir e a falta dela custar conversão. Ver R-019.

---

## ✅ FECHADOS

- **R-005** — `is_admin_master` era duplicata byte a byte de `is_master_admin`. Removida pela `0002` em 26/08/2026.
- **R-006** — o schema vivia fora do repo. `0000_baseline.sql` versiona o que existia; da `0002` em diante tudo passa por arquivo.
- **R-015** — token do GitHub em texto puro na URL do remote. O remote virou `https://VetriaVet@github.com/...` e a autenticação passou pro credential manager, em 26/08/2026.
- **R-002 item 3** — o "bug latente" do `admin_level ?? "admin"` era improcedente: o enum aceita `admin`, e `comum` nunca existiu. Confirmado por introspecção.
