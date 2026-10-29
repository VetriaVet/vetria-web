"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizarWhatsapp } from "@/lib/contato/whatsapp";
import { ONBOARDING } from "@/lib/auth/status";
import {
  ESPECIALIDADES,
  EXPERIENCIA,
  LIMITES,
  MAX_ESPECIALIDADES,
  TITULOS,
  UFS,
  normalizarCrmv,
  type PassoDoRascunho,
  type ResultadoOnboarding,
  type ResultadoPasso,
  type VetOnboardingPayload,
} from "./campos";

// T-006 — o onboarding do veterinário passa a persistir.
// T-051 — e passa a persistir A CADA PASSO: `salvarPassoVet` grava o rascunho
// em cada "Continuar"; `salvarOnboardingVet` continua sendo a conclusão.
//
// Padrão da casa (DL-012): Server Component busca → Server Action muta →
// Client Form interage.
//
// O que a conclusão faz, na ordem, e por quê:
//   1. confere sessão e role no SERVIDOR (a matriz §3 não é negociável)
//   2. valida e normaliza o payload (o cliente não é fonte de verdade)
//   3. grava o que é PÚBLICO em `vet_profiles`
//   4. grava o que é PRIVADO em `perfil_privado` (WhatsApp — SEC-002)
//   5. se ainda estiver `incomplete`, chama a RPC que move pra fila
//   6. RELÊ `profiles.status` e só então decide pra onde mandar a pessoa
//
// ⚠️ O que ela deliberadamente NÃO faz:
//   · não escreve `profiles.status` (a policy 7.2 da 0002 levanta exceção, e é
//     assim que tem que ser: profissional que se auto-aprova aparece na busca
//     sem validação e sem pagar)
//   · não escreve `vet_profiles.slug` (pinado por `slug is null` no WITH CHECK
//     do INSERT, correção SEC-008; a regra de geração nasce na F4/S5)
//   · não escreve `cnpj`, `razao_social` nem `responsavel_tecnico` — nem como
//     nulo explícito. São dados de estabelecimento e a guarda da SEC-044
//     levanta exceção na linha de uma conta `vet`
//   · não escreve `documento_path`, `documento_hash` nem `documento_tamanho`.
//     O CHECK `perfil_privado_documento_completo` é all-or-nothing e o upload
//     é a T-008
//   · não escreve `documento_enviado_em` (carimbado pelo trigger)

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
// O campo DETAIL do Postgres vem como `Failing row contains (<uuid>,
// <whatsapp>, <telefone>, ...)`: é a LINHA INTEIRA, com o dado que o
// `perfil_privado` existe pra proteger. Isso iria pro log da Vercel, que está
// fora do alcance da rotina de exportação e exclusão da F6 (mesmo padrão do
// R-024). Nesta tela é quase inalcançável, mas a T-007 clona este arquivo e o
// payload dela tem CNPJ, razão social e responsável técnico, e a T-008 escreve
// caminho de documento sob o CHECK all-or-nothing. `code` e `message` bastam
// pra depurar: o primeiro diz qual constraint, o segundo diz qual coluna.
// ⚠️ Quem clonar isto: não acrescente `details` de volta "só pra depurar".
function mensagemDoBanco(
  contexto: string,
  detalhe: { message: string; code?: string }
): ResultadoOnboarding {
  console.error(`[vet/onboarding] ${contexto}`, {
    message: detalhe.message,
    code: detalhe.code,
  });

  if (detalhe.code === "42501" || detalhe.code === "PGRST301") {
    return erro(
      "Sua sessão não tem permissão para gravar esses dados. Saia e entre de novo. Se continuar, fale com a gente."
    );
  }

  // ⚠️ T-027 — 23514 é um CHECK da `0004` recusando a linha. Com a validação
  // acima espelhando cada CHECK, isto só acontece por divergência entre as
  // duas listas (bug nosso) ou por linha antiga fora da regra num campo que
  // esta tela não mostra. "Tente de novo" seria mentira: tentar de novo dá o
  // mesmo erro. O `message` (que nomeia a constraint) vai para o log acima.
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

  // Autorização no servidor. Rota em português, role em inglês (DL-043).
  if (perfil.role !== "vet") redirect("/app");

  // ⚠️ SEC-054 — o portão de ESCRITA tem que ser tão apertado quanto o de
  // página, e pelo mesmo padrão de lista de permitidos da SEC-052.
  //
  // A primeira versão conferia só o role, então a página expulsava `suspended`
  // e esta Action o aceitava. O id de Server Action está no bundle: um POST
  // direto passava. E o agravante não é a gravação em si, é o silêncio dela.
  // `revalidar_ao_mudar_dado_sensivel()` só age em `where ... status =
  // 'active'`, então trocar CRMV, UF ou nome de exibição durante a suspensão
  // NÃO refila e NÃO escreve em `audit_logs`. Se o master reativasse a conta
  // depois, o dado trocado no escuro entrava na busca sem revalidação e sem
  // trilha nenhuma.
  if (!podemGravar.includes(perfil.status)) {
    console.warn("[vet/onboarding] escrita recusada por status", {
      userId: user.id,
      status: perfil.status,
    });
    if (perfil.status === "suspended") {
      return erro(
        "Sua conta está suspensa e não aceita alterações no perfil. Fale com a gente para entender o motivo."
      );
    }
    if (perfil.status === "active") {
      return erro(
        "Seu perfil já foi aprovado, e esta tela é a do primeiro cadastro. Recarregue a página para ir ao seu painel."
      );
    }
    return erro(
      "Sua conta está num estado que não permite editar o perfil agora. Fale com a gente."
    );
  }

  return { ok: true, supabase, userId: user.id, perfil };
}

