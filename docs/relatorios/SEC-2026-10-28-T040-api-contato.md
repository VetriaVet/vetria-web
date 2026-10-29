# Auditoria de segurança · 28/10/2026 · T-040, rota `POST /api/contato`

**Auditor:** vetria-seguranca · **Base:** commit `8b36da4`, branch `t-040-api-contato` sobre `t-039-migration-0006` (0006 não aplicada).
**Escopo:** `app/api/contato/route.ts`, `lib/contato/porta.ts`, `lib/contato/turnstile.ts`, `lib/perfil-publico/contato.ts`, `tests/e2e/contato-rota.spec.ts`. Contexto: 0006 §2 a §6, matriz §3 e §6, DL-071 (D1 a D12), DL-074, SEC-120 a 126 no card T-039.

**Veredito: APROVADA COM RESSALVAS para merge.** 🔴 0 · 🟠 1 · 🟡 5 · 🟢 2.

## Resumo
Hoje não entra gente real. A rota responde 503 `indisponivel` em produção sem cookie, sem sessão e sem chamar o banco. O número não sai por HTML, log, cache nem resposta de erro, e o `service_role` é usado numa única chamada RPC. O que falta é para o dia de ligar: limite de borda não amarrado em código, raspagem com cookie rotativo polui a métrica, aviso LGPD do cookie antes do botão.

## Achados

### SEC-127 · Ligar em produção exige o Turnstile, mas não o limite de borda, e cada número raspado vira um contato falso · 🟠
- **Onde:** `lib/contato/porta.ts:58-60`; `route.ts:197-201` cria `anon_id` novo para quem chega sem cookie; `0006:446-464` limita e deduplica por `anon_id`.
- **O quê:** a SEC-120 (a) está em código. A (b), firewall 10/min por IP com IPv6 por /64, e a (c), freio global, seguem abertas, e o código abre a porta sem nenhuma das duas.
- **Como explorar (depois da T-041 ligada):** script com `Sec-Fetch-Site: same-origin` à mão e sem cookie, token do Turnstile comprado em serviço de resolução, slug trocado a cada pedido. Cada pedido é visitante novo, o limite por `anon_id` nunca dispara.
- **Impacto:** a base de WhatsApp sai pelo custo dos tokens, e cada número raspado grava linha em `contatos`: a métrica de "contatos recebidos" fica envenenada.
- **Correção:** aceite T-041: regra `contato-por-ip` aplicada e escrita no card antes de ligar a constante. Decidir a SEC-120 (c) (teto global na função) ou ao menos alarme de volume. Considerar marcar e expurgar rajadas.

### SEC-128 · Número fora do formato é gravado como contato e não é entregue · 🟡
- **Onde:** `route.ts:72` e `route.ts:230-234`, contra `0006:432` e `0006:478-482`.
- **O quê:** a função grava a linha e faz commit; depois a rota confere `^\d{10,11}$` e, se falhar, responde 503. A normalização só vale nas Actions; a policy `perfil_privado_update_own` (0002:580) deixa o dono fazer PATCH em `whatsapp` direto pelo PostgREST, sem CHECK de formato.
- **Impacto:** lead contado e não entregue (contraria o DL-047); contato do perfil quebra em silêncio. Não vaza dado.
- **Correção:** na 0006, antes de aplicar: validar o formato antes do INSERT e devolver `sem_whatsapp`. A rota mantém a conferência como segunda camada.

### SEC-129 · A trava do modo de teste é lista negativa de um único ref · 🟡
- **Onde:** `lib/contato/porta.ts:36` e `52-57`.
- **O quê:** o modo de teste abre para qualquer projeto que não seja `gdqnnrozbxrtaaquarnd`. Hoje não abre contra produção por engano (NEXT_PUBLIC consistente com `admin.ts`, preview apontando para produção fica fechado, domínio próprio dá fechado). Risco só por mudança futura de ref.
- **Correção:** lista positiva (só o ref do `vetria-e2e`). `CONTATO_ABERTO_PARA_TESTE` nunca no escopo Production nem no Preview geral da Vercel; para a demo de 31/10 usar variável restrita à branch.

### SEC-130 · A trava de produção não tem prova automática · 🟡
- **Onde:** `tests/e2e/contato-rota.spec.ts`.
- **O quê:** "variável ligada + URL de produção = 503" foi medido à mão e não roda no CI. A parte B nem é declarada sem a variável: se o `ci.yml` nunca a receber, ninguém vê. Sem cobertura: caminho logado, Turnstile, `muitas_tentativas` pela rota, trava de produção.
- **Correção:** passo de CI com `next start`, URL de produção, chave de serviço falsa e `CONTATO_ABERTO_PARA_TESTE=1`, exigindo 503. Aceite T-043.

### SEC-131 · O siteverify não confere `hostname` nem `action` · 🟡
- **Onde:** `lib/contato/turnstile.ts:62`. Fail-closed correto.
- **Correção:** exigir `hostname` igual ao domínio canônico e `action` igual a `contato`. Aceite T-031/T-041.

### SEC-132 · LGPD: o botão pode ligar antes da Política que descreve o cookie · 🟡
- **O quê:** D2 apoia `vetria_visitante` (180 dias) em legítimo interesse com aviso sob o botão; não há página de privacidade. Política prevista até 10/11 (DL-074), botão a partir de 04/11.
- **Correção:** aceite T-041: aviso sob o botão com link para a Política publicada, ou não ligar antes dela.

### SEC-133 · `Sec-Fetch-Site` em fail-closed recusa navegador sem suporte · 🟢
- Safari anterior ao 16.4 não manda o cabeçalho e recebe 403. Direção: aceitar cabeçalho ausente com `Origin` igual ao domínio canônico. Medir na T-041.

### SEC-134 · Oráculos menores · 🟢
- 422 `sem_whatsapp` revela se perfil ativo tem número (custa um token; D9 torna obrigatório). Corpo chunked é lido inteiro antes do corte de 4 KB (limitado pelos 4,5 MB da Vercel). Aceitáveis.

## Situação da SEC-120
(a) ✅ em código · (b) ⬜ gesto do Elber · (c) ⬜ sem decisão (ver SEC-127).

## Verificado e OK
Número nunca no HTML (teste antes e depois do clique) · `no-store` em toda resposta, sem GET · logs só com `error.code` · `createAdminClient` uma vez, só para a RPC, com `server-only` · `registrar_contato` SECURITY DEFINER + `search_path`, EXECUTE só `service_role`, exige role e `active` · `user_id` do `auth.getUser()` · cookie UUID v4 estrito, HttpOnly, Secure, Lax, 180 dias, só nasce em sucesso · CSRF por `Sec-Fetch-Site` exato, JSON obrigatório, sem CORS · resposta do banco por lista fechada · toda recusa antes de qualquer efeito.

## Não consegui verificar
Variáveis do Preview da Vercel e Deployment Protection · se o firewall vale para previews e agrupa IPv6 por /64 · domínios do widget Turnstile · formato real de `perfil_privado.whatsapp` em produção hoje.

## Aceites que nascem daqui
- **T-039 (antes da sessão A):** SEC-128.
- **T-041 (antes de ligar):** SEC-127, SEC-131, SEC-132, SEC-133.
- **T-043:** SEC-130.
- **Qualquer momento:** SEC-129.
