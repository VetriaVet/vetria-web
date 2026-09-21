# 05 — DECISÕES DE ARQUITETURA (DL-041+)

> Continuação do decision log. **DL-001 a DL-040 estão em `CONTEXT.md`** (congelado, leitura histórica).
> Toda decisão nova entra aqui, numerada em sequência.

## Quando registrar um DL

**Registra:** decisão arquitetural, padrão que passa a valer pra frente, bug resolvido com
causa não óbvia, trade-off aceito de propósito, descoberta que muda tasks futuras.

**Não registra:** mudança visual simples, ajuste de copy, correção de typo, bump de dependência
sem impacto. Isso vira só o campo "Resultado" do card em `03-TAREFAS.md`.

## Formato

```
### DL-NNN — <título>
**Data:** DD/MM/AAAA · **Fase/Task:** F3/S2 · T-00N · **Commit:** hash
**Contexto:** o que estava acontecendo, em 2 a 4 frases factuais.
**Decisão:** o que foi decidido, no passado, sem floreio.
**Alternativas descartadas:** o que também foi considerado e por que não.
**Implicações:** o que isso obriga ou impede daqui pra frente.
**Status:** ✅ aplicada / 🔵 em andamento / ⚠️ revogada por DL-NNN
```

---

### DL-041 — Governança por documentos + agentes especializados, e não por sessão
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · T-000
**Contexto:** o projeto entrou em janela de entrega de 3 meses com escopo real ainda por
construir (o app era casca visual). O modelo anterior dependia de um "Chat 2 gerador de
prompts" descrito no `HANDOFF.md` e de dois arquivos que cresceram demais: `CONTEXT.md`
(1043 linhas misturando estado, log e regra) e `BACKLOG.md` (32 KB, quase tudo já feito).
Toda sessão nova precisava reler tudo e ainda assim ficava com estado desatualizado.
**Decisão:** o estado do projeto passa a viver em `docs/`, dividido por função —
escopo congelado, plano, estado, fila, riscos, decisões. O trabalho passa a ser feito por
6 agentes especializados versionados em `.claude/agents/`, e não por prompt colado a cada
sessão. O contrato entre eles é o handoff obrigatório descrito em `docs/AGENTES.md`.
`CONTEXT.md` e `BACKLOG.md` viram históricos congelados.
**Alternativas descartadas:** (a) continuar com `CONTEXT.md` crescendo — já havia falhado,
o arquivo era grande demais pra ser lido de fato a cada sessão; (b) um único agente
generalista — perde o valor do olhar adversarial de segurança e QA sobre o próprio trabalho.
**Implicações:** toda task passa a exigir um card com capacidade E1–E6 declarada; toda task
termina com atualização de `02-ESTADO.md` e `03-TAREFAS.md`; agentes auditores nunca
escrevem código de produção, só relatório. A separação entre quem escreve e quem audita é
o que permite rodar em paralelo sem colisão no repositório.
**Status:** ✅ aplicada

---

### DL-042 — Separação escritores × auditores como modelo de paralelismo
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · T-000
**Contexto:** o pedido era ter agentes de segurança, UX e QA trabalhando "simultaneamente"
com os agentes de funcionalidade. Vários agentes escrevendo na mesma árvore de arquivos ao
mesmo tempo produz conflito de merge, sobrescrita e trabalho perdido.
**Decisão:** dois grupos com direitos diferentes.
**Escritores** (`vetria-backend`, `vetria-ui`, `vetria-escriba`) tocam o repositório, um de
cada vez, seguindo a fila. **Auditores** (`vetria-seguranca`, `vetria-qa`) são somente
leitura: rodam a qualquer momento, em paralelo com qualquer coisa, e a saída deles é um
relatório em `docs/relatorios/`. Achado de auditor não é corrigido pelo auditor — vira card
na fila e é executado por um escritor.
**Alternativas descartadas:** git worktree por agente — resolveria a colisão, mas o custo de
merge de N branches simultâneas num projeto de uma pessoa só é maior que o ganho.
**Implicações:** o paralelismo real é auditoria × execução, não execução × execução. Isso é
suficiente, porque auditoria é justamente o trabalho que trava quando fica pra depois.
**Status:** ✅ aplicada

---

### DL-043 — Rotas em português, roles em inglês (registro de decisão herdada)
**Data:** 26/08/2026 (registro) · **Decisão original:** commit `b815ca5`
**Contexto:** o commit `b815ca5` renomeou a nomenclatura visível — tutor virou responsável,
clínica virou estabelecimento, pet virou animais — incluindo as rotas
(`/app/responsavel`, `/app/veterinario`, `/app/estabelecimento`). Os valores da coluna
`profiles.role` **não** foram renomeados: continuam `tutor`, `vet`, `clinic`.
**Decisão:** manter assim. Rota é interface, role é dado. Renomear enum em produção exige
migration de dados com janela de risco e não entrega valor nenhum ao usuário.
**Implicações:** todo código que compara role compara com o valor em inglês. Todo link e
toda URL usa português. Quem confundir os dois cria bug silencioso de roteamento — é o erro
mais provável pra quem chega novo no projeto, e está sinalizado em `02-ESTADO.md`.
**Status:** ✅ aplicada

---

### DL-044 — Busca e perfil público são abertos; "1 usuário = 1 role" continua absoluto
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · pré-T-001
**Contexto:** um veterinário que tem animal em casa também é consumidor da busca. A regra
"1 usuário = 1 role permanente" sustenta todo o RBAC atual, e afrouxá-la multiplicaria a
superfície de vazamento entre painéis, que é justamente onde mora a diferença entre os
planos vendidos. Por outro lado, exigir uma segunda conta por email diferente é atrito real.
**Decisão:** a busca, os perfis públicos e o evento de contato são **abertos a qualquer um**,
logado ou não, com qualquer role. O que nenhum profissional ganha é o **painel** do
responsável. O princípio "1 usuário = 1 role" fica intacto porque ele governa o painel, e o
painel é onde vive o benefício pago.
**Alternativas descartadas:** (a) exigir conta separada — atrito sem ganho, já que a busca é
pública por definição; (b) conta dupla com troca de contexto — quebra o RBAC inteiro.
**Implicações:** o `middleware.ts` isola painéis por prefixo de rota, mas **não** protege
`/buscar` nem os perfis públicos. A matriz completa está em `docs/06-PERMISSOES.md` §2.
**Status:** ✅ aplicada

