# Revisão de segurança — T-007, o clone — 15/09/2026

**Escopo:** os 5 arquivos não commitados da T-007 · **Base:** `451b2e4` na `main`, mais a árvore
de trabalho (`M` em `ClinicOnboardingForm.tsx`, `page.tsx` do onboarding e
`cadastro/estabelecimento/page.tsx`; `??` em `actions.ts` e `campos.ts`)

> **Segunda leitura, independente.** Já existe `SEC-2026-09-09-T007-revisao.md` sobre exatamente
> este diff, e o arquivo não mudou desde lá. Este relatório **não o repete**: cada garantia foi
> reconferida por leitura própria contra `0002_nucleo.sql` e `0003_storage_documentos.sql`, e o
> que ele acrescenta são três achados que a primeira passagem não tem. Onde concordo, digo que
> concordo e sigo.
>
> **Lido contra:** `docs/06-PERMISSOES.md` (§2, §3, §4, §6), o schema versionado das três
> migrations aplicadas, o original clonado
> (`app/app/veterinario/onboarding/{actions,campos,page}.tsx`), `middleware.ts`,
> `lib/auth/painel.ts`, `app/app/page.tsx`, `app/api/onboarding/set-role/route.ts` e as 11 páginas
> de `app/app/estabelecimento/(painel)/`.
>
> **Nada foi exercitado contra o banco.** Toda afirmação sobre RLS, trigger e RPC é leitura do SQL
> versionado.

## Resumo

Dá pra colocar um estabelecimento real nisso hoje? **Para o dado que este formulário grava, sim.**
CNPJ, razão social, responsável técnico e WhatsApp entram em `perfil_privado`, que `anon` não
alcança nem por policy nem por grant, e não há caminho neste diff em que um usuário leia dado de
outro. A autorização é conferida no servidor antes de qualquer escrita, e o id do dono nunca vem
do payload.

O que sobra é registro: **duas coisas que a documentação da própria task afirma e o código não
faz**, e uma defesa em profundidade que custa uma linha. Nenhuma é motivo para segurar o merge.

---

## A. O clone herdou as 5 correções da T-006?

Reconferidas no arquivo novo, uma a uma, contra o schema:

| Correção da T-006 | Herdou? | Onde, no clone |
|---|:---:|---|
| **SEC-052** — lista de permitidos no guard da página, não lista de negados | **herdou** | `page.tsx:70-72` — `PODEM_EDITAR_AQUI = ["incomplete","pending_validation"]` |
| **SEC-054** — o portão de **escrita** tão apertado quanto o de página, mesmo padrão | **herdou** | `actions.ts:223-237` — `PODEM_GRAVAR` com `active` dentro, e o motivo escrito em `212-222` |
| **SEC-056** — o **tipo** do parâmetro de log não aceita `details` | **herdou, e é o que mais valia** | `actions.ts:81-84`: `detalhe: { message: string; code?: string }`. Barreira de compilação, não disciplina |
| **SEC-057** — depois de erro da RPC, **pergunta ao banco**, não compara string de exceção | **herdou** | `actions.ts:426-446` |
| **SEC-058** — teto do array **antes** da varredura, dedup por `Set` | **herdou** | `actions.ts:261-265` antes do `map` de `267`; `MAX_SERVICOS = SERVICOS.length` (`campos.ts:54`) |

E as sete garantias estruturais do original, também presentes: id sempre da sessão (`187-189`,
`user.id` em `347` e `390`), role no servidor antes de escrever (`210`), `status` nunca escrito
(só a RPC, `418`), `slug` fora do payload (`343-359`), `documento_path/hash/tamanho` ausentes
(CHECK all-or-nothing de `0003:859-865`), `.select().single()` com ramo `if (!linha)` nos dois
upserts (`358-367`, `398-407`), e mensagem ao usuário com `code` e nunca `message` (`96-99`).

**Zero defeitos do original reintroduzidos. Confirmo a primeira revisão neste ponto, por leitura
própria.**

## B. As quatro linhas da tabela "herda ou não"

- **(a) `site` fora do payload e da tela — cumprido.** A coluna não existe em `campos.ts`, não
  está no objeto de `actions.ts:346-355`, não há campo no form, e a decisão está registrada em
  `campos.ts:21-27` com a condição para quem acrescentar depois (validar esquema `http(s)` **no
  servidor**). A superfície de `javascript:` não foi aberta.
- **(b) Guard por `status` e role no servidor — cumprido nas duas metades, e a Action inline foi
  APAGADA, não ignorada.** `grep "use server"` em todo `app/app/estabelecimento/` devolve **uma
  única ocorrência**: `actions.ts:1`. Não sobrou nenhuma outra Server Action inline no arquivo nem
  no diretório. `onboarding_completed` **não é lido nem escrito** em nenhum dos arquivos novos (só
  a RPC o move, por dentro do banco).
