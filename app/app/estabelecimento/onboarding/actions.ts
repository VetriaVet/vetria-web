"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizarWhatsapp } from "@/lib/contato/whatsapp";
import { ONBOARDING } from "@/lib/auth/status";
import {
  LIMITES,
  MAX_SERVICOS,
  SERVICOS,
  UFS,
  type ClinicOnboardingPayload,
  type PassoDoRascunho,
  type ResultadoOnboarding,
  type ResultadoPasso,
} from "./campos";

// T-007 — o onboarding do estabelecimento passa a persistir.
// T-051 — e passa a persistir A CADA PASSO: `salvarPassoClinic` grava o
// rascunho em cada "Continuar"; `salvarOnboardingClinic` continua sendo a
// conclusão.
//
// Padrão da casa (DL-012): Server Component busca → Server Action muta →
// Client Form interage.
//
// ⚠️ ESTE ARQUIVO É CLONE DE `app/app/veterinario/onboarding/actions.ts` (T-006),
// e é clone por decisão do parecer de 09/09
// (`docs/relatorios/SEC-2026-09-09-T006-revisao-independente.md`). A Server
// Action inline que existia em `page.tsx` foi APAGADA, não preservada: ela
// conferia sessão e NÃO conferia role, e escrevia `onboarding_completed` com a
// sessão do usuário (SEC-061 / R-040).
//
// O que esta Action faz, na ordem, e por quê:
//   1. confere sessão e role no SERVIDOR (a matriz §3 não é negociável)
//   2. valida e normaliza o payload (o cliente não é fonte de verdade)
//   3. grava o que é PÚBLICO em `clinic_profiles`
//   4. grava o que é PRIVADO em `perfil_privado`: WhatsApp e os TRÊS dados de
//      identificação do estabelecimento, que a `0003` desceu de
//      `clinic_profiles` justamente para sair da leitura pública (SEC-020 /
//      DL-053). `cnpj`, `razao_social` e `responsavel_tecnico` NÃO existem mais
//      em `clinic_profiles`: escrevê-los lá agora falha com
//      `42703 column "cnpj" does not exist`
//   5. se ainda estiver `incomplete`, chama a RPC que move pra fila
//   6. RELÊ `profiles.status` e só então decide pra onde mandar a pessoa
//
// ⚠️ O que ela deliberadamente NÃO faz:
//   · não escreve `profiles.status` (a policy 7.2 da 0002 levanta exceção;
//     estabelecimento que se auto-aprova aparece na busca sem validação e sem
//     pagar)
//   · não escreve `profiles.onboarding_completed`. É a coluna do R-040: o
//     próprio dono a escreve pela API, e `admin_definir_status` a usa como
//     mecanismo de reprova. O sinal desta tela é `status`, e mais nada
//   · não escreve `clinic_profiles.slug` (pinado por `slug is null` no WITH
//     CHECK do INSERT, correção SEC-008; a regra de geração nasce na F4/S5)
//   · não escreve `clinic_profiles.site`. Ver a nota do `campos.ts`: não há
//     campo em tela, e a coluna é URL pública que viraria link na F4/S7 sem
//     validação de esquema (R-039)
//   · não escreve `documento_path`, `documento_hash` nem `documento_tamanho`.
//     O CHECK `perfil_privado_documento_completo` é all-or-nothing e o upload
//     é a T-008
//   · não escreve `documento_enviado_em` (carimbado pelo trigger)
//   · não monta o portão de status do painel. Isso é a T-016 (R-038), e o
//     parecer é explícito em não deixar a T-007 improvisar isso aqui

type PerfilAtual = { role: string; status: string };

function limpar(v: unknown): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
}

function erro(mensagem: string): ResultadoOnboarding {
  return { ok: false, mensagem };
}

