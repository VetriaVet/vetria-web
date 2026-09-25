# Auditoria de segurança — F4: busca e perfil público (camada de dados e rotas) — 23/09/2026
**Autor:** `vetria-seguranca` (somente leitura; salvo pela sessão principal). **Base:** `dd21dce` + arquivos novos
sem commit (`lib/supabase/publico.ts`, `lib/publico/*`, `lib/busca/*`, `lib/perfil-publico/*`, `app/buscar`,
`app/veterinario/[slug]`, `app/estabelecimento/[slug]`).

## Veredito: APROVADO · 🔴 0 · 🟠 0 · 🟡 3
**Nota da sessão principal:** o auditor não achou a `0005` no disco porque ela está commitada na branch
`t-036-e-t-028` (PR aberta), e a árvore dele estava na `main`. A 0005 foi auditada à parte em
`SEC-2026-09-23-T036-0005.md` (APROVADA). Esta auditoria cobre só o código do Next.

- **Cliente anônimo:** correto. Chave anon, sem cookie, sem `service_role`; só `*_select_publico`
  (`perfil_esta_ativo`) vale; nenhum filtro de status na aplicação.
- **Colunas:** nada de `perfil_privado`, `id`, `endereco`, `cep`, `whatsapp`, `telefone`; sem `wa.me`. CRMV no
  perfil público é aceitável pela matriz §3 (registro público do conselho). `site` só http/https, com
  `rel="nofollow noopener noreferrer ugc"`.
- **Injeção:** o regex de cidade sai de `cidades.chave` do banco (`^[a-z0-9]{1,80}$`), sem ReDoS; texto do usuário
  vira chave `[a-z0-9]` ou `plfts` de até 80 caracteres; sem `or()`/`ilike` com entrada do usuário; listas fechadas;
  teto de 25 páginas.
- **Erros:** só o `code` vai ao log; texto genérico na tela. **Slug e metadata:** 404 igual para inexistente e não
  ativo; `noindex, nofollow`; sem sitemap. **XSS:** sem `dangerouslySetInnerHTML`.

## Achados
- **SEC-117 · 🟡 esconder coluna na aplicação não protege nada, e o prazo do R-032 é agora.** Com a chave anon,
  `GET /rest/v1/clinic_profiles?select=id,endereco,cep` devolve esses dados de todo estabelecimento ativo (RLS
  filtra linha, não coluna). Não diverge da matriz, mas precisa de decisão registrada antes da 0005: público por
  desenho (endereço comercial) ou `revoke select (endereco, cep)` / mover para `perfil_privado`.
- **SEC-118 · 🟡 `connection()` dentro de try/catch** na camada de dados; a proteção contra cache depende de detalhe
  interno do Next. **Correção pedida:** `export const dynamic = "force-dynamic"` nas 3 páginas.
- **SEC-119 · 🟡 cada GET em `/buscar` faz 7 a 9 consultas (duas com `count: exact`), sem limite de requisições.**
  Baixo impacto hoje; entra no rate limit do portão (DL-063) e na função de busca da S6.
