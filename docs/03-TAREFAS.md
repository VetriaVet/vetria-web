# 03 — QUADRO DE TAREFAS

> Fila viva. **Uma task em execução por vez** no que escreve código.
> Atualizado por quem executa, no início e no fim de cada task.
>
> **Semana atual:** **S2 aberta em 26/08** · **Anterior:** S1 ✅ fechada em 26/08 (5 de 6) · **Fase:** F3
>
> **Ordem de execução da S2:** **T-002** (🔴 presencial, **agendar já** — a `0003` v2 está
> aprovada e só espera a sessão) → T-006 → T-007 → T-008.
> **T-013 é medição de dez segundos e vem antes da T-002.**
> **T-003 corre em paralelo do primeiro dia**, porque `vetria-qa` não disputa arquivo com ninguém.
>
> ✅ **A `0003` v2 foi APROVADA pela auditoria em 26/08**, com dois pré-checks de dez segundos.
> Relatório: `docs/relatorios/SEC-2026-08-26-0003-v2.md` (SEC-046 a SEC-051).
> **T-009 a T-012 fecharam.** O único card novo é a **T-013** (SEC-046).

---

## LEGENDA

**Nível de autonomia** (herdado do `HANDOFF.md`, regra do projeto):
- 🟢 **VERDE** — commit direto com build verde. Visual, copy, docs, assets. Máx. 3 arquivos.
- 🟡 **AMARELO** — mostra o diff e espera aprovação. `lib/`, `middleware.ts`, `/api/*`, config, `components/`, dependência nova, >3 arquivos.
- 🔴 **VERMELHO** — só com Elber presente. Migration, RLS, lógica de auth, `.env`, Stripe, qualquer coisa destrutiva.
- 🟠 **LARANJA** — escopo ambíguo: pergunta antes de começar.

**Estado:** `⬜ fila` · `🔵 em execução` · `⏸️ bloqueada` · `✅ concluída` · `🚫 cancelada`

---

## FORMATO DO CARD (copiar ao criar task nova)

```
### T-NNN — <título curto e imperativo>
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S1
- **Capacidade:** E1   ← obrigatório. Sem E1–E6, a task não entra na fila.
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** T-000 (ou "nada")
- **Por quê:** 1 frase. O que quebra ou falta se isso não for feito.
- **Feito quando:**
  - [ ] critério verificável 1
  - [ ] critério verificável 2
- **Não fazer:** o que está fora desta task e é tentador fazer junto
- **Resultado:** _(preenchido no fim: commit, o que mudou, o que se descobriu)_
```

---

# 🔵 EM EXECUÇÃO

_(vazio)_

---

# ⬜ FILA — F3 / S2

> **Semana aberta em 26/08/2026 pelo `vetria-maestro`.** 5 cards, na ordem de execução abaixo.
> **Mais 4 em 26/08, vindos da auditoria da `0003`** (T-009 a T-012) — **os quatro fecharam no
> mesmo dia**, com a `0003` v2. **Mais 1 da segunda rodada** (T-013, SEC-046). **6 na fila.**
>
> **O que mudou em relação ao `01-PLANO.md` §S2, e por quê:**
> - **T-002 e T-003 escorregaram da S1** e abrem a S2. A T-002 continua 🔴: **sem sessão presencial com o Elber ela não anda, e a T-008 não existe sem ela.**
> - **Onboarding do responsável saiu da S2 e vai pra S3**, junto com os editores de perfil. Motivo: os itens 1 a 4 do Definition of Done da F3 são todos do caminho do **profissional**; o responsável não tem nenhum item de DoD. Com uma 🔴 herdada da semana anterior dentro da fila, a S2 protege o caminho crítico primeiro.
> - **Foto de perfil (vet) e horários (estabelecimento) não entram na S2.** O plano prometeu os dois, mas não existe nem campo no formulário nem coluna no banco para nenhum deles, e criar coluna é migration (🔴). Ver **R-019**. Nenhum dos dois está no `00-ESCOPO.md` §2, então não é corte de escopo contratado.

### T-002 — Bucket de documentos no Storage
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S2 _(escorregou da S1)_
- **Capacidade:** E1
- **Nível:** 🔴 presencial — **precisa de sessão presencial com o Elber, agende**
- **Agente dono:** vetria-backend + Elber
- **Depende de:** T-001 ✅
- **Por quê:** validação de CRMV é manual pelo admin (V1) e precisa do documento em algum lugar seguro. Enquanto não existir bucket, a T-008 não existe e o item 3 do DoD da F3 (admin aprova) não tem o que olhar.
- **Feito quando:**
  - [ ] Bucket `documentos` criado, **privado**
  - [ ] **Sem policy alguma** em `storage.objects`. O acesso é mediado pelo servidor (`service_role`), e a autorização por dono/admin vive na rota da T-008. ⚠️ **Este critério foi reescrito em 26/08.** Ele pedia "policy: o dono lê e escreve no próprio prefixo `<uuid>/`", e essa linha foi **superada pela decisão de zero policy** tomada na sessão da própria T-002. Nunca poderia ser marcada com honestidade depois disso: não existe policy pra conferir
  - [ ] **Provado que zero policy é zero** (SEC-034): `select policyname, cmd, roles, qual, with_check from pg_policies where schemaname='storage' and tablename='objects';` tem que vir **vazio**, e o pré-voo da migration tem que abortar em qualquer linha, não só nas que citam a string `documentos`
  - [ ] Acesso por URL assinada com expiração curta, nunca por URL pública
  - [ ] Limite de tamanho e whitelist de MIME (`pdf`, `jpg`, `jpeg`, `png`, `webp`) definidos e registrados em `05-DECISOES.md`
  - [ ] **Regra do nome do arquivo documentada** (SEC-028): o nome é **gerado pelo servidor**, minúsculo, sem acento e sem espaço, no formato que o CHECK de `perfil_privado.documento_path` exige: `^<uuid>/[A-Za-z0-9_-]{1,120}\.(pdf|jpg|jpeg|png|webp)$`. Hoje isso não está escrito em lugar nenhum, e quem for fazer a T-008 vai errar sem saber por quê
  - [ ] Confirmado no banco que o trigger `trg_perfil_privado_carimbo` cobre INSERT e UPDATE (correção SEC-028 da v5)
