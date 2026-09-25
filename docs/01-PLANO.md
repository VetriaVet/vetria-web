# 01 — PLANO DE 13 SEMANAS

> **Início:** 26/08/2026 · **Entrega:** 25/11/2026
> Escopo fechado em [`00-ESCOPO.md`](./00-ESCOPO.md). Estado real em [`02-ESTADO.md`](./02-ESTADO.md).

**Princípio de ordem:** funcionalidade primeiro, estética depois — mas os agentes de
auditoria (segurança, UX, QA) rodam **em paralelo desde a semana 1**, porque eles não
escrevem código, produzem relatório. Ver [`AGENTES.md`](./AGENTES.md).

---

## VISÃO DAS FASES

```
S1  S2  S3  S4  | S5  S6  S7  S8  | S9  S10 | S11 S12 | S13
[--- FASE 3 ---] [--- FASE 4 ----] [-- F5 --] [-- F6 --] [F7]
 Núcleo de dados   Motor B2C         Venda      Endurecer  Buffer
                                                            +entrega
```

| Fase | Semanas | Datas | Entrega o quê | Capacidades |
|---|---|---|---|---|
| **F3 — Núcleo de dados** | S1–S4 | 26/ago → 22/set | O app passa a guardar dado de verdade | E1, E2, E3 |
| **F4 — Motor B2C** | S5–S8 | 23/set → 20/out | O marketplace passa a girar | E4, E5 |
| **F5 — Venda** | S9–S10 | 21/out → 03/nov | O funil comercial existe | E6 |
| **F6 — Endurecimento** | S11–S12 | 04/nov → 17/nov | Seguro, legal, testado, rápido | Transversais |
| **F7 — Buffer + entrega** | S13 | 18/nov → 25/nov | Correção do que sobrou + apresentação | — |

> **A S13 é buffer de verdade.** Não planeje nada nela. Ela existe porque
> todo projeto atrasa, e o que separa entrega de desastre é ter previsto o atraso.

### Onde estamos em 25/09/2026 (meio da S5)

| Fase | Estado | DoD |
|---|---|---|
| **F3** | ✅ **CONCLUÍDA** (DL-069, que revisa o DL-062) | **6 de 6** · item 5 medido no CI do `vetria-e2e` em 23/09 (70/70) |
| **F4** | 🔵 **em andamento, ~1,5 semana adiantada** | **2 de 6 provados**, 2 parciais, 2 abertos (tabela em §F4) |
| **F5** | ⬜ | 0 de 3 · os textos das 6 páginas já estão escritos |
| **F6** | ⬜ | 0 de 4 · parte da auditoria já foi feita ao longo da F3 |
| **F7** | ⬜ | buffer intacto |

---

## REAVALIAÇÃO DE 25/09/2026 (`vetria-maestro`): o atraso foi recuperado, e a F4 está adiantada

**O número honesto hoje: ~1,5 semana ADIANTADOS na F4, buffer da S13 intacto.**

- Em 23/09 declaramos ~1 semana de atraso em trabalho. Em 3 dias, a sessão presencial de 23/09 aplicou a
  `0004`, e a de 24-25/09 aplicou a `0005` e pôs no ar `/buscar` e as duas páginas públicas. **O plano punha a
  busca na S6 (até 06/10) e o perfil na S7 (até 13/10).** A F3 fechou 6 de 6 (DL-069), 13 dias antes da data
  dura da T-029.
- **O que fez a diferença**, e é o que tem que continuar: sessão presencial acontecendo (a 🔴 deixou de
  esperar agenda), migration ensaiada no `vetria-e2e` antes de produção (DL-064), e tudo entrando por PR com
  CI obrigatório.
- **Por que "1,5" e não "2 semanas":** o adiantamento é na capacidade, não no DoD. O que falta da F4 é
  exatamente o que tem 🔴 e decisão do Elber: o **contato** (S8 inteira, zero linhas, uma migration nova) e
  o **portão** (1 de 6; captcha e 2FA dependem de ordem "código → deploy → painel"). E houve trabalho sem card
  (T-034 a T-037 foram escritos depois), o que esconde custo.

**O calendário novo da F4, sem mexer em datas de fase:**