### DL-045 — Admin comum opera, master governa
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · pré-T-001
**Contexto:** o modelo tinha `admin_level` mas nunca foi definido o que separa os dois
níveis. Com a validação de CRMV e CNPJ entrando na F3/S4, isso vira decisão bloqueante:
alguém precisa aprovar profissionais sem ser o dono da plataforma.
**Decisão:** **admin comum** vê a fila, aprova, reprova e modera. **Só o master** vê a base
inteira, concede ou remove role, promove admin, suspende conta e lê os `audit_logs`.
**Alternativas descartadas:** (a) só master aprova — o Elber vira gargalo de toda entrada de
profissional; (b) admin comum faz tudo menos mexer em role — suspender conta paga é poder
demais pra nível operacional.
**Implicações:** `/admin/usuarios` continua exclusivo do master (já é assim no código).
`/admin/validacoes` passa a aceitar admin comum. Toda ação de admin, master incluído, entra
em `audit_logs`. Matriz em `docs/06-PERMISSOES.md` §5.
**Status:** ✅ aplicada

### DL-046 — Profissional em `pending_validation` edita o perfil enquanto espera
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · pré-T-001
**Contexto:** definir o que o profissional alcança entre concluir o onboarding e ser
aprovado. Travar tudo é seguro e faz o profissional sumir; liberar o painel inteiro em
modo leitura exige checagem de status em cada tela, e uma esquecida vaza funcionalidade paga.
**Decisão:** com `status = 'pending_validation'` ele alcança **apenas** `/aguardando`,
`/perfil` e `/configuracoes`. Todo o resto do painel é bloqueado **no servidor**.
**Alternativas descartadas:** painel inteiro navegável com faixa de aviso — o custo de
garantir isso em toda tela nova, por 12 semanas, é alto demais pro ganho.
**Implicações:** o bloqueio vive no `middleware.ts` por prefixo de rota, não espalhado por
página, justamente pra não depender de disciplina humana (é a lição do R-001). Continuar
editando o perfil enquanto espera acelera a aprovação e prepara a gamificação do briefing.
**Status:** ✅ aplicada

### DL-047 — O contato é evento de servidor, e o cadastro vem depois do valor entregue
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · pré-T-001
**Contexto:** o padrão óbvio pro CTA de WhatsApp seria um link `wa.me` direto. Isso teria
três consequências: o telefone de todo profissional ficaria no HTML e raspável por qualquer
concorrente; a plataforma não teria como provar valor pro profissional que paga; e o tutor
sairia sem deixar rastro. Por outro lado, exigir cadastro antes do contato contradiz o
briefing aprovado (`Coração Cerne do Projeto`: "Cadastro ≠ Benefício") e mataria a conversão
no pico de intenção.
**Decisão:** o clique é um **POST no servidor**. O servidor grava em `contatos` e só então
devolve o número e redireciona. Funciona **anônimo**, identificado por cookie primário
`httpOnly` com UUID aleatório. O número aparece na hora, sem pedir nada; **na mesma tela**,
abaixo dele, vem o convite de cadastro com "agora não" visível. Convite, nunca portão. Se a
pessoa criar conta depois, os contatos anônimos são vinculados por `anon_id`.
**Alternativas descartadas:** (a) link `wa.me` direto — expõe a base de telefones e destrói
a métrica que sustenta o preço do plano; (b) pedir dados antes de revelar o número —
contraria o briefing e derruba conversão; (c) identificar por IP — o NAT das operadoras
agrupa milhares de pessoas sob o mesmo IP, e IP é dado pessoal pela LGPD, então o custo de
conformidade sobe para uma precisão pior.
**Implicações:** `contatos` entra na migration 0002 com `user_id` **nulável** e `anon_id`.
Nasce com a coluna `canal` (`whatsapp` agora; `telefone` e `agendamento` depois) para que a
integração de agendamento do mês 5+ seja aditiva em vez de reescrita — **isso não traz a
feature pro escopo, só não fecha a porta**. Consequência de escopo: a tela
`/app/responsavel/historico` hoje promete "Seus agendamentos" e precisa virar "Seus
contatos", porque agendamento está fora dos 3 meses.
**Status:** ✅ aplicada

---

### DL-048 — Núcleo de dados aplicado: o app deixa de ser casca
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · T-001 · **Commits:** `2846ec2` a `52bd9b9`
**Contexto:** o app tinha ~45 telas em produção e um banco com uma tabela só. Nenhuma das
seis capacidades contratadas existia sem o núcleo.
**Decisão/execução:** migration `0002` aplicada em produção. Criou `profiles.status` e
`status_motivo`, `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais`, `contatos`
e `audit_logs`, com RLS codificando `docs/06-PERMISSOES.md` célula por célula. Ações de
admin passam por função guardada (`admin_definir_status`), não por UPDATE direto: a
autorização fica num lugar só e a trilha de auditoria sai automática. Os 7 profissionais
com onboarding de casca voltaram para `incomplete` (decisão B: nada foi apagado).
**Alternativas descartadas:** apagar as contas de teste, descartada porque algumas são dos
sócios; e deixar o estado inconsistente para resolver depois, que geraria bug fantasma.
**Implicações:** a F3/S2 pode ligar os formulários de onboarding nas tabelas. A regra de
visibilidade da busca (`role` E `status='active'`) vive no Postgres, então nenhuma tela
consegue contorná-la. As tabelas estão vazias: as telas ainda não escrevem nelas.
**Status:** ✅ aplicada e verificada por 9 sondas.

### DL-049 — Contato e documento moram em tabela separada, porque RLS é row-level
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · T-001 (achado SEC-002)
**Contexto:** a primeira versão da `0002` guardava `whatsapp`, `telefone`, `email_contato` e
`documento_path` dentro de `vet_profiles` e `clinic_profiles`, protegidos pela mesma policy
de leitura pública que servia a busca.
**Decisão:** esses campos passaram para `perfil_privado`, tabela sem nenhuma policy para
`anon`. O DL-047 já dizia que o telefone nunca vai no HTML; o que faltava perceber é que a
API é a porta principal.
**Por quê:** **RLS é row-level.** Liberar a linha libera **todas as colunas dela**, e o
PostgREST deixa o cliente escolher quais quer. `GET /rest/v1/vet_profiles?select=whatsapp`
com a chave anônima, que está no bundle do site, entregaria a base inteira de telefones.
Proteger o HTML e deixar a API aberta é proteger a porta e esquecer a janela.
**Alternativas descartadas:** privilégio por coluna (`GRANT SELECT (col)`), que funcionaria
mas depende de alguém lembrar do `GRANT` a cada coluna nova. Separar a linha é robusto por
construção.
**Implicações:** a F4/S8 revela o número pelo servidor, lendo `perfil_privado` com privilégio
elevado. Toda coluna sensível nova nasce lá, não nas tabelas públicas.
**Status:** ✅ aplicada

