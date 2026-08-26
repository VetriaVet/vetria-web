# 00 — ESCOPO CONTRATADO (CONGELADO)

> **Status:** 🔒 CONGELADO em 26/08/2026.
> **Vigência:** 26/08/2026 → 25/11/2026 (13 semanas).
> **Só muda por emenda assinada** (ver §5). Nenhum agente, nenhuma sessão, nenhum
> "aproveitando que estou aqui" altera este arquivo.

Este é o documento que existe para uma coisa só: **impedir que o projeto se perca**.
Quando houver dúvida sobre "isso entra?", a resposta está aqui. Se não está aqui, **não entra**.

---

## 1. A FRASE QUE DEFINE A ENTREGA

> Ao final das 13 semanas, um tutor consegue **encontrar** um veterinário ou
> estabelecimento real, **ver o perfil** dele e **falar com ele**. E um profissional
> consegue **se cadastrar, preencher o perfil, ser validado por um admin** e
> **aparecer na busca**.

Se isso funciona ponta a ponta com dados reais, a entrega está feita.
Se não funciona, nada mais importa.

---

## 2. DENTRO DO ESCOPO (as 6 capacidades contratadas)

| # | Capacidade | O que significa "pronto" |
|---|---|---|
| **E1** | **Núcleo de dados** | `profiles.status` existe; `vet_profiles` e `clinic_profiles` existem com RLS; documentos sobem pro Storage. Nada de dado fake em tela. |
| **E2** | **Onboarding real** | O que o vet/estabelecimento digita no onboarding **persiste** e reaparece. Ao concluir, o status vira `pending_validation` sozinho. |
| **E3** | **Validação pelo admin** | `/admin/validacoes` lista fila real, abre o documento, aprova ou reprova. Aprovar muda o status pra `active` e dispara email. |
| **E4** | **Busca pública** | `/buscar` filtra por cidade + especialidade + tipo de atendimento. Só aparece quem tem `role IN (vet, clinic)` **e** `status = active`. Filtro no backend. |
| **E5** | **Perfil público + contato** | `/veterinario/[slug]` e `/estabelecimento/[slug]` renderizam dados reais. CTA de WhatsApp funciona e o contato fica registrado. |
| **E6** | **Landing pages** | 3 LPs de valor (veterinário, estabelecimento, empresa) + 3 LPs de preço espelhadas. Preço é **vitrine**, sem checkout. CTA leva ao cadastro. |

**Transversais obrigatórias** (não são fase, atravessam tudo):
- **Segurança:** RLS ativa em toda tabela, RBAC no middleware, nenhum segredo no client.
- **LGPD:** consentimento no cadastro, exclusão de conta, exportação de dados.
- **Testes:** E2E Playwright nos fluxos de E2, E3, E4, E5 rodando em CI.
- **Responsivo:** todas as telas novas funcionam em mobile.

---

## 3. FORA DO ESCOPO (não entra, e não é negociável dentro das 13 semanas)

Cada item abaixo foi **conscientemente cortado**. Não é esquecimento. Não é falta de
capacidade. É o que garante que os 6 itens acima sejam entregues de verdade.

| Item | Por que fica fora | Quando entra |
|---|---|---|
| **Stripe / cobrança recorrente** | Cobrar antes de ter demanda comprovada é vender fumaça. Primeiro o marketplace gira. | Mês 4 |
| **Avaliações reais + moderação** | Precisa de volume de contatos pra ter avaliação legítima. Sem isso vira tela vazia. | Mês 4 |
| **Agenda / agendamento** | Feature grande, sozinha. Contato via WhatsApp resolve o MVP. | Mês 5+ |
| **Favoritos** | Retenção. Não bloqueia nada. | Mês 4 |
| **Vínculo vet ↔ estabelecimento (equipe)** | Já decidido como V2 no `VETRIA_PROJETO.md`. | V2 |
| **Mapa com pins e raio** | Busca por cidade resolve o MVP. | V2 |
| **Chat interno, telemedicina, IA de triagem, app mobile** | V3. | V3 |
| **Typesense / Meilisearch** | Postgres full-text aguenta o volume do MVP com folga. | Quando doer |
| **Integração com API do CRMV** | Validação é **manual pelo admin** na V1. Já decidido. | V2 |
| **Blog / SEO de conteúdo** | Não tem conteúdo pra publicar ainda. | Pós-lançamento |

> ⚠️ **Regra dura:** se um agente ou uma sessão propuser qualquer item desta tabela,
> a resposta é: *"fora de escopo — registrar em `04-RISCOS.md` como ideia e seguir"*.

---

## 4. O QUE JÁ ESTAVA PRONTO ANTES DESTE CONTRATO

Não conta como entrega das 13 semanas, mas conta como base que **não pode quebrar**:

- Login email/senha + Google OAuth, confirmação de email, recuperação de senha — 100% real, em produção.
- Domínio `vetriabrasil.com.br` no ar, Resend verificado, emails saindo de `contato@vetriabrasil.com.br`.
- RBAC de 5 roles com painéis isolados.
- ~45 telas no design system v2 (Inter + tokens Tailwind v4), estados honestos, sem dado fake.
- Admin dark com painel RBAC funcional.
- Migration `0001` aplicada (trigger lê role do metadata).

**Qualquer regressão aqui é bug crítico e para a fila.**

---

## 5. COMO MUDAR ESTE ESCOPO

Não se edita este arquivo direto. Adiciona-se uma **emenda** no final, com:

```
### EMENDA-NN — <título>
**Data:** DD/MM/AAAA
**Pedido por:** Elber
**O que entra:** ...
**O que sai em troca:** ...   ← obrigatório. Escopo é soma zero em prazo fixo.
**Impacto no prazo:** ... semanas
**Aprovado:** Elber (confirmado em sessão de DD/MM)
```

Sem a linha **"o que sai em troca"** preenchida, a emenda é inválida. Prazo fixo
com escopo elástico é como todo projeto morre.

---

## EMENDAS

_(nenhuma até o momento)_