| Semana | O quê |
|---|---|
| **S5, até 29/09** | T-038 prévia do perfil · T-033 cabeçalhos · T-020 teto do bucket + firewall · T-031 código · T-039 `0006` escrita e auditada |
| **S6, 30/09 a 06/10** | ~~decisões D1 a D12~~ **decididas em 25/09 (DL-071)** · 🔴 sessão 30/09: Turnstile ligado, firewall, `0006` no `vetria-e2e`, decisão do R-077 · T-040 rota `/api/contato` · T-041 botão · T-044 CI agendado (+ produção, DL-072) · T-046 WhatsApp obrigatório |
| **S7, 07/10 a 13/10** | 🔴 sessão 07/10: `0006` em produção, T-032 2FA · T-042 painéis de contatos e histórico · T-043 E2E do contato |
| **S8, 14/10 a 20/10** | Portão 6 de 6 → T-045 indexação e `sitemap` → **fechar o DoD da F4**. O que sobrar: construir as LPs da F5 **sem publicar** |

**Gatilho escrito:** se a sessão de 30/09 não acontecer, a S8 do contato começa sem as decisões e a `0006` é
escrita com as recomendações; **se a de 07/10 também não acontecer, a folga acaba ali**, e isso será dito em
07/10, não em 20/10.

## ATRASO E RECUPERAÇÃO (escrito em 23/09/2026, pelo `vetria-maestro`) — histórico, superado pela reavaliação acima

**Estamos atrasados, e o número honesto é: cerca de uma semana de trabalho, não de calendário.**

- **No calendário, a fronteira F3/F4 chegou com 1 dia de diferença** (o item 3 entrou em produção em
  23/09; o plano dizia 22/09). Isso esconde o resto.
- **A S3 terminou 5 dias depois do previsto** (20/09 em vez de 15/09), e a S4 foi espremida em três
  dias (21 a 23/09). **A `main` ficou 20 dias sem código** (31/08 a 20/09): o gargalo da F3 não foi
  escrever, foi mergear e provar.
- **A F3 deixa três dívidas para a F4 carregar:** o item 5 do DoD (T-029, R-033 sem decisão desde
  28/08); a **T-017**, quatro semanas sem data, agora dentro da **T-027**; e **~3 dias de
  endurecimento que o plano original não tinha** (o portão de abertura do DL-063: captcha, 2FA do
  admin, cabeçalhos, teto do bucket).
- **A própria S5 é migration** (tabelas de busca e `slug`), então **a semana inteira depende de uma
  sessão presencial.**

**O que se faz para recuperar, sem cortar escopo contratado:**
1. **Uma sessão presencial fixa por semana para 🔴** (sugestão: terça à noite). A T-017 não
   escorregou por ser difícil; escorregou por falta de agenda. **A primeira é até 29/09**, e aplica
   a `0004` (T-027) e, se couber, a `0005` (T-028), cada uma com a sua auditoria.
2. **Prova em tela e push no mesmo dia.** A S4 fez isso (T-023, T-024 e T-025 foram de "provada" a
   "em produção" em horas) e é o que tem que continuar.
3. **Nada é construído duas vezes.** A prévia do perfil que o Elber pediu **é** o componente do
   perfil público da S7, lendo a linha do dono; não vira uma tela à parte agora.
4. **Os cortes já feitos continuam cortados:** editores de perfil na F6 (DL-056), onboarding do
   responsável sem card, foto e horários em §Ideias.
5. **O buffer da S13 não foi tocado.** **Gatilho escrito:** se a sessão da `0004`/`0005` não
   acontecer até 29/09, a S6 (`/buscar`) começa sem ter o que ler, e **o buffer começa a ser comido
   na S6**. Isso vai ser dito na abertura da S6, não na S13.
6. **Se ainda assim não couber**, a pergunta ao Elber é *o que sai em troca* (emenda, `00-ESCOPO.md`
   §5), e o primeiro candidato é o E2E da F4 ficar com o fluxo principal só, não o prazo.

---

## FASE 3 — NÚCLEO DE DADOS (S1–S4)

**Objetivo:** matar a casca. Tudo que a tela mostra passa a vir do banco.