- **(c) `whatsapp` normalizado no servidor — cumprido.** `actions.ts:117-149`. Casos conferidos:
  `(63) 99999-9999` vira `63999999999` ✅ · fixo `(63) 3222-2222` vira `6332222222` ✅ ·
  `+55 63 9 9999-9999` corta o `55` e sobra 11 dígitos ✅ · `0800 777 1234` recusado com mensagem
  própria ✅ · ramal (`...ramal 45`, 12 dígitos sem prefixo `55`) recusado ✅ · string vazia deixa
  o campo nulo (opcional, é o R-036, decisão de produto) ✅ · 30 dígitos barrado antes, pelo teto
  de 24 (`320-321`) ✅. **Armadilha que ele evitou e vale registrar:** o corte do `55` só acontece
  com 12 ou 13 dígitos, então **DDD 55 (Santa Maria/RS) não é mutilado** — `55999999999` tem 11 e
  passa inteiro.
- **(d) Frase de declaração de autorização do responsável técnico — cumprida.**
  `ClinicOnboardingForm.tsx:180-185`, no passo 1, ao lado do campo, e não escondida no passo 4.

## C. Autorização — a ordem, e se existe escrita antes de conferência

A ordem em `salvarOnboardingClinic` é: **sessão (`187-189`) → perfil (`191-202`) → role (`210`) →
lista de permitidos de status (`223-237`) → validação (`242-328`) → escrita (`343`)**. Não existe
caminho em que uma escrita aconteça antes das três conferências: a primeira chamada de escrita do
arquivo é a da linha 343, e tudo acima dela ou devolve valor ou lança `redirect`.

- **Um `tutor` ou `vet` logado que alcance o id desta action escreve alguma coisa?** **Não.**
  `perfil.role !== "clinic"` leva a `redirect("/app")`, que lança antes de qualquer `from(...)`. E
  há segunda e terceira porta no banco, independentes do Next: `clinic_profiles_insert_own` e
  `update_own` exigem `tem_role('clinic')` (`0002:543-553`), `perfil_privado_insert_own` e
  `update_own` exigem `tem_role('vet') or tem_role('clinic')` (`0002:576-597`), e a guarda
  `recusar_dado_de_estabelecimento_em_pessoa_fisica` (`0003:1202-1233`) levanta exceção se
  `cnpj`, `razao_social` ou `responsavel_tecnico` caírem na linha de quem não é `clinic`. Como
  `cnpj` é sempre não-nulo aqui (obrigatório em `289`), o atalho da guarda não dispara e ela
  **executa de verdade** — este diff é o primeiro caminho feliz dela.
- **O `auth.uid()` da escrita vem de onde?** Da sessão. `user.id` nas duas escritas e nas três
  leituras; `ClinicOnboardingPayload` (`campos.ts:70-82`) **não tem campo de id** e não há
  `.eq("id", <algo do payload>)` em lugar nenhum.
- **Ninguém escaparia por página nova de painel:** conferidas as 11 páginas de
  `app/app/estabelecimento/` uma a uma. Sete usam `requirePainel("clinic")`, quatro
  (`(painel)/page.tsx:37`, `equipe:28`, `perfil:22`, `onboarding:41`) usam o guard inline
  equivalente. **Nenhuma esqueceu.** O portão de **status** continua ausente em todas — é o
  R-038/T-016, e este diff corretamente não improvisa.

## D. Vazamento de dado privado

- **Log:** cinco chamadas de console (`85`, `225`, `433`, `442`, `465`). Emitem `userId` (uuid),
  `status`, `code`, `message`. **Nenhuma emite `details`, e nenhuma pode:** o tipo de
  `mensagemDoBanco` (`81-84`) foi clonado e não aceita o campo. **Nenhuma chamada contorna a
  função** — os dois `console.error` e `console.warn` avulsos (`433`, `442`) montam o objeto à
  mão, com `message` e `code` apenas. Aqui isso pesa: o `DETAIL` de um erro em `perfil_privado`
  seria `Failing row contains (<uuid>, <whatsapp>, …, <razao_social>, <cnpj>, <responsavel_tecnico>)`,
  ou seja a linha inteira no log da Vercel, fora do alcance da rotina de exportação e exclusão da
  F6 (R-024).
- **Resposta da Action:** `ResultadoOnboarding` é `{ ok: false, mensagem: string }`. Nenhuma
  mensagem interpola CNPJ, razão social ou responsável técnico. A única que interpola entrada do
  usuário é a de `servicos` — ver **SEC-073**.
