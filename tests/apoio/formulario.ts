// Helpers dos formulários de onboarding em 4 passos (vet e estabelecimento).
//
// Saíram de `onboarding-vet.spec.ts` em 23/09/2026, quando o item 1 do DoD
// (conta nova, T-029) passou a precisar dos mesmos passos. Os dois formulários
// desenham o mesmo rótulo "Passo N de 4" e os mesmos botões "Continuar" e
// "Voltar", então um helper serve aos dois.

import { expect, type Page, type Request } from "@playwright/test";

export function passo(page: Page, n: number) {
  // A flag `i`: o rótulo é escrito em caixa mista no JSX e sobe em caixa alta
  // por CSS (`uppercase`).
  return page.getByText(new RegExp(`Passo ${n} de 4`, "i"));
}

/** Em qual passo o formulário está agora, lido da própria tela.
 *
 * ⚠️ `textContent()`, NÃO `innerText()`: o elemento tem `uppercase`, e o
 * `innerText()` devolve o texto já transformado pelo CSS. Isso derrubou o CI
 * na primeira execução real da suíte (21/09/2026). */
export async function passoAtual(page: Page): Promise<number> {
  const texto = (await page.getByText(/Passo \d de 4/i).textContent()) ?? "";
  const achado = texto.match(/Passo (\d) de 4/i);
  if (!achado) throw new Error(`nao consegui ler o passo atual em "${texto}"`);
  return Number(achado[1]);
}

export function botaoContinuar(page: Page) {
  return page.getByRole("button", { name: /^continuar$/i });
}

/**
 * Avança um passo, e só clica enquanto ainda estiver no passo de origem.
 *
 * ⚠️ O `toPass` não é frescura: o formulário é Client Component e o clique
 * que chega antes da hidratação não faz nada. Esperar ESTADO (o passo mudou),
 * nunca relógio.
 *
 * Desde a T-035 o "Continuar" também fica desabilitado por campo com máscara
 * fora da regra (CRMV, WhatsApp) e por especialidade acima do limite, e o
 * rodapé diz o motivo. A mensagem de falha leva esse motivo junto.
 */
export async function avancar(page: Page, de: number) {
  await expect(async () => {
    if (await passo(page, de).isVisible()) {
      const botao = botaoContinuar(page);
      if (await botao.isDisabled()) {
        const motivo = (await botao.getAttribute("title")) ?? "(sem motivo no title)";
        throw new Error(`o botao Continuar do passo ${de} esta desabilitado. Motivo na tela: ${motivo}`);
      }
      await botao.click();
    }
    await expect(passo(page, de + 1)).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 25_000 });
}

/** Avança do passo em que a tela ESTÁ até o alvo. */
export async function irParaPasso(page: Page, alvo: number) {
  let atual = await passoAtual(page);
  while (atual < alvo) {
    await avancar(page, atual);
    atual += 1;
  }
}

export async function voltarParaPasso(page: Page, alvo: number) {
  let atual = await passoAtual(page);
  while (atual > alvo) {
    await page.getByRole("button", { name: /^voltar$/i }).click();
    await expect(passo(page, atual - 1)).toBeVisible();
    atual -= 1;
  }
}

/**
 * Abre o formulário já hidratado e no passo 1. A ida ao passo 2 e a volta
 * provam que o React está vivo antes de qualquer clique do teste.
 */
export async function abrirFormulario(page: Page, rota: string, rotaFinal: RegExp) {
  await page.goto(rota);
  await expect(page).toHaveURL(rotaFinal);
  await expect(passo(page, 1)).toBeVisible();
  await avancar(page, 1);
  await voltarParaPasso(page, 1);
}

// ---------------------------------------------------------------------------
// A SERVER ACTION, VISTA DA REDE
// ---------------------------------------------------------------------------
// Uma Server Action do Next é um POST para a própria rota com o cabeçalho
// `next-action`. É assim que se prova, de fora, que a tela NÃO mandou nada.

function ehServerAction(req: Request): boolean {
  return req.method() === "POST" && req.headers()["next-action"] !== undefined;
}

/** Começa a contar as chamadas de Server Action desta página. Devolve a
 *  função que lê o total até agora. */
export function contarServerActions(page: Page): () => number {
  let total = 0;
  page.on("request", (req) => {
    if (ehServerAction(req)) total += 1;
  });
  return () => total;
}

/**
 * CONTORNA A TELA: reescreve o argumento da próxima Server Action da rota
 * antes de ele sair do navegador. É o que um atacante faz com DevTools, e é o
 * único jeito de chegar ao servidor com um valor que a máscara não deixa
 * digitar.
 *
 * O corpo de uma Server Action com argumento simples é o JSON da lista de
 * argumentos (`encodeReply` do React). Se o corpo não tiver o formato
 * esperado, o pedido é ABORTADO e o teste falha: mandar o payload original
 * sem a adulteração gravaria dado de verdade e o teste passaria sem provar
 * nada.
 *
 * ⚠️ Use só com valor que o BANCO TAMBÉM recusa (CHECK da `0004`). Assim, se
 * um dia a Action regredir e deixar passar, o CHECK recusa o upsert inteiro e
 * nada é gravado, nem em produção. Ver os testes que usam isto.
 */
export async function adulterarProximaAction(
  page: Page,
  rota: string,
  mudar: (payload: Record<string, unknown>) => void
): Promise<{ adulterou: () => boolean; motivoDeFalha: () => string | null }> {
  let feito = false;
  let falha: string | null = null;

  await page.route(
    (url) => url.pathname === rota,
    async (route) => {
      const req = route.request();
      if (!ehServerAction(req) || feito) return route.fallback();

      const corpo = req.postData();
      try {
        if (!corpo) throw new Error("corpo vazio (multipart?)");
        const args = JSON.parse(corpo) as unknown;
        if (!Array.isArray(args) || typeof args[0] !== "object" || args[0] === null) {
          throw new Error("o corpo nao e a lista de argumentos esperada");
        }
        mudar(args[0] as Record<string, unknown>);
        feito = true;
        return route.continue({ postData: JSON.stringify(args) });
      } catch (e) {
        falha = e instanceof Error ? e.message : String(e);
        return route.abort();
      }
    }
  );

  return { adulterou: () => feito, motivoDeFalha: () => falha };
}
