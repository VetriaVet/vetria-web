import { test, expect } from "@playwright/test";
import {
  BUSCA_LIGADA,
  COMO_DESLIGAR,
  COMO_LIGAR,
  conferirNoindex,
  conferirSemContatoNoHtml,
  marcaDeRodada,
} from "../apoio/busca";

// Camada 7 da suíte: BUSCA E PERFIL PÚBLICO (F4, capacidades E4 e E5), a
// parte que vale ANTES e DEPOIS da 0005.
//
// Nada aqui cria conta, escreve no banco ou precisa de credencial: roda em
// qualquer alvo, e nunca pula. Os dois testes cuja resposta MUDA com a 0005
// (o estado da /buscar e o 503 de /api/cidades) não pulam de um lado nem do
// outro: afirmam o lado que `E2E_BUSCA_LIGADA` diz, e falham, dizendo o que
// fazer, quando o alvo e a variável discordam. É esse par que impede o grupo
// com dados (`busca-com-dados.spec.ts`) de ficar desligado em silêncio depois
// que a 0005 entrar (ver `tests/apoio/busca.ts`).

const PAGINAS_PUBLICAS = ["/buscar", "/veterinario", "/estabelecimento"] as const;

/** Um slug com o formato certo e que nenhuma conta tem, antes ou depois da
 *  0005. O formato inválido tem teste próprio: ele nem chega ao banco. */
function slugQueNaoExiste(): string {
  return `qa-e2e-nao-existe-${marcaDeRodada(8)}`;
}

test.describe("/buscar: a pagina sobe e diz a verdade sobre o proprio estado", () => {
  test("sem filtro: responde 200, sem erro, no estado que o alvo tem", async ({ page }) => {
    const resposta = await page.goto("/buscar");
    expect(resposta?.status()).toBe(200);

    // Nenhum dos dois estados é o de erro: "Não conseguimos buscar agora" é
    // o banco caído, e não é o que se espera de nenhum lado da 0005.
    await expect(page.getByText(/não conseguimos buscar agora/i)).toHaveCount(0);

    const emBreve = page.getByRole("heading", { level: 1, name: "A busca abre em breve" });
    if (!BUSCA_LIGADA) {
      await expect(
        emBreve,
        `a /buscar nao mostrou "A busca abre em breve". ${COMO_LIGAR}`
      ).toBeVisible();
      // Sem profissional inventado: os cartões do "em breve" são fantasmas,
      // escondidos de leitor de tela, e não há link para perfil nenhum.
      await expect(page.locator('a[href^="/veterinario/"], a[href^="/estabelecimento/"]')).toHaveCount(0);
      await expect(page.getByRole("link", { name: /crie o seu perfil/i })).toHaveAttribute("href", "/cadastro");
    } else {
      await expect(emBreve, COMO_DESLIGAR).toHaveCount(0);
      await expect(page.getByRole("search", { name: "Buscar profissionais" })).toBeVisible();
    }
  });

  test("com parametros na URL: tambem responde 200 sem erro", async ({ page }) => {
    // O link da busca é compartilhável (WhatsApp): parâmetro estranho, longo
    // ou com lixo não pode derrubar a página.
    const lixo = encodeURIComponent(`gato <script>x</script> ${"a".repeat(200)}`);
    for (const rota of [
      "/buscar?q=cardiologia&cidade=Palmas&uf=TO&atendimento=domiciliar&tipo=veterinario",
      `/buscar?q=${lixo}&uf=ZZ&especialidade=NAO_E_SLUG&pagina=-3&tipo=gato`,
    ]) {
      const resposta = await page.goto(rota);
      expect(resposta?.status(), rota).toBe(200);
      await expect(page.getByText(/não conseguimos buscar agora/i), rota).toHaveCount(0);
      if (!BUSCA_LIGADA) {
        await expect(
          page.getByRole("heading", { level: 1, name: "A busca abre em breve" }),
          `${rota}: ${COMO_LIGAR}`
        ).toBeVisible();
      }
    }
  });
});

test.describe("perfil publico: slug que nao existe da 404 com a mesma frase", () => {
  for (const base of ["/veterinario", "/estabelecimento"]) {
    test(`${base}/<slug inexistente> responde 404`, async ({ page }) => {
      const rota = `${base}/${slugQueNaoExiste()}`;
      const resposta = await page.goto(rota);
      expect(resposta?.status(), `${rota}: soft-404 (200) deixa o Google indexar pagina vazia`).toBe(404);
      await expect(
        page.getByRole("heading", { level: 1, name: "Este perfil não está disponível" })
      ).toBeVisible();
      // A página de 404 não conta se a conta existe ("em análise"): a frase é
      // a mesma para slug inexistente e conta fora do ar.
      await expect(page.getByText(/em análise|aguardando|suspens/i)).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Buscar profissionais" })).toHaveAttribute("href", "/buscar");
    });

    test(`${base}/<slug fora do formato> responde 404 sem cair`, async ({ page }) => {
      // Maiúscula, sublinhado, ponto e codificação: nada disso é slug (DL-067).
      for (const slug of ["Qualquer_Coisa", "a..b", "%27%20or%201%3D1", "-comeca-com-hifen"]) {
        const rota = `${base}/${slug}`;
        const resposta = await page.goto(rota);
        expect(resposta?.status(), rota).toBe(404);
        await expect(
          page.getByRole("heading", { level: 1, name: "Este perfil não está disponível" }),
          rota
        ).toBeVisible();
      }
    });
  }
});