// Erro do banco vira frase legível na tela. O código vai junto na tela só pra
// dar rastro a quem for ajudar.
//
// ⚠️ SEC-056 — `details` NÃO entra no log, e o tipo abaixo nem o aceita.
// Isto é herança direta do `actions.ts` do veterinário, e aqui pesa mais: o
// campo DETAIL do Postgres vem como `Failing row contains (<uuid>, <whatsapp>,
// <telefone>, ..., <razao_social>, <cnpj>, <responsavel_tecnico>)`. É a LINHA
// INTEIRA de `perfil_privado`, ou seja CNPJ, razão social e o nome de uma
// pessoa física que nem é titular da conta, indo parar no log da Vercel, que
// está fora do alcance da rotina de exportação e exclusão da F6 (R-024).
// `code` e `message` bastam pra depurar: o primeiro diz qual constraint, o
// segundo diz qual coluna.
// ⚠️ Quem clonar isto: não acrescente `details` de volta "só pra depurar".
function mensagemDoBanco(
  contexto: string,
  detalhe: { message: string; code?: string }
): ResultadoOnboarding {
  console.error(`[clinic/onboarding] ${contexto}`, {
    message: detalhe.message,
    code: detalhe.code,
  });

  if (detalhe.code === "42501" || detalhe.code === "PGRST301") {
    return erro(
      "Sua sessão não tem permissão para gravar esses dados. Saia e entre de novo. Se continuar, fale com a gente."
    );
  }

  // ⚠️ T-027 — 23514 é um CHECK da `0004` recusando a linha (UF, CEP, tetos
  // de texto, serviços, site). Com a validação desta Action espelhando cada
  // CHECK, isto só acontece por divergência entre as duas listas (bug nosso)
  // ou por linha antiga fora da regra. "Tente de novo" seria mentira.
  if (detalhe.code === "23514") {
    return erro(
      `Não foi possível salvar ${contexto}: algum dado está fora do formato que a Vetria aceita. Confira os campos dos passos 1 a 3 e tente de novo. Se continuar, fale com a gente.`
    );
  }

  return erro(
    `Não foi possível salvar ${contexto}. Nada foi perdido: seus dados continuam na tela, tente de novo em alguns instantes.` +
      (detalhe.code ? ` (código ${detalhe.code})` : "")
  );
}

// ⚠️ R-041 / SEC-062 — a normalização do WhatsApp SAIU deste arquivo em
// 20/09/2026 e mora em `lib/contato/whatsapp.ts`.
//
// Ela nasceu aqui, na T-007, e o onboarding do veterinário ficou sem — o que
// só foi descoberto na prova em tela: a mesma consulta devolveu
// `62992653278` para o estabelecimento e `62 992653278`, COM ESPAÇO, para o
// veterinário. O motivo de mover é esse, e não estética: o defeito nasceu de
// duplicação, e duplicação não se conserta copiando com mais cuidado.
//
// O contrato do que fica gravado (dígitos, DDD + número, sem o `55`) está
// escrito lá, junto com o porquê.

// CNPJ normalizado: 14 caracteres, sem pontuação, em maiúsculas.
//
// ⚠️ Aceita LETRA nas 12 primeiras posições de propósito. O CNPJ alfanumérico
// entrou em vigor em 2026 e tem o formato "12 alfanuméricos + 2 dígitos
// verificadores"; exigir 14 dígitos recusaria um estabelecimento novo e
// legítimo, e a mensagem não diria por quê. Os dois últimos continuam
// numéricos nos dois formatos.
//
// Não confere dígito verificador: quem valida o estabelecimento é uma pessoa,
// na fila da S4, com o documento em mãos. O que este bloco impede é lixo
// evidente entrar na coluna que o admin vai conferir.
function normalizarCnpj(
  bruto: string
): { ok: true; valor: string } | { ok: false; motivo: string } {
  const c = bruto.replace(/[^A-Za-z0-9]+/g, "").toUpperCase();

  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(c)) {
    return {
      ok: false,
      motivo:
        "Passo 1: o CNPJ precisa ter 14 caracteres, no formato 00.000.000/0000-00.",
    };
  }

  if (/^(.)\1{13}$/.test(c)) {
    return { ok: false, motivo: "Passo 1: esse CNPJ não é válido." };
  }

  return { ok: true, valor: c };
}

// -------------------------------------------------------------------------
// 1. QUEM GRAVA (sessão, role e status, no SERVIDOR)
// -------------------------------------------------------------------------
// Serve às duas Actions deste arquivo. A lista de status muda entre elas, e é
// a única coisa que muda.
type Supabase = Awaited<ReturnType<typeof createClient>>;
type QuemGrava =
  | { ok: true; supabase: Supabase; userId: string; perfil: PerfilAtual }
  | ResultadoOnboarding;