- **HTML:** os três dados de identificação e o WhatsApp vão para o formulário em
  `page.tsx:102-114`, e isso é **o dono lendo a própria linha**, coberto por
  `perfil_privado_select_own`. A página é dinâmica (`createClient` chama `cookies()`), sem
  `revalidate` nem `dynamic`, então a resposta de um dono não pode ser servida a outro. O DL-047
  fala de busca e perfil público, onde quem lê é outra pessoa, e não é o caso aqui. **Nenhum
  `wa.me` é montado em lugar nenhum deste diff.**
- **Nada privado foi para tabela pública:** o payload de `clinic_profiles` (`346-355`) tem
  `id, nome_fantasia, endereco, cep, cidade, estado, sobre, servicos` e mais nada. Os três de
  identificação não aparecem nem como nulo explícito, e isso está correto: `0003:1247-1249`
  derrubou as colunas de lá.

## E. Validação de payload — hoje o servidor é a única defesa

Com `clinic_profiles` e `perfil_privado` sem um único CHECK de conteúdo (é a T-017), o que a
Action aplica é tudo o que existe:

| Campo | O que o servidor faz | Veredito |
|---|---|---|
| `nomeFantasia` | obrigatório, ≤ 120 | ok |
| `razaoSocial` | opcional, ≤ 160 | ok |
| `cnpj` | obrigatório, ≤ 18 **antes** de normalizar, formato `[A-Z0-9]{12}[0-9]{2}`, recusa 14 caracteres repetidos | ok. Aceita CNPJ alfanumérico de propósito, com o motivo escrito (`151-161`) |
| `responsavelTecnico` | opcional, ≤ 120 | ok |
| `endereco` / `cep` | ≤ 200 / ≤ 12, `cep` normalizado e exigido com 8 dígitos quando preenchido | ok. `"abcdefgh"` é recusado, não vira `""` |
| `cidade` | obrigatória, ≤ 80, **texto livre** | é a T-017 |
| `estado` | obrigatório, whitelist de 27 UFs (`314-315`) | ok |
| `sobre` | ≤ 600, `trim` sem colapsar quebras de linha | ok |
| `servicos` | `Array.isArray`, teto **antes** da varredura, dedup por `Set`, whitelist | ok, com a ressalva do SEC-073 |
| `whatsapp` | ≤ 24, normalizado, recusado se não tiver cara de telefone BR | ok |

**Campo extra, tipo errado, payload nulo:** não quebram nada. Todo campo passa por `limpar()`
(`60-62`, que devolve `""` para qualquer coisa que não seja string) ou por `Array.isArray`.
`entrada` sendo `null`, string ou objeto com chaves a mais resulta em erro de validação legível,
nunca em exceção. Chave extra no objeto é simplesmente ignorada: **não há spread do payload em
nenhum dos dois upserts**, as colunas são escritas uma a uma. Array gigante é recusado pelo
comprimento antes de qualquer `map`. O teto de cima é o `bodySizeLimit` padrão de Server Action
(1 MB); `next.config.ts` não o altera.

**Incoerência cidade × UF continua sem checagem** — é o R-036, pré-existente, não é desta task.

## F. `redirect()` fora de `try/catch`

**Sim.** `actions.ts` **não tem um único `try` no arquivo** (`grep` confirma). Os três `redirect`
(`189`, `210`, `473-475`) estão em fluxo direto, e o cliente não envolve a chamada
(`ClinicOnboardingForm.tsx:73-88` comenta o porquê). DL-016 respeitado.

---

## Achados novos — SEC-071 a SEC-073

### SEC-071 — O handoff da T-007 descreve errado para onde vai o estabelecimento que concluiu, e o destino real é o pior dos dois · 🟡

- **Onde:** `docs/03-TAREFAS.md`, Resultado da T-007, *Descobri 1* · contra
  `app/app/page.tsx:20-24` e `supabase/migrations/0002_nucleo.sql:753-757`
- **O quê:** o handoff afirma que *"um `clinic` que concluiu e depois digita `/app` volta pro
  onboarding em modo 'revisao' em vez de ir pra `/aguardando`"*. **Não volta.**
  `concluir_onboarding_profissional()` escreve `onboarding_completed = true` no mesmo `update` em
  que move o `status`, e `app/app/page.tsx:20` só manda para o onboarding quem tem
  `onboarding_completed` falso. O destino real é `/app/estabelecimento`, **o painel**, que não lê
  `status` (R-038).
