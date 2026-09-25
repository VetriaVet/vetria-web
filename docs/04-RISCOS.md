# 04 — RISCOS, BUGS E DÍVIDAS

> Tudo que sabemos que está errado, pode dar errado, ou vai dar errado depois.
> Alimentado pelos agentes `vetria-seguranca`, `vetria-qa` e `vetria-ui`.
>
> **Gravidade:** 🔴 crítico (para a fila) · 🟠 alto (entra na semana) · 🟡 médio (entra na fase) · ⚪ baixo (backlog)

---

## 🔴 ABERTOS — CRÍTICOS

**Nenhum. Desde 20/09/2026.**

O **R-001** era o único, estava aberto desde 26/08, e **fechou por medição em tela**: as 9
navegações do Elber, com conta real, em 20/09. Ele e o **R-038** estão em ✅ FECHADOS; a tabela
do que foi digitado e do que aconteceu está no card da **T-016**, em `03-TAREFAS.md`. ⚠️ **Isto não quer dizer que o projeto está seguro; quer dizer que o que sabíamos
de crítico foi medido.** A seção 🟠 logo abaixo continua com quatro entradas e **ganhou uma
quinta hoje** (**R-057**), e o 🟠 da auditoria da T-008 (SEC-081) está no card **T-020**, com
trava escrita: **antes do primeiro profissional de fora.**

**25/09/2026 — continua sem 🔴 de severidade, com uma pergunta que pode criar um:** se o Supabase de
**produção** estiver no plano grátis, o **R-073** vira 🔴 (o site pausa sozinho após 7 dias sem uso). O
**R-039** (🟠) fechou com a `0004`. Os 🟠 que sobram (R-057, R-061, R-062) estão todos no portão de abertura.

**23/09/2026 — continua sem 🔴 de severidade.** A auditoria da T-024 e a avaliação de rate limit
somaram quatro 🟠 (SEC-096, SEC-097b, **R-061** captcha, **R-062** 2FA do admin). Todas as travas
"antes de abrir" viraram **uma lista só, o portão de abertura** (**DL-063**), com prazo 20/10.

## 🟠 ABERTOS — ALTOS

> **R-020, R-021, R-022 e R-025 FECHARAM em 26/08**, quando a `0003` foi aplicada em produção
> e verificada por 18 sondas. Estão em ✅ FECHADOS, e a regra que os manteve abertos até o
> último minuto continua valendo: **risco só fecha quando o banco muda, não quando o SQL
> existe.** O **R-018** fechou na mesma sessão; a pergunta de produto que sobrou dele virou o
> **R-032**. O **R-026** foi rebaixado para 🟡 em 26/08 e **FECHOU em 31/08**, quando a medição
> que faltava foi feita: `42` apareceu. O que sobrou dele virou o **R-035**.

### R-002 — Modelo de `master` inconsistente entre doc, código e enum ⚠️ RECLASSIFICADO
- **Descoberto:** 26/08/2026 · **Reclassificado:** 26/08/2026, após leitura de `app/api/admin/*`
- **Classificação original (errada):** "role `master` é barrado do próprio `/admin`". Não procede.
- **O que é de fato:** `master` **não é um `role`**. É `role = 'admin'` + `admin_level = 'master'`, e o código já funciona assim (`api/admin/profiles/route.ts:57` e `api/admin/set-access/route.ts:52` autorizam por `admin_level === "master"`). Logo `middleware.ts:45` (`role !== "admin"`) está **correto** e não barra ninguém. Decidido e registrado em DL-045 e `06-PERMISSOES.md` §1.
- **O que sobra de problema real, em três frentes:**
  1. ✅ **FECHADO EM 20/09.** O código morto `NAV_BY_ROLE["master"]` **saiu de
     `app/app/layout.tsx`** na T-016, e o que ficou no lugar é um comentário explicando por que
     ele saiu. **Conferido no código, não suposto.** Os dois itens abaixo continuam abertos.
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

### R-004 — `dangerouslyAllowSVG: true` no `next.config.ts`
- **O quê:** necessário pra logo SVG renderizar via `next/image` (DL-040). Está mitigado por CSP sandbox. Vira risco real se algum dia entrar SVG enviado por usuário (foto de perfil, documento).
- **Regra:** **nunca** servir SVG de origem de usuário por `next/image`. Upload de imagem de usuário aceita só raster (jpg/png/webp).
- ✅ **20/09 — a barreira do servidor passou a existir:** a rota da T-008 detecta o tipo por
  **assinatura mágica dos primeiros bytes**, deriva a extensão do tipo detectado e **barra SVG e
  HTML**, e o `contentType` gravado é o detectado, não o declarado. O `vetria-seguranca` conferiu
  isso lendo o código (`SEC-2026-09-16-T008`).
- ⚠️ **NÃO FECHA:** **(1)** `dangerouslyAllowSVG` continua ligado no `next.config.ts`, que é o
  enunciado do risco; **(2)** ninguém **tentou** subir um `.svg` e um `.html` contra a rota — a
  garantia é leitura de código, não medição. **É uma tentativa de upload, e ela fecha isto.**
- **Corrige em:** F3 / S2 — **T-008**, como validação de MIME no upload. O CHECK de `documento_path` já barra `.svg` no banco (SEC-026); falta barrar no servidor, antes de o arquivo existir.

### R-057 — Nenhuma das duas rotas de documento confere a origem do pedido (SEC-086)
- **Descoberto:** 16/09/2026, auditoria da T-008
- **Onde:** `upload/route.ts:191` · `abrir/route.ts:41` · `lib/supabase/server.ts:7-30`
- **O quê:** as duas aceitam POST sem olhar `Origin` nem `Sec-Fetch-Site`. `multipart/form-data` é
  content-type "simples" de CORS: um `<form>` de terceiro faz o POST **sem preflight**. O que
  impede o cookie de acompanhar é o `SameSite=Lax`, que é o **default do `@supabase/ssr`** — **não
  está escrito em lugar nenhum deste repositório, não é conferido por teste nenhum**, e é a única
  coisa entre o site do atacante e um upload em nome da vítima.
- **Impacto se cair:** substituição do documento de validação em nome da vítima, e remoção dela da
  busca pela revalidação. **Só alcançável se o `SameSite` mudar** — upgrade de biblioteca, alguém
  passando `cookieOptions` um dia, ou um subdomínio hostil, que é same-site e o Lax não cobre.
- **Por que 🟠 e não 🟡:** a defesa inteira depende de um default que **ninguém neste projeto
  escolheu, escreveu ou testou**. É o R-016 na forma clássica: salvaguarda que ninguém sabe que
  tem. O conserto são **três linhas** — recusar quando `Sec-Fetch-Site` não for `same-origin`, nas
  duas rotas.
- **Sem card hoje:** cabe na T-020, que é a próxima a tocar essas rotas. **Se a T-020 escorregar
  para a F6, este sobe para card próprio**, porque ele não depende de volume nenhum. 🟠
- **25/09/2026:** entrou **por escrito** no card da **T-020** (fila dos próximos 5 dias), como item de carona.
  A rota nova da S8 (`/api/contato`, T-040) já nasce com a mesma conferência.

### R-061 — O teto de email do projeto vira arma: cadastro e recuperação de senha sem captcha (SEC-102)
- **Descoberto:** 23/09/2026, `docs/relatorios/SEC-2026-09-23-rate-limit-captcha-2fa.md`
- **O quê:** login, cadastro e recuperação de senha **não passam pelo nosso servidor**: o navegador
  fala direto com o Supabase. O Supabase tem teto de envio de email **do projeto inteiro** (~30/h
  com SMTP próprio). Um script com 30 endereços quaisquer esgota o teto da hora, e o profissional
  de verdade que se cadastra em seguida **não recebe a confirmação**. Repetível a cada hora, de um
  IP só. Os emails para endereço inexistente voltam e sujam a reputação do domínio (R-009).
- **Por que 🟠:** não vaza dado, mas derruba o funil inteiro de cadastro sem esforço.
- **Correção:** captcha **Turnstile** nas 6 telas (`/login`, os 3 `/cadastro/*`, `/recuperar-senha`
  e os "reenviar email"). ⚠️ **Ordem:** código com o widget → deploy → só então ligar no painel do
  Supabase. Ligar antes tranca todo mundo para fora, o Elber incluído. Aumentar o teto só encarece
  o ataque. **Firewall da Vercel e Cloudflare não ajudam aqui**, porque não veem esse tráfego (DL-063).
- **Task:** **T-031** (🔴 auth). **Trava:** portão de abertura (DL-063), prazo 20/10

### R-062 — Admin e master entram só com senha, e a conta master enxerga o dossiê de todo mundo (SEC-103)
- **Descoberto:** 23/09/2026, mesma avaliação
- **O quê:** uma senha vazada do master entrega documento, CRMV e CNPJ de toda a base. Não há
  segundo fator.
- **Correção:** TOTP do Supabase (grátis), exigindo `aal2` **nos dois lugares**: no `requireAdmin`
  (`lib/auth/admin.ts`) **e** no `is_admin()` do banco, lendo o `aal` do JWT. Só na tela não basta:
  o PostgREST seguiria aceitando só a senha (é a lição da SEC-096/097). ⚠️ **Ordem:** a tela de
  cadastro do TOTP vai ao ar, o Elber cadastra o dele, e só então a migration muda o `is_admin()`.
  `is_admin()` é usada em policy: `SECURITY DEFINER` + `SET search_path = public` (DL-014/015).
- **Task:** **T-032** (🔴 auth + migration). **Trava própria, mais cedo que o portão: antes do
  segundo admin** (R-014), mesmo que a abertura atrase

---

## 🟡 ABERTOS — MÉDIOS

> **25/09/2026 — registrados pelo `vetria-maestro`:** os achados abertos das auditorias de 23/09
> (`SEC-2026-09-23-T036-0005.md` e `SEC-2026-09-23-F4-busca-e-perfil-publico.md`), os relatos do
> `vetria-qa` e do `vetria-ui`, e o que o planejamento da S8 descobriu. Cada um tem card ou destino.
> **SEC-113, SEC-117 e SEC-118 já fecharam** (ver ✅ FECHADOS).

### R-067 — Link de email de conta alheia faz a vítima entrar logada na conta do atacante (SEC-112)
- **Descoberto:** 23/09/2026, auditoria da T-036
- **O quê:** com `token_hash`, o link não fica preso ao navegador que o pediu (é o que a T-036 quis). O
  outro lado: um atacante manda à vítima o link **da própria conta**; ela toca, entra logada nela sem
  perceber e pode preencher o onboarding ou dados ali (login CSRF / injeção de conta).
- **Por que 🟡:** exige engenharia social e não dá ao atacante dado de ninguém; dá a ele o que a vítima
  digitar depois.
- **Correção:** a tela depois do `verifyOtp` diz *"Você entrou como a\*\*\*@dominio"* com o caminho de sair;
  `frame-ancestors 'none'` também em `/auth/confirm`.
- **Task:** **T-033** (cabeçalhos + a linha de tela). 🟡

### R-068 — O `verifyOtp` sai da Vercel, e um script pode esgotar o limite de verificação de todos (SEC-114)
- **Descoberto:** 23/09/2026, auditoria da T-036
- **O quê:** a Server Action de `/auth/confirm` chama o Supabase a partir dos IPs da Vercel. Se o limite
  de verificação do Supabase for por IP, todo mundo divide a mesma cota, e um laço de pedidos a esgota.
- **Correção:** conferir e subir o limite em Auth → Rate Limits (gesto do Elber); o captcha da T-031
  reduz o volume na origem.
- **Task:** **T-031** (item acrescentado em 25/09). 🟡

### R-069 — Qualquer admin reescreve o `slug` pela API, e a matriz diz "só o master" (SEC-115)
- **Descoberto:** 23/09/2026, auditoria da `0005`
- **O quê:** `vet_profiles_update_admin` e `clinic_profiles_update_admin` (da `0002`) deixam o admin comum
  fazer `PATCH slug=...`. A matriz §3 diz que troca de slug é gesto do master (DL-067 item 5).
- **Por que 🟡:** exige conta admin, e hoje só existe o Elber. Vira real com o segundo admin (R-014).
- **Correção recomendada:** trigger `BEFORE UPDATE` recusando mudança de `slug` fora do gerador e do
  master. Alternativa: DL corrigindo a matriz.
