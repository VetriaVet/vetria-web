# Auditoria de segurança — T-023, a fila real de validação — 21/09/2026

**Escopo:** `lib/auth/admin.ts`, `app/admin/validacoes/fila.ts`, `app/admin/validacoes/page.tsx`,
`app/admin/validacoes/[conta]/page.tsx`, `app/admin/validacoes/BotaoDocumento.tsx`,
`app/admin/usuarios/page.tsx`, `app/admin/layout.tsx`, `app/admin/page.tsx` — lidos contra
`docs/06-PERMISSOES.md` §2/§3/§5, as policies de `0000_baseline.sql` e `0002_nucleo.sql`, o
`middleware.ts` mais `lib/auth/status.ts`, e o card T-023 com o Resultado do `vetria-backend`.
Conferidas também as duas páginas irmãs de `/admin` (moderação, conteúdo) e o **consumo** — não a
implementação — de `/api/documentos/abrir`.
**Base:** árvore de trabalho sobre `1fbabcb` (`eb6e2d6` mais um commit de docs), 4 arquivos novos e
4 tocados, **nada commitado**.

> **Esta auditoria é diferente das quatro anteriores.** Todas elas olharam código em que a pessoa
> lê a própria linha. Esta é a primeira em que **um usuário lê a linha de outra pessoa** — e não
> uma coluna qualquer: CNPJ, razão social, responsável técnico, WhatsApp, telefone, email e o
> documento de identidade de profissionais reais.

## Resumo

**Dá para colocar gente real nisso hoje.** A tela é tri-gatada (middleware por prefixo →
`requireAdmin()` na página → RLS `is_admin()` no Postgres), não há uma linha de `service_role`, o
filtro de visibilidade está inteiro no Postgres, e **nenhum dado privado chega ao HTML da lista**:
CNPJ, razão social, responsável técnico, WhatsApp, telefone e email aparecem só no detalhe, uma
conta por vez, para quem a matriz §5 autoriza. Nenhum não-admin alcança nada disto, e os três
caminhos foram conferidos separadamente.

O **R-054 fechou de verdade**: `/admin/usuarios` recusa no servidor, **antes de qualquer leitura de
dado de terceiro**, e esconder o item do menu está documentado em dois arquivos como **não sendo**
autorização — que é o único jeito de isso não ser confundido depois.

O que sobra não é vazamento: é **trilha e escopo de leitura**. O admin lê o dossiê completo de
qualquer profissional por uuid, para sempre, e esse acesso **não deixa um único registro em
`audit_logs`** — só a abertura do documento deixa. A matriz §5 termina dizendo *"toda ação de admin
entra em `audit_logs`, inclusive as do master"*, e esta é a primeira tela em que isso passa a
custar caro.

**Contagem: 🔴 0 · 🟠 0 · 🟡 5.**

---

## Achados

### SEC-091 — Ler o dossiê de terceiro não deixa trilha nenhuma; só abrir o documento deixa · 🟡

- **Onde:** `app/admin/validacoes/[conta]/page.tsx:46-57` e `fila.ts:370-430` (nenhum
  `insert into audit_logs` em nenhum dos dois) × `docs/06-PERMISSOES.md` §5, última linha
- **O quê:** `carregarCadastro()` lê `perfil_privado` (CNPJ, razão social, responsável técnico,
  WhatsApp, telefone, email de contato, hash e tamanho do documento) e renderiza tudo. A única
  coisa registrada nesta tela é o clique em "Liberar o documento", porque quem grava é
  `/api/documentos/abrir` (`route.ts:174-185`, `acao: 'documento_visualizado'`). **Ver o CNPJ e o
  telefone da pessoa não custa nada e não aparece em lugar nenhum.** O único rastro é o log de
  requisição da Vercel, que guarda `/admin/validacoes/<uuid>` — e ele está fora do alcance da
  rotina de exportação e exclusão da F6 (R-024 outra vez).
- **Como explorar:** logar como admin comum, abrir a fila, clicar numa linha, anotar CNPJ, WhatsApp
  e telefone, **não abrir o documento**. Depois, como master:
  `select * from audit_logs where alvo_id = '<uuid>' order by created_at desc;` → **zero linha**.
  Não há como responder *"quem consultou o cadastro do fulano em setembro?"*.
- **Impacto:** LGPD art. 37 (registro das operações de tratamento) fica sem base na tela que trata
  o dado mais sensível do produto. Num incidente com admin interno, a resposta possível é *"não
  sabemos"*.
