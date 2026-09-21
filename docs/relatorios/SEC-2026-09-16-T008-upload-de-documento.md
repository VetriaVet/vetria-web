# Auditoria de segurança — T-008, o upload do documento — 16/09/2026

**Escopo:** `app/api/documentos/upload/route.ts`, `app/api/documentos/abrir/route.ts`,
`components/app/EnvioDeDocumento.tsx`, os dois `*OnboardingForm.tsx` e os dois
`onboarding/page.tsx`, lidos contra as seções 2.b / 2.c / 3 da `0003`, a seção 🔒 do card da
T-008, as policies de `perfil_privado` e a matriz §3/§4/§5 · mais o **delta do `/ajuda`
(DL-058)** em `lib/auth/status.ts` e nas duas `(painel)/ajuda/page.tsx` ·
**Base:** árvore de trabalho sobre `77b4fe6`, nada commitado

> ## ✅ Estado das correções pedidas
>
> **As três correções obrigatórias foram aplicadas em 16/09, logo após esta auditoria**, mais duas
> das recomendadas. Lint, `tsc --noEmit` e `npm run build` revalidados depois:
>
> | Achado | O que foi feito |
> |---|---|
> | **SEC-085** | `caminho` saiu do `console.log` de sucesso do `upload`, com o motivo em comentário. Nos logs de **erro** ele fica, porque é o que a varredura de órfãos precisa |
> | **SEC-087** | A rota `abrir` ganhou lista de permitidos de status, no formato SEC-052, valendo só para o dono (`admin` não tem status de profissional) |
> | **SEC-090** | A tabela do cabeçalho de `lib/auth/status.ts` ganhou `/ajuda`, mais a instrução de mudar as duas coisas no mesmo gesto |
> | **SEC-084** | O comentário de `PODEM_ENVIAR` foi qualificado: a revalidação vale no ramo UPDATE, e o `upsert` pode resolver por INSERT |
> | **SEC-089** | **NÃO aplicado.** `server-only` não é dependência do projeto, e dependência nova é 🟡 com diff pelo `CLAUDE.md`. Fica como decisão do Elber |
>
> **Continuam abertas, por decisão:** SEC-081 (🟠, vira T-020), SEC-082, SEC-083 (vira T-021),
> SEC-086, SEC-088 (vira T-022, é **decisão de produto**).

## Resumo

Dá para colocar gente real nisso, com três linhas de correção antes do merge. As duas rotas novas
ficam fora do `matcher` do `middleware.ts` e **se defendem sozinhas**: sessão, role e status são
reconferidos por conta própria, e no `upload` isso acontece **antes de um único byte do corpo ser
lido**. `service_role` aparece em três lugares, os três justificados, e **nunca** no passo 8. A
detecção por bytes mágicos barra SVG e HTML de verdade, e o `contentType` gravado é o detectado,
não o declarado.

O que sobra não é vazamento: é **volume e retenção**. Qualquer conta `vet` criada em dois minutos
enche o bucket de documentos de 10 MiB que ninguém apaga (🟠), e a varredura que deveria achar os
órfãos classifica parte deles como "esperado" (🟡). O `/ajuda` do DL-058 está correto nos três
eixos pedidos.

**Contagem: 🔴 0 · 🟠 1 · 🟡 9.**

---

## Achados

### SEC-081 — Upload sem teto de volume, sem cota e sem limpeza: o bucket é enchível por qualquer conta nova · 🟠

- **Onde:** `app/api/documentos/upload/route.ts:48` (`PODEM_ENVIAR`), `:321` (`montarCaminho`,
  epoch em ms) · `supabase/migrations/0003_storage_documentos.sql` §3 (*"o caminho antigo NÃO é
  apagado no reenvio"*) · `supabase/migrations/0002_nucleo.sql:786-797` (vet/clinic nascem
  `incomplete`)
