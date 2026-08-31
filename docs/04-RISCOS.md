# 04 — RISCOS, BUGS E DÍVIDAS

> Tudo que sabemos que está errado, pode dar errado, ou vai dar errado depois.
> Alimentado pelos agentes `vetria-seguranca`, `vetria-qa` e `vetria-ui`.
>
> **Gravidade:** 🔴 crítico (para a fila) · 🟠 alto (entra na semana) · 🟡 médio (entra na fase) · ⚪ baixo (backlog)

---

## 🔴 ABERTOS — CRÍTICOS

### R-001 — `middleware.ts` não isola painel por role
- **Descoberto:** 26/08/2026, na auditoria de abertura
- **Onde:** `middleware.ts:36-52`
- **O quê:** o middleware só checa duas coisas: se `/app` ou `/admin` exige login, e se `/admin` exige `role === "admin"`. **Não há nenhuma checagem de role entre os painéis.** Um usuário com role `tutor`, logado, que digite `/app/veterinario/perfil` passa pelo middleware.
- **O que segura hoje:** `lib/auth/painel.ts` (`requirePainel`) faz o guard página a página no route group `(painel)`. Funciona — mas é defesa em profundidade dependendo de o desenvolvedor lembrar de chamar em toda página nova. Uma página esquecida = vazamento.
- **Por que importa mais a partir de agora:** hoje as telas são casca e não mostram dado de ninguém. A partir da F3 elas mostram CRMV, CNPJ e documento. O custo do furo muda de categoria.
- **Contradiz:** `VETRIA_PROJETO.md` §3 — "multi-persona com isolamento total, sem acesso cruzado".
- **Corrige em:** F3 / S3 (reescrita do middleware)
- **Task:** a criar na S3

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
  1. **Código morto que ensina errado:** `app/app/layout.tsx:23` tem `NAV_BY_ROLE["master"]`, inalcançável. Quem ler acredita que `master` é role. 🟡
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

### R-003 — Zero testes automatizados em código que já está em produção
- **O quê:** ~45 telas, auth real, RBAC, e nenhuma verificação automática. Nas próximas 12 semanas o banco inteiro entra por baixo dessas telas.
- **Corrige em:** F3 / **S2** — T-003. **Escorregou da S1 sem ninguém decidir que escorregaria**, que é a forma mais comum de dívida crescer. Se escorregar de novo, o item 5 do DoD da F3 fica sem chance de fechar em quatro semanas.

### R-004 — `dangerouslyAllowSVG: true` no `next.config.ts`
- **O quê:** necessário pra logo SVG renderizar via `next/image` (DL-040). Está mitigado por CSP sandbox. Vira risco real se algum dia entrar SVG enviado por usuário (foto de perfil, documento).
- **Regra:** **nunca** servir SVG de origem de usuário por `next/image`. Upload de imagem de usuário aceita só raster (jpg/png/webp).
- **Corrige em:** F3 / S2 — **T-008**, como validação de MIME no upload. O CHECK de `documento_path` já barra `.svg` no banco (SEC-026); falta barrar no servidor, antes de o arquivo existir.

---

## 🟡 ABERTOS — MÉDIOS

> **R-026 a R-031 nasceram da 2ª auditoria da `0003`**
> (`docs/relatorios/SEC-2026-08-26-0003-v2.md`, 26/08). Nenhum é vazamento e nenhum bloqueou a
> aplicação, que aconteceu no mesmo dia. **Nenhum deles é sobre o estado do banco: os seis são
> sobre o ARQUIVO**, e é por isso que continuam abertos depois de a migration ter rodado verde.
> ✅ **O R-026 fechou em 31/08** (medição feita, `42` apareceu) e **o R-031 foi decidido em 31/08**
> (DL-055), mas só fecha quando o texto do passo 8 entrar na `0003`. **Restam quatro do grupo.**
> Cada um registra abaixo o que a aplicação mediu, e por que o achado sobrevive à medição.
> **O que eles protegem é a `0004`**, que vai copiar este arquivo como modelo.

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
- ⚠️ **Não existe card de `/api/admin/set-access` hoje.** Este item precisa entrar no **primeiro card que tocar essa rota** — o candidato natural é a reescrita de RBAC e middleware da S3 (ver R-001 e R-002). Enquanto esse card não existir, **este risco é o único lugar onde a regra está escrita.**

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