- **Por que não é 🟠:** o acesso **é autorizado** pela matriz §3 e §5. Não há vazamento para quem
  não pode ver. O defeito é de **prova**, não de permissão.
- **Como corrigir:** direção, não implementação — a leitura do dossiê passar pela mesma disciplina
  que a rota do documento já tem (um registro `cadastro_visualizado`, `actor_id` explícito, gravado
  antes de renderizar). O custo a decidir é volume: é uma linha por navegação. Alternativa mais
  barata: registrar só quando o bloco "Identificação e contato" for de fato montado.
- **Encaminhamento:** **entra como item do card da T-024**, que é quem já traz `audit_logs` para
  esta pasta. É a hora de decidir, com o custo no menor que vai ser.

### SEC-092 — O detalhe não é "a fila": qualquer conta `vet`/`clinic` é legível por uuid, em qualquer status, para sempre · 🟡

- **Onde:** `fila.ts:375-388` — `carregarCadastro()` filtra `.eq("id", id)` e
  `.in("role", ROLES_DA_FILA)` e **não filtra `status`**. A lista (`:201-203`) filtra; o detalhe
  não.
- **O quê:** a tela se chama "fila de validação", mas o detalhe entrega o dossiê completo de um
  profissional `active`, `incomplete` ou `suspended` do mesmo jeito. O aviso *"Esta conta não está
  mais na fila"* (`[conta]/page.tsx:84-90`) é informativo, **não é portão**. E `BotaoDocumento`
  continua funcional: `/api/documentos/abrir` autoriza qualquer `role === 'admin'` para qualquer
  dono, sem olhar o status do alvo.
- **Como explorar:** um admin comum aprova a conta X hoje (T-024). Amanhã X está `active` e fora da
  fila. O admin cola `/admin/validacoes/<uuid-de-X>` na barra e recebe CNPJ, razão social,
  responsável técnico, WhatsApp, telefone, email e o botão que abre o **documento de identidade**
  de X. Indefinidamente, sem X estar em fila nenhuma, e sem trilha (SEC-091) exceto na abertura do
  documento.
- **Impacto:** o poder do admin comum deixa de ser *"a fila dele"* e passa a ser *"a base inteira
  de profissionais que ele já viu uma vez"*. Os uuids se acumulam naturalmente no trabalho dele.
  Não é vazamento entre roles — é a distância entre o que a matriz §5 descreve como operação e o
  que o código permite.
- **Como corrigir:** decidir o escopo explicitamente e escrevê-lo onde possa ser conferido. Duas
  direções honestas: **(a)** restringir o detalhe a `pending_validation`, e dar à moderação (que a
  §5 autoriza separadamente) a própria tela com o próprio recorte; ou **(b)** manter o acesso amplo
  por ser o que "moderar conteúdo" exige — e então o SEC-091 deixa de ser desejável e passa a ser
  **obrigatório**, e a §5 merece uma linha dizendo que admin lê cadastro de profissional fora da
  fila.
- **Encaminhamento:** **é pergunta de matriz, não de segurança sozinha**, e precisa de resposta
  **antes da T-024**, que herda `carregarCadastro()` exatamente como está.

### SEC-093 — As três policies `*_select_admin` não têm a cláusula de role que `profiles_select_admin` tem · 🟡

- **Onde:** `0002_nucleo.sql:506-507`, `:540-541`, `:564-565` — `using (public.is_admin())`, só
  isso — contra `:628-630`, `profiles_select_admin`, que é `is_admin() and role in ('vet','clinic')`
- **O quê:** a matriz §5 diz, por escrito, que *"responsáveis e outros admins são invisíveis"* para
  o admin comum. Isso está codificado em **uma** tabela (`profiles`). Em `vet_profiles`,
  `clinic_profiles` e `perfil_privado` qualquer admin lê **qualquer linha**, sem recorte de role.
  Hoje a `fila.ts` não expõe isso porque a **ordem** das consultas protege: `carregarCadastro()` lê
  `profiles` primeiro e devolve `null` antes de tocar em `perfil_privado` (`:390-403`). **É
  ordenação de aplicação segurando uma regra de matriz que deveria estar na policy** — exatamente o
  que a §3 nota 4 e o DL-045 existem para evitar.
