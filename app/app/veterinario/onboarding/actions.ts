"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ESPECIALIDADES,
  EXPERIENCIA,
  LIMITES,
  MAX_ESPECIALIDADES,
  TITULOS,
  UFS,
  type ResultadoOnboarding,
  type VetOnboardingPayload,
} from "./campos";

// T-006 — o onboarding do veterinário passa a persistir.
//
// Padrão da casa (DL-012): Server Component busca → Server Action muta →
// Client Form interage.
//
// O que esta Action faz, na ordem, e por quê:
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

  return erro(
    `Não foi possível salvar ${contexto}. Nada foi perdido: seus dados continuam na tela, tente de novo em alguns instantes.` +
      (detalhe.code ? ` (código ${detalhe.code})` : "")
  );
}

export async function salvarOnboardingVet(
  entrada: VetOnboardingPayload
): Promise<ResultadoOnboarding | void> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
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
  //
  // `active` é aceito aqui de propósito, e é a única diferença em relação ao
  // guard da página: a Action continua alcançável por aba velha, e é o passo 6
  // (a releitura de status) que conta a verdade pra quem acabou de se derrubar
  // da busca sozinho. Quem não está na lista não grava.
  const PODEM_GRAVAR = ["incomplete", "pending_validation", "active"];
  if (!PODEM_GRAVAR.includes(perfil.status)) {
    console.warn("[vet/onboarding] escrita recusada por status", {
      userId: user.id,
      status: perfil.status,
    });
    if (perfil.status === "suspended") {
      return erro(
        "Sua conta está suspensa e não aceita alterações no perfil. Fale com a gente para entender o motivo."
      );
    }
    return erro(
      "Sua conta está num estado que não permite editar o perfil agora. Fale com a gente."
    );
  }

  // -------------------------------------------------------------------------
  // 2. VALIDAÇÃO E NORMALIZAÇÃO
  // -------------------------------------------------------------------------
  const nome = limpar(entrada?.nome);
  const crmv = limpar(entrada?.crmv);
  const crmvUf = limpar(entrada?.crmvUf).toUpperCase();
  const cidade = limpar(entrada?.cidade);
  const estado = limpar(entrada?.estado).toUpperCase();
  const bairro = limpar(entrada?.bairro);
  const bio = typeof entrada?.bio === "string" ? entrada.bio.trim() : "";
  const whatsapp = limpar(entrada?.whatsapp);
  const titulo = limpar(entrada?.titulo);
  const experiencia = limpar(entrada?.experiencia);

  const atendePresencial = entrada?.atendePresencial === true;
  const atendeDomiciliar = entrada?.atendeDomiciliar === true;
  const atendeTeleorientacao = entrada?.atendeTeleorientacao === true;

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

  if (!crmv) return erro("Passo 1: informe o número do CRMV.");
  if (crmv.length > LIMITES.crmv)
    return erro(`Passo 1: o número do CRMV passa de ${LIMITES.crmv} caracteres.`);

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
  // aparece em filtro nenhum, sem erro em tela nenhuma. É o sintoma da SEC-044
  // de novo: usuário legítimo sumindo do produto sem entender por quê. Aqui dá
  // pra impedir na entrada, e custa um clique.
  if (!atendePresencial && !atendeDomiciliar && !atendeTeleorientacao) {
    return erro(
      "Passo 2: marque pelo menos uma forma de atendimento, presencial, domiciliar ou teleorientação. É por ela que responsáveis filtram a busca: sem nenhuma marcada, seu perfil fica fora dos resultados."
    );
  }

  if (bio.length > LIMITES.bio)
    return erro(`Passo 3: a bio passa de ${LIMITES.bio} caracteres.`);

  if (whatsapp.length > LIMITES.whatsapp)
    return erro(`Passo 3: o WhatsApp passa de ${LIMITES.whatsapp} caracteres.`);

  // -------------------------------------------------------------------------
  // 3. O QUE É PÚBLICO → vet_profiles
  // -------------------------------------------------------------------------
  // upsert por `id`: a primeira conclusão insere, a correção depois atualiza.
  // `slug` fica FORA do payload nos dois caminhos, de propósito.
  //
  // O `.select().single()` no fim não é enfeite: é o DL-011. Sem ele, uma
  // gravação que não alcança linha nenhuma volta sem erro e a tela manda a
  // pessoa pra fila de validação como se tivesse dado certo.
  const { data: linhaVet, error: erroVet } = await supabase
    .from("vet_profiles")
    .upsert(
      {
        id: user.id,
        nome_exibicao: nome,
        titulo: titulo || null,
        crmv,
        crmv_uf: crmvUf,
        especialidades,
        experiencia: experiencia || null,
        bio: bio || null,
        cidade,
        estado,
        bairro: bairro || null,
        atende_presencial: atendePresencial,
        atende_domiciliar: atendeDomiciliar,
        atende_teleorientacao: atendeTeleorientacao,
      },
      { onConflict: "id" }
    )
    .select("id")
    .single<{ id: string }>();

  if (erroVet) return mensagemDoBanco("seus dados profissionais", erroVet);
  if (!linhaVet) {
    return erro(
      "Seus dados profissionais não chegaram ao banco. Tente de novo; se continuar, fale com a gente antes de sair desta tela."
    );
  }

  // -------------------------------------------------------------------------
  // 4. O QUE É PRIVADO → perfil_privado
  // -------------------------------------------------------------------------
  // ⚠️ Duas colunas e mais nada. Telefone em tabela de leitura pública entrega
  // a base inteira pela API anônima (SEC-002), e qualquer campo a mais aqui
  // esbarra na guarda da SEC-044 ou no CHECK all-or-nothing do documento.
  // O formulário do vet só coleta WhatsApp hoje: `telefone` e `email_contato`
  // não têm campo em tela e por isso não entram no payload (escrevê-los como
  // nulo apagaria o que o editor de perfil da S3 vier a gravar).
  const { data: linhaPrivada, error: erroPrivado } = await supabase
    .from("perfil_privado")
    .upsert(
      {
        id: user.id,
        whatsapp: whatsapp || null,
      },
      { onConflict: "id" }
    )
    .select("id")
    .single<{ id: string }>();

  if (erroPrivado) return mensagemDoBanco("seu contato", erroPrivado);
  if (!linhaPrivada) {
    return erro(
      "Seu contato não chegou ao banco. Tente de novo; se continuar, fale com a gente antes de sair desta tela."
    );
  }

  // -------------------------------------------------------------------------
  // 5. A FILA DE VALIDAÇÃO
  // -------------------------------------------------------------------------
  // `concluir_onboarding_profissional()` é SECURITY DEFINER e é o ÚNICO
  // caminho de `incomplete` → `pending_validation`. Ela levanta
  // 'onboarding ja concluido' se o status já tiver saído de `incomplete`, então
  // a chamada é condicionada: quem volta pra corrigir só salva.
  if (perfil.status === "incomplete") {
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
