import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// T-008 — A ROTA DE ESCRITA DO DOCUMENTO DE VALIDAÇÃO.
//
// Ela implementa, na ordem, o contrato de oito passos da seção 2.b de
// `supabase/migrations/0003_storage_documentos.sql`, mais a seção 🔒
// "A ORDEM, A COMPENSAÇÃO E A VARREDURA" do card da T-008. Nada aqui foi
// decidido dentro de um try/catch: foi decidido em 09/09 e está escrito.
//
// SEC-036 / DL-051 — O ARQUIVO SOBE POR UMA ROTA NOSSA.
// `createSignedUploadUrl` não é usada em lugar nenhum e nenhum token de
// escrita chega ao cliente. É isso que faz a validação de tipo REAL existir:
// os bytes passam por aqui antes de existirem no bucket.
//
// ⚠️ SEC-079 — O PORTÃO DE ROTA NÃO ALCANÇA ROUTE HANDLER.
// `middleware.ts` tem `matcher: ["/app/:path*", "/admin/:path*"]`. Esta rota
// está fora dele, e um POST direto aqui não passa por portão nenhum. Por isso
// ela reconfere sessão, role e status por conta própria, abaixo, antes de ler
// um único byte do corpo.
//
// ⚠️ O QUE ELA NÃO ESCREVE, NUNCA: `profiles.status`,
// `profiles.onboarding_completed` e `documento_enviado_em`. Status é do admin
// (matriz §3, regra 1); o carimbo é do trigger `trg_perfil_privado_carimbo`.

export const runtime = "nodejs";

const BUCKET = "documentos";

// ⚠️ MESMO TETO DO BUCKET (`file_size_limit`) E DO CHECK
// `perfil_privado_documento_tamanho_limite`. A `0003` §2.c chama isto de "as
// quatro listas que mudam juntas": bucket, CHECK de extensão, assinatura
// mágica e limite de bytes. Mexeu numa, mexeu nas quatro, ou o objeto sobe e a
// linha é recusada.
const LIMITE_BYTES = 10485760;

// ⚠️ A LISTA DE PERMITIDOS DE STATUS (SEC-052 / SEC-054), igual à das Server
// Actions de onboarding. Lista de permitidos, nunca de negados: `rejected` ou
// `deleted` no enum amanhã nascem barrados.
//
// `active` entra de propósito e é o único ponto discutível: um profissional já
// aprovado que troque o documento dispara `revalidar_ao_mudar_dado_sensivel`
// (a `0003` §6.a vigia `documento_hash`) e volta sozinho para
// `pending_validation`. Isso é o desenho da SEC-023/SEC-033, não efeito
// colateral: documento novo é documento que ninguém conferiu.
//
// ⚠️ SEC-084 — essa garantia vale no ramo UPDATE, e o passo 8 é um `upsert`.
//
// `trg_perfil_privado_revalidar` é `AFTER UPDATE` (`0002_nucleo.sql:446-448`),
// não `after insert or update`. Se o `upsert` resolver por INSERT — o caso que
// obrigou a troca de `update` por `upsert`, porque a linha de `perfil_privado`
// pode não existir ainda —, o carimbo roda (aquele trigger é `before insert or
// update`) mas **a revalidação não**. Um perfil `active` sem linha receberia
// documento novo e continuaria `active`.
//
// Hoje isso é quase inalcançável: as Server Actions de onboarding fazem upsert
// em `perfil_privado` antes de chamar a RPC, então quem chegou a
// `pending_validation` pela porta da frente tem linha. As portas que sobram são
// um `admin_definir_status` que leve à `active` alguém que nunca fez onboarding,
// e qualquer caminho futuro que pule a Action — a fila da S4, por exemplo, que
// ainda não existe.
//
// O conserto de verdade é `after insert or update` no trigger, que é migration,
// logo 🔴, logo NÃO é desta task. Está na lista da `0004`. O que dá pra fazer
// aqui é não prometer o que o banco não entrega.
const PODEM_ENVIAR = ["incomplete", "pending_validation", "active"];