- **Aproveite a sessão aberta (custo marginal quase zero):** decidir a **SEC-020 / R-018** — `clinic_profiles` publica `cnpj`, `razao_social`, `responsavel_tecnico`, `endereco` e `cep` para `anon` em toda linha `active`. Ou essas colunas são vitrine por decisão registrada, ou descem para `perfil_privado`, e descer é migration. **Decidir agora evita uma terceira sessão presencial antes da F4.**
- **Não fazer:** não subir documento nenhum (isso é a T-008). Não criar bucket público de foto de perfil (R-019, fora da S2). Não mexer em RLS de tabela nesta sessão além do que a SEC-020 exigir, e só se houver decisão.
- **Resultado (parcial — 26/08/2026, `vetria-backend`): SQL ESCRITO, NADA APLICADO.**
  - Entregues, **sem commit**: `supabase/migrations/0003_storage_documentos.sql` e `supabase/verificar-apos-0003.sql` (14 sondas). O `supabase/backup-antes-da-0003.sql` já existia.
  - **Decisões do Elber nesta sessão, embutidas no arquivo:** (a) o bucket não tem policy nenhuma em `storage.objects` — só `service_role` alcança, e o caminho é gerado no servidor por URL assinada; (b) 10 MiB e quatro MIME; (c) `razao_social`, `cnpj` e `responsavel_tecnico` descem para `perfil_privado`, e `endereco`/`cep`/`cidade`/`estado` **continuam públicos**, agora por `comment on column`, não por omissão. Fecha SEC-020 e R-018.
  - **Consequência que a T-008 herda:** o dono deixa de ler o próprio documento direto do Storage. A autorização vira rota de servidor. Está escrita na seção 2.b da migration.
  - **⚠️ O card da T-007 ficou errado:** ele manda gravar `razao_social`, `cnpj` e `responsavel_tecnico` em `clinic_profiles`. Depois da 0003 os três vivem em `perfil_privado`. **Corrigir o card antes de a T-007 começar.**
  - **Falta:** corrigir os bloqueantes da auditoria → sessão presencial com o Elber → aplicar → rodar as sondas → registrar DL no `05-DECISOES.md` (limite/MIME e SEC-020) → anotar a data no `migrations/README.md`. Enquanto isso, a T-008 continua ⏸️.
- **Resultado (auditoria — 26/08/2026, `vetria-seguranca`): 🔴 REPROVADA para aplicação.**
  - Relatório: **`docs/relatorios/SEC-2026-08-26-0003.md`**. 13 achados, **SEC-033 a SEC-045**: quatro 🟠, nove 🟡, nenhum 🔴. Base: commit `2138fe1`.
  - **Reprova estreita, e o motivo importa: não é o SQL de dado que está errado.** A ordem de execução, a cópia, a varredura de dependência e a reversão foram percorridas contra o schema real e estão corretas. A reversão restaura a função linha a linha, ou seja **a armadilha da SEC-024 não se repetiu**. O DROP é seguro por três caminhos independentes, um deles verificado no código: **nenhum arquivo `.ts`/`.tsx` lê `razao_social`, `cnpj` ou `responsavel_tecnico` de `clinic_profiles`**.
  - **O que reprova são salvaguardas que não fazem o que o comentário diz que fazem** — o padrão do R-016, o mesmo que reprovou a `0002` duas vezes.
  - **Os quatro bloqueantes, em ordem:** (1) **SEC-034**, o pré-voo tem que exigir zero policy em `storage.objects` sem filtrar por string, e a Sonda 2 para de se desqualificar; (2) **SEC-035**, a Sonda 10 devolve result set em vez de `raise notice`, e o `raise warning` do pré-voo 1.2 vira `raise exception`; (3) **SEC-033 e SEC-036**, decisão de arquitetura de upload registrada em `05-DECISOES.md` **antes de o bucket existir**; (4) **SEC-045**, pré-voo que aborte se o bucket já existir em vez de reconciliar em silêncio.
  - **Entram junto, custam quase nada:** SEC-041 (`endereco`, `cep`, `cidade` e `estado` no ramo `clinic_profiles` do trigger), SEC-037 (asserção de `md5(prosrc)` e a 1.5 varrendo todos os schemas), `notify pgrst, 'reload schema';` no fim da migration, e SEC-040 (registrar em `audit_logs` quando o admin abre documento de terceiro — uma linha no card da T-008).
  - **⚠️ Duas consultas de 10 segundos, no dashboard, ANTES da sessão presencial.** Elas decidem se dois dos quatro bloqueantes existem: `select policyname, cmd, roles, qual, with_check from pg_policies where schemaname='storage' and tablename='objects';` (tem que vir vazio) e `do $$ begin raise notice 'teste de notice'; end $$;` (o texto tem que aparecer no editor).
  - **Achados que viraram card:** T-009 (SEC-033), T-010 (SEC-034), T-011 (SEC-035), T-012 (SEC-036). **Viraram risco:** R-020 a R-025.
  - **A `0003` não precisa ser reescrita.** Tudo cabe no arquivo que existe: duas linhas de asserção, um bloco `do`, uma sonda reformulada e duas decisões escritas.
