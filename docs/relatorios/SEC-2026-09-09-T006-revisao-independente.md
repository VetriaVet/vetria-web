# Revisão independente de segurança — onboarding do veterinário — 09/09/2026

> ## O QUE ESTE ARQUIVO É, E O QUE ELE NÃO É
>
> Este **não** é o relatório da T-006, e **não** é a reconstrução de 31/08
> (`SEC-2026-08-28-T006.md`). É a revisão independente que o **R-034** pede como
> condição para a **T-007** começar.
>
> **Contra o quê foi lido:** `docs/06-PERMISSOES.md` (matriz de rotas §2, matriz de dados §3,
> portão de status §4, evento de contato §6) e o schema real de
> `supabase/migrations/0000_baseline.sql`, `0002_nucleo.sql` e `0003_storage_documentos.sql`,
> as três aplicadas em produção.
>
> **Contra o quê NÃO foi lido, de propósito:** os comentários do próprio código. Eles foram
> lidos **por último**, só para conferir se algum achado novo já estava explicado, e nenhum
> achado abaixo saiu deles. Esse era o ponto cego que o R-034 descreve.

**Escopo varrido, arquivo a arquivo:**
`app/app/veterinario/onboarding/actions.ts` (378 linhas, linha a linha) ·
`app/app/veterinario/onboarding/page.tsx` · `campos.ts` · `VetOnboardingForm.tsx`.
**Mais o que eles importam ou alcançam:** `lib/supabase/server.ts`, `lib/supabase/browser.ts`,
`lib/auth/painel.ts`, `middleware.ts`, `app/app/layout.tsx`, `app/app/page.tsx`,
`app/app/veterinario/(painel)/` (as 8 páginas) e `app/app/estabelecimento/onboarding/page.tsx`
(porque é o arquivo que a T-007 substitui).

**Base:** commit `e07f967` na `main`.

**Quatro achados foram reconferidos no código pela sessão que colou este arquivo**, em
09/09/2026, antes de ele ir para o disco: `requirePainel` selecionando só `role`
(`lib/auth/painel.ts:14`), o WITH CHECK de `vet_profiles_update_own` pinando só `id` e `slug`
(`0002_nucleo.sql:518-524`), `admin_definir_status` usando `onboarding_completed` como mecanismo
de reprova (`0002_nucleo.sql:709-711`) sem que a policy o pine, e a Server Action inline de
`estabelecimento/onboarding/page.tsx:33-59` conferindo sessão e não conferindo role. **Os quatro
se confirmam.** Os demais não foram reconferidos e valem pelo que este relatório diz que são:
leitura de código e de schema.

**O que NÃO foi coberto, e ninguém deve ler este arquivo como se tivesse sido:**
- **Nada foi exercitado contra o banco.** Toda afirmação sobre RLS abaixo é leitura do SQL
  versionado, não sonda em produção. Onde seria preciso `select` para provar, está dito.
- **Não foi varrido o histórico do git por segredo**, não foram auditadas as rotas `/api/*`, nem
  a `0003` (já tem dois relatórios), nem o onboarding do responsável.
- **Não há teste automatizado deste caminho** (R-033). Nenhum achado abaixo tem prova de
  execução: são leitura de código e de schema.

---

## Resumo

O `actions.ts` da T-006 está **certo no que é dele**: nunca aceita id vindo do cliente, confere
role e status no servidor antes de escrever, não toca em `status`, `slug`, `documento_*` nem em
dado de estabelecimento, e não coloca `details` do Postgres no log. Os cinco achados
reconstruídos estão de fato corrigidos, e foram reconferidos um a um contra o schema.

**Os seis achados novos não estão dentro do `actions.ts`: estão na costura entre ele e o resto
do sistema** — no destino do `redirect()` dele, e na diferença entre o que a Server Action valida
e o que o banco aceita. Dois são 🟠, quatro são 🟡, **nenhum é 🔴 e nenhum é vazamento de dado de
um usuário para outro.**

**Dá pra colocar gente real nisso hoje?** Para o dado que este formulário grava, **sim**: CRMV,
cidade e WhatsApp de um veterinário real não vazam para ninguém por este caminho. O que ainda não
existe é o **portão de status** da matriz §4, e ele deixa de ser barato no dia em que o painel
parar de ser casca.

