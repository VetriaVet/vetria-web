# AGENTES — QUEM FAZ O QUÊ E COMO SE ENTENDEM

> As definições executáveis estão em `.claude/agents/*.md` e são versionadas no git —
> funcionam em qualquer sessão, em qualquer máquina, sem depender de prompt colado.
> Este arquivo é o **contrato** entre eles.

---

## O ELENCO

| Agente | Papel | Escreve no repo? | Quando roda |
|---|---|---|---|
| 🧭 **vetria-maestro** | Abre e fecha semana e fase. Escolhe a próxima task. Guarda o escopo. | Só `docs/` | Segunda e fim de fase |
| ⚙️ **vetria-backend** | Dados, migrations, server actions, RLS, APIs, middleware | Sim | Tasks de E1–E5 |
| 🎨 **vetria-ui** | Telas, design system, responsivo, acessibilidade, copy | Sim | Tasks de UI e E6 |
| 🔒 **vetria-seguranca** | Auditoria de RLS, RBAC, LGPD, segredos, superfície de ataque | **Não** — só relatório | Quarta, e antes de toda migration |
| 🧪 **vetria-qa** | Testes E2E, varredura funcional, caça a bug presente e futuro | Só `tests/` | Quinta, e ao fim de cada task |
| ✍️ **vetria-escriba** | Mantém `docs/` fiel à realidade do código | Só `docs/` | Sexta, e ao fim de cada bloco |

**Escritores:** maestro, backend, ui, escriba — **um de cada vez**.
**Auditores:** seguranca, qa — **paralelos a qualquer coisa, sempre**.

Essa divisão é o que permite trabalho simultâneo sem conflito no repositório (DL-042).

---

## O HANDOFF (o contrato que amarra tudo)

Todo agente **abre** e **fecha** do mesmo jeito. Sem exceção. É isso que faz uma sessão
nova, daqui a 6 semanas, conseguir continuar de onde parou.

### Abertura — o que todo agente lê antes de qualquer coisa

1. `docs/02-ESTADO.md` — onde estamos **hoje**
2. `docs/03-TAREFAS.md` — qual é a task e qual é o card dela
3. `docs/00-ESCOPO.md` — isso está dentro do contratado?
4. `docs/04-RISCOS.md` — já sabemos de algo que atrapalha isso?
5. O que for específico do papel (o agente sabe o que é)

Se a task pedida **não tem card** em `03-TAREFAS.md`, o agente não começa. Pede o card.

### Fechamento — o que todo agente entrega, sempre

```markdown
## HANDOFF — <AGENTE> — T-NNN — DD/MM/AAAA

**Fiz:** o que mudou de verdade, com arquivo:linha
**Não fiz:** o que estava no card e ficou de fora, e por quê
**Estado agora:** o que passou a funcionar / o que quebrou / o que continua casca
**Descobri:** o que ninguém sabia antes desta task
**Bloqueios:** o que impede o próximo passo
**Próximo passo óbvio:** a única coisa que faz sentido fazer em seguida
**Docs que atualizei:** lista
**Commits:** hashes
```

Esse bloco vai (a) na resposta ao humano e (b) no campo **Resultado** do card em
`03-TAREFAS.md`. **Task sem handoff escrito não está concluída.**

---

## AS REGRAS QUE TODO AGENTE OBEDECE

Herdadas do `HANDOFF.md` histórico e do `CONTEXT.md` §7 — elas continuam valendo.