- **Resultado (2ª auditoria, da v2 — 26/08/2026, `vetria-seguranca`): ✅ APROVADA para aplicação, com dois pré-checks de dez segundos.**
  - Relatório: **`docs/relatorios/SEC-2026-08-26-0003-v2.md`**. **6 achados novos, SEC-046 a SEC-051: um 🟠, cinco 🟡, nenhum 🔴.** Base: commit `7ce2518`. A migration continua **não aplicada**.
  - **Os quatro bloqueantes da v1 estão fechados com prova.** A v2 acrescentou **785 linhas** (810 → 1598) e o arquivo de verificação foi de 14 para **18 sondas** (934 linhas), **sem introduzir um único erro de SQL**. **Nada piorou** em relação à v1.
  - **Nenhum dos seis achados novos exige mexer no SQL antes de aplicar, e nenhum é vazamento.**
  - **As seis medições de produção que sustentam o veredito** (colhidas entre as duas rodadas): `pg_policies` em `storage.objects` **vazio**; `storage.buckets` **vazio**; `rolbypassrls` = `service_role` true, `postgres` true, `anon` false, `authenticated` false; `md5(prosrc)` de `revalidar_ao_mudar_dado_sensivel` = `035f8c64c139f2b6e1865341b4995fb7` **com o corpo lido linha a linha contra a `0002`**; o teste de NOTICE **não imprimiu o texto** (SEC-035 confirmada); QUERY 0 do backup com todas as tabelas em 0 e **18 contas / 18 profiles**.
  - **O 🟠 é a T-013** (SEC-046): três sondas (3, 7C e 9) terminam em `rollback` **depois** do `select` que carrega o veredito. Não impede aplicar; **impede declarar verificado**.
  - **Os cinco 🟡 viraram R-027 a R-031** e estão anotados nos cards que os herdam: SEC-049 (guarda da SEC-044 trava a linha depois de troca de role) e SEC-051 (o passo 8 da rota tem que gravar com a **sessão do usuário**, senão `actor_id` sai nulo em `audit_logs`) foram levados para os cards que tocam `/api/admin/set-access` e para a **T-008**.
  - **Uma discordância do autor foi julgada a favor dele e contra o auditor:** derivar o hash do pré-voo 1.7 **de produção** e não do repo está certo; a remediação escrita na SEC-037 estava mal formulada. O que sobra é a SEC-050, e é outra coisa.
  - ⚠️ **ORDEM DE APLICAÇÃO — siga esta, nesta sequência:**
    1. **As três consultas de dez segundos**, antes de agendar: (a) `begin; select 42 as prova; rollback;` (decide a SEC-046 / T-013); (b) `select relname, relrowsecurity from pg_class where relnamespace = 'storage'::regnamespace and relname in ('objects','buckets');` — **as duas têm que vir `true`** (decide a SEC-047 e evita perder a sessão); (c) `select role, count(*) from public.profiles group by role;` — **sem conta `clinic` E conta `vet`, cinco sondas se declaram inválidas** e a verificação não prova nada.
    2. `select md5(prosrc) from pg_proc where proname = 'carimbar_envio_documento';` — **e LER o corpo contra `0002_nucleo.sql:453-470`**, não contra a seção 6.b da `0003` (SEC-050). Colar o hash na constante do pré-voo 1.7.
    3. **`supabase/backup-antes-da-0003.sql` inteiro**, exportando os CSV.
    4. **Colar a migration de uma vez** e **ler a tabela de onze colunas** que ela devolve depois do `commit`: **toda coluna `true`**, `copia_linhas = 0`. **Anotar a linha inteira neste card** — os dois `md5` novos são o que a `0004` vai precisar no pré-voo dela.
    5. **Só então as sondas**, uma por vez, **começando pela 4**.

### T-013 — Medir se o editor renderiza `select` que não é o último comando, e só então mexer nas três sondas
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟢 pra medir (é um `select` de leitura, em rollback) · 🟡 se a correção das sondas for necessária
- **Agente dono:** vetria-backend
- **Depende de:** nada. **Vem antes da T-002.**
- **Por quê:** SEC-046. As sondas 3, 7C e 9 do `verificar-apos-0003.sql` terminam em `rollback;` **depois** do `select` que carrega o veredito. O próprio arquivo declara, em `:49-50`, que "o editor do Supabase mostra só o resultado da última query" — e usa esse modelo para justificar o select pós-`commit` da migration. Sob o mesmo modelo, o último comando dessas três é `rollback`, que não devolve linha, e o veredito some. **É a SEC-035 com o canal trocado, e nasceu dentro da correção da SEC-038.** A Sonda 3 é a pior das três: sucesso é `0`, falha é qualquer número maior, e os dois casos são "Success" com o mesmo aspecto.
- **Feito quando:**
  - [ ] Rodado no dashboard e o resultado colado neste card: `begin; select 42 as prova; rollback;`
  - [ ] **Se `42` aparecer:** o achado cai inteiro. Muda **uma frase** do cabeçalho do arquivo de verificação, dizendo que `select` dentro de transação revertida aparece sim. Fim do card
  - [ ] **Se `42` não aparecer:** as sondas 3, 7C e 9 adotam o padrão que as 10, 10B e 13B já usam (tabela temporária + `select` como último comando, fora de transação), com a troca de papel saindo por `perform set_config('role','anon',true)` em vez de `set local role`
- **Não fazer:** ⚠️ **não mexer nas três sondas antes de medir.** Reescrever sonda que já funciona é como se fabrica achado na rodada seguinte (R-016). Não tocar nas 7A e 7B: elas esperam **erro** como sucesso, e erro aparece em vermelho. Não tocar nas 10, 10B e 13B: o padrão delas está certo.
- **Resultado:** _(preencher)_

> ### ✅ T-009 a T-012 nasceram da auditoria da `0003` e **fecharam em 26/08**
>
> A v1 foi reprovada (`docs/relatorios/SEC-2026-08-26-0003.md`, SEC-033 a SEC-045); os quatro
> cards eram os bloqueantes do veredito. A **v2** os fechou e foi **aprovada**
> (`docs/relatorios/SEC-2026-08-26-0003-v2.md`). Os quatro cards estão em **✅ CONCLUÍDAS**,
> com o Resultado preenchido.