test.describe("noindex nas tres paginas publicas (DL-063)", () => {
  for (const base of PAGINAS_PUBLICAS) {
    test(`${base} sai com noindex`, async ({ page }) => {
      const rota = base === "/buscar" ? "/buscar?q=cardiologia" : `${base}/${slugQueNaoExiste()}`;
      await page.goto(rota);
      await conferirNoindex(page, rota);
    });
  }
});

test.describe("/api/cidades", () => {
  test("q com mais de 60 caracteres e recusado com 400 e lista vazia", async ({ request }) => {
    const resposta = await request.get(`/api/cidades?q=${"a".repeat(61)}`);
    expect(resposta.status()).toBe(400);
    expect(await resposta.json()).toEqual({ cidades: [] });
  });

  test("q com menos de 2 letras devolve lista vazia sem consultar", async ({ request }) => {
    const resposta = await request.get("/api/cidades?q=p");
    expect(resposta.status()).toBe(200);
    expect(await resposta.json()).toEqual({ cidades: [] });
  });

  test("q valido: 503 sem a 0005, sugestoes do IBGE com ela", async ({ request }) => {
    const resposta = await request.get("/api/cidades?q=palmas");
    const corpo = (await resposta.json()) as { cidades: { nome: string; uf: string; slug: string }[] };

    if (!BUSCA_LIGADA) {
      expect(resposta.status(), `sem a 0005 a rota devolve 503. ${COMO_LIGAR}`).toBe(503);
      expect(corpo).toEqual({ cidades: [] });
      // 503 guardado pela CDN derrubaria o autocompletar por uma hora depois
      // da 0005 entrar.
      expect(resposta.headers()["cache-control"]).toContain("no-store");
      return;
    }

    expect(resposta.status(), COMO_DESLIGAR).toBe(200);
    expect(corpo.cidades.length).toBeGreaterThan(0);
    expect(corpo.cidades.length).toBeLessThanOrEqual(8);
    // Palmas existe no TO e no PR: as duas voltam, sem a rota escolher.
    expect(corpo.cidades).toEqual(
      expect.arrayContaining([
        { nome: "Palmas", uf: "TO", slug: "palmas-to" },
        { nome: "Palmas", uf: "PR", slug: "palmas-pr" },
      ])
    );
    // Só nome, uf e slug: nem `chave`, nem código IBGE, nem nada além.
    for (const c of corpo.cidades) expect(Object.keys(c).sort()).toEqual(["nome", "slug", "uf"]);

    const soTo = await request.get("/api/cidades?q=palmas&uf=to");
    const corpoTo = (await soTo.json()) as { cidades: { uf: string }[] };
    expect(corpoTo.cidades.length).toBeGreaterThan(0);
    expect(corpoTo.cidades.every((c) => c.uf === "TO"), "o filtro de UF nao foi aplicado").toBe(true);
  });
});

test.describe("a busca da home leva a /buscar com os parametros", () => {
  test("termo, cidade e forma de atendimento viram a URL do contrato", async ({ page }) => {
    await page.goto("/");
    const form = page.getByRole("search", { name: "Buscar veterinários e estabelecimentos" });
    await expect(form).toBeVisible();

    await form.locator("#home-busca-q").fill("cardiologia");
    await form.locator("#home-busca-cidade").fill("Palmas");
    // O rádio é `sr-only`, dentro do rótulo: clica-se no rótulo, como a pessoa.
    await form.getByText("Domiciliar", { exact: true }).click();
    await form.getByRole("button", { name: /pesquisar/i }).click();

    await page.waitForURL((url) => url.pathname === "/buscar");
    const params = new URL(page.url()).searchParams;
    expect(params.get("q")).toBe("cardiologia");
    expect(params.get("cidade")).toBe("Palmas");
    expect(params.get("atendimento")).toBe("domiciliar");

    await expect(page.getByText(/não conseguimos buscar agora/i)).toHaveCount(0);
    if (BUSCA_LIGADA) {
      // O que a pessoa digitou volta para o campo, para ela corrigir.
      await expect(page.locator("#busca-termo")).toHaveValue("cardiologia");
    }
  });

  test("sem mexer nas abas, 'Todos' nao manda filtro de atendimento", async ({ page }) => {
    await page.goto("/");
    const form = page.getByRole("search", { name: "Buscar veterinários e estabelecimentos" });
    await form.locator("#home-busca-q").fill("dermatologia");
    await form.getByRole("button", { name: /pesquisar/i }).click();

    await page.waitForURL((url) => url.pathname === "/buscar");
    const params = new URL(page.url()).searchParams;
    expect(params.get("q")).toBe("dermatologia");
    // Vazio ou ausente: qualquer aba marcada tiraria os estabelecimentos.
    expect(params.get("atendimento") ?? "").toBe("");
  });
});

test.describe("nenhum telefone, WhatsApp ou endereco privado no HTML publico (DL-047)", () => {
  // ⚠️ O slug aleatório é sorteado DENTRO do teste: título com valor
  // aleatório muda entre o processo que lista e o worker que roda, e o
  // Playwright não acha o teste.
  const rotas: [string, () => string][] = [
    ["/buscar", () => "/buscar"],
    ["/buscar com filtros", () => "/buscar?q=cardiologia&cidade=Palmas&uf=TO"],
    ["/veterinario/<slug>", () => `/veterinario/${slugQueNaoExiste()}`],
    ["/estabelecimento/<slug>", () => `/estabelecimento/${slugQueNaoExiste()}`],
  ];
  for (const [titulo, rota] of rotas) {
    test(titulo, async ({ request, page }) => {
      await conferirSemContatoNoHtml(request, page, rota());
    });
  }
});