async function conferirQuemGrava(
  podemGravar: readonly string[]
): Promise<QuemGrava> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  // DL-016: redirect() fora de try/catch, aqui e em todo o caminho até a Action.
  if (!user) redirect("/login");

  const { data: perfil, error: erroPerfil } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single<PerfilAtual>();

  if (erroPerfil || !perfil) {
    return mensagemDoBanco(
      "seu cadastro",
      erroPerfil ?? { message: "perfil não encontrado" }
    );
  }

  // ⚠️ Autorização no servidor, ANTES de qualquer escrita. Rota em português,
  // role em inglês (DL-043).
  //
  // A Action inline que este arquivo substitui não fazia isto: conferia sessão
  // e seguia em frente. O id de uma Server Action está no bundle, então
  // qualquer usuário logado alcançava a escrita (SEC-061 / R-040).
  if (perfil.role !== "clinic") redirect("/app");

  // ⚠️ SEC-054 — o portão de ESCRITA é tão apertado quanto o de página, e pelo
  // mesmo padrão de LISTA DE PERMITIDOS da SEC-052: valor novo no enum entra
  // barrado até alguém decidir o contrário.
  if (!podemGravar.includes(perfil.status)) {
    console.warn("[clinic/onboarding] escrita recusada por status", {
      userId: user.id,
      status: perfil.status,
    });
    if (perfil.status === "suspended") {
      return erro(
        "A conta do estabelecimento está suspensa e não aceita alterações no cadastro. Fale com a gente para entender o motivo."
      );
    }
    if (perfil.status === "active") {
      return erro(
        "O estabelecimento já foi aprovado, e esta tela é a do primeiro cadastro. Recarregue a página para ir ao painel."
      );
    }
    return erro(
      "A conta está num estado que não permite editar o cadastro agora. Fale com a gente."
    );
  }

  return { ok: true, supabase, userId: user.id, perfil };
}

// -------------------------------------------------------------------------
// 2. VALIDAÇÃO E NORMALIZAÇÃO, UM PASSO POR VEZ
// -------------------------------------------------------------------------
// T-051 — gêmeo do vet: a validação virou uma função por passo, chamada pelas
// DUAS Actions (o rascunho de cada "Continuar" e a conclusão). Cada função
// devolve só as colunas do SEU passo, separadas entre o que é público
// (`clinic_profiles`) e o que é privado (`perfil_privado`).

type Validado<T> = { ok: true; valor: T } | ResultadoOnboarding;

type ColunasPublicas = {
  nome_fantasia?: string;
  endereco?: string | null;
  cep?: string | null;
  cidade?: string;
  estado?: string;
  sobre?: string | null;
  servicos?: string[];
};

// ⚠️ Os três dados de identificação moram em `perfil_privado` desde a `0003`
// (SEC-020 / DL-053). Escrevê-los em `clinic_profiles` falha com 42703.
type ColunasPrivadas = {
  whatsapp?: string | null;
  razao_social?: string | null;
  cnpj?: string;
  responsavel_tecnico?: string | null;
};

type ColunasDoPasso = { publico: ColunasPublicas; privado: ColunasPrivadas };

function validarPasso1(entrada: ClinicOnboardingPayload): Validado<ColunasDoPasso> {
  const nomeFantasia = limpar(entrada?.nomeFantasia);
  const razaoSocial = limpar(entrada?.razaoSocial);
  const cnpjBruto = limpar(entrada?.cnpj);
  const responsavelTecnico = limpar(entrada?.responsavelTecnico);

  if (!nomeFantasia)
    return erro("Passo 1: informe o nome fantasia do estabelecimento.");
  if (nomeFantasia.length > LIMITES.nomeFantasia)
    return erro(
      `Passo 1: o nome fantasia passa de ${LIMITES.nomeFantasia} caracteres.`
    );

  if (razaoSocial.length > LIMITES.razaoSocial)
    return erro(
      `Passo 1: a razão social passa de ${LIMITES.razaoSocial} caracteres.`
    );

  if (!cnpjBruto) return erro("Passo 1: informe o CNPJ do estabelecimento.");
  if (cnpjBruto.length > LIMITES.cnpj)
    return erro(`Passo 1: o CNPJ passa de ${LIMITES.cnpj} caracteres.`);
  const cnpjNormalizado = normalizarCnpj(cnpjBruto);
  if (!cnpjNormalizado.ok) return erro(cnpjNormalizado.motivo);

  if (responsavelTecnico.length > LIMITES.responsavelTecnico)
    return erro(
      `Passo 1: o nome do responsável técnico passa de ${LIMITES.responsavelTecnico} caracteres.`
    );

  return {
    ok: true,
    valor: {
      publico: { nome_fantasia: nomeFantasia },
      privado: {
        razao_social: razaoSocial || null,
        cnpj: cnpjNormalizado.valor,
        responsavel_tecnico: responsavelTecnico || null,
      },
    },
  };
}