// -------------------------------------------------------------------------
// 2. VALIDAÇÃO E NORMALIZAÇÃO, UM PASSO POR VEZ
// -------------------------------------------------------------------------
// T-051 — a validação saiu do corpo da Action e virou uma função por passo,
// porque agora são DUAS Actions validando: o rascunho de cada "Continuar"
// (`salvarPassoVet`) e a conclusão (`salvarOnboardingVet`). As duas chamam as
// MESMAS funções: uma regra que existe em duas cópias diverge, e a cópia que
// diverge é sempre a que ninguém está olhando.
//
// Cada função devolve só as colunas DO SEU PASSO, já normalizadas. É isso que
// deixa o rascunho gravar só o que a pessoa acabou de preencher, e não o
// formulário inteiro por cima de outra aba (QAF-002).

type Validado<T> = { ok: true; valor: T } | ResultadoOnboarding;

type ColunasPasso1 = {
  nome_exibicao: string;
  titulo: string | null;
  crmv: string;
  crmv_uf: string;
  especialidades: string[];
  experiencia: string | null;
};

function validarPasso1(entrada: VetOnboardingPayload): Validado<ColunasPasso1> {
  const nome = limpar(entrada?.nome);
  const crmvBruto = limpar(entrada?.crmv);
  const crmvUf = limpar(entrada?.crmvUf).toUpperCase();
  const titulo = limpar(entrada?.titulo);
  const experiencia = limpar(entrada?.experiencia);

  // ⚠️ SEC-058 — o teto vem ANTES da normalização, e a deduplicação usa `Set`.
  // A primeira versão deduplicava com `arr.indexOf(e)` dentro do `filter`, que
  // é O(n²), e só conferia o teto de 4 depois. O único limite de cima era o
  // `bodySizeLimit` do Next, 1 MB: conta `vet` sai de funil público aberto a
  // qualquer um, então dava pra mandar dezenas de milhares de strings
  // distintas e queimar ordens de 10⁹ comparações por requisição, em função
  // serverless, em paralelo. A whitelist recusava, mas só depois do gasto.
  // Agora o array é recusado pelo COMPRIMENTO antes de qualquer varredura.
  const especialidadesBrutas = Array.isArray(entrada?.especialidades)
    ? entrada.especialidades
    : [];

  if (especialidadesBrutas.length > MAX_ESPECIALIDADES) {
    return erro(
      `Passo 1: escolha no máximo ${MAX_ESPECIALIDADES} especialidades, sendo a primeira a principal.`
    );
  }

  const especialidades = [
    ...new Set(especialidadesBrutas.map(limpar).filter((e) => e !== "")),
  ];

  if (!nome) return erro("Passo 1: informe seu nome completo, como está no CRMV.");
  if (nome.length > LIMITES.nome)
    return erro(`Passo 1: o nome passa de ${LIMITES.nome} caracteres.`);

  if (!crmvBruto) return erro("Passo 1: informe o número do CRMV.");
  if (crmvBruto.length > LIMITES.crmv)
    return erro(`Passo 1: o número do CRMV passa de ${LIMITES.crmv} caracteres.`);
  // ⚠️ R-059 / T-027 — a MESMA regra do CHECK `vet_profiles_crmv_formato` da
  // `0004`, escrita uma vez em `campos.ts`. Sem ela a Action aceitava
  // "GO-0155", e depois da `0004` o banco recusaria com um 23514 sem dizer
  // qual campo.
  const crmvNormalizado = normalizarCrmv(crmvBruto);
  if (!crmvNormalizado.ok) return erro(crmvNormalizado.motivo);

  if (!crmvUf) return erro("Passo 1: escolha o estado de registro do CRMV.");
  if (!(UFS as readonly string[]).includes(crmvUf))
    return erro("Passo 1: o estado de registro do CRMV não é uma UF válida.");

  if (titulo && !TITULOS.some((t) => t.value === titulo))
    return erro("Passo 1: o título profissional escolhido não está na lista.");

  if (experiencia && !EXPERIENCIA.some((e) => e.value === experiencia))
    return erro("Passo 1: a faixa de experiência escolhida não está na lista.");

  const foraDaLista = especialidades.filter(
    (e) => !(ESPECIALIDADES as readonly string[]).includes(e)
  );
  if (foraDaLista.length > 0)
    return erro(`Passo 1: especialidade não reconhecida: ${foraDaLista[0]}.`);

  return {
    ok: true,
    valor: {
      nome_exibicao: nome,
      titulo: titulo || null,
      crmv: crmvNormalizado.valor,
      crmv_uf: crmvUf,
      especialidades,
      experiencia: experiencia || null,
    },
  };
}