### DL-050 — Revisão não substitui execução
**Data:** 26/08/2026 · **Fase/Task:** F3/S1 · T-001
**Contexto:** a `0002` passou por **quatro rodadas** de auditoria de segurança, que acharam
2 achados críticos e 12 altos. Na primeira tentativa real de aplicar, ela **não rodou**:
`perfil_esta_ativo()` é `LANGUAGE sql` e consulta `profiles.status`, mas era criada antes da
coluna existir. O Postgres valida o corpo de função sql no `CREATE`, e a transação inteira
falhou.
**Decisão:** duas regras passam a valer. **(1)** Correção de segurança volta para revisão:
em quatro rodadas seguidas houve achado nascido da correção anterior, e um deles teria
desligado a busca pública inteira sem aparecer em nenhum teste feito com usuário logado.
**(2)** Migration aprovada não é migration testada. A auditoria cobre semântica e
autorização; ordem de execução só aparece rodando.
**Implicações:** o custo foi baixo porque a transação reverteu inteira, e é justamente por
isso que toda migration é uma transação só. Registrado como R-016 e no contrato dos agentes.
**Status:** ✅ virou processo

### DL-051 — O documento de validação sobe por rota nossa, e a linha guarda a identidade dos bytes
**Data:** 26/08/2026 · **Fase/Task:** F3/S2 · T-002 / T-009 / T-012 · **Commit:** `a68251d` — a metade que é banco está aplicada; a rota é a T-008
**Contexto:** o desenho original do bucket `documentos` era URL de upload assinada: o servidor
emitia o token, o navegador fazia PUT direto no storage-api. A auditoria da `0003` mostrou duas
consequências que ninguém tinha visto (SEC-033 e SEC-036). **(1) Não existia validação de tipo
no servidor.** O byte nunca passava pelo Next.js; tudo que dava para validar era uma string de
`content-type` que o cliente mandara antes e não era obrigado a repetir no PUT. O comentário da
migration chamava isso de "primeira porta" e implementava a segunda. **(2) A revalidação estava
amarrada a um texto.** A SEC-023 dispara quando `documento_path` muda; reutilizando o mesmo
caminho, os bytes mudavam e a linha não mudava: trigger não disparava, `documento_enviado_em`
ficava parado na conferência do arquivo antigo, e o perfil seguia `active` exibindo um documento
que ninguém conferiu.
**Decisão:** o upload passa por um **Route Handler nosso**. `createSignedUploadUrl` não é usada
em lugar nenhum e **nenhum token de escrita chega ao cliente**. A rota lê os bytes, confere o
**tipo real pela assinatura mágica dos primeiros bytes** (nunca pelo `content-type` declarado
nem pela extensão do nome), deriva a extensão do tipo detectado, monta o caminho com o `uuid`
vindo de `auth.uid()` da sessão, escreve no bucket com `service_role` **sem `upsert`** e grava
na linha `documento_path`, `documento_hash` (sha256 hex dos mesmos bytes que ela escreveu) e
`documento_tamanho`, os três num único UPDATE. **Caminho existente é erro, não sobrescrita.**
As colunas de identidade entram no ramo `perfil_privado` do trigger de revalidação e na
condição de recarimbo de `carimbar_envio_documento`: **trocar os bytes passa a mover uma coluna
que o trigger vigia.**
**Alternativas descartadas:** (a) manter a URL assinada e **aceitar por escrito** que a
validação é declarativa — defensável, e foi recusada porque o admin abre esse arquivo dentro do
painel de maior privilégio do sistema; (b) guardar um identificador devolvido pelo storage-api
em vez do sha256 — mais fraco e mais caro, porque exigiria uma leitura de volta; (c) criar
policy de Storage para o dono escrever no próprio prefixo, descartada antes (o CHECK valida a
**string guardada na tabela**, não o objeto no bucket, e com o cliente escolhendo o nome
haveria duas verdades sobre o mesmo documento).
**Custo aceito de propósito:** até **10 MiB trafegam pela função** do Next.js a cada envio. É
aceitável porque é **um arquivo por profissional, uma vez, no onboarding** — não é caminho
quente do app.
**Implicações:**
- **A whitelist de MIME do bucket deixa de ser porta e vira alarme.** Quem declara o
  `content-type` para o storage-api passamos a ser nós; a defesa contra atacante é a assinatura
  mágica. A whitelist pega o dia em que alguém mexer na rota e esquecer do bucket.
- **São quatro listas que mudam juntas, sempre:** `allowed_mime_types` do bucket, a whitelist de
  extensão do CHECK `perfil_privado_documento_do_dono`, a tabela de assinatura mágica da rota, e
  o limite de bytes (`file_size_limit` e o CHECK de `documento_tamanho`).
- **O dono deixa de ler o próprio documento direto do Storage**, inclusive com sessão válida. A
  regra de autorização muda de lugar, do Postgres para a rota de servidor. Isso não contraria
  `docs/06-PERMISSOES.md` linha 75; muda onde a regra é aplicada.
- **R-004 continua fechado, por três barreiras independentes:** SVG não tem assinatura mágica e
  não entra na tabela do passo 4; `.svg` está fora da whitelist de extensão do CHECK; e o objeto
  é servido de `*.supabase.co`, origem diferente da do app.
- **Reverter a `0003` reabre a SEC-033.** Sem `documento_hash`, a linha volta a estar amarrada
  só ao texto do caminho. Se a rota já estiver no ar, ela tem que ser desligada junto.
- **Pendência conhecida, ainda NÃO decidida (SEC-051 / R-031):** o contrato não diz com qual
  cliente o passo 8 grava a linha. Com `service_role`, `auth.uid()` é nulo e o `actor_id` de
  `audit_logs` sai nulo: a trilha diz que o perfil voltou pra fila e não diz quem mexeu. **A
  auditoria recomenda a sessão do usuário**, e a recomendação está no card da T-008; **a
  decisão é do Elber e ainda não foi tomada.** Só o passo 7, a escrita no bucket, precisa de
  `service_role` e isso está decidido.