### R-023 — Excluir a conta apaga a linha e deixa o documento de identidade no bucket (SEC-039)
- **Descoberto:** 26/08/2026, auditoria da `0003`
- **O quê:** `perfil_privado.id` tem `on delete cascade` pra `profiles`, então apagar a conta derruba a linha e o `documento_path`. **O objeto no bucket não é tocado por cascade nenhum** — `storage` é outro serviço. Sem policy, só `service_role` apaga, ou seja: alguém precisa escrever código, e não há card que peça.
- **Por que importa:** RG, CNH e comprovante de CRMV de quem pediu exclusão continuam no projeto, agora **órfãos**, sem nem a linha que dizia de quem eram. LGPD art. 18 VI atendido pela metade, e a metade que fica é a mais sensível.
- **Onde entra:** card da exclusão de dados da **F6**, e citado no card da **T-008**, que é onde a convenção de caminho (`<uuid>/`) é fixada e é ela que torna a varredura possível. Não vira card agora.
- **26/08 — o bucket existe e está VAZIO** (Sonda 1: zero objetos). É a janela mais barata que vai existir para escrever a rotina: hoje não há documento de gente real para ficar órfão.

### R-024 — O CNPJ do estabelecimento viaja no `raw_user_meta_data` e no JWT (SEC-042)
- **Descoberto:** 26/08/2026, auditoria da `0003`. **Confirmado no código.**
- **Onde:** `app/cadastro/estabelecimento/page.tsx:47` manda `cnpj` no `data` do `signUp`. `handle_new_user` ignora o campo, que fica gravado pra sempre em `auth.users.raw_user_meta_data`.
- **Três problemas:** (1) cópia não classificada num lugar que nenhum documento menciona e nenhuma policy governa, no exato momento em que a `0003` decide por escrito que CNPJ é privado; (2) é **dado não confiável** (escrito pelo cliente, reescrevível por `auth.updateUser`), e o risco é alguém na T-007 achar que "o CNPJ já está no metadata" e economizar o campo; (3) **viaja no JWT** — o Supabase inclui `user_metadata` nas claims —, indo pro storage do navegador e pra todo header `Authorization`.
- **LGPD:** a rotina de exportação e exclusão da F6 vai ser escrita olhando `profiles` e `perfil_privado`. Essa cópia escapa das duas, e o defeito é invisível pra quem escrever a rotina.
- **É o único outlier dos três funis:** `app/cadastro/veterinario/page.tsx:46` e `app/cadastro/responsavel/page.tsx:50` mandam só `full_name`, `cidade` e `role`. O custo de alinhar é apagar uma palavra.
- **Bônus, que não é segurança:** `full_name` está recebendo o **nome fantasia**, que não é nome de pessoa, e vai aparecer em saudação e em email como se fosse.
- **Corrige em:** F3/S2, junto com a T-007 (mesmo arquivo, mesmo funil). Não vira card próprio.

### R-032 — Endereço e CEP continuam públicos, e ninguém decidiu se deviam (SEC-041 item 1)
- **Descoberto:** 26/08/2026, nas duas auditorias da `0003`. **Sobrevive ao fechamento do R-018**, que fechou a parte que era vazamento.
- **O quê:** a `0003` desceu `razao_social` para `perfil_privado` com um argumento explícito: **em MEI e firma individual, a razão social carrega o nome civil do dono**. **O mesmo argumento se aplica a `endereco` e a `cep`** — no MEI e no profissional que atende em casa, o endereço comercial **é** o residencial, e **nada no schema, no formulário ou no consentimento distingue os dois casos.** Os dois campos ficaram públicos, agora por `comment on column` que diz, com todas as letras, que a pergunta não foi respondida.
- **A segunda metade, no mesmo tema, em outro par de colunas:** a `0003` **não** alargou a revalidação de `vet_profiles` (`cidade`, `estado`, `bairro`), argumentando que isso tiraria da busca todo profissional que corrigisse o bairro. **Esse custo é idêntico ao do estabelecimento que corrige um CEP digitado errado, e foi aceito por escrito duas telas antes.** A Sonda 10B mediu a assimetria em produção e ela é real: **o estabelecimento que muda de cidade volta para a fila; o veterinário não.**
- **Não é bug e não bloqueia nada hoje:** não existe perfil público e nenhum estabelecimento está `active`. É decisão de produto sem dono.
- **A pergunta, em uma frase:** ou o custo de revalidar endereço é aceitável e vale para os dois, ou não é e não vale para nenhum. E, antes disso: endereço de quem atende em casa é vitrine ou é dado pessoal?
- **Prazo:** resposta escrita em `05-DECISOES.md` **antes do perfil público da F4/S7**, que é quando o dado de fato aparece numa página. 🟡
- **Registrado em:** DL-053 e nos `comment on column` de `clinic_profiles.endereco` e `clinic_profiles.cep`.

