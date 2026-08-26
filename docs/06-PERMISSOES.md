# 06 — MATRIZ DE PERMISSÕES E BENEFÍCIOS

> **Fonte única da verdade sobre quem acessa o quê.**
> Toda policy de RLS, todo guard do `middleware.ts` e todo `requirePainel` codificam
> **este** documento. Se código e matriz divergirem, o código está errado.
>
> **Isolamento de role aqui não é tema de segurança, é o modelo de negócio.**
> Cada tipo de conta compra um benefício diferente. Funcionalidade que vaza de um
> painel pro outro não é bug: é receita perdida e é a razão de existir de dois planos
> desaparecendo ao mesmo tempo.
>
> **Criado:** 26/08/2026 · **Decisões:** DL-044 a DL-047

---

## 1. OS ATORES

| # | Ator | `role` | `admin_level` | Paga? | O que compra |
|---|---|---|---|---|---|
| 0 | **Visitante** | — (anônimo) | — | não | Nada. É a porta de entrada. Busca e contata sem conta. |
| 1 | **Responsável** | `tutor` | `null` | **nunca** | Organização: os profissionais que contatou, seus animais. É a isca do efeito de rede, não o cliente. |
| 2 | **Veterinário** | `vet` | `null` | sim (mês 4+) | **Exposição na busca** e os contatos que ela gera. |
| 3 | **Estabelecimento** | `clinic` | `null` | sim, tier maior (mês 4+) | Exposição institucional, e na V2 a gestão de equipe. |
| 4 | **Admin** | `admin` | `admin` | — | Operação: valida, aprova, reprova, modera. |
| 5 | **Master** | `admin` | `master` | — | Governo: concede role, suspende conta, vê a base inteira. |

> ⚠️ **`master` NÃO é um `role`.** É `role = 'admin'` **+** `admin_level = 'master'`.
> O código já funciona assim (`app/api/admin/*` autoriza por `admin_level === 'master'`).
> A documentação antiga (`CONTEXT.md` §4.1) dizia que era role e estava errada.
> Ver **R-002**.
>
> ✅ **Confirmado por introspecção em 26/08/2026:** o enum `admin_level` é
> `('none', 'admin', 'master')`. **`comum` não existe.** O `CONTEXT.md` §4.2 estava errado,
> e `set-access/route.ts:66` escreve um valor válido. O R-002 item 3 é improcedente.

---

## 2. MATRIZ DE ROTAS

`✅` acessa · `❌` bloqueado no servidor · `🔶` acessa com restrição