- **Task:** **T-039** (`0006`). 🟡

### R-070 — Aprovação de conta sem linha de perfil passa sem `slug` (SEC-116)
- **Descoberto:** 23/09/2026, auditoria da `0005` (`0005:567-569` contra o comentário `620-622`)
- **O quê:** se uma conta vet/clinic chegar a `active` sem linha em `vet_profiles`/`clinic_profiles`, o
  trigger não gera slug e não reclama. Hoje não há caminho pelo app (a conclusão exige a linha).
- **Correção:** `raise` quando o gerador devolver nulo, ou o comentário passa a dizer a verdade.
- **Task:** **T-039** (`0006`). ⚪ na prática, 🟡 por ser silêncio em banco

### R-071 — Cada GET em `/buscar` faz 7 a 9 consultas, sem limite de requisições (SEC-119)
- **Descoberto:** 23/09/2026, auditoria da busca
- **O quê:** duas das consultas usam `count: exact`. Um laço de GETs vira carga no banco sem custo para
  quem dispara. Baixo impacto com o volume de hoje.
- **Correção:** regra do firewall da Vercel em `/buscar` e `/api/cidades`; uma função de busca única
  quando a ordenação por relevância entrar (DL-070 D).
- **Task:** **T-020** (a mesma sessão de firewall, item acrescentado em 25/09). 🟡

### R-072 — Possível bug: "pausar e voltar" no onboarding (relato do `vetria-qa`, NÃO reproduzido)
- **Descoberto:** 23-24/09/2026, relato do `vetria-qa` nas sessões de teste; **sem passo a passo escrito**
- **O quê:** a pessoa sai do onboarding no meio (fecha a aba ou toca em sair) e, ao voltar, **algo não
  volta como estava** (o relato não diz se é passo, campo ou documento). O DoD da F3 item 1 é
  justamente "sair e voltar e os dados estão lá", provado no CI com conta nova; **se o bug for real, o
  teste está medindo outro caminho**.
- **Por que 🟡 e não mais:** não reproduzido. Relato sem passo a passo é relato, não bug.
- **Próximo passo:** o `vetria-qa` reproduz no `vetria-e2e` com os três caminhos (passo 2, passo 3 com
  documento enviado, passo 4) e escreve o passo a passo aqui. **Reproduziu → card E2 na fila, na frente
  da S8. Não reproduziu em 3 tentativas → fecha com a nota.** Prazo: 02/10. 🟡

### R-073 — Projeto Supabase grátis pausa depois de 7 dias sem uso
- **Descoberto:** 24/09/2026, ao criar o `vetria-e2e` (DL-064, "plano grátis")
- **O quê:** o Supabase pausa projeto do plano grátis após 7 dias sem atividade. **No `vetria-e2e`:** a
  primeira semana sem PR deixa o CI vermelho por motivo que não é código, e CI vermelho à toa é CI que
  deixa de ser olhado. **Em produção, se também for grátis:** o site sai do ar sozinho, e ninguém sabe
  hoje em que plano ela está (não está escrito em lugar nenhum).
- **Correção:** `vetria-e2e`: CI agendado a cada 3 dias (**T-044**). Produção: **o Elber responde em que
  plano está**; se for grátis, a recomendação é **Pro antes da abertura** (o portão de 20/10), que também
  destrava backup diário e os controles do §Ideias.
- 🟡 no `vetria-e2e` · **🔴 se produção for grátis** (vira o único 🔴 aberto)

### R-074 — O profissional consegue ler o `anon_id` de quem o contatou, e o `anon_id` é a chave do histórico do visitante
- **Descoberto:** 25/09/2026, pelo `vetria-maestro`, planejando a S8 (leitura de `0002_nucleo.sql:346-355` e `:610-611`)
- **O quê:** `contatos_select_profissional` libera a **linha** (RLS é row-level, DL-049), e o PostgREST deixa
  o profissional pedir `select=anon_id,user_id`. O `anon_id` é o valor do cookie do visitante: quem o
  conhece pode pôr no próprio navegador, criar conta de responsável e puxar para si o histórico de contatos
  daquele visitante (o vínculo do DL-047 §6.4).
- **Não é bug hoje:** `contatos` está vazia e nada grava nela.
- **Correção:** privilégio por coluna em `contatos` (o profissional e o responsável leem só as colunas das
  telas), na `0006`. **Precisa estar aplicada antes do primeiro contato gravado.**
- **Task:** **T-039**. 🟡 (vira 🟠 no dia em que a S8 gravar sem isto)

### R-076 — O CHECK de `contatos` impede excluir a conta de quem contatou logado
- **Descoberto:** 25/09/2026, pelo `vetria-maestro`, mesma leitura
- **O quê:** `contatos.user_id` é `on delete set null`, e `contatos_tem_origem` exige `user_id` **ou**
  `anon_id`. Um contato feito por conta logada sem `anon_id` faz a exclusão dessa conta **falhar** (a linha
  ficaria sem nenhum dos dois). Isso trava a exclusão de conta da LGPD (F6).
- **Correção:** a `0006` grava `anon_id` **sempre** e o CHECK passa a aceitar linha anonimizada (a contagem
  do profissional fica; quem clicou some), conforme a D11.
- **Task:** **T-039**. 🟡

### R-075 — O botão da newsletter estoura 22 px na largura de 360 px (relato do `vetria-ui`)
- **Descoberto:** 24/09/2026, `vetria-ui`
- **O quê:** rolagem lateral no rodapé público em celular pequeno. Visual, sem risco de dado. Viola o
  transversal "Responsivo" do `00-ESCOPO.md` §2.
- **Destino:** 🟢 de 1 arquivo, entra de carona no próximo card de tela pública (T-041) ou na passada de
  QA da F6/S12. ⚪

### R-063 — Faltam os cabeçalhos de segurança, e o botão *Aprovar* pode ser clicado dentro de um iframe alheio (SEC-104)
- **Descoberto:** 23/09/2026, mesma avaliação
- **O quê:** `next.config.ts` só configura `X-Robots-Tag`. Um site carrega
  `/admin/validacoes/<conta>` num iframe invisível e induz o admin a clicar em *Aprovar*
  (clickjacking). Faltam também `nosniff`, `Referrer-Policy` e `Permissions-Policy`. HSTS no
  domínio não foi confirmado.
