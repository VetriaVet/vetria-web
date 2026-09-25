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

### DL-061 — As três decisões que travavam a T-024: menor privilégio, validação no servidor e `server-only`
**Data:** 23/09/2026 · **Fase/Task:** F3/S4 · T-024, T-022, SEC-092, SEC-088, SEC-089 / R-058
**Quem decidiu:** o Elber delegou (*"decida por mim, o que for melhor pro projeto e o que se usa
normalmente no mercado"*), e a escolha seguiu o padrão de mercado nas três.
**Decisão:**
1. **SEC-092 → (a).** O detalhe `/admin/validacoes/<uuid>` só abre conta em
   `pending_validation`. Moderação de quem já está `active` ganha tela própria quando existir.
   **Por quê:** menor privilégio é o padrão, e a LGPD cobra finalidade: o dossiê existe para
   validar, então só abre enquanto há validação. Ampliar depois é fácil; recolher acesso que já
   foi usado não é. **A matriz §5 muda antes do código**, dentro da T-024.
2. **T-022 / SEC-088 → (a).** A Server Action recusa concluir o onboarding sem documento.
   **Por quê:** validação que só existe no cliente não é validação, e em 23/09 a prova em tela
   mostrou 3 de 4 contas na fila sem documento. As 3 existentes seguem na fila com o badge âmbar,
   que continua útil para elas; conta nova não entra mais assim.
3. **R-058 / SEC-089 → (a).** `import "server-only"` em `lib/supabase/admin.ts`. **Por quê:** é
   a prática recomendada do Next.js para módulo com segredo; transforma "a chave de
   `service_role` nunca vai pro cliente" de disciplina em erro de build. É dependência nova (🟡),
   autorizada por esta decisão.
**Alternativas descartadas:** (b) nas três. Acesso amplo com trilha é aceitável, mas é mais
superfície para o mesmo trabalho de hoje; a fila tolerando "sem documento" para sempre normaliza
dado incompleto; e deixar o `server-only` para depois é deixar a única barreira da chave mais
sensível do projeto como convenção.
**Consequência:** a T-024 deixa de estar travada. Os itens 1 e 3 entram nela; o item 2 é a T-022,
que anda junto ou antes.
**Status:** ✅ aplicada na T-024 (`6a8d86a`, em produção em 23/09)

---

### DL-062 — A F3 encerra com 5 de 6 e o item 5 parcial, a F4 começa, e a T-017 entra na T-027
**Data:** 23/09/2026 · **Fase/Task:** fechamento da F3 · abertura da F4/S5 · T-017, T-027, T-029, SEC-091
**Quem decidiu:** o `vetria-maestro`, a pedido do Elber (*"quero partir e atualizar o roadmap desta fase e das
próximas"*). O item 4 (SEC-091) é recomendação **aceita pelo Elber em 23/09**. Os itens 1, 2, 3 e 5 valem como
decisão de fechamento de fase e **se confirmam na leitura deste diff**; se o Elber discordar, outro DL revoga este.
**Contexto:** em 23/09 a T-024 entrou na `main` (`22fbefd..6a8d86a`) depois de provada em tela pelo Elber:
aprovar, reprovar com motivo, email recebido, `audit_logs` com o `actor_id` do admin. Com isso o **item 3 do DoD
fechou**, e o item 4 fechou ao pé da letra com conta `tutor`. O DoD ficou assim, item por item, com prova:
**1** ✅ · **2** ✅ · **3** ✅ · **4** ✅ · **5** 🟡 · **6** ✅. O item 5 (*"E2E cobrindo 1 a 4 passando em CI"*)
cobre os itens 2 e 4; **os itens 1 e 3 não têm E2E**, porque os dois precisam de conta nova a cada rodada e o
**R-033** (onde criar essa conta) não tem resposta desde 28/08. O `01-PLANO.md` diz *"não avança sem passar"*, e o
calendário diz que a F4 começa hoje. E o DL-059 deixou escrito que, se a F3 terminasse sem a T-017, isso viraria
decisão explícita, não silêncio. Terminou sem ela.
**Decisão:**
1. **A F3 ENCERRA em 23/09 com 5 de 6 itens fechados e o item 5 PARCIAL. Não se declara "concluída".** A contagem
   honesta é **5 de 6**, e não "6 de 6 com ressalva" nem "5,5 de 6": item parcial é item não feito, e contar metade
   como inteiro é o R-034 com outra roupa. O `/roadmap` diz *"5 de 6 comprovados, falta automatizar dois testes"*.
2. **A F4 começa hoje assim mesmo**, porque o item 5 não trava nada da F4. É a diferença exata para o DL-059: lá o
   item que faltava (aprovar) era pré-requisito da busca (*"busca sem validação é busca vazia"*); aqui o que falta é
   **rede de teste**, não capacidade. Segurar a F4 por ele queimaria a semana 5 esperando uma decisão de infra.
3. **O item 5 não vira "card residual" sem dono** (a alternativa que o DL-059 recusou pelo nome). Vira a **T-029**,
   com dono (`vetria-qa`), decisão com dono (o Elber escolhe a saída do R-033) e **data dura: 06/10, fim da S6**. A
   parte que não depende de infra (persistência por reedição, pelo caminho da T-025) anda já. **A F3 só passa a
   "concluída" no dia em que o CI rodar os itens 1 e 3 verdes.** Se 06/10 chegar sem isso, é DL novo, não silêncio.
4. **SEC-091 (trilha de leitura do dossiê) fica para a F6/S11**, junto com a auditoria completa de RLS e o
   inventário de operadores. Motivo: a exposição pela **tela** caiu com a SEC-092(a) (o detalhe só abre quem está na
   fila); a exposição pelo **PostgREST** fecha na T-027 com a SEC-097(b). O que sobra é registrar *leitura*, que pede
   desenho (trilha por abertura de página? por consulta?) e cabe melhor onde a LGPD inteira é tratada. **Enquanto só
   o Elber for admin, o risco é teórico**; a trava da T-027 e da T-032 (antes do primeiro admin comum) cobre o
   intervalo.
5. **A T-017 deixa de ser card próprio e entra na T-027**, uma migration só (`0004`). Motivo: as duas mexem nas
   mesmas tabelas, pedem a mesma sessão presencial, a mesma auditoria e o mesmo backup; separadas, seriam duas
   rodadas de auditoria sobre o mesmo arquivo. A medição de 23/09 (`PATCH estado='ZZ'` aceito e restaurado) passa
   para a T-027 como a prova de antes. **Uma exceção, por dependência real:** a lista fechada de *especialidades* e
   *serviços* não vira CHECK na `0004`, porque a F4/S5 cria as tabelas de apoio (T-028) e a fonte da verdade passa a
   ser a tabela. Escrever a lista em CHECK agora e em tabela na semana seguinte é o R-039 (duas cópias) nascendo de
   propósito. O **teto de tamanho** dos arrays entra na `0004`; a **pertença à lista** entra na `0005`.
**Alternativas descartadas:**
- **Declarar a F3 concluída com o item 5 "parcial declarado".** Recusada: é a frase exata que o R-034 proíbe.
- **Manter a F3 aberta e não começar a F4.** Recusada: o que falta é decisão de infra (R-033), não trabalho da fase,
  e o prazo de 25/11 não tem folga para uma semana parada.
- **Mandar o item 5 para a F6** (DoD da F6 item 2, *"suíte E2E completa"*). Recusada: seria empurrar dívida da F3
  para a fase de endurecimento sem dizer, e a F4 precisa da mesma infra para o E2E dela (DoD da F4 item 5).
- **T-017 ao lado da T-027, em migrations separadas.** Recusada pelo custo de auditoria dobrado. A `0002` levou
  quatro rodadas; ninguém ganha com duas `0004`.
**Implicações:**
- **A S5 abre hoje, 23/09**, e volta a bater com o calendário do `01-PLANO.md` (S5 = 23/09 a 29/09). O rótulo
  "S4 aberta em 21/09" registrava cinco dias de deriva; a deriva não some, **vira dívida nomeada** (ver
  `01-PLANO.md` §Atraso).
- **🔴 A sessão presencial da T-027 (e da T-028, se couber) precisa acontecer até 29/09.** O prazo duro que era da
  T-017 continua valendo: antes da F4/S7 (07/10), quando `clinic_profiles.site` vira link em página pública.
- **Item 6 do DoD segue ✅ ao pé da letra** (zero achado de severidade 🔴), mas nada esconde que há 🟠 abertos com
  trava escrita: R-039, SEC-096, SEC-097(b), SEC-081, R-057, SEC-102, SEC-103.
**Status:** ✅ decidida (itens 1, 2, 3 e 5 pelo `vetria-maestro`, confirmar na leitura do diff) · ✅ item 4 aceito
pelo Elber

---

### DL-063 — Abrir para profissional de fora tem portão com lista fechada, e a Cloudflare não entra
**Data:** 23/09/2026 · **Fase/Task:** F4/S5 · SEC-102 a SEC-105, SEC-081, T-020, T-027, T-031, T-032, T-033
**Quem decidiu:** o `vetria-maestro`, sobre a avaliação `docs/relatorios/SEC-2026-09-23-rate-limit-captcha-2fa.md`,
pedida pelo Elber (*"estamos seguros?"*). Confirmar na leitura do diff.
**Contexto:** três cards já carregavam a mesma trava escrita de jeitos diferentes (*"antes do primeiro profissional
de fora"*, *"antes do primeiro admin comum"*, *"antes de abrir"*), e a avaliação de 23/09 somou mais quatro. Trava
espalhada em card é trava que ninguém confere no dia. E o login, o cadastro e a recuperação de senha **não passam
pelo nosso servidor**: o navegador fala direto com o Supabase, então firewall de borda não os protege.
**Decisão:**
1. **Existe um "portão de abertura", com lista fechada.** Nenhum profissional que não seja conta de teste recebe
   convite, link de cadastro ou LP publicada antes de os itens abaixo estarem **provados** (não escritos):
   - **T-027** — a `0004` aplicada (T-017 + SEC-096 + SEC-097b + SEC-098 + SEC-093 + formato do CRMV)
   - **T-020** — teto de volume do bucket **mais** a regra de rate limit do firewall da Vercel em `/api/documentos/*`
   - **T-031** — captcha Turnstile nas 6 telas de auth (SEC-102)
   - **T-032** — 2FA TOTP obrigatório para admin e master, na tela **e** no `is_admin()` (SEC-103). Trava própria,
     mais cedo: **antes do segundo admin**, mesmo que a abertura atrase
   - **T-033** — cabeçalhos de segurança no `next.config.ts` (SEC-104)
   - **SEC-105** — senha mínima 8 no painel do Supabase (gesto do Elber, 1 minuto, sem card)
2. **Prazo do portão: 20/10, fim da F4.** Motivo por dependência: a F5 publica as LPs, e **o CTA de toda LP leva ao
   cadastro**. LP no ar com o portão aberto é convite a quem quiser esgotar o teto de email do projeto (SEC-102).
3. **Ordem obrigatória nos dois 🔴 de auth:** captcha e 2FA são **código primeiro, deploy, e só então ligar no
   painel** (ou aplicar o `is_admin()` com `aal2`). Na ordem inversa ninguém entra, nem o Elber. O Elber cadastra o
   próprio TOTP **antes** da migration do `is_admin()`.
4. **Cloudflare: não.** A Vercel já tem firewall, DDoS e BotID básico; Cloudflare na frente da Vercel traz problema de
   cache, SSL e IP do visitante e **não veria o tráfego de login**, que vai direto ao Supabase. **Só o Turnstile
   interessa, e ele funciona sem a Cloudflare na frente.** **Upstash: não agora**, só se um dia precisar de limite
   por usuário.
**Alternativas descartadas:** Cloudflare como proxy (acima); hCaptcha (funciona igual no Supabase, mas o Turnstile é
grátis e quase sempre invisível, o que custa menos conversão no cadastro); 2FA obrigatório para profissional
(aumenta abandono sem ganho à altura; fica opcional, depois da entrega, em §Ideias); CSP completa com nonce agora (1
dia, fica para a F6; a T-033 entrega o que fecha o clickjacking do botão *Aprovar*).
**Implicações:**
- O `02-ESTADO.md` passa a mostrar o portão como lista de checagem, e o `/roadmap` ganha na F4 o item *"Proteções
  antes de abrir para profissionais de fora"*.
- **Nada disto é escopo novo:** os seis itens apontam para E2 (cadastro), E3 (admin) e para a transversal
  **Segurança** do `00-ESCOPO.md` §2. Não há emenda. **Mas é trabalho que o plano original não tinha**, estimado em
  ~3 dias de backend, e ele entra na F4 junto com a busca. Ver `01-PLANO.md` §Atraso.
**Status:** ✅ decidida pelo `vetria-maestro`, confirmar na leitura do diff · ⬜ portão: 0 de 6 provados

### DL-064 — Um projeto Supabase só de teste (`vetria-e2e`), que também serve de ensaio para toda migration
**Data:** 23/09/2026 · **Fase/Task:** F4/S5 · T-029, R-033, T-027
**Quem decidiu:** o Elber delegou (*"decida por mim, pro meu cenário de programador e disponibilidade"*).
**Contexto:** em 23/09 o CI quebrou porque a prova em tela da T-024 aprovou a conta que o CI usa. É a segunda vez
que testar em produção morde (R-033). E toda migration até hoje foi aplicada direto em produção, com backup antes.
**Decisão:** opção A do `vetria-qa`. Criar o projeto `vetria-e2e` (plano grátis), aplicar `0000` a `0003` e cada
migration nova, e apontar o CI para ele. **O ganho que decide, para quem programa sozinho:** o mesmo projeto vira o
**ensaio de toda migration** (T-027, T-028): aplica-se lá, roda-se o CI, e só então em produção. Um projeto resolve
dois problemas. A `service_role` **do projeto de teste** entra como secret do CI; **a de produção, nunca**. O
`ci.yml` troca a frase "NUNCA service_role" por "nunca a de produção" no mesmo commit da T-029.
**Custo aceito:** cada migration passa a ser aplicada duas vezes (teste, depois produção), minutos a mais por
migration. Menor que um CI quebrado ou uma migration errada em produção.
**Alternativa descartada:** continuar em produção com contas fixas. Barato hoje, mas não fecha os itens 1 e 3 do DoD
no CI e repete o incidente de 23/09 a cada prova em tela.

### DL-065 — A página pública /roadmap fala a língua do cliente
**Data:** 23/09/2026 · **Quem decidiu:** o Elber delegou. **Decisão:** sem sigla nem termo técnico no /roadmap
(RBAC, onboarding, deploy, design system, admin viram "cada tipo de conta vê só o que é dela", "primeiro cadastro",
"publicação automática", "padrão visual", "equipe Vetria"). A página é vitrine de progresso para quem não programa.

---

### DL-066 — T-027: o que o banco passa a impor ao admin e ao master, e o dado sujo entra como NOT VALID
**Data:** 23/09/2026 · **Fase/Task:** F4/S5 · T-027 (SEC-093, SEC-096, SEC-097b, SEC-098, SEC-099, R-039, R-059)
**Quem decidiu:** o `vetria-backend`, ao escrever a `0004`, porque o card e a SEC-097(b) deixaram a regra do master em
aberto (*"decida e documente o que o master mantém"*). **Proposta: confirmar com o Elber na sessão presencial, antes de
aplicar.** Se ele discordar, cada item abaixo é uma linha na `0004`.
**Decisão:**
1. **Transições de `admin_definir_status`, e mais nenhuma:** `pending_validation → active` (admin e master);
   `pending_validation → incomplete` com motivo não vazio (admin e master); qualquer status `→ suspended` com motivo
   (só master); `suspended →` qualquer outro (só master, reativar). **`active → incomplete` e `active →
   pending_validation` passam a ser recusados para todos**: tirar do ar quem já foi aprovado é moderação, que "ganha tela
   própria quando existir" (DL-061), e o instrumento de hoje é a suspensão, que é do master.
2. **Leitura do perfil de vitrine (`vet_profiles`, `clinic_profiles`):** admin comum lê só alvo com o role da tabela e em
   `pending_validation` (o `active` ele continua lendo pela policy pública, como qualquer visitante). **O master continua
   lendo a linha de qualquer vet/clinic, em qualquer status** ("ver a base inteira", matriz §5): é dado que vira público
   na aprovação.
3. **Leitura do dossiê (`perfil_privado`: CNPJ, razão social, responsável técnico, WhatsApp, telefone, caminho do
   documento):** **só com a conta em `pending_validation`, para admin E master.** É o DL-061 levado ao banco. A tela e a
   rota do documento já aplicam isso ao master desde a T-024; deixar o PostgREST mais largo que a tela seria manter
   aberto por trás o que a tela fechou pela frente, e é o cenário do R-062 (senha de master vazada entrega o dossiê da
   base inteira). Nenhuma tela lê o dossiê fora da fila com a sessão do master. Investigação de fraude sobre conta
   `active` é SQL Editor, fora do produto.
4. **O dado antigo fora da regra nova não trava a migration:** todo CHECK da `0004` nasce `NOT VALID` (vale para toda
   escrita a partir do commit) e é validado em seguida, um por um; o que tiver linha suja fica `NOT VALID` até a linha
   ser corrigida e a seção 8 rodar de novo. Em produção, espera-se só `vet_profiles_crmv_formato` nessa situação (contas
   de teste com "GO-0155" e "GO 1522"). A migration **não corrige dado**: corrigir CRMV como `postgres` dispararia a
   revalidação e tiraria da busca quem estivesse `active`.
**Alternativas descartadas:** manter o master lendo o dossiê de todos (mais superfície para o mesmo trabalho de hoje, e
contradiz o DL-061); exigir a correção do dado antes de aplicar (seguraria um conserto de segurança medido por causa de
duas contas de teste); a migration normalizar o CRMV sozinha (revalidação em massa, trilha falsa em `audit_logs`).
**Consequência:** `docs/06-PERMISSOES.md` §5 ganhou a subseção de 23/09 (T-027). A moderação de conta `incomplete` ou
`suspended` pelo admin comum deixa de ser alcançável pelo PostgREST; não há tela que a use.
**Status:** 🟡 proposta, escrita na `0004` · ⬜ confirmar com o Elber · ⬜ aplicada
**Atualizado em 25/09/2026:** ✅ **aplicada em produção em 23/09** (T-027, sessão presencial com o Elber, que conduziu a aplicação).

---

### DL-067 — O slug: `nome-cidade-uf`, gerado pelo servidor quando a conta vira `active`, e estável
**Data:** 23/09/2026 · **Fase/Task:** F4/S5 · T-028 · R-065, SEC-008
**Quem decidiu:** o `vetria-backend`, ao escrever a `0005`, seguindo o padrão de mercado de diretório profissional. **Proposta: o
card pede que o Elber decida; confirmar na sessão presencial, antes de aplicar.** Cada item abaixo é uma linha da `0005` §5.
**Contexto:** a página pública da S7 é `/veterinario/[slug]` e `/estabelecimento/[slug]`. A coluna `slug` existe desde a `0002`,
nula, e a policy impede o dono de escrevê-la (SEC-008). Desde 23/09 existem contas `active` com `slug` nulo (R-065).
**Decisão:**
1. **Formato:** `<nome>-<cidade>-<uf>`, só `[a-z0-9]` e hífen simples, sem acento (ex.: `dra-ana-souza-goiania-go`,
   `clinica-bicho-feliz-sao-paulo-sp`). Nome é `nome_exibicao` (vet) ou `nome_fantasia` (estabelecimento). O nome é cortado em
   60 caracteres e a cidade em 40, na fronteira de palavra; o todo fica abaixo de 120 (CHECK no banco). Sem nome, a parte do nome
   vira `veterinario` ou `estabelecimento`. Os três pedaços já são públicos na busca: o endereço não revela nada novo.
2. **Unicidade:** por tabela (as rotas são separadas). **Colisão:** sufixo `-2`, `-3`, ... por ordem de chegada; a trava
   `pg_advisory_xact_lock` impede duas aprovações simultâneas de escolherem o mesmo.
3. **Quem gera: o servidor, quando a conta PASSA a `active`**, por trigger em `profiles.status` (aprovação e reativação pelo
   master). **Não** reescreve `admin_definir_status` (a `0004` acabou de reescrevê-la). O dono continua sem escrever o próprio
   slug, e o pré-voo da `0005` para se aparecer policy de escrita que não pine o slug.
4. **Estável:** gerado uma vez e **nunca trocado sozinho**. Mudar o nome ou a cidade não muda o endereço (o nome muda, a conta
   volta para a fila, é aprovada de novo e mantém o slug). Link compartilhado e resultado do Google continuam valendo.
5. **Trocar o slug é gesto manual do master pelo SQL Editor** (ex.: pedido do profissional depois de mudar de nome), e **o link
   antigo deixa de existir** (404). Guardar endereços antigos com redirecionamento 301 fica para quando houver o primeiro pedido
   real (tabela de slugs antigos, mês 4+), registrado aqui para a pergunta não voltar sem este DL.
6. **O que já está gravado (R-065):** a `0005` preenche o slug de toda conta vet/clinic que já está `active`, da mais antiga para a
   mais nova. É o único dado de usuário que ela escreve; o `updated_at` dessas linhas vira a hora da migration.
**Alternativas descartadas:** `nome` sozinho (colide cedo: "ana-souza" de Goiânia e de Belém disputariam o mesmo endereço); `uuid`
ou número no endereço (feio, sem valor de busca, e expõe o id interno); slug que acompanha o nome (quebra link já compartilhado a
cada correção de cadastro); o dono escolher o próprio endereço (squatting de nome, SEC-008); gerar na Server Action da aprovação
(deixaria de fora a reativação do master e qualquer caminho futuro para `active`).
**Implicações:** a S7 lê `slug` e devolve 404 para o que não existe ou não é `active` (a policy pública já esconde). A prévia do
perfil (S7) pode mostrar o endereço, mas só o servidor o grava.
**Status:** 🟡 proposta, escrita na `0005` · ⬜ confirmar com o Elber · ⬜ aplicada
**Atualizado em 25/09/2026:** ✅ confirmada pelo Elber (DL-070 A) e ✅ **aplicada** no `vetria-e2e` e em produção; provada com `larissa-lima-goiania-go`.

### DL-068 — Os dados da busca: listas em tabela, pertença por trigger, cidade por chave normalizada, full-text em português
**Data:** 23/09/2026 · **Fase/Task:** F4/S5 · T-028 · DL-062 item 5, R-059
**Quem decidiu:** o `vetria-backend`, ao escrever a `0005`. Confirmar na leitura do diff.
**Contexto:** a busca da S6 filtra por cidade, especialidade e tipo de atendimento (E4). Hoje as listas de especialidades e de
serviços moram só nos `campos.ts`, e a cidade é texto livre (R-059: "Goiânia / AP" na fila de 23/09). O DL-062 deixou a pertença
à lista para esta migration, "contra a tabela, e não contra uma segunda cópia".
**Decisão:**
1. **`especialidades` e `servicos` são tabelas** (`nome`, `slug`, `ordem`), leitura pública, escrita só por migration. O `nome` é
   **exatamente** o texto que o formulário já grava ("Clínica geral", "Banho & tosa"): a tabela adota o dado que existe, e nenhuma
   linha de perfil precisa mudar. O seed é a lista do `campos.ts`, na mesma ordem.
2. **A pertença é conferida por trigger** (`conferir_itens_de_lista`), porque CHECK não consulta outra tabela e o Postgres não tem
   chave estrangeira em elemento de array. Recusa com 23514 (o código de CHECK que as Actions já traduzem) item fora da lista, nulo
   ou repetido. Confere em todo INSERT e em UPDATE **só quando a lista muda**: linha antiga fora da lista não impede a dona de
   salvar outra coluna, a mesma lógica do `NOT VALID` da `0004`.
3. **`cidades` é a lista oficial do IBGE** (API de localidades, **5571** municípios em 23/09/2026; o 5571º é Boa Esperança do Norte,
   MT, instalado depois da contagem de 5570), carregada por um **seed separado e gerado** (`supabase/seed-0005-cidades-ibge.sql`,
   feito por `supabase/gerar-seed-cidades.mjs`, Node puro, sem dependência nova no app, com o sha256 da fonte no cabeçalho). Chave:
   código IBGE. `chave` e `slug` são colunas geradas.
4. **O perfil continua gravando cidade em texto livre, e a busca casa por chave:** `(estado, chave_de_nome(cidade))` contra
   `(uf, chave)` da lista, onde `chave_de_nome` tira acento, caixa, espaço e pontuação ("goiania " casa com "Goiânia"). **Não** há
   chave estrangeira nem obrigação de cidade da lista agora: o formulário é texto livre, e obrigar quebraria o cadastro. Quem grava
   uma cidade que não existe na UF (o "Goiânia / AP") não aparece no filtro daquela cidade até corrigir; a sonda 6 do
   `verificar-apos-0005.sql` lista essas contas. Trocar o campo de texto por uma lista de cidades da UF é trabalho de tela, para um
   card próprio.
5. **Full-text em português** numa coluna **gerada** `busca` (tsvector com peso: nome, depois especialidades/serviços, depois cidade,
   depois bio), sem acento dos dois lados (`sem_acento`, `translate` com mapa explícito, IMMUTABLE de verdade; a função da extensão
   `unaccent` não é IMMUTABLE e não serve em coluna gerada nem em índice). Só coluna pública entra; `endereco` fica fora enquanto o
   R-032 não decidir.
6. **Índice não é filtro.** A visibilidade continua sendo a policy `*_select_publico` (`perfil_esta_ativo`), intocada. Índices: GIN
   em `busca`, `(estado, chave_de_nome(cidade))` nas duas tabelas, `cidades.chave` para autocompletar, e os GIN de
   `especialidades`/`servicos` que já existem desde a `0002`. Tipo de atendimento (três booleanos) fica sem índice: coluna de dois
   valores não seleciona nada sozinha.
**Alternativas descartadas:** tabela de junção `vet_especialidades` (reescreveria o formulário, a Action e o dado de 31/08 para ganhar
o que o trigger já dá); guardar o `slug` da especialidade no perfil (migração de dado e mudança de código sem ganho para a busca);
`unaccent` com invólucro que declara IMMUTABLE o que não é (funciona até o dicionário mudar); colar 5571 linhas à mão (erro de
digitação vira cidade que não existe); Typesense/Meilisearch (fora do escopo, `00-ESCOPO.md` §3).
**Implicações:** acrescentar especialidade ou serviço é migration (🔴) **mais** a linha no `campos.ts`, no mesmo commit; se só o
`campos.ts` crescer, a pessoa escolhe o item novo e o banco recusa. Os `campos.ts` continuam sendo a fonte da **tela** até a S6 ler
as tabelas, o que só pode acontecer depois da `0005` aplicada (ler antes quebraria a tela em produção). A S6 normaliza o termo com
`sem_acento()` antes do `plainto_tsquery('portuguese', ...)`. **Nomenclatura (resolvida pelo DL-070 item B):** o serviço "Pet shop"
virou "Loja veterinária" (`loja-veterinaria`) no seed da `0005`, antes de ela ser aplicada, junto dos `campos.ts`; o dado já gravado
é renomeado pela §3.1 da `0005`, antes do trigger de pertença.
**Status:** 🟡 escrita na `0005` · ⬜ aplicada
**Atualizado em 25/09/2026:** ✅ **aplicada** (sonda 2 33/33 OK, 5571 cidades).

### DL-069 — A F3 fecha em 6 de 6: o item 5 (E2E no CI) foi medido em 23/09
**Data:** 23/09/2026 · **Fase:** F3 · **Revisa:** DL-062 (que fechou em 5 de 6 com previsão 06/10)
**Fato medido:** com o CI no projeto de teste (DL-064, T-029) e `E2E_EXIGIR_FILA=1` (pulo vira falha), o CI #22 da
PR #4 rodou **70 testes, 70 aprovados, 0 pulados**, incluindo os fluxos que faltavam: cadastro com conta nova e
persistência (item 1) e aprovação/reprovação pelo admin (item 3), em `tests/e2e/fluxos-conta-nova.spec.ts`.
**Decisão:** o item 5 do DoD da F3 está fechado por medição, e a F3 passa a "concluída, 6 de 6". O roadmap público
muda no mesmo commit.

### DL-070 — As decisões A a F da busca e do perfil público (o Elber: "de acordo com tudo")
**Data:** 23/09/2026 · **Fase:** F4 · **Quem decidiu:** o Elber, sobre a recomendação da sessão.
- **A** — DL-067 confirmado: slug `nome-cidade-uf`, estável (mudar o nome não muda o endereço).
- **B** — o serviço "Pet shop" vira **"Loja veterinária"** (slug `loja-veterinaria`), pela nomenclatura legal. Entra
  na 0005 **antes de ela ser aplicada**, junto dos `campos.ts` e do dado já gravado.
- **C** — o CRMV (UF + número) aparece no perfil público: é registro público do conselho e passa confiança.
- **D** — a busca ordena por nome por enquanto; relevância fica para uma função de busca (S6+).
- **E** — fecha o R-032 para o estabelecimento: **endereço e CEP do estabelecimento são públicos por desenho**
  (endereço comercial, necessário para o responsável chegar e para o mapa). **Do veterinário, só o bairro**, nunca o
  endereço. Os comentários do código passam a dizer que a omissão na tela é só de apresentação (SEC-117).
- **F** — o perfil público ganha o selo **"Verificado pela Vetria"**: todo perfil visível passou pela validação.