function validarPasso2(entrada: ClinicOnboardingPayload): Validado<ColunasDoPasso> {
  const endereco = limpar(entrada?.endereco);
  const cepBruto = limpar(entrada?.cep);
  const cidade = limpar(entrada?.cidade);
  const estado = limpar(entrada?.estado).toUpperCase();

  if (endereco.length > LIMITES.endereco)
    return erro(`Passo 2: o endereço passa de ${LIMITES.endereco} caracteres.`);

  if (cepBruto.length > LIMITES.cep)
    return erro(`Passo 2: o CEP passa de ${LIMITES.cep} caracteres.`);
  const cep = cepBruto.replace(/\D+/g, "");
  if (cepBruto && cep.length !== 8)
    return erro("Passo 2: o CEP precisa ter 8 dígitos, no formato 00000-000.");

  if (!cidade) return erro("Passo 2: informe a cidade do estabelecimento.");
  if (cidade.length > LIMITES.cidade)
    return erro(`Passo 2: o nome da cidade passa de ${LIMITES.cidade} caracteres.`);

  if (!estado) return erro("Passo 2: escolha o estado do estabelecimento.");
  if (!(UFS as readonly string[]).includes(estado))
    return erro("Passo 2: o estado do estabelecimento não é uma UF válida.");

  return {
    ok: true,
    valor: {
      publico: { endereco: endereco || null, cep: cep || null, cidade, estado },
      privado: {},
    },
  };
}

function validarPasso3(entrada: ClinicOnboardingPayload): Validado<ColunasDoPasso> {
  const sobre =
    typeof entrada?.sobre === "string" ? entrada.sobre.trim() : "";
  const whatsappBruto = limpar(entrada?.whatsapp);

  // ⚠️ SEC-058 — o teto do array vem ANTES da varredura, e a deduplicação usa
  // `Set`. Conta `clinic` sai de funil público aberto a qualquer um, e o único
  // limite de cima seria o `bodySizeLimit` do Next.
  const servicosBrutos = Array.isArray(entrada?.servicos)
    ? entrada.servicos
    : [];

  if (servicosBrutos.length > MAX_SERVICOS) {
    return erro(
      `Passo 3: escolha no máximo ${MAX_SERVICOS} serviços, entre os que estão na lista.`
    );
  }

  const servicos = [
    ...new Set(servicosBrutos.map(limpar).filter((s) => s !== "")),
  ];

  const foraDaLista = servicos.filter(
    (s) => !(SERVICOS as readonly string[]).includes(s)
  );
  if (foraDaLista.length > 0)
    return erro(`Passo 3: serviço não reconhecido: ${foraDaLista[0]}.`);

  if (sobre.length > LIMITES.sobre)
    return erro(`Passo 3: o texto sobre o estabelecimento passa de ${LIMITES.sobre} caracteres.`);

  if (whatsappBruto.length > LIMITES.whatsapp)
    return erro(`Passo 3: o WhatsApp passa de ${LIMITES.whatsapp} caracteres.`);

  let whatsapp = "";
  if (whatsappBruto) {
    const normalizado = normalizarWhatsapp(whatsappBruto);
    if (!normalizado.ok) return erro(normalizado.motivo);
    whatsapp = normalizado.valor;
  }

  return {
    ok: true,
    valor: {
      publico: { sobre: sobre || null, servicos },
      privado: { whatsapp: whatsapp || null },
    },
  };
}

