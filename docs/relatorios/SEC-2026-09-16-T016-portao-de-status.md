# Auditoria de segurança — T-016, o portão de status — 16/09/2026

**Escopo:** os 27 arquivos não commitados da T-016 (3 novos, 24 modificados), menos os 6
explicitamente fora de escopo (os 5 congelados da T-007 e `.github/workflows/ci.yml`) ·
**Base:** `451b2e4` na `main`, mais a árvore de trabalho

> **Lido contra:** `docs/06-PERMISSOES.md` (§1, §2, §4, §5, §8), `docs/05-DECISOES.md` (DL-043,
> DL-045, DL-046, DL-047), o card T-016 com o Resultado de 16/09, `docs/04-RISCOS.md` (R-001,
> R-002, R-038, R-039, R-040, R-047, R-050), os dois relatórios anteriores (SEC-059, SEC-071/072)
> e `supabase/migrations/0002_nucleo.sql` (§1 enum, §7.2 policy, §8.1/8.2 RPCs, §9 trigger).
>
> **Nada foi exercitado contra o banco nem contra produção.** Toda afirmação sobre RLS, RPC e
> trigger é leitura do SQL versionado. Nenhuma navegação com sessão real foi feita.

> ## ✅ Estado da correção pedida
>
> **SEC-076 foi corrigido na mesma árvore, em 16/09, logo após esta auditoria.** `irPara()` passou
> a copiar `response.cookies.getAll()` para a resposta de redirect, com o motivo escrito em
> comentário no próprio `middleware.ts`. `npm run lint` e `npm run build` revalidados depois do
> conserto. **O veredito abaixo está cumprido.**

## Resumo

Dá pra colocar gente real nisso hoje? **Sim, e este diff é o que faltava pra isso ser verdade.** O
portão é lista de permitidos nos cinco pontos de decisão que importam, um valor novo no enum
`user_status` nasce barrado em todos eles, e não há caminho de bypass entre middleware e página:
as 17 páginas de painel, as 2 de bloqueio, as 2 de onboarding, as 5 do responsável e as 5 de admin
têm guard próprio, então o middleware é defesa em profundidade de verdade, não a única porta.

Não há 🔴 nem 🟠. Os seis 🟡 são: um buraco de deny-by-default em prefixo novo (não explorável
hoje), um descarte de cookie de sessão herdado e amplificado, uma escolha de produto (`/ajuda`)
que a matriz não cobria, uma divergência pré-existente em `/admin/usuarios`, o limite estrutural
do portão diante de Server Actions, e o custo por requisição.

**R-002 item 1 saiu.** **R-001 está cumprido em código** para os três prefixos existentes; ele
fecha quando a navegação for medida em tela, não porque o código existe.

---

## Achados

### SEC-075 — `rolesPermitidas()` devolve `null` para prefixo desconhecido sob `/app`: área nova nasce sem portão · 🟡

- **Onde:** `lib/auth/status.ts:94-111` (`ROLES_POR_PREFIXO` e `rolesPermitidas`) e
  `middleware.ts:68-69` (`const roles = rolesPermitidas(pathname); if (!roles) return response;`)
- **O quê:** o módulo inteiro é lista de permitidos, com uma exceção, e é esta. Um caminho sob
  `/app` que não case com nenhum dos quatro prefixos devolve `null`, e o middleware **retorna antes
  de qualquer checagem**, sem portão de role e, por consequência, sem portão de status
  (`portaoDeStatus` também devolve `null` no mesmo caso). O `null` é necessário para `/app`, que é
  o roteador; o efeito colateral é que ele também cobre tudo que ninguém listou.
- **Como explorar:** criar `app/app/qualquer-area/page.tsx` sem guard. Qualquer usuário logado, de
  qualquer role e de qualquer status, inclusive `suspended`, alcança a rota. **Não é explorável
  hoje:** só existem `responsavel`, `veterinario` e `estabelecimento` sob `/app`, e os três estão
  listados. É por isso que é 🟡 e não 🟠.
