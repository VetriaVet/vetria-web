This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testes (E2E com Playwright)

Rede de segurança dos fluxos críticos. Ver o card **T-003** em `docs/03-TAREFAS.md`.

### Rodar local

```bash
npm run test:e2e           # roda a suíte inteira (constrói e sobe o servidor sozinho)
npm run test:e2e:ui        # modo interativo, bom pra escrever teste novo
npm run test:e2e:report    # abre o último relatório HTML
```

Não precisa subir o servidor antes: o Playwright roda `npm run build && npm run start`
sozinho. Se você já tiver um `npm run dev` na porta 3000, ele reaproveita.

Para apontar a suíte pra outro alvo (uma URL de preview da Vercel, por exemplo):

```bash
E2E_BASE_URL=https://minha-preview.vercel.app npm run test:e2e
```

### As duas camadas

| Arquivo | Precisa de credencial? | O que cobre |
|---|---|---|
| `tests/e2e/publico.spec.ts` | não | portas trancadas do `middleware.ts`, telas públicas, `noindex` do `/roadmap`, regra de copy do DL-038 |
| `tests/e2e/login.spec.ts` | **sim** | login real com sessão real, roteamento por role, isolamento entre painéis |

Sem as credenciais, os testes da segunda camada aparecem como **skipped com o motivo
escrito** — nunca como suíte verde. Passar e pular são coisas diferentes.

### Variáveis de ambiente

Local elas vêm do `.env.local`, que **não é versionado**. No CI vêm de
**secret do GitHub** (`Settings > Secrets and variables > Actions`).

| Variável | Obrigatória | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | sim | pública por desenho, viaja no bundle |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sim | pública por desenho, protegida por RLS |
| `E2E_VET_EMAIL` | só pra 2ª camada | conta de teste com role `vet` |
| `E2E_VET_SENHA` | só pra 2ª camada | |

> ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` nunca entra no CI nem em teste.** Ela ignora a RLS
> inteira. Se um teste parecer precisar dela, o teste está errado.

> ⚠️ **A conta de teste é criada uma vez, à mão, e reutilizada.** A suíte não cria conta
> em produção: conta órfã vira dado pessoal sem dono na hora da exportação e exclusão da F6.

### CI

`.github/workflows/ci.yml` roda **build + lint + E2E** em push na `main` e em todo pull
request.

> ⚠️ O passo de **lint não bloqueia ainda** (`continue-on-error: true`). São 14 erros e
> 3 avisos anteriores à T-003, todos em arquivo de produção. Ver o card **T-014**: quando
> ele fechar, essa linha some do workflow.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
