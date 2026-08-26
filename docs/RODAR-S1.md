# RODAR A S1 — passo a passo

> Fechamento da Semana 1 da Fase 3. Tempo estimado: **40 minutos**.
> Marque cada `[ ]` conforme for. Se algo não bater com o esperado, **pare** e volte aqui.

---

## PASSO 0 — Avisar os sócios (2 min)

- [ ] Mandar mensagem pra Marília e pro Durval

> *"Vou ligar o banco de verdade hoje. O cadastro de vocês vai precisar ser refeito uma vez, porque o formulário antigo era só visual e não salvava nada. São 3 minutos, e a partir daí fica salvo pra sempre."*

**Por que importa:** o Durval é sócio, não conta de teste. Sem aviso ele entra, vê o cadastro zerado e a primeira impressão é de que quebrou.

---

## PASSO 1 — Confirmar o backup (1 min)

- [ ] O arquivo `supabase/backups/profiles-2026-08-26-antes-da-0002.sql` existe
- [ ] Ele tem 17 linhas começando com `insert into`

```bash
grep -c "^insert into" supabase/backups/profiles-2026-08-26-antes-da-0002.sql
```

Tem que imprimir `17`. **Se não tiver, não siga.** No plano Free não existe backup automático: esse arquivo é o único que existe.

---

## PASSO 2 — Resolver o Git e empurrar (5 min)

São **11 commits** parados no seu computador.

- [ ] Limpar o token da URL do remote

```
! git remote set-url origin https://github.com/VetriaVet/vetria-web.git
```

- [ ] Empurrar

```
! git push origin main
```

Deve abrir o navegador pedindo autorização no GitHub. Autoriza, e o credential manager guarda pra sempre.

**Se não abrir janela nenhuma:** vá em https://github.com/settings/tokens → *Generate new token (classic)* → marque só o escopo **`repo`** → gere e copie (começa com `ghp_`). Então:

```
! git remote set-url origin https://COLE_O_TOKEN@github.com/VetriaVet/vetria-web.git
! git push origin main
```

- [ ] Confirmar que subiu

```
! git rev-list --count origin/main..main
```

Tem que imprimir `0`.

> A Vercel vai fazer deploy automático. Nada do que subiu muda o site: são docs, SQL não aplicado e o `/roadmap` atualizado.

---

## PASSO 3 — Aplicar a migration (5 min)

- [ ] Abrir `supabase/migrations/0002_nucleo.sql`
- [ ] Copiar o arquivo **inteiro**
- [ ] Colar no **Supabase → SQL Editor**
- [ ] Rodar

É **uma transação só**: ou entra tudo, ou não entra nada. Não existe meio-aplicado.

**Se der erro:** copie a mensagem inteira e me mande. Não tente consertar no editor. O banco fica exatamente como estava.

---

## PASSO 4 — Rodar as sondas (15 min)

Abra `supabase/verificar-apos-0002.sql` e rode **uma sonda por vez**. O editor do Supabase só mostra o resultado da última, então não cole tudo de uma vez.

| # | Sonda | Resultado esperado | Se der diferente |
|---|---|---|---|
| 1A | anon nas tabelas públicas | quatro zeros | pare |
| 1B | anon em `perfil_privado` | **ERRO** `permission denied` | qualquer número = vazamento, pare |
| 1C | anon em `audit_logs` | **ERRO** `permission denied` | qualquer número = vazamento, pare |
| 2 | busca pública funciona | exatamente **`1`** | ver abaixo |
| 3 | auto-aprovação | `OK: RLS barrou a auto-aprovacao` | ver abaixo |
| 4 | telefone de terceiro | `0` | pare |
| 5 | estado dos dados | vet e clinic em `incomplete` | pare |
| 6 | RLS por tabela | tudo `true` | pare |
| 7 | contas de pé | `17` e `17` | pare |
| 8 | CHECK do documento | `false, false, false, false, true` | pare |

> **⚠️ Nas sondas 1B e 1C, ERRO é o resultado de SUCESSO.** É a prova de que o anônimo não alcança a tabela. Não se assuste com o vermelho.

### Sonda 2 é a mais importante

- **`1`** → a busca pública funciona. Siga.
- **`0`** → a leitura pública está morta. **Pare e me chame.**
- **`ERRO: permission denied for function perfil_esta_ativo`** → o furo SEC-014 voltou. **Pare e me chame.**

### Sonda 3 lê a mensagem, não o "UPDATE n"

- `OK: RLS barrou a auto-aprovacao` → correto, siga.
- `SONDA INVALIDA: ...` → a sonda não testou nada. **Não interprete como sucesso**, me chame pra consertar a sonda.
- `FALHA GRAVE: o profissional se auto-aprovou` → **pare imediatamente.**

---

## PASSO 5 — A verificação que nenhum SQL faz (5 min)

A `handle_new_user` foi **substituída** pela migration, e o cadastro é o único caminho **já em produção** que ela altera. Nenhuma sonda cobre isso.

- [ ] Ir em https://vetriabrasil.com.br/cadastro/veterinario
- [ ] Criar uma conta de teste de verdade (use um email que você acesse)
- [ ] Confirmar o email
- [ ] Rodar no SQL Editor:

```sql
select p.id, p.role, p.status, p.onboarding_completed, u.email, p.created_at
from public.profiles p join auth.users u on u.id = p.id
order by p.created_at desc limit 3;
```

Esperado: a conta nova aparece, com `role = 'vet'`, `status = 'incomplete'`, `onboarding_completed = false`.

**Se a linha não aparecer, o trigger quebrou e ninguém mais consegue criar conta.** Pare e me chame.

---

## PASSO 6 — Liberar os sócios (5 min)

Depois que Marília e Durval refizerem o onboarding, eles ficam em `pending_validation`.

- [ ] Ver quem está esperando

```sql
select p.id, p.full_name, p.role, p.status, u.email
from public.profiles p join auth.users u on u.id = p.id
where p.status = 'pending_validation'
order by p.updated_at desc;
```

- [ ] Aprovar cada um (troque o uuid)

```sql
update public.profiles
set status = 'active', status_motivo = 'Aprovado manualmente (socio).', updated_at = now()
where id = 'COLE-O-UUID-AQUI';
```

---

## PASSO 7 — Fechar a semana (5 min)

- [ ] Anotar a data de aplicação em `supabase/migrations/README.md`
- [ ] Me avisar o resultado de cada sonda

Aí eu:
- Marco a **T-001 e a T-002** como concluídas em `docs/03-TAREFAS.md`
- Atualizo `docs/02-ESTADO.md` com o que passou a ser real
- Registro o DL da aplicação em `docs/05-DECISOES.md`
- Ressincronizo o `/roadmap`

---

## SE ALGO DER ERRADO

A seção **13** do `0002_nucleo.sql` tem o procedimento de reversão completo, comentado.

**Não rode a reversão sozinho.** Me chame primeiro. Ela desfaz a estrutura, mas **não** restaura o `onboarding_completed` dos profissionais: pra isso é o backup do Passo 1. E ela tem um passo (o **4b**) que, se for pulado, quebra o cadastro de todo mundo em silêncio.

---

## DEPOIS DISSO

A **S1 fecha**. O próximo é a **T-003 — Playwright + CI**, que não depende do banco e é o que vai deixar o agente de QA testar os fluxos sozinho, em todos os roles, sem você precisar logar em cada conta.

A **S2** liga os três formulários de onboarding nas tabelas novas. Aí o que o profissional digita passa a existir de verdade.