### R-033 — O teste de persistência do onboarding precisa de conta nova a cada rodada, e não há lugar limpo pra criá-la
- **Descoberto:** 28/08/2026, escrevendo a T-003.
- **O quê:** o 2º teste que o card da T-003 pede — **cadastro de vet → onboarding preenchido → sair e voltar → o dado está lá** — é a única prova automatizada do **item 1 do DoD da F3**. Ele precisa de **conta `vet` nova a cada rodada**, porque `concluir_onboarding_profissional()` só sai de `incomplete` uma vez: rodando duas vezes na mesma conta, a segunda mede outra coisa. E o próprio card da T-003 proíbe **criar usuário de teste em produção sem combinar como ele é limpo depois**.
- **As duas saídas, e por que nenhuma é óbvia:**
  - **(a) a suíte cria e apaga a conta com `service_role`.** Barato de montar e resolve hoje. Mas coloca **dentro do CI a chave que ignora a RLS inteira** — exatamente o que o `ci.yml` diz, por escrito, que nunca vai acontecer. Workflow comprometido com ela na mão lê a base de todo mundo, e o GitHub Actions roda em PR de fora do repositório.
  - **(b) um projeto Supabase separado, só pra teste.** É a resposta certa a longo prazo e a única que deixa o teste rodar sem chegar perto de dado real. Custa setup e passa a ter **um segundo schema pra manter em sincronia com as migrations** — e o R-006 (produção com schema que o repo não descreve) acabou de ser fechado com esforço.
- **Enquanto não decide:** o teste **não foi escrito**, e isso está dito no card da T-003, no Resultado, ponto 4. **Não há teste falso no lugar dele.** A prova do item 1 do DoD continua sendo **manual**, feita à mão na T-006.
- **Por que isso vence antes do que parece:** a T-007 clona a T-006 no estabelecimento e a T-008 escreve arquivo em bucket. **As três são exatamente o tipo de mudança que E2E pega e revisão humana não**, e nenhuma delas vai ter cobertura enquanto isto estiver aberto.
- **Prazo:** resposta antes do fim da F3, que é quando o item 5 do DoD ("testes automáticos dos fluxos críticos") é cobrado. 🟡

### R-034 — A auditoria da T-006 existe só nos comentários do código, e dois achados não têm dono
- **Descoberto:** 31/08/2026, ao reabrir o projeto e conferir a árvore de trabalho contra os docs.
- **O quê:** `app/app/veterinario/onboarding/actions.ts` e `page.tsx` dizem, com todas as
  letras, que foram corrigidos contra **SEC-052, SEC-054, SEC-056, SEC-057 e SEC-058**. Os cinco
  números **não existiam em lugar nenhum do repositório**: nem em `docs/relatorios/`, nem aqui,
  nem em `05-DECISOES.md`. A auditoria aconteceu na sessão de 28/08 e **o relatório nunca foi
  escrito em disco**; a sessão terminou com o código na árvore, sem commit, e o raciocínio dos
  achados morreu com ela.
- **O que foi feito em 31/08:** `docs/relatorios/SEC-2026-08-28-T006.md`, **reconstruído a
  partir dos comentários do código**, arquivo e linha por achado. O cabeçalho dele diz que é
  reconstrução, e não auditoria.
- ⚠️ **O que a reconstrução NÃO alcança, e é o risco de verdade:**
  - **SEC-053 e SEC-055 não aparecem em lugar nenhum.** A numeração vai de 052 a 058 e só cinco
    foram citados. Ou foram achados de outro arquivo corrigidos sem comentário, ou foram
    descartados na própria auditoria e a numeração ficou com o buraco, **ou são reais e não
    foram corrigidos**. A terceira é improvável e não é descartável.
  - **O relatório prova o que foi corrigido, não que a lista está completa.** Ele foi extraído
    do que o autor do código escreveu sobre o próprio código, que é exatamente o ponto cego que
    uma auditoria existe para cobrir.
- **Por que isso vence rápido:** **a T-007 clona o `actions.ts` da T-006** e a T-008 escreve
  arquivo em bucket a partir do mesmo padrão. Clonar um arquivo cuja revisão não tem registro
  independente é como o R-017 nasceu duplicado.
- **A regra que isso quebrou, e que é a mais barata de reparar:** `AGENTES.md` §"Como os achados
  circulam" manda todo achado ir para `docs/relatorios/` **e** para este arquivo. **Nenhum dos
  dois aconteceu**, e o motivo foi que a task terminou sem commit. **Task sem handoff escrito
  não está concluída** já estava no `CLAUDE.md`; o que faltava era alguém aplicar a regra ao
  fim da sessão, não ao fim da task.
- **Correção:** `vetria-seguranca` revisa `app/app/veterinario/onboarding/` **contra a matriz de
  `06-PERMISSOES.md`**, e não contra os comentários — de preferência **antes da T-007 começar**,
  porque é ela que herda o arquivo. Se a revisão nova não achar nada além dos cinco, o buraco
  do 053/055 fica fechado por cobertura, e não por memória.
- **Prazo:** antes da T-007. 🟡

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
- **Foto de perfil com upload.** Precisa de um segundo bucket, público, com regra própria de moderação de imagem. Não é requisito de E1 a E6. Volta como decisão na F4/S7, quando o perfil público existir e a falta dela custar conversão. Ver R-019.

---

## ✅ FECHADOS

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