> ✅ **Estado em 25/09/2026: CONCLUÍDA, 6 DE 6** (**DL-069**): o item 5 foi medido no CI do `vetria-e2e` em
> 23/09 (70 de 70, 0 pulados, com cadastro novo e aprovação). O texto abaixo é o registro do fechamento anterior.
>
> ⛔ **Estado em 23/09/2026: ENCERRADA COM 5 DE 6. NÃO É UMA FASE CONCLUÍDA** (**DL-062**). O item
> 3 fechou em 23/09 com a T-024 em produção (`6a8d86a`), o item 4 fechou ao pé da letra com conta
> `tutor`. **O item 5 ficou parcial** (os itens 1 e 3 sem E2E, R-033) e virou a **T-029**, data dura
> **06/10**. A F4 começa hoje porque o que falta é rede de teste, não capacidade. A T-017 entrou na
> **T-027**. O detalhe item por item, com a prova de cada um, está em `03-TAREFAS.md`.
> _(Estado de 21/09, para registro: em andamento, 5 de 6, o item 3 sem uma linha escrita, DL-059.)_

### S1 — Fundação do schema 🔴
- `0000_baseline.sql`: dump do schema que já existe em produção, versionado (fecha R-006).
- Migration `0002`: `profiles.status` (enum) + `vet_profiles` + `clinic_profiles` + `contatos` + `audit_logs` + RLS + trigger `updated_at`.
- `contatos` entra agora porque é aditiva e trivial, e assim a F4/S8 não precisa de outra sessão presencial (DL-047).
- Supabase Storage: bucket `documentos` privado + policies (só o dono e o admin leem).
- **Antes de tudo:** backup do banco. Migration aditiva, nunca destrutiva.
- 🔴 **Sessão presencial obrigatória** (Elber aplica).

### S2 — Onboarding que persiste
> **Ajustado na abertura da semana, 26/08/2026** (`vetria-maestro`). O que mudou e por quê
> está no cabeçalho da fila da S2 em `03-TAREFAS.md`. Resumo: entram a T-002 e a T-003, que
> escorregaram da S1; sai o onboarding do responsável; saem foto e horários.

- Onboarding do veterinário grava em `vet_profiles` (CRMV, especialidades, cidade, bio) e o
  contato em `perfil_privado`. ~~foto~~ → não existe coluna nem campo, ver **R-019**.
- Onboarding do estabelecimento grava em `clinic_profiles` (CNPJ, endereço, serviços).
  ~~horários~~ → não existe coluna nem campo, ver **R-019**.
- ~~Onboarding do responsável grava nome/cidade em `profiles`~~ → **movido para a S3**, junto
  com os editores de perfil. Nenhum item do DoD da F3 depende dele.
- Bucket de documentos (T-002, 🔴 herdada da S1) e upload com validação de tipo e tamanho.
- Ao concluir: `status` vai de `incomplete` → `pending_validation` **no servidor**.
- Playwright + CI (T-003, herdada da S1), em paralelo.

### S3 — Portão de status ✅ **entregue em 20/09/2026** (`eb6e2d6`)
> **O que a S3 entregou de fato:** **T-007** (o onboarding do estabelecimento persiste),
> **T-016** (o portão de status e o isolamento de role por prefixo, fechando **R-001** e
> **R-038** por prova em tela) e **T-008** (o upload do documento, e o bucket deixou de estar
> vazio). Mais o `/ajuda` do DL-058, o pré-voo do `ci.yml` e a suíte de **15 para 40 testes**,
> verdes no CI. ⚠️ **O onboarding do responsável** (primeiro item abaixo) **não foi feito** — não
> tem item de DoD, e nenhum card da S3 o carregava. Continua casca, e continua sem card.
- Onboarding do responsável passa a gravar nome e cidade em `profiles`, e o animal em `animais`
  (veio da S2).
- `middleware.ts` reescrito: isolamento de role por prefixo de rota + bloqueio por `status`.
  - vet/estabelecimento com `status != active` → `/app/<painel>/aguardando`.
  - **Corrige o furo atual (R-001):** hoje um responsável logado alcança `/app/veterinario/*`.
  - Limpa o resíduo do R-002: código morto `NAV_BY_ROLE["master"]` e o `admin_level ?? "admin"` de `set-access`.
  - Codifica a matriz de `docs/06-PERMISSOES.md` §2 e §4, célula por célula.
