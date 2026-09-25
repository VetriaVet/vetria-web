# RETOMAR — onde a sessão parou

> **Reescrito em 23/09/2026, à noite, pelo `vetria-maestro`.** Bilhete na porta da geladeira: curto,
> com prazo de validade. O estado completo está em [`docs/02-ESTADO.md`](docs/02-ESTADO.md), a fila em
> [`docs/03-TAREFAS.md`](docs/03-TAREFAS.md), o protocolo em [`HANDOFF.md`](HANDOFF.md).

## ▶️ AMANHÃ, 24/09/2026: comece por aqui

**Em produção desde 23/09:** T-023, T-024, T-025, T-027 (migration 0004 aplicada), T-034 (senha), T-035
(máscaras), o conserto do link de senha vencido, T-036 (rota do link por `token_hash` no ar, **templates ainda
não trocados**) e a 0005 como arquivo (**não aplicada**). O CI roda no `vetria-e2e` (DL-064) e é obrigatório na
`main` (ruleset): **tudo entra por PR**; `git push` direto na `main` é recusado.

**Sequência (no PC, ~40 min):**
1. **Trocar os 3 templates de email** no Supabase (`Vetria Brasil` → Authentication → Emails → Templates) com
   `email-templates/01`, `02` e `03` (assuntos e links no `email-templates/README.md`). Testar: pedir recuperação
   no PC, abrir no celular, Continuar, trocar a senha.
2. **Aplicar a 0005**, primeiro no `vetria-e2e`, depois em produção, pelo roteiro do card T-028 (pré-voo, backup,
   0005, seed de cidades, verificar uma sonda por vez).
3. **Merge da PR `f4-busca-e-perfil-publico`** e conferir `/buscar` e um perfil aprovado.

**Decisões pendentes (recomendação):** A endereço `nome-cidade-uf` estável (sim) · B "Pet shop" no endereço
(`loja-veterinaria`) · C CRMV no perfil público (sim) · D ordem alfabética por ora (sim) · E endereço do
estabelecimento público, do vet só bairro (sim) · F selo "Verificado pela Vetria" (sim).

**A registrar em riscos:** SEC-112 a SEC-119 (relatórios de 23/09); possível bug de "pausar e voltar" do
onboarding (QA); botão da newsletter estourando 22px em 360px (UI); projeto grátis do Supabase pausa após 7 dias.

## Onde estamos

- **A F3 encerrou em 23/09 com 5 de 6, e não se chama "concluída"** (DL-062). O item 3 (admin aprova,
  email chega) está **em produção** (`6a8d86a`). Falta o item 5: E2E dos itens 1 e 3 (T-029, até 06/10).
- **A F4 começou hoje. Semana S5, 23/09 a 29/09.** Estamos cerca de **uma semana atrás em trabalho**;
  o buffer da S13 está intacto.
- **Os docs deste fechamento estão na árvore, sem commit** (`01`, `02`, `03`, `04`, `05`, este arquivo
  e o relatório `SEC-2026-09-23-rate-limit-captcha-2fa.md`). Os testes novos do `vetria-qa` também
  (`tests/`), e esses **não** são 🟢: esperam a T-029.

## O que o Elber precisa fazer, em ordem

1. **Agendar a sessão presencial até 29/09** (🔴): aplicar a `0004` (T-027) e, se couber, a `0005`
   (T-028). **Sugestão: um horário fixo por semana para 🔴.**
2. **Decidir o R-033:** projeto Supabase só de teste, com a `service_role` **do teste** no CI (pede DL).
3. **Três gestos de 1 minuto:** senha mínima 8 no painel do Supabase (R-064) · ver o CI de `6a8d86a`
   verde no GitHub · conferir a `RESEND_API_KEY` na Vercel (Production).
4. **Ler o DL-062 e o DL-063** e confirmar ou revogar. Foram decididos pelo maestro, a seu pedido.

## Fila da S5

T-027 🔴 `0004` → T-028 🔴 `0005` (busca e `slug`) → T-029 QA (em paralelo) → T-030 onboarding
(limite de especialidades, botão de arquivo em português) → T-020 (teto do bucket). Depois, na S6 e
S7: T-031 captcha, T-033 cabeçalhos, T-032 2FA do admin. **Portão de abertura: 20/10.**

## O prompt pra colar numa sessão nova

```
Leia RETOMAR.md e docs/02-ESTADO.md. Estou voltando pra S5 da F4.
Me diga o que está pendente e o que eu preciso fazer.
```

⚠️ **Abra a sessão na pasta certa**, senão os 6 agentes não existem:
`cd "C:/Users/Elber Desinger/Desktop/Vetria/Vetria Brasil"`. Confira com `/agents`.