- **Pré-condição para exploração, e ela é dita na cara:** uma conta que **foi** `vet` ou `clinic`
  (portanto tem linha em `perfil_privado`, com documento) e cujo role o master trocou depois para
  `tutor`. `perfil_privado_insert_own` impede que um responsável crie a linha, mas **nada apaga a
  linha quando o role muda**. Com essa conta existindo, o admin comum não a alcança por
  `/admin/validacoes/<uuid>` (o gate de `profiles` barra), mas alcança por
  `POST /api/documentos/abrir {"dono":"<uuid>"}`, que exige apenas `role === 'admin'` no
  requisitante: recebe a URL assinada do documento de identidade de um **responsável**, que a
  matriz torna invisível para ele.
- **Impacto:** o recorte admin × master vale numa tabela e não vale nas três que guardam o dado
  sensível. Qualquer tela nova que consulte `perfil_privado` sem repetir o gate de `profiles`
  **nasce vazando**.
- **Como corrigir:** as três policies passarem a exigir o mesmo `role in ('vet','clinic')`, via
  função `SECURITY DEFINER` + `SET search_path = public` que responda "este id é profissional?".
  **É migration → 🔴 no semáforo: recusa autônoma, sessão presencial.** Não é da T-023 e não deve
  ser empurrado para dentro dela.
- **Encaminhamento:** card próprio na S4/S5, **candidato a andar junto com a T-017**, que já é a
  migration agendada e sem data.

### SEC-094 — `requireAdmin()` não olha `status`: admin suspenso continua lendo dossiê e abrindo documento · 🟡

- **Onde:** `lib/auth/admin.ts:55-71` (o `select` pede `role, admin_level, admin_team`, nunca
  `status`) · `lib/auth/status.ts:169-175` (`portaoDeStatus` devolve `null` para `/admin`, de
  propósito) · `app/api/documentos/abrir/route.ts:119-121` (o portão de status vale só quando
  `ehProprio`)
- **O quê:** **não existe caminho de "revogar o acesso agora" por status para uma conta de admin.**
  O único jeito de tirar um admin é trocar o `role` por `/api/admin/set-access`. Se alguém
  suspender a conta achando que revogou, não revogou.
- **Como explorar:** master marca `status = 'suspended'` na linha do admin (direto no Studio, que é
  o único caminho: `admin_definir_status` recusa alvo fora de `vet`/`clinic`). O admin, com a
  sessão ainda viva, navega a fila, abre qualquer conta, lê CNPJ e telefone e clica em "Liberar o
  documento". **Tudo funciona.**
- **Impacto:** baixo hoje (o R-014 registra que provavelmente só o Elber tem conta de admin) e alto
  no dia em que existir admin comum de verdade, que é a semana que a T-023 inaugura.
- **Como corrigir:** decidir na matriz §4 se `admin` tem portão de status — hoje a §4 se declara
  *"o portão de status (vet e estabelecimento)"* e a lacuna é **dela**, não do código. Enquanto não
  decidir, a regra operacional escrita em lugar visível: **revogar admin é trocar o role, nunca o
  status.**

### SEC-095 — `lib/auth/admin.ts` nasceu para matar a cópia do guard, e a cópia continua viva em 2 das 4 páginas · 🟡

- **Onde:** `app/admin/moderacao/page.tsx:11,18` e `app/admin/conteudo/page.tsx:11,18` — as duas
  ainda com o guard inline, enquanto `/admin` e `/admin/validacoes` usam `requireAdmin()` e
  `/admin/usuarios` usa `requireMaster()`
- **O quê:** o cabeçalho de `lib/auth/admin.ts:4-10` diz, com todas as letras, que o arquivo existe
  porque *"a autorização estava copiada em cada página, e cópia diverge em silêncio"*. Metade das
  páginas não migrou. Hoje as duas estão **corretas** pela matriz (§2 dá ✅ a admin comum em
  moderação e conteúdo), então não há exploração: é o **R-017 em formação**, que este projeto já
  pagou três vezes — a mais recente foi o R-041, que ficou aberto do lado do veterinário enquanto
  três auditorias liam o do estabelecimento.
- **Impacto:** quando a moderação deixar de ser casca e alguma parte virar master-only, ou quando o
  guard ganhar uma regra nova (status, SEC-094), essas duas páginas não acompanham, e ninguém vai
  notar porque elas *"já têm guard"*.
- **Como corrigir:** as duas chamarem `requireAdmin()`. Dois arquivos, sem mudança de
  comportamento. **É a segunda metade desta task**, não conserto dela.