// -------------------------------------------------------------------------
// 3 e 4. A GRAVAÇÃO
// -------------------------------------------------------------------------
// upsert por `id`: a primeira gravação insere, as seguintes atualizam. O
// upsert do PostgREST só escreve as colunas ENVIADAS, então gravar um passo
// não apaga outro, e nenhum deles apaga o documento da T-008 nem `telefone` e
// `email_contato`. `slug` e `site` ficam FORA do payload, de propósito (ver o
// cabeçalho deste arquivo). Passo sem coluna numa das tabelas não toca nela.
//
// O `.select().single()` no fim não é enfeite: é o DL-011.
async function gravar(
  supabase: Supabase,
  userId: string,
  colunas: ColunasDoPasso
): Promise<ResultadoOnboarding | null> {
  if (Object.keys(colunas.publico).length > 0) {
    const { data: linhaClinic, error: erroClinic } = await supabase
      .from("clinic_profiles")
      .upsert({ id: userId, ...colunas.publico }, { onConflict: "id" })
      .select("id")
      .single<{ id: string }>();

    if (erroClinic)
      return mensagemDoBanco("os dados do estabelecimento", erroClinic);
    if (!linhaClinic) {
      return erro(
        "Os dados do estabelecimento não chegaram ao banco. Tente de novo; se continuar, fale com a gente antes de sair desta tela."
      );
    }
  }

  // A guarda `trg_perfil_privado_dado_de_estabelecimento` (SEC-044) confere
  // que o dono desta linha é mesmo `clinic` antes de aceitar CNPJ, razão social
  // e responsável técnico. A conferência de role em `conferirQuemGrava` já
  // garante isso; a guarda é a segunda porta.
  if (Object.keys(colunas.privado).length > 0) {
    const { data: linhaPrivada, error: erroPrivado } = await supabase
      .from("perfil_privado")
      .upsert({ id: userId, ...colunas.privado }, { onConflict: "id" })
      .select("id")
      .single<{ id: string }>();

    if (erroPrivado)
      return mensagemDoBanco("os dados de identificação e contato", erroPrivado);
    if (!linhaPrivada) {
      return erro(
        "Os dados de identificação não chegaram ao banco. Tente de novo; se continuar, fale com a gente antes de sair desta tela."
      );
    }
  }

  return null;
}

// -------------------------------------------------------------------------
// O RASCUNHO DE CADA "CONTINUAR" (T-051 / QA-001, causa do R-072)
// -------------------------------------------------------------------------
// Mesmo contrato do `salvarPassoVet`: valida e grava SÓ o passo pedido, NUNCA
// chama `concluir_onboarding_profissional()`, nunca escreve status, e devolve
// `{ ok: true }` em vez de redirecionar. O portão é `ONBOARDING`
// (`incomplete` e `pending_validation`, os mesmos da página). `active` fica de
// fora: mexer em CNPJ, razão social, responsável técnico ou nome fantasia de um
// estabelecimento aprovado o devolveria à fila a cada clique.
//
// ⚠️ Sem migration: as colunas tocadas são anuláveis e os CHECKs da `0004`
// aceitam nulo.
export async function salvarPassoClinic(
  entrada: ClinicOnboardingPayload,
  passo: PassoDoRascunho
): Promise<ResultadoPasso> {
  if (passo !== 1 && passo !== 2 && passo !== 3) {
    return erro("Não entendemos qual passo salvar. Recarregue a página e tente de novo.");
  }

  const quem = await conferirQuemGrava(ONBOARDING);
  if (!quem.ok) return quem;

  const v =
    passo === 1
      ? validarPasso1(entrada)
      : passo === 2
        ? validarPasso2(entrada)
        : validarPasso3(entrada);
  if (!v.ok) return v;

  const falha = await gravar(quem.supabase, quem.userId, v.valor);
  if (falha) return falha;

  console.log("[clinic/onboarding] rascunho salvo", { userId: quem.userId, passo });
  return { ok: true };
}