- ~~Editores de perfil (`/app/*/perfil`) carregam e salvam de verdade.~~ → ⛔ **CORTADO DA S3 EM
  16/09/2026, decisão do Elber, e movido para a F6/S11** (card **T-019**, em *Plantadas* no
  `03-TAREFAS.md`). O corte estava **escrito de antemão** no `03-TAREFAS.md` desde 09/09 — *"se em
  15/09 a T-008 não estiver fechada, os editores de perfil da S3 escorregam para a F6/S11"* — a
  condição foi atingida (a T-008 **não começou**) e o Elber acionou. **Não é corte de escopo
  contratado:** o `00-ESCOPO.md` §2 não cita editor de perfil em nenhuma das seis capacidades, e
  nenhum dos 6 itens do DoD da F3 depende dele. **Não há emenda a fazer.** Ver **DL-056**.

### S4 — Validação real pelo admin ✅ **entregue em 23/09/2026** (`22fbefd`, `6a8d86a`)
> **O que a S4 entregou de fato, tudo provado em tela pelo Elber e em produção:** **T-023** (a fila
> real, 4 contas, o documento abrindo), **T-024** (aprovar e reprovar com motivo, email recebido,
> `audit_logs` com o admin como autor, conta nova recusada sem documento), **T-025** (o caminho de
> volta ao onboarding nas duas personas) e **T-021** (doc). **Não entregou:** a T-017 (→ T-027).
>
> **Aberta em 21/09/2026.** É **a última semana da F3** e carrega o **único item do DoD que
> falta**, o 3. Os quatro bullets abaixo viraram dois cards por dependência real — **T-023**
> (ler a fila e abrir o documento) e **T-024** (aprovar, reprovar com motivo, email e trilha) —
> mais **T-025** (o caminho de volta ao onboarding, que o DL-046 promete e a interface não
> oferece) e **T-021** (a varredura de órfãos parar de classificar órfão real como esperado).
> ⬇️ **Recebidos de fora do plano original:** o **R-054** (`/admin/usuarios` para admin comum)
> entra dentro da **T-023**, porque esta é a semana que cria a persona "admin comum"; e o
> **R-051** (o motivo da reprova, que hoje ninguém lê) entra dentro da **T-024**, junto com quem
> produz a reprova.
- `/admin/validacoes` lê a fila real (`status = pending_validation`).
- Detalhe da validação: vê os dados, abre o documento (URL assinada), aprova ou reprova com motivo.
- Aprovar → `status = active` + email de aprovação. Reprovar → volta pra `incomplete` + email com o motivo.
- `audit_logs`: toda ação de admin fica registrada.

### ✅ Definition of Done da F3 (verificável, não opinião)

> **RECONFERIDO ITEM POR ITEM EM 23/09/2026, no fechamento: 5 fechados, 1 parcial.**
> (Em 20/09 eram 5 fechados e o 3 aberto; o 4 estava provado pelo mecanismo, não pela frase.)
> **A tabela com a medição de cada item está em `03-TAREFAS.md`.**
1. ✅ Cadastro novo de veterinário → onboarding preenchido → sair e voltar → **os dados estão lá**.
   *Prova: T-006 (31/08, vet) e Elber em 20/09 (estabelecimento), contas reais.*
2. ✅ Esse veterinário vê a tela "aguardando" e **não consegue** entrar no dashboard.
   *Prova: 9 navegações do Elber em 20/09 + `portao-status.spec.ts` verde no CI.*
3. ✅ Admin aprova → o veterinário entra no dashboard e recebe o email.
   *Prova: Elber em 23/09, conta nova ponta a ponta, email recebido, `audit_logs`; em produção em `6a8d86a`.*
4. ✅ Um responsável logado que digite `/app/veterinario` é redirecionado.
   *Prova: Elber em 23/09, conta `tutor`, devolvida para o painel dela.*
5. ✅ **Teste E2E cobrindo 1–4 passando em CI.** *Prova: CI #22 da PR #4, 70/70, 0 pulados, no `vetria-e2e`
   (`fluxos-conta-nova.spec.ts` cobre 1 e 3), DL-069. Em 23/09 estava parcial (R-033, T-029).*
6. ✅ Relatório de segurança da fase sem achado 🔴 aberto.
   *Prova: 11 relatórios de segurança em `docs/relatorios/` desde 26/08, nenhum 🔴 aberto. Há 🟠
   abertos com trava escrita (DL-062, DL-063).*

---

## FASE 4 — MOTOR B2C (S5–S8)

**Objetivo:** o tutor encontra e fala com o profissional. É aqui que a Vetria vira Vetria.

> **Começa em 23/09/2026** (DL-062), carregando três dívidas da F3 (ver §Atraso) e o **portão de
> abertura** (DL-063), que vence no fim desta fase.