type ColunasPasso2 = {
  cidade: string;
  estado: string;
  bairro: string | null;
  atende_presencial: boolean;
  atende_domiciliar: boolean;
  atende_teleorientacao: boolean;
};

function validarPasso2(entrada: VetOnboardingPayload): Validado<ColunasPasso2> {
  const cidade = limpar(entrada?.cidade);
  const estado = limpar(entrada?.estado).toUpperCase();
  const bairro = limpar(entrada?.bairro);
  const atendePresencial = entrada?.atendePresencial === true;
  const atendeDomiciliar = entrada?.atendeDomiciliar === true;
  const atendeTeleorientacao = entrada?.atendeTeleorientacao === true;

  if (!cidade) return erro("Passo 2: informe a cidade em que você atende.");
  if (cidade.length > LIMITES.cidade)
    return erro(`Passo 2: o nome da cidade passa de ${LIMITES.cidade} caracteres.`);

  if (!estado) return erro("Passo 2: escolha o estado em que você atende.");
  if (!(UFS as readonly string[]).includes(estado))
    return erro("Passo 2: o estado de atendimento não é uma UF válida.");

  if (bairro.length > LIMITES.bairro)
    return erro(`Passo 2: o campo de bairro ou região passa de ${LIMITES.bairro} caracteres.`);

  // Pelo menos um modo de atendimento é OBRIGATÓRIO. Decisão do Elber, 26/08.
  // Não é preciosismo de formulário: `atende_presencial`, `atende_domiciliar` e
  // `atende_teleorientacao` são os filtros da busca da F4/S6. Com os três
  // falsos, o profissional preenche tudo, é aprovado por uma pessoa e não
  // aparece em filtro nenhum, sem erro em tela nenhuma.
  if (!atendePresencial && !atendeDomiciliar && !atendeTeleorientacao) {
    return erro(
      "Passo 2: marque pelo menos uma forma de atendimento, presencial, domiciliar ou teleorientação. É por ela que responsáveis filtram a busca: sem nenhuma marcada, seu perfil fica fora dos resultados."
    );
  }

  return {
    ok: true,
    valor: {
      cidade,
      estado,
      bairro: bairro || null,
      atende_presencial: atendePresencial,
      atende_domiciliar: atendeDomiciliar,
      atende_teleorientacao: atendeTeleorientacao,
    },
  };
}

