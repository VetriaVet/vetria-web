# 03 — QUADRO DE TAREFAS

> Fila viva. **Uma task em execução por vez** no que escreve código.
> Atualizado por quem executa, no início e no fim de cada task.
>
> **Semana atual:** S1 ✅ fechada em 26/08 · **Próxima:** S2 · **Fase:** F3

---

## LEGENDA

**Nível de autonomia** (herdado do `HANDOFF.md`, regra do projeto):
- 🟢 **VERDE** — commit direto com build verde. Visual, copy, docs, assets. Máx. 3 arquivos.
- 🟡 **AMARELO** — mostra o diff e espera aprovação. `lib/`, `middleware.ts`, `/api/*`, config, `components/`, dependência nova, >3 arquivos.
- 🔴 **VERMELHO** — só com Elber presente. Migration, RLS, lógica de auth, `.env`, Stripe, qualquer coisa destrutiva.
- 🟠 **LARANJA** — escopo ambíguo: pergunta antes de começar.

**Estado:** `⬜ fila` · `🔵 em execução` · `⏸️ bloqueada` · `✅ concluída` · `🚫 cancelada`

---

## FORMATO DO CARD (copiar ao criar task nova)

```
### T-NNN — <título curto e imperativo>
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S1
- **Capacidade:** E1   ← obrigatório. Sem E1–E6, a task não entra na fila.
- **Nível:** 🟡
- **Agente dono:** vetria-backend
- **Depende de:** T-000 (ou "nada")
- **Por quê:** 1 frase. O que quebra ou falta se isso não for feito.
- **Feito quando:**
  - [ ] critério verificável 1
  - [ ] critério verificável 2
- **Não fazer:** o que está fora desta task e é tentador fazer junto
- **Resultado:** _(preenchido no fim: commit, o que mudou, o que se descobriu)_
```

---

# 🔵 EM EXECUÇÃO

_(vazio)_

---

# ⬜ FILA — F3 / S1

### T-005 — Onboarding profissional estoura a largura da tela
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S2
- **Capacidade:** E2
- **Nível:** 🟢
- **Agente dono:** vetria-ui
- **Depende de:** nada
- **Por quê:** é a **primeira tela** que todo profissional vê depois de confirmar o email. Logo cortada e barra de rolagem horizontal na primeira impressão, num produto que se vende como "plataforma séria e profissional".
- **Causa (diagnosticada em 26/08):** `app/app/veterinario/onboarding/VetOnboardingForm.tsx:92` usa `-m-6 sm:-m-8`, margem negativa feita pra furar o padding de um container pai. Esse pai deixou de existir quando os onboardings saíram do route group `(painel)` (DL-025/DL-031): `app/app/layout.tsx` devolve os filhos sem padding para vet e clínica. A margem negativa então joga 2rem pra fora de cada lado e a página fica 4rem mais larga que a viewport. O `min-h-[calc(100vh-4rem)]` tem o mesmo vício: desconta um header que não está ali.
- **Feito quando:**
  - [ ] Sem rolagem horizontal em 375, 768 e 1440
  - [ ] Logo inteira e visível
  - [ ] Mesma checagem no `ClinicOnboardingForm.tsx`, que é clone e provavelmente tem o mesmo problema
  - [ ] Varredura por outras margens negativas órfãs no `app/` (`grep -rn "\-m-6\|\-m-8"`)
- **Não fazer:** não redesenhar a tela. É correção de layout, não refação visual.
- **Observação:** confirmado em produção pelo Elber em 26/08/2026, logo após o primeiro cadastro real.

### T-002 — Bucket de documentos no Storage
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S1
- **Capacidade:** E1
- **Nível:** 🔴 presencial
- **Agente dono:** vetria-backend + Elber
- **Depende de:** T-001
- **Por quê:** validação de CRMV é manual pelo admin (V1) e precisa do documento em algum lugar seguro.
- **Feito quando:**
  - [ ] Bucket `documentos` criado, **privado**
  - [ ] Policy: o dono lê e escreve o próprio; admin lê tudo; público não lê nada
  - [ ] Acesso por URL assinada com expiração curta, nunca por URL pública
  - [ ] Limite de tamanho e de MIME type definidos e documentados
- **Não fazer:** não subir documento nenhum ainda — o upload é a T-004.

### T-003 — Instalar Playwright + CI
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S1
- **Capacidade:** transversal (testes)
- **Nível:** 🟡
- **Agente dono:** vetria-qa
- **Depende de:** nada — pode rodar em paralelo com T-001
- **Por quê:** são 12 semanas de mudança em código que já está em produção. Sem rede de segurança, regressão vira descoberta do cliente.
- **Feito quando:**
  - [ ] Playwright instalado, `npm run test:e2e` funcionando
  - [ ] Workflow do GitHub Actions rodando build + lint + E2E em push na `main`
  - [ ] Primeiro teste real: login com credencial de teste → chega no painel certo
  - [ ] Usuários de teste **não** vêm de `.env` commitado — vêm de secret do GitHub
  - [ ] `README.md` explica como rodar teste local