- **O quê:** a rota limita o **tamanho de cada arquivo** (10485760, conferido duas vezes) e **não
  limita nada mais**: nem o número de envios, nem o total acumulado por conta, nem a taxa. Cada
  envio gera caminho novo, e a `0003` §3 decidiu, por escrito, que **o objeto anterior não é
  apagado**. A rotina que apagaria é a T-018, na F6/S11. Não existe rate limit em lugar nenhum do
  repositório.
- **Como explorar:** cadastro com email descartável (nasce `incomplete`, que está em
  `PODEM_ENVIAR`, de propósito, porque é o fluxo legítimo do onboarding), confirmar, logar, e um
  laço de `curl` com um arquivo de 10 MiB válido. Cada iteração passa em tudo. Resultado: mil
  objetos, ~10 GB, 999 sem linha que os aponte, nenhum apagado por nada.
- **Impacto:** custo de armazenamento e de banda sem teto. Pior que o custo: **999 documentos de
  identidade retidos indefinidamente**, que é o R-023 acontecendo na criação em vez de na exclusão
  e em escala. E o efeito de segunda ordem: a varredura do item 3 da seção 🔒 vira ruído puro no
  dia em que alguém a rodar. **Não é vazamento** — o bucket tem zero policy e nada disso é
  alcançável de fora.
- **Como corrigir, em ordem de custo:** (a) teto de envios por conta por janela, decidido no
  servidor, lendo a contagem de objetos sob o prefixo `<uuid>/` antes do passo 7; (b) antecipar da
  T-018 só a parte que apaga — ⚠️ isso contraria a `0003` §3 (*"o admin pode precisar comparar"*),
  então é **decisão registrada**, não conserto de rota; (c) cota de bucket, se o plano do Supabase
  oferecer.
- **Vira task: T-020.** Não bloqueia este merge (o bucket está vazio e não há profissional real),
  mas **precisa estar fechada antes de o onboarding ser aberto para conta de fora.**

### SEC-082 — O corpo é materializado inteiro antes do teto, e no `abrir` antes até da conferência de role · 🟡

- **Onde:** `upload/route.ts:270-289` · `abrir/route.ts:54`
- **O quê:** `await req.formData()` lê e faz o parse do multipart **inteiro** na memória da função.
  Só depois o teto de 10 MiB é aplicado. O comentário diz *"limite duro no servidor"*, e ele é duro
  sobre o **arquivo**, não sobre o **corpo**. No `abrir`, `await req.json()` acontece depois do
  `getUser()` mas **antes da leitura de `profiles`**, ou seja, antes da conferência de role.
- **Como explorar:** conta logada, `curl -F arquivo=@100mb.bin`. A função aloca ~100-200 MB de RSS
  antes de responder 413. Alguns pedidos em paralelo derrubam a instância por memória. No `abrir`,
  o mesmo com uma conta `tutor` e um JSON gigante.
- **Impacto:** recusa de serviço por esgotamento de memória, com custo de execução junto.
  Autenticado, então a barreira é criar conta — a mesma do SEC-081.
- ⚠️ **Correção de registro, e ela muda o enunciado do handoff da T-008.** O item 2 do *Descobri*
  do card diz que *"função serverless na Vercel recusa corpo acima de ~4,5 MB antes de a rota
  rodar"*. **Esse número está desatualizado:** Vercel Functions passou a aceitar corpo de
  requisição de até 100 MB. A plataforma **não estrangula este caminho**, e o teto real de produção
  **é** o de 10 MiB da rota. O tratamento de 413 no cliente continua válido como defesa; ele só não
  é o gargalo descrito. **O item 2 do card precisa ser reescrito** — não é achado de segurança, é
  doc que mente (R-034 em miniatura).
- **Como corrigir:** conferir `content-length` contra um teto com folga **antes** de
  `formData()`/`json()`. No `abrir`, mover a leitura de `profiles` para antes do `req.json()`.

### SEC-083 — A varredura de órfãos rotula como "esperado" o órfão que nasceu antes de um reenvio bem-sucedido · 🟡

