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

---

## FASE 3 — NÚCLEO DE DADOS (S1–S4)

**Objetivo:** matar a casca. Tudo que a tela mostra passa a vir do banco.

### S1 — Fundação do schema 🔴
- `0000_baseline.sql`: dump do schema que já existe em produção, versionado (fecha R-006).
- Migration `0002`: `profiles.status` (enum) + `vet_profiles` + `clinic_profiles` + `contatos` + `audit_logs` + RLS + trigger `updated_at`.
- `contatos` entra agora porque é aditiva e trivial, e assim a F4/S8 não precisa de outra sessão presencial (DL-047).
- Supabase Storage: bucket `documentos` privado + policies (só o dono e o admin leem).
- **Antes de tudo:** backup do banco. Migration aditiva, nunca destrutiva.
- 🔴 **Sessão presencial obrigatória** (Elber aplica).

### S2 — Onboarding que persiste
- Onboarding do veterinário grava em `vet_profiles` (CRMV, especialidades, cidades, bio, foto).
- Onboarding do estabelecimento grava em `clinic_profiles` (CNPJ, endereço, serviços, horários).
- Onboarding do responsável grava nome/cidade em `profiles`.
- Upload de documento pro Storage com validação de tipo e tamanho.
- Ao concluir: `status` vai de `incomplete` → `pending_validation` **no servidor**.

### S3 — Portão de status
- `middleware.ts` reescrito: isolamento de role por prefixo de rota + bloqueio por `status`.
  - vet/estabelecimento com `status != active` → `/app/<painel>/aguardando`.
  - **Corrige o furo atual (R-001):** hoje um responsável logado alcança `/app/veterinario/*`.
  - Limpa o resíduo do R-002: código morto `NAV_BY_ROLE["master"]` e o `admin_level ?? "admin"` de `set-access`.
  - Codifica a matriz de `docs/06-PERMISSOES.md` §2 e §4, célula por célula.
- Editores de perfil (`/app/*/perfil`) carregam e salvam de verdade.

### S4 — Validação real pelo admin
- `/admin/validacoes` lê a fila real (`status = pending_validation`).
- Detalhe da validação: vê os dados, abre o documento (URL assinada), aprova ou reprova com motivo.
- Aprovar → `status = active` + email de aprovação. Reprovar → volta pra `incomplete` + email com o motivo.
- `audit_logs`: toda ação de admin fica registrada.

### ✅ Definition of Done da F3 (verificável, não opinião)
1. Cadastro novo de veterinário → onboarding preenchido → sair e voltar → **os dados estão lá**.
2. Esse veterinário vê a tela "aguardando" e **não consegue** entrar no dashboard.
3. Admin aprova → o veterinário entra no dashboard e recebe o email.
4. Um responsável logado que digite `/app/veterinario` é redirecionado.
5. Teste E2E cobrindo 1–4 passando em CI.
6. Relatório de segurança da fase sem achado 🔴 aberto.

---

## FASE 4 — MOTOR B2C (S5–S8)

**Objetivo:** o tutor encontra e fala com o profissional. É aqui que a Vetria vira Vetria.

### S5 — Dados de busca
- Tabelas de apoio: `especialidades`, `cidades`, `servicos` (seed real, não mock).
- `slug` único e estável por perfil (regra decidida e registrada em `05-DECISOES.md`).
- Índices Postgres + full-text search em português.

### S6 — `/buscar`
- Filtros: cidade + especialidade + tipo de atendimento. Ordenação definida.
- **Filtro de visibilidade no backend**, nunca no front: `role IN (vet, clinic) AND status = active`.
- Cards de resultado, paginação, estado vazio honesto, responsivo.
- Busca da Home passa a levar pra `/buscar` de verdade.

### S7 — Perfil público
- `/veterinario/[slug]` e `/estabelecimento/[slug]` com dados reais.
- SSR + metadata dinâmica (OG tags, title, description) para SEO.
- `noindex` automático em quem não está `active`.
- 404 correto pra slug inexistente.

### S8 — Contato
- CTA WhatsApp com mensagem pré-preenchida.
- Cada clique registra em `contatos` (quem, pra quem, quando).
- `/app/responsavel/historico` passa a listar contatos reais. **Atenção:** hoje essa tela promete "Seus agendamentos" e desenha cards de consulta. Agendamento está fora dos 3 meses, então ela precisa virar "Seus contatos" (DL-047).
- Painel do profissional mostra contagem real de contatos recebidos.

### ✅ Definition of Done da F4
1. Buscar "São Paulo + Clínica geral" retorna **só** profissionais `active`.
2. Um profissional `pending_validation` **não aparece** em nenhuma busca nem tem perfil público acessível.
3. Clicar no card abre o perfil público com dado real, indexável pelo Google.
4. Clicar em WhatsApp abre a conversa **e** o contato aparece no histórico do responsável.
5. E2E do fluxo busca → perfil → contato passando em CI.

---

## FASE 5 — VENDA (S9–S10)

**Objetivo:** o funil comercial que o `Coração Cerne do Projeto` descreve.

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

### S11 — Segurança + LGPD
- Auditoria completa de RLS: **toda** tabela com policy testada.
- Consentimento de dados no cadastro (aceite versionado e registrado).
- Exclusão de conta (soft delete + anonimização) e exportação de dados do titular.
- Política de Privacidade e Termos de Uso publicados.
- Headers de segurança, rate limit nos endpoints sensíveis, varredura de segredos.
- Branch `main` protegida no GitHub.

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

> **Regra de não-deriva:** nenhuma task entra na fila da semana sem apontar pra uma
> capacidade E1–E6 do escopo. Ideia boa que não aponta vai pra `04-RISCOS.md` §Ideias
> e espera o mês 4.