### Já adiantado antes da F4 começar (cada item com a prova, nenhum conta como item de DoD)
- ✅ **A regra de visibilidade já vive no Postgres desde 26/08:** `vet_profiles_select_publico` e
  `clinic_profiles_select_publico` só deixam ler quem é do role certo **e** está `active`
  (`perfil_esta_ativo`, `0002_nucleo.sql:499-535`). Não foi exercitada por busca nenhuma ainda.
- ✅ **Já existem contas `active`** (as de teste aprovadas pela T-024 em 23/09): a busca terá o que
  mostrar desde o primeiro dia. ⚠️ **Sem `slug`** (R-065, T-028).
- ✅ **A tabela `contatos` existe desde 26/08** (DL-047), com o desenho do contato anônimo por
  `anon_id`. Vazia.
- ✅ **Telefone e WhatsApp já moram separados do perfil público**, em `perfil_privado`, e a
  normalização do WhatsApp (`lib/contato/whatsapp.ts`) já vale para as duas personas.
- 🟡 **O campo de busca da Home existe no design**, desabilitado. Não leva a lugar nenhum.

### S5 — Dados de busca (23/09 → 29/09) · fila em `03-TAREFAS.md`
- Tabelas de apoio: `especialidades`, `cidades`, `servicos` (seed real, não mock). → **T-028** 🔴
- `slug` único e estável por perfil (regra decidida e registrada em `05-DECISOES.md`), **gerado na
  aprovação e preenchido nas contas que já estão `active`** (R-065). → **T-028** 🔴
- Índices Postgres + full-text search em português. → **T-028** 🔴
- ⬇️ **Recebido da F3:** a `0004` de endurecimento (**T-027** 🔴, com a T-017 dentro) e o item 5 do
  DoD da F3 (**T-029**). ⬇️ **Recebido da auditoria:** T-020 (teto do bucket), T-030 (atrito do
  onboarding). 🔴 **Sessão presencial até 29/09.**

### S6 — `/buscar` (30/09 → 06/10) ✅ **entregue adiantado, em 25/09 (T-037)**. A semana passa a ser do contato (§Reavaliação)
- Filtros: cidade + especialidade + tipo de atendimento. Ordenação definida.
- **Filtro de visibilidade no backend**, nunca no front: `role IN (vet, clinic) AND status = active`.
- Cards de resultado, paginação, estado vazio honesto, responsivo.
- Busca da Home passa a levar pra `/buscar` de verdade.
- ⬇️ **Portão de abertura:** **T-031** (captcha) e **T-033** (cabeçalhos). **06/10: data dura da T-029.**

### S7 — Perfil público (07/10 → 13/10) ✅ **entregue adiantado, em 25/09 (T-037)**, exceto a indexação (T-045) e a prévia (T-038, em execução)
- `/veterinario/[slug]` e `/estabelecimento/[slug]` com dados reais.
- SSR + metadata dinâmica (OG tags, title, description) para SEO.
- `noindex` automático em quem não está `active`.
- 404 correto pra slug inexistente.
- `clinic_profiles.site` vira link aqui: **só depois da T-027 aplicada** (esquema `http`/`https` no banco).
- ⬇️ **Pedido do Elber em 23/09:** a **prévia do perfil público** em `/app/*/perfil` é **o mesmo
  componente**, lendo a linha do próprio dono, só leitura. Não é o editor (T-019, F6).
- ⬇️ **Portão de abertura:** **T-032** (2FA do admin). **R-032** (endereço público) decidido antes.

### S8 — Contato (14/10 → 20/10) · **planejada em 25/09 em 8 cards (T-039 a T-046) e puxada para S6-S7**; decisões D1 a D12 **aprovadas em 25/09 (DL-071)**
- CTA WhatsApp com mensagem pré-preenchida.
- Cada clique registra em `contatos` (quem, pra quem, quando).
- `/app/responsavel/historico` passa a listar contatos reais. **Atenção:** hoje essa tela promete "Seus agendamentos" e desenha cards de consulta. Agendamento está fora dos 3 meses, então ela precisa virar "Seus contatos" (DL-047).
- Painel do profissional mostra contagem real de contatos recebidos.
- **20/10: o portão de abertura fecha** (DL-063), antes de a F5 publicar LP com CTA de cadastro.