### T-006 — Onboarding do veterinário passa a persistir
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S2
- **Capacidade:** E2
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** T-001 ✅ (não depende da T-002)
- **Por quê:** hoje o botão "Concluir" de `app/app/veterinario/onboarding/page.tsx` só faz `update profiles set onboarding_completed = true` e **joga fora tudo que o profissional digitou nos 4 passos**. Ninguém entra na fila de validação, porque `status` continua `incomplete`. É o item 1 do DoD da F3 e é a espinha da semana: a T-007 é o mesmo padrão aplicado de novo.
- **Feito quando:**
  - [ ] Server Action grava em `vet_profiles` (`nome_exibicao`, `titulo`, `crmv`, `crmv_uf`, `especialidades`, `experiencia`, `bio`, `cidade`, `estado`, `bairro`, `atende_presencial`, `atende_domiciliar`, `atende_teleorientacao`) na linha do próprio `auth.uid()`
  - [ ] **WhatsApp vai para `perfil_privado`, nunca para `vet_profiles`** (SEC-002). Telefone em tabela de leitura pública entrega a base inteira pela API anônima
  - [ ] A conclusão chama `concluir_onboarding_profissional()` por RPC. O `status` vira `pending_validation` **no servidor**. O cliente não escreve `status` em hipótese nenhuma: a policy levanta exceção, e é assim que tem que ser
  - [ ] **Prova de persistência:** cadastro novo de vet → preencher os 4 passos → sair, deslogar, voltar → os dados estão no banco (conferir com `select` real, não pela tela)
  - [ ] Erro do banco vira mensagem legível na tela. Hoje o caminho de erro é `redirect("...?error=1")` e a tela não mostra nada
  - [ ] Nenhum `redirect()` dentro de `try/catch` (DL-016)
  - [ ] Se o perfil já estiver `active`, a Action **relê `profiles.status` depois de salvar**: o trigger de revalidação (SEC-016/023) devolve o perfil para `pending_validation` quando CRMV ou documento mudam, e a resposta do update **não diz nada sobre isso**. Sem a releitura, a tela mente para um profissional que acabou de sair do ar
- **Não fazer:** não escrever `slug` (é pinado pela RLS e a regra só nasce na F4/S5). Não fazer upload de arquivo (T-008). Não tocar em `middleware.ts` nem no portão de status (S3). Não mexer no formulário do estabelecimento (T-007). Não inventar campo que a tabela não tem.

### T-007 — Onboarding do estabelecimento passa a persistir
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S2
- **Capacidade:** E2
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** **T-002 aplicada** (as três colunas de identificação só existem em `perfil_privado` depois da `0003`) e T-006 — **e do handoff dela, não só do commit.** O formulário do estabelecimento é clone do de veterinário (foi assim que o R-017 nasceu duplicado); clonar antes de a T-006 ser revisada duplica o defeito junto
- **Por quê:** mesmo buraco da T-006, no outro painel. Sem isso, metade dos profissionais que a Vetria vende não chega na fila de validação.
- **⚠️ Este card foi corrigido em 26/08.** Ele mandava gravar `razao_social`, `cnpj` e `responsavel_tecnico` em `clinic_profiles`. **Depois da `0003` esses três vivem em `perfil_privado`**, e o insert antigo falharia com `column "cnpj" of relation "clinic_profiles" does not exist`. **Enquanto a `0003` não for aplicada, esta task não começa:** escrever pro schema novo antes de ele existir quebra igual, só que na outra direção.
- **Feito quando:**
  - [ ] Server Action grava em `clinic_profiles` **só o que é público**: `nome_fantasia`, `endereco`, `cep`, `cidade`, `estado`, `sobre`, `servicos`, `site`
  - [ ] **`razao_social`, `cnpj` e `responsavel_tecnico` vão pra `perfil_privado`**, na linha do próprio `auth.uid()` (`0003`, SEC-020 / R-018). Nunca em tabela de leitura pública
  - [ ] **Nada de CNPJ no `signUp`.** Tirar o campo `cnpj` do `data` em `app/cadastro/estabelecimento/page.tsx:47`: hoje ele fica pra sempre em `auth.users.raw_user_meta_data` e viaja no JWT, fora do alcance da rotina de exportação e exclusão da F6 (SEC-042 / R-024). Os funis de veterinário e de responsável não mandam identificador nenhum, e este é o único outlier
  - [ ] WhatsApp em `perfil_privado`, mesma regra da T-006
  - [ ] Conclusão pela mesma RPC `concluir_onboarding_profissional()`
  - [ ] Prova de persistência igual à da T-006, com conta de estabelecimento nova
  - [ ] Mesmo tratamento de erro e mesma releitura de `status`
- **Não fazer:** horários não entram (não existe campo no formulário nem coluna na tabela, ver R-019). Não exibir CNPJ, razão social ou nome do responsável técnico em nada público enquanto a SEC-020 / R-018 não tiver decisão registrada. Não construir perfil público (F4/S7).

### T-008 — Upload do documento de validação
- **Estado:** ⏸️ bloqueada por T-002
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** **T-002** (sem bucket não há upload) e T-006
- **Por quê:** o passo 4 do onboarding pede o documento do CRMV e hoje só mostra um aviso. Sem documento no Storage, o admin da S4 não tem o que abrir e o item 3 do DoD da F3 não fecha.
- **Feito quando:**
  - [ ] Upload passa **pelo servidor**, não do navegador direto pro bucket
  - [ ] Nome do arquivo **gerado pelo servidor**, no formato que o CHECK exige (ver T-002). Nome escolhido pelo usuário não chega ao caminho
  - [ ] Validação de MIME por whitelist (`pdf`, `jpg`, `jpeg`, `png`, `webp`) **e** de tamanho, no servidor. **SVG e HTML barrados** (R-004: o admin abre esse arquivo dentro do painel de maior privilégio do sistema)
  - [ ] `perfil_privado.documento_path` escrito pelo dono; `documento_enviado_em` carimbado pelo trigger, **nunca pelo cliente**
  - [ ] Nenhuma URL pública em lugar nenhum: só URL assinada, e só para o dono e o admin
  - [ ] Falha de upload **impede** a conclusão. O profissional não pode sair achando que enviou o documento quando não enviou