- **Onde:** `docs/03-TAREFAS.md`, card da T-008, seção 🔒 item 3 (o `select`)
- **O quê:** a coluna `classe` decide por comparação de tempo e só reconhece o órfão que é **mais
  novo** que o último envio bem-sucedido. O órfão **mais velho** cai no `else` e vira *"VERSÃO
  ANTERIOR DE REENVIO (esperado)"*.
- **Como explorar (não precisa de atacante, é o caminho de falha normal):** 10:00, o vet envia A, o
  passo 7 grava, **o processo morre entre o 7 e o 8** (exatamente o caso que a seção 🔒 admite não
  cobrir). 10:05, ele tenta de novo, B sobe e o passo 8 grava. Na varredura, A entra no resultado,
  e como `10:00 > 10:05` é falso, é rotulado **esperado**. O órfão do passo 8, único caso que a
  varredura existe para pegar, aparece na lista dos que não pedem ação.
- **Impacto:** a única rede sob o buraco que o backend admitiu por escrito não pega o caso mais
  provável dele. Documento de identidade retido sem ninguém saber, e a medição que *"fecha o
  assunto no dia"* fecha errado.
- **Segundo defeito no mesmo `select`, mais barato:** `split_part(o.name, '/', 1)::uuid` aparece em
  dois `left join`. **Um único objeto com primeiro segmento que não seja uuid derruba a query
  inteira**, e o planner não garante que o filtro de `bucket_id` seja avaliado antes do cast.
- **Como corrigir:** o dado que separa órfão de versão anterior **não existe** hoje — nenhuma
  tabela guarda histórico de caminhos, então tempo é tudo que há. Ou (a) parar de prometer
  classificação e devolver `dono_uuid`, `created_at` e `enviado_em_da_linha`, deixando o humano
  decidir (honesto, e é uma linha a menos); ou (b) criar tabela de histórico, que é migration, 🔴,
  outro card. Para o cast: filtrar numa subconsulta com `bucket_id` **e** um `~` de uuid antes de
  castar.
- **Vira task: T-021.** É correção do card da T-008 e do card da T-018, que copia a mesma consulta.
  **Não é código.**

### SEC-084 — O ramo INSERT do `upsert` não dispara `trg_perfil_privado_revalidar`, e o comentário promete que dispara · 🟡 · ✅ COMENTÁRIO QUALIFICADO

- **Onde:** `upload/route.ts:39-47` e `:400-413` · contra `0002_nucleo.sql:446-448`
  (`create trigger trg_perfil_privado_revalidar after update on public.perfil_privado`)
- **O quê:** o comentário afirmava, sem qualificar, que um profissional `active` que troque o
  documento dispara a revalidação e volta para `pending_validation`. Isso é verdade **só no ramo
  UPDATE**. O trigger é `after update`, e o `upsert` do passo 8 pode resolver por **INSERT** — que
  é exatamente o motivo pelo qual o `update` virou `upsert`. No ramo INSERT o carimbo roda (ele é
  `before insert or update`) mas **a revalidação não**.
- **Alcançabilidade:** baixíssima hoje, e por isso 🟡. As Server Actions de onboarding fazem upsert
  em `perfil_privado` antes de chamar a RPC, então quem chegou a `pending_validation` pela porta da
  frente tem linha. Sobram um `admin_definir_status` que leve à `active` quem nunca fez onboarding,
  e qualquer caminho futuro que pule a Action — a fila da S4, por exemplo.
- **Impacto se acontecer:** exatamente o sintoma que a SEC-023/SEC-033 gastaram duas auditorias
  para fechar — **perfil aprovado exibindo documento que ninguém conferiu**.
- **Correção aplicada:** o comentário foi qualificado, dizendo que a garantia vale no ramo UPDATE e
  por que o INSERT escapa. O conserto de verdade é `after insert or update` no trigger, que é
  migration, logo 🔴, e **vai para a lista da `0004`**.

### SEC-085 — O caminho de todo documento de identidade ia para o log da Vercel no caminho feliz · 🟡 · ✅ CORRIGIDO