### ✅ Definition of Done da F4
1. Buscar "São Paulo + Clínica geral" retorna **só** profissionais `active`.
2. Um profissional `pending_validation` **não aparece** em nenhuma busca nem tem perfil público acessível.
3. Clicar no card abre o perfil público com dado real, indexável pelo Google.
4. Clicar em WhatsApp abre a conversa **e** o contato aparece no histórico do responsável.
5. E2E do fluxo busca → perfil → contato passando em CI.
6. **Portão de abertura fechado** (DL-063, acrescentado em 23/09): os seis itens provados, não escritos. **Desde 25/09, sete:** o item 7 é a decisão escrita sobre o plano do Supabase de produção (DL-072).

> **Conferido item por item em 25/09/2026 (`vetria-maestro`). Não é fechamento; é onde cada um está.**
>
> | # | Estado | A prova, ou o que falta |
> |:-:|:-:|---|
> | 1 | ✅ | A visibilidade é só a RLS `perfil_esta_ativo` (sem filtro na aplicação, auditoria de 23/09); `busca-com-dados.spec.ts` verde no CI do `vetria-e2e`. ⚠️ Na hora do fechamento, refazer **a frase literal** ("São Paulo + Clínica geral") em produção ou no teste |
> | 2 | ✅ | 404 igual para inexistente e não ativo, pela RLS; grupo A de `busca-publica.spec.ts` verde. Conta `pending_validation` não aparece em `/buscar` (teste com dados) |
> | 3 | 🟡 | **Dado real: sim** (`larissa-lima-goiania-go` em produção). **Indexável: não, de propósito** (`PAGINAS_PUBLICAS_INDEXAVEIS = false` até o portão). Fecha com a **T-045** |
> | 4 | ⬜ | Nada escrito. S8: T-039 a T-042 |
> | 5 | 🟡 | busca → perfil verde no CI; **→ contato** não existe. T-043 |
> | 6 | 🟡 | **1 de 6** (T-027). Senha 8 configurada, sem prova. T-020, T-031, T-032, T-033 abertos |

---

## FASE 5 — VENDA (S9–S10)

**Objetivo:** o funil comercial que o `Coração Cerne do Projeto` descreve.

> **Já adiantado (23/09):** os **textos das 6 páginas existem** e são a copy aprovada, em `..`
> (`Copy 1 - Vetria Pro - Veterinários.docx`, `Copy 2 - ... Clínicas e Hospitais.docx`, `Copy 3 - ...
> Empresas Vet e Agrovet.docx` e as três `Copy Preço - ....docx`). A marca, a paleta e o design
> system também. **Nenhuma página foi construída.** ⚠️ **Pendência de produto com prazo aqui:** o
> **R-011** (vet e estabelecimento entregam o mesmo produto por preços diferentes) precisa de resposta
> antes da S10. ⚠️ **As LPs só vão ao ar com o portão de abertura fechado** (DL-063).
>
> ⚠️ **25/09/2026:** a copy de preço promete recursos que não existem e traz depoimentos de pessoas que não
> usaram o produto (**R-077**, 🟠). "Não reescrever copy aprovada" e "nada de dado falso em tela" batem de
> frente: **decisão do Elber antes da S10**, com recomendação em `docs/07-RODADA-2.md` §2. **Card novo na S10:
> T-047** ("Quero ser avisado quando o plano abrir", mede a demanda que libera a rodada 2).

### S9 — LPs de valor
- `/para-veterinarios`, `/para-estabelecimentos`, `/para-empresas`.
- Copy vem dos `.docx` já escritos (Copy 1, 2 e 3). **Não reescrever copy aprovada.**
- Sem preço. CTA: "Conhecer os planos".

### S10 — LPs de preço
- `/precos/veterinarios`, `/precos/estabelecimentos`, `/precos/empresas`.
- Comparativo de tiers, destaque no plano mais rentável, FAQ, CTA final.
- **Sem checkout.** CTA leva ao cadastro da persona certa.
- Header simples (sem busca), footer institucional.

### ✅ Definition of Done da F5
1. As 6 páginas no ar, responsivas, com a copy aprovada.
2. Fluxo LP de valor → LP de preço → cadastro correto por persona, sem beco sem saída.
3. Relatório de UX sem achado 🔴 aberto.

---

## FASE 6 — ENDURECIMENTO (S11–S12)