---

## Veredito sobre o buraco SEC-053 / SEC-055

**O buraco fica FECHADO POR COBERTURA, e isso está dito com todas as letras:**

`actions.ts` e `page.tsx` foram relidos linha a linha contra a matriz e contra as três
migrations, sem usar os comentários como guia, e **não foi encontrado nenhum defeito adicional
dentro desses dois arquivos** nas categorias 🔴 ou 🟠. Os seis achados novos são todos **fora do
artefato**: dois no painel de destino, um no schema, um no formato de um campo, um na ausência de
transação e um em LGPD. Nenhum deles é do tipo que a auditoria de 28/08 — cujo escopo declarado
eram os quatro arquivos do diretório — teria numerado como 053 ou 055 sem deixar comentário no
código, porque todos exigem sair do diretório para serem vistos.

Ou seja: **a lista de cinco está completa para os arquivos que ela cobria.** Os números 053 e 055
continuam não recuperados como história, e continuam assim para sempre: a sessão que os gerou não
existe mais. O que o R-034 pedia não era recuperá-los, era **provar que a superfície tinha sido
olhada por olho que não fosse o do autor**. Foi olhada. **R-034 pode fechar**, com a ressalva de
que ele fecha por cobertura, não por memória, e com os seis achados abaixo entrando no lugar dos
dois números perdidos.

A numeração nova começa em **SEC-059**, deixando 053 e 055 permanentemente vagos como marca
histórica. Não reutilize esses dois números.

---

## Achados

### SEC-059 — O portão de status da matriz §4 não existe em lugar nenhum do código · 🟠
- **Onde:** `lib/auth/painel.ts:13-18` (confere só `role`) · `middleware.ts:31-51` (não confere
  role nem status entre painéis) · `app/app/veterinario/(painel)/aguardando/page.tsx:6`
  ("gating real é a TASK-032") · destino de `app/app/veterinario/onboarding/actions.ts:376-377`
- **O quê:** a matriz §4 diz que `incomplete` alcança **só** `/onboarding`, que
  `pending_validation` alcança **só** `/aguardando`, `/perfil` e `/configuracoes`, e que
  "o resto é bloqueado **no servidor**, não escondido no menu". **Nenhuma das oito páginas do
  painel do veterinário lê `profiles.status`.** `requirePainel("vet")` seleciona exatamente uma
  coluna, `role`, e devolve. O `middleware.ts` não olha status. A única coisa que sustenta o
  portão hoje é o `redirect()` do fim da Server Action, que é uma sugestão de navegação, não um
  guard.
- **Como explorar:** conta `vet` com `status = 'incomplete'` ou `pending_validation`, logada.
  Digitar `/app/veterinario/contatos`, `/app/veterinario/plano`, `/app/veterinario/agenda` ou
  `/app/veterinario` na barra de endereço. As quatro renderizam. Não é preciso ferramenta
  nenhuma, nem devtools.
- **Agravante, no caminho feliz:** `actions.ts:366` faz
  `const statusFinal = depois?.status ?? perfil.status`. Se a releitura do passo 6 falhar por
  rede, `statusFinal` volta a ser `incomplete`, a linha 377 executa `redirect("/app/veterinario")`
  e o próprio produto deposita no painel um profissional que acabou de entrar na fila. O portão
  ausente não é alcançável só à mão: o sucesso também chega lá.
- **Impacto:** hoje, **nada material** — as oito páginas são casca e não mostram dado de
  ninguém. A partir do momento em que `/contatos` mostrar leads reais e `/plano` mostrar
  cobrança, a mesma navegação passa a entregar tela de produto pago a quem não foi validado.
  É a diferença entre 🟠 hoje e 🔴 em quatro semanas, sem nenhuma linha de código mudar.
- **Por que isto é R-034 se repetindo:** o único lugar do repositório onde este controle está
  registrado é um comentário em `aguardando/page.tsx:6`, e ele aponta para **TASK-032**, que
  vive em `BACKLOG.md` — arquivo **congelado**, da fase visual. Não há card na fila e não há
  linha em `04-RISCOS.md`. Controle que existe só em comentário de código é exatamente o
  defeito que o R-034 descreve.
