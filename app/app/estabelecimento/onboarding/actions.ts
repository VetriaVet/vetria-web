"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LIMITES,
  MAX_SERVICOS,
  SERVICOS,
  UFS,
  type ClinicOnboardingPayload,
  type ResultadoOnboarding,
} from "./campos";

// T-007 — o onboarding do estabelecimento passa a persistir.
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

  return erro(
    `Não foi possível salvar ${contexto}. Nada foi perdido: seus dados continuam na tela, tente de novo em alguns instantes.` +
      (detalhe.code ? ` (código ${detalhe.code})` : "")
  );
}

// ⚠️ R-041 / SEC-062 — o WhatsApp é normalizado para dígitos NA ESCRITA.
//
// Sem isto, `(63) 99999-9999`, `63999999999` e `+55 63 9 9999-9999` são três
// linhas diferentes no banco para o mesmo número. Pelo DL-047 é este valor que
// o servidor devolve no evento de contato e que conta como lead entregue: a
// rota de contato da F4 vai precisar montar um `wa.me` a partir dele, e
// normalizar depois de existir base gravada em três formatos custa muito mais.
//
// ⚠️ CONTRATO DO QUE FICA GRAVADO, para quem escrever a rota de contato da F4:
// dígitos, DDD + número, SEM o código do país. `55` é acrescentado por quem
// monta o `wa.me`, não por quem grava. Guardar sem o `55` é o que faz o campo
// reabrir legível nesta mesma tela.
//
// O que isto NÃO é: verificação de posse. Ninguém confirmou que o número é do
// estabelecimento. Código por SMS está fora dos 3 meses.
function normalizarWhatsapp(
  bruto: string
): { ok: true; valor: string } | { ok: false; motivo: string } {
  let d = bruto.replace(/\D+/g, "");

  // `+55 63 ...` e `55 63 ...` chegam com o código do país colado.
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) {
    d = d.slice(2);
  }

  if (d.startsWith("0")) {
    return {
      ok: false,
      motivo:
        "Passo 3: o WhatsApp precisa ser um número com DDD. Números 0800 e 0300 não recebem mensagem no WhatsApp.",
    };
  }

  if (d.length !== 10 && d.length !== 11) {
    return {
      ok: false,
      motivo:
        "Passo 3: informe o WhatsApp com DDD, no formato (00) 00000-0000. Só o número, sem ramal.",
    };
  }

  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return { ok: false, motivo: "Passo 3: o DDD do WhatsApp não é válido." };
  }

  return { ok: true, valor: d };
}

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