- **Onde:** `upload/route.ts:474-479`
- **O quê:** era log de **sucesso**, não de erro: rodava em 100% dos envios, com
  `caminho = <uuid do dono>/documento-<epoch>.<ext>` — o ponteiro para o documento de identidade,
  colado no uuid da pessoa e no status dela. O R-024 já registra que o log da Vercel **está fora do
  alcance da rotina de exportação e exclusão da F6**, e o próprio arquivo cita isso ao justificar
  por que `details` do Postgres não entra. A mesma razão se aplicava aqui e não tinha sido
  aplicada.
- **Como explorar:** não precisa de atacante. Basta acesso de leitura ao log do projeto — que é um
  conjunto de pessoas diferente, maior e sem trilha, do conjunto que lê `audit_logs`. Depois de um
  pedido de exclusão na F6, a linha sai do Postgres, o objeto sai pela T-018, **e o log continua
  dizendo que o documento existiu**.
- **Impacto:** retenção de dado pessoal fora de qualquer rotina de titular. Não é o documento, é o
  ponteiro para ele mais o uuid — e o uuid é dado pessoal pela LGPD.
- **Correção aplicada:** `caminho` saiu do log de sucesso. Nos logs de **erro** ele fica, porque é
  o que a varredura de órfãos precisa.

### SEC-086 — Nenhuma das duas rotas confere a origem do pedido · 🟡

- **Onde:** `upload/route.ts:191` · `abrir/route.ts:41` · `lib/supabase/server.ts:7-30` (nenhuma
  opção de cookie declarada)
- **O quê:** as duas aceitam POST sem olhar `Origin` nem `Sec-Fetch-Site`.
  `multipart/form-data` é content-type "simples" de CORS: um `<form>` de terceiro consegue fazer o
  POST sem preflight. O que impede o cookie de acompanhar é o `SameSite=Lax`, que é o **default do
  `@supabase/ssr`** — não está escrito em lugar nenhum deste repositório, não é conferido por teste
  nenhum, e é a única coisa entre o site do atacante e um upload em nome da vítima.
- **Impacto:** substituição do documento de validação e remoção da busca, em nome da vítima. **Só
  alcançável se o `SameSite` mudar** — por upgrade da biblioteca, por alguém passar `cookieOptions`
  um dia, ou por um subdomínio hostil, que é same-site e o Lax não cobre.
- **Como corrigir:** recusar quando `Sec-Fetch-Site` não for `same-origin`, nas duas rotas. Três
  linhas, e param de depender de um default de biblioteca que ninguém escolheu.

### SEC-087 — A rota `abrir` não tinha portão de status, e o `upload` tinha · 🟡 · ✅ CORRIGIDO

- **Onde:** `abrir/route.ts:72-101` · contra `upload/route.ts:48,248-263` e a matriz §4
- **O quê:** o `upload` aplicava `PODEM_ENVIAR` e recusava 403. O `abrir` **não lia `status`**. Uma
  conta `suspended` ou `incomplete` abria o próprio documento normalmente.
- **Como explorar:** conta `vet` suspensa. O `middleware.ts` só a deixa em `/bloqueado`. Um `fetch`
  do console daquela página devolvia URL assinada válida. A matriz §4 diz que `suspended` alcança a
  tela de bloqueio **e todo o resto é bloqueado**.
- **Impacto:** baixo em dado — é o documento **da própria pessoa**, e ela já o tinha. O que quebra
  é a regra, e a assimetria entre duas rotas irmãs é o convite para a terceira errar.
- **Correção aplicada:** lista de permitidos de status na `abrir`, no formato SEC-052, valendo só
  para o dono. `admin` não tem status de profissional, e a matriz §5 dá "ver documento enviado" a
  admin e master independentemente disso.

### SEC-088 — Concluir o onboarding sem documento continua possível, e a fila do admin vai receber cadastro vazio · 🟡 · DECISÃO DO ELBER