- **Não fazer:** não escrever teste de tela que ainda é casca. Testa só o que já é real.

### T-004 — Auditoria de segurança inicial (linha de base)
- **Estado:** ⬜ fila
- **Fase / Semana:** F3 / S1
- **Capacidade:** transversal (segurança)
- **Nível:** somente leitura — produz relatório, não toca código
- **Agente dono:** vetria-seguranca
- **Depende de:** nada — roda em paralelo
- **Por quê:** precisamos saber o tamanho do buraco antes de construir em cima. Já há suspeita confirmada em R-001.
- **Feito quando:**
  - [ ] `docs/relatorios/SEC-2026-08-XX.md` escrito
  - [ ] Achados classificados 🔴 / 🟠 / 🟡 com prova (arquivo:linha e como explorar)
  - [ ] Cada achado 🔴 virou card de task nesta fila
  - [ ] `04-RISCOS.md` atualizado
- **Não fazer:** não corrigir nada. Auditor não conserta — auditor reporta.

---

# ⏸️ BLOQUEADAS

_(vazio)_

---

# ✅ CONCLUÍDAS

### T-001 — Migration 0002: núcleo de dados
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** `0002_nucleo.sql` aplicada em produção. Criou `profiles.status` e `status_motivo`, `vet_profiles`, `clinic_profiles`, `perfil_privado`, `animais`, `contatos`, `audit_logs`, com RLS codificando `06-PERMISSOES.md`. Mais `is_admin()`, `perfil_esta_ativo()`, `tem_role()`, `admin_definir_status()`, `concluir_onboarding_profissional()` e dois triggers de revalidação. Removeu `current_user_role()` (INVOKER sem search_path, mina do DL-014), `is_admin_master()` (duplicata, fecha R-005) e a policy `profiles_update_own_safe` (superada, e mantê-la anularia o pin de `status`).
- **Auditoria:** 4 rodadas. v1 reprovada com 2 críticos (responsável entrava na busca como veterinário; base de telefones vazava pela API). v2 fechou os dois e abriu quatro nas próprias correções, incluindo um que desligaria a busca pública inteira sem aparecer em teste com usuário logado. v5 aprovada. Relatório: `docs/relatorios/SEC-2026-08-26.md`, 2854 linhas.
- **Descoberto ao aplicar:** a migration **não rodava**. `perfil_esta_ativo()` é `LANGUAGE sql` e consulta `profiles.status`, mas era criada antes da coluna existir. As 4 auditorias revisaram semântica e autorização; nenhuma percorreu a ordem de execução contra um banco real. Corrigido trocando as seções 2 e 3 de lugar.
- **Verificado:** 9 sondas. Destaques: busca pública funciona para o anônimo (Sonda 2 = 1); `perfil_privado` inacessível ao anônimo; o profissional **não** consegue se auto-aprovar (WITH CHECK levanta); travessia de caminho e SVG barrados; 18 contas e 18 profiles depois de um cadastro real de ponta a ponta.
- **Commits:** `2846ec2` → `52bd9b9`

### T-000b — Baseline do schema atual versionado
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** `0000_baseline.sql` versiona o schema que existia antes desta pasta (fecha R-006). Corrigiu três coisas que a documentação afirmava errado: `profiles` **tem** `full_name` e `phone` (o DL-019 dizia que não); `master` não é role, é `admin_level`; o enum `admin_level` é `('none','admin','master')` e `comum` nunca existiu, o que torna o R-002 item 3 improcedente.

### T-000 — Instalar sistema de governança e agentes
- **Estado:** ✅ concluída em 26/08/2026
- **Resultado:** `docs/` criado (escopo congelado, plano de 13 semanas, estado, tarefas, riscos, decisões, protocolo de agentes). 6 agentes definidos em `.claude/agents/`. `HANDOFF.md` reescrito como protocolo de entrada de sessão. `CONTEXT.md` e `BACKLOG.md` congelados como histórico.

---

## REGRAS DA FILA

1. **Sem capacidade E1–E6, não entra.** Ideia sem capacidade vai pra `04-RISCOS.md` §Ideias.
2. **Uma task 🔵 por vez** entre os agentes que escrevem código. Auditores rodam quando quiserem.
3. **Achado de auditoria vira card** — nunca correção direta no meio de outra task.
4. **Task que cresce, para.** Se a real for maior que o card, marca ⏸️, escreve o que descobriu e pergunta. Não segue empurrando.
5. **Card sem "Resultado" preenchido não é ✅.** Task sem rastro é task que ninguém vai conseguir continuar.