1. **Auditar antes de modificar.** Lê o estado real do código antes de propor mudança. O que a doc diz pode estar errado; o que o código faz é o que é.
2. **Build verde antes de push.** Falhou, não sobe. Avisa.
3. **Não inventar feature.** Não está no `00-ESCOPO.md` nem no card? Pergunta.
4. **Backend valida tudo.** RBAC, status, visibilidade na busca: sempre no servidor. Nunca confiar no front.
5. **Migration é sempre aditiva.** `DROP` exige backup e sessão presencial.
6. **Nenhum segredo no repositório.** Nem em código, nem em teste, nem em doc, nem em mensagem de commit.
7. **Respeitar o semáforo.** 🟢 commita, 🟡 mostra diff e espera, 🔴 recusa e pede sessão presencial.
8. **Task que cresce, para.** Descobriu que é maior que o card? Marca ⏸️, escreve o que descobriu, pergunta. Não empurra com a barriga.
9. **Sem travessão no texto visível ao usuário** (DL-038).
10. **Rota em português, role em inglês** (DL-043). Confundir isso quebra roteamento em silêncio.

---

## COMO OS ACHADOS CIRCULAM

```
  vetria-seguranca ──┐
                     ├──> docs/relatorios/<TIPO>-AAAA-MM-DD.md
  vetria-qa ─────────┤          │
                     │          ├──> achado 🔴/🟠 vira card em 03-TAREFAS.md
  vetria-ui ─────────┘          └──> tudo vai pro 04-RISCOS.md
                                            │
                                            v
                              vetria-maestro prioriza na semana
                                            │
                                            v
                          vetria-backend / vetria-ui executam
                                            │
                                            v
                                  vetria-escriba sincroniza docs
```

> ### Correção de segurança volta pra revisão. Sempre.
>
> Na migration `0002` foram **quatro rodadas**, e em todas houve achado nascido da
> correção anterior. Um deles teria desligado a busca pública inteira sem aparecer em
> nenhum teste feito com usuário logado.
>
> **Não existe "já corrigi, pode aplicar".** Corrigiu achado 🔴 ou 🟠? Volta pro auditor.
> A rodada seguinte é barata; o furo que passa, não.

**Auditor nunca conserta o que encontrou.** Quem audita e conserta ao mesmo tempo perde a
capacidade de enxergar o próprio erro.

---

## COMO INVOCAR

Numa sessão do Claude Code, dentro deste repositório:

```
Use o agente vetria-maestro pra abrir a semana.
Use o agente vetria-seguranca pra auditar as policies da migration 0002.
Use o agente vetria-qa pra varrer o fluxo de onboarding do veterinário.
Use o agente vetria-ui pra construir a tela de resultados da busca.
Use o agente vetria-escriba pra fechar a semana.
```

Auditores podem ser disparados **junto** com trabalho de execução — eles não escrevem no
mesmo lugar. Escritores, um de cada vez.

---

## O CICLO DA SEMANA

| Dia | Ação | Agente |
|---|---|---|
| **Segunda** | Abre a semana. Lê estado, checa o DoD da fase, monta a fila em `03-TAREFAS.md`. | 🧭 maestro |
| **Terça a quinta** | Executa a fila, um card por vez, cada um com handoff. | ⚙️ backend / 🎨 ui |
| **Quarta** | Varredura de segurança do que entrou. | 🔒 seguranca |
| **Quinta** | Varredura de QA + testes E2E do que entrou. | 🧪 qa |
| **Sexta** | Achados viram card. `02-ESTADO.md` reescrito. Commit de fechamento. | ✍️ escriba |
| **Fim de fase** | Confere o Definition of Done item por item. Não passa sem passar. | 🧭 maestro |

---

## SE UMA SESSÃO CAIR NO MEIO

O card em `03-TAREFAS.md` fica marcado 🔵 com o que já foi feito. A sessão seguinte:

1. Lê `02-ESTADO.md` e `03-TAREFAS.md`
2. Roda `git log --oneline -10` e `git status` pra ver o que de fato entrou
3. Compara com o card: o que já está feito, o que falta
4. Continua **daquele ponto**, sem recomeçar e sem refazer

É por isso que o handoff é obrigatório mesmo em task pequena. O custo dele é de 2 minutos.
O custo de não ter é uma sessão inteira de arqueologia.
