# HANDOFF — COMO ENTRAR NESTE PROJETO

> **Leia isto primeiro.** Vale pra qualquer sessão do Claude Code, qualquer agente,
> qualquer pessoa, em qualquer máquina. Substitui o handoff antigo (modelo "Chat 2
> gerador de prompts"), arquivado em `docs/historico/HANDOFF-v1-abril2026.md`.

---

> ## ⚠️ ABRA A SESSÃO NA PASTA CERTA
>
> O Claude Code carrega os agentes de `.claude/agents/` **relativo à pasta onde a
> sessão foi aberta**. Abrir em `Desktop/Vetria` (a pasta de cima) faz os 6 agentes
> do projeto **não existirem**, e o `CLAUDE.md` não ser lido.
>
> ```
> cd "C:/Users/Elber Desinger/Desktop/Vetria/Vetria Brasil"
> claude
> ```
>
> Como conferir: digite `/agents`. Se `vetria-maestro` não aparecer na lista, você
> está na pasta errada. A pasta de cima só guarda marca, copies `.docx` e imagens.

---

## 📋 PROMPT PRA COLAR NUMA SESSÃO NOVA

Primeiro, abra na pasta certa e confirme com `/agents` que os 6 aparecem.
Depois cole **uma** destas linhas. O `CLAUDE.md` carrega sozinho e faz o resto.

**Dia a dia:**
```
Leia docs/02-ESTADO.md e docs/03-TAREFAS.md. Me diga onde paramos e qual é o próximo card. Não invente task.
```

**Abrir a semana formalmente:**
```
Use o agente vetria-maestro pra abrir a semana.
```

**Quando algo parecer errado ou desatualizado:**
```
Leia docs/02-ESTADO.md, rode git log --oneline -15 e git status, e me diga se a documentação bate com o código. Se não bater, o código é a verdade.
```

**Retomar uma task que ficou pela metade:**
```
A task T-NNN ficou 🔵 em execução. Leia o card em docs/03-TAREFAS.md, confira no git o que já entrou, e continue daquele ponto sem refazer o que já está feito.
```

---

## EM 30 SEGUNDOS

**Vetria** é um marketplace que conecta responsáveis por animais a veterinários e
estabelecimentos. Estilo Doctoralia, foco 100% veterinário.
Responsáveis entram de graça pra resolver um problema. Profissionais pagam pra serem
encontrados.

**Onde estamos:** o app está no ar em `vetriabrasil.com.br`, com login real e ~45 telas
prontas. Mas quase nada persiste dado ainda. As próximas 13 semanas existem pra mudar isso.

**Prazo:** 25/11/2026. Escopo **fechado** e congelado.

---

## LEIA NESTA ORDEM

| # | Arquivo | Pra quê |
|---|---|---|
| 1 | [`docs/02-ESTADO.md`](docs/02-ESTADO.md) | Onde o projeto está **hoje**. Sempre comece aqui. |
| 2 | [`docs/03-TAREFAS.md`](docs/03-TAREFAS.md) | Qual é a próxima task e qual é o card dela |
| 3 | [`docs/00-ESCOPO.md`](docs/00-ESCOPO.md) 🔒 | O que foi contratado. O que **não** entra. |
| 4 | [`docs/01-PLANO.md`](docs/01-PLANO.md) | As 13 semanas e o Definition of Done de cada fase |
| 5 | [`docs/04-RISCOS.md`](docs/04-RISCOS.md) | Bugs conhecidos, dívidas e o que já sabemos que vai doer |
| 6 | [`docs/AGENTES.md`](docs/AGENTES.md) | Quem faz o quê e o formato de handoff |

Decisões antigas: `docs/05-DECISOES.md` (DL-041+) e `CONTEXT.md` (DL-001 a DL-040, congelado).

---

## AS 6 CAPACIDADES CONTRATADAS

Toda task aponta pra uma delas. **Task sem capacidade não entra na fila.**

| | Capacidade |
|---|---|
| **E1** | Núcleo de dados (schema, RLS, storage) |
| **E2** | Onboarding que persiste de verdade |
| **E3** | Validação de profissional pelo admin |
| **E4** | Busca pública funcionando |
| **E5** | Perfil público + contato |
| **E6** | Landing pages de valor e de preço |

**Fora dos 3 meses:** Stripe, avaliações, agenda, favoritos, equipe, mapa, chat, app mobile.
Ver `docs/00-ESCOPO.md` §3.

---

## OS 6 AGENTES

Definidos em `.claude/agents/`, versionados no git. Invoque pelo nome.

| Agente | Papel | Escreve? |
|---|---|---|
| 🧭 `vetria-maestro` | Abre e fecha semana e fase, guarda o escopo | só `docs/` |
| ⚙️ `vetria-backend` | Banco, migrations, RLS, servidor, autorização | sim |
| 🎨 `vetria-ui` | Telas, design system, responsivo, acessibilidade, copy | sim |
| 🔒 `vetria-seguranca` | Auditoria de segurança e LGPD | **não**, só relatório |
| 🧪 `vetria-qa` | Testes E2E, varredura de bug, previsão de bug futuro | só `tests/` |
| ✍️ `vetria-escriba` | Mantém a doc fiel ao código | só `docs/` |

**Escritores trabalham um de cada vez. Auditores rodam em paralelo com qualquer coisa** —
eles não escrevem no mesmo lugar, então não colidem.

---

## O SEMÁFORO DE AUTONOMIA

| | Nível | O quê | Como age |
|---|---|---|---|
| 🟢 | **VERDE** | Visual, copy, docs, asset. Até 3 arquivos. | Build verde → commita direto |
| 🟡 | **AMARELO** | `lib/`, `middleware.ts`, `/api/*`, config, `components/`, dependência nova, mais de 3 arquivos | Mostra o diff, **espera aprovação** |
| 🔴 | **VERMELHO** | Migration, RLS, lógica de auth, `.env`, Stripe, qualquer coisa destrutiva | **Recusa autônomo.** Pede sessão presencial com o Elber |
| 🟠 | **LARANJA** | Escopo ambíguo, ou a realidade do código contradiz o plano | Pergunta antes de começar |

---

## AS 10 REGRAS

1. **Auditar antes de modificar.** O código é a verdade, a doc é a intenção.
2. **Build verde antes de push.** Falhou, não sobe.
3. **Não inventar feature.** Não está no escopo nem no card? Pergunta.
4. **Backend valida tudo.** RBAC, status, visibilidade: sempre no servidor.
5. **Migration é sempre aditiva.** `DROP` exige backup e sessão presencial.
6. **Nenhum segredo no repositório.** Nem em teste, nem em doc, nem em commit.
7. **Respeitar o semáforo.**
8. **Task que cresce, para.** Marca ⏸️, escreve o que descobriu, pergunta.
9. **Sem travessão em texto visível** (DL-038).
10. **Rota em português, role em inglês** (DL-043). Rotas: `responsavel`, `veterinario`, `estabelecimento`. Roles no banco: `tutor`, `vet`, `clinic`. Confundir quebra roteamento em silêncio.

---

## COMEÇAR E TERMINAR

**Começar:** leia `docs/02-ESTADO.md` e `docs/03-TAREFAS.md`. Rode `git log --oneline -10`
e `git status` pra ver o que de fato entrou. Pegue **um** card. Não invente task.

**Terminar:** escreva o handoff no formato de `docs/AGENTES.md` e preencha o campo
**Resultado** do card. **Task sem handoff escrito não está concluída** — porque daqui a
seis semanas ninguém vai lembrar, e o custo de reconstruir contexto é uma sessão inteira.

---

## STACK

Next.js 16 (App Router) · React 19 · Tailwind v4 (`@theme inline` em `app/globals.css`,
**sem `tailwind.config`**) · Inter única · `lucide-react` · Supabase (Auth + Postgres +
Storage) · Resend como SMTP do Supabase · Vercel (deploy em push na `main`) ·
Playwright + GitHub Actions (a instalar na S1).

## CONVENÇÃO DE COMMIT

```
tipo(escopo): descrição curta no imperativo

tipos:  feat · fix · refactor · style · docs · chore · test
escopos: auth · cadastro · onboarding · responsavel · veterinario ·
         estabelecimento · admin · busca · perfil · api · db · email · ui
```