type ColunasPasso3 = {
  /** Vai para `vet_profiles` (público). */
  bio: string | null;
  /** Vai para `perfil_privado` (nunca público, SEC-002). */
  whatsapp: string | null;
};

function validarPasso3(entrada: VetOnboardingPayload): Validado<ColunasPasso3> {
  const bio = typeof entrada?.bio === "string" ? entrada.bio.trim() : "";
  const whatsappBruto = limpar(entrada?.whatsapp);

  if (bio.length > LIMITES.bio)
    return erro(`Passo 3: a bio passa de ${LIMITES.bio} caracteres.`);

  if (whatsappBruto.length > LIMITES.whatsapp)
    return erro(`Passo 3: o WhatsApp passa de ${LIMITES.whatsapp} caracteres.`);

  // ⚠️ R-041 / SEC-062 — a normalização mora em `lib/contato/whatsapp.ts` e é
  // a MESMA para vet e estabelecimento, de propósito: o bug de 20/09 (o mesmo
  // número gravado em dois formatos) nasceu de duplicação.
  let whatsapp = "";
  if (whatsappBruto) {
    const normalizado = normalizarWhatsapp(whatsappBruto);
    if (!normalizado.ok) return erro(normalizado.motivo);
    whatsapp = normalizado.valor;
  }

  return { ok: true, valor: { bio: bio || null, whatsapp: whatsapp || null } };
}

// -------------------------------------------------------------------------
// 3 e 4. A GRAVAÇÃO (público em `vet_profiles`, privado em `perfil_privado`)
// -------------------------------------------------------------------------
// upsert por `id`: a primeira gravação insere, as seguintes atualizam. O
// upsert do PostgREST só escreve as colunas ENVIADAS, então gravar o passo 2
// não apaga o passo 1, e nenhuma das duas apaga o documento da T-008.
// `slug` fica FORA do payload, de propósito (SEC-008).
//
// O `.select().single()` no fim não é enfeite: é o DL-011. Sem ele, uma
// gravação que não alcança linha nenhuma volta sem erro e a tela segue como se
// tivesse dado certo.
async function gravarPublico(
  supabase: Supabase,
  userId: string,
  colunas: Partial<ColunasPasso1 & ColunasPasso2 & { bio: string | null }>
): Promise<ResultadoOnboarding | null> {
  const { data: linhaVet, error: erroVet } = await supabase
    .from("vet_profiles")
    .upsert({ id: userId, ...colunas }, { onConflict: "id" })
    .select("id")
    .single<{ id: string }>();

  if (erroVet) return mensagemDoBanco("seus dados profissionais", erroVet);
  if (!linhaVet) {
    return erro(
      "Seus dados profissionais não chegaram ao banco. Tente de novo; se continuar, fale com a gente antes de sair desta tela."
    );
  }
  return null;
}

// ⚠️ Uma coluna e mais nada. Telefone em tabela de leitura pública entrega a
// base inteira pela API anônima (SEC-002), e qualquer campo a mais aqui
// esbarra na guarda da SEC-044 ou no CHECK all-or-nothing do documento.
// `telefone` e `email_contato` não têm campo em tela e por isso não entram no
// payload (escrevê-los como nulo apagaria o que o editor de perfil gravar).
async function gravarPrivado(
  supabase: Supabase,
  userId: string,
  whatsapp: string | null
): Promise<ResultadoOnboarding | null> {
  const { data: linhaPrivada, error: erroPrivado } = await supabase
    .from("perfil_privado")
    .upsert({ id: userId, whatsapp }, { onConflict: "id" })
    .select("id")
    .single<{ id: string }>();

  if (erroPrivado) return mensagemDoBanco("seu contato", erroPrivado);
  if (!linhaPrivada) {
    return erro(
      "Seu contato não chegou ao banco. Tente de novo; se continuar, fale com a gente antes de sair desta tela."
    );
  }
  return null;
}