- **Herdado da auditoria da `0003` (26/08). Leia antes de começar:**
  - ✅ **SEC-036 decidida em 26/08 (T-012): o upload passa por Route Handler nosso.** Nada de `createSignedUploadUrl`, nenhum token de escrita no cliente. O critério de MIME acima passa a ser entregável, e ele é por **assinatura mágica dos primeiros bytes**, nunca pelo `content-type` declarado nem pela extensão do nome: `%PDF-` / `FF D8 FF` / `89 50 4E 47 0D 0A 1A 0A` / `RIFF`…`WEBP`. A extensão do caminho é derivada do tipo detectado. O contrato completo, oito passos, está na seção 2.b da `0003`: leia antes de escrever a rota.
  - [ ] **A rota grava `documento_path`, `documento_hash` (sha256 hex dos bytes que ela mesma escreveu) e `documento_tamanho` num único UPDATE** (SEC-033 / T-009). O CHECK `perfil_privado_documento_completo` recusa dois de três, e é de propósito: documento sem identidade dos bytes não é estado válido.
  - [ ] **A rota nunca reemite URL de upload pra caminho que já existe** (SEC-033 / T-009). Trocar os bytes sem trocar a string deixa um perfil aprovado exibindo documento que ninguém conferiu
  - [ ] ⚠️ **O passo 8 grava a linha com a SESSÃO DO USUÁRIO, não com `service_role`** (SEC-051 / R-031, 2ª auditoria de 26/08). **Recomendação da auditoria; confirmar com o Elber na sessão da T-002, porque muda o contrato da seção 2.b.** O contrato da seção 2.b diz "escrever no bucket com `service_role`" no passo 7 e **não diz nada** no passo 8. Com `service_role`, `auth.uid()` é nulo e o `insert into audit_logs` do trigger de revalidação grava **`actor_id = null`**: a trilha diz que o perfil voltou pra fila e não diz quem mexeu. **O desenho antigo, de URL assinada, gravava com a sessão do usuário e o `actor_id` saía certo — a arquitetura nova apagou um dado da trilha sem ninguém decidir isso.** Com a sessão, o `actor_id` sai certo e a policy `perfil_privado_update_own` vira segunda porta de graça. **Só o passo 7 (o bucket) precisa de `service_role`.** ⚠️ Não confundir com a gravação de `documento_visualizado` do item acima: **aquela** sai por `service_role`, porque `authenticated` não tem INSERT em `audit_logs`
  - [ ] **Registrar em `audit_logs` (`acao = 'documento_visualizado'`, `alvo_id` = dono do documento) antes de devolver a URL assinada** (SEC-040). ⚠️ Grave com `service_role`: a `0002` revogou INSERT em `audit_logs` de `authenticated` (seção 11b), então gravar com a sessão do admin devolve `permission denied` e a trilha some junto com o erro. Os quatro passos da seção 2.b da `0003` são sessão, autorização, URL curta e nunca aceitar caminho do cliente. Falta o quinto: a leitura do documento de identidade de terceiro é o acesso mais sensível do sistema e é o único fora da trilha automática
  - [ ] **Anotar no card da exclusão de dados da F6** que apagar conta tem que apagar o objeto do bucket (SEC-039 / R-023). O `on delete cascade` derruba a linha e deixa o arquivo órfão, pra sempre. A convenção de caminho `<uuid>/` que esta task fixa é o que torna a varredura possível depois
- **Não fazer:** não construir a tela de leitura do documento pelo admin (S4). Não usar `next/image` em nada vindo de usuário (R-004). Não aceitar arquivo checando só a extensão.

### T-003 — Instalar Playwright + CI
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S2 _(escorregou da S1)_
- **Capacidade:** transversal obrigatória **Testes** (`00-ESCOPO.md` §2), ancorada em **E2** — o primeiro fluxo de produto coberto é o onboarding profissional, e o item 5 do DoD da F3 exige E2E em CI
- **Nível:** 🟡
- **Agente dono:** vetria-qa
- **Depende de:** nada. **Roda em paralelo** com a T-006 e a T-007, porque `vetria-qa` escreve só em `tests/` e não disputa arquivo com ninguém
- **Por quê:** são 12 semanas de mudança em código que já está em produção. Sem rede de segurança, regressão vira descoberta do cliente. E a S2 é exatamente a semana em que o banco entra por baixo de telas que já estão no ar (R-003).
- **Feito quando:**
  - [ ] Playwright instalado, `npm run test:e2e` funcionando
  - [ ] Workflow do GitHub Actions rodando build + lint + E2E em push na `main`
  - [ ] Primeiro teste real: login com credencial de teste → chega no painel certo
  - [ ] Usuários de teste **não** vêm de `.env` commitado — vêm de secret do GitHub
  - [ ] `README.md` explica como rodar teste local
  - [ ] **Se a T-006 fechar dentro da semana:** segundo teste cobrindo cadastro de vet → onboarding preenchido → sair e voltar → o dado está lá (item 1 do DoD da F3)
- **Não fazer:** não escrever teste de tela que ainda é casca. Testa só o que já é real. Não criar usuário de teste em produção sem combinar como ele é limpo depois.

---

# ⏸️ BLOQUEADAS

- **T-008 — Upload do documento de validação.** Bloqueada por **T-002**, que é 🔴 e depende
  de sessão presencial com o Elber. O card fica acima, na fila da S2. Se a T-002 não
  acontecer nesta semana, a T-008 escorrega para a S3 e leva junto o item 3 do DoD da F3.
  **Desde 26/08 a cadeia ficou mais longa:** a T-002 depende de T-009 a T-012, que são os
  bloqueantes da auditoria da `0003`. Duas delas são uma linha; as outras duas são decisão do
  Elber e podem ser tomadas na mesma sessão.
- **T-007 — Onboarding do estabelecimento.** Não está formalmente ⏸️, mas **não pode começar
  antes de a `0003` estar aplicada**: os três campos de identificação só existem em
  `perfil_privado` depois dela.

---

# ✅ CONCLUÍDAS