**Objetivo:** o que separa "funciona na minha máquina" de "pode receber gente real".

> **Já adiantado ao longo da F3 (23/09), cada um com prova, nenhum fecha item de DoD sozinho:**
> - ✅ **11 auditorias de segurança** em `docs/relatorios/`, uma por entrega; RLS escrita e revisada
>   em todas as tabelas da `0002`/`0003`. **Falta a auditoria completa com cada policy testada.**
> - ✅ **Isolamento entre painéis provado em tela** (R-001, 20/09) e com conta `tutor` (23/09).
> - ✅ **41 testes E2E no CI** (verdes em 20/09 com 40; o 41º veio com a T-025). Mais 19 escritos pelo
>   `vetria-qa` em 23/09, sem rodar. **A suíte completa depende do projeto de teste (R-033).**
> - ✅ **A chave `service_role` virou erro de build se vazar para o cliente** (`server-only`, DL-061).
> - ✅ **Toda ação de admin grava trilha** em `audit_logs` (T-024).
> - ⬜ LGPD (consentimento, exportação, exclusão), Termos e Política: **nada ainda.**
> - ⬇️ **Recebido em 23/09:** **SEC-091** (trilha de leitura do dossiê, DL-062) e a **CSP completa com
>   nonce** (DL-063). Os demais itens da avaliação de rate limit foram para a F4 (portão de abertura).

### S11 — Segurança + LGPD
- Auditoria completa de RLS: **toda** tabela com policy testada.
- Consentimento de dados no cadastro (aceite versionado e registrado).
- Exclusão de conta (soft delete + anonimização) e exportação de dados do titular.
- Política de Privacidade e Termos de Uso publicados.
- Headers de segurança, rate limit nos endpoints sensíveis, varredura de segredos.
- Branch `main` protegida no GitHub.
- ⬇️ **Recebido da S3 em 16/09/2026:** **T-019** — editores de perfil das 3 personas
  (`/app/*/perfil`) carregam e salvam de verdade. Chega aqui e não na F4 porque é a fase em que
  a auditoria de RLS toca exatamente as mesmas policies de UPDATE que o editor exercita. Ver
  **DL-056**.
- ⬇️ **Já estava aqui:** **T-018** (exclusão de conta apaga o documento do bucket, R-023).

### S12 — QA + performance
- Passada completa de QA em todos os fluxos, em 3 larguras de tela.
- Correção de tudo 🔴 e 🟠 do `04-RISCOS.md`.
- Core Web Vitals nas páginas públicas (Home, busca, perfil).
- Estados de erro reais: 404, 403, 500, offline, sessão expirada.
- Acessibilidade: contraste, foco visível, navegação por teclado, labels.

### ✅ Definition of Done da F6
1. Zero achado 🔴 aberto em segurança e em QA.
2. Suíte E2E completa verde no CI.
3. LGPD: consentir, exportar e excluir funcionam de verdade.
4. Lighthouse ≥ 90 em performance e acessibilidade nas 3 páginas públicas.

---

## FASE 7 — BUFFER + ENTREGA (S13)

- Correção do que sobrou (é pra isso que a semana existe).
- Rota `/entrega-final` seguindo o padrão do `/entrega-fase-2` (DL-040).
- `DEMO.md` atualizado com o roteiro de apresentação pros donos.
- Sessão de apresentação.

---

## RITMO SEMANAL (o ritual que sustenta as 13 semanas)

| Quando | O quê | Quem |
|---|---|---|
| **Segunda** | Abre a semana: `vetria-maestro` lê o estado, monta a fila de tasks da semana em `03-TAREFAS.md` | maestro |
| **Terça–Quinta** | Execução das tasks | backend, ui |
| **Quarta** | Varredura de segurança da semana → relatório | seguranca |
| **Quinta** | Varredura de QA da semana → relatório | qa |
| **Sexta** | Fecha a semana: achados viram tasks, docs sincronizados, commit de fechamento | escriba |
| **Fim de fase** | Checa o Definition of Done item por item. **Não avança sem passar.** | maestro |
| **Fim de fase** | Ressincroniza `/roadmap`, que é a janela dos donos pro andamento real. | escriba |

> **Regra de não-deriva:** nenhuma task entra na fila da semana sem apontar pra uma
> capacidade E1–E6 do escopo. Ideia boa que não aponta vai pra `04-RISCOS.md` §Ideias
> e espera o mês 4.
