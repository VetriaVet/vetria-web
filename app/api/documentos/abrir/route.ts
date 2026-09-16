import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// T-008 — A ROTA DE LEITURA DO DOCUMENTO. Cinco passos, da seção 2.b da
// `0003`, na mesma pasta da rota de escrita.
//
// ⚠️ O DONO NÃO LÊ MAIS O PRÓPRIO DOCUMENTO DIRETO DO STORAGE. O bucket tem
// ZERO policy (DL-054): `supabase.storage.from('documentos')` chamado do
// navegador devolve vazio ou erro, sempre, inclusive para o dono. A matriz
// (§3, "Documento no Storage": só o dono e admin/master, por URL assinada de
// vida curta) não mudou; mudou ONDE a regra é aplicada, do Postgres para cá.
//
// ⚠️ NENHUMA URL PÚBLICA, EM LUGAR NENHUM. `getPublicUrl` não aparece neste
// repositório e não pode aparecer: o bucket é privado e a única forma de
// leitura é a URL assinada emitida aqui, com validade curta.
//
// ⚠️ SEC-079 — esta rota também está fora do `matcher` do `middleware.ts`.
// Ela reconfere sessão e autorização por conta própria.
//
// É POST, não GET, e isso é decisão: URL assinada em barra de endereço vira
// histórico do navegador, referer e log de proxy. Aqui ela só existe no corpo
// de uma resposta, por 60 segundos.
//
// Esta rota NÃO é a tela de validação do admin (isso é S4). É o que aquela
// tela vai chamar, e é o que o dono usa para conferir o que enviou.

export const runtime = "nodejs";

const BUCKET = "documentos";

// Vida curta de verdade. O tempo é só o do clique: quem abre, abre agora.
const VALIDADE_SEGUNDOS = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function recusa(status: number, mensagem: string) {
  return NextResponse.json({ erro: mensagem }, { status });
}