### T-009 — Amarrar a linha do banco ao objeto que está no bucket
- **Estado:** ✅ concluída em 26/08/2026
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟠 — decisão de arquitetura, pergunta antes de escrever código
- **Agente dono:** vetria-backend + Elber
- **Depende de:** nada (é pré-requisito da T-002)
- **Por quê:** SEC-033. A revalidação da SEC-023 está amarrada ao **texto** de `documento_path`. Trocar os bytes no mesmo caminho não muda a string, não dispara o trigger e não carimba data: o perfil aprovado segue `active` exibindo um documento que ninguém conferiu. É o cheque em branco vitalício da SEC-016 voltando pela porta que a `0003` abre.
- **Feito quando:**
  - [ ] Decidido e registrado em `05-DECISOES.md` **como** a linha se amarra ao objeto: caminho imutável por envio, upload sem `upsert`, e algo que o bucket controle guardado na linha (não só o caminho)
  - [ ] Respondido no card: **o token de `createSignedUploadUrl` permite `upsert` na versão do SDK que a T-008 vai usar, e quanto tempo ele vive?** Sem essa resposta a decisão é chute
  - [ ] O card da T-008 passa a dizer, explicitamente, que a rota **nunca reemite URL de upload para caminho que já existe**
  - [ ] Tratado o caso de negação de serviço: caminho apontando pra objeto inexistente não pode virar 404 mudo na fila do admin
- **Não fazer:** não escrever a rota de upload (é a T-008). Não criar policy de Storage "só pra resolver isso": a decisão de zero policy está tomada e reabri-la é assunto do Elber, não efeito colateral de card.
- **Resultado:** 🟡 escrito na `0003` v2, **não aplicado**, volta pro `vetria-seguranca` (R-016). A linha passa a guardar a identidade dos BYTES: `perfil_privado.documento_hash` (sha256 hex, CHECK de 64 caracteres) e `documento_tamanho` (inteiro, teto igual ao `file_size_limit` do bucket), mais o CHECK `perfil_privado_documento_completo` (caminho, hash e tamanho vivem e morrem juntos: documento sem identidade deixa de ser estado válido). O ramo `perfil_privado` do trigger de revalidação passa a vigiar as duas colunas novas, e `carimbar_envio_documento` passa a recarimbar `documento_enviado_em` quando o hash muda (era o "carimbo da conferência que aconteceu sobre o arquivo antigo"). O caminho vira imutável por envio: epoch em **milissegundos**, sem `upsert`, e caminho que já existe é ERRO e não sobrescrita (seção 3 e passo 6 da 2.b). O token de upload deixou de existir (ver T-012), então o primeiro vetor da SEC-033 morreu na arquitetura, e a pergunta do card sobre tempo de vida e `upsert` do `createSignedUploadUrl` deixou de ter objeto. **Medido em produção em 26/08:** o ramo `perfil_privado` da função é literalmente `new.documento_path is distinct from old.documento_path`, só a string. SEC-033 confirmada contra o banco, não contra o repo.
  **✅ FECHADO em 26/08 pela 2ª auditoria** (`SEC-2026-08-26-0003-v2.md`): os três CHECKs foram exercitados estado a estado e aguentam os parciais (hash sem path barrado, path sem tamanho barrado, tamanho 0 e negativo barrados, arquivo de zero byte barrado pelo par). **Ressalva registrada como SEC-048 / R-028:** `add column if not exists` com CHECK inline é **uma** instrução, então se a coluna já existir o Postgres pula o CHECK junto, e não há pré-voo para as cinco colunas novas. Probabilidade baixíssima e não bloqueia; o conserto é um pré-voo 1.9 de três linhas.

### T-010 — O pré-voo da `0003` exige zero policy de verdade
- **Estado:** ✅ concluída em 26/08/2026
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟡 — o arquivo **não está aplicado**; mostra o diff. Aplicar continua 🔴, dentro da T-002
- **Agente dono:** vetria-backend
- **Depende de:** nada (é pré-requisito da T-002)
- **Por quê:** SEC-034. O pré-voo 1.3 aborta só se a policy **citar a string** `documentos`. Policy sem filtro de `bucket_id` alcança todos os buckets, não contém essa string, e é a forma que os templates do painel do Supabase geram. Se existir uma legada, a partir da T-008 qualquer conta logada lê documento de identidade de toda a base — com a migration declarando por escrito que a superfície é zero.
- **Feito quando:**
  - [ ] Rodada no dashboard, e o resultado colado neste card: `select policyname, cmd, roles, qual, with_check from pg_policies where schemaname='storage' and tablename='objects';` **Se vier qualquer linha, a migration não roda até alguém decidir o que fazer com ela**
  - [ ] O pré-voo 1.3 aborta com **zero policy em `storage.objects`, ponto**. Sem `like '%documentos%'`
  - [ ] A Sonda 2 do `verificar-apos-0003.sql` trata `policies_no_storage > 0` como **falha**, e o comentário que hoje diz que "não é falha automática" sai
- **Não fazer:** não apagar policy de storage por conta própria. Se aparecer alguma, ela é de alguém, pra alguma coisa: descobrir qual antes.
- **Resultado:** ✅ corrigido na `0003` v2 (não aplicada). **Consulta rodada no dashboard em 26/08: veio VAZIO** — zero policy em `storage.objects` hoje, então o cenário de exploração da SEC-034 não existe no banco atual e a correção vale como endurecimento, não como conserto de exposição ativa. Está escrito assim no comentário do pré-voo 1.3, com data. O pré-voo agora aborta com **qualquer** policy em `storage.objects`, sem filtro por string, e imprime nome, `cmd` e `roles` de cada uma. A Sonda 2 trata `> 0` como falha, o texto que a desqualificava saiu, e ela ganhou uma coluna com os nomes encontrados. Anotado nos dois arquivos: quando a F4/S7 criar o bucket público de foto, a regra muda de "zero policy" para "nenhuma policy sem filtro de `bucket_id`", e os dois lugares mudam juntos.
  **✅ FECHADO em 26/08 pela 2ª auditoria:** a 1.3 agora exige zero policy, ponto. **SEC-034 encerrada.**

