# RETOMAR — onde a sessão parou

> **Reescrito em 25/09/2026 pelo `vetria-maestro`.** Bilhete na porta da geladeira: curto, com prazo de
> validade. O estado completo está em [`docs/02-ESTADO.md`](docs/02-ESTADO.md), a fila em
> [`docs/03-TAREFAS.md`](docs/03-TAREFAS.md), o protocolo em [`HANDOFF.md`](HANDOFF.md).

## Onde estamos

- **F3 concluída, 6 de 6** (DL-069). **F4 ~1,5 semana adiantada:** `0004` e `0005` em produção, `/buscar` e
  os perfis públicos no ar com o selo "Verificado pela Vetria" (slug provado: `larissa-lima-goiania-go`).
- **Falta na F4:** o contato por WhatsApp (S8, planejado em 7 cards, T-039 a T-045) e o portão de abertura
  (1 de 6 provados, prazo 20/10).
- **Tudo entra por PR**: o CI (88 + 10 testes no `vetria-e2e`) é obrigatório na `main`.

## Próximos 5 dias (26/09 a 30/09)

T-038 prévia do perfil (em execução, `vetria-ui`) → T-033 cabeçalhos → T-020 teto do bucket + firewall →
T-031 captcha (código) → T-039 a `0006` do contato, **escrita e auditada, não aplicada**.

## O que o Elber precisa fazer

1. **Sessão presencial terça 30/09 à noite** (🔴): responder as **decisões D1 a D12** da S8 (tabela em
   `docs/03-TAREFAS.md`, seção "PLANEJADA — S8"), ligar o Turnstile **depois** do deploy da T-031, subir o
   limite de verificação do Auth (SEC-114), regras do firewall da Vercel, aplicar a `0006` no `vetria-e2e`.
2. **Dizer em que plano está o Supabase de produção** (projeto grátis pausa após 7 dias sem uso, R-073).
3. **Provar a senha mínima 8** (cadastrar com 7 e ver recusar) e **conferir a `RESEND_API_KEY` na Vercel**.

## O prompt pra colar numa sessão nova

```
Leia RETOMAR.md e docs/02-ESTADO.md. Estou voltando pra F4.
Me diga o que está pendente e o que eu preciso fazer.
```

⚠️ **Abra a sessão na pasta certa**, senão os 6 agentes não existem:
`cd "C:/Users/Elber Desinger/Desktop/Vetria/Vetria Brasil"`. Confira com `/agents`.
