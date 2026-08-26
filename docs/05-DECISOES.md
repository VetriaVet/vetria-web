# 05 — DECISÕES DE ARQUITETURA (DL-041+)

> Continuação do decision log. **DL-001 a DL-040 estão em `CONTEXT.md`** (congelado, leitura histórica).
> Toda decisão nova entra aqui, numerada em sequência.

## Quando registrar um DL

**Registra:** decisão arquitetural, padrão que passa a valer pra frente, bug resolvido com
causa não óbvia, trade-off aceito de propósito, descoberta que muda tasks futuras.

**Não registra:** mudança visual simples, ajuste de copy, correção de typo, bump de dependência
sem impacto. Isso vira só o campo "Resultado" do card em `03-TAREFAS.md`.

## Formato

```
### DL-NNN — <título>
**Data:** DD/MM/AAAA · **Fase/Task:** F3/S2 · T-00N · **Commit:** hash
**Contexto:** o que estava acontecendo, em 2 a 4 frases factuais.
**Decisão:** o que foi decidido, no passado, sem floreio.
**Alternativas descartadas:** o que também foi considerado e por que não.
**Implicações:** o que isso obriga ou impede daqui pra frente.
**Status:** ✅ aplicada / 🔵 em andamento / ⚠️ revogada por DL-NNN
```

---

### DL-041 — Governança por documentos + agentes especializados, e não por sessão
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · T-000
**Contexto:** o projeto entrou em janela de entrega de 3 meses com escopo real ainda por
construir (o app era casca visual). O modelo anterior dependia de um "Chat 2 gerador de
prompts" descrito no `HANDOFF.md` e de dois arquivos que cresceram demais: `CONTEXT.md`
(1043 linhas misturando estado, log e regra) e `BACKLOG.md` (32 KB, quase tudo já feito).
Toda sessão nova precisava reler tudo e ainda assim ficava com estado desatualizado.
**Decisão:** o estado do projeto passa a viver em `docs/`, dividido por função —
escopo congelado, plano, estado, fila, riscos, decisões. O trabalho passa a ser feito por
6 agentes especializados versionados em `.claude/agents/`, e não por prompt colado a cada
sessão. O contrato entre eles é o handoff obrigatório descrito em `docs/AGENTES.md`.
`CONTEXT.md` e `BACKLOG.md` viram históricos congelados.
**Alternativas descartadas:** (a) continuar com `CONTEXT.md` crescendo — já havia falhado,
o arquivo era grande demais pra ser lido de fato a cada sessão; (b) um único agente
generalista — perde o valor do olhar adversarial de segurança e QA sobre o próprio trabalho.
**Implicações:** toda task passa a exigir um card com capacidade E1–E6 declarada; toda task
termina com atualização de `02-ESTADO.md` e `03-TAREFAS.md`; agentes auditores nunca
escrevem código de produção, só relatório. A separação entre quem escreve e quem audita é
o que permite rodar em paralelo sem colisão no repositório.
**Status:** ✅ aplicada

---

### DL-042 — Separação escritores × auditores como modelo de paralelismo
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · T-000
**Contexto:** o pedido era ter agentes de segurança, UX e QA trabalhando "simultaneamente"
com os agentes de funcionalidade. Vários agentes escrevendo na mesma árvore de arquivos ao
mesmo tempo produz conflito de merge, sobrescrita e trabalho perdido.
**Decisão:** dois grupos com direitos diferentes.
**Escritores** (`vetria-backend`, `vetria-ui`, `vetria-escriba`) tocam o repositório, um de
cada vez, seguindo a fila. **Auditores** (`vetria-seguranca`, `vetria-qa`) são somente
leitura: rodam a qualquer momento, em paralelo com qualquer coisa, e a saída deles é um
relatório em `docs/relatorios/`. Achado de auditor não é corrigido pelo auditor — vira card
na fila e é executado por um escritor.
**Alternativas descartadas:** git worktree por agente — resolveria a colisão, mas o custo de
merge de N branches simultâneas num projeto de uma pessoa só é maior que o ganho.
**Implicações:** o paralelismo real é auditoria × execução, não execução × execução. Isso é
suficiente, porque auditoria é justamente o trabalho que trava quando fica pra depois.
**Status:** ✅ aplicada

---

### DL-043 — Rotas em português, roles em inglês (registro de decisão herdada)
**Data:** 26/08/2026 (registro) · **Decisão original:** commit `b815ca5`
**Contexto:** o commit `b815ca5` renomeou a nomenclatura visível — tutor virou responsável,
clínica virou estabelecimento, pet virou animais — incluindo as rotas
(`/app/responsavel`, `/app/veterinario`, `/app/estabelecimento`). Os valores da coluna
`profiles.role` **não** foram renomeados: continuam `tutor`, `vet`, `clinic`.
**Decisão:** manter assim. Rota é interface, role é dado. Renomear enum em produção exige
migration de dados com janela de risco e não entrega valor nenhum ao usuário.
**Implicações:** todo código que compara role compara com o valor em inglês. Todo link e
toda URL usa português. Quem confundir os dois cria bug silencioso de roteamento — é o erro
mais provável pra quem chega novo no projeto, e está sinalizado em `02-ESTADO.md`.
**Status:** ✅ aplicada