---

## Verificado e OK

- **As três portas de `/admin/validacoes`**, conferidas separadamente: `middleware.ts:74-105`
  (matcher `/admin/:path*`, `rolesPermitidas` → `['admin']`, lista de permitidos) · `requireAdmin()`
  em cada página · RLS `is_admin()` nas quatro policies. **Derrubar qualquer uma ainda deixa duas.**
- **Ordem em `carregarSessaoAdmin()`** (`lib/auth/admin.ts:49-72`): `auth.getUser()` (valida o JWT
  contra o servidor de auth, não confia no cookie) → `redirect("/login")` → `select role,
  admin_level, admin_team` da **própria** linha → `redirect("/app")` se faltar ou se
  `role !== 'admin'`. **Lista de permitidos, erra fechado.** O `role` vem do banco, pinado em
  `.eq("id", user.id)`, nunca do cliente nem da URL.
- **Nenhum dado privado no HTML da LISTA.** De `perfil_privado` a lista pede **uma coluna**:
  `documento_enviado_em`. Sem CNPJ, razão social, responsável técnico, WhatsApp, telefone, email,
  caminho ou hash. Confirmado lendo o `select`, não o comentário.
- **`documento_path` não chega ao navegador em caminho nenhum** — não está em nenhum dos dois
  `select`, e o único componente de cliente recebe `{ dono, temDocumento }`, então nem pelo payload
  RSC passa. `documento_hash` chega no detalhe, e **não é achado**: é visível só para quem já está
  vendo o CNPJ na mesma tela, permite ao admin notar dois cadastros com o mesmo arquivo, e a página
  é dinâmica, sem cache de CDN.
- **Nenhum `console.*` emite dado de terceiro.** `registrarErro` (`fila.ts:62-67`) emite `message`
  e `code`. ⚠️ **Ressalva de precisão:** o tipo não declarar `details` **não impediria nada
  sozinho** — TypeScript é estrutural e o `PostgrestError` passado é mais largo que o tipo. O que
  de fato protege é o **corpo da função montar o objeto campo a campo**. As duas coisas estão
  certas, e é a segunda que vale.
- **`is_admin()` (`0002:184-192`) é `security definer` + `set search_path = public`**, como
  `perfil_esta_ativo`, `tem_role` e `is_master_admin`. Nenhuma função nova nesta task, nenhuma
  `SECURITY INVOKER` em policy. DL-014/015 respeitado. `EXECUTE` revogado de `public` e concedido a
  `authenticated`.
- **O filtro `role in ('vet','clinic')` e o master:** o backend está certo. Para admin comum a
  cláusula é redundante (a policy segura); `profiles_select_all_master` (`0000:168-170`) é
  `using (is_master_admin())`, sem recorte, e policies permissivas somam por OU — **o master lê a
  base inteira**. Tirar a cláusula tem efeito **assimétrico**, e por isso traiçoeiro: para admin
  comum nada muda; para o master a fila passa a listar qualquer linha em `pending_validation`
  independentemente do role. ⚠️ Precisão: para o master isso é perda de **escopo**, não quebra de
  privilégio (a §5 lhe dá "ver a base inteira ✅"); a quebra seria do admin comum, e nessa direção a
  RLS segura.
- **O documento.** A URL assinada não vai para log, `localStorage`, query string nem atributo
  persistente: vive no estado e no `href` de um `<a>` que some quando o contador zera.
  **`rel="noopener noreferrer"` está lá** (`:117`) — sem o `noreferrer`, a URL assinada iria no
  `Referer` para o Storage. O `caminho` do 409 é ignorado pelo componente. **A contagem regressiva
  é só visual e o código não afirma o contrário:** a defesa é o `exp` do JWT assinado pelo Storage,
  e o timer do cliente começa quando a resposta chega, então **atrasa** — erra para o lado seguro.
- **`clinic_profiles.site` é texto em todos os caminhos.** Sem `href`, sem `<a>`, sem `target`; a
  lista nem lê a coluna. **A decisão procede e se sustentaria mesmo com o R-039 fechado:** enquanto
  não houver CHECK de esquema, `javascript:` e `data:` passam do formulário até o banco, e um
  `href` aqui seria o dono de um cadastro escolhendo o que roda no navegador de quem valida
  cadastros.