// ---------------------------------------------------------------------------
// PASSO 4 — A ASSINATURA MÁGICA (0003 §2.c)
// ---------------------------------------------------------------------------
// ⚠️ O tipo é lido dos PRIMEIROS BYTES, nunca do `content-type` declarado e
// nunca da extensão do nome que veio do navegador. A extensão do caminho é
// DERIVADA daqui (passo 5).
//
// `image/svg+xml` e `text/html` não estão nesta tabela e não podem entrar
// (R-004): o admin abre este arquivo dentro do painel de maior privilégio do
// sistema, e `dangerouslyAllowSVG` está ligado no `next.config.ts`.

type TipoAceito = {
  mime: string;
  ext: string;
  casa: (bytes: Uint8Array) => boolean;
};

function bateEm(bytes: Uint8Array, assinatura: number[], offset = 0): boolean {
  if (bytes.length < offset + assinatura.length) return false;
  return assinatura.every((b, i) => bytes[offset + i] === b);
}

const TIPOS_ACEITOS: TipoAceito[] = [
  {
    // "%PDF-"
    mime: "application/pdf",
    ext: "pdf",
    casa: (b) => bateEm(b, [0x25, 0x50, 0x44, 0x46, 0x2d]),
  },
  {
    mime: "image/jpeg",
    ext: "jpg",
    casa: (b) => bateEm(b, [0xff, 0xd8, 0xff]),
  },
  {
    mime: "image/png",
    ext: "png",
    casa: (b) => bateEm(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    // "RIFF" nos bytes 0-3 e "WEBP" nos bytes 8-11. As duas metades, sempre:
    // só "RIFF" também é WAV e AVI.
    mime: "image/webp",
    ext: "webp",
    casa: (b) =>
      bateEm(b, [0x52, 0x49, 0x46, 0x46]) &&
      bateEm(b, [0x57, 0x45, 0x42, 0x50], 8),
  },
];

function detectarTipo(bytes: Uint8Array): TipoAceito | null {
  return TIPOS_ACEITOS.find((t) => t.casa(bytes)) ?? null;
}

// ---------------------------------------------------------------------------
// PASSO 6 — O CAMINHO, PELA REGRA DA SEÇÃO 3 DA `0003`
// ---------------------------------------------------------------------------
// `<uuid do dono>/documento-<epoch em ms>.<ext>`
//
// O uuid vem de `auth.uid()` da sessão, nunca do corpo da requisição: é a
// diferença entre a SEC-003 estar fechada e estar aberta. O epoch em ms existe
// para que CADA ENVIO TENHA CAMINHO NOVO (SEC-033) — sem isso, trocar os bytes
// de um documento já aprovado não trocaria a string e nada dispararia.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function montarCaminho(donoId: string, ext: string): string {
  return `${donoId}/documento-${Date.now()}.${ext}`;
}

// A MESMA REGEX DO CHECK `perfil_privado_documento_do_dono` (0002 §4.2b),
// conferida no servidor ANTES do upload. Não é redundância barata: sem esta
// linha, um caminho malformado seria escrito no bucket no passo 7 e recusado
// pelo banco no passo 8, ou seja, um órfão garantido a cada envio.
function caminhoPassaNoCheck(donoId: string, caminho: string): boolean {
  return new RegExp(
    `^${donoId}/[A-Za-z0-9_-]{1,120}\\.(pdf|jpg|jpeg|png|webp)$`
  ).test(caminho);
}

// ---------------------------------------------------------------------------
// RESPOSTAS E LOG
// ---------------------------------------------------------------------------
// ⚠️ SEC-056, clonado de `estabelecimento/onboarding/actions.ts:81-84`: o tipo
// NÃO ACEITA `details`, e isso é barreira de compilação, não disciplina. O
// campo DETAIL do Postgres para esta tabela vem como
// `Failing row contains (<uuid>, <whatsapp>, <telefone>, ..., <cnpj>, ...)`:
// é a linha inteira de `perfil_privado` indo para o log da Vercel, que está
// fora do alcance da rotina de exportação e exclusão da F6 (R-024).
// Quem clonar isto: não acrescente `details` de volta "só pra depurar".
//
// ⚠️ O NOME DO ARQUIVO QUE VEIO DO NAVEGADOR NÃO É LOGADO em lugar nenhum, e
// os bytes muito menos.
type ErroDoBanco = { message: string; code?: string };

