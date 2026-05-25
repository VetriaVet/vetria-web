# Roteiro de apresentação — Vetria (fase visual / casca)

> Objetivo: mostrar a **experiência completa** do produto (todas as telas no design final) e deixar claro o que já é **real** e o que é **casca** (estrutura pronta, conteúdo entra com o backend).

---

## ✅ Antes de começar (checklist — evita tropeço ao vivo)

- [ ] **Acordar o Supabase.** O projeto free pausa por inatividade. Abra o app ~10 min antes; se o login der "Failed to fetch", entre no dashboard do Supabase e restaure o projeto.
- [ ] **Conta de demo pronta e confirmada.** O envio de email (Resend) está em **modo teste** — confirmação só chega no endereço verificado. Tenha 1 conta de cada papel **já criada e confirmada**:
  - 1 tutor · 1 veterinário · 1 clínica · 1 admin
- [ ] Abra numa **janela anônima/deslogada** pra começar pela Home pública.
- [ ] Tenha as 4 abas/logins à mão pra alternar entre os papéis sem perder o ritmo.

---

## 🎬 Roteiro (ordem sugerida, ~10 min)

### 1. Home pública (deslogado) — `/`
A porta de entrada do consumidor. Mostrar:
- Hero com busca (especialidade + cidade) e os modos **Presencial / Domiciliar / Online**
- Categorias, "Como funciona" (4 passos), **confiança** (CRMV verificado etc.)
- O bloco **"Novos perfis"** (em esqueleto — enche quando houver profissionais validados)
- O CTA **"Você é veterinário ou clínica?"** → leva ao cadastro profissional

> Fala-chave: *"Tudo no design final. A busca e os perfis ligam na próxima fase (backend)."*

### 2. Cadastro + login (REAL)
- Clicar **Criar conta** / **Sou veterinário** → mostrar o funil separado: tutor (rápido) vs vet/clínica (B2B)
- Login com email/senha **funciona de verdade** (e Google)

> Fala-chave: *"Autenticação, cadastro e separação por papel já são reais."*

### 3. Painel do TUTOR (B2C) — `/app/tutor`
- Saudação, busca, **quick actions**
- "Próximas consultas" e "Meus pets" como **empty calmo** (estado positivo: nada pendente)

### 4. Painel do VETERINÁRIO — `/app/vet`
- Sidebar premium (Principal / Conta)
- Dashboard: **atividade** e **stats** em esqueleto (ghost) — mostra o formato sem inventar número
- Navegar a sidebar: **Contatos, Agenda, Avaliações, Meu plano, Configurações, Ajuda** — todas abrem
- **Meu perfil** (formulário) e **Aguardando validação** (timeline do CRMV)

### 5. Painel da CLÍNICA — `/app/clinic`
- Mesma base do vet + **Equipe** (lista de profissionais em esqueleto + fluxo de convite)

### 6. Admin (interno) — `/admin`
- **Usuários**: ferramenta real de papéis/acesso (RBAC) — funciona
- Validações / Moderação / Conteúdo: estrutura pronta (fila em esqueleto)

---

## 🟢 O que já é REAL (funciona hoje)
- Cadastro, login (email + Google), confirmação por email, roteamento por papel
- Separação tutor (B2C) × vet/clínica (B2B)
- Admin: gestão de papéis/acesso (RBAC)
- Design system v2 aplicado em **todas** as telas (Inter + paleta oficial)

## 🟡 O que é CASCA (design pronto, conteúdo entra com o backend)
- **Ghost** (esqueleto) = onde haverá lista/tabela: atividade, contatos, avaliações, equipe, filas do admin, novos perfis
- **Empty calmo** = estados positivos sem pendência (próximas consultas, pets, agenda)
- Estados **honestos**: nenhum número/perfil/preço inventado

## 🔵 Próxima fase — backend pesado
Busca + perfil público · agendamentos (agenda) · contatos/mensagens · avaliações reais · métricas reais · validação de CRMV · convite de equipe · captura de pets · planos & cobrança (Stripe)

---

*Princípio que guiou a casca: mostrar o produto vivo **sem mentir dado** — esqueleto onde ensina, vazio calmo onde acalma.*
