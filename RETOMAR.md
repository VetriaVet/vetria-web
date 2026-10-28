# RETOMAR — onde a sessão parou

> **Reescrito em 25/09/2026, noite, pelo `vetria-maestro`.** Bilhete na porta da geladeira: curto, com prazo de
> validade. O estado completo está em [`docs/02-ESTADO.md`](docs/02-ESTADO.md), a fila em
> [`docs/03-TAREFAS.md`](docs/03-TAREFAS.md), o protocolo em [`HANDOFF.md`](HANDOFF.md).

## Onde estamos

- **F3 concluída, 6 de 6** (DL-069). **F4 ~1,5 semana adiantada:** `0004` e `0005` em produção, `/buscar` e
  os perfis públicos no ar com o selo "Verificado pela Vetria" (slug provado: `larissa-lima-goiania-go`).
- **Falta na F4:** o contato por WhatsApp (S8, 8 cards, T-039 a T-046) e o portão de abertura
  (**1 de 7** provados, prazo 20/10).
- **Tudo entra por PR**: o CI (88 + 10 testes no `vetria-e2e`) é obrigatório na `main`.

## O que o Elber decidiu em 25/09 (sessão presencial adiantada da terça)

1. **D1 a D12 do contato aprovadas como recomendadas** (DL-071). Matriz de permissões emendada, "entra com a
   0006". A D9 (WhatsApp obrigatório no onboarding) virou a **T-046**.
2. **Supabase de produção fica no plano grátis** (DL-072). Risco R-073 aceito: a **T-044** mantém os dois
   projetos acordados. Reavaliar o Pro é o **item 7 do portão**, antes do primeiro profissional de fora.
3. **Rodada 2** (cobrança e o que ficou fora, depois de 25/11): proposta em
   [`docs/07-RODADA-2.md`](docs/07-RODADA-2.md), recomendação Asaas, freemium, cobrança só com as métricas do §8.
   Card novo na F5: **T-047** ("Quero ser avisado quando o plano abrir").

## Próximos 5 dias (26/09 a 30/09)

T-038 prévia do perfil (em execução, `vetria-ui`) → T-033 cabeçalhos → T-020 teto do bucket + firewall →
T-031 captcha (código) → T-039 a `0006` do contato, **na forma final, auditada, não aplicada**.

## O que o Elber precisa fazer

1. **Sessão presencial terça 30/09 à noite** (🔴, **horário fixo semanal**): ligar o Turnstile **depois** do
   deploy da T-031, subir o limite de verificação do Auth (SEC-114), regras do firewall da Vercel, aplicar a
   `0006` no `vetria-e2e`, e **decidir o R-077** (a copy de preço promete o que não existe e tem depoimentos
   fictícios; recomendação no `07-RODADA-2.md` §2.4).
2. **Provar a senha mínima 8** (cadastrar com 7 e ver recusar) e **conferir a `RESEND_API_KEY` na Vercel**.

## O prompt pra colar numa sessão nova

```
Leia RETOMAR.md e docs/02-ESTADO.md. Estou voltando pra F4.
Me diga o que está pendente e o que eu preciso fazer.
```

⚠️ **Abra a sessão na pasta certa**, senão os 6 agentes não existem:
`cd "C:/Users/Elber Desinger/Desktop/Vetria/Vetria Brasil"`. Confira com `/agents`.