- **Como corrigir:** `requirePainel` passa a receber o conjunto de status permitido e a
  selecionar `role, status`, no mesmo padrão de **lista de permitidos** da SEC-052. O portão
  completo (incluindo a tela de bloqueio do `suspended`) é o card da S3 que o R-001 já espera;
  não invente aqui.
- **T-007 herda?** **SIM, integralmente.** `app/app/estabelecimento/(painel)/` tem as mesmas
  oito páginas mais `equipe`, todas com `requirePainel("clinic")` e nenhuma com status. E a
  T-007 é justamente a task que passa a existir `clinic` em `pending_validation` de verdade.
- **Vira task:** **T-016**

---

### SEC-060 — A Server Action é a única que valida o conteúdo, e não é a única que escreve em `vet_profiles` · 🟠
- **Onde:** `app/app/veterinario/onboarding/campos.ts:1-15` e `actions.ts:184-236`, contra
  `supabase/migrations/0002_nucleo.sql:238-262` (DDL de `vet_profiles`) e `0002_nucleo.sql:517-524`
  (policy `vet_profiles_update_own`)
- **O quê:** `campos.ts:5-8` declara a garantia, por escrito: *"Se a lista de valores só existir
  no cliente, o servidor aceita qualquer string e a busca herda lixo. A lista mora aqui, e a
  Server Action valida contra ela."* **A premissa é falsa.** A Server Action não é o servidor:
  é *um* dos escritores. As colunas de `vet_profiles` são `text`, `text[]` e `boolean` **sem um
  único CHECK**, e a policy `vet_profiles_update_own` autoriza o dono com um WITH CHECK que pina
  **apenas `id` e `slug`**. Todo o resto — `crmv`, `crmv_uf`, `titulo`, `experiencia`,
  `especialidades`, `cidade`, `estado`, `bairro`, `bio`, os três `atende_*` — aceita qualquer
  coisa vinda direto do PostgREST.
