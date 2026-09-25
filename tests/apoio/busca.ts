// APOIO DA F4: busca (/buscar) e perfil público (/veterinario/[slug],
// /estabelecimento/[slug]).
//
// ⚠️ O INTERRUPTOR `E2E_BUSCA_LIGADA`, e por que ele existe.
//
// A busca e o perfil público dependem da migration 0005 (tabelas de lista,
// cidades do IBGE, slug gerado na aprovação). Antes dela o produto responde
// "A busca abre em breve" e todo slug dá 404, de propósito. Os testes com
// DADO REAL (conta aprovada aparece, pendente não aparece, suspensa some) só
// fazem sentido depois dela.
//
// O CI roda com `E2E_EXIGIR_FILA=1`, em que PULO É FALHA (`pulo.ts`, R-053).
// Então o grupo que depende da 0005 NÃO pula quando ela falta: ele nem é
// registrado (`busca-com-dados.spec.ts`, bloco `if (BUSCA_LIGADA)`). Nada
// aparece como "skipped" no relatório, e nada fica verde mentindo, porque o
// arquivo sempre ativo (`busca-publica.spec.ts`) AMARRA o interruptor ao
// estado real do alvo nos dois sentidos:
//
//   · sem a variável, ele EXIGE "A busca abre em breve". No dia em que a 0005
//     entrar no vetria-e2e e ninguém ligar a variável, o CI fica VERMELHO
//     dizendo qual linha acrescentar no ci.yml. O grupo B não fica esquecido.
//   · com a variável, ele EXIGE que a busca tenha aberto. Variável ligada num
//     banco sem a 0005 também fica vermelho, com o motivo.
//
// A linha, no bloco `env:` do job em `.github/workflows/ci.yml`, depois da
// 0005 e do seed de cidades aplicados no vetria-e2e:
//
//     E2E_BUSCA_LIGADA: "1"

import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const BUSCA_LIGADA = process.env.E2E_BUSCA_LIGADA === "1";

export const COMO_LIGAR =
  'Se a 0005 (e o seed de cidades) ja foi aplicada neste alvo, acrescente E2E_BUSCA_LIGADA: "1" no env do job em .github/workflows/ci.yml (local: exporte E2E_BUSCA_LIGADA=1).';

export const COMO_DESLIGAR =
  "E2E_BUSCA_LIGADA=1, mas o alvo ainda responde como se a 0005 nao existisse. Aplique a 0005 e o seed de cidades no banco do alvo, ou tire a variavel.";

/** Um pedaço aleatório só de letras: entra no nome e é o termo da busca.
 *  Só letras de propósito: o full-text em português parte "ab12" em tokens
 *  diferentes conforme a versão do parser; letra pura casa sempre igual. */
export function marcaDeRodada(tamanho = 10): string {
  const letras = "bcdfghjklmnpqrstvwxz"; // sem vogal: não vira palavra que o stemmer encurte
  let s = "";
  for (let i = 0; i < tamanho; i++) s += letras[Math.floor(Math.random() * letras.length)];
  return s;
}

/** Todos os `<meta name="robots">` da página. Next pode escrever mais de um
 *  (o da página e o do 404); TODOS têm de dizer noindex. */
export async function conferirNoindex(page: Page, rota: string): Promise<void> {
  const metas = page.locator('meta[name="robots"]');
  const conteudos = await metas.evaluateAll((els) =>
    els.map((e) => e.getAttribute("content") ?? "")
  );
  expect(conteudos.length, `${rota}: nenhum <meta name="robots"> na pagina`).toBeGreaterThan(0);
  for (const c of conteudos) {
    expect(c, `${rota}: meta robots sem noindex (DL-063: nada publico e indexado antes da abertura)`).toMatch(
      /noindex/
    );
  }
}

// ---------------------------------------------------------------------------
// O QUE NUNCA PODE ESTAR NO HTML PÚBLICO (DL-047, matriz §3 regra 3)
// ---------------------------------------------------------------------------
// Conferido no HTML CRU (a resposta do servidor, com o payload do RSC dentro),
// e não só no texto visível: raspador lê o HTML, não a tela.

/** Links que entregam o número: `wa.me`, `api.whatsapp.com`, `whatsapp://`, `tel:`. */
const LINK_DE_CONTATO = /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/|href=\\?"tel:/i;

/** Chave de campo privado serializada (JSON ou payload do RSC, com aspas
 *  escapadas ou não). Minúsculo e com dois-pontos: "O contato pelo WhatsApp"
 *  em texto não casa; `"whatsapp":"6399..."` casa. */
const CHAVE_PRIVADA =
  /\\?"(whatsapp|telefone|phone|email_contato|endereco|cep|documento_path|documento_hash)\\?"\s*:/;

/** Telefone brasileiro no texto visível: (63) 99123-4567, 63 991234567... */
const TELEFONE_VISIVEL = /\(?\b\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}\b/;

/**
 * Busca a rota pelo `request` (HTML cru) e pela `page` (texto visível) e
 * confere que nada de contato ou endereço privado sai. `numeros` são dígitos
 * que o teste gravou no `perfil_privado` e que não podem aparecer em lugar
 * nenhum, nem inteiros nem pelos últimos 8 dígitos.
 */
export async function conferirSemContatoNoHtml(
  request: APIRequestContext,
  page: Page,
  rota: string,
  numeros: string[] = []
): Promise<void> {
  const resposta = await request.get(rota);
  const html = await resposta.text();

  expect(html, `${rota}: link de WhatsApp/telefone no HTML (DL-047)`).not.toMatch(LINK_DE_CONTATO);
  expect(html, `${rota}: chave de campo privado serializada no HTML`).not.toMatch(CHAVE_PRIVADA);
  for (const n of numeros) {
    const final = n.slice(-8);
    expect(html.includes(n), `${rota}: o numero gravado em perfil_privado saiu no HTML`).toBe(false);
    expect(html.includes(final), `${rota}: os ultimos 8 digitos do numero privado sairam no HTML`).toBe(false);
    expect(
      html.includes(`${final.slice(0, 4)}-${final.slice(4)}`),
      `${rota}: o numero privado saiu formatado no HTML`
    ).toBe(false);
  }

  await page.goto(rota);
  const texto = await page.locator("body").innerText();
  expect(texto, `${rota}: telefone no texto visivel`).not.toMatch(TELEFONE_VISIVEL);
}
