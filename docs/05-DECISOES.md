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

---

### DL-044 — Busca e perfil público são abertos; "1 usuário = 1 role" continua absoluto
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · pré-T-001
**Contexto:** um veterinário que tem animal em casa também é consumidor da busca. A regra
"1 usuário = 1 role permanente" sustenta todo o RBAC atual, e afrouxá-la multiplicaria a
superfície de vazamento entre painéis, que é justamente onde mora a diferença entre os
planos vendidos. Por outro lado, exigir uma segunda conta por email diferente é atrito real.
**Decisão:** a busca, os perfis públicos e o evento de contato são **abertos a qualquer um**,
logado ou não, com qualquer role. O que nenhum profissional ganha é o **painel** do
responsável. O princípio "1 usuário = 1 role" fica intacto porque ele governa o painel, e o
painel é onde vive o benefício pago.
**Alternativas descartadas:** (a) exigir conta separada — atrito sem ganho, já que a busca é
pública por definição; (b) conta dupla com troca de contexto — quebra o RBAC inteiro.
**Implicações:** o `middleware.ts` isola painéis por prefixo de rota, mas **não** protege
`/buscar` nem os perfis públicos. A matriz completa está em `docs/06-PERMISSOES.md` §2.
**Status:** ✅ aplicada

### DL-045 — Admin comum opera, master governa
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · pré-T-001
**Contexto:** o modelo tinha `admin_level` mas nunca foi definido o que separa os dois
níveis. Com a validação de CRMV e CNPJ entrando na F3/S4, isso vira decisão bloqueante:
alguém precisa aprovar profissionais sem ser o dono da plataforma.
**Decisão:** **admin comum** vê a fila, aprova, reprova e modera. **Só o master** vê a base
inteira, concede ou remove role, promove admin, suspende conta e lê os `audit_logs`.
**Alternativas descartadas:** (a) só master aprova — o Elber vira gargalo de toda entrada de
profissional; (b) admin comum faz tudo menos mexer em role — suspender conta paga é poder
demais pra nível operacional.
**Implicações:** `/admin/usuarios` continua exclusivo do master (já é assim no código).
`/admin/validacoes` passa a aceitar admin comum. Toda ação de admin, master incluído, entra
em `audit_logs`. Matriz em `docs/06-PERMISSOES.md` §5.
**Status:** ✅ aplicada

### DL-046 — Profissional em `pending_validation` edita o perfil enquanto espera
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · pré-T-001
**Contexto:** definir o que o profissional alcança entre concluir o onboarding e ser
aprovado. Travar tudo é seguro e faz o profissional sumir; liberar o painel inteiro em
modo leitura exige checagem de status em cada tela, e uma esquecida vaza funcionalidade paga.
**Decisão:** com `status = 'pending_validation'` ele alcança **apenas** `/aguardando`,
`/perfil` e `/configuracoes`. Todo o resto do painel é bloqueado **no servidor**.
**Alternativas descartadas:** painel inteiro navegável com faixa de aviso — o custo de
garantir isso em toda tela nova, por 12 semanas, é alto demais pro ganho.
**Implicações:** o bloqueio vive no `middleware.ts` por prefixo de rota, não espalhado por
página, justamente pra não depender de disciplina humana (é a lição do R-001). Continuar
editando o perfil enquanto espera acelera a aprovação e prepara a gamificação do briefing.
**Status:** ✅ aplicada

### DL-047 — O contato é evento de servidor, e o cadastro vem depois do valor entregue
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · pré-T-001
**Contexto:** o padrão óbvio pro CTA de WhatsApp seria um link `wa.me` direto. Isso teria
três consequências: o telefone de todo profissional ficaria no HTML e raspável por qualquer
concorrente; a plataforma não teria como provar valor pro profissional que paga; e o tutor
sairia sem deixar rastro. Por outro lado, exigir cadastro antes do contato contradiz o
briefing aprovado (`Coração Cerne do Projeto`: "Cadastro ≠ Benefício") e mataria a conversão
no pico de intenção.
**Decisão:** o clique é um **POST no servidor**. O servidor grava em `contatos` e só então
devolve o número e redireciona. Funciona **anônimo**, identificado por cookie primário
`httpOnly` com UUID aleatório. O número aparece na hora, sem pedir nada; **na mesma tela**,
abaixo dele, vem o convite de cadastro com "agora não" visível. Convite, nunca portão. Se a
pessoa criar conta depois, os contatos anônimos são vinculados por `anon_id`.
**Alternativas descartadas:** (a) link `wa.me` direto — expõe a base de telefones e destrói
a métrica que sustenta o preço do plano; (b) pedir dados antes de revelar o número —
contraria o briefing e derruba conversão; (c) identificar por IP — o NAT das operadoras
agrupa milhares de pessoas sob o mesmo IP, e IP é dado pessoal pela LGPD, então o custo de
conformidade sobe para uma precisão pior.
**Implicações:** `contatos` entra na migration 0002 com `user_id` **nulável** e `anon_id`.
Nasce com a coluna `canal` (`whatsapp` agora; `telefone` e `agendamento` depois) para que a
integração de agendamento do mês 5+ seja aditiva em vez de reescrita — **isso não traz a
feature pro escopo, só não fecha a porta**. Consequência de escopo: a tela
`/app/responsavel/historico` hoje promete "Seus agendamentos" e precisa virar "Seus
contatos", porque agendamento está fora dos 3 meses.
**Status:** ✅ aplicada