| Rota | Visitante | Responsável | Vet | Estab. | Admin | Master |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `/` (Home + busca) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/buscar` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/veterinario/[slug]`, `/estabelecimento/[slug]` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| LPs de valor e de preço | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/login`, `/cadastro/*` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/app/responsavel/**` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/app/veterinario/**` | ❌ | ❌ | 🔶 | ❌ | ❌ | ❌ |
| `/app/estabelecimento/**` | ❌ | ❌ | ❌ | 🔶 | ❌ | ❌ |
| `/admin` (visão geral) | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/admin/validacoes` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/admin/moderacao`, `/admin/conteudo` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `/admin/usuarios` (RBAC) | ❌ | ❌ | ❌ | ❌ | **❌** | ✅ |

🔶 = sujeito ao portão de status (§4).

> **A busca e o perfil público são abertos a todos, logado ou não** (DL-044).
> Um veterinário com um cachorro em casa pesquisa e contata normalmente. O que ele
> **não** ganha é o painel do responsável. O princípio "1 usuário = 1 role permanente"
> continua absoluto, e o benefício pago de cada lado fica intacto.

---

## 3. MATRIZ DE DADOS (a intenção que a RLS codifica)

| Dado | Quem lê | Quem escreve |
|---|---|---|
| `profiles` (linha própria) | o dono, admin, master | o dono (campos limitados), master |
| `profiles.role` / `admin_level` | o dono, admin, master | **só master**, e só via `/api/admin/set-access` |
| `profiles.status` | o dono, admin, master | **só admin e master**. Nunca o próprio usuário. |
| `vet_profiles` / `clinic_profiles` | **público, apenas se `role` bate E `status='active'`**; sempre o dono; admin e master | o dono (menos `slug`), admin (moderação), master |
| `perfil_privado` (whatsapp, telefone, email, documento) | **só o dono e admin/master. Nunca anônimo, nunca outro usuário.** | o dono |
| Documento no Storage | **só o dono e admin/master**, por URL assinada de vida curta | o dono, e o caminho tem que começar com o próprio uuid |
| `contatos` | o responsável que originou, o profissional que recebeu, admin, master | o servidor (nunca o cliente direto) |
| `audit_logs` | **só master** | só o servidor |

**Regras que não se negociam:**

1. **`status` nunca é escrito pelo próprio usuário.** Se um veterinário conseguir se marcar `active`, ele aparece na busca sem validação e sem pagar. Isso é o modelo de negócio inteiro contornado por um `UPDATE`.
2. **A regra de visibilidade da busca roda no Postgres**, não no Next.js: `role IN ('vet','clinic') AND status = 'active'`. **As duas metades.** Checar só `status` deixa passar quem tem outro role, e o responsável nasce `active`. Filtro no cliente é filtro que não existe.
3. **Telefone e WhatsApp do profissional nunca vão no HTML** da busca nem do perfil, **nem na resposta da API**. Este é o ponto em que é fácil errar: RLS é *row*-level, então liberar a linha libera **todas as colunas dela**, e o PostgREST deixa o cliente escolher quais colunas quer. Por isso contato e documento vivem em `perfil_privado`, uma tabela separada que o anônimo nunca lê. Eles são revelados pelo servidor no evento de contato (§6).
4. **Toda função usada em policy** é `SECURITY DEFINER` + `SET search_path = public` (DL-014/015).

---

## 4. O PORTÃO DE STATUS (vet e estabelecimento)

```
incomplete ──onboarding concluído──> pending_validation ──admin aprova──> active
                                            │                               │
                                            └──admin reprova (com motivo)───┘
                                                       ↓                  ↓
                                                  incomplete          suspended
                                                                    (só master)
```

| `status` | Alcança | Bloqueado | Aparece na busca |
|---|---|---|---|
| `incomplete` | `/onboarding` | todo o painel | não |
| `pending_validation` | `/aguardando`, `/perfil`, `/configuracoes` | dashboard, contatos, agenda, avaliações, plano | **não** |
| `active` | painel completo | — | **sim** |
| `suspended` | tela de bloqueio com motivo | todo o resto | não |

**Enquanto espera, ele edita o perfil** (DL-046). Continua melhorando o cadastro, o que
acelera a aprovação e já prepara a gamificação do briefing. O resto é bloqueado **no
servidor**, não escondido no menu.

---

## 5. ADMIN × MASTER

| Ação | Admin | Master |
|---|:---:|:---:|
| Ver fila de validação | ✅ | ✅ |
| Aprovar / reprovar profissional | ✅ | ✅ |
| Ver documento enviado | ✅ | ✅ |
| Moderar conteúdo (editar bio ofensiva, derrubar perfil fraudulento) | ✅ | ✅ |
| Reativar conta suspensa | ❌ | ✅ |
| Ver a base inteira de usuários | ❌ | ✅ |
| Ver responsáveis e outros admins | ❌ | ✅ |
| Conceder ou remover role | ❌ | ✅ |
| Promover alguém a admin | ❌ | ✅ |
| Suspender conta | ❌ | ✅ |
| Ler `audit_logs` | ❌ | ✅ |

Admin comum enxerga **apenas** quem tem role `vet` ou `clinic`, que é a fila dele.
Responsáveis e outros admins são invisíveis para ele. Suspender e **reativar** são os dois
lados da mesma decisão, então ambos exigem master.

Admin comum opera, master governa (DL-045). Escala a operação sem dar a chave do cofre
a todo mundo. **Toda ação de admin entra em `audit_logs`, inclusive as do master.**

---

## 6. O VISITANTE ANÔNIMO E O EVENTO DE CONTATO (DL-047)

O visitante é ator de primeira classe: ele busca e contata **sem conta**, porque o briefing
aprovado é explícito em `Cadastro ≠ Benefício`.

**O clique no WhatsApp é um evento de servidor, não um link:**

1. Cookie primário `httpOnly` com UUID aleatório na primeira visita. **Nunca IP** — IP agrupa milhares de pessoas atrás do NAT da operadora e ainda é dado pessoal pela LGPD.
2. Clique → POST no servidor → grava em `contatos` (profissional, quando, origem da busca, `anon_id` ou `user_id`, `canal`) → **só então** devolve o número.
3. Número revelado **na hora**, sem pedir nada. Na mesma tela, embaixo, o convite: *"Quer acompanhar esse contato? Diga só como te chamar."* Com "agora não" visível. **Convite, nunca portão.**
4. Se ele criar conta depois: `UPDATE contatos SET user_id = <novo> WHERE anon_id = <cookie>`. O histórico dele aparece inteiro.

**Por que isso importa em três frentes:**
- O tutor entra na base sem atrito.
- O profissional ganha a métrica que justifica o preço do plano: *"você recebeu 34 contatos este mês"*. **Sem registro, esse número não existe, e é ele que você vende.**
- O telefone fica protegido de raspagem.

`contatos.canal` nasce com `whatsapp`, e aceita `telefone` e `agendamento` depois.
Uma coluna hoje para que a integração de agendamento (mês 5+) seja aditiva, não reescrita.
**Isso não traz a feature pra dentro do escopo. Só não fecha a porta.**

---

## 7. ⚠️ RISCO DE NEGÓCIO ABERTO — vet e estabelecimento são idênticos

Hoje `app/app/veterinario/(painel)/` e `app/app/estabelecimento/(painel)/` têm exatamente
os mesmos itens, com uma única exceção: `equipe`. E `equipe` está na V2.

Ou seja: **na V1 os dois planos pagos entregam a mesma coisa por preços diferentes.**

Isso não é bug de código. É uma pergunta de produto que precisa de resposta antes do mês 4,
quando o Stripe entrar e o preço virar real. As LPs de preço da F5 vão precisar listar o
que diferencia um do outro, e hoje não há resposta.

**Registrado em `04-RISCOS.md` como R-011. Não bloqueia a F3.**

---

## 8. COMO ISSO É VERIFICADO

Nenhum item desta matriz vale sem prova. A suíte E2E (`vetria-qa`) cobre a matriz de rotas
da §2 célula por célula: para cada `❌`, um teste que loga com aquele role, tenta a rota e
**exige** o bloqueio.

**Matriz sem teste é intenção. Com teste é garantia.**