- **Como explorar:** logar como `vet`; `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão no bundle (`lib/supabase/browser.ts:5-6`) e o token de
  sessão está no cookie que o cliente do browser lê. Um `PATCH` em
  `/rest/v1/vet_profiles?id=eq.<meu uuid>`, com a anon key e o Bearer da própria sessão, gravando
  `estado: "ZZ"`, `experiencia: "gt99"`, um `especialidades` com milhares de entradas e uma `bio`
  de megabytes, é aceito. A RLS autoriza: `id = auth.uid()` e `tem_role('vet')` são verdadeiros,
  e o WITH CHECK só reclama de `slug`. **Nenhuma dessas colunas é vigiada pelo
  `revalidar_ao_mudar_dado_sensivel`** (`0002_nucleo.sql:379-386` vigia só `crmv`, `crmv_uf` e
  `nome_exibicao`), então um vet `active` faz isso **sem voltar para a fila e sem entrar em
  `audit_logs`**.
- **Impacto:** três coisas, em ordem de custo. **(1)** As facetas da busca da F4/S6
  (`estado`, `especialidades`, `experiencia`, `titulo`) herdam valor fora de qualquer whitelist,
  que é literalmente o que o `campos.ts` diz existir para impedir. **(2)** `vet_profiles` é
  **tabela de leitura pública**: uma `bio` de vários MB e um `especialidades` de milhares de
  entradas são servidos ao visitante anônimo e entram na agregação de facetas da busca, sem
  teto nenhum. **(3)** O dado é do próprio dono: **não há acesso cruzado**, e é por isso que
  isto é 🟠 e não 🔴.
- **O que NÃO é:** não é escalada de privilégio. `status`, `role`, `admin_level` e `slug`
  continuam pinados pelas policies, e as quatro foram reconferidas. O profissional não entra na
  busca sem validação por esta porta.
- **Como corrigir:** a garantia tem que morar onde a escrita cai. Direção: CHECK/domain em
  `crmv_uf` e `estado` (duas letras, UF válida), CHECK de whitelist em `titulo` e `experiencia`,
  teto de comprimento nas colunas de texto e limite no tamanho do array `especialidades`, mais
  whitelist nele. **Alternativa, se ninguém quiser migration:** revogar UPDATE do dono em
  `vet_profiles` e fazer toda escrita passar por RPC `SECURITY DEFINER`, no mesmo molde de
  `concluir_onboarding_profissional()`. **Qualquer um dos dois é migration, ou seja 🔴 e sessão
  presencial.** Não é conserto de T-007.
- **T-007 herda?** **SIM, e pior.** `clinic_profiles` tem a policy gêmea
  (`0002_nucleo.sql:546-553`, mesmo WITH CHECK pinando só `slug`) e nenhum CHECK de conteúdo.
  E tem uma coluna que `vet_profiles` não tem: **`clinic_profiles.site`**, que a `0003:1301`
  declara *"PÚBLICA por decisão. É vitrine."* — uma **URL escrita pelo dono, sem validação de
  esquema, destinada a virar link numa página pública na F4/S7**. `javascript:` e `data:`
  passam. Isso não é explorável hoje porque a página não existe; **é explorável no dia em que
  ela existir, e quem a escrever vai acreditar no `campos.ts` clonado.** Registre isso no card
  da T-007 antes que a página nasça.
- **Vira task:** **T-017**

---

### SEC-061 — `onboarding_completed` é escrito pelo próprio usuário, e é o sinal em que o app roteia · 🟡
- **Onde:** `supabase/migrations/0000_baseline.sql:193-207` (a policy) ·
  `app/app/page.tsx:20` · `app/app/veterinario/(painel)/page.tsx:56` ·
  `app/app/responsavel/page.tsx:33` · `app/app/estabelecimento/onboarding/page.tsx:23,45`
- **O quê:** `profiles_update_own_safe_fields` pina `role`, `admin_level`, `admin_team` e, desde
  a `0002` §7.2, `status` e `status_motivo`. **Não pina `onboarding_completed`** — e o comentário
  da própria baseline (linha 194) diz que isso é intencional: *"O dono edita full_name, phone e
  onboarding_completed"*. Fazia sentido quando o onboarding era casca e a coluna era uma
  autodeclaração. **Deixou de fazer** quando `admin_definir_status` passou a usá-la como
  mecanismo: ao reprovar, ela escreve `onboarding_completed = false`
  (`0002_nucleo.sql:697-711`) exatamente para forçar o reprovado a passar pela tela onde o
  `status_motivo` aparece.
- **Como explorar:** não precisa de nada além do que o app já faz. **O próprio repositório é a
  prova de conceito:** `app/app/estabelecimento/onboarding/page.tsx:45` executa
  `.update({ onboarding_completed: true })` **com a sessão do usuário** e funciona hoje em
  produção. O mesmo PATCH pelo PostgREST, com o token do próprio usuário, escreve a coluna. Um
  `vet` reprovado que rode isso deixa de ser mandado para a tela do motivo por `/app`
  (`app/app/page.tsx:20`) e passa a cair no painel — que, por **SEC-059**, o recebe.
- **Impacto:** **nenhum dado cruza usuário, e nenhuma visibilidade de busca é ganha** — o
  `status` continua pinado, então o reprovado segue fora da busca e fora do plano pago. O que se
  perde é o mecanismo pelo qual o admin comunica uma reprova. **É por isso que é 🟡 e não 🟠:**
  o controle que ele derruba é de comunicação, não de acesso.
- **Como corrigir:** decidir de que lado a coluna fica. Ou ela é sinal de autorização, e então
  entra no WITH CHECK do §7.2 junto com `status` (migration, 🔴), ou ela é autodeclaração e
  **nenhuma decisão do servidor pode depender dela** — e aí `app/app/page.tsx:20` passa a rotear
  por `profiles.status`, que é o que a T-006 já fez no guard dela
  (`onboarding/page.tsx:42-79`) e é o padrão certo. A segunda é a barata e não é migration.
- **T-007 herda?** **SIM, e é uma decisão que ela toma sem perceber.** O arquivo que a T-007
  reescreve, `app/app/estabelecimento/onboarding/page.tsx`, tem **os dois** usos: o guard na
  linha 23 e a escrita na linha 45. Se a T-007 clonar o `page.tsx` do veterinário, herda o padrão
  certo (guard por `status`) e a coluna some do caminho. Se ela "preservar a lógica existente",
  perpetua. **Escreva no card qual dos dois.**
  ⚠️ **Bônus do mesmo arquivo, que a T-007 tem que apagar, não clonar:** a Server Action inline de
  `estabelecimento/onboarding/page.tsx:33-59` **confere sessão e não confere role**. Ela escreve
  `onboarding_completed` para qualquer usuário logado que alcance o id da action. O `actions.ts`
  do veterinário faz certo (`actions.ts:110`): confere `role` no servidor antes de escrever.

---

### SEC-062 — `whatsapp` é gravado sem formato, sem normalização e sem verificação · 🟡
- **Onde:** `app/app/veterinario/onboarding/actions.ts:154,235-236,293` ·
  `campos.ts:64` · `VetOnboardingForm.tsx:274-276`
- **O quê:** a única regra aplicada ao WhatsApp é o teto de 24 caracteres (`LIMITES.whatsapp`).
  Não há checagem de que sejam dígitos, não há normalização (o campo é `type="tel"` sem máscara,
  então `(63) 99999-9999`, `63999999999` e `+55 63 9 9999-9999` viram três strings diferentes no
  banco para o mesmo número) e não há verificação de posse. A coluna em `perfil_privado`
  (`0002_nucleo.sql:294`) é `text` puro, sem CHECK.
- **Como explorar:** concluir o onboarding com `whatsapp` = número de um concorrente, um 0800,
  ou uma string com parâmetro de query colado. O valor é aceito. Pelo **DL-047** (matriz §6), o
  servidor devolve esse valor no evento de contato, e grava a linha em `contatos` como se fosse
  um lead entregue.
- **Impacto:** o produto revela como "WhatsApp do profissional" uma string que nunca foi
  conferida, e conta esse contato na métrica que a matriz §6 chama de *"o número que você vende"*.
  E a rota de contato da F4 vai precisar montar um `wa.me` a partir de uma string que pode não
  ser dígito nenhum: a normalização vai ter que existir de qualquer jeito, e sai muito mais cara
  depois de existir base gravada em três formatos.
- **Não confundir com R-036:** aquele risco diz que o campo é **opcional**, e é decisão de
  produto. Este diz que, **quando preenchido, ninguém olha o que é**. São problemas diferentes no
  mesmo campo.
- **Como corrigir:** normalizar para dígitos no servidor, na escrita, e recusar o que não tiver
  cara de telefone brasileiro. Verificação de posse (código por SMS) é outra conversa e está
  fora dos 3 meses.
- **T-007 herda?** **SIM.** O formulário do estabelecimento coleta contato pelo mesmo caminho e
  grava nas mesmas colunas de `perfil_privado` (`whatsapp`, `telefone`), e no estabelecimento o
  telefone institucional tem ainda mais formatos plausíveis (fixo com DDD, 0800, ramal).

---

### SEC-063 — Três escritas, nenhuma transação: o caminho de sucesso pode terminar pela metade · 🟡
- **Onde:** `app/app/veterinario/onboarding/actions.ts:247-269` (upsert 1),
  `287-297` (upsert 2), `313-351` (RPC)
- **O quê:** a Action faz três idas ao banco, independentes. Não há transação, e não há
  compensação. Se a segunda falhar, a primeira **já está gravada**; se a terceira falhar, as
  duas primeiras já estão. A Action lida com isso corretamente do ponto de vista da mensagem (o
  texto diz "seus dados foram salvos, mas..." em `actions.ts:341-343`), mas o estado do banco
  fica parcial.
- **Como explorar:** fechar a aba, ou perder rede, entre o passo 3 e o passo 4. É trivial de
  reproduzir e não exige má fé.
- **Impacto na T-006: baixo e autocorrigível.** Sobra uma linha em `vet_profiles` sem linha em
  `perfil_privado`, com `status` ainda `incomplete`; a pessoa volta, o formulário reabre
  preenchido (`page.tsx:83-99`) e ela conclui. Nada vaza, nada entra na busca. **Por isso 🟡.**
- **T-007 herda?** **SIM, e a T-008 herda MUITO pior.** Pelo **DL-055** (registrado em
  `04-RISCOS.md` §R-031), o passo 7 da T-008 escreve o objeto no bucket com `service_role` e o
  passo 8 grava a linha com a sessão do usuário. **São dois sistemas diferentes, e a falta de
  transação deixa de ser teórica:** objeto escrito no bucket + `INSERT` da linha recusado (pelo
  CHECK all-or-nothing, pela guarda da SEC-044, pelo `documento_hash` malformado, por qualquer
  coisa) = **documento de identidade órfão no bucket, sem nenhuma linha dizendo de quem é.**
  É o **R-023** inteiro, acontecendo na criação em vez de na exclusão, e nasce sozinho na
  primeira falha. O card da T-008 precisa dizer, por escrito, **qual das duas ordens ele usa** e
  **quem apaga o objeto quando o passo 8 falha**. Hoje ele não diz nem uma coisa nem outra.

---

### SEC-064 — Nenhum registro de consentimento e nenhuma trilha na coleta de dado pessoal · 🟡
- **Onde:** `app/app/veterinario/onboarding/VetOnboardingForm.tsx:294-302` (a afirmação em tela)
  contra `actions.ts:247-304` (o que de fato é gravado)
- **O quê:** a tela afirma ao profissional, com todas as letras, *"Seus dados são protegidos pela
  LGPD. O número do CRMV é usado apenas para validação."* **Não existe checkbox, não existe versão
  de termo, não existe coluna, não existe linha em `audit_logs`.** A afirmação é copy. A coleta
  grava CRMV, nome civil, cidade, bairro e telefone de uma pessoa real e não deixa registro de
  quando ela consentiu nem com o quê.
- **Como explorar:** não é explorável. **É lacuna de conformidade, e isso está dito de
  propósito** para não inflar o achado. Entra aqui porque a F6 vai escrever a rotina de
  exportação e exclusão olhando `profiles` e `perfil_privado`, e vai descobrir que não há o que
  exportar sobre consentimento.
- **T-007 herda?** **SIM, e no estabelecimento a natureza do problema muda.** O formulário da
  T-007 coleta `responsavel_tecnico`, e o `comment on column` da `0003:1290` já diz o que isso é,
  textualmente: *"É PESSOA FÍSICA, que pode nem ser a titular da conta e nunca consentiu em virar
  dado público."* **A T-007 é o primeiro ponto do produto em que a Vetria coleta dado pessoal de
  um terceiro que não está na tela.** Isso não é F6: é uma frase na tela da T-007 dizendo ao
  titular da conta que ele declara ter autorização do responsável técnico. Custa um parágrafo
  agora e custa um incidente depois.

---

## Verificado e OK

Tudo abaixo foi conferido de propósito e **está certo**. Vale tanto quanto a lista de cima,
porque é o que a T-007 pode clonar sem medo.

**O que mais importa, e está certo:**
- **A Action nunca aceita id vindo do cliente.** `actions.ts:92-94` pega o usuário da sessão e
  usa `user.id` nas três escritas (`250`, `291`) e nas três leituras (`99`, `332`, `363`). Não
  existe caminho em que o payload influencie **de quem** é a linha. Este é o defeito nº 1 de
  Server Action, e ele não está aqui.
- **Role conferido no servidor, antes de qualquer escrita** (`actions.ts:110`), e antes da
  checagem de status. Rota em português, valor em inglês (DL-043), correto.
- **`profiles.status` não é escrito em lugar nenhum da Action.** A única transição é a RPC
  `concluir_onboarding_profissional()`, que é `SECURITY DEFINER` + `SET search_path = public`,
  recusa role fora de `('vet','clinic')` e recusa status diferente de `incomplete`
  (`0002_nucleo.sql:717-745`). Conferido contra a policy §7.2, que pina `status` e `status_motivo`
  no WITH CHECK. **Regra 1 da matriz §3 está honrada.**
- **`slug` fica fora do payload nos dois caminhos do upsert** (`actions.ts:250-265`), e a RLS
  ainda pina por cima nos dois (`slug is null` no INSERT, `is not distinct from` no UPDATE).
  Duas portas, correção SEC-008 intacta.
- **`cnpj`, `razao_social` e `responsavel_tecnico` não aparecem no payload nem como nulo
  explícito**, e `campos.ts:10-15` proíbe por escrito o spread de payload genérico entre vet e
  clinic. Confere com a guarda `recusar_dado_de_estabelecimento_em_pessoa_fisica`
  (`0003:1202-1234`), que levantaria exceção. **A T-007 tem que manter os dois payloads
  separados, e o `campos.ts` já diz isso.**
- **`documento_path`, `documento_hash` e `documento_tamanho` não são tocados.** Correto contra
  o CHECK `perfil_privado_documento_completo` (`0003:852-868`), que é all-or-nothing.
- **Nenhum dado pessoal vai para o log.** As chamadas de console
  (`actions.ts:70-73`, `130-133`, `337-340`, `346-349`, `368-372`) emitem `userId` (uuid),
  `status`, `code` e `message`. **`details` está excluído pelo tipo do parâmetro**
  (`actions.ts:66-69`), o que transforma a regra em erro de compilação e não em disciplina. Nem
  CRMV, nem nome, nem WhatsApp, nem email chegam ao log da Vercel. **É o melhor detalhe deste
  arquivo, e a T-007 tem que copiar o tipo, não só o comportamento.**
- **A mensagem de erro devolvida ao usuário carrega `code` e nunca `message`**
  (`actions.ts:81-84`). Nenhum nome de constraint, nenhuma estrutura de tabela.
- **WhatsApp em `perfil_privado`, não em `vet_profiles`.** SEC-002 respeitada. A leitura em
  `page.tsx:95-99` é o **dono lendo a própria linha**, coberta por `perfil_privado_select_own`,
  e é a exceção que a matriz §3 permite explicitamente. **Não é violação do DL-047:** a regra
  "telefone nunca no HTML" vale para busca e perfil público, onde quem lê é outra pessoa.
- **A página é dinâmica, então o WhatsApp do dono não pode ser cacheado para outro.**
  `lib/supabase/server.ts:5` chama `cookies()`, o que força render dinâmico; não há
  `revalidate` nem `dynamic` em `page.tsx`.
- **O teto do array vem antes da varredura** (`actions.ts:174-182`) e a deduplicação usa `Set`.
  A comparação com `MAX_ESPECIALIDADES` roda antes de qualquer `map`. Correção SEC-058 correta.
  **Não há ReDoS em `limpar`**: `/\s+/g` com `replace` é linear.
- **`Array.isArray`, `typeof` e `=== true` em todo campo** (`actions.ts:153,158-160,170-172`).
  Payload malformado ou de outro formato não passa por nenhum caminho: objeto vira string vazia,
  não-array vira array vazio, booleano não-`true` vira `false`. Tipos de TypeScript não existem
  em runtime e o arquivo sabe disso.
- **`redirect()` fora de qualquer `try/catch`** (`actions.ts:94`, `110`, `376-377`), DL-016
  respeitado, inclusive nos dois caminhos de expulsão.
- **A releitura do passo 6 existe e é por banco, não por comparação de string de exceção**
  (`actions.ts:330-334`, `360-364`). É a forma certa: texto de `raise exception` muda em
  migration sem aviso. Correção SEC-057 correta.
- **`.select().single()` no fim de cada upsert** (`actions.ts:268-269`, `296-297`), DL-011: uma
  gravação que não alcança linha nenhuma não passa por sucesso.
- **`telefone` e `email_contato` ficam fora do payload em vez de irem como nulo.** Correto: o
  upsert do PostgREST só escreve as colunas enviadas, então o editor de perfil da S3 não é
  apagado por quem revisita o onboarding.
- **`especialidades` preserva a ordem** depois do `Set`, então "a primeira é a principal"
  continua verdadeiro.

**Fora do diretório, conferido e OK:**
- `middleware.ts:31-36` exige sessão em `/app/**` e `/admin/**`, e o matcher cobre as duas.
  A porta trancada para visitante anônimo funciona (e tem teste E2E desde a T-003).
- `app/app/layout.tsx:45-47` faz passthrough para `vet`/`clinic`, então o onboarding não herda
  o header do responsável. Nenhum dado de perfil vaza pelo layout.
- Nenhum uso de `SUPABASE_SERVICE_ROLE_KEY` neste caminho. `lib/supabase/admin.ts` não é
  importado por nenhum arquivo do diretório auditado.
- Nenhum `dangerouslySetInnerHTML` em `VetOnboardingForm.tsx`. `bio`, `nome` e `bairro` são
  renderizados como texto por React, escapados. **R-004 não é alcançado por este caminho:** o
  único SVG servido aqui é o logo estático de `/public` (`VetOnboardingForm.tsx:116`), e o
  formulário não aceita upload de arquivo nenhum ainda.

---

## Não consegui verificar

Precisa de acesso ao dashboard do Supabase ou de sessão com dado real. **Nada abaixo foi assumido
como verdadeiro em nenhum achado acima.**

1. **Se a RLS em produção é mesmo a das migrations.** Todo o SEC-060 depende de
   `vet_profiles_update_own` estar em produção exatamente como está em `0002_nucleo.sql:517-524`.
   O R-006 fechou o descompasso repo/produção, mas a única prova é `select` no banco:
   `select policyname, cmd, with_check from pg_policies where tablename = 'vet_profiles';`
2. **Se `profiles_update_own_safe_fields` em produção continua sem `onboarding_completed` no
   WITH CHECK** (SEC-061). Mesmo `select`, em `tablename = 'profiles'`.
3. **A exploração do SEC-060 não foi executada.** O PATCH foi descrito pelo raciocínio da policy;
   não foi rodado contra o banco, porque isso escreveria numa linha real. Uma conta de teste em
   preview fecha isso em dois minutos, e essa medição vale mais que este relatório inteiro
   para o card T-017.
4. **Se `especialidades` com milhares de entradas de fato degrada a busca.** A busca não existe
   (F4/S6). É previsão, e está escrita como previsão.
5. **Se `authenticated` tem grant de UPDATE por coluna em `profiles`.** Não foi achado `grant`
   por coluna em nenhuma migration, o que significa grant de tabela inteira, mas grant feito
   pelo painel não estaria no repositório (R-006).

---

## Tabela "herda ou não" — o campo que importa para a T-007

| Achado | Grav. | T-007 herda ao clonar? | O que muda no card da T-007 |
|---|:---:|---|---|
| **SEC-059** portão de status inexistente | 🟠 | **SIM, integralmente** | Nada. **É T-016**, não é T-007. Só não deixe a T-007 "resolver" isso de improviso |
| **SEC-060** validação só na Action | 🟠 | **SIM, e pior** (`clinic_profiles.site` é URL pública sem validação de esquema) | Acrescentar linha: **`site` não é gravado sem validar esquema `http(s)`**, e a coluna vai virar link na F4/S7 |
| **SEC-061** `onboarding_completed` gravável | 🟡 | **SIM se clonar o `page.tsx` do estabelecimento; NÃO se clonar o do veterinário** | Fixar no card: **guard por `profiles.status`**, e a Server Action **confere role** (a inline atual não confere) |
| **SEC-062** WhatsApp sem formato | 🟡 | **SIM** (mesmas colunas, mais formatos) | Normalizar para dígitos na escrita |
| **SEC-063** três escritas sem transação | 🟡 | **SIM na T-007** (baixo) · **CRÍTICO na T-008** (documento órfão) | T-007: nada. **T-008: ordem dos passos 7/8 e quem apaga o objeto quando o 8 falha** |
| **SEC-064** sem consentimento | 🟡 | **SIM, e vira dado de terceiro** | Frase na tela: o titular declara ter autorização do responsável técnico |

**Os cinco reconstruídos (SEC-052, 054, 056, 057, 058): todos reconferidos contra o schema e
todos corretos.** A T-007 herda as cinco **correções**, e as cinco valem a pena clonar. A que
mais importa clonar é a **SEC-056**: o tipo do parâmetro de `mensagemDoBanco`
(`actions.ts:66-69`) **não aceita `details`**, o que é barreira de compilação, não disciplina.
Na T-007 o `details` carrega CNPJ e razão social.

---

## Parecer final

> **A T-007 pode começar**, desde que o card ganhe as quatro linhas da tabela acima antes da
> primeira linha de código, e desde que ela clone o `page.tsx` do **veterinário** e não o do
> estabelecimento. **Nada do que foi encontrado bloqueia a T-007, e T-016 e T-017 não são
> pré-requisitos dela.**