### T-011 — As sondas da `0003` passam a reportar o que descobrem
- **Estado:** ✅ concluída em 26/08/2026
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** nada (é pré-requisito da T-002)
- **Por quê:** SEC-035. A Sonda 10 é a que justifica o arquivo de verificação, e ela fala por `raise notice`. No Studio do Supabase o resultado é "Success. No rows returned" **tanto quando o trigger passa quanto quando falha**. É o degrau seguinte do DL-050: execução que não reporta não é execução.
- **Feito quando:**
  - [ ] Rodado no dashboard, e o resultado anotado: `do $$ begin raise notice 'teste de notice'; end $$;` — **se o texto aparecer no editor, este card encolhe pro item do pré-voo e mais nada**
  - [ ] A Sonda 10 devolve **result set**: uma linha por asserção, com uma coluna `ok` legível na tela
  - [ ] O `raise warning` do pré-voo 1.2 (RLS de `storage.buckets`) vira `raise exception`
  - [ ] Acrescentada sonda para os ramos `vet_profiles` e `clinic_profiles` do trigger reescrito. Hoje só o ramo de `perfil_privado` é testado, e `create or replace` reescreve o corpo inteiro (SEC-038)
  - [ ] Acrescentada sonda que assume o papel **`authenticated`** e prova que a conta A não lê a linha da conta B em `perfil_privado`. A 7B mede `anon`, que nunca teve grant ali (SEC-038)
  - [ ] `notify pgrst, 'reload schema';` no fim da migration (SEC-038)
  - [ ] A Sonda 9 conta só a linha que ela mesma ativou, em vez de exigir `count = 1` no total (SEC-038)
- **Não fazer:** não transformar o arquivo de verificação em suíte de teste. Ele é lido por humano no SQL Editor, uma sonda por vez, e essa é a razão de ele existir separado da migration.
- **Resultado:** ✅ corrigido nos dois arquivos (não aplicados). **O teste de NOTICE foi rodado no dashboard em 26/08 e devolveu "Success. No rows returned", sem imprimir o texto: SEC-035 CONFIRMADA.** Este card não encolheu, cresceu. Varredura feita: **zero** `raise notice` e **zero** `raise warning` sobraram nos dois arquivos — o `raise warning` do pré-voo 1.2 virou `raise exception`, a notice que "confirmava a cópia" na seção 5 saiu, e as cinco notices da Sonda 10 saíram. A Sonda 10 acumula `(ordem, cenario, esperado, obtido, veredito)` numa tabela temporária e termina em `select`. Sondas novas: **7C** (`authenticated` de outra conta lendo `perfil_privado` alheio, com controle positivo para não medir porta soldada), **10B** (ramos `vet_profiles` e `clinic_profiles`, com controle negativo em `bio`, `sobre` e `site`) e **13B** (a guarda da SEC-044). A Sonda 9 conta só o alvo que ela mesma ativou e ganhou controle negativo: o mesmo alvo, fora de `active`, tem que sumir. `notify pgrst, 'reload schema'` entrou antes do `commit`. E a migration ganhou um `select` de resultado **depois do commit**, com uma coluna booleana por consequência: é o único canal de saída dela. **Limite honesto anotado no arquivo:** o recarimbo de `documento_enviado_em` quando o hash muda NÃO é verificável por sonda, porque `now()` é o timestamp da transação e dentro de um rollback o valor antigo e o novo são o mesmo; ficou coberto pelo catálogo (Sonda 11) e pelo item (d) da Sonda 14.
  **✅ FECHADO em 26/08 pela 2ª auditoria**, nos quatro itens da SEC-038, e o limite honesto do recarimbo foi julgado **procedente**: `now()` é o timestamp da transação, então a asserção pedida na v1 reprovaria um banco correto. **Ressalva que virou card:** a entrega do resultado das sondas 7C e 9 (e da 3) é a **SEC-046 / T-013** — as três terminam em `rollback` depois do `select` do veredito. As 10, 10B e 13B **não** são afetadas: o padrão delas está certo e foi inventado neste card.

### T-012 — Decidir a arquitetura de upload, e corrigir o que o card da T-008 promete
- **Estado:** ✅ concluída em 26/08/2026
- **Fase / Semana:** F3 / S2
- **Capacidade:** E1
- **Nível:** 🟠 — decisão de arquitetura, pergunta antes
- **Agente dono:** vetria-backend + Elber
- **Depende de:** nada (é pré-requisito da T-002 e da T-008)
- **Por quê:** SEC-036. A seção 2.c da `0003` diz que a validação de MIME do servidor é "a primeira porta" e a whitelist do bucket é "a segunda". Com `createSignedUploadUrl` **não existe primeira porta**: o cliente faz PUT direto no storage-api, o byte nunca passa pelo Next.js, e tudo que o servidor pode validar é uma string que o cliente mandou antes. As duas portas são a mesma, e é a fraca. O risco caro não é o vazamento: é a **T-008 ser escrita acreditando num controle que não tem**.
- **Feito quando:**
  - [ ] Decidido e registrado em `05-DECISOES.md`: ou o upload passa pelo servidor de verdade (primeira porta existe, ao custo de trafegar até 10 MiB pela função), ou se aceita por escrito que a validação é **declarativa** e a defesa real é a whitelist mais a origem separada
  - [ ] O comentário da seção 2.c da migration passa a dizer o que o desenho de fato faz
  - [ ] O card da T-008 é corrigido pra não prometer validação que o desenho escolhido não entrega
  - [ ] Registrado no card **o que continua fechado**, pra ninguém reabrir por engano: `image/svg+xml` e `text/html` estão fora das duas whitelists, e a URL assinada vive em `*.supabase.co`, origem diferente da do app. **O R-004 não reabre.**
  - [ ] Acrescentado ao card da T-008 o passo que falta na seção 2.b: **registrar em `audit_logs` (`acao = 'documento_visualizado'`) antes de devolver a URL assinada do documento de terceiro** (SEC-040)