**26/08 — a metade que é banco está aplicada.** A `0003` rodou em produção (commit `a68251d`)
e a Sonda 10 mediu, na linha do `documento_hash`, que trocar os bytes de um documento aprovado
devolve o perfil para `pending_validation`, enquanto mexer no telefone não. A Sonda 11 confirmou
pelo catálogo que `carimbo_segue_o_hash` e `revalidacao_segue_o_hash` estão no corpo que está
rodando, não só no arquivo. **A metade que é rota continua não existindo**, e com ela continuam
em aberto a assinatura mágica, o caminho gerado no servidor e a pendência do passo 8.
**Status:** 🔵 decidida e escrita, **metade aplicada**. Vira ✅ quando a rota existir (T-008).

---

### DL-052 — 10 MiB e quatro MIME para o documento de validação, e as quatro listas mudam juntas
**Data:** 26/08/2026 · **Fase/Task:** F3/S2 · T-002 · **Commit:** `a68251d` (aplicada em produção)
**Contexto:** o bucket `documentos` precisava de teto de tamanho e de whitelist de tipo antes de
existir, porque depois que houver documento de gente real dentro qualquer mudança nas duas listas
vira migração de arquivo. O arquivo que sobe é foto de RG, CNH ou comprovante de CRMV, tirada por
celular ou escaneada em PDF.
**Decisão:** o bucket nasceu **privado**, com `file_size_limit = 10485760` (10 MiB) e
`allowed_mime_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']`. Foto de
documento de celular fica entre 2 e 6 MB e PDF de CRMV escaneado raramente passa de 3 MB: 10 MiB
cobre com folga e ainda barra vídeo e arquivo de despejo. Medido em produção (Sonda 1):
`public = false`, 10 MiB, os quatro MIME, zero objeto dentro.
**Alternativa descartada:** limite maior. O custo dele não é armazenamento: é que **até 10 MiB
trafegam pela função** do Next.js a cada envio (DL-051), e esse é o teto aceito por escrito.
⚠️ **Consequência que a T-008 herda:** `image/heic`, formato nativo da câmera do iPhone, **não está
na lista**. O envio é recusado, e a mensagem na tela precisa dizer isso em português.
**Implicações — são QUATRO listas, e elas mudam juntas, sempre:**
1. `allowed_mime_types` do bucket;
2. a whitelist de **extensão** do CHECK `perfil_privado_documento_do_dono` (`pdf|jpg|jpeg|png|webp`),
   que veio da `0002`;
3. a **tabela de assinatura mágica** da rota da T-008 (`%PDF-`, `FF D8 FF`,
   `89 50 4E 47 0D 0A 1A 0A`, `RIFF`…`WEBP`);
4. o limite de bytes, que aparece duas vezes: `file_size_limit` do bucket e o CHECK de
   `perfil_privado.documento_tamanho`.
Se as quatro divergirem, o arquivo sobe e a linha é recusada, ou o contrário, que é pior.
**`image/svg+xml` e `text/html` estão fora das quatro**, e é assim que o R-004 continua fechado.
**Status:** ✅ aplicada

---

### DL-053 — CNPJ, razão social e responsável técnico são privados; endereço e CEP continuam públicos, e essa parte não está decidida
**Data:** 26/08/2026 · **Fase/Task:** F3/S2 · T-002 (SEC-020 / R-018) · **Commit:** `a68251d`
**Contexto:** a policy `clinic_profiles_select_publico` liberava a **linha inteira** de todo
estabelecimento `active`. RLS é row-level: liberar a linha libera todas as colunas dela, e o
PostgREST deixa o cliente escolher quais quer (é o DL-049 outra vez, no outro par de tabelas).
Junto com o que é vitrine iam `cnpj`, `razao_social` e `responsavel_tecnico` — e
`responsavel_tecnico` é **nome de pessoa física**. Nunca tinha sido decidido, e a `0002` foi
aplicada assim. Não explodiu porque não existe estabelecimento `active` no banco.
**Decisão:** os três desceram para `perfil_privado`, que não tem policy nenhuma para `anon`.
`nome_fantasia`, `endereco`, `cep`, `cidade`, `estado`, `sobre`, `servicos`, `site` e `slug`
continuam públicos, agora **por `comment on column` que diz por quê**, e não por omissão.
**A escolha foi remover a coluna, não escondê-la:** medido em produção, `anon` pedindo `cnpj` a
`clinic_profiles` recebe `42703: column "cnpj" does not exist`, e em `perfil_privado` recebe
`42501: permission denied`. **Duas portas, motivos independentes.** A busca pública não quebrou
(Sonda 9), que era o custo que a SEC-014 quase cobrou na `0002`.
**Alternativas descartadas:** (a) declarar as três como vitrine, defensável para CNPJ de empresa
e indefensável para o nome do responsável técnico; (b) privilégio por coluna (`GRANT SELECT (col)`),
descartado pela mesma razão do DL-049: depende de alguém lembrar do `GRANT` a cada coluna nova.
**⚠️ O QUE NÃO FOI DECIDIDO, e precisa ser antes da F4/S7:** o argumento que desceu `razao_social`
foi que **em MEI e firma individual a razão social carrega o nome civil do dono**. **O mesmo
argumento se aplica a `endereco` e a `cep`:** no MEI e em quem atende em casa, o endereço comercial
**é** o residencial, e nada no schema, no formulário ou no consentimento distingue os dois casos.
Os dois campos ficaram públicos **por ora**, com a pergunta escrita no `comment on column` de cada
um. **A mesma pergunta tem uma segunda metade:** `vet_profiles.cidade` **não** devolve o perfil para
a fila e `clinic_profiles.cidade` devolve (assimetria medida na Sonda 10B, deliberada e visível na
tela). Ou o custo de revalidar endereço é aceitável e vale para os dois, ou não é e não vale para
nenhum. **Está no R-032, com prazo: antes do perfil público da F4/S7.**
**Implicações:** a T-007 grava os três em `perfil_privado`, nunca em `clinic_profiles`. Nenhuma tela
pública pode exibi-los. Mudar qualquer um dos três, mais `endereco`, `cep`, `cidade` e `estado`,
devolve o perfil para `pending_validation` (Sondas 10 e 10B). Uma guarda impede conta que não é `clinic`
de gravar os três (Sonda 13B), e o efeito colateral dela em troca de role está no R-029.
**Status:** ✅ aplicada, com uma pergunta de produto em aberto registrada no R-032