- **Onde:** `VetOnboardingForm.tsx:77-90,384` e `ClinicOnboardingForm.tsx:67-77,367`
  (`disabled={isPending || !temDocumento}`) · contra as duas `onboarding/actions.ts`, **não
  tocadas**
- **O quê:** o backend diz com todas as letras, no *Não fiz* do card, que a obrigatoriedade é regra
  de tela, e o comentário do componente repete. **Está correto e é honesto** — e o risco precisa
  ser dito em voz alta, que é o que este achado faz.
- **Duas portas, e a primeira nem é ataque:** (1) DevTools, remover o `disabled` do botão, clicar —
  a Action roda, chama `concluir_onboarding_profissional()` e o profissional entra em
  `pending_validation` **sem documento**; (2) POST com `Next-Action`, que o portão de rota não
  alcança (SEC-079) — a Action reconfere role e status por conta própria, mas **não confere
  documento**, porque não é critério dela.
- **Impacto:** a fila de validação da S4 nasce podendo conter cadastros sem nada para validar. Não
  vaza dado, não cruza usuário: o admin simplesmente reprova. O custo é **operacional**, e real na
  proporção de quanto o funil for raspado.
- **Como corrigir: não corrigir aqui.** É decisão de produto. Ou a Action passa a exigir
  `documento_enviado_em` não nulo antes de chamar a RPC (fila limpa, e a pessoa trava no passo 4 se
  o upload falhar), ou a fila do admin assume o filtro (e a S4 mostra "sem documento" como estado
  de primeira classe). **A alternativa que não pode ficar é a de hoje: nenhuma das duas escrita em
  lugar nenhum.**
- **Vira task: T-022** — uma decisão, não uma implementação.

### SEC-089 — `lib/supabase/admin.ts` não tem `import "server-only"`, e o número de importadores acabou de dobrar · 🟡 · NÃO APLICADO

- **Onde:** `lib/supabase/admin.ts:1-7`
- **O quê:** o módulo que lê `SUPABASE_SERVICE_ROLE_KEY` é um módulo comum. Nada além de convenção
  impede que um arquivo com `"use client"` o importe um dia. Tinha dois importadores; com a T-008
  são quatro.
- **Alcançabilidade:** nenhuma hoje — nenhum componente de cliente o importa, e os quatro
  importadores são Route Handlers com `runtime = "nodejs"`. E mesmo no erro futuro a chave não
  vazaria: o Next só inlina `NEXT_PUBLIC_*`, então o valor viraria `undefined` no bundle. O que
  aconteceria é quebra confusa em runtime, e a garantia toda ficar dependendo de o bundler
  continuar sendo o que é.
- **Por que não foi aplicado:** `server-only` **não é dependência deste projeto**, e dependência
  nova é 🟡 com diff pelo `CLAUDE.md`. Fica como decisão do Elber — é uma linha e um `npm i`, e
  transforma a garantia em **erro de build** em vez de disciplina.

### SEC-090 — O cabeçalho de `lib/auth/status.ts` reproduzia a matriz §4 "na íntegra" sem `/ajuda` · 🟡 · ✅ CORRIGIDO

- **Onde:** `lib/auth/status.ts:12-19` contra `:145` (`ajuda: ESPERANDO_OU_ATIVO`) e
  `docs/06-PERMISSOES.md` §4
- **O quê:** o comentário de topo dizia *"A matriz §4, na íntegra:"* e imprimia a tabela sem
  `/ajuda`. O DL-058 acrescentou `/ajuda` na matriz e no mapa deste mesmo arquivo, e o cabeçalho
  não foi atualizado junto. **O arquivo se contradizia consigo mesmo a 130 linhas de distância, e a
  metade errada era a que se apresenta como fonte.**
- **Impacto:** não é explorável. É o vetor pelo qual a próxima pessoa que abrir o arquivo lê a
  tabela errada e decide errado. O R-034 em miniatura.
- **Correção aplicada:** `/ajuda` entrou na linha de `pending_validation`, com a instrução de mudar
  tabela e mapa no mesmo gesto.

