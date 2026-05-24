# Template — Atualização autônoma de CONTEXT.md e BACKLOG.md

Esse arquivo é o prompt reutilizável pra atualizar a memória institucional do projeto Vetria após cada bloco coerente de tasks mergeadas em produção.

## Como usar

1. Espera fechar um bloco de 3-5 tasks na main com push verde
2. Confirma que produção está funcionando (smoke tests rápidos)
3. Abre Claude Code (sessão pode ser nova ou continuada)
4. Copia o conteúdo da seção PROMPT abaixo
5. Cola no Claude Code, opcionalmente com 1 frase de contexto na frente: "Bloco coberto: TASK-XXX a TASK-YYY do tema Z."
6. Aguarda execução autônoma e push verde
7. Confere git log depois pra ver resumo do que entrou

## Quando NÃO usar

- Após uma task isolada (espera 3-5 mergeadas pra fazer rodada coesa)
- Em meio a debug ou investigação ativa (espera resolver primeiro)
- Se você quer revisar diff antes do push, troca nível VERDE por AMARELO no prompt

## PROMPT

Task: Atualizar CONTEXT.md e BACKLOG.md com decisões e mudanças mergeadas em produção desde a última atualização desses arquivos.
Nível de autonomia: VERDE — push direto autorizado em arquivos .md.

Etapa 1 — Descoberta do escopo (silenciosa):

1. Lê CONTEXT.md atual por completo (raiz do repo). Identifica numeração do último DL existente (pra continuar de DL-N+1), formato e tom dos DLs anteriores, data ou commit do último update do CONTEXT.

2. Lê BACKLOG.md atual por completo (raiz do repo). Identifica tasks marcadas concluídas vs pendentes, possíveis tasks novas que apareceram em commits sem entrar no BACKLOG, numeração de TASK-XXX em uso.

3. Roda git log oneline -40 (ou range maior se necessário). Identifica tasks mergeadas em main (commits feat refactor fix chore relevantes), quais já estão registradas no CONTEXT/BACKLOG e quais NÃO estão, hierarquia de tasks principais vs fixes correlacionados.

4. Pra cada commit relevante NÃO documentado, roda git show pra ler detalhe factual da mudança (não inventa nada — só registra o que o código mostra).

Etapa 2 — Síntese (silenciosa, antes de escrever):

5. Decide pra cada commit/task se merece DL próprio no CONTEXT. SIM pra: decisões arquiteturais, padrões estabelecidos, bugs resolvidos com fix não-óbvio, descobertas técnicas que afetam tasks futuras, trade-offs aceitos conscientemente. NÃO pra: mudanças visuais simples, ajustes de copy, correções triviais de typo, atualizações de dependência sem impacto. Esses só viram status concluído no BACKLOG, sem DL.

6. Decide se há tasks novas a adicionar no BACKLOG: bugs latentes descobertos mas não corrigidos, refatorações identificadas mas adiadas, decisões fora-de-escopo registradas durante outras tasks.

7. Decide se há reorganizações necessárias no BACKLOG: tasks que viraram bloco contíguo, tasks que mudaram de prioridade, marcadores de Sprint/fase.

Etapa 3 — Implementação:

A) CONTEXT.md ganha novos DLs em ordem cronológica, numerados a partir do último existente + 1. Cada DL com formato consistente com os anteriores: título descritivo, data e Sprint/TASK relacionada, contexto (o quê e por quê em 2-4 frases factuais), decisão tomada, implicações pra tasks futuras, status (resolvido / registrado / em andamento).

B) CONTEXT.md Status Atual atualizado refletindo realidade da main: tasks concluídas com seção curta do que ficou validado em produção, próximas tasks priorizadas (3-5).

C) BACKLOG.md atualizado com status concluído em tasks mergeadas, tasks novas adicionadas (com prompt-resumo se aplicável), reorganizações se descobertas.

Constraints CRÍTICAS (compensam VERDE em doc):

1. ESCOPO ESTRITO: registra APENAS o que de fato foi mergeado em main. NUNCA hipóteses, especulações, ou decisões discutidas mas não aplicadas.

2. TOM CONSISTENTE: lê 2-3 DLs existentes ANTES de escrever os novos. Mantém voz factual, passado, sem floreio. Frases diretas.

3. NÃO DUPLICA: se algum DL proposto já existe parecido, PARA e avisa. Não inventa "atualização" do DL antigo.

4. NÃO MEXE em código (zero arquivos .ts ou .tsx). Apenas .md.

5. COMMIT MESSAGE com resumo factual e listável: docs: registrar [tema da rodada] (DL-NN a DL-NN) + atualizações BACKLOG. Inclui no corpo: N DLs adicionados ao CONTEXT (resumo de 1 frase cada), status atualizado pra concluído em N tasks, N tasks novas no BACKLOG, reorganizações se houver.

6. Etapa 3 só roda se Etapas 1-2 encontraram coisa não documentada. Se git log não tiver commits novos desde último update do CONTEXT, PARA e avisa: Nada novo pra documentar desde [último DL/data].

Etapa 4 — Push:
1. Build não precisa rodar (só docs)
2. Diff dos 2 arquivos visível pós-commit via git show
3. Commit + push direto em main
4. Descrição final em 4 linhas com resumo do que entrou

Salvaguardas (mesmo em VERDE):
- Se git log mostrar commits inesperados de branches/PRs não-main, PARA
- Se CONTEXT.md tiver formato muito diferente do esperado, PARA
- Se BACKLOG.md tiver tasks com numeração conflitante, PARA
- Se identificar que decisão merece DL mas o porquê não está claro no commit/código (ex decisão de UX sem justificativa registrada), AVISA pra eu fornecer contexto antes de escrever

## Histórico de uso (preencher após cada execução)

Data | Tasks cobertas | DLs criados | Tasks novas BACKLOG | Commit
---|---|---|---|---
YYYY-MM-DD | TASK-XXX a TASK-YYY | DL-NN a DL-MM | TASK-FIX-XXX | hash
2026-05-24 | TASK-039 (separação tutor/B2B + signUp + migration 0001) | DL-026 a DL-029 | TASK-039 | 6360626
2026-05-24 | TASK-030 (Resend SMTP modo teste) + validação roteamento/onboarding | DL-030 | TASK-007b | (este commit)