- **Não fazer:** não implementar o upload aqui. Este card decide e escreve; quem constrói é a T-008.
- **Resultado:** ✅ decidido pelo Elber em 26/08 e escrito nas seções 2.b e 2.c da `0003` v2. Falta o DL em `05-DECISOES.md`, que é do `vetria-escriba`. **O upload passa por um Route Handler nosso:** a rota lê os bytes, confere a **assinatura mágica** do tipo real (não o `content-type` declarado), deriva a extensão do tipo detectado, gera o caminho, escreve com `service_role` e só então grava a linha com caminho, sha256 e tamanho. `createSignedUploadUrl` **não é usada em lugar nenhum** e nenhum token de escrita chega ao cliente. Com isso a "primeira porta" da 2.c deixou de ser mentira: ela é o passo 4 da rota, sobre os bytes. Custo aceito por escrito: até 10 MiB trafegam pela função, num arquivo por profissional, uma vez. A 2.c passou a listar **quatro** listas que mudam juntas (MIME do bucket, extensão do CHECK, tabela de assinatura mágica, limite de bytes) e traz os magic numbers de pdf, jpeg, png e webp. Registrado que **o R-004 não reabre**: `image/svg+xml` e `text/html` estão fora de todas as listas, e a URL assinada vive em origem diferente da do app. A rota de leitura ganhou o quinto passo da SEC-040 (grava `documento_visualizado` em `audit_logs`, com o dono em `alvo_id`, **antes** de emitir a URL) e o tratamento do 404 mudo na fila do admin.
  **✅ FECHADO em 26/08 pela 2ª auditoria: SEC-036 encerrada.** O julgamento acrescentou uma precisão que passa a valer: com o upload pela nossa rota, **a whitelist do bucket deixa de ser porta e vira alarme** sobre o nosso próprio código, porque quem declara o `content-type` passamos a ser nós. A defesa contra atacante é a assinatura mágica. **R-004 continua fechado por três barreiras independentes:** SVG não tem assinatura mágica e não entra na tabela do passo 4; `.svg` está fora da whitelist de extensão do CHECK; e o objeto é servido de `*.supabase.co`, origem diferente da do app.
  **O DL que faltava foi registrado: DL-051.**
  **Achado novo herdado pela T-008: SEC-051 / R-031** — o passo 8 não diz com qual cliente grava a linha, e com `service_role` o `actor_id` de `audit_logs` sai nulo.


### T-005 — Onboarding profissional estoura a largura da tela
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** removido o `-m-6 sm:-m-8` de `VetOnboardingForm.tsx:92` e `ClinicOnboardingForm.tsx:69`, e o `min-h-[calc(100vh-4rem)]` virou `min-h-screen`. A margem negativa furava o padding de um container pai que deixou de existir quando os onboardings saíram do route group `(painel)`. Varredura confirmou que eram as duas únicas ocorrências no `app/`. Build verde.

### T-004 — Auditoria de segurança inicial (linha de base)
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** virou auditoria da própria migration `0002`, em **4 rodadas**. Relatório em `docs/relatorios/SEC-2026-08-26.md` (2854 linhas). Achou 2 críticos (responsável entrava na busca como veterinário; base de telefones vazava pela API), 12 altos e vários médios. Alimentou R-011 a R-017 e as decisões DL-049 e DL-050.

### T-001 — Migration 0002: núcleo de dados
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** `0002_nucleo.sql` aplicada em produção. Criou `profiles.status` e `status_motivo`, `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais`, `contatos`, `audit_logs`, com RLS codificando `06-PERMISSOES.md`. Mais `is_admin()`, `perfil_esta_ativo()`, `tem_role()`, `admin_definir_status()`, `concluir_onboarding_profissional()` e dois triggers de revalidação. Removeu `current_user_role()` (INVOKER sem search_path, mina do DL-014), `is_admin_master()` (duplicata, fecha R-005) e a policy `profiles_update_own_safe` (superada, e mantê-la anularia o pin de `status`).
- **Auditoria:** 4 rodadas. v1 reprovada com 2 críticos (responsável entrava na busca como veterinário; base de telefones vazava pela API). v2 fechou os dois e abriu quatro nas próprias correções, incluindo um que desligaria a busca pública inteira sem aparecer em teste com usuário logado. v5 aprovada. Relatório: `docs/relatorios/SEC-2026-08-26.md`, 2854 linhas.
- **Descoberto ao aplicar:** a migration **não rodava**. `perfil_esta_ativo()` é `LANGUAGE sql` e consulta `profiles.status`, mas era criada antes da coluna existir. As 4 auditorias revisaram semântica e autorização; nenhuma percorreu a ordem de execução contra um banco real. Corrigido trocando as seções 2 e 3 de lugar.
- **Verificado:** 9 sondas. Destaques: busca pública funciona para o anônimo (Sonda 2 = 1); `perfil_privado` inacessível ao anônimo; o profissional **não** consegue se auto-aprovar (WITH CHECK levanta); travessia de caminho e SVG barrados; 18 contas e 18 profiles depois de um cadastro real de ponta a ponta.
- **Commits:** `2846ec2` → `52bd9b9`

### T-000b — Baseline do schema atual versionado
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** `0000_baseline.sql` versiona o schema que existia antes desta pasta (fecha R-006). Corrigiu três coisas que a documentação afirmava errado: `profiles` **tem** `full_name` e `phone` (o DL-019 dizia que não); `master` não é role, é `admin_level`; o enum `admin_level` é `('none','admin','master')` e `comum` nunca existiu, o que torna o R-002 item 3 improcedente.

### T-000 — Instalar sistema de governança e agentes
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** `docs/` criado (escopo congelado, plano de 13 semanas, estado, tarefas, riscos, decisões, protocolo de agentes). 6 agentes definidos em `.claude/agents/`. `HANDOFF.md` reescrito como protocolo de entrada de sessão. `CONTEXT.md` e `BACKLOG.md` congelados como histórico.

---

## REGRAS DA FILA

1. **Sem capacidade E1–E6, não entra.** Ideia sem capacidade vai pra `04-RISCOS.md` §Ideias.
2. **Uma task 🔵 por vez** entre os agentes que escrevem código. Auditores rodam quando quiserem.
3. **Achado de auditoria vira card** — nunca correção direta no meio de outra task.
4. **Task que cresce, para.** Se a real for maior que o card, marca ⏸️, escreve o que descobriu e pergunta. Não segue empurrando.
5. **Card sem "Resultado" preenchido não é ✅.** Task sem rastro é task que ninguém vai conseguir continuar.