---

## Verificado e OK

**Autorização das duas rotas, sem o middleware por perto.** As duas estão de fato fora do `matcher`
(`middleware.ts:129` cobre `/app/:path*` e `/admin/:path*`) e as duas reconferem por conta própria.
**Ordem no `upload`:** sessão → formato do uuid → `role` e `status` → **só então**
`req.formData()`. **Nenhum byte do corpo é lido antes da autorização.** É o ponto mais importante
deste diff e está certo. Um `tutor` logado não alcança nenhuma das duas; um `admin` é recusado no
`upload`, corretamente.

**A rota `abrir`, auditada como hostil.** O caminho **sai da tabela**, nunca do cliente; o corpo
aceita no máximo um uuid validado por regex. **Não dá para pedir o documento de outra pessoa.**
`quemPede.role` vem de `profiles` lido sob RLS pela própria sessão, e `role` é pinada pelo
`WITH CHECK` de `profiles_update_own_safe_fields`: o usuário não consegue se declarar admin.
`admin` aqui é `role = 'admin'` e está certo contra a matriz §5. Admin comum passando uuid
arbitrário não colhe nada além da fila dele, e a tentativa **fica registrada**. A URL assinada não
vaza por barra de endereço, referer nem histórico: é POST, vive só no corpo da resposta, e o link
usa `rel="noopener noreferrer"`. **O `audit_logs` é escrito ANTES da URL existir, e sem trilha não
há URL:** falha de gravação devolve 502 e `createSignedUrl` nem é chamado.

**`service_role`.** Três usos: o passo 7 (escrever no bucket), a compensação (o **mesmo** cliente,
por parâmetro) e o `abrir` (o `insert` em `audit_logs`, porque a `0002` §11b revogou INSERT de
`authenticated`, e o `createSignedUrl`, porque o bucket tem zero policy). Cada um necessário,
nenhum conveniência. **Ele não alcança nada além do bucket e de `audit_logs`**, e **não existe
ramo em que escreva em `perfil_privado`** — o passo 8 usa a sessão, e os dois ramos de falha
recusam **sem plano B**, como o DL-055 exige. A chave não escapa: as respostas de erro carregam
mensagem fixa, nunca o objeto de erro. Sweep de segredo no histórico de todas as refs: limpo.

**Detecção por bytes mágicos.** As quatro assinaturas conferem byte a byte com a tabela da `0003`
§2.c, incluindo o WEBP com **as duas metades** (`RIFF` no offset 0 e `WEBP` no offset 8). Arquivo
truncado não passa nem estoura. **SVG e HTML estão barrados de verdade**, e nada de `accept`,
extensão ou `content-type` declarado entra na decisão. **O `contentType` gravado é o DETECTADO.**
Políglota não reabre o R-004: o objeto é servido de `*.supabase.co`, **origem diferente** da do
app, e **`next.config.ts` não tem `images.remotePatterns`**, então `next/image` não carrega URL
remota nenhuma e o caminho pelo qual o `dangerouslyAllowSVG` viraria XSS **não existe**. R-004
fechado por duas razões independentes.

**O `upsert` do passo 8.** É seguro e bem fundamentado. **Não cria linha para quem não deveria ter
uma:** `ON CONFLICT DO UPDATE` sob RLS exige as duas policies, e a guarda de role da SEC-032 cobre
os dois ramos. **Não sobrescreve coluna que não é dele:** o `DO UPDATE SET` sai das chaves do
payload, e `whatsapp`, `cnpj`, `razao_social` e `responsavel_tecnico` não são tocados. Continua
sendo **uma escrita** com as três colunas juntas, respeitando o CHECK all-or-nothing.

**O caminho do objeto.** 100% gerado pelo servidor. **O nome escolhido pelo usuário não chega nem
sanitizado:** a rota só lê `.size` e `.arrayBuffer()`, nunca `.name`. Path traversal, unicode e
nome gigante são impossíveis por construção. **A regex conferida antes do upload é idêntica à do
CHECK**, inclusive na diferença clássica de `$` entre JS e Postgres. `upsert: false` no passo 7:
colisão é erro, nunca sobrescrita.