---

### DL-054 — `storage.objects` não tem policy nenhuma: a única superfície do projeto com tamanho zero
**Data:** 26/08/2026 · **Fase/Task:** F3/S2 · T-002 / T-010 · **Commit:** `a68251d`
**Contexto:** o card da T-002 pedia a policy óbvia: "o dono lê e escreve dentro do próprio prefixo
`<uuid>/`". Escrever isso esbarrava numa coisa que a auditoria da `0002` já tinha registrado: o
CHECK `perfil_privado_documento_do_dono` valida **a string guardada na tabela**, não o objeto que
está no bucket. Com o cliente escolhendo o nome do arquivo, existiriam duas verdades sobre o mesmo
documento — a chave real no bucket e o texto na coluna — e o CHECK viraria teatro, aprovando um
caminho que não é o do arquivo.
**Decisão:** o bucket `documentos` não tem **nenhuma** policy em `storage.objects`. Quem alcança o
bucket é o servidor, com `service_role`, e só ele: escrita por `upload(path, bytes)` dentro da rota
(DL-051), leitura por `createSignedUrl(path, expiresIn)`. **Sem policy não há bug de policy.**
**O modelo foi medido, não suposto:** `rolbypassrls` é `true` em `service_role` e `postgres` e
`false` em `anon` e `authenticated` (Sonda 4); RLS está ligada em `storage.objects` e
`storage.buckets` e a lista de policies é nula (Sonda 2); `anon` conta zero objetos (Sonda 3). Com
RLS ligada e nenhuma policy que os alcance, `anon` e `authenticated` recebem zero linha em leitura
e exceção em escrita.
**Alternativas descartadas:** policy por prefixo do dono, pela razão acima; e URL de upload assinada,
descartada no DL-051, o que tornou o modelo literal — **nenhum token de escrita chega ao cliente**.
**Implicações:**
- **O dono não lê o próprio documento direto do Storage**, nem com sessão válida. A regra de
  autorização mudou de lugar, do Postgres para a rota de servidor. Isso não contraria
  `docs/06-PERMISSOES.md` linha 75; muda onde a regra é aplicada.
- **O pré-voo de toda migration de storage aborta com qualquer policy em `storage.objects`**, sem
  filtrar por nome de bucket: policy sem filtro de `bucket_id` alcança todos os buckets e é
  exatamente a forma que os templates do painel do Supabase geram.
- ⚠️ **A regra muda quando o segundo bucket nascer.** Foto de perfil é pública e é F4/S7 (R-019):
  a partir dela, "zero policy em `storage.objects`" deixa de ser verdade e vira **"nenhuma policy
  sem filtro de `bucket_id`"**. Os dois lugares que afirmam o contrário — o pré-voo 1.3 da `0003` e
  a Sonda 2 — mudam juntos, no mesmo dia, e isso está anotado nos dois arquivos.
**Status:** ✅ aplicada


---

