import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { alvoEhTeste, exigirAlvoDeTeste, SEM_ALVO_DE_TESTE } from "../apoio/alvo";
import { EXIGIR, falharSeExigir } from "../apoio/pulo";
import {
  apagarContasDaRodada,
  clienteDeServico,
  clienteDoUsuario,
  criarContaDescartavel,
  varrerDescartaveisAntigas,
  type ContaDescartavel,
} from "../apoio/servico";

// T-042 · QUEM LÊ QUAL CONTATO, E O VÍNCULO DA CONTA NOVA (DL-047, D6, D10, R-074).
//
// É a prova, pelo PostgREST e com a chave anon (o que um navegador tem na mão),
// do que as telas de contato dependem:
//   1. o profissional A não vê contato do B (policy `contatos_select_profissional`);
//   2. o responsável não vê contato de outro (policy `contatos_select_responsavel`);
//   3. nenhum logado lê `anon_id` nem `user_id`, e `select=*` é recusado (0006 §3);
//   4. `vincular_contatos_do_visitante` não é chamável por quem está logado,
//      e pelo servidor só vincula: conta de responsável, linha sem dono, dos
//      últimos 30 dias, daquele navegador (D10).
//
// As linhas são gravadas pelo `service_role` direto na tabela: aqui o que se
// testa é a LEITURA e o vínculo, não a rota (essa é a `contato-rota.spec.ts`).
// Precisa da 0006 no alvo (aplicada no vetria-e2e desde a sessão A).

const ATIVO = alvoEhTeste();

type Contas = { vetA: ContaDescartavel; vetB: ContaDescartavel; resp1: ContaDescartavel; resp2: ContaDescartavel };

const DIA_MS = 24 * 60 * 60 * 1000;