- **Como reproduzir:** concluir o onboarding com conta `clinic` (`status` vira
  `pending_validation`), digitar `/app`. Cai no dashboard do painel, não no onboarding e não em
  `/aguardando`.
- **Impacto:** nenhum dado vaza, porque as páginas do painel são casca hoje. O custo é de
  registro: o card descreve um sintoma inofensivo ("volta pro formulário") onde o real é
  exatamente a lacuna que a T-016 existe para fechar. Quem ler o handoff para dimensionar a T-016
  vai dimensionar errado. É o mecanismo do R-034 de novo, em outro suporte.
- **Como corrigir:** uma linha no card, pelo `vetria-escriba`. O comportamento em si é T-016:
  `/app` passa a rotear por `profiles.status`.
- **Vale para o veterinário também:** o handoff da T-006 carrega a mesma frase.

### SEC-072 — O estabelecimento reprovado cai neste formulário em modo "novo" e o `status_motivo` não é lido nem exibido em lugar nenhum · 🟡

- **Onde:** `app/app/estabelecimento/onboarding/page.tsx:34-38` (o `select` pede `role, status` e
  nada mais) e `120` (`modo` é `"revisao"` só quando `pending_validation`) · contra
  `supabase/migrations/0002_nucleo.sql:702-712`
- **O quê:** `admin_definir_status` devolve `onboarding_completed = false` ao reprovar, e o
  comentário da própria migration diz por quê, com todas as letras: *"Sem isto (…) o roteamento
  manda o reprovado pro painel, e ele nunca alcança a tela onde o `status_motivo` aparece: fica
  sem saber por que foi reprovado."* **Essa tela não existe.** O reprovado volta para
  `status = 'incomplete'`, `/app` o manda para este onboarding, o guard aceita `incomplete`, e ele
  recebe um formulário pré-preenchido com o título *"Vamos cadastrar o seu estabelecimento"* e
  nenhuma menção ao motivo da reprova.
- **Como reproduzir:** admin roda
  `admin_definir_status(<uuid>, 'incomplete', 'CNPJ não confere com o documento')`, o titular
  loga, cai em `/app`, e chega ao onboarding em modo "novo", sem o motivo em lugar nenhum.
- **Impacto:** não é vazamento. É o laço de reprova mudo: a pessoa reenvia o mesmo dado, o admin
  reprova de novo, e a fila da S4 recicla. O mecanismo que o banco implementa de propósito não tem
  contraparte na interface. **Herdado da T-006** (o `page.tsx` do veterinário também só seleciona
  `role, status`), então o clone não piorou nada, mas é aqui que ele passa a existir para
  `clinic`.
- **Como corrigir:** `page.tsx` selecionar `status_motivo` junto e o formulário exibi-lo quando
  `status = 'incomplete'` e o motivo não for nulo. É leitura da própria linha, sem migration, sem
  policy. Cabe na T-016 ou num card da S4, não na T-007.

### SEC-073 — Item de `servicos` não tem teto de tamanho individual, e a mensagem de erro devolve o item cru ao cliente · 🟡

- **Onde:** `app/app/estabelecimento/onboarding/actions.ts:267-275`
- **O quê:** o teto de **quantidade** existe e vem antes da varredura (SEC-058 herdada), mas não
  há teto por **item**. `limpar()` só recorta espaços. O item que não passa na whitelist volta
  interpolado na mensagem: `Passo 3: serviço não reconhecido: ${foraDaLista[0]}`.
- **Como explorar:** POST na Action com `servicos: ["<~1 MB de texto>"]`. O servidor devolve o
  megabyte inteiro dentro da mensagem de erro, que o formulário renderiza.
- **Impacto: baixo e honesto.** Não é XSS, porque React escapa o texto e não há
  `dangerouslySetInnerHTML` em nenhum arquivo do diretório. Não é DoS relevante, porque o total é
  limitado pelo `bodySizeLimit` de 1 MB e o trabalho é linear. Não vaza nada de ninguém. **Entra
  como defesa em profundidade**, e porque a mesma mensagem vai ser clonada de novo: o original do
  veterinário tem a gêmea, em `especialidades`.
- **Como corrigir:** teto por item antes da comparação e truncar o valor na mensagem, ou não
  ecoá-lo.

---

## Verificado e OK

- **As 12 garantias herdadas da T-006**, item por item, na tabela da seção A. Reconferidas contra
  `0002` e `0003`, não contra o relatório de 09/09.
- **As quatro linhas da Condição de partida**, cumpridas de verdade, seção B.
- **Uma única `"use server"` em todo `app/app/estabelecimento/`**, em `actions.ts:1`. A Action
  inline de `page.tsx:33-59` sumiu do arquivo, e nenhuma outra nasceu no lugar.