**A compensação.** A admissão do backend está correta: toda saída de erro do passo 8 passa por
`compensarObjetoOrfao` antes de responder, nos três ramos e no caso `!linha` sem erro. **A rota
nunca responde sucesso sem linha gravada.** Quando a própria remoção falha, sai marca fixa
`DOCUMENTO_ORFAO` e a rota não engole. **Não há caso adicional não coberto** além do já admitido
(processo morto entre 7 e 8).

**O que a tela expõe.** Os dois `page.tsx` selecionam **`documento_enviado_em` e só ele**:
`documento_path` e `documento_hash` **não vão para o HTML**. O componente não fala com o Storage,
não escolhe nome e não decide validade.

**Parte 2, o delta do `/ajuda` (DL-058).** (1) Portão e página concordam, e o `(painel)/layout.tsx`
já usava `ESPERANDO_OU_ATIVO`, a lista mais larga, então o layout não tranca o que a página abre.
(2) A mudança alcança **só** `/ajuda`; `ALCANCE_PADRAO` continua `SO_ATIVO` e rota nova continua
nascendo fechada. (3) `incomplete` e `suspended` continuam fora, e **`bloqueado/` está FORA do
grupo `(painel)`** nos dois painéis — se estivesse dentro, seria laço. **Nada divergiu da §4.**

## Não consegui verificar

1. **O comportamento real do `upsert` do PostgREST contra este banco.** Que o `DO UPDATE SET` cobre
   só as colunas do payload é documentado e é o mesmo padrão que a T-006 roda em produção desde
   31/08, mas **não foi medido**. A prova é de trinta segundos: enviar documento numa conta que já
   tenha `whatsapp` e conferir que o `whatsapp` continua lá.
2. **O `select` de varredura nunca foi executado** contra o banco, e não seria: é produção. O
   defeito do SEC-083 é leitura contra o schema, não medição. Também não se sabe se o papel do SQL
   Editor enxerga `storage.objects` neste projeto — se não enxergar, a varredura precisa de outro
   caminho e isso vira bloqueio da T-018.
3. **Os cabeçalhos com que o Storage serve a URL assinada** (`Content-Disposition`,
   `X-Content-Type-Options`). Importa para a tela do admin da S4: se for `inline` sem `nosniff`,
   vale passar `{ download: true }` no `createSignedUrl` daquela tela.
4. **Os atributos reais do cookie de sessão em produção.** São o default do `@supabase/ssr`, não
   estão conferidos por teste nenhum, e é o `SameSite` que segura o SEC-086.
5. **O conteúdo atual do bucket.** A Sonda 1 da T-002 dizia zero em 26/08 e a rota não existia até
   hoje, mas não foi medido.

---

## Veredito

> **MERGE COM CORREÇÕES PONTUAIS — e as três obrigatórias já foram aplicadas.**
>
> Nenhum 🔴. As perguntas que decidem se dá para colocar gente real nisso — o caminho vem do
> cliente? dá para pedir o documento de outro? o `service_role` escapa? SVG entra? a chave está no
> bundle? — **têm todas a resposta certa**, e algumas com folga.
>
> **Fora deste diff, viram card:** **T-020 / SEC-081 🟠** (teto de volume e limpeza; não bloqueia o
> merge, **bloqueia a abertura do onboarding para conta de fora**), **T-021 / SEC-083** (corrigir a
> varredura no card da T-008 e no da T-018; é doc), **T-022 / SEC-088** (**decisão do Elber**: a
> obrigatoriedade do documento vive na Action ou na fila do admin?).
>
> **Continuam em aberto e recomendadas:** SEC-082, SEC-086, SEC-089.
>
> **A prova em tela com conta logada continua sendo pré-condição.** Nenhum agente loga no app, e
> neste projeto risco não fecha porque o código existe.