- **Impacto:** a garantia que o próprio `middleware.ts:14-16` vende (*"uma página nova que alguém
  esqueça de guardar já nasce coberta"*) vale **dentro** dos três prefixos conhecidos, e não fora
  deles. Quem ler o comentário e criar uma área nova vai acreditar numa cobertura que não existe.
- **Como corrigir:** inverter o padrão. `/app` (exato) entra numa lista explícita de caminhos sem
  persona, e **todo o resto** que não case com prefixo conhecido cai num conjunto fechado, seja
  negando, seja mandando para `/app`. É a mesma forma do `ALCANCE_PADRAO`, que já acertou isso no
  eixo do status.
- **Vira task:** não obrigatório em 🟡. Recomendado como item de uma segunda passagem da T-016,
  junto com o R-051.

### SEC-076 — `irPara()` descarta os cookies de sessão renovados pelo `getUser()` · 🟡 · ✅ CORRIGIDO

- **Onde:** `middleware.ts:50-54`, contra `middleware.ts:25-27` e `37-41`
- **O quê:** o `response` criado na linha 25 é o objeto em que o `setAll` do `@supabase/ssr` escreve
  os cookies quando `auth.getUser()` (linha 46) renova a sessão. `irPara()` montava um
  `NextResponse.redirect(url)` **novo** e nunca copiava esses cookies. Toda saída por redirect do
  middleware jogava fora a renovação.
- **Como reproduzir:** não é exploração por terceiro, é falha de estado. Conta `vet` em
  `pending_validation`, sessão com access token já expirado (mais de 1h parada). Abrir
  `/app/veterinario/contatos`. O `getUser()` renova o par de tokens e escreve em `response`; o
  middleware devolve `irPara("/app/veterinario/aguardando")`, e o navegador nunca recebe o par
  novo. O refresh token que ficou no navegador é o antigo, já rotacionado. Com detecção de reuso
  ativa, a renovação seguinte pode ser recusada e a sessão cai.
- **Impacto:** disponibilidade e confiança, não confidencialidade. A direção da falha é logout, que
  é fechada. O defeito é **herdado** (o middleware antigo tinha os mesmos dois caminhos de
  redirect), mas **a T-016 o amplifica**: antes o redirect era exceção (sem login, ou não-admin em
  `/admin`); agora é o **fluxo normal** de todo profissional em `incomplete`,
  `pending_validation` ou `suspended`, em toda navegação.
- **Correção aplicada:** `irPara()` copia `response.cookies.getAll()` para a resposta de redirect
  antes de devolvê-la, com o motivo escrito em comentário no arquivo.

### SEC-077 — `/ajuda` bloqueado para quem espera validação era escolha de código sem linha na matriz · 🟡

- **Onde:** `lib/auth/status.ts:124-135` (`ALCANCE_POR_SEGMENTO` não tinha `ajuda`;
  `ALCANCE_PADRAO = SO_ATIVO`) · contra `docs/06-PERMISSOES.md` §4
- **O quê:** o deny by default **como código está certo**. A §4 lista "Alcança" como conjunto
  fechado (`/aguardando`, `/perfil`, `/configuracoes`) e a prosa logo abaixo diz *"O resto é
  bloqueado no servidor"*. A coluna "Bloqueado" enumera cinco telas e é ilustrativa, não
  normativa. Nessa leitura `/ajuda` e `/equipe` caem fora de "Alcança" e o `SO_ATIVO` está certo. O
  backend registrou que era escolha; era escolha **coberta** pela prosa, mas a matriz não nomeava
  nenhuma das duas telas.
- **Impacto:** o custo é real e vale dito em voz alta: **quem está esperando validação, e quem foi
  suspenso, não alcança a tela onde procuraria suporte.** Estava mitigado nas duas pontas
  (`/aguardando` já traz o caminho de contato, e `ContaBloqueada.tsx:82-87` põe
  `contato@vetriabrasil.com.br` na tela do suspenso), mas a mitigação era acidente feliz de copy,
  não regra escrita.
- **Encaminhamento:** **a matriz mudou primeiro**, como manda a regra da casa. O `vetria-maestro`
  registrou **DL-058** e a §4 passou a listar `/ajuda` em "Alcança" para `pending_validation`;
  `incomplete` e `suspended` ficam como estavam, com o motivo escrito (o `/bloqueado` precisa ser
  terminal, senão vira laço de redirect). O código muda **uma linha** (`/ajuda` de `SO_ATIVO` para
  `ESPERANDO_OU_ATIVO`), **fora deste diff**, e volta ao `vetria-seguranca` como delta explícito
  porque alarga permissão.

### SEC-078 — `/admin/usuarios` aceita admin comum, e a matriz §2 dá ❌ · 🟡 · pré-existente, não é da T-016

- **Onde:** `app/admin/usuarios/page.tsx:24` (`if (!profile || profile.role !== "admin") redirect("/app");`)
  e `:26` (`const isMaster = profile.admin_level === "master";`)
- **O quê:** **procede, confirmado por leitura.** A matriz §2, última linha, marca
  `/admin/usuarios (RBAC)` com **❌ para Admin** e ✅ só para Master, e o topo da §2 define ❌ como
  *"bloqueado no servidor"*. A página bloqueia por `role`, não por `admin_level`: um admin comum
  **entra na rota** e recebe 200. O `admin_level` só decide o que renderiza dentro dela.
- **Impacto:** **nenhum dado de terceiro vaza hoje.** O `<AdminPanel />` fica atrás do ramo
  `isMaster`, e as duas rotas que ele consome exigem `admin_level === "master"` antes de encostar
  no service role (`app/api/admin/profiles/route.ts:57`, `app/api/admin/set-access/route.ts:62`) —
  a T-015 fez isso certo. O que existe é divergência entre a fonte única e o código, com duas
  consequências: a §8 manda um teste E2E para cada ❌, e esse teste falharia hoje; e no dia em que
  alguém tirar o `AdminPanel` de dentro do ramo, o 403 da API vira a única defesa de uma tela que a
  matriz já dizia fechada.
- **Como corrigir:** o guard da página passa a exigir `admin_level === 'master'` e redireciona o
  admin comum para `/admin`. **A matriz está certa e o código é que muda.**
- **Encaminhamento:** aberto como **R-054** pelo `vetria-maestro`. Não ganha card nesta fase; entra
  na abertura da **S4**, com prazo real escrito: **antes da primeira conta `admin` não-master
  existir**.

### SEC-079 — O portão é de rota, e Server Action não é rota · 🟡

- **Onde:** `middleware.ts:9-22` e `lib/auth/status.ts:21-26` (a garantia escrita) · contra
  `app/app/responsavel/onboarding/page.tsx:23-70`
- **O quê:** a promessa do diff (*"uma página nova que alguém esqueça de guardar já nasce
  coberta"*) vale para **navegação GET**. Server Action é endereçada por id global do build, não
  por rota: um POST com `Next-Action: <id>` para **qualquer** caminho que o chamador já alcança
  executa a action, independentemente de qual rota a hospeda e de qual portão fecharia essa rota. O
  portão de prefixo não vê isso passar.
- **Como explorar:** conta `clinic` em `suspended`. O middleware só a deixa em
  `/app/estabelecimento/bloqueado`. POST nesse caminho com `Next-Action` apontando para o id de
  `salvarOnboardingClinic`. O middleware libera, porque a rota é permitida, e a action roda. **Hoje
  ela para, e para no lugar certo:** `estabelecimento/onboarding/actions.ts:210,224-229` e
  `veterinario/onboarding/actions.ts:110,128-135` reconferem role **e** status por conta própria. É
  por isso que é 🟡 e não 🟠.
- **Impacto:** o único ponto do repositório onde a action não reconfere role é a Server Action
  inline do onboarding do responsável (`app/app/responsavel/onboarding/page.tsx`,
  `completeOnboarding`): ela confere sessão e escreve `onboarding_completed = true` na **própria
  linha** do chamador. Coluna não pinada pela policy 7.2, nenhum dado cruza usuário, ninguém entra
  na busca. É o R-040, já registrado, e o `/app` novo deixou de rotear por ela. O risco de verdade
  é o precedente: a próxima action escrita por quem leu o comentário do middleware vai achar que o
  portão a cobre.
- **Como corrigir:** o comentário de `lib/auth/status.ts` diz o que a garantia cobre e o que não
  cobre, e `docs/AGENTES.md` ganha a regra: **toda Server Action reconfere role e status por conta
  própria; o portão de rota nunca a alcança.** Nenhum código precisa mudar hoje.

### SEC-080 — Três `getUser()` e até três leituras de `profiles` por página de painel · 🟡

- **Onde:** `middleware.ts:46,74-78` · `lib/auth/painel.ts:53-62`, chamado duas vezes por render (no
  `(painel)/layout.tsx` e no `page.tsx`) · `app/app/layout.tsx:35-47`
- **O quê:** `/app/veterinario/contatos` passou a custar, por requisição: 1 `auth.getUser()` mais 1
  `select` no middleware, 1 e 1 no layout do route group, 1 e 1 na página. É consequência direta e
  **desejada** de o portão existir em dois lugares, e a duplicação é o que o DL-046 e o R-001
  pedem.
- **Como explorar:** não há exploração. O que existe é a pressão previsível: no primeiro relatório
  de latência, a "otimização óbvia" é apagar o `requirePainel` da página porque *"o layout já
  faz"*. **Layout em Next não é garantia de guard de página**, e o próprio comentário de
  `veterinario/(painel)/layout.tsx:30-36` diz isso.
- **Como corrigir:** não remover camada. Se o custo doer, a saída é cache por requisição da leitura
  de `profiles` (um `cache()` em torno do `select`), que preserva as duas checagens e paga uma ida
  ao banco.

---

## Verificado e OK

**A. O portão é lista de permitidos em todos os pontos, e o enum novo nasce barrado.** Ponto a
ponto, com o teste mental do valor `rejected` entrando no enum amanhã:

| Ponto de decisão | Onde | Forma | Valor novo de `user_status` |
|---|---|---|---|
| Exige login | `middleware.ts:57-60` | prefixo (`/app`, `/admin`) | não se aplica |
| Portão de role | `middleware.ts:86-88` + `status.ts:106-111` | **permitidos** (`roles.includes`), com o furo do SEC-075 para prefixo desconhecido | não se aplica |
| Portão de status por segmento | `middleware.ts:93-106` + `status.ts:124-135` | **permitidos**, e `ALCANCE_PADRAO = SO_ATIVO` para segmento não listado | **barrado** |
| `destinoPorStatus` | `status.ts:177-192` | `switch` com `default` para `/bloqueado` | **mandado ao sumidouro** |
| `requirePainel` | `painel.ts:69-71` | **permitidos**, lista passada explicitamente pela página | **barrado** |
| `ehStatusDeBloqueio` | `status.ts:204-210` | lista de negados, **de propósito** | **aceito na tela de bloqueio** |
| `app/app/page.tsx` | bloco novo de roteamento | por role, e para `vet`/`clinic` delega ao `destinoPorStatus` | **mandado ao `/bloqueado`** |

A única lista de negados do diff é `ehStatusDeBloqueio`, e ela **precisa** ser de negados: é a
porta de saída, e uma lista fixa de permitidos ali faria a saída apontar para si mesma.

**B. Não há bypass, e a rota `/bloqueado` fecha o laço.** Varridos os quatro status contra os cinco
grupos de rota de cada painel, mais um status hipotético desconhecido. Em nenhum par o middleware
manda para uma página que devolve de volta:

- `incomplete` → só `/onboarding`, e o guard da página aceita `incomplete`
- `pending_validation` → `/onboarding`, `/aguardando`, `/perfil`, `/configuracoes`; as quatro
  páginas e o layout do route group aceitam
- `active` → painel completo; recusado em `/onboarding` e em `/aguardando`, indo para a base, e a
  base aceita `active`
- `suspended` → só `/bloqueado`, e `requireContaBloqueada` aceita
- status desconhecido → `/bloqueado` pelo `default`, passando pelo escape `destino !== pathname` do
  `middleware.ts:103`, com `ehStatusDeBloqueio` confirmando na página. **Duas defesas dizendo a
  mesma coisa, e é a construção certa.**

**Matcher, caractere a caractere.** `matcher: ["/app/:path*", "/admin/:path*"]` contra a lista
real: `/app` e `/admin` exatos, mais tudo abaixo deles. O modificador `*` é zero-ou-mais e inclui o
delimitador, então as duas formas nuas casam. **E mesmo se não casassem, não haveria buraco:**
`app/app/page.tsx` e `app/admin/page.tsx` têm guard próprio. Fora do matcher ficam, corretamente,
`/api/*` (as três rotas se autorizam), `/auth/callback` e `/onboarding` (guard próprio, e
`handle_new_user` sempre grava role, então a tela é inalcançável na prática).

**Toda página sob `/app` e `/admin` tem guard próprio, conferidas uma a uma.** 17 de painel
(`requirePainel` com lista explícita), 2 de bloqueio (`requireContaBloqueada`), 2 de onboarding
profissional (`role` mais `PODEM_EDITAR_AQUI`), 5 do responsável (guard inline de role), 5 de admin
(`role !== "admin"`), 2 layouts de route group (`ESPERANDO_OU_ATIVO`). **Nenhuma página ficou mais
frouxa que o layout que a envolve**, e nenhuma ficou sem guard.

**C. A consulta nova no middleware é fail-closed, e não vaza nada.** `.single()` devolve
`data: null` em erro de PostgREST e também em falha de rede (o `supabase-js` captura o `fetch`
rejeitado e devolve `error`, não lança). `!profile` cai no `middleware.ts:86` e redireciona para
`/app`; `/app` reconsulta e, se também falhar, manda para `/login`. Fechado nos dois degraus.
`auth.getUser()` indisponível devolve `user: null` e cai em `/login` pela linha 58. **Nenhum
vazamento:** `status_motivo` não está no `select` (só `role, status`), nenhum header é escrito,
nenhum cookie carrega dado de perfil, não há um único `console.` nos arquivos tocados, e os
destinos de redirect são pathnames fixos sem query. A leitura roda com a anon key sob a sessão do
usuário, logo sob RLS e limitada à própria linha por `.eq("id", user.id)`.

*Observação sem severidade:* o pathname de destino (`/app/veterinario/bloqueado`) revela o status
grosso da conta a quem vê a URL, em histórico do navegador e log de acesso da Vercel. É dado do
próprio titular e já atrelado ao `user_id` que o log guarda de qualquer jeito. Fica anotado para
quando a política de log da F6 for escrita, não como achado.

**D. As outras duas personas ficaram de fora, e a matriz sustenta isso.** Não é escolha, é leitura.
A citação é o rodapé da §2: *"🔶 = sujeito ao portão de status (§4)"*. `/app/responsavel/**`
aparece com **✅**, não 🔶; só `/app/veterinario/**` e `/app/estabelecimento/**` levam 🔶. Somado
ao título da §4, *"O PORTÃO DE STATUS (vet e estabelecimento)"*, a leitura é única: **o portão não
se aplica a `tutor` nem a `admin`**, e `status.ts:146-152` e `app/app/page.tsx` codificam
exatamente isso.

Aplicá-lo teria trancado gente que deve entrar: `tutor` nasce `active` (`0002:796-797`), então
`ONBOARDING` o barraria do próprio `/app/responsavel/onboarding`. E não abre buraco deixá-lo de
fora: `admin_definir_status` recusa alvo que não seja `vet` ou `clinic` (`0002:699-701`), não
existe policy de UPDATE em `profiles` para admin ou master além da
`profiles_update_own_safe_fields` (que pina `status`), e a §7.2 pina a coluna contra o próprio
dono. **Um `tutor` ou um `admin` não tem como sair de `active`.**

**E. A tela de bloqueio está correta, e o motivo é escapado.** `ContaBloqueada.tsx:65-74` renderiza
`{motivo}` como filho de JSX, então React escapa. `whitespace-pre-line` é CSS, não parsing. **Não
existe um único `dangerouslySetInnerHTML` em `app/`, `components/` ou `lib/`.** Quanto à posse da
linha: `requireContaBloqueada` lê `.eq("id", user.id)` (`painel.ts:102-106`), sob a policy do dono,
e confere `profile.role !== role` antes, então um `clinic` que abra `/app/veterinario/bloqueado` é
mandado para `/app`. **Não há como abrir a tela de bloqueio de outra pessoa**, e não há parâmetro
de rota por onde tentar. Quando o motivo é nulo, a tela diz que não há motivo registrado em vez de
inventar um (DL-020 respeitado).

**G. DL-016 respeitado.** Zero `try {` nos oito arquivos tocados por esta task (`middleware.ts`,
`lib/auth/status.ts`, `lib/auth/painel.ts`, `app/app/page.tsx`, `app/app/layout.tsx`, as duas
`bloqueado/page.tsx` e `ContaBloqueada.tsx`).

**H. R-001 cumprido em código; R-002 item 1 saiu.** `rolesPermitidas("/app/veterinario/perfil")`
devolve `["vet"]`, um `tutor` não está na lista e é mandado para `/app`, que o despacha para
`/app/responsavel`, sem laço, porque `/app` não tem restrição de role. Isso é o item 4 do DoD da F3
e é o que o DL-046 manda, com a página como segunda camada. A ressalva é o SEC-075: o isolamento
vale para os três prefixos listados. **O R-001 não fecha por este relatório** — fecha quando a
navegação for feita em tela, que é a regra que segurou o R-020 até o último minuto.
`NAV_BY_ROLE["master"]` foi apagado de `app/app/layout.tsx`.

---

## Não consegui verificar

1. **A navegação com sessão real**, as 8 URLs do card. Nenhum agente loga no app. Tudo acima é
   leitura de código e de SQL versionado.
2. **Que o valor `/app` nu case com o matcher no runtime da Vercel.** A leitura de
   `path-to-regexp` diz que sim. **Não altera o veredito:** `app/app/page.tsx` tem guard próprio.
3. **Se a rotação de refresh token do projeto tem detecção de reuso ligada**, o que decidia se o
   SEC-076 derrubaria a sessão ou só desperdiçaria a renovação. É configuração no dashboard do
   Supabase. Com a correção aplicada, a pergunta deixou de ser urgente.
4. **A medição do R-047.** Não foi medida, é dado de produção. Confirmado por leitura o raciocínio
   do handoff: com `app/app/page.tsx` roteando por `status`, a conta órfã passa a ser mandada para
   `/app/estabelecimento/onboarding`, e o guard da T-007 aceita `incomplete`. **O `select` continua
   valendo**, porque é ele que diz quantas contas dependem disso.
5. **`profiles_select_own`**, a policy de que o middleware e o `requirePainel` dependem para ler a
   própria linha, mora na `0000_baseline.sql` e não foi relida nesta passagem. O código anterior já
   dependia dela e funciona em produção.

---

## Veredito

> **MERGE COM UMA CORREÇÃO PONTUAL — e a correção já foi aplicada.** Contagem: **🔴 0 · 🟠 0 ·
> 🟡 6** (SEC-075 a SEC-080).
>
> A única correção pedida no diff era **SEC-076** (`irPara()` descartando os cookies de sessão
> renovados), e ela foi feita em 16/09, no mesmo arquivo, com o motivo em comentário. As outras
> cinco viram risco ou decisão e não seguram o merge.
>
> **A prova em navegador que o card lista como bloqueio continua sendo pré-condição.** Nenhum
> agente loga no app, e neste projeto risco não fecha porque o código existe: fecha quando o
> comportamento muda em tela.