- **As 11 páginas do painel do estabelecimento conferem role** (7 por `requirePainel("clinic")`,
  4 por guard inline). Nenhuma página nova foi criada por este diff.
- **Nenhum `SUPABASE_SERVICE_ROLE_KEY` em nenhum dos cinco arquivos**; `lib/supabase/admin.ts` não
  é importado. Varredura do repo confirma que a chave só aparece em `app/api/admin/*`, em
  `lib/supabase/admin.ts` e em `app/env.example`, sempre sem `NEXT_PUBLIC_`.
- **R-004 não é alcançado.** Nenhum `dangerouslySetInnerHTML`; o único SVG é o logo estático de
  `/public` (`ClinicOnboardingForm.tsx:95`) e os ícones inline do próprio arquivo; o formulário
  não aceita upload de arquivo nenhum (os dois blocos de upload são `div` com texto).
- **CNPJ fora do `signUp`** (`app/cadastro/estabelecimento/page.tsx:48-59`): o `data` virou
  `{ full_name, cidade, role }`, o `useState` sumiu e o campo saiu da tela. Fecha o R-024 / SEC-042
  **na origem**. Para contas já criadas o CNPJ continua em `auth.users.raw_user_meta_data` e no
  JWT. A primeira revisão já registrou que isso precisa de card próprio, e mexer em `auth.users` é
  🔴. Confirmado, e não é conserto de T-007.
- **SEC-069 / R-048 resolvido:** `supabase/verificar-apos-0003.sql` **não está mais modificado** na
  árvore (`git status` lista só os 5 arquivos da task), e a sonda de `pg_trigger` sobre
  `perfil_privado` está de volta no arquivo, linhas 672-685, com os quatro triggers esperados no
  comentário. A condição pré-deploy do card está satisfeita; reconfira no `git diff --stat` do
  commit.
- **`app/api/onboarding/set-role/route.ts` não é porta lateral para virar `clinic`:**
  `handle_new_user` (`0002:787-800`) sempre insere um `role`, então a rota sempre cai no
  `409 role already set`, e a policy `profiles_update_own_safe_fields` pina `role` de qualquer
  jeito. Código morto, defesa dupla intacta.
- **`npx tsc --noEmit`: limpo**, rodado nesta árvore.
- Os seis achados de 09/09 (SEC-065 a SEC-070 / R-044 a R-049) foram relidos e **continuam
  corretos e corretamente classificados**. Nenhum é repetido aqui.

## Não consegui verificar

1. **Se a RLS, os triggers e a versão de `revalidar_ao_mudar_dado_sensivel()` em produção são os
   das migrations.** Todo o veredito sobre a segunda e a terceira porta é leitura do SQL
   versionado. As duas sondas que fecham isso em dez segundos estão em
   `supabase/verificar-apos-0003.sql` (seção Sonda 11), e a terceira é
   `select prosrc from pg_proc where proname = 'revalidar_ao_mudar_dado_sensivel';`.
2. **A contagem do R-047 / SEC-068:**
   `select count(*) from profiles where role='clinic' and onboarding_completed and status='incomplete';`
   **Nada neste diff muda a natureza desse risco.** Ele segue sendo medição, e mais que zero segue
   sendo `update` de linha, 🔴, sessão presencial.
3. **Quantas linhas de `auth.users` ainda carregam `cnpj` no `raw_user_meta_data`.**
4. **Nenhum achado tem prova de execução.** Não há teste automatizado deste caminho (R-033), e a
   prova de persistência do card continua sendo o único critério aberto, e continua sendo do
   Elber.

---

## Veredito

> **O diff da T-007 pode ser mergeado como está.** O clone herdou as cinco correções da T-006 e as
> sete garantias estruturais do original, cumpriu as quatro linhas da Condição de partida, apagou
> a Server Action inline em vez de preservá-la, confere sessão, role e status antes de qualquer
> escrita, nunca aceita id do cliente, não coloca CNPJ nem razão social em log, resposta ou tabela
> pública, e mantém `redirect()` fora de `try/catch`. **Nenhum achado 🔴 ou 🟠.**
>
> **Os três achados 🟡 entram como risco e nenhum é conserto desta task:** SEC-071 é uma linha de
> texto no card, SEC-072 é T-016 ou S4, SEC-073 é defesa em profundidade que vale corrigir junto
> com a gêmea do veterinário.
>
> **As duas condições pré-deploy continuam valendo, e uma já caiu:** SEC-069 / R-048 está
> resolvido, porque a sonda voltou. **SEC-068 / R-047 não.** Conte antes de subir.