function recusa(status: number, mensagem: string) {
  return NextResponse.json({ erro: mensagem }, { status });
}

// ---------------------------------------------------------------------------
// A COMPENSAÇÃO (seção 🔒, item 2 do card da T-008)
// ---------------------------------------------------------------------------
// ⚠️ MORA AQUI, NO ARQUIVO DA ROTA, E NÃO EM `lib/`, por decisão escrita:
// ninguém mais usa isso, e pôr em `lib/` é convidar a próxima rota a chamar
// sem entender o que ela desfaz.
//
// Qualquer erro no passo 8 (recusa de policy, CHECK all-or-nothing, guarda da
// SEC-044/R-029, hash malformado, timeout) apaga o objeto que o passo 7
// acabou de escrever, com o MESMO cliente `service_role`, e só então a rota
// responde erro. Ela nunca responde sucesso.
//
// ⚠️ Quando a própria compensação falhar (o Storage pode estar fora no mesmo
// minuto em que o Postgres recusou), a rota NÃO ENGOLE: registra a marca fixa
// `DOCUMENTO_ORFAO` com o caminho e o código do erro do passo 8, para que a
// varredura do item 3 da seção 🔒 tenha por onde começar.
async function compensarObjetoOrfao(
  // ⚠️ O CLIENTE VEM POR PARÂMETRO, e é o MESMO do passo 7. O card diz "com o
  // mesmo cliente `service_role` do passo 7", e criar outro aqui dentro seria
  // abrir a porta para alguém, um dia, passar a sessão do usuário para esta
  // função. A sessão do usuário não alcança o bucket: a remoção falharia em
  // silêncio e o órfão nasceria sem nem a marca no log.
  serviceRole: ReturnType<typeof createAdminClient>,
  caminho: string,
  codigoDoPasso8: string | undefined
): Promise<void> {
  const { error } = await serviceRole.storage.from(BUCKET).remove([caminho]);

  if (error) {
    console.error("DOCUMENTO_ORFAO", {
      caminho,
      passo8: codigoDoPasso8 ?? "sem-codigo",
      remocao: error.message,
    });
    return;
  }

  console.warn("[documentos/upload] objeto compensado apos falha no passo 8", {
    caminho,
    passo8: codigoDoPasso8 ?? "sem-codigo",
  });
}