export async function POST(req: Request) {
  try {
    // -----------------------------------------------------------------------
    // 1. SESSÃO
    // -----------------------------------------------------------------------
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      return recusa(401, "Sua sessão expirou. Entre de novo.");
    }

    const corpo = (await req.json().catch(() => ({}))) as { dono?: unknown };
    const donoPedido =
      typeof corpo.dono === "string" && UUID.test(corpo.dono) ? corpo.dono : null;

    if (corpo.dono !== undefined && !donoPedido) {
      return recusa(400, "Pedido inválido.");
    }

    // ⚠️ PASSO 3 — O CAMINHO NUNCA VEM DO CLIENTE. O corpo aceita, no máximo,
    // o uuid do DONO, e o caminho é lido da tabela logo abaixo. Aceitar
    // caminho seria o "deputado confuso" da SEC-003 com outro nome: bastaria
    // apontar para o prefixo de outra pessoa.
    const dono = donoPedido ?? user.id;

    // -----------------------------------------------------------------------
    // 2. A AUTORIZAÇÃO INTEIRA — é este bloco, e é só ele
    // -----------------------------------------------------------------------
    // Ou o requisitante é o DONO da linha, ou ele é admin. Mais ninguém.
    const { data: quemPede, error: erroQuemPede } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single<{ role: string; status: string }>();

    if (erroQuemPede || !quemPede) {
      console.error("[documentos/abrir] perfil do requisitante nao encontrado", {
        message: erroQuemPede?.message ?? "sem linha",
        code: erroQuemPede?.code,
      });
      return recusa(403, "Não foi possível confirmar seu cadastro. Saia e entre de novo.");
    }

    const ehAdmin = quemPede.role === "admin";
    const ehProprio = dono === user.id;

    if (!ehProprio && !ehAdmin) {
      console.warn("[documentos/abrir] leitura de terceiro recusada", {
        requisitante: user.id,
        alvo: dono,
        role: quemPede.role,
      });
      return recusa(403, "Você não tem acesso a esse documento.");
    }

    if (ehProprio && quemPede.role !== "vet" && quemPede.role !== "clinic") {
      // Responsável não tem documento de validação (SEC-032).
      return recusa(403, "Esta conta não tem documento de validação.");
    }

    // ⚠️ SEC-087 — o portão de status, que faltava aqui e existe no `upload`.
    //
    // A rota irmã (`/api/documentos/upload`) já aplicava `PODEM_ENVIAR`, e esta
    // lia só `role`. O efeito: uma conta `suspended`, que o `middleware.ts` só
    // deixa em `/bloqueado`, abria a própria URL assinada pelo console daquela
    // página. A matriz §4 diz que `suspended` alcança a tela de bloqueio **e
    // todo o resto é bloqueado**.
    //
    // O dado em si é da própria pessoa e ela já o tinha, então o custo imediato
    // é baixo. O que não podia ficar era a assimetria: duas rotas irmãs com
    // portões diferentes é o convite para a terceira errar.
    //
    // Lista de PERMITIDOS (SEC-052 / SEC-054), nunca de negados: valor novo no
    // enum nasce barrado. E o portão vale só para o DONO — `admin` não tem
    // status de profissional, e a matriz §5 dá "ver documento enviado" a admin
    // e master independentemente disso.
    const PODEM_ABRIR_O_PROPRIO = ["incomplete", "pending_validation", "active"];

    if (ehProprio && !PODEM_ABRIR_O_PROPRIO.includes(quemPede.status)) {
      console.warn("[documentos/abrir] leitura recusada por status", {
        userId: user.id,
        status: quemPede.status,
      });
      return recusa(
        403,
        "Esta conta está suspensa. Fale com a gente pelo contato@vetriabrasil.com.br."
      );
    }

    // O caminho sai da TABELA, lido sob RLS pela sessão de quem pede:
    // `perfil_privado_select_own` para o dono, `perfil_privado_select_admin`
    // para o admin. A checagem acima é a autorização; a RLS é a segunda porta.
    const { data: linha, error: erroLinha } = await supabase
      .from("perfil_privado")
      .select("documento_path, documento_enviado_em")
      .eq("id", dono)
      .maybeSingle<{
        documento_path: string | null;
        documento_enviado_em: string | null;
      }>();

    if (erroLinha) {
      console.error("[documentos/abrir] leitura da linha falhou", {
        message: erroLinha.message,
        code: erroLinha.code,
      });
      return recusa(502, "Não foi possível abrir o documento agora. Tente de novo em alguns instantes.");
    }

    if (!linha?.documento_path) {
      return recusa(404, "Não há documento enviado para esta conta.");
    }

    const caminho = linha.documento_path;

    // -----------------------------------------------------------------------
    // 4. A TRILHA, ANTES DA URL (SEC-040)
    // -----------------------------------------------------------------------
    // ⚠️ SAI POR `service_role`, e é obrigatório que saia: a `0002` §11b fez
    // `revoke insert, update, delete on public.audit_logs from authenticated`.
    // Gravar com a sessão do admin devolveria `permission denied for table
    // audit_logs` e a trilha sumiria junto com o erro.
    //
    // ⚠️ `actor_id` vai EXPLÍCITO porque com `service_role` o `auth.uid()` é
    // nulo. Sem esta linha, a trilha diria que alguém abriu e não diria quem.
    // Não confundir com o passo 8 da rota de escrita, que é o contrário: lá a
    // linha é gravada com a SESSÃO do usuário, nunca com `service_role`.
    //
    // ANTES, não depois: se a emissão falhar no meio, o que interessa saber é
    // que alguém pediu. "Quem abriu o documento do fulano em março?" é a
    // primeira pergunta de qualquer incidente com documento de identidade.
    const serviceRole = createAdminClient();
    const { error: erroTrilha } = await serviceRole.from("audit_logs").insert({
      actor_id: user.id,
      acao: "documento_visualizado",
      alvo_tipo: "perfil_privado",
      alvo_id: dono,
      detalhe: {
        caminho,
        validade_segundos: VALIDADE_SEGUNDOS,
        proprio: ehProprio,
      },
    });

    if (erroTrilha) {
      // Sem trilha, sem URL. O acesso mais sensível do sistema não acontece
      // fora da trilha: é o ponto inteiro da SEC-040.
      console.error("[documentos/abrir] trilha nao gravada, url nao emitida", {
        message: erroTrilha.message,
        code: erroTrilha.code,
      });
      return recusa(502, "Não foi possível abrir o documento agora. Tente de novo em alguns instantes.");
    }

    // -----------------------------------------------------------------------
    // 5. A URL ASSINADA, DE VIDA CURTA
    // -----------------------------------------------------------------------
    const { data: assinada, error: erroUrl } = await serviceRole.storage
      .from(BUCKET)
      .createSignedUrl(caminho, VALIDADE_SEGUNDOS);

    if (erroUrl || !assinada?.signedUrl) {
      // ⚠️ SEC-033, segundo efeito: 404 MUDO NÃO SERVE numa tela cujo trabalho
      // inteiro é abrir este arquivo. A linha aponta para um objeto que não
      // está no bucket, e isso é exatamente o órfão ao contrário: pode ser o
      // processo que morreu entre os passos 7 e 8 de um envio anterior, ou
      // remoção manual. A varredura do card da T-008 é quem responde.
      console.error("[documentos/abrir] objeto nao encontrado no armazenamento", {
        caminho,
        message: erroUrl?.message ?? "sem url",
      });
      return NextResponse.json(
        {
          erro: "Documento não encontrado no armazenamento.",
          caminho,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      url: assinada.signedUrl,
      validadeSegundos: VALIDADE_SEGUNDOS,
      enviadoEm: linha.documento_enviado_em,
    });
  } catch (e: unknown) {
    console.error("[documentos/abrir] erro nao tratado", {
      message: e instanceof Error ? e.message : "desconhecido",
    });
    return recusa(500, "Não foi possível abrir o documento agora. Tente de novo em alguns instantes.");
  }
}
