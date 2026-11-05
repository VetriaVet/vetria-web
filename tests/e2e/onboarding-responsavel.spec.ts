import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { aplicarSessao, alertaDeErro, capturarSessao, destinoDeApp } from "../apoio/sessao";
import { EXIGIR, falharSeExigir } from "../apoio/pulo";
import { esperarHidratacao } from "../apoio/formulario";
import { alvoEhTeste, exigirAlvoDeTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";
import {
  apagarContasDaRodada,
  clienteDeServico,
  clienteDoUsuario,
  criarContaDescartavel,
  lerPerfil,
  varrerDescartaveisAntigas,
  type ContaDescartavel,
} from "../apoio/servico";
import { ONBOARDING_RESPONSAVEL, PAINEL_RESPONSAVEL } from "../apoio/responsavel";

// T-065 / DL-080 item 3: O ANIMAL DO ONBOARDING DO RESPONSÁVEL É GUARDADO.
//
// Antes, a Action recebia o formulário e descartava (`void formData`). Agora
// grava em `public.animais` com a sessão do responsável. O que se prova:
//   · o que a pessoa digita chega ao banco, com os códigos das listas;
//   · o servidor recusa o que a tela deixaria passar (nome só de espaços,
//     nome longo demais, espécie fora da lista) e nada é gravado;
//   · enviar de novo não grava um segundo animal;
//   · ninguém mais lê o animal: nem outro responsável, nem o visitante.
//
// ⚠️ ESCREVE, e por isso só roda no projeto de teste (DL-064). Cada teste
// gasta uma conta de responsável descartável, apagada no `afterAll` (o
// `on delete cascade` de `animais` leva o animal junto).

const ATIVO = alvoEhTeste();

function sufixo(): string {
  return Date.now().toString(36);
}

type LinhaAnimal = {
  tutor_id: string;
  nome: string;
  especie: string | null;
  idade: string | null;
  peso: string | null;
};

/** Leitura com service_role: prova de que o banco mudou, não atalho. */
async function animaisDe(id: string): Promise<LinhaAnimal[]> {
  const { data, error } = await clienteDeServico()
    .from("animais")
    .select("tutor_id, nome, especie, idade, peso")
    .eq("tutor_id", id);
  if (error) throw new Error(`animaisDe: ${error.code}: ${error.message}`);
  return (data ?? []) as LinhaAnimal[];
}

async function abrirOnboarding(page: Page, conta: ContaDescartavel) {
  const sessao = await capturarSessao(page.context().browser()!, conta, "conta responsavel descartavel");
  await aplicarSessao(page, sessao);
  expect(await destinoDeApp(page)).toBe(ONBOARDING_RESPONSAVEL);
  // Hidratação: antes dela o envio seria nativo e não chamaria a Action.
  await esperarHidratacao(page);
}

async function preencher(page: Page, nome: string) {
  await page.getByLabel("Nome do animal").fill(nome);
  await page.getByLabel("Espécie").selectOption("gato");
  await page.getByLabel("Idade aproximada").selectOption("senior");
  await page.getByLabel("Peso aproximado").selectOption("pequeno");
  await page.getByLabel("Cidade onde mora").fill("Palmas, TO");
}

test.skip(!ATIVO && !EXIGIR, SEM_ALVO_DE_TESTE);

test.beforeAll(async () => {
  falharSeExigir(!ATIVO, SEM_ALVO_DE_TESTE);
  if (!ATIVO) return;
  test.setTimeout(120_000);
  exigirAlvoDeTeste();
  await varrerDescartaveisAntigas(60);
});

test.afterAll(async () => {
  if (!ATIVO) return;
  test.setTimeout(120_000);
  await apagarContasDaRodada();
});

test.describe("o onboarding do responsavel guarda o animal", () => {
  test("o animal digitado vai para o banco, uma vez so, e o painel abre", async ({ page }) => {
    test.setTimeout(180_000);
    const conta = await criarContaDescartavel("tutor", `QA E2E Resp ${sufixo()}`);
    const nome = `Mia ${sufixo()}`;

    await abrirOnboarding(page, conta);
    await preencher(page, `  ${nome}  `);
    await page.getByRole("button", { name: /^concluir cadastro$/i }).click();
    await page.waitForURL((url) => url.pathname === PAINEL_RESPONSAVEL, { timeout: 30_000 });

    // O banco: uma linha, do dono, com os códigos das listas e o nome sem as
    // pontas de espaço.
    const linhas = await animaisDe(conta.id);
    expect(linhas).toEqual([
      { tutor_id: conta.id, nome, especie: "gato", idade: "senior", peso: "pequeno" },
    ]);
    expect((await lerPerfil(conta.id)).onboarding_completed).toBe(true);

    // A cidade foi para os dados do login, como no cadastro.
    const { data: usuario } = await clienteDeServico().auth.admin.getUserById(conta.id);
    expect(usuario.user?.user_metadata?.cidade).toBe("Palmas, TO");

    // Voltar ao onboarding não grava de novo: a página manda para o painel.
    await page.goto(ONBOARDING_RESPONSAVEL);
    await expect(page).toHaveURL((url) => url.pathname === PAINEL_RESPONSAVEL);
    expect(await animaisDe(conta.id)).toHaveLength(1);
  });

  test("o servidor recusa o que a tela deixaria passar, e nada e gravado", async ({ page }) => {
    test.setTimeout(180_000);
    const conta = await criarContaDescartavel("tutor", `QA E2E Resp Recusa ${sufixo()}`);
    await abrirOnboarding(page, conta);
    const concluir = page.getByRole("button", { name: /^concluir cadastro$/i });

    // 1. Nome só de espaços passa no `required` do navegador.
    await preencher(page, "    ");
    await concluir.click();
    await expect(alertaDeErro(page)).toContainText("Informe o nome do animal.");

    // 2. Nome longo demais, com o `maxlength` da tela tirado (DevTools).
    await page.locator("#petName").evaluate((el) => el.removeAttribute("maxlength"));
    await page.getByLabel("Nome do animal").fill("x".repeat(200));
    await concluir.click();
    await expect(alertaDeErro(page)).toContainText("passa de 60 caracteres");

    // 3. Espécie fora da lista, com uma opção plantada no select.
    await page.getByLabel("Nome do animal").fill("Rex");
    await page.locator("#petSpecies").evaluate((el) => {
      const o = document.createElement("option");
      o.value = "dragao";
      o.textContent = "Dragão";
      el.appendChild(o);
    });
    await page.getByLabel("Espécie").selectOption("dragao");
    await concluir.click();
    await expect(alertaDeErro(page)).toContainText("Escolha a espécie do animal.");

    // Nada foi gravado, e a conta continua no onboarding.
    expect(await animaisDe(conta.id)).toHaveLength(0);
    expect((await lerPerfil(conta.id)).onboarding_completed).toBe(false);
    expect(new URL(page.url()).pathname).toBe(ONBOARDING_RESPONSAVEL);
  });

  test("ninguem mais le o animal: nem outro responsavel, nem o visitante", async () => {
    test.setTimeout(120_000);
    const dono = await criarContaDescartavel("tutor", `QA E2E Resp Dono ${sufixo()}`);
    const outro = await criarContaDescartavel("tutor", `QA E2E Resp Outro ${sufixo()}`);

    // O dono grava pela API, sob RLS (é o que a Action faz por baixo).
    const { cliente: clienteDono } = await clienteDoUsuario(dono);
    const { error: erroInsert } = await clienteDono
      .from("animais")
      .insert({ tutor_id: dono.id, nome: "Bidu", especie: "cao", idade: "adulto", peso: "medio" });
    expect(erroInsert).toBeNull();

    // O outro responsável não lê, e não grava em nome do dono.
    const { cliente: clienteOutro } = await clienteDoUsuario(outro);
    const { data: lidoPeloOutro } = await clienteOutro.from("animais").select("nome").eq("tutor_id", dono.id);
    expect(lidoPeloOutro ?? []).toHaveLength(0);
    const { error: erroOutro } = await clienteOutro
      .from("animais")
      .insert({ tutor_id: dono.id, nome: "Intruso", especie: "cao", idade: "adulto", peso: "medio" });
    expect(erroOutro, "um responsavel gravou animal na conta de outro").not.toBeNull();

    // O visitante (chave anon, sem sessão) não lê nada.
    const alvo = exigirAlvoDeTeste();
    const anon = createClient(alvo.url, alvo.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: lidoPeloAnon } = await anon.from("animais").select("nome").eq("tutor_id", dono.id);
    expect(lidoPeloAnon ?? []).toHaveLength(0);

    expect(await animaisDe(dono.id)).toHaveLength(1);

    await clienteDono.auth.signOut({ scope: "local" }).catch(() => {});
    await clienteOutro.auth.signOut({ scope: "local" }).catch(() => {});
  });
});