// -------------------------------------------------------------------------
// O RASCUNHO DE CADA "CONTINUAR" (T-051 / QA-001, causa do R-072)
// -------------------------------------------------------------------------
// Até a T-051 nada era gravado antes do passo 4: fechar a aba, recarregar ou
// deixar a sessão expirar apagava os passos 1 a 3, enquanto a barra lateral
// prometia "pausar e voltar". Agora cada "Continuar" chama esta Action com o
// número do passo, e ela:
//   · confere sessão, role e status, como a conclusão
//   · valida SÓ o passo pedido (com as mesmas funções da conclusão)
//   · grava SÓ as colunas daquele passo
//   · NÃO chama `concluir_onboarding_profissional()` e NÃO escreve status.
//     O status continua `incomplete` até o "Concluir cadastro" (matriz §4 e
//     `lib/auth/status.ts`, sem mudança)
//   · devolve `{ ok: true }` em vez de redirecionar: o próximo passo é decisão
//     da tela
//
// O portão de status é `ONBOARDING` (`lib/auth/status.ts`): `incomplete` e
// `pending_validation`, os mesmos da página. `active` fica de fora, ao
// contrário da conclusão: gravar CRMV ou nome de um perfil aprovado a cada
// clique o tiraria da busca no meio do caminho, e esta tela não é a do editor.
//
// ⚠️ Sem migration: todas as colunas tocadas aqui são anuláveis e os CHECKs
// da `0004` aceitam nulo, então uma linha com só o passo 1 é válida no banco.
export async function salvarPassoVet(
  entrada: VetOnboardingPayload,
  passo: PassoDoRascunho
): Promise<ResultadoPasso> {
  if (passo !== 1 && passo !== 2 && passo !== 3) {
    return erro("Não entendemos qual passo salvar. Recarregue a página e tente de novo.");
  }

  const quem = await conferirQuemGrava(ONBOARDING);
  if (!quem.ok) return quem;
  const { supabase, userId } = quem;

  if (passo === 1) {
    const v = validarPasso1(entrada);
    if (!v.ok) return v;
    const falha = await gravarPublico(supabase, userId, v.valor);
    if (falha) return falha;
  } else if (passo === 2) {
    const v = validarPasso2(entrada);
    if (!v.ok) return v;
    const falha = await gravarPublico(supabase, userId, v.valor);
    if (falha) return falha;
  } else {
    const v = validarPasso3(entrada);
    if (!v.ok) return v;
    const falhaPublico = await gravarPublico(supabase, userId, { bio: v.valor.bio });
    if (falhaPublico) return falhaPublico;
    const falhaPrivado = await gravarPrivado(supabase, userId, v.valor.whatsapp);
    if (falhaPrivado) return falhaPrivado;
  }

  console.log("[vet/onboarding] rascunho salvo", { userId, passo });
  return { ok: true };
}