export async function salvarOnboardingClinic(
  entrada: ClinicOnboardingPayload
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
  //
  // `active` é aceito de propósito, e é a única diferença em relação ao guard
  // da página: a Action continua alcançável por aba velha, e é o passo 6 (a
  // releitura de status) que conta a verdade pra quem acabou de se derrubar da
  // busca sozinho. Aqui isso é mais provável que no veterinário: desde a
  // `0003`, `revalidar_ao_mudar_dado_sensivel()` vigia `cnpj`, `razao_social` e
  // `responsavel_tecnico` dentro de `perfil_privado`, então trocar qualquer um
  // dos três devolve um estabelecimento `active` para `pending_validation`.
  const PODEM_GRAVAR = ["incomplete", "pending_validation", "active"];
  if (!PODEM_GRAVAR.includes(perfil.status)) {
    console.warn("[clinic/onboarding] escrita recusada por status", {
      userId: user.id,
      status: perfil.status,
    });
    if (perfil.status === "suspended") {
      return erro(
        "A conta do estabelecimento está suspensa e não aceita alterações no cadastro. Fale com a gente para entender o motivo."
      );
    }
    return erro(
      "A conta está num estado que não permite editar o cadastro agora. Fale com a gente."
    );
  }

  // -------------------------------------------------------------------------
  // 2. VALIDAÇÃO E NORMALIZAÇÃO
  // -------------------------------------------------------------------------
  const nomeFantasia = limpar(entrada?.nomeFantasia);
  const razaoSocial = limpar(entrada?.razaoSocial);
  const cnpjBruto = limpar(entrada?.cnpj);
  const responsavelTecnico = limpar(entrada?.responsavelTecnico);
  const endereco = limpar(entrada?.endereco);
  const cepBruto = limpar(entrada?.cep);
  const cidade = limpar(entrada?.cidade);
  const estado = limpar(entrada?.estado).toUpperCase();
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

  // -------------------------------------------------------------------------
  // 3. O QUE É PÚBLICO → clinic_profiles
  // -------------------------------------------------------------------------
  // upsert por `id`: a primeira conclusão insere, a correção depois atualiza.
  // `slug` fica FORA do payload nos dois caminhos, de propósito, e a RLS ainda
  // pina por cima (`slug is null` no INSERT, `is not distinct from` no UPDATE).
  //
  // ⚠️ NENHUM dos três dados de identificação aparece aqui, nem como nulo
  // explícito: depois da `0003` as colunas não existem mais nesta tabela.
  //
  // O `.select().single()` no fim não é enfeite: é o DL-011. Sem ele, uma
  // gravação que não alcança linha nenhuma volta sem erro e a tela manda o
  // estabelecimento pra fila de validação como se tivesse dado certo.
  const { data: linhaClinic, error: erroClinic } = await supabase
    .from("clinic_profiles")
    .upsert(
      {
        id: user.id,
        nome_fantasia: nomeFantasia,
        endereco: endereco || null,
        cep: cep || null,
        cidade,
        estado,
        sobre: sobre || null,
        servicos,
      },
      { onConflict: "id" }
    )
    .select("id")
    .single<{ id: string }>();

  if (erroClinic)
    return mensagemDoBanco("os dados do estabelecimento", erroClinic);
  if (!linhaClinic) {
    return erro(
      "Os dados do estabelecimento não chegaram ao banco. Tente de novo; se continuar, fale com a gente antes de sair desta tela."
    );
  }

  // -------------------------------------------------------------------------
  // 4. O QUE É PRIVADO → perfil_privado
  // -------------------------------------------------------------------------
  // ⚠️ Quatro colunas, e as três de identificação são o motivo da `0003`.
  // `razao_social`, `cnpj` e `responsavel_tecnico` saíram de `clinic_profiles`
  // porque aquela tabela é lida por `anon`: um único
  // `GET /rest/v1/clinic_profiles?select=cnpj,razao_social` entregava a base
  // inteira (SEC-020 / R-018 / DL-053). Aqui só o dono e o admin leem.
  //
  // A guarda `trg_perfil_privado_dado_de_estabelecimento` (SEC-044) confere que
  // o dono desta linha é mesmo `clinic` antes de aceitar os três. A conferência
  // de role lá em cima já garante isso; a guarda é a segunda porta.
  //
  // `telefone`, `email_contato` e as três colunas de documento ficam FORA do
  // payload em vez de irem como nulo: o upsert do PostgREST só escreve as
  // colunas enviadas, então o editor de perfil da S3 e o upload da T-008 não
  // são apagados por quem revisita esta tela.
  const { data: linhaPrivada, error: erroPrivado } = await supabase
    .from("perfil_privado")
    .upsert(
      {
        id: user.id,
        whatsapp: whatsapp || null,
        razao_social: razaoSocial || null,
        cnpj: cnpjNormalizado.valor,
        responsavel_tecnico: responsavelTecnico || null,
      },
      { onConflict: "id" }
    )
    .select("id")
    .single<{ id: string }>();

  if (erroPrivado)
    return mensagemDoBanco("os dados de identificação e contato", erroPrivado);
  if (!linhaPrivada) {
    return erro(
      "Os dados de identificação não chegaram ao banco. Tente de novo; se continuar, fale com a gente antes de sair desta tela."
    );
  }

  // -------------------------------------------------------------------------
  // 5. A FILA DE VALIDAÇÃO
  // -------------------------------------------------------------------------
  // Mesma RPC do veterinário. `concluir_onboarding_profissional()` é SECURITY
  // DEFINER, aceita `vet` e `clinic` (`0002:717-745`) e é o ÚNICO caminho de
  // `incomplete` → `pending_validation`. Ela levanta 'onboarding ja concluido'
  // se o status já saiu de `incomplete`, então a chamada é condicionada: quem
  // volta pra corrigir só salva.
  if (perfil.status === "incomplete") {
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