### DL-055 — O passo 8 da rota de upload grava com a sessão do usuário, para que a trilha diga quem mexeu
**Data:** 31/08/2026 · **Fase/Task:** F3/S2 · T-008 / R-031 (SEC-051) · **Commit:** _(esta branch)_
**Contexto:** o contrato de oito passos da seção 2.b da `0003` é explícito no passo 7 ("escrever no
bucket com `service_role`") e **omisso no passo 8** ("só então gravar a linha"), que não diz com
qual cliente. A omissão não é neutra: com `service_role` a RLS não se aplica, `auth.uid()` é nulo,
e o `insert into audit_logs` do trigger de revalidação grava **`actor_id = null`**. A trilha
passaria a dizer que o perfil voltou para a fila **sem dizer quem trocou o documento**.
**É uma regressão que ninguém decidiu.** No desenho antigo, de URL assinada, quem gravava era a
sessão do usuário e o `actor_id` saía certo; a arquitetura nova do DL-051 apagou esse dado por
efeito colateral, e o mesmo arquivo gasta 18 linhas explicando que "quem abriu o RG do fulano em
março?" precisa de resposta.
**Decisão:** **o passo 8 grava com a sessão do usuário.** `service_role` fica **só** no passo 7,
que escreve os bytes no bucket. São dois clientes na mesma rota, de propósito, e o de maior
privilégio tem o menor alcance.
**Alternativas descartadas:** gravar tudo com `service_role`, que era o caminho de menor esforço e
o que a omissão produziria por inércia. Custa o `actor_id` de toda troca de documento, num sistema
em que a validação profissional é o produto.
**Implicações:**
- A linha passa a ser escrita **sob RLS**, então a policy de UPDATE de `perfil_privado` tem que
  alcançar o próprio dono. Ela alcança (`0002`, policy do dono), e **a rota tem que falhar
  ruidosamente se não alcançar** — nunca cair para `service_role` como plano B.
- ⚠️ **Esbarra no R-029:** a guarda `recusar_dado_de_estabelecimento_em_pessoa_fisica` levanta em
  **todo** UPDATE da linha de quem trocou de `clinic` para `vet` sem limpar as três colunas,
  inclusive neste passo 8, que nem toca nelas. O caminho legítimo do upload quebra para essa conta,
  e a mensagem não diz como sair. **Os dois assuntos se encontram dentro da T-008.**
- **O R-031 não fecha com esta decisão.** Ele só fecha quando o texto do passo 8, dentro da
  `0003`, disser isto — porque é esse arquivo que a `0004` vai copiar como modelo.
**Status:** ✅ decidida em 31/08 · ⬜ **não escrita na `0003` ainda** · critério no card da T-008


---

### DL-056 — O corte escrito foi acionado: os editores de perfil saem da S3 e vão para a F6/S11
**Data:** 16/09/2026 · **Fase/Task:** F3/S3 · T-019 · **Commit:** _(esta árvore)_
**Contexto:** na abertura da S3, em 09/09, o `03-TAREFAS.md` registrou um corte **condicional e
escrito de antemão**, em duas passagens do arquivo: *"se em 15/09 a T-008 não estiver fechada, os
editores de perfil da S3 escorregam para a F6/S11 e isso vira linha em `05-DECISOES.md`, não
improviso de sexta."* A condição existia porque a conta não fechava: restavam 13 dias de F3 e
dentro deles cabiam a dívida da S2 (T-007, T-008), a S3 inteira e a S4 inteira. Em 16/09 a
contagem é pior: **restam 6 dias**, a T-007 está implementada e aprovada mas **não commitada**, a
T-016 está implementada e **em revisão**, e a **T-008 não começou, nem uma linha**. O último
commit da `main` é de 09/09 e a última linha de **código** commitada é de 31/08.
**Decisão:** **o corte foi acionado, pelo Elber, em 16/09.** Os editores de perfil das três
personas (`/app/responsavel/perfil`, `/app/veterinario/perfil`, `/app/estabelecimento/perfil`)
saem da F3/S3 e passam a viver na **F6/S11**, com card próprio — **T-019**, na seção 🌱
*Plantadas para fases futuras* do `03-TAREFAS.md`. Os 6 dias que restam ficam **inteiros** para
T-007, T-008 e T-016, que são os itens 1, 2 e 3 do Definition of Done da F3.
**Alternativas descartadas:**
- **(a) Manter os editores na S3 e torcer.** É o que produz a semana 13 descobrindo o atraso da
  semana 4. O corte foi escrito justamente para não depender de coragem na sexta-feira.
- **(b) Comer buffer da S13.** Recusada, e é a linha mais importante deste DL: **o buffer está
  intacto e vai continuar assim.** Ele é o que separa entrega de desastre num prazo fixo, e
  gastá-lo em trabalho que não é de DoD seria gastá-lo no item errado.
- **(c) Mandar para a F4.** Recusada: a F4 é o motor B2C e já tem quatro semanas cheias. A S11 é
  onde a auditoria completa de RLS lê exatamente as policies de UPDATE que o editor exercita —
  as duas coisas na mesma passada, e não em duas.
**Implicações:**
- ✅ **NÃO é corte de escopo contratado, e isto foi conferido contra o `00-ESCOPO.md`, não
  suposto.** O §2 não cita editor de perfil em nenhuma das seis capacidades: E2 é descrita pelo
  **onboarding** e E5 é perfil **público**, que é leitura. Nenhum dos 6 itens do DoD da F3
  depende do editor. **Logo, não há emenda a fazer no §5, e a linha "o que sai em troca" não se
  aplica: nada contratado saiu.** A entrega de 25/11/2026 continua inteira.
- É o mesmo precedente de **foto de perfil** e **horários**, cortados da S2 em 26/08 pela mesma
  razão e pelo mesmo teste (R-019, e §Ideias do `04-RISCOS.md`).
- ⚠️ **O corte não salva a F3, e o quadro não vai fingir que salva.** A T-008 é o único item da
  fase sem uma linha escrita, e sem ela o item 3 do DoD não fecha nem com a S4 perfeita: o
  bucket está vazio e o admin não tem o que abrir. O corte comprou dias; gastá-los é outra
  coisa.
- ⚠️ **O DL-046 fica com uma promessa a descoberto até a S11:** *"enquanto espera, ele edita o
  perfil"*. Quem está em `pending_validation` alcança `/app/*/perfil` pela matriz §4 e a tela
  continua casca até a F6. **Alcançar não é editar**, e a matriz não mudou — o que mudou foi
  quando a tela para de ser casca.
- Voltar este trabalho para dentro da F3 ou da F4 por inércia é exatamente o que este DL existe
  para impedir. Volta por decisão do Elber, registrada, ou não volta.
**Status:** ✅ aplicada

---

### DL-057 — T-007 e T-016 sobem juntas, e é isso que dispensa o conserto 🔴 do R-047
**Data:** 16/09/2026 · **Fase/Task:** F3/S3 · T-007 + T-016 / R-047 · **Commit:** _(esta árvore)_
**Contexto:** o R-047 registra que uma conta `clinic` que clicou em "Concluir" na Server Action
inline que está em produção ficou com `onboarding_completed = true` e `status = 'incomplete'`,
sem linha em `clinic_profiles`. Ela era invisível porque `app/app/page.tsx:20` roteava pela
coluna `onboarding_completed`: via `true`, mandava a conta para o painel, e o painel não lia
`status`. O conserto previsto era um `update` de linha em produção, **🔴, sessão presencial**. Ao
executar a T-016, o `vetria-backend` percebeu que o roteamento por `profiles.status` muda o
destino dessa conta e **levantou a questão por escrito sem decidir**, que é o comportamento
correto: ordem de deploy é do `vetria-maestro`.
**Decisão:** **as duas sobem juntas, no mesmo push.** Com o `/app` da T-016 roteando por
`status`, a conta órfã é mandada para o **onboarding novo** da T-007, cujo guard aceita
`incomplete`; ela conclui pela RPC, o `status` vai para `pending_validation`, e ela entra na fila
de validação. **O `update` 🔴 deixa de ser necessário e o conserto passa a ser código já escrito,
que acontece no próximo login da pessoa.**
**Junto com a decisão, duas travas, porque decisão sem trava é intenção:**
1. ⛔ **Ponto de decisão em 18/09, fim do dia.** A T-016 está em revisão de segurança e pode
   voltar com correção; amarrar sem prazo é como o atraso de um card vira atraso de dois. Se até
   lá a revisão não tiver fechado, **vale o plano B: a T-007 sobe sozinha e o `update` 🔴 volta
   para a mesa.**
2. 🚫 **A T-016 sozinha antes da T-007 é proibida.** Em produção o onboarding do estabelecimento
   ainda é a página velha, com a Action inline que grava `onboarding_completed` sem mover o
   `status`. Roteando por `status` contra ela, a conta conclui, volta para `/app`, é mandada de
   novo para o onboarding, e **gira** — e o laço alcança **toda** conta `clinic` incompleta, não
   só as órfãs. A ordem inversa troca uma conta parada por uma conta em laço.
**Alternativas descartadas:** subir a T-007 sozinha e já, que é tentador porque ela está
aprovada desde 15/09 e é o item 1 do DoD para `clinic`. Custa uma sessão presencial 🔴 para um
`update` numa semana em que há 6 dias e a T-008 não começou — e as duas tasks são 🟡, esperam o
mesmo gesto do Elber e cabem na mesma sentada.
**Implicações:**
- ⚠️ **A medição do R-047 CONTINUA VALENDO e não foi dispensada.** Ela deixou de decidir *como se
  conserta* e passou a dizer *quantas contas dependem do conserto*. **Zero** fecha o risco na
  hora. **Mais que zero** é o tamanho do conjunto que se cura no próximo login — e sem o número,
  "se cura sozinho" é fé, que é o modo de falha do R-035. **Muito mais que zero** levanta uma
  pergunta sem dono: avisar essas pessoas por email. Isso é card, e ninguém abriu, porque
  ninguém contou.
- O `vetria-backend` tentou rodar o `select` em 16/09 e o ambiente **recusou acesso a dado de
  produção**. Não há caminho de agente para essa linha: **é do Elber**, e é o mais barato dos
  gestos que faltam.
- **A regra generaliza, e já estava escrita no card da T-008:** antes de qualquer deploy que mude
  roteamento de onboarding, conta-se primeiro. Falha sem sintoma só se descobre contando.
**Status:** ✅ decidida · ⬜ nenhum dos dois diffs commitado

---

### DL-058 — `/ajuda` alcança `pending_validation`: a matriz respondeu a lacuna que o deny by default cobriu
**Data:** 16/09/2026 · **Fase/Task:** F3/S3 · T-016 · **Commit:** _(esta árvore)_
**Contexto:** ao codificar a matriz §4 de `06-PERMISSOES.md` célula por célula, o
`vetria-backend` encontrou uma rota que **não estava em célula nenhuma**: `/ajuda` não aparecia
nem na coluna "Alcança" nem na de "Bloqueado", para nenhum status. Ele aplicou **deny by
default** (`SO_ATIVO`, só `active` alcança), que é a regra da casa, e **registrou por escrito que
era escolha e não leitura** — foi esse registro que tornou esta decisão possível. O custo da
escolha ficou explícito no próprio handoff: quem espera validação não alcança a tela onde
procuraria o suporte.
**Decisão:** **`/ajuda` entra em "Alcança" para `pending_validation`.** A linha foi escrita na
matriz §4, com o porquê. `incomplete` continua alcançando **só** `/onboarding` e `suspended`
continua alcançando **só** `/bloqueado`.
**Por quê, nos dois testes que esta matriz aplica:**
1. **Não é benefício pago.** `/ajuda` é FAQ mais o email `contato@vetriabrasil.com.br`
   (`components/app/cascas.tsx:241-275`). Não expõe lead, contagem de contato, plano, agenda nem
   exposição na busca. **Nada vaza de um painel para o outro**, que é o único motivo pelo qual o
   isolamento existe: ele é modelo de negócio, não tema de segurança.
2. **Quem espera validação é exatamente quem tem pergunta.** Fechar o suporte para quem já
   mandou o documento e está parado na fila produz email por outro canal, ou desistência.
**Alternativas descartadas:**
- **Manter `SO_ATIVO`**, que era o estado do código. Defensável enquanto a matriz era omissa,
  indefensável depois de alguém perguntar.
- **Abrir também para `incomplete`**, que puxaria o chrome inteiro do painel para quem nem
  preencheu o cadastro. O caminho de suporte dele é a própria tela de onboarding.
- **Abrir para `suspended`.** A tela de bloqueio tem que ser **terminal**: destino que
  redireciona para outro destino bloqueado é laço de redirect. O contato mora dentro dela.
**Implicações:**
- **A matriz mudou primeiro, e o código muda depois.** É uma linha: `/ajuda` sai de `SO_ATIVO` e
  passa a `ESPERANDO_OU_ATIVO` no mapa de status por segmento de `lib/auth/status.ts`, nos dois
  painéis.
- ⚠️ **Não entra no diff da T-016 agora:** ele está **em revisão de segurança neste momento**, e
  mexer no artefato que o auditor está lendo invalida a revisão. Entra na mesma passada que
  tratar o que a revisão devolver, e **volta ao `vetria-seguranca` como delta explícito mesmo se
  a revisão voltar limpa**, porque alarga uma permissão. Custo: uma releitura curta.
- Se não couber antes de 18/09, **a T-016 sobe com `SO_ATIVO`** e a linha vira ajuste de uma
  linha na semana seguinte. A matriz já está escrita, e é ela que manda.
- **Deny by default continua sendo a regra.** Rota de painel que não estiver na tabela §4
  continua nascendo `SO_ATIVO`, e a saída continua sendo escrever a linha na matriz antes de
  mexer no código. O que mudou é que esta linha deixou de ser lacuna.
**Status:** ✅ decidida na matriz · ⬜ **código ainda não alterado** — critério no card da T-016

---

### DL-059 — A F3 fecha com 5 de 6 itens do DoD, e o roadmap diz "em andamento", não "concluída"
**Data:** 20/09/2026 · **Fase/Task:** F3 / fechamento de fase · **Commit:** `eb6e2d6` (o código);
esta passagem de docs, para o registro
**Contexto:** o PR #2 entrou na `main` em 20/09 com T-007, T-016 e T-008, e o `vetria-maestro`
percorreu o Definition of Done da F3 item por item, exigindo prova de cada um. **Cinco fecharam
com medição escrita** — prova em tela do Elber com conta real (9 navegações do portão, upload
ponta a ponta, `select` das três colunas do documento, R-047 medido zero) e o CI rodando **40
testes verdes** pela primeira vez. **O item 3 — *admin aprova, o profissional entra no dashboard
e recebe o email* — não tem uma linha escrita.** `/admin/validacoes` continua casca. A pergunta
que sobrou foi: a F3 se declara concluída assim mesmo, ou não?
**Decisão do Elber, com recomendação do `vetria-maestro`: a F3 NÃO se declara concluída.** Ela
fica **em andamento, 5 de 6**, e o item 3 vai para a **S4** — que é exatamente onde o
`01-PLANO.md` §S4 sempre o colocou. **Não é escorregão de escopo:** é a fase acabando com a
semana que faltava dentro dela.
**Por quê, nas duas razões que sustentam isto:**
1. **Forçar o item 3 em dois dias é repetir o que produziu a dívida da S2.** Código escrito no
   limite, sem tempo de prova, parado na árvore. O custo disso está medido: **a `main` ficou 20
   dias sem receber código**, de `e07f967` (31/08) a `eb6e2d6` (20/09). O item 3 escreve
   `profiles.status` de terceiro e dispara email — é o tipo de coisa que não se prova com pressa.
2. **Declarar "concluída" com 5 de 6 é o R-034 outra vez.** Doc que afirma mais do que aconteceu
   é o mecanismo pelo qual este projeto já perdeu duas auditorias de vista e dimensionou task
   errada. **Fase não fecha por gentileza.**
**Alternativas descartadas:**
- **Empurrar o item 3 para a F4.** Recusada: a F4 é o motor B2C, e **busca sem validação é busca
  vazia** — o `00-ESCOPO.md` §2 E4 diz *"só aparece quem tem `status = active`"*, e hoje **nada
  no produto move alguém para `active`**. Adiar o item 3 é adiar a F4 inteira, sem dizer isso.
- **Declarar a fase concluída e abrir um "card residual".** Recusada pelo nome: card residual é
  como item de DoD vira dívida sem dono.
- **Cortar o email e fechar o item 3 só com o `status`.** Recusada: o item 3 diz *"e recebe o
  email"*, os 3 emails do app já estão versionados esperando esta fase, e o Resend já está
  verificado. Cortar aqui economizaria horas e custaria o critério.
**Implicações:**
- **O `/roadmap`, que é a janela dos donos, passa a dizer F3 EM ANDAMENTO — 5 de 6, item 3 na
  S4.** A regra da casa manda ressincronizar o roadmap a cada fechamento de fase; **esta fase não
  fechou**, então o que muda é o andamento, não o carimbo. **É código (`app/roadmap/page.tsx`) e
  não foi editado nesta passagem** — está no handoff, com o texto sugerido.
- **A S4 abre com o item 3 no topo**, partido em dois cards por dependência real: **T-023** (ler
  a fila e abrir o documento) e **T-024** (aprovar, reprovar com motivo, email e `audit_logs`).
- **O buffer da S13 continua intacto.** Nada foi empurrado para fora da F3 por esta decisão: o
  item 3 estava na S4 desde o `01-PLANO.md` original.
- ⚠️ **O que esta decisão NÃO resolve:** a **T-017** (🔴, migration) continua sem data pela quarta
  semana seguida, e o prazo duro dela é **dentro da F3**. Se a F3 terminar sem ela, isso vira
  decisão nova e explícita, não silêncio.
**Status:** ✅ decidida

---

### DL-060 — A varredura de órfãos entrega dado, não veredito, e vive num lugar só
**Data:** 21/09/2026 · **Fase/Task:** F3/S4 · T-021 / SEC-083 · **Commit:** `53fa96c` _(na `main` local, não empurrado)_
**Contexto:** a única rede sob o buraco que a T-008 aceitou por escrito — o processo morrer entre
o passo 7 (objeto no bucket) e o passo 8 (linha no banco) — é um `select` operado por gente, sem
cron, escrito no card da T-008. Esse `select` tinha uma coluna `classe` que decidia por comparação
de tempo: se o objeto era mais novo que `documento_enviado_em`, era órfão; se era mais velho, era
*"versão anterior de reenvio (esperado)"*. **O caso normal de falha produz o órfão mais VELHO**
(sobe A às 10:00, o processo morre, sobe B às 10:05 e o 8 grava o caminho de B), então a rede
rotulava como esperado exatamente o que ela existe para pegar. A causa não é o `case`: **é que
nenhuma tabela do projeto guarda histórico de caminhos**, e tempo é tudo que a consulta tem.
**Decisão:** a varredura **parou de classificar**. A coluna `classe` saiu e a consulta devolve
`caminho`, `dono_uuid`, `created_at`, `bytes`, `dono_ainda_existe`, `caminho_atual_da_linha` e
`enviado_em_da_linha`. Duas leituras continuam mecânicas e ficaram escritas no card (conta apagada
é `dono_ainda_existe = false`; órfão do passo 8 é `caminho_atual_da_linha is null`); **a terceira
é humana e fica humana**, porque órfão do passo 8 e versão anterior de reenvio têm a mesma
aparência no banco de hoje. E **a consulta passou a viver num lugar só**, o item 3 da seção 🔒 do
card da T-008: quem precisa dela aponta, ninguém copia.
**Alternativas descartadas:**
- **Criar tabela de histórico de caminhos** (a saída (b) da SEC-083), que tornaria a classificação
  correta de verdade. Recusada aqui, não para sempre: **é migration, logo 🔴**, e a T-021 era 🟢 de
  doc. Fica escrita nos cards da T-008 e da T-018 como a **única** saída possível, sem virar card:
  criar tabela é decisão do Elber.
- **Consertar o `case` — inverter a comparação ou somar uma tolerância.** Recusada: qualquer regra
  de tempo continua sendo palpite apresentado como rótulo, e **rótulo errado é pior que coluna
  ausente**, porque quem varre confia nele e para de olhar.
- **Corrigir as duas cópias da consulta**, uma em cada card. Recusada: é o **R-039** e o **R-017**
  pela quarta vez. Clone herda defeito; duas cópias certas hoje são duas cópias divergentes em
  seis semanas.
**Implicações:**
- **Consulta de operação não afirma o que o schema não sustenta**, e isso passa a valer para as
  próximas: a coluna que o banco não consegue provar **não existe**, e a leitura vai escrita em
  prosa ao lado do SQL.
- **O cast sai do `left join`.** `split_part(o.name,'/',1)::uuid` num `join` era avaliado sem
  garantia de ordem contra o filtro de `bucket_id`, e **um objeto fora da convenção derrubava a
  varredura inteira**. Agora o cast vive numa CTE `materialized` cujo `where` filtra `bucket_id` e
  um `~*` de uuid. **Isso cria um ponto cego** — objeto fora da convenção some da lista — e por
  isso a varredura virou **duas** consultas: a segunda, de uma linha, lista o que a primeira
  esconde. **Zero linha nas duas é a medição; uma sem a outra não é.**
- ⚠️ **Havia uma TERCEIRA cópia, e ela era a pior:** o item 6 do card da T-008, que é o texto que
  a **`0004` tem que copiar palavra por palavra** para dentro de uma migration, afirmava *"a
  consulta classifica, e quem varre não confunde as duas coisas"*. A SEC-083 apontou duas cópias e
  o card da T-021 pediu duas. **Se a `0004` tivesse sido escrita antes desta task, a promessa
  errada estaria hoje num arquivo aplicado em produção**, e migration aplicada é histórico: não se
  edita. **Doc que vira comentário de migration tem prazo de validade, e o prazo é o próximo
  deploy de banco.**
- **O R-042 e o R-023 continuam ABERTOS.** Esta decisão conserta a consulta, não o bucket:
  **ninguém rodou a varredura**, e neste projeto risco fecha por medição, não por texto.
**Status:** ✅ aplicada nos dois cards · ⬜ **a medição que ela habilita continua pendente** (Elber,
SQL Editor, lista de medições da S4)