// -------------------------------------------------------------------------
// A CONCLUSÃO (passo 4)
// -------------------------------------------------------------------------
export async function salvarOnboardingVet(
  entrada: VetOnboardingPayload
): Promise<ResultadoOnboarding | void> {
  // `active` é aceito aqui de propósito, e é a única diferença em relação ao
  // guard da página: a Action continua alcançável por aba velha, e é o passo 6
  // (a releitura de status) que conta a verdade pra quem acabou de se derrubar
  // da busca sozinho. Quem não está na lista não grava.
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

  const falhaPublico = await gravarPublico(supabase, user.id, {
    ...p1.valor,
    ...p2.valor,
    bio: p3.valor.bio,
  });
  if (falhaPublico) return falhaPublico;

  const falhaPrivado = await gravarPrivado(supabase, user.id, p3.valor.whatsapp);
  if (falhaPrivado) return falhaPrivado;


  // -------------------------------------------------------------------------
  // 5. A FILA DE VALIDAÇÃO
  // -------------------------------------------------------------------------
  // `concluir_onboarding_profissional()` é SECURITY DEFINER e é o ÚNICO
  // caminho de `incomplete` → `pending_validation`. Ela levanta
  // 'onboarding ja concluido' se o status já tiver saído de `incomplete`, então
  // a chamada é condicionada: quem volta pra corrigir só salva.
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
      console.warn("[vet/onboarding] conclusão recusada: sem documento", {
        userId: user.id,
      });
      return erro(
        "Seus dados foram salvos, mas o cadastro só segue para validação com o documento do CRMV. Envie o documento no passo 4 e conclua de novo."
      );
    }

    const { error: erroRpc } = await supabase.rpc(
      "concluir_onboarding_profissional"
    );
    if (erroRpc) {
      // ⚠️ SEC-057 — antes de chamar isto de falha, PERGUNTE AO BANCO.
      // O `if` acima decide pelo status lido no começo desta requisição. Em
      // duas abas, a outra pode ter concluído no meio: aí a RPC levanta
      // 'onboarding ja concluido' e a versão anterior mostrava "não
      // conseguimos enviar seu cadastro para validação" para quem JÁ ESTÁ na
      // fila. Não havia estado inconsistente, só uma mensagem mentindo no
      // ponto exato do funil em que a pessoa decide se fica.
      //
      // A conferência é por RELEITURA, não por comparar a string da exceção:
      // texto de `raise exception` é detalhe interno e muda sem aviso na
      // próxima migration. Se o status já saiu de `incomplete`, o objetivo da
      // chamada foi cumprido, tanto faz por quem.
      const { data: conferencia } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single<{ status: string }>();

      if (!conferencia || conferencia.status === "incomplete") {
        console.error("[vet/onboarding] rpc:error", {
          message: erroRpc.message,
          code: erroRpc.code,
        });
        // ⚠️ T-027 / SEC-098 — desde a `0004` a RPC confere o OBJETO no
        // bucket, não só a coluna. 55000 é o código combinado com ela para
        // "documento ausente": a linha diz que há documento e o arquivo não
        // está no armazenamento. Decidido pelo CÓDIGO, nunca pelo texto da
        // exceção (SEC-057).
        if (erroRpc.code === "55000") {
          return erro(
            "Seus dados foram salvos, mas o documento do CRMV não foi encontrado no armazenamento. Envie o documento de novo no passo 4 e conclua."
          );
        }
        return erro(
          "Seus dados foram salvos, mas não conseguimos enviar seu cadastro para validação. Tente concluir de novo em alguns instantes."
        );
      }

      console.warn("[vet/onboarding] rpc:ja-concluida", {
        userId: user.id,
        status: conferencia.status,
      });
    }
  }

  // -------------------------------------------------------------------------
  // 6. RELEITURA DO STATUS (não confie no que você mandou)
  // -------------------------------------------------------------------------
  // O trigger de revalidação (SEC-016/023) devolve pra `pending_validation`
  // quem já estava `active` e mexeu em CRMV, UF ou nome de exibição. Nem o
  // update nem a RPC contam isso na resposta. Sem esta releitura, a tela manda
  // pro painel um profissional que acabou de sair da busca.
  const { data: depois } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single<{ status: string }>();

  const statusFinal = depois?.status ?? perfil.status;

  console.log("[vet/onboarding] salvo", {
    userId: user.id,
    statusAntes: perfil.status,
    statusDepois: statusFinal,
  });

  // ⚠️ DL-016 — redirect() fora de qualquer try/catch. O NEXT_REDIRECT precisa
  // borbulhar pro framework.
  if (statusFinal === "pending_validation") redirect("/app/veterinario/aguardando");
  redirect("/app/veterinario");
}