// -------------------------------------------------------------------------
// A CONCLUSÃO (passo 4)
// -------------------------------------------------------------------------
export async function salvarOnboardingClinic(
  entrada: ClinicOnboardingPayload
): Promise<ResultadoOnboarding | void> {
  // `active` é aceito de propósito, e é a única diferença em relação ao guard
  // da página: a Action continua alcançável por aba velha, e é o passo 6 (a
  // releitura de status) que conta a verdade pra quem acabou de se derrubar da
  // busca sozinho. Desde a `0003`, `revalidar_ao_mudar_dado_sensivel()` vigia
  // `cnpj`, `razao_social` e `responsavel_tecnico` dentro de `perfil_privado`.
  const quem = await conferirQuemGrava(["incomplete", "pending_validation", "active"]);
  if (!quem.ok) return quem;
  const { supabase, perfil } = quem;
  const user = { id: quem.userId };

  const p1 = validarPasso1(entrada);
  if (!p1.ok) return p1;
  const p2 = validarPasso2(entrada);
  if (!p2.ok) return p2;
  const p3 = validarPasso3(entrada);
  if (!p3.ok) return p3;

  const falha = await gravar(supabase, user.id, {
    publico: { ...p1.valor.publico, ...p2.valor.publico, ...p3.valor.publico },
    privado: { ...p1.valor.privado, ...p2.valor.privado, ...p3.valor.privado },
  });
  if (falha) return falha;

  // -------------------------------------------------------------------------
  // 5. A FILA DE VALIDAÇÃO
  // -------------------------------------------------------------------------
  // Mesma RPC do veterinário. `concluir_onboarding_profissional()` é SECURITY
  // DEFINER, aceita `vet` e `clinic` (`0002:717-745`) e é o ÚNICO caminho de
  // `incomplete` → `pending_validation`. Ela levanta 'onboarding ja concluido'
  // se o status já saiu de `incomplete`, então a chamada é condicionada: quem
  // volta pra corrigir só salva.
  if (perfil.status === "incomplete") {
    // ⚠️ T-022 / SEC-088 / DL-061 item 2 (opção a) — SEM DOCUMENTO, NÃO HÁ
    // CONCLUSÃO, e quem decide isso é o SERVIDOR.
    //
    // Até 23/09 a obrigatoriedade era só o `disabled` do botão: DevTools ou um
    // POST com o id desta Action punham a conta na fila sem documento, e a
    // prova em tela da T-023 achou 3 de 4 contas assim. A conferência lê
    // `documento_enviado_em`, que é carimbado pelo TRIGGER quando a rota de
    // upload grava as três colunas do documento; o cliente não escreve essa
    // coluna. Os dados do formulário JÁ foram salvos acima, e a mensagem diz
    // isso: a pessoa não perde nada, só não entra na fila.
    //
    // Vale só para `incomplete` (a conclusão). Quem já está na fila e volta
    // para corrigir continua salvando: as contas antigas sem documento seguem
    // na fila com o badge âmbar, como o DL-061 decidiu.
    const { data: documento, error: erroDocumento } = await supabase
      .from("perfil_privado")
      .select("documento_enviado_em")
      .eq("id", user.id)
      .maybeSingle<{ documento_enviado_em: string | null }>();

    if (erroDocumento) {
      return mensagemDoBanco("a conferência do documento", erroDocumento);
    }

    if (!documento?.documento_enviado_em) {
      console.warn("[clinic/onboarding] conclusão recusada: sem documento", {
        userId: user.id,
      });
      return erro(
        "Os dados foram salvos, mas o cadastro só segue para validação com o documento enviado. Envie o documento no passo 4 e conclua de novo."
      );
    }

    const { error: erroRpc } = await supabase.rpc(
      "concluir_onboarding_profissional"
    );
    if (erroRpc) {
      // ⚠️ SEC-057 — antes de chamar isto de falha, PERGUNTE AO BANCO.
      // Em duas abas, a outra pode ter concluído no meio. A conferência é por
      // RELEITURA, não por comparar a string da exceção: texto de `raise
      // exception` é detalhe interno e muda sem aviso na próxima migration.
      const { data: conferencia } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single<{ status: string }>();

      if (!conferencia || conferencia.status === "incomplete") {
        console.error("[clinic/onboarding] rpc:error", {
          message: erroRpc.message,
          code: erroRpc.code,
        });
        // ⚠️ T-027 / SEC-098 — 55000 é o código combinado com a RPC da `0004`
        // para "documento ausente": a linha aponta para um arquivo que não
        // está no armazenamento. Decidido pelo CÓDIGO, nunca pelo texto.
        if (erroRpc.code === "55000") {
          return erro(
            "Os dados foram salvos, mas o documento enviado não foi encontrado no armazenamento. Envie o documento de novo no passo 4 e conclua."
          );
        }
        return erro(
          "Os dados foram salvos, mas não conseguimos enviar o cadastro para validação. Tente concluir de novo em alguns instantes."
        );
      }

      console.warn("[clinic/onboarding] rpc:ja-concluida", {
        userId: user.id,
        status: conferencia.status,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 6. RELEITURA DO STATUS (não confie no que você mandou)
  // -------------------------------------------------------------------------
  // O trigger de revalidação (SEC-016/023, ampliado pela `0003`) devolve pra
  // `pending_validation` quem já estava `active` e mexeu em CNPJ, razão social,
  // responsável técnico ou nome fantasia. Nem o upsert nem a RPC contam isso na
  // resposta. Sem esta releitura, a tela manda pro painel um estabelecimento
  // que acabou de sair da busca.
  const { data: depois } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single<{ status: string }>();

  const statusFinal = depois?.status ?? perfil.status;

  console.log("[clinic/onboarding] salvo", {
    userId: user.id,
    statusAntes: perfil.status,
    statusDepois: statusFinal,
  });

  // ⚠️ DL-016 — redirect() fora de qualquer try/catch. O NEXT_REDIRECT precisa
  // borbulhar pro framework.
  if (statusFinal === "pending_validation")
    redirect("/app/estabelecimento/aguardando");
  redirect("/app/estabelecimento");
}