- **Correção:** `frame-ancestors 'none'` / `X-Frame-Options: DENY`, `X-Content-Type-Options:
  nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. ~1 h. CSP
  completa com nonce fica para a F6.
- **Task:** **T-033** (🟡 config). **Trava:** portão de abertura (DL-063)

### R-064 — Senha mínima de 8 só existe na tela; o Supabase aceita 6 (SEC-105)
- **Descoberto:** 23/09/2026, mesma avaliação
- **O quê:** o padrão do Supabase é 6, e o modo "criar conta" do `/login` (`app/login/page.tsx:30`)
  nem confere o tamanho.
- **Correção:** mínimo 8 no painel do Supabase (Auth → Providers → Email). **1 minuto, gesto do
  Elber**, 🔴 por ser configuração de auth. **Sem card:** fecha quando o Elber mudar e conferir
  tentando cadastrar com 7 caracteres.
- **Prazo:** agora. Faz parte do portão de abertura (DL-063)
- **25/09/2026 — metade feita:** a **T-034** (`19a2917`) pôs a regra única nas 6 telas (8 caracteres,
  maiúscula, minúscula e número) e diz que é "a mesma regra configurada no Supabase". **Falta a prova do
  lado do servidor**, que é o enunciado deste risco: cadastrar com 7 caracteres **sem passar pela tela**
  (ou pela API do Auth) e ver o Supabase recusar. Escrever o resultado aqui. Só então o item 6 do portão fecha.

### R-066 — Conta aprovada não tem caminho pela interface de volta à fila
- **Descoberto:** 23/09/2026, pelo `vetria-qa`, escrevendo `admin-validacoes.spec.ts`
- **O quê:** depois de `active`, nada na interface devolve a conta a `pending_validation`: o
  onboarding não é mais alcançável pelo portão de `active`, o editor de perfil é casca (T-019) e o
  trigger de revalidação só dispara por escrita que hoje só o PostgREST faz. **Para o teste**, conta
  de teste aprovada é conta perdida (o projeto de teste da T-029 resolve). **Para o produto**, o
  profissional aprovado que precisa corrigir CRMV ou nome não tem por onde.
- **Por que 🟡:** ninguém de fora está `active` ainda; a pergunta de produto já está escrita no
  card da **T-019** (*"quais campos um profissional `active` pode editar sem voltar para a fila"*).
- **Task:** lado do teste na **T-029**; lado do produto na **T-019** (F6/S11). 🟡

### R-040 — `onboarding_completed` é escrito pelo próprio usuário e é o sinal em que o app roteia (SEC-061)
- **Descoberto:** 09/09/2026, revisão independente da T-006 (R-034)
- **Onde:** `0000_baseline.sql:193-207` · `app/app/page.tsx:20` ·
  `app/app/estabelecimento/onboarding/page.tsx:23,45`
- **O quê:** a policy `profiles_update_own_safe_fields` pina role, admin_level, admin_team,
  status e status_motivo, e **não pina `onboarding_completed`** — de propósito, quando a coluna
  era autodeclaração de tela casca. Só que `admin_definir_status` a usa como **mecanismo de
  reprova** (`0002:697-711`), e o `/app` roteia por ela. **O próprio repo é a prova de conceito:**
  `estabelecimento/onboarding/page.tsx:45` escreve a coluna com a sessão do usuário, hoje, em
  produção.
- **Nada cruza usuário e nada entra na busca** (o `status` segue pinado). O que cai é o canal
  pelo qual o admin comunica a reprova. **Por isso 🟡.**
- ✅ **20/09 — A METADE BARATA FOI FEITA: `app/app/page.tsx` roteia por `profiles.status`**,
  pela T-016, em produção por `eb6e2d6`. Conferido no código.
- ⚠️ **O RISCO NÃO FECHA, e a parte que sobra é a que tem nome:** a policy
  `profiles_update_own_safe_fields` **continua sem pinar `onboarding_completed`**, o dono continua
  escrevendo a coluna por PostgREST, e `admin_definir_status` **continua usando a coluna como
  mecanismo de reprova** (`0002:697-711`). O app parou de **rotear** pelo que o usuário escreve; o
  admin ainda **comunica reprova** por ela. Pinar a coluna é migration, é 🔴, e mora na **T-017**.
- ⚠️ **A T-007 decide isto sem perceber:** o arquivo que ela reescreve tem os dois usos. Clonar o
  `page.tsx` do veterinário resolve; "preservar a lógica existente" perpetua. **E a Server Action
  inline daquele arquivo (linhas 33-59) confere sessão e NÃO confere role** — a T-007 tem que
  apagar esse padrão, não clonar.

### R-041 — `whatsapp` gravado sem formato, sem normalização e sem verificação (SEC-062)
- **Descoberto:** 09/09/2026, revisão independente da T-006 (R-034)
- **Onde:** `actions.ts:154,235-236,293` · `campos.ts:64` · coluna `text` sem CHECK
  (`0002:294`)
- **O quê:** a única regra é o teto de 24 caracteres. Sem dígitos obrigatórios, sem normalização
  (o mesmo número vira três strings), sem posse. Pelo **DL-047** o servidor **devolve esse valor**
  no evento de contato e conta a linha em `contatos` como lead entregue.
- ✅ **20/09 — A NORMALIZAÇÃO PASSOU A EXISTIR, nas duas personas, num lugar só:**
  `lib/contato/whatsapp.ts` (`08dd42b`), em produção por `eb6e2d6`.
  ⚠️ **E o caminho até aqui é o achado que vale mais que o conserto.** A T-007 escreveu a
  normalização **só no arquivo dela**. **Três auditorias de segurança não pegaram**, porque as
  três leram o código do **estabelecimento** — o arquivo novo, o que estava em revisão. **O gêmeo
  velho não foi lido por ninguém**, e o defeito ficou aberto do lado do veterinário por 11 dias,
  invisível. Quem descobriu foi o `select` do Elber, em 20/09: `62 992653278`, com espaço, do lado
  do vet; `62992653278` do lado do estabelecimento.
  **É o R-017 pela terceira vez: clone herda defeito — e revisar o clone não é revisar o par.**
- ⚠️ **O RISCO NÃO FECHA, e são duas coisas que faltam:** **(1)** não há verificação de posse do
  número (SMS está fora dos 3 meses) nem CHECK no banco — a coluna continua `text` sem constraint,
  e isso é **T-017**; **(2)** a normalização vale na **escrita**, e o que já estava gravado
  continuou sujo — isso virou o **R-055** e o card **T-026**.
- **Não confundir com R-036:** aquele diz que o campo é opcional (decisão de produto). Este diz
  que, **quando preenchido, ninguém olha o que é.**
- **Vence quando a rota de contato da F4 precisar montar um `wa.me`** a partir de string que pode
  não ser dígito. Normalizar depois de haver base gravada em três formatos custa muito mais.
- **T-007 herda** (mesmas colunas, e no estabelecimento há fixo, 0800 e ramal).

### R-042 — Três escritas, nenhuma transação, e a T-008 é onde isso vira documento órfão (SEC-063)
- **Descoberto:** 09/09/2026, revisão independente da T-006 (R-034)
- **Onde:** `actions.ts:247-269`, `287-297`, `313-351`
- **O quê:** a Action faz três idas ao banco sem transação e sem compensação. **Na T-006 o efeito
  é baixo e autocorrigível** (linha em `vet_profiles` sem `perfil_privado`, status ainda
  `incomplete`, a pessoa volta e conclui). **Por isso 🟡.**
- ⚠️ **A T-008 herda MUITO pior.** Pelo **DL-055** (ver R-031), o passo 7 escreve o objeto no
  bucket com `service_role` e o passo 8 grava a linha com a sessão do usuário: **dois sistemas
  diferentes.** Passo 7 grava, passo 8 é recusado (CHECK all-or-nothing, guarda da SEC-044, hash
  malformado) = **documento de identidade órfão no bucket, sem linha dizendo de quem é.** É o
  **R-023** inteiro nascendo na criação em vez de na exclusão.
- **O card da T-008 precisa dizer, por escrito, em que ordem os passos 7 e 8 rodam e quem apaga
  o objeto quando o 8 falha.** Hoje não diz nem uma coisa nem outra.
- ✅ **09/09 — a pergunta FECHOU no card da T-008** (seção 🔒 *A ordem, a compensação e a
  varredura*), pelo `vetria-maestro`: **ordem 7 → 8** (objeto antes da linha), **compensação na
  própria rota** com o `service_role` do passo 7 e marca `DOCUMENTO_ORFAO` no log quando a
  compensação também falha, e **varredura por `left join` de `storage.objects` com
  `perfil_privado`**, possível só porque o caminho começa pelo uuid do dono (T-002). Custo
  aceito, escrito no card: **o órfão continua possível** se o processo morrer entre o 7 e o 8.
- ✅ **20/09 — a parte de código do contrato EXISTE.** A T-008 subiu em `eb6e2d6`:
  `app/api/documentos/upload/route.ts:184` tem `compensarObjetoOrfao`, chamada no `:456` com o
  `service_role` do passo 7, e a marca `DOCUMENTO_ORFAO` no `:197` quando a própria compensação
  falha. **A frase "nada disso existe em código" abaixo era verdade até 20/09 e deixou de ser.**
- ✅ **21/09 — a VARREDURA parou de mentir (SEC-083 / T-021).** A consulta escrita no card da
  T-008 classificava por comparação de tempo e rotulava *"versão anterior de reenvio
  (esperado)"* justamente o órfão **mais velho** que o último envio bem-sucedido — que é **o
  caso normal deste risco**: o passo 7 grava, o processo morre, a pessoa reenvia e o 8 grava o
  caminho novo. **A rede deste risco mandava ignorar exatamente o que ela existe para pegar.**
  A coluna `classe` saiu, a consulta devolve `dono_uuid`, `created_at` e `enviado_em_da_linha`, e
  o cast de uuid saiu do `left join` (um objeto fora da convenção derrubava a varredura inteira).
  **Três cópias da mesma promessa errada foram consertadas**, e a terceira estava no texto que a
  `0004` deve copiar palavra por palavra.
- ⚠️ **O risco continua ABERTO, e é honesto dizer por quê.** O que fechou foi o contrato, e
  agora também o código da compensação e o texto da varredura. **Faltam duas coisas, e nenhuma
  é texto:** (1) **a varredura nunca foi rodada** — ninguém sabe se existe órfão no bucket, e
  neste projeto risco não fecha porque o doc mudou, fecha quando o comportamento muda ou quando
  a medição é feita; (2) o texto que a `0004` tem que carregar (**R-031**) continua sem arquivo:
  `supabase/migrations/` tem `0000` a `0003` e mais nada. E o buraco de origem **segue aberto por
  escolha**: o processo pode morrer entre o 7 e o 8, e aí a compensação nem roda.
- ⚠️ **E o que a varredura corrigida NÃO resolve:** ela não distingue órfão do passo 8 de
  versão anterior de reenvio legítima, porque **nenhuma tabela guarda histórico de caminhos**.
  A saída honesta foi entregar dado e deixar a leitura para o humano. **Distinguir com certeza é
  tabela nova, logo migration, logo 🔴, e não tem card** — está escrito nos cards da T-008 e da
  T-018 como a única saída possível, e a decisão de criar a tabela é do Elber.
- 📏 **23/09/2026 — a varredura RODOU pela primeira vez (Elber, SQL Editor, produção): ZERO linha nas duas consultas** do card da T-008. Nenhum objeto em `documentos` sem linha apontando para ele, e nenhum objeto fora da convenção `<uuid>/`. **O risco NÃO fecha com isso:** a medição diz que hoje não há órfão, e o mecanismo (processo morrendo entre o 7 e o 8) continua possível por custo aceito. O que mudou é que a varredura deixou de ser teórica.

### R-043 — Nenhum registro de consentimento na coleta, e a T-007 coleta dado de TERCEIRO (SEC-064)
- **Descoberto:** 09/09/2026, revisão independente da T-006 (R-034)
- **Onde:** `VetOnboardingForm.tsx:294-302` contra `actions.ts:247-304`
- **O quê:** a tela afirma *"Seus dados são protegidos pela LGPD"* e não há checkbox, versão de
  termo, coluna nem linha em `audit_logs`. **Não é explorável: é lacuna de conformidade**, e a
  rotina de exportação da F6 não vai ter o que exportar sobre consentimento.
- ⚠️ **Na T-007 muda de natureza, e por isso não espera a F6:** o formulário do estabelecimento
  coleta `responsavel_tecnico`, que o `comment on column` da `0003:1290` descreve como *"PESSOA
  FÍSICA, que pode nem ser a titular da conta e nunca consentiu em virar dado público"*. **A T-007
  é o primeiro ponto do produto em que a Vetria coleta dado pessoal de alguém que não está na
  tela.** Custa um parágrafo na tela agora.

### R-044 — `perfil_privado.whatsapp` passa a ter dois formatos incompatíveis na mesma coluna (SEC-065)
- **Descoberto:** 09/09/2026, revisão do clone da T-007 (`SEC-2026-09-09-T007-revisao.md`)
- **Onde:** `estabelecimento/onboarding/actions.ts:110-113` e `117-149` contra
  `veterinario/onboarding/actions.ts:154` e `293`
- **O quê:** a T-007 corrigiu a SEC-062 do lado do estabelecimento e o veterinário continuou como
  estava. A partir do merge a mesma coluna guarda **dígitos puros sem DDI** nas linhas `clinic` e
  **a string crua digitada** nas linhas `vet`. O comentário do arquivo novo chama isso de
  "contrato do que fica gravado", no singular — e ele vale pra metade da tabela.
- **Como se manifesta:** a rota de contato do DL-047 monta `wa.me/55` + valor sem saber de que
  tipo é a linha, e produz link quebrado pra todo vet que digitou `(63) 99999-9999`.
- ⚠️ **É o mecanismo do R-034 outra vez:** garantia que existe só em comentário, e quem escrever a
  rota da F4 vai acreditar nela.
- **Direção:** aplicar `normalizarWhatsapp` também no vet e fazer backfill, ou mover a
  normalização pro banco. Enquanto não: o comentário tem que dizer que vale só pra `clinic`.
- **Prazo:** antes da rota de contato da F4. **Candidato a card próprio, 🟡, pequeno.**

### R-045 — A declaração de autorização do responsável técnico não é registrada, e a tela promete remoção que não existe (SEC-066)
- **Descoberto:** 09/09/2026, revisão do clone da T-007
- **Onde:** `ClinicOnboardingForm.tsx:180-185`
- **O quê:** a frase que o card pediu está lá e está bem escrita, mas é **copy**: sem checkbox,
  sem coluna, sem versão de termo, sem linha em `audit_logs`, e o consentimento não é condição de
  envio. E ela promete que o dado *"pode ser removido a pedido"* — **não existe rotina de remoção
  (F6/S11) nem canal registrado pro pedido.**
- **Não bloqueou o merge:** o card pediu uma frase e a frase foi entregue. Consentimento
  versionado é F6 por decisão registrada.
- **Direção:** o barato agora é a frase parar de prometer processo inexistente. Carimbar
  `responsavel_tecnico_declarado_em` seria migration (🔴).

### R-046 — `perfil_privado.cnpj` não tem unicidade: duas contas reivindicam a mesma empresa (SEC-067)
- **Descoberto:** 09/09/2026, revisão do clone da T-007
- **Onde:** `estabelecimento/onboarding/actions.ts:162-180` e `393` contra `0003:812-815`
- **O quê:** `normalizarCnpj` confere formato e diz por escrito que não confere dígito
  verificador. O que ninguém confere é se aquele CNPJ **já pertence a outra conta**: não há índice
  único e não há checagem na Action. CNPJ é dado público na Receita.
- **Como explorar:** conta `clinic` nova pelo funil público, CNPJ de um concorrente, concluir. A
  conta entra na fila de validação com a identidade de outra empresa, ao lado da legítima.
- **Não há exposição pública** enquanto ninguém está `active` — por isso 🟡. O controle que segura
  é humano e ainda não existe: o admin da S4 conferindo o documento da T-008.
- **Direção:** índice único parcial é migration (entra na conversa da **T-017**). O barato é uma
  linha no card da S4: o admin compara CNPJ com documento, e a fila mostra se o CNPJ repete.

### R-049 — A T-007 é o primeiro código que grava endereço e CEP possivelmente residenciais em tabela pública (SEC-070)
- **Descoberto:** 09/09/2026, revisão do clone da T-007
- **Onde:** `estabelecimento/onboarding/actions.ts:349-350` contra `0003:1283-1289`
- **O quê:** os `comment on column` da `0003` dizem que `endereco` e `cep` são "PÚBLICA hoje" com
  "PERGUNTA EM ABERTO (SEC-041)" — é o **R-032**, que nunca foi respondido em `05-DECISOES.md`.
  Até hoje era teórico porque nenhum código gravava as colunas. **Este diff começa a gravá-las.**
- **Impacto hoje: nenhum** (`clinic_profiles_select_publico` exige `active`, e ninguém está). O
  custo aparece na F4/S7 com base já gravada: reverter vira migration mais backfill, não decisão.
- **Crédito onde é devido:** o formulário **avisa** que o endereço é público, no passo 2.
- **Direção:** é o R-032 ganhando data de vencimento real. A resposta escrita antes da F4/S7.

### R-050 — O handoff da T-007 descrevia errado para onde vai o estabelecimento que concluiu, e o destino real é a lacuna da T-016 (SEC-071)
- **Descoberto:** 15/09/2026, segunda revisão independente do clone da T-007
  (`docs/relatorios/SEC-2026-09-15-T007-revisao-do-clone.md`)
- **Onde:** `docs/03-TAREFAS.md`, Resultado da T-007, *Descobri 1* · contra `app/app/page.tsx:20-24`
  e `supabase/migrations/0002_nucleo.sql:753-755`
- **O quê:** o handoff afirmava que um `clinic` que concluiu e depois digita `/app` *"volta pro
  onboarding em modo revisao em vez de ir pra `/aguardando`"*. **Não volta, e foi conferido no
  SQL:** `concluir_onboarding_profissional()` escreve `status = 'pending_validation'` **e**
  `onboarding_completed = true` no **mesmo `update`**, e `app/app/page.tsx:20` só manda pro
  onboarding quem tem `onboarding_completed` **falso**. O destino real é **`/app/estabelecimento`,
  o painel**, que não lê `profiles.status` (**R-038**) e renderiza para quem está em
  `pending_validation`.
- **Impacto: nenhum dado vaza** — as páginas do painel são casca hoje. O custo é de
  **dimensionamento**: quem lesse o card para dimensionar a T-016 leria um sintoma cosmético
  ("volta pro formulário") onde está exatamente a lacuna que a T-016 existe para fechar.
- ⚠️ **É o mecanismo do R-034 de novo, em outro suporte:** garantia escrita em doc que o código não
  cumpre, e que a próxima sessão vai ler como se fosse medida.
- ✅ **15/09 — a frase foi corrigida no card da T-007** pelo `vetria-escriba`, com os dois ponteiros
  de `arquivo:linha`, e o comportamento real ficou registrado também no card da **T-006** — que
  **nunca chegou a carregar a frase errada**, ao contrário do que o relatório supôs.
- **O risco continua ABERTO porque o comportamento continua:** `/app` roteia por
  `onboarding_completed`. **Dono: T-016**, onde *"`app/app/page.tsx:20` passa a rotear por
  `profiles.status`"* já é item do card. 🟡

### R-051 — O estabelecimento reprovado cai no formulário em modo "novo", e o `status_motivo` não é lido nem exibido em lugar nenhum (SEC-072)
- **Descoberto:** 15/09/2026, segunda revisão independente do clone da T-007
- **Onde:** `app/app/estabelecimento/onboarding/page.tsx:34-38` (o `select` pede `role, status` e
  nada mais) e `:120` (`modo` é `"revisao"` só quando `pending_validation`) · contra
  `supabase/migrations/0002_nucleo.sql:702-712`
- **O quê:** `admin_definir_status` devolve `onboarding_completed = false` ao reprovar, e o
  comentário da própria migration diz por quê, com todas as letras: *"Sem isto (…) o roteamento
  manda o reprovado pro painel, e ele nunca alcança a tela onde o `status_motivo` aparece: fica sem
  saber por que foi reprovado."* **Essa tela não existe.** O reprovado volta para
  `status = 'incomplete'`, `/app` o manda para o onboarding, o guard aceita `incomplete`, e ele
  recebe um formulário pré-preenchido com o título *"Vamos cadastrar o seu estabelecimento"* e
  **nenhuma menção ao motivo da reprova**.
- **Não é vazamento. É o laço de reprova mudo:** a pessoa reenvia o mesmo dado, o admin reprova de
  novo, e a fila da S4 recicla. O mecanismo que o banco implementa de propósito não tem contraparte
  na interface. Por isso 🟡.
- **Herdado da T-006** — o `page.tsx` do veterinário também só seleciona `role, status`. **O clone
  não piorou nada**, mas é aqui que o defeito passa a existir para `clinic`. **Não é conserto da
  T-007**, e o relatório diz isso.
- **Correção:** o `page.tsx` selecionar `status_motivo` junto, e o formulário exibi-lo quando
  `status = 'incomplete'` e o motivo não for nulo. **É leitura da própria linha: sem migration, sem
  policy.**
- **Dono:** registrado como **sugestão** no card da **T-016** (candidato natural: ela já toca o
  roteamento por `status`), com a alternativa de virar **card da S4**, junto com a fila de
  validação, que é quem produz a reprova. ⚠️ **Quem fecha escopo de card é o `vetria-maestro`.**
- ✅ **16/09 — ESCOPO FECHADO PELO `vetria-maestro`: NÃO entra na T-016. VAI PARA A S4.** Nem na
  passada de agora (o diff está em revisão) nem na segunda passada que o `vetria-backend`
  propôs: **restam 6 dias de F3 e a T-008 não começou.** A razão de fundo não é só prazo — **a
  reprova com motivo só passa a existir quando alguém reprovar, e quem reprova é a fila de
  validação da S4.** A tela do motivo nasce junto com o que a produz, e aí ela pode ser provada
  de verdade, com uma reprova real, em vez de ficar escrita sem caso de teste. **Isto não abre
  card hoje**; abre na abertura da S4, e esta linha existe para que ele não volte a ficar sem
  dono, que é como o R-034 nasceu. 🟡

### R-052 — Item de `servicos` não tem teto de tamanho individual, e a mensagem de erro devolve o item cru ao cliente (SEC-073)
- **Descoberto:** 15/09/2026, segunda revisão independente do clone da T-007
- **Onde:** `app/app/estabelecimento/onboarding/actions.ts:267-275`
- **O quê:** o teto de **quantidade** existe e vem antes da varredura (SEC-058, herdada da T-006),
  mas **não há teto por item**. `limpar()` só recorta espaços, e o item que não passa na whitelist
  volta interpolado na mensagem de erro, que o formulário renderiza. Um POST na Action com um item
  de ~1 MB devolve o megabyte inteiro de volta.
- **Impacto: baixo e honesto.** **Não é XSS** (React escapa o texto e não há
  `dangerouslySetInnerHTML` em nenhum arquivo do diretório), **não é DoS relevante** (o total é
  limitado pelo `bodySizeLimit` de 1 MB e o trabalho é linear) e **não vaza dado de ninguém**.
- **Por que entra mesmo assim:** é **defesa em profundidade**, e essa mensagem vai ser clonada de
  novo — **o original do veterinário tem a gêmea, em `especialidades`**.
- **Correção:** teto por item antes da comparação, e truncar o valor na mensagem ou não ecoá-lo.
  **Corrigir junto com a gêmea de `especialidades`**, numa passada só: consertar um lado e deixar o
  outro é exatamente como o **R-044** nasceu. **Não é conserto da T-007.** 🟡

### R-054 — `/admin/usuarios` renderiza para admin comum, e a matriz §2 diz ❌
- **Descoberto:** 16/09/2026, pelo `vetria-backend` durante a T-016 (*Descobri 4*).
  **Pré-existente, não é da T-016** — a página é de `15c38db`, da fase visual.
  ⏳ **EM CONFIRMAÇÃO PELA REVISÃO DA T-016, que está em curso agora** (`vetria-seguranca`).
  Se o auditor classificar 🟠, a gravidade sobe e este risco ganha card.
- **Onde:** `app/admin/usuarios/page.tsx:20-26` × `docs/06-PERMISSOES.md` §2, última linha da
  matriz de rotas
- **O quê:** a matriz dá **❌ para admin comum** e **✅ só para master** em `/admin/usuarios`, e
  ❌ nesta matriz significa, por escrito, *"bloqueado no servidor"*. A página confere
  `if (!profile || profile.role !== "admin") redirect("/app")` e **nada mais**: um admin comum
  alcança a rota, recebe **200** e vê o chrome da tela.
- ⚠️ **O que a gravidade muda, e foi conferido no código pelo `vetria-maestro` em 16/09, não
  suposto: NÃO VAZA DADO NENHUM.** O `<AdminPanel />`, que é a ferramenta de RBAC e lista a
  base inteira de usuários, está **dentro do ramo `isMaster`** (`:36-44`). O admin comum cai no
  `else` (`:45-50`), que renderiza uma caixa de texto dizendo que só master altera permissões.
  **Zero linha de `profiles` de terceiro chega nele.** As rotas `/api/admin/*`, que são onde a
  escrita mora, **estão corretas** e foram endurecidas na T-015.
- **Por que continua sendo risco, e não frescura de documentação:**
  1. **É a §8 desta matriz falhando.** *"Para cada ❌, um teste que loga com aquele role, tenta a
     rota e exige o bloqueio."* Esse teste, quando a S11 o escrever, **falha** — e vai falhar
     descrevendo o código, não o contrato.
  2. **A defesa está no lugar errado.** Hoje quem separa admin de master nesta tela é um
     `? :` de renderização. No dia em que alguém acrescentar um segundo bloco fora do
     `isMaster`, o vazamento nasce sem que ninguém tenha mexido na autorização — porque não há
     autorização ali para mexer.
  3. **Hoje o impacto é zero porque não existe admin comum.** O **R-014** registra que
     *"não está definido quem OPERA o painel admin"*, e provavelmente só o Elber tem conta.
     **A S4 é exatamente a semana que cria essa persona** (`/admin/validacoes`, a fila real).
     O risco não é de hoje; é do dia em que a primeira conta `admin` não-master existir.
- 🎯 **Prazo real: antes da primeira conta `admin` com `admin_level = 'admin'`.** Enquanto só
  houver master, é divergência de doc. Depois disso, é a matriz §2 não valendo no servidor.
- **Decisão do `vetria-maestro`, 16/09: NÃO ganha card próprio nesta fase, e a razão é de
  prioridade, não de mérito.** Restam **6 dias de F3**, a fila é **T-007, T-008 e T-016**, e a
  **T-008 não começou** — ela é o item 3 do DoD e não tem uma linha escrita. Abrir um quinto
  card para consertar uma tela que hoje não vaza nada seria tirar tempo do único item da fase
  que não tem nada pronto. **Vai como linha de entrada na abertura da S4**, junto com o resto
  do painel admin, onde a correção é 3 linhas na mesma passada em que a fila de validação
  nasce: `redirect("/app")` quando `admin_level !== 'master'`, e o `else` da renderização some
  junto por ter ficado inalcançável.
- ⚠️ **Não corrigir isto dentro da T-016**, mesmo sendo pequeno. O card proíbe encostar em
  `/admin/*` e o diff está em revisão: escopo de card não cresce sozinho (`AGENTES.md`, regra
  8), e **foi o `vetria-backend` recusando ampliar o próprio escopo que fez este achado
  existir com essa clareza.** 🟡

### R-055 — A normalização do WhatsApp vale na escrita, e o dado que já estava gravado continuou sujo
- **Descoberto:** 20/09/2026, pelo **Elber**, na prova de persistência da T-007. **Medido em dado
  real**, não deduzido do código
- **Onde:** `lib/contato/whatsapp.ts` (a função, que existe desde `08dd42b`) × as linhas de
  `perfil_privado` gravadas **antes** dela
- **O quê:** o conserto do **R-041** normaliza na **escrita**. Quem já estava gravado continuou
  como estava: o `select` de 20/09 devolveu **`62 992653278`, com espaço**, para o veterinário. A
  linha só ficou limpa quando o Elber **salvou o perfil à mão**.
- **Hoje o impacto é zero, e é por isso que é 🟡:** são contas de teste, e o Elber já corrigiu a
  dele. **O que muda de categoria é a escala.** Pelo **DL-047** é esse valor que o servidor
  devolve no evento de contato e que conta como lead entregue: número com espaço é CTA que não
  abre conversa. Em base real, o conserto vira `update` em linha de terceiro, que é **🔴**.
- **A medição, e é um `select`:**
  `select id, whatsapp from perfil_privado where whatsapp is not null and whatsapp !~ '^[0-9]+$';`
  **Zero** → fecha com a medição escrita. **Mais que zero** → cada linha é conta de teste ou conta
  de gente, e se houver conta de gente é **sessão presencial**.
- **A lição, que vale além deste campo:** **normalização na escrita não retroage.** A próxima que
  este projeto adotar nasce com *"e o que já está gravado?"* respondido dentro do card.
- **Task:** **T-026** · **Prazo:** a medição, na S4. A correção, antes do primeiro profissional de
  fora. 🟡
- 📏 **23/09/2026 — a medição rodou: UMA linha suja.** `perfil_privado.id = e5a1a020-0e71-4f52-89fc-b57c83043179`, `whatsapp = '62 99265327'`: com espaço **e com 10 dígitos** (celular com DDD tem 11), então além de sujo o número parece incompleto. **Não é a linha de 20/09** (`62 992653278`, que o Elber já corrigiu). A dona está entre as 4 contas de teste da fila (a consulta 6b mostrou `perfil_privado` só em `vet` 3 e `clinic` 1). **O conserto não precisa de `update` 🔴:** desde a T-025 a dona abre *"Rever e corrigir o cadastro"* em `/aguardando`, chega ao fim e salva, e a Action normaliza na escrita. Se o número estiver de fato incompleto, ela corrige o dígito no mesmo gesto. ✅ **Feito no mesmo dia:** a dona salvou pelo *"Rever e corrigir o cadastro"* e a consulta rodou de novo: **zero linha. R-055 FECHA por medição** (o critério escrito acima: *"Zero → fecha com a medição escrita"*). A lição fica: normalização na escrita não retroage, e o caminho que a fez retroagir aqui foi a própria interface.

### R-056 — O corpo do pedido é materializado inteiro antes do teto, nas duas rotas de documento (SEC-082)
- **Descoberto:** 16/09/2026, auditoria da T-008
- **Onde:** `app/api/documentos/upload/route.ts:270-289` · `app/api/documentos/abrir/route.ts:54`
- **O quê:** `await req.formData()` lê e faz o parse do multipart **inteiro** na memória da
  função, e só depois o teto de 10 MiB é aplicado. O comentário diz *"limite duro no servidor"*, e
  ele é duro sobre o **arquivo**, não sobre o **corpo**. No `abrir`, `await req.json()` acontece
  **antes** da leitura de `profiles`, ou seja, antes da conferência de role.
- **Como explorar:** conta logada, `curl -F arquivo=@100mb.bin`. A função aloca ~100-200 MB antes
  de responder 413; alguns pedidos em paralelo derrubam a instância por memória.
- **Impacto:** recusa de serviço por esgotamento de memória, com custo de execução junto. É
  **autenticado**, então a barreira é criar conta — a mesma barreira da SEC-081 / T-020.
- **Correção:** conferir `content-length` contra um teto com folga **antes** de
  `formData()`/`json()`, e no `abrir` mover a leitura de `profiles` para antes do `req.json()`.
- **Sem card, de propósito:** é conserto natural da **T-020**, que é quem vai mexer em teto de
  volume nessa mesma rota. Se a T-020 escorregar para a F6, este vai junto. 🟡

### R-059 — O número do CRMV é texto livre, e cidade e estado não são conferidos um contra o outro
- **Descoberto:** 23/09/2026, pelo **Elber**, na prova em tela da T-023. **Visto em dado real**
- **Onde:** `app/app/veterinario/onboarding/actions.ts:149-215`
- **O quê:** a fila mostrou `CRMV-AL GO-0155 · Goiânia / AP` para uma conta só. **Cada campo,
  sozinho, passou pela validação que existe:** `crmv_uf` e `estado` são conferidos contra a
  lista de UFs (`:194`, `:214`), e AL e AP são UFs válidas. O que **não** é conferido: o
  **número** do CRMV só tem teto de 20 caracteres (`:190`), então aceita `GO-0155` com a sigla de
  outra UF dentro; e **cidade é texto livre**, nunca cruzada com o estado. A mesma fila mostrou
  `GO-0155` também na conta da Larissa, com UF AC.
- **Por que 🟡 e não mais:** a conferência humana existe para isto. O admin vê o CRMV inteiro e
  o documento antes de aprovar, e a T-024 é quem decide. Os dois `GO-0155` são de UFs
  diferentes, então **não** são o mesmo registro. São dado de teste digitado à mão.
- **Não é o R-039:** aquele é o banco aceitar o que a Action recusaria. Aqui **a própria Action
  aceita**. Se a T-017 escrever CHECK no formato do número, cobre as duas portas de uma vez.
- **Correção:** formato do número do CRMV na Action (e no CHECK da T-017, se ela nascer), e
  cidade escolhida de lista por UF, ou aviso ao admin quando não bater.
- **Task:** **T-027** (o CHECK do formato do número na `0004`) e a linha espelho na Action vai no
  mesmo card. A cidade escolhida de lista por UF depende da tabela `cidades` da **T-028**. 🟡
- ✅ **25/09/2026 — FECHADO EM PARTE.** **O CRMV fechou** (`0004`, ver ✅ FECHADOS). **Cidade × UF ficou
  mais estreito:** a `cidades` existe (5571, IBGE) e a busca casa por chave normalizada (DL-068); quem grava
  "Goiânia / AP" simplesmente não aparece no filtro de Goiânia/GO, e a sonda 6 da `0005` lista essas contas.
  **O que sobra:** a tela ainda aceita cidade em texto livre. Trocar por lista de cidades da UF é card de
  tela **sem data**; o admin vê cidade e UF antes de aprovar. ⚪ enquanto a fila for pequena.

### R-058 — `lib/supabase/admin.ts` não tem `import "server-only"`, e o número de importadores dobrou (SEC-089)
- **Descoberto:** 16/09/2026, auditoria da T-008
- **Onde:** `lib/supabase/admin.ts:1-7`
- **O quê:** o módulo que lê `SUPABASE_SERVICE_ROLE_KEY` é um módulo comum. **Nada além de
  convenção** impede que um arquivo com `"use client"` o importe. Tinha dois importadores; com a
  T-008 são quatro.
- **Alcançabilidade hoje: nenhuma.** Os quatro importadores são Route Handlers com
  `runtime = "nodejs"`, e mesmo no erro futuro a chave não vazaria — o Next só inlina
  `NEXT_PUBLIC_*`, então o valor viraria `undefined` no bundle. O que aconteceria é **quebra
  confusa em runtime**, com a garantia dependendo de o bundler continuar sendo o que é.
- ⚠️ **É DECISÃO DO ELBER, e é por isso que está aqui e não num card:** `server-only` **não é
  dependência deste projeto**, e dependência nova é 🟡 com diff pelo `CLAUDE.md`. O
  `vetria-seguranca` recusou aplicar sozinho, e recusou certo.
- **Custo da decisão:** um `npm i` e uma linha. **O que se compra:** a garantia vira **erro de
  build** em vez de disciplina. 🟡

### R-027 — O pré-voo 1.2 aborta sobre uma condição que ninguém mediu, e manda consertar por um caminho que não existe (SEC-047)
- **Descoberto:** 26/08/2026, 2ª auditoria da `0003`, antes de aplicar
- **O quê:** a promoção de `raise warning` para `raise exception` em `storage.buckets` sem RLS **está certa**. O problema é o que sobra: `relrowsecurity` de `storage.buckets` **e** de `storage.objects` não foi medido, então as duas metades do pré-voo 1.2 abortam sobre uma condição que ninguém olhou. E a mensagem manda "ligue pelo painel": o painel tem UI para **policy** de storage, não para `alter table storage.buckets enable row level security` — comando que exige ser dono da tabela (`supabase_storage_admin`), que `postgres` não é.
- **É risco de cronograma, não de vazamento.** A migration falha fechada. Mas o operador fica sem caminho no meio de uma sessão presencial, e **a T-002 já escorregou uma semana**.
- **Agravante:** as duas metades moram no **mesmo bloco `do`**. Comentar uma desliga a asserção mais valiosa do arquivo (`storage.objects` sem RLS) junto.
- **Medição de 10 segundos, antes de agendar:** `select relname, relrowsecurity from pg_class where relnamespace = 'storage'::regnamespace and relname in ('objects','buckets');` **As duas têm que vir `true`.**
- **Se `buckets` vier `false`:** separar as duas metades em dois blocos `do` e trocar a instrução por "decida com o Elber e registre em `05-DECISOES.md`". Não vira card próprio.
- **26/08 — medido, e as duas vieram `true`** (Sonda 2). O pré-voo não abortou e a `0003` aplicou. **O achado continua aberto porque o que ele descreve não é a medição, é a mensagem:** ela manda ligar RLS pelo painel, e o painel não faz isso. Quem rodar este arquivo num ambiente novo, ou a `0004` copiando o formato, cai na mesma parede sem saída escrita.

### R-028 — `add column if not exists` pula o CHECK inline em silêncio (SEC-048)
- **Descoberto:** 26/08/2026, 2ª auditoria da `0003`, antes de aplicar
- **O quê:** `alter table ... add column if not exists documento_hash text constraint ... check (...)` é **uma** instrução. Se a coluna já existir, o Postgres pula tudo, **inclusive o CHECK**. Vale para `documento_hash` e `documento_tamanho`; o `perfil_privado_documento_completo` está protegido, porque é guardado por um bloco `do` que consulta `pg_constraint`.
- **A assimetria é o achado:** há pré-voo para as colunas de `clinic_profiles`, para o bucket, para as funções e para linhas com documento. **Nenhum para as cinco colunas novas de `perfil_privado`.** Basta alguém ter criado `documento_hash` pelo painel (R-006) e a migration **commita** com o hash virando campo de texto livre, que é exatamente o que o comentário da própria coluna diz querer impedir.
- **Probabilidade baixíssima** (a coluna foi inventada nesta v2). **O que o torna risco é a categoria:** é a única verificação do arquivo que poderia ter abortado e virou relatório pós-fato, e nesse caminho o conserto é **reversão**, não "rodar de novo". Trocar um aborto por uma reversão é o pior câmbio possível numa migration destrutiva.
- **Correção:** pré-voo 1.9 de três linhas, mesmo formato do 1.1 com o sinal trocado. Não vira card próprio.
- **26/08 — a `0003` aplicou e os CHECKs estão no banco** (`checks_do_documento` e `check_all_or_nothing` vieram `true` no select de resultado, e a Sonda 10 exercitou os dois). **O achado continua aberto como padrão, não como estado:** `add column if not exists` com CHECK inline segue sendo uma instrução só, e a próxima migration que copiar o formato herda a armadilha.

### R-029 — A guarda da SEC-044 congela a linha depois de uma troca de role, e a exceção não diz como sair (SEC-049)
- **Descoberto:** 26/08/2026, 2ª auditoria da `0003`, antes de aplicar. **Confirmado no código.**
- **Onde:** a guarda `recusar_dado_de_estabelecimento_em_pessoa_fisica` da `0003` contra `app/api/admin/set-access/route.ts:19-62`.
- **O quê:** a guarda recusa escrita em `perfil_privado` com `cnpj`, `razao_social` ou `responsavel_tecnico` não-nulos quando o dono da linha não é `clinic` — **e a escolha de falhar ruidosamente está certa.** O efeito colateral é que ela olha o estado **novo** de três colunas que podem ter sido gravadas legitimamente sob um role **antigo**. O `set-access` deixa um master trocar `clinic` para `vet` sem limpar nada; depois disso **todo UPDATE naquela linha levanta**, inclusive `set telefone = ...` e o passo 8 da rota da T-008, que nem toca nas três colunas.
- **O sintoma é o mesmo que a SEC-044 quis evitar:** usuário legítimo travado, ticket que ninguém do suporte sabe explicar.
- **A saída existe e a mensagem não diz qual é:** um UPDATE que zere as três passa, porque aí a guarda sai no primeiro `if`.
- **Correção:** uma frase na mensagem da exceção, mais a regra de que trocar role de `clinic` obriga a limpar `cnpj`, `razao_social` e `responsavel_tecnico`.
- **26/08 — a guarda está no banco e funciona sem pegar caminho legítimo** (Sonda 13B: conta `vet` gravando `cnpj` levanta exceção; conta `clinic` grava normal; conta `vet` grava telefone normal). **O efeito colateral descrito aqui não foi corrigido, e agora é real e não hipotético.**
- ✅ **09/09 — a metade que é da T-008 ficou com escopo fechado, e ele não cresce lá:** a rota trata a
  recusa da guarda como **falha nomeada** (compensa o objeto, não cai para `service_role`, e diz que a
  conta está travada e é caso de suporte), e **a frase da exceção fica escrita no card para a `0004`
  levar** — a T-008 **não** faz `create or replace` da função, porque isso é migration e é 🔴.
- ⚠️ **Não existe card de `/api/admin/set-access` hoje.** A outra metade — a regra de que trocar role
  de `clinic` obriga a limpar as três colunas — **continua sem dono** e precisa entrar no **primeiro
  card que tocar essa rota** — o candidato natural é a reescrita de RBAC e middleware da S3 (ver R-001 e R-002). Enquanto esse card não existir, **este risco é o único lugar onde a regra está escrita.**

### R-030 — O pré-voo 1.7 é tautológico para `carimbar_envio_documento`, e manda comparar o corpo com o texto errado (SEC-050)
- **Descoberto:** 26/08/2026, 2ª auditoria da `0003`, antes de aplicar
- **O quê:** para `revalidar_ao_mudar_dado_sensivel` a asserção funciona, porque o hash foi medido **e o corpo foi lido linha a linha contra a `0002`** — **é a leitura que prova**, não o hash. Para `carimbar_envio_documento` o procedimento é: rode `md5(prosrc)` agora, cole na constante, rode a migration. **A asserção passa a comparar produção com produção**, com cinco minutos de diferença, e não prova nada sobre adulteração.
- **Agravante:** o único momento em que o operador vê o corpo real é a mensagem de aborto do `'PREENCHER'`, e ela manda comparar com a **seção 6.b**, que é o corpo **novo**, com a linha do hash. **Produção tem que divergir dela.** O operador ou toma um falso alarme, ou aprende a ignorar a diferença, que é pior.
- **Cenário:** alguém corrige a função pelo painel em setembro, a `0004` copia a receita em outubro, a 1.7 passa, a 6.b sobrescreve a correção, e a reversão restaura o texto da `0002`. **É a SEC-024 inteira, com uma asserção na frente dizendo que foi conferido.**
- **Correção:** duas palavras na mensagem, apontando para **`0002_nucleo.sql:453-470`** em vez da seção 6.b, mais a instrução de **ler** o corpo no passo 0, não só colar o hash.
- **26/08 — na sessão da T-002 o corpo foi lido contra `0002_nucleo.sql:453-470`, como o procedimento pede, e a migration aplicou.** Os `md5` **novos** ficaram em `supabase/migrations/README.md`, que é onde o pré-voo da `0004` vai procurar. **O achado continua aberto:** o texto da mensagem dentro da `0003` não foi corrigido, e é ele que a `0004` vai copiar.

### R-031 — O contrato da rota de upload não diz com qual cliente o passo 8 grava a linha (SEC-051)
- **Descoberto:** 26/08/2026, 2ª auditoria da `0003`, antes de aplicar
- **O quê:** o passo 7 da seção 2.b é explícito ("escrever no bucket com `service_role`"); o passo 8 diz "só então gravar a linha" e **não diz com qual cliente**. Com `service_role`, RLS não se aplica, `auth.uid()` é nulo, e o `insert into audit_logs` do trigger de revalidação grava **`actor_id = null`**: a trilha diz que o perfil voltou pra fila e não diz quem mexeu.
- **É uma regressão que ninguém decidiu.** No desenho antigo, de URL assinada, quem gravava era a sessão do usuário e o `actor_id` saía certo. **A arquitetura nova (DL-051) apagou um dado da trilha por efeito colateral.**
- **É a SEC-040 pela metade:** o arquivo gastou 18 linhas explicando que "quem abriu o RG do fulano em março?" precisa de resposta, e deixa "quem trocou o documento do fulano em março?" sem resposta, no mesmo contrato, por omissão de uma palavra.
- **Correção:** fixar no passo 8 que a linha é gravada **com a sessão do usuário**. Já está escrito no card da **T-008**. Só o passo 7 precisa de `service_role`.
- **26/08 — a `0003` aplicou com o contrato da seção 2.b como estava.** A decisão é do Elber e **ainda não foi tomada**. Ela vence quando a T-008 começar, e é a única pendência do DL-051 que não é código.
- ✅ **31/08 — DECIDIDO: a linha é gravada com a SESSÃO DO USUÁRIO.** Só o passo 7 (escrever
  no bucket) usa `service_role`. Com isso `auth.uid()` sai preenchido e o `insert into
  audit_logs` do trigger de revalidação grava **quem** trocou o documento, que era o dado que a
  arquitetura nova do DL-051 tinha apagado por efeito colateral. Registrado em **DL-055**.
  **A correção do texto da seção 2.b da `0003` ainda não foi feita** — o arquivo continua sem
  dizer com qual cliente o passo 8 grava, e é ele que a `0004` vai copiar. **Este risco só
  fecha quando o passo 8 estiver escrito no arquivo**, não quando a decisão foi tomada.
  A decisão entra no card da **T-008** como critério.
- ✅ **09/09 — o texto existe, palavra por palavra, no card da T-008** (item 6 da seção 🔒),
  pronto para a `0004` copiar, junto com o parágrafo da ordem 7 → 8, o da compensação e a frase
  do R-029 para dentro da exceção da guarda. **A `0003` NÃO foi editada, de propósito:** está
  aplicada em produção desde 26/08 e migration aplicada é histórico.
- ⛔ **Continua ABERTO até esse texto estar num arquivo de migration aplicado.** Decisão
  registrada em doc não vira contrato de código sozinha, e é o arquivo que a `0004` copia.

### R-023 — Excluir a conta apaga a linha e deixa o documento de identidade no bucket (SEC-039)
- **Descoberto:** 26/08/2026, auditoria da `0003`
- **O quê:** `perfil_privado.id` tem `on delete cascade` pra `profiles`, então apagar a conta derruba a linha e o `documento_path`. **O objeto no bucket não é tocado por cascade nenhum** — `storage` é outro serviço. Sem policy, só `service_role` apaga, ou seja: alguém precisa escrever código, e não há card que peça.
- **Por que importa:** RG, CNH e comprovante de CRMV de quem pediu exclusão continuam no projeto, agora **órfãos**, sem nem a linha que dizia de quem eram. LGPD art. 18 VI atendido pela metade, e a metade que fica é a mais sensível.
- **Onde entra:** card da exclusão de dados da **F6**, e citado no card da **T-008**, que é onde a convenção de caminho (`<uuid>/`) é fixada e é ela que torna a varredura possível. Não vira card agora.
- **26/08 — o bucket existe e está VAZIO** (Sonda 1: zero objetos). É a janela mais barata que vai existir para escrever a rotina: hoje não há documento de gente real para ficar órfão.
- ⚠️ **20/09 — ESSA JANELA FECHOU. O bucket deixou de estar vazio.** A T-008 subiu e há documento
  de identidade real dentro de `documentos` — de conta de teste, mas real, com `documento_hash` de
  64 hex e 15683 bytes. **A frase acima passou a descrever um mundo que acabou**, e fica aqui
  porque é a data em que o risco mudou de natureza: até 20/09 era preventivo, agora é retenção.
  A **T-018** continua na F6/S11 por decisão, não por falta de matéria — e a **T-020** (SEC-081)
  é o que impede esse acervo de crescer sem teto antes disso.
- ✅ **09/09 — o card de lá passou a existir: é a T-018**, em `03-TAREFAS.md` §*Plantadas para fases
  futuras* (F6/S11, 🔴, LGPD ancorada em E1). Ele carrega o que este risco pede (apagar o objeto
  antes da linha) **e** a varredura de órfãos escrita no card da T-008. Até 09/09 este risco
  mandava anotar num card que não existia, e anotação em card que não existe é anotação perdida.
- ✅ **21/09 — a consulta que acha conta apagada com documento no bucket foi corrigida (T-021 /
  SEC-083)**, e a coluna que este risco usa passou a ser explícita: `dono_ainda_existe = false`
  significa **conta apagada com objeto vivo**, que é este risco acontecendo, e pede ação. **O
  risco continua aberto:** a consulta existe desde 09/09, ninguém a rodou, e a rotina de exclusão
  da T-018 continua na F6/S11.
- 📏 **23/09/2026 — a varredura rodou: ZERO linha**, então **nenhuma conta apagada com documento vivo no bucket hoje** (`dono_ainda_existe = false` não apareceu). **O risco continua aberto:** ele é sobre a rotina de exclusão que não existe (T-018, F6/S11), não sobre o acervo de hoje.

### R-024 — O CNPJ do estabelecimento viaja no `raw_user_meta_data` e no JWT (SEC-042)
- **Descoberto:** 26/08/2026, auditoria da `0003`. **Confirmado no código.**
- **Onde:** `app/cadastro/estabelecimento/page.tsx:47` manda `cnpj` no `data` do `signUp`. `handle_new_user` ignora o campo, que fica gravado pra sempre em `auth.users.raw_user_meta_data`.
- **Três problemas:** (1) cópia não classificada num lugar que nenhum documento menciona e nenhuma policy governa, no exato momento em que a `0003` decide por escrito que CNPJ é privado; (2) é **dado não confiável** (escrito pelo cliente, reescrevível por `auth.updateUser`), e o risco é alguém na T-007 achar que "o CNPJ já está no metadata" e economizar o campo; (3) **viaja no JWT** — o Supabase inclui `user_metadata` nas claims —, indo pro storage do navegador e pra todo header `Authorization`.
- **LGPD:** a rotina de exportação e exclusão da F6 vai ser escrita olhando `profiles` e `perfil_privado`. Essa cópia escapa das duas, e o defeito é invisível pra quem escrever a rotina.
- **É o único outlier dos três funis:** `app/cadastro/veterinario/page.tsx:46` e `app/cadastro/responsavel/page.tsx:50` mandam só `full_name`, `cidade` e `role`. O custo de alinhar é apagar uma palavra.
- **Bônus, que não é segurança:** `full_name` está recebendo o **nome fantasia**, que não é nome de pessoa, e vai aparecer em saudação e em email como se fosse.
- **Corrige em:** F3/S2, junto com a T-007 (mesmo arquivo, mesmo funil). Não vira card próprio.

### R-035 — O arquivo de verificação afirmava uma medição que ninguém tinha feito
- **Descoberto:** 31/08/2026, ao fechar a T-013.
- **O quê:** o cabeçalho de `supabase/verificar-apos-0003.sql:50-56` afirma, desde o commit
  `a68251d` de **26/08**, que `begin; select 42 as prova; rollback;` **imprime 42 na tela**, e usa
  isso para mandar não reescrever as sondas 3, 7C e 9. **No mesmo commit, o R-026 registrava que
  essa medição não tinha sido registrada, e o card da T-013 continuava pedindo que ela fosse
  feita.** O arquivo afirmava um número que ninguém tinha medido.
- **31/08 — a medição foi feita e o número bateu.** O arquivo estava certo. **Isso é sorte, não
  processo**, e é por isso que o achado sobrevive ao resultado.
- **Por que é a SEC-025 em outro lugar:** aquele achado descreve sonda que parece verificada sem
  ter sido. Aqui é o **cabeçalho** do arquivo de verificação fazendo o mesmo — e o cabeçalho é
  justamente o que o operador lê para decidir se confia no resto.
- **O agravante é o inverso do que parece:** se a medição tivesse dado errado, o arquivo teria
  mandado **não** corrigir três sondas cegas, com uma afirmação de autoridade em cima.
- **Correção:** afirmação de medição no repositório carrega **data e quem mediu**, ou é escrita
  como expectativa ("esperado: imprime 42") e não como fato. Vale para a `0004`, que copia este
  formato. Não vira card próprio: entra no primeiro card que tocar o arquivo de verificação.
- **Prazo:** antes da `0004`. 🟡

### R-036 — O onboarding aprova perfil que a busca não consegue entregar
- **Descoberto:** 31/08/2026, pelo Elber, durante a prova de persistência da T-006. **Medido em
  dado real na preview**, não deduzido do código.
- **O quê:** a T-006 já barra o caso mais grave — concluir sem marcar **nenhuma** forma de
  atendimento, porque aí o profissional não aparece em filtro nenhum. **Faltaram dois da mesma
  família**, e os dois passaram na prova:
  1. **Nenhum canal de contato é obrigatório.** `whatsapp` é opcional. Um veterinário conclui,
     é validado por uma pessoa, entra na busca — e **não há como falar com ele**. Isso colide de
     frente com o **DL-047**, que define o contato como o evento de servidor que o produto
     entrega. `telefone` e `email_contato` nem campo em tela têm hoje.
  2. **`cidade` e `estado` não se conferem.** Foi gravado `cidade = 'Goiânia'` com
     `estado = 'AP'`, e `crmv = 'GO-0155'` com `crmv_uf = 'AL'`. Ninguém procurando em Goiânia/GO
     encontra esse perfil, e ninguém procurando no Amapá espera achá-lo.
- **O padrão é o mesmo nos três casos, e é o que importa:** o profissional preenche tudo, é
  **aprovado por uma pessoa**, e some do produto sem erro em tela nenhuma. É o sintoma da SEC-044
  outra vez — usuário legítimo sumindo sem entender por quê —, agora por dado incompleto em vez de
  por guarda de banco.
- **Não é regressão da T-006.** O código antigo não gravava nada, então nem chegava a ter o
  problema. A task tornou o buraco visível, que é o que uma task boa faz.
- ⚠️ **A T-007 herda os dois**, e no estabelecimento o item 2 é pior: lá `endereco` e `cep` são
  vitrine, e CEP errado num mapa é mais visível que UF errada numa lista.
- **Onde decidir, e o que NÃO fazer:** tornar `whatsapp` obrigatório é decisão de produto, não
  conserto óbvio — pode derrubar conversão no funil. Amarrar cidade a uma lista por UF é trabalho
  de verdade (base de municípios) e não cabe numa task de persistência. **Nenhum dos dois entra
  na T-007 sem card próprio.**
- **Prazo:** decisão escrita antes da busca da **F4/S6**, que é quando os dois viram sintoma real
  para o usuário final. 🟡
- ⚠️ **25/09/2026 — a busca está no ar e o prazo passou.** Item 2: mitigado pela `0005` (ver R-059).
  **Item 1 (WhatsApp opcional) virou a decisão D9 da S8** (`03-TAREFAS.md`), com recomendação: **obrigatório
  para concluir o onboarding a partir de agora**, e aviso no painel de quem já está `active` sem ele. Sem
  WhatsApp, o botão da S8 nem aparece, e o perfil é vitrine sem lead.

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
- **25/09/2026:** os perfis existem e estão `noindex` até o portão. **Resolver junto da T-045** (indexação e
  `sitemap`): uma forma só no `sitemap` e no `canonical`.

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
- **26/08 — o padrão se repetiu na `0003`, na variante mais cara.** A auditoria não achou erro de SQL: achou **salvaguarda que afirma mais do que faz** (pré-voo que diz provar "zero policy" e procura uma string; sonda que entrega o veredito por um canal que o editor não mostra). Salvaguarda que produz confiança falsa é pior que a ausência dela, porque ninguém volta a conferir o que já foi declarado verde. **Corolário do R-016:** revisar a correção não basta se a correção for uma asserção — a asserção também precisa ser exercitada contra o caso que ela diz cobrir.
- **Status:** ✅ virou processo, não fica aberto.

### R-014 — Não está definido quem OPERA o painel admin
- **Descoberto:** 26/08/2026, ao conferir de quem são as 17 contas do banco
- **O quê:** existem apenas 2 contas de admin (1 master, 1 comum). Os sócios da Vetria não são admin: o Durval está no banco como `vet`. A partir da **F3/S4**, quando a validação de CRMV e CNPJ ficar real, alguém precisa abrir a fila diariamente, conferir documento e aprovar.
- **Por que importa:** se só o Elber aprova, ele vira o gargalo de toda entrada de profissional na plataforma. É exatamente o que o DL-045 tentou evitar ao separar admin comum de master.
- **A decidir até a F3/S4:**
  1. Marília e Durval recebem conta de **admin comum** para aprovar profissionais?
  2. Se o Durval também quiser **perfil público de veterinário**, precisa de **duas contas com emails diferentes**. `1 usuário = 1 role` é a regra que sustenta o RBAC inteiro (DL-044), e abrir exceção para sócio é abrir para todo mundo.
- **Não bloqueia a F3/S1.** Bloqueia o uso real da S4.

### R-010 — `.claude/settings.local.json` com ~90 permissões de commit hardcoded
- Cada mensagem de commit virou uma permissão literal. Não escala e polui. Simplificar pra padrões amplos quando incomodar.

---

## ⚪ RISCOS DE PROJETO (não são bugs)

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| **Deriva de escopo** — "já que estamos aqui, vamos fazer avaliações também" | Alta | Fatal pro prazo | `00-ESCOPO.md` congelado + regra de capacidade obrigatória no card + emenda com "o que sai em troca" |
| **Card 🔴 escorregar** | Média | Alto — bloqueia o que vem depois | Card 🔴 só anda em sessão presencial. **Aconteceu duas vezes e as duas fecharam:** T-001 na S1 e T-002, que escorregou uma semana e fechou em 26/08. A regra que funcionou foi agendar a sessão com as consultas de dez segundos já rodadas. |
| **Perda de contexto entre sessões** | Alta | Médio | `02-ESTADO.md` + protocolo de handoff obrigatório em toda task |
| **Migration destruir dado de produção** | Baixa | Fatal | Backup obrigatório antes; migration aditiva; revisão de segurança antes de aplicar |
| **Esteticismo comendo a funcionalidade** | Média | Alto | `vetria-ui` reporta, mas polimento visual só entra na fila depois do DoD da fase |

---

## 💡 IDEIAS FORA DE ESCOPO (não fazer agora — mês 4+)

> Aqui mora tudo que é boa ideia mas não foi contratado pras 13 semanas.
> Registrar aqui é o que permite dizer "não" sem perder a ideia.

- **Horários de funcionamento do estabelecimento.** Boa ideia, e o `01-PLANO.md` §S2 chegou a prometer. Não existe campo no formulário nem coluna na tabela, e criar coluna é migration presencial. Fora do escopo dos 3 meses (`00-ESCOPO.md` §2 não cita horário em nenhuma das seis capacidades). **Anotada pro mês 4.** Ver R-019.
- **2FA opcional para o profissional.** Boa ideia, fora do escopo dos 3 meses: obrigar agora aumenta abandono no cadastro sem ganho à altura. O 2FA **do admin** não é ideia, é a T-032. **Anotada pro mês 4.** (SEC-2026-09-23-rate-limit)
- **Tempo de inatividade da sessão e bloqueio de senha vazada.** Só existem no plano pago do Supabase. Se o projeto já for Pro, ligar para admin é 15 minutos; senão, depois da entrega. **Anotada pro mês 4.**
- **Cloudflare na frente da Vercel.** Decidido **não** (DL-063): não protege o login, que vai direto ao Supabase, e traz problema de cache, SSL e IP. Registrado aqui só para a pergunta não voltar sem o DL.
- **Foto de perfil com upload.** Precisa de um segundo bucket, público, com regra própria de moderação de imagem. Não é requisito de E1 a E6. Volta como decisão na F4/S7, quando o perfil público existir e a falta dela custar conversão. Ver R-019.

---

## ✅ FECHADOS

> **25/09/2026 — fechados pelas provas de 23 a 25/09** (`vetria-maestro`):

- **R-039** — a Server Action era a única que validava conteúdo, e o dono gravava `estado='ZZ'` pelo
  PostgREST (SEC-060, medido pelo Elber em 23/09). **23/09/2026 — FECHADO pela `0004` (T-027)**, aplicada
  em produção: 12 CHECKs, 22/22 `true` depois da correção dos CRMVs de teste; a sonda 3 (38/38 OK) refez a
  prova de antes e o banco **recusou** o `estado` inválido. `site` só `http(s)`. Código em `87eee1a`.
- **R-065** — conta aprovada virava `active` com `slug` nulo. **25/09/2026 — FECHADO pela `0005` (T-028)**:
  o trigger gera `nome-cidade-uf` quando a conta passa a `active`; **provado em tela em produção**: a
  aprovação em `/admin/validacoes` gerou **`larissa-lima-goiania-go`**, e o perfil abre nesse endereço.
- **R-060** — o limite de especialidades só era conferido no passo 4. **23/09/2026 — FECHADO pela T-035**
  (`b6e8452`): a quinta especialidade não entra, com aviso, no passo 1; teste em `onboarding-vet.spec.ts`
  (`dd21dce`) verde no CI.
- **R-032** — endereço e CEP públicos sem decisão (SEC-041, SEC-117). **23/09/2026 — FECHADO pela DL-070
  item E**, decisão do Elber: **endereço e CEP do estabelecimento são públicos por desenho** (endereço
  comercial); **do veterinário, só o bairro**. A auditoria da busca confirmou que as telas não mostram o
  que não devem, e a SEC-117 deixou claro que a proteção é a decisão, não a tela. ⚠️ **Sobra aceita, sem
  card:** a assimetria de revalidação (o estabelecimento que muda de cidade volta para a fila; o vet não).
  Se incomodar, é pergunta da T-019 (F6).
- **R-033** — não havia lugar limpo para criar conta de teste nova. **23/09/2026 — FECHADO pelo DL-064 e
  pela T-029**: projeto `vetria-e2e`, a `service_role` **do teste** só no passo E2E, pré-voo recusando URL de
  produção; **CI #22: 70 de 70, 0 pulados**, com cadastro novo e aprovação (DL-069). Hoje 88 + 10, CI
  obrigatório na `main`. **Herdou o R-073** (o projeto grátis pausa).
- **R-059 (parte do CRMV)** — o número do CRMV era texto livre. **23/09/2026 — FECHADO pela `0004`**:
  `vet_profiles_crmv_formato` (`^[0-9]{1,6}$`), validado em produção depois da normalização dos 5 CRMVs de
  teste, e a mesma regra na Action e na máscara (T-035). **A parte de cidade × UF continua aberta**, mais
  estreita (ver R-059 em 🟡).
- **SEC-113** — trocar `type=recovery` por `magiclink` fugia da tela de nova senha. **Corrigido na hora**
  na T-036 (`lib/auth/link-do-email.ts`, lista fechada sem `invite`/`magiclink`).
- **SEC-117** — esconder coluna na aplicação não protege nada. **Fechado pela decisão** (DL-070 E, acima):
  endereço e CEP do estabelecimento são públicos por desenho; os comentários do código dizem que a omissão
  é só de apresentação.
- **SEC-118** — `connection()` dentro de `try/catch` era a única trava contra cache. **Corrigido:**
  `export const dynamic = "force-dynamic"` em `app/buscar/page.tsx:54`, `app/veterinario/[slug]/page.tsx:28`
  e `app/estabelecimento/[slug]/page.tsx:28` (conferido no código em 25/09).

- **R-001** — o `middleware.ts` não isolava painel por role. Era o **único 🔴 crítico aberto do
  projeto**, desde **26/08**. **20/09/2026 — FECHADO POR MEDIÇÃO EM TELA**, pelo Elber, com conta
  `vet` real no preview: `/app/estabelecimento` e `/admin`, digitados na barra de endereço,
  **devolveram a conta ao painel dela**. Mais o teste *"a conta vet nao entra no painel do
  estabelecimento nem no admin"* verde no CI de 20/09. O isolamento é por **prefixo de rota** no
  `middleware.ts`, com o mapa em `lib/auth/status.ts` — um lugar só, que é o que o **DL-046**
  manda. Entregue pela **T-016**, em produção por `eb6e2d6`.
  ⚠️ **O que ficou de fora, e está escrito para não virar R-034:** a passada **literal** do item 4
  do DoD — *"um responsável logado que digite `/app/veterinario`"* — **não foi feita com conta
  `tutor`**. O que foi exercitado é o cruzamento inverso, pela mesma tabela. **O mecanismo está
  provado; a frase, não.** É uma navegação, e está na fila da S4.

- **R-038** — o portão de status da matriz §4 não existia em lugar nenhum do código (SEC-059).
  **20/09/2026 — FECHADO POR MEDIÇÃO EM TELA.** As **9 navegações** do Elber, conta `vet` real em
  `pending_validation`: `/app` → **`/aguardando`**; `/app/veterinario`, `/contatos`, `/plano` e
  `/agenda` **voltam**; `/perfil` e `/ajuda` **abrem**; `/app/estabelecimento` e `/admin`
  **devolvem a conta ao painel dela**. O portão vale **duas vezes** — no `middleware.ts` e na
  página, por `requirePainel(role, statusPermitidos)` — e a matriz §4 virou **dado num lugar só**
  (`lib/auth/status.ts`), em **lista de permitidos**: status novo no enum nasce barrado sem
  ninguém editar arquivo.
  ⚠️ **Fechado para o veterinário.** No estabelecimento **não há conta de teste** e a passada não
  foi feita: o código é o mesmo e a matriz é a mesma, **e isso é argumento, não medição**. Está
  registrado no **R-033**, que é onde a falta de conta de teste mora.

- **R-047** — contas `clinic` órfãs da Action inline que a T-007 apagou (SEC-068). **20/09/2026 —
  FECHADO POR MEDIÇÃO, e a medição deu ZERO.** O `select` que estava escrito em três lugares desde
  09/09 — `select count(*) from profiles where role='clinic' and onboarding_completed and
  status='incomplete';` — foi finalmente rodado pelo Elber: **nenhuma conta**. **O `update` 🔴 que
  este risco exigiria nunca precisou existir**, e o **DL-057** (subir T-007 e T-016 juntas) já
  tinha tornado o conserto desnecessário por outro caminho.
  ⚠️ **A lição é sobre o custo de não contar.** O número era um `select` de dez segundos, e ficou
  **11 dias** escrito em dois cards, um risco e um DL, segurando decisão de deploy e chegando a
  justificar o agendamento de uma sessão presencial. **Era zero.** Medir cedo é mais barato que
  planejar em cima do que se supõe — vale para o próximo `select` que este quadro pedir.

- **R-053** — o pré-voo do CI não conferia as credenciais de teste, e sem elas a suíte ficava verde
  sem a única cobertura de sessão real. **20/09/2026 — FECHADO PELO EFEITO, não pelo arquivo.** O
  conserto do `.github/workflows/ci.yml` entrou em `f33b295`, mas a regra da casa é que **o risco
  só fecha quando o CI rodar a suíte inteira** — e rodou: **40 testes, todos verdes**, no CI do PR
  #2. Sessão real, cookie real e `middleware.ts` real passaram a ser exercitados por alguém.
  ⚠️ **A primeira execução real quebrou, e quebrou por um defeito do teste:** um `innerText()`
  contra um elemento com `text-transform: uppercase`, comparado com regex sensível a maiúscula
  (`8674e3a`). **É exatamente o tipo de defeito que só existe enquanto a suíte não roda** — e é a
  evidência de que uma suíte que pula testes não estava só incompleta: estava **não verificada**.
  ⚠️ **O que NÃO fechou junto:** a **cobertura** do item 1 do DoD continua ausente (**R-033**).
  Fechar o R-053 é dizer que a rede está ligada, não que ela pega tudo.

- **R-048** — a sonda que prova a guarda em produção teria sido apagada da árvore de trabalho sem
  explicação (SEC-069). **15/09/2026 — FECHADO POR MEDIÇÃO, e a medição derrubou a premissa.**
  **A deleção de `supabase/verificar-apos-0003.sql:678-684` não está na árvore.** O arquivo está
  **intocado desde `a68251d`** (26/08), tem **945 linhas**, e a sonda de `pg_trigger` sobre
  `perfil_privado` está nas **linhas 672-685**, com os **quatro triggers** esperados no comentário
  logo acima. O `git status` de 15/09 lista só os **5 arquivos da T-007** e **nenhum arquivo em
  `supabase/`**. **Nada a reverter e nada a justificar:** a condição pré-deploy do card da T-007
  caiu sem custo.
  ⚠️ **O que sobra de lição:** o risco nasceu de uma leitura da árvore de trabalho e não de um
  `git status` conferido, e custou uma condição de deploy escrita em dois cards. **Deleção não
  commitada se prova com `git status` e `git log -- <arquivo>`**, e é isso que o fecha hoje.
  **O par dele, o R-047, continua aberto e continua sem medição.**

- **R-034** — a auditoria da T-006 existia só nos comentários do código, e SEC-053/SEC-055 não
  tinham dono. **09/09/2026 — FECHADO POR COBERTURA.**
  `docs/relatorios/SEC-2026-09-09-T006-revisao-independente.md` releu `actions.ts` e `page.tsx`
  linha a linha **contra `06-PERMISSOES.md` e contra o schema das três migrations**, sem usar os
  comentários do código como guia. **Nenhum defeito adicional dentro dos dois arquivos**, o que
  fecha o buraco 053/055 **por cobertura, não por memória**: os dois números continuam
  permanentemente vagos e **não devem ser reutilizados**.
  ⚠️ **O que a revisão achou fora dos dois arquivos, e é o que sobrou de valor:** seis achados
  novos, **SEC-059 a SEC-064**, todos na costura entre a Action e o resto do sistema. Os dois 🟠
  viraram card (**T-016**, **T-017**) e ficaram registrados como **R-038** e **R-039**; os quatro
  🟡 viraram **R-040 a R-043**.
  **A lição:** a reconstrução acertou o que cobria. O que ela não podia ver não estava dentro do
  arquivo — estava no destino do `redirect()` dele e na diferença entre o que a Action valida e o
  que o banco aceita. **Revisão de arquivo não substitui revisão de costura.**

- **R-003** — "zero testes automatizados em código que já está em produção". **31/08 — FECHADO:
  a premissa do título morreu.** A T-003 entregou Playwright + GitHub Actions, e desde o merge do
  PR #1 (`423a823`) o CI roda **build + lint + E2E em todo push na `main` e em todo pull request,
  com os três passos bloqueando**. São **13 testes**, e o mais valioso não é o de login: são as
  seis rotas de `/app` e `/admin` provando que visitante sem sessão cai no `/login` — ou seja, o
  `middleware.ts` ganhou prova **antes** de alguém mexer nele pra consertar o R-001.
  ⚠️ **O que NÃO fechou junto, e continua em risco próprio:** a **cobertura**. O caminho de
  persistência do onboarding não tem teste nenhum (**R-033**), e a prova da T-006 foi manual. O
  item 5 do DoD da F3 ("testes automáticos dos fluxos críticos") **continua aberto** e é cobrado
  no fechamento da fase. **Fechar o R-003 não é dizer que há cobertura suficiente; é dizer que a
  rede existe e está ligada.**

- **R-037** — as duas rotas de admin devolviam `{ error, stack }` no `catch` final, e nas duas o
  `try` abria **antes** da checagem de sessão. No `set-access` a primeira linha dentro dele era
  `await req.json()`: **um POST com JSON malformado e sem cookie nenhum recebia 500 com o stack
  trace do servidor** — caminho absoluto dos arquivos no runtime, estrutura de módulos e versão de
  framework, na rota que troca o role de qualquer conta.
  **31/08 — FECHADO na T-015, no mesmo dia em que nasceu.** O `stack` saiu das duas respostas e foi
  para o `console.error` do servidor; o `req.json()` do `set-access` passou para **depois** da
  autorização, dentro de um `try` estreito que devolve **400** em JSON inválido. **O mesmo POST
  agora devolve 401 e o parser nem roda.** As três rotas de API do projeto passaram a devolver
  mensagem e mais nada em erro de servidor, que é o formato que a `set-role` já tinha.
  ⚠️ **O que ficou de fora, de propósito, e continua valendo:** o RBAC destas rotas é da **S3**
  (R-001, R-002), onde o **R-029** já espera; e o `debug: { userId, email, admin_level }` que a
  `profiles` devolve **não foi tocado** — é dado do próprio chamador, não de terceiro, então é
  limpeza de rota e não segurança.
  **A lição é sobre como ele apareceu:** o achado estava **escondido atrás de um `any`**.
  `{ stack: e?.stack }` com `e: any` não chama atenção de ninguém; a mesma linha com `unknown`
  obriga a olhar o que sai. A T-014 não achou isso apesar de ser uma task de tipo — **achou por
  ser uma task de tipo.**

- **R-026** — as sondas 3, 7C e 9 entregavam o veredito por um `select` seguido de `rollback;`, e
  o arquivo declarava que "o editor mostra só o resultado da última query" (SEC-046).
  **31/08 — MEDIDO E DERRUBADO.** `begin; select 42 as prova; rollback;` no SQL Editor deste
  projeto **devolveu uma tabela com `prova` = `42`**. O modelo estava errado: o editor mostra o
  resultado do último comando **que devolve linhas**, e `rollback` não devolve nenhuma. **As três
  sondas funcionam como estão e não foram tocadas** — reescrever sonda que funciona é o R-016.
  O que continua valendo é a **SEC-035**, e por outro motivo: `raise notice` não é result set, é
  outro canal, e esse o editor não renderiza mesmo. **Task:** T-013 ✅.
  ⚠️ **Isto não fecha R-027, R-028 nem R-030:** os três são sobre o texto da `0003` e das
  mensagens de pré-voo, não sobre o que o editor renderiza. **O que saiu daqui foi o R-035.**

> **Cinco riscos fecharam em 26/08/2026, todos pela aplicação da `0003` em produção**
> (commit `a68251d`, verificada por 18 sondas e pelo select de onze colunas da própria
> migration, todas `true` e `copia_linhas = 0`). Os cinco estavam abertos **de propósito**
> enquanto o SQL existia e o banco não tinha mudado.

- **R-018** — `clinic_profiles` publicava CNPJ, razão social e o nome do responsável técnico para `anon` (SEC-020). **Fechado na raiz, não escondido:** as três colunas **saíram** de `clinic_profiles` e vivem em `perfil_privado`. Sonda 7A: `anon` pedindo `cnpj` recebe **`42703: column "cnpj" does not exist`**. Sonda 7B: `anon` em `perfil_privado` recebe **`42501: permission denied`** — duas portas, motivos independentes. Sonda 7C: conta logada não lê a linha de outra conta. Decisão em **DL-053**. ⚠️ **A pergunta de produto sobre `endereco` e `cep` NÃO fechou junto: virou o R-032.**
- **R-020** — o documento aprovado podia ser trocado no bucket sem que a linha mudasse (SEC-033). A linha passou a guardar `documento_hash` (sha256) e `documento_tamanho`, os dois vigiados pelo trigger, com CHECK all-or-nothing. **Sonda 10, linha do `documento_hash`: trocar os bytes devolve o perfil para `pending_validation`**; mexer no telefone não. O token de upload deixou de existir (DL-051), então o primeiro vetor morreu na arquitetura.
- **R-021** — o pré-voo procurava uma string em vez de provar zero policy (SEC-034). Passou a abortar com **qualquer** policy em `storage.objects`. **Sonda 2: zero policy, lista nula, RLS ligada nas duas tabelas de `storage`. Sonda 4: `rolbypassrls` `true` em `service_role` e `postgres`, `false` em `anon` e `authenticated`.** O modelo de zero policy é medido, não suposto (**DL-054**).
- **R-022** — sonda que entregava o veredito por NOTICE devolvia "Success" no passa e no falha (SEC-035). Zero `raise notice` e zero `raise warning` sobraram nos dois arquivos; a Sonda 10 devolve tabela e a migration devolve o select de onze colunas depois do `commit`. **Foi esse select que carregou o veredito da aplicação.** ⚠️ **A variante que não fechou é o R-026**, veredito entregue por `select` que não é o último comando.
- **R-025** — o pré-voo nunca olhava `storage.buckets` e o `on conflict` reconciliava em silêncio (SEC-045). O `on conflict` saiu, o pré-voo 1.6 aborta se o bucket existir imprimindo `public`, `file_size_limit`, MIME e **quantos objetos** há dentro, e reverter a transação **apaga** o bucket, que é o estado seguro. Na aplicação, `storage.buckets` estava vazio e o bucket foi **criado**, nunca reconciliado.

**Fechados antes, na S1:**

- **R-005** — `is_admin_master` era duplicata byte a byte de `is_master_admin`. Removida pela `0002` em 26/08/2026.
- **R-006** — o schema vivia fora do repo. `0000_baseline.sql` versiona o que existia; da `0002` em diante tudo passa por arquivo. **26/08 — o commit `a68251d` fechou a última brecha:** a `0003`, o backup e o arquivo de verificação estavam **untracked**, e produção tinha um schema que o repositório não descrevia.
  ⚠️ **Correção de 31/08:** esse commit fechou o risco **no disco do Elber, não no repositório.**
  Ele e mais cinco ficaram **sem push por cinco dias**, então de 26 a 31/08 o GitHub continuou
  com um `origin/main` que não descrevia o schema de produção — que é a definição literal deste
  risco. **`git push origin main` em 31/08 (`7ce2518..22cc5cc`) é o que de fato o fechou.**
  **A lição não é sobre a `0003`:** "fechado" passou a exigir `origin`, e não a árvore local.
  Commit que não sai da máquina não versiona nada para mais ninguém.
- **R-015** — token do GitHub em texto puro na URL do remote. O remote virou `https://VetriaVet@github.com/...` e a autenticação passou pro credential manager, em 26/08/2026.
- **R-002 item 3** — o "bug latente" do `admin_level ?? "admin"` era improcedente: o enum aceita `admin`, e `comum` nunca existiu. Confirmado por introspecção.
