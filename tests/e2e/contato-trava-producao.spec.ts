import { test, expect } from "@playwright/test";
import { marcaDeRodada } from "../apoio/busca";
import { CONTATO_LIGADO, NO_MESMO_SITE, ROTA_CONTATO, cookiesDoVisitante, pedidoDeContato } from "../apoio/contato";
import { BASE_URL } from "../apoio/sessao";

// T-043 · SEC-130 (auditoria de 28/10): A TRAVA DE PRODUÇÃO DA PORTA DO CONTATO.
//
// `lib/contato/porta.ts` abre o modo de teste só com TRÊS coisas juntas:
// `CONTATO_ABERTO_PARA_TESTE=1`, `VERCEL_ENV !== "production"` e URL do
// Supabase que não seja a de produção. A SEC-130 pediu prova automática de que
// a variável posta por engano num deploy de produção NÃO abre a porta.
//
// Como se prova aqui: `playwright.config.ts` sobe, SÓ NO CI, um SEGUNDO
// `next start` do MESMO build, com a variável ligada e `VERCEL_ENV=production`
// (porta 3007). O mesmo pedido, para um slug que não existe:
//   · no servidor normal (3000): 404 `nao_encontrado`, porque a porta abriu e
//     o banco respondeu (controle positivo: sem ele, um 503 provaria nada);
//   · no servidor "de produção" (3007): 503 `indisponivel`, sem cookie e sem
//     chamada ao banco.
//
// ⚠️ O QUE ISTO NÃO PROVA: a trava da URL de produção. `NEXT_PUBLIC_SUPABASE_URL`
// é EMBUTIDA no build pelo Next; trocar a variável no `next start` não muda o
// que `porta.ts` lê. Provar essa trava exige um segundo `next build` com a URL
// de produção e chave de serviço falsa (minutos a mais e mais memória no
// runner, e um passo novo no `ci.yml`, que não é de `tests/`). Medida à mão
// em 28/10 (comentário de `porta.ts`); fica como pendência da T-043.
//
// Não escreve nada: o slug não existe, e a porta fechada nem chega ao banco.

const URL_COMO_PRODUCAO = process.env.E2E_URL_SERVIDOR_COMO_PRODUCAO;

if (CONTATO_LIGADO && URL_COMO_PRODUCAO) {
  test.describe("SEC-130: VERCEL_ENV=production fecha a porta mesmo com CONTATO_ABERTO_PARA_TESTE=1", () => {
    test("o mesmo pedido: 404 no servidor de teste, 503 no servidor que se diz producao", async ({ playwright }) => {
      const corpo = pedidoDeContato(`ninguem-${marcaDeRodada()}-palmas-to`);

      const teste = await playwright.request.newContext({ baseURL: BASE_URL });
      try {
        const r = await teste.post(ROTA_CONTATO, { headers: NO_MESMO_SITE, data: corpo });
        expect(
          r.status(),
          "controle: no servidor de teste a porta tinha de estar aberta (404 do banco). Sem isso o 503 abaixo nao prova nada."
        ).toBe(404);
        expect(await r.json()).toEqual({ ok: false, motivo: "nao_encontrado" });
      } finally {
        await teste.dispose();
      }

      const producao = await playwright.request.newContext({ baseURL: URL_COMO_PRODUCAO });
      try {
        const r = await producao.post(ROTA_CONTATO, { headers: NO_MESMO_SITE, data: corpo });
        expect(
          r.status(),
          "SEC-130: com VERCEL_ENV=production a porta abriu por causa de CONTATO_ABERTO_PARA_TESTE=1"
        ).toBe(503);
        expect(r.headers()["cache-control"] ?? "").toContain("no-store");
        expect(await r.json()).toEqual({ ok: false, motivo: "indisponivel" });
        expect(cookiesDoVisitante(r), "a porta fechada criou o cookie do visitante").toHaveLength(0);
      } finally {
        await producao.dispose();
      }
    });
  });
}