- **Sem XSS:** todo valor vai como texto por React; nenhum `dangerouslySetInnerHTML` em `app/`
  inteiro. **Sem injeção pelo uuid:** `ehUuid()` valida antes de qualquer consulta e o valor vai
  como parâmetro do PostgREST.
- **Paginação com teto** e o **416 do PostgREST** (`PGRST103`) tratado como "página vazia, fila não
  vazia", não como erro de servidor. A contagem de fallback repete as duas cláusulas de filtro.
- **Superfície de escrita da task: zero.** Nenhuma rota de API nova, nenhuma Server Action.
  **Nenhum botão morto** — não existe "Aprovar" nem "Reprovar" em lugar nenhum, como o card manda.
- **DL-016, DL-038, DL-043** respeitados. **Nenhum `service_role`** nos 8 arquivos.
- **`app/admin/layout.tsx` não é guard e não se apresenta como um.** Sem `loading.tsx` nem Suspense
  em `/admin`, o `redirect()` da página acontece antes de qualquer flush.

## Não consegui verificar

1. **Se as policies estão de fato aplicadas em produção** com o texto da `0002`. Lido o arquivo,
   não o banco: `select policyname, cmd, qual from pg_policies where schemaname='public' and
   tablename in ('profiles','vet_profiles','clinic_profiles','perfil_privado') order by tablename, policyname;`
2. **Se existe linha em `perfil_privado` cujo dono hoje não é `vet` nem `clinic`** — a pré-condição
   do SEC-093: `select p.role, count(*) from perfil_privado pp join profiles p on p.id = pp.id group by 1;`
   Se der zero fora de vet/clinic, o SEC-093 vale como defesa em profundidade e perde o caminho de
   exploração.
3. **Se há gente em `pending_validation` agora**, o que decide se a primeira abertura mostra fila
   ou estado vazio.
4. **Os cabeçalhos de cache de `/admin/validacoes/<uuid>`.** Importa pelo botão "voltar" em máquina
   compartilhada depois do logout.
5. **Se a suíte E2E cobre as células ❌ da §2** para `/admin/validacoes` e `/admin/usuarios`. A §8
   exige um teste por ❌, e os 40 verdes de 20/09 cobrem o portão de status e os painéis
   profissionais, não estas duas rotas.

---

## O ponto cego que o backend levantou sozinho

> *"Fila vazia e policy revogada produzem a mesma tela, porque RLS não devolve erro, devolve zero
> linha."*

**Está certo, com duas correções.** (1) Não é totalmente indistinguível: uma policy **derrubada**
dá zero linha, mas uma policy **quebrada** (função com erro, `is_admin()` removida, EXECUTE
revogado) dá `42501`/`42883` e cai no ramo de erro, que a tela mostra. O caso mudo é só o da policy
que some limpa. (2) **A tela não deve tentar distinguir:** distinguir exigiria contagem
autoritativa fora da RLS, isto é `service_role` ou RPC `SECURITY DEFINER` na página — pagar a
propriedade mais valiosa desta task (*se a policy sumir, a tela esvazia em vez de continuar
entregando dado*) para ganhar uma mensagem de erro melhor.

**Onde isso deve viver é no teste, não na interface:** um E2E que mantenha uma conta em
`pending_validation` e exija que a fila a contenha detecta a policy revogada em minutos e não custa
nada em produção. Esbarra no R-033, que já tem dono.

---

## Veredito

> **APROVADO para merge.** 🔴 0 · 🟠 0 · 🟡 5.
>
> **Dá para colocar gente real nesta tela hoje.** Nenhum dado de terceiro alcança quem a matriz não
> autoriza; nenhum não-admin alcança coisa alguma; o R-054 fechou no servidor e não na
> renderização; o dado privado não está na lista, não está em log, não está em URL, não virou link
> `wa.me`, e o caminho do documento não chega ao navegador.
>
> Nenhum dos cinco 🟡 bloqueia, nenhum vira card sozinho, e **nenhum deles se conserta dentro desta
> task**.
>
> **Duas coisas que não podem ser esquecidas por serem 🟡:** o **SEC-091** deve ser decidido
> **dentro da T-024**, que é quando `audit_logs` já vai estar aberto nesta pasta e o custo de
> acrescentar a trilha de leitura é o menor que vai ser. E o **SEC-092 é pergunta de matriz, não de
> código** — a T-024 herda `carregarCadastro()` exatamente como está, então a resposta sobre o
> escopo de leitura do admin precisa existir **antes**, não depois.