test.describe("contatos: isolamento por dono e vinculo da conta nova", () => {
  test.describe.configure({ timeout: 120_000 });
  test.skip(!ATIVO && !EXIGIR, SEM_ALVO_DE_TESTE);

  let contas: Contas | null = null;
  // O cookie de quem clicou sem conta (vai virar o responsável 1) e o de outro navegador.
  const anonDoResp1 = randomUUID();
  const anonDeOutro = randomUUID();
  const anonAntigo = randomUUID();

  test.beforeAll(async () => {
    falharSeExigir(!ATIVO, SEM_ALVO_DE_TESTE);
    if (!ATIVO) return;
    test.setTimeout(120_000);
    exigirAlvoDeTeste();
    await varrerDescartaveisAntigas(60);

    contas = {
      vetA: await criarContaDescartavel("vet", "QA E2E Contatos Vet A"),
      vetB: await criarContaDescartavel("vet", "QA E2E Contatos Vet B"),
      resp1: await criarContaDescartavel("tutor", "QA E2E Contatos Responsavel 1"),
      resp2: await criarContaDescartavel("tutor", "QA E2E Contatos Responsavel 2"),
    };
    const { vetA, vetB, resp2 } = contas;

    const { error } = await clienteDeServico().from("contatos").insert([
      // anônimo, deste navegador, para o vet A: vai ser vinculado ao responsável 1
      { profissional_id: vetA.id, anon_id: anonDoResp1, canal: "whatsapp", origem_cidade: null },
      // do responsável 2, logado, para o vet B
      { profissional_id: vetB.id, user_id: resp2.id, anon_id: anonDeOutro, canal: "whatsapp" },
      // anônimo de outro navegador, para o vet B
      { profissional_id: vetB.id, anon_id: anonDeOutro, canal: "whatsapp" },
      // anônimo deste navegador, mas de 40 dias atrás: fora da janela do vínculo
      {
        profissional_id: vetA.id,
        anon_id: anonAntigo,
        canal: "whatsapp",
        created_at: new Date(Date.now() - 40 * DIA_MS).toISOString(),
      },
      // Linhas com colunas diferentes no mesmo insert: sem isto o PostgREST
      // manda null onde a coluna faltou (e `created_at` e NOT NULL).
    ], { defaultToNull: false });
    if (error) throw new Error(`semear contatos: ${error.code}: ${error.message}`);
  });

  test.afterAll(async () => {
    if (!ATIVO) return;
    test.setTimeout(120_000);
    await apagarContasDaRodada();
  });

  async function idsQueVe(conta: ContaDescartavel): Promise<{ profissional_id: string }[]> {
    const { cliente } = await clienteDoUsuario(conta);
    try {
      const { data, error } = await cliente.from("contatos").select("id, profissional_id, created_at");
      if (error) throw new Error(`leitura de ${conta.nome}: ${error.code}: ${error.message}`);
      return (data ?? []) as { profissional_id: string }[];
    } finally {
      await cliente.auth.signOut({ scope: "local" }).catch(() => {});
    }
  }

  test("o profissional A nao ve contato do B, e o B nao ve o do A", async () => {
    const { vetA, vetB } = contas!;
    const doA = await idsQueVe(vetA);
    const doB = await idsQueVe(vetB);
    expect(doA, "o vet A deveria ver os 2 contatos dele").toHaveLength(2);
    expect(doA.every((l) => l.profissional_id === vetA.id), "o vet A leu contato de outro profissional").toBe(true);
    expect(doB, "o vet B deveria ver os 2 contatos dele").toHaveLength(2);
    expect(doB.every((l) => l.profissional_id === vetB.id), "o vet B leu contato de outro profissional").toBe(true);
  });

  test("nenhum logado le anon_id nem user_id, e select=* e recusado (R-074)", async () => {
    const { vetA, resp2 } = contas!;
    for (const conta of [vetA, resp2]) {
      const { cliente } = await clienteDoUsuario(conta);
      try {
        for (const colunas of ["anon_id", "user_id", "*", "id, anon_id"]) {
          const { data, error } = await cliente.from("contatos").select(colunas).limit(1);
          expect(error?.code, `${conta.nome} leu "${colunas}" de contatos`).toBe("42501");
          expect(data).toBeNull();
        }
        const { error: erroRpc } = await cliente.rpc("vincular_contatos_do_visitante", {
          p_user_id: conta.id,
          p_anon_id: anonDeOutro,
        });
        expect(erroRpc, `${conta.nome} conseguiu chamar vincular_contatos_do_visitante`).not.toBeNull();
      } finally {
        await cliente.auth.signOut({ scope: "local" }).catch(() => {});
      }
    }
  });

  test("o responsavel ve so o que ele fez; o vinculo da conta nova traz o anonimo daquele navegador", async () => {
    const { vetA, vetB, resp1, resp2 } = contas!;

    expect(await idsQueVe(resp1), "o responsavel 1 ainda nao tem contato").toHaveLength(0);
    const doResp2 = await idsQueVe(resp2);
    expect(doResp2, "o responsavel 2 deveria ver so o contato que ele fez logado").toHaveLength(1);
    expect(doResp2[0].profissional_id).toBe(vetB.id);

    const servico = clienteDeServico();

    // Conta de profissional não recebe vínculo (o banco confere o role).
    const { data: doVet, error: erroVet } = await servico.rpc("vincular_contatos_do_visitante", {
      p_user_id: vetB.id,
      p_anon_id: anonDoResp1,
    });
    expect(erroVet).toBeNull();
    expect(doVet, "conta de veterinario recebeu vinculo").toBe(0);

    // A conta nova do responsável 1, com o cookie daquele navegador: vincula 1.
    const { data: vinculados, error } = await servico.rpc("vincular_contatos_do_visitante", {
      p_user_id: resp1.id,
      p_anon_id: anonDoResp1,
    });
    expect(error).toBeNull();
    expect(vinculados, "o contato anonimo de 30 dias deveria ir para a conta nova").toBe(1);

    // O de 40 dias fica de fora (D10: so os ultimos 30 dias).
    const { data: antigos } = await servico.rpc("vincular_contatos_do_visitante", {
      p_user_id: resp1.id,
      p_anon_id: anonAntigo,
    });
    expect(antigos, "contato de mais de 30 dias foi vinculado").toBe(0);

    // Com o cookie de outro navegador, só a linha SEM dono vem (é por isso que
    // `anon_id` é segredo, R-074). A linha do responsável 2 nunca muda de conta.
    const { data: deOutro } = await servico.rpc("vincular_contatos_do_visitante", {
      p_user_id: resp1.id,
      p_anon_id: anonDeOutro,
    });
    expect(deOutro, "a linha que ja tinha dono (responsavel 2) foi vinculada a outra conta").toBe(1);

    const doResp1 = await idsQueVe(resp1);
    expect(doResp1.map((l) => l.profissional_id).sort()).toEqual([vetA.id, vetB.id].sort());
    // O responsável 2 continua com o dele, e só o dele.
    expect(await idsQueVe(resp2)).toHaveLength(1);
    // A contagem do profissional não muda com o vínculo.
    expect(await idsQueVe(vetA)).toHaveLength(2);
  });
});