export async function POST(req: Request) {
  try {
    // -----------------------------------------------------------------------
    // 1. SESSÃO. Sem sessão, 401 antes de ler um byte.
    // -----------------------------------------------------------------------
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      return recusa(
        401,
        "Sua sessão expirou. Entre de novo para enviar o documento."
      );
    }

    if (!UUID.test(user.id)) {
      // Nunca deve acontecer: `auth.uid()` é uuid. Se acontecer, o caminho do
      // passo 6 sairia malformado e a regex do CHECK viraria texto livre.
      console.error("[documentos/upload] id de sessao fora do formato uuid");
      return recusa(
        500,
        "Não foi possível enviar o documento agora. Tente de novo em alguns instantes."
      );
    }

    // -----------------------------------------------------------------------
    // 2. ROLE E STATUS, CONFERIDOS POR CONTA PRÓPRIA (SEC-079)
    // -----------------------------------------------------------------------
    // Responsável não tem documento de validação (mesma razão da guarda da
    // SEC-032: a policy `perfil_privado_insert_own` nem o deixaria gravar).
    // Rota em português, role em inglês (DL-043).
    const { data: perfil, error: erroPerfil } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single<{ role: string; status: string }>();

    if (erroPerfil || !perfil) {
      console.error("[documentos/upload] perfil nao encontrado", {
        message: erroPerfil?.message ?? "sem linha",
        code: erroPerfil?.code,
      });
      return recusa(
        403,
        "Não foi possível confirmar seu cadastro. Saia e entre de novo."
      );
    }

    if (perfil.role !== "vet" && perfil.role !== "clinic") {
      console.warn("[documentos/upload] envio recusado por role", {
        userId: user.id,
        role: perfil.role,
      });
      return recusa(403, "Esta conta não envia documento de validação.");
    }

    if (!PODEM_ENVIAR.includes(perfil.status)) {
      console.warn("[documentos/upload] envio recusado por status", {
        userId: user.id,
        status: perfil.status,
      });
      if (perfil.status === "suspended") {
        return recusa(
          403,
          "A conta está suspensa e não aceita envio de documento. Fale com a gente para entender o motivo."
        );
      }
      return recusa(
        403,
        "A conta está num estado que não permite enviar documento agora. Fale com a gente."
      );
    }

    // -----------------------------------------------------------------------
    // 3. OS BYTES, COM LIMITE DURO NO SERVIDOR
    // -----------------------------------------------------------------------
    // O `file_size_limit` do bucket é a segunda porta, não a primeira: quem
    // mede aqui somos nós, antes de mandar qualquer coisa para o Storage.
    let formulario: FormData;
    try {
      formulario = await req.formData();
    } catch {
      return recusa(400, "O envio chegou incompleto. Tente de novo.");
    }

    const arquivo = formulario.get("arquivo");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      return recusa(400, "Escolha um arquivo para enviar.");
    }

    if (arquivo.size > LIMITE_BYTES) {
      return recusa(
        413,
        "O arquivo passa de 10 MB. Envie uma foto menor ou um PDF mais leve."
      );
    }

    const bytes = new Uint8Array(await arquivo.arrayBuffer());

    // O tamanho que vale é o dos bytes que chegaram, não o que o `File`
    // declarou. É este número que vai para `documento_tamanho`.
    if (bytes.length === 0) {
      return recusa(400, "O arquivo chegou vazio. Tente de novo.");
    }
    if (bytes.length > LIMITE_BYTES) {
      return recusa(
        413,
        "O arquivo passa de 10 MB. Envie uma foto menor ou um PDF mais leve."
      );
    }

    // -----------------------------------------------------------------------
    // 4. O TIPO REAL, PELOS PRIMEIROS BYTES
    // -----------------------------------------------------------------------
    const tipo = detectarTipo(bytes);
    if (!tipo) {
      console.warn("[documentos/upload] tipo recusado pela assinatura magica", {
        userId: user.id,
        bytes: bytes.length,
      });
      return recusa(
        415,
        "Formato não aceito. Envie o documento em PDF, JPG, PNG ou WEBP. Arquivo de texto, SVG e página da web não entram."
      );
    }

    // -----------------------------------------------------------------------
    // 5 e 6. EXTENSÃO DERIVADA DO TIPO DETECTADO, E O CAMINHO
    // -----------------------------------------------------------------------
    const caminho = montarCaminho(user.id, tipo.ext);
    if (!caminhoPassaNoCheck(user.id, caminho)) {
      console.error("[documentos/upload] caminho montado nao passa no CHECK", {
        caminho,
      });
      return recusa(
        500,
        "Não foi possível enviar o documento agora. Tente de novo em alguns instantes."
      );
    }

    const hash = createHash("sha256").update(bytes).digest("hex");

    // -----------------------------------------------------------------------
    // 7. O OBJETO VAI PARA O BUCKET — E ESTE É O ÚNICO PASSO COM `service_role`
    // -----------------------------------------------------------------------
    // A ordem é 7 → 8, e o custo foi escolhido por escrito (seção 🔒, item 1):
    // objeto sem linha é INERTE (o bucket tem zero policy, nem o dono o
    // alcança) e é DETECTÁVEL (o caminho começa pelo uuid do dono); linha sem
    // objeto é uma mentira que carimba `documento_enviado_em`, dispara a
    // revalidação da `0003` §6, move o `status` e põe o profissional na fila do
    // admin com um arquivo que não existe.
    //
    // `upsert: false` de propósito: a rota NUNCA escreve num caminho que já
    // existe. Colisão é erro, não motivo para sobrescrever (SEC-033).
    //
    // O `contentType` declarado aqui é o que a rota DETECTOU, não o que o
    // navegador disse. A whitelist do bucket é o alarme sobre o nosso próprio
    // código, não a porta contra o atacante (0003 §2.c).
    const serviceRole = createAdminClient();
    const { error: erroUpload } = await serviceRole.storage
      .from(BUCKET)
      .upload(caminho, bytes, { contentType: tipo.mime, upsert: false });

    if (erroUpload) {
      console.error("[documentos/upload] passo 7 falhou", {
        caminho,
        message: erroUpload.message,
      });
      return recusa(
        502,
        "Não conseguimos guardar o arquivo agora. Tente de novo em alguns instantes."
      );
    }

    // -----------------------------------------------------------------------
    // 8. A LINHA, COM A SESSÃO DO USUÁRIO (DL-055 / SEC-051 / R-031)
    // -----------------------------------------------------------------------
    // ⚠️ NUNCA com `service_role`, nem "só quando a policy falhar". Com
    // `service_role`, `auth.uid()` é nulo e o `insert into audit_logs` do
    // trigger de revalidação grava `actor_id = null`: a trilha diria que o
    // perfil voltou para a fila e não diria quem mexeu. Sob RLS, a policy
    // `perfil_privado_update_own` ainda vira segunda porta de graça.
    //
    // As TRÊS COLUNAS JUNTAS, numa escrita só: o CHECK
    // `perfil_privado_documento_completo` recusa dois de três, e é de
    // propósito — documento sem identidade dos bytes não é estado válido.
    //
    // ⚠️ POR QUE `upsert` E NÃO `update` PURO: a linha de `perfil_privado`
    // pode não existir ainda. Nada a cria no cadastro; quem a cria é a Server
    // Action do onboarding, que roda DEPOIS deste envio (o passo 4 do
    // formulário vem antes do "Concluir"). Um `update` que não alcança linha
    // nenhuma volta SEM ERRO e sem gravar nada, que é exatamente a resposta de
    // sucesso sem linha gravada que este card proíbe. O `upsert` continua
    // sendo UMA escrita, com as três colunas juntas, sob as mesmas policies
    // (`perfil_privado_insert_own` e `perfil_privado_update_own`, as duas com a
    // guarda de role da SEC-032).
    //
    // O `.select(...).single()` no fim é o DL-011: sem ele, uma gravação que
    // não alcança linha nenhuma volta sem erro e a tela diria que o documento
    // foi enviado.
    // ⚠️ O `try` é DESTE PASSO, e existe por um motivo só: se a chamada
    // LEVANTAR em vez de devolver `error` (queda de rede a caminho do
    // PostgREST, por exemplo), o `catch` lá de baixo responderia 500 sem
    // compensar, e o objeto do passo 7 viraria órfão sem ninguém saber. Aqui
    // a exceção vira erro comum e cai no mesmo caminho de compensação.
    let linha: { id: string; documento_enviado_em: string | null } | null = null;
    let erroLinha: ErroDoBanco | null = null;

    try {
      const resultado = await supabase
        .from("perfil_privado")
        .upsert(
          {
            id: user.id,
            documento_path: caminho,
            documento_hash: hash,
            documento_tamanho: bytes.length,
          },
          { onConflict: "id" }
        )
        .select("id, documento_enviado_em")
        .single<{ id: string; documento_enviado_em: string | null }>();

      linha = resultado.data;
      erroLinha = resultado.error;
    } catch (e: unknown) {
      erroLinha = {
        message: e instanceof Error ? e.message : "excecao no passo 8",
        code: "EXCECAO",
      };
    }

    if (erroLinha || !linha) {
      const detalhe: ErroDoBanco = erroLinha ?? {
        message: "nenhuma linha gravada",
      };

      console.error("[documentos/upload] passo 8 falhou", {
        userId: user.id,
        caminho,
        message: detalhe.message,
        code: detalhe.code,
      });

      await compensarObjetoOrfao(serviceRole, caminho, detalhe.code);

      // ⚠️ R-029 (SEC-049) — FALHA NOMEADA, não erro genérico.
      // A guarda `recusar_dado_de_estabelecimento_em_pessoa_fisica` levanta em
      // TODO update da linha de quem trocou de `clinic` para `vet` sem limpar
      // `cnpj`, `razao_social` e `responsavel_tecnico` — inclusive neste passo
      // 8, que nem toca nas três. O código é `P0001` (`raise exception` de
      // plpgsql), e é por CÓDIGO que se reconhece, não pelo texto: texto de
      // exceção é detalhe interno e muda na próxima migration (a lição da
      // SEC-057). Em `perfil_privado` esta é a única trigger que levanta.
      //
      // ⚠️ A saída existe e é 🔴: um UPDATE que zere as três colunas destrava a
      // linha. A frase que falta DENTRO da exceção está escrita no item 6 da
      // seção 🔒 do card, para a `0004` levar. Esta rota não faz
      // `create or replace` de função nenhuma.
      if (detalhe.code === "P0001") {
        return recusa(
          409,
          "O cadastro desta conta está travado por dados de estabelecimento que ficaram numa conta de pessoa física. O envio não foi concluído, e isso é caso de suporte: fale com a gente para destravar."
        );
      }

      if (detalhe.code === "42501" || detalhe.code === "PGRST301") {
        // Falha RUIDOSA. Não existe plano B com `service_role`: o card proíbe
        // em circunstância nenhuma, e cair para ele apagaria o `actor_id` da
        // trilha no exato momento em que a policy do dono não alcançou.
        return recusa(
          403,
          "Sua sessão não tem permissão para registrar o documento. O envio não foi concluído. Saia e entre de novo; se continuar, fale com a gente."
        );
      }

      return recusa(
        502,
        "O envio não foi concluído e o arquivo não ficou guardado. Nada mudou no seu cadastro: tente enviar de novo em alguns instantes."
      );
    }

    // ⚠️ SEC-085 — o `caminho` NÃO entra neste log, e é o único log da rota em
    // que ele não entra.
    //
    // Este aqui é log de SUCESSO: roda em 100% dos envios. O caminho é
    // `<uuid do dono>/documento-<epoch>.<ext>`, ou seja, o ponteiro pro
    // documento de identidade da pessoa, colado no uuid dela. O log da Vercel
    // está FORA do alcance da rotina de exportação e exclusão da F6 (R-024) e
    // é lido por um conjunto de pessoas maior e sem trilha que o de
    // `audit_logs`. Depois que alguém pedir exclusão, a linha sai do Postgres,
    // o objeto sai do bucket pela T-018, e o log continuaria dizendo que o
    // documento existiu.
    //
    // Nos logs de ERRO o caminho fica, e deve ficar: é o que a varredura de
    // órfãos precisa. O rastro do caminho feliz já existe no lugar certo, que
    // é a própria linha de `perfil_privado`.
    console.log("[documentos/upload] documento gravado", {
      userId: user.id,
      bytes: bytes.length,
      status: perfil.status,
    });

    // `documento_enviado_em` volta do banco, carimbado pelo trigger. O cliente
    // nunca o manda e nunca o calcula.
    return NextResponse.json({
      ok: true,
      enviadoEm: linha.documento_enviado_em,
      tamanho: bytes.length,
      tipo: tipo.mime,
    });
  } catch (e: unknown) {
    // R-037 — mensagem e mais nada na resposta; o resto vai para o log, sem
    // `details`, sem nome de arquivo, sem bytes.
    console.error("[documentos/upload] erro nao tratado", {
      message: e instanceof Error ? e.message : "desconhecido",
    });
    return recusa(
      500,
      "Não foi possível enviar o documento agora. Tente de novo em alguns instantes."
    );
  }
}
