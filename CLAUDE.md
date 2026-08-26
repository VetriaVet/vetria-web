# CLAUDE.md — instruções permanentes deste repositório

> Carregado automaticamente em toda sessão. Mantenha curto: é ponteiro, não conteúdo.

> ⚠️ **Se você está lendo isto, a sessão abriu na pasta certa.** Confirme com `/agents`:
> `vetria-maestro`, `vetria-backend`, `vetria-ui`, `vetria-seguranca`, `vetria-qa` e
> `vetria-escriba` precisam aparecer. Se não aparecerem, a sessão foi aberta na pasta de
> cima (`Desktop/Vetria`) e o sistema de governança está desligado. Ver R-013.

## Comece sempre por aqui

1. [`docs/02-ESTADO.md`](docs/02-ESTADO.md) — onde o projeto está hoje
2. [`docs/03-TAREFAS.md`](docs/03-TAREFAS.md) — a fila e o card da task
3. [`HANDOFF.md`](HANDOFF.md) — o protocolo completo de entrada

**Não invente task.** Pegue um card da fila. Não tem card? Peça ao agente `vetria-maestro`.

## Escopo

Contrato congelado em [`docs/00-ESCOPO.md`](docs/00-ESCOPO.md). Entrega: **25/11/2026**.
Toda task aponta pra uma capacidade **E1–E6**. Sem capacidade, não entra.

**Fora dos 3 meses:** Stripe, avaliações, agenda, favoritos, equipe, mapa, chat, mobile.
Ideia fora de escopo vai pra `docs/04-RISCOS.md` §Ideias e espera o mês 4.

## Agentes

`.claude/agents/`: `vetria-maestro`, `vetria-backend`, `vetria-ui`, `vetria-seguranca`,
`vetria-qa`, `vetria-escriba`. Contrato entre eles em [`docs/AGENTES.md`](docs/AGENTES.md).

Escritores (backend, ui, escriba, maestro) trabalham **um de cada vez**.
Auditores (seguranca, qa) são somente leitura e rodam **em paralelo com qualquer coisa**.

## Semáforo de autonomia

🟢 visual/copy/docs, até 3 arquivos, build verde → commita.
🟡 `lib/`, `middleware.ts`, `/api/*`, config, `components/`, dependência nova, >3 arquivos → diff e espera aprovação.
🔴 migration, RLS, auth, `.env`, Stripe, destrutivo → **recusa autônomo**, pede sessão presencial.
🟠 escopo ambíguo → pergunta antes.

## Armadilhas específicas deste projeto

- **Rota em português, role em inglês** (DL-043). URLs: `/app/responsavel`, `/app/veterinario`, `/app/estabelecimento`. Valores em `profiles.role`: `tutor`, `vet`, `clinic`. **Não renomeie o enum.**
- **Tailwind v4 sem `tailwind.config`.** Tokens ficam em `app/globals.css` via `@theme inline`.
- **Inter é a única fonte** (DL-032). Serif foi tentada e revertida.
- **Toda função usada em policy de RLS** precisa ser `SECURITY DEFINER` + `SET search_path = public` (DL-014/015). `SECURITY INVOKER` já causou recursão infinita e derrubou o banco.
- **Não envolva `redirect()` em `try/catch`** dentro de Server Action: engole o `NEXT_REDIRECT` (DL-016).
- **`dangerouslyAllowSVG` está ligado** no `next.config.ts` e é necessário pra logo (DL-040). **Nunca** sirva SVG de origem de usuário por `next/image`.
- **Sem travessão (em dash) em texto visível ao usuário** (DL-038).
- **Nada de dado falso em tela de produção.** Estado vazio honesto, nunca "Dra. Maria Silva".

## Ao terminar qualquer task

Escreva o handoff no formato de `docs/AGENTES.md` e preencha o campo **Resultado** do card
em `docs/03-TAREFAS.md`. Task sem handoff escrito não está concluída.

## Comandos

```bash
npm run dev      # desenvolvimento
npm run build    # obrigatório verde antes de qualquer push
npm run lint
```

## Arquivos congelados (leitura histórica, não escreva neles)

`CONTEXT.md` (DL-001 a DL-040) · `BACKLOG.md` (TASK-001 a 039) · `docs/historico/`
