import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { estadoDaPorta } from "@/lib/contato/porta";
import { conferirTurnstile } from "@/lib/contato/turnstile";
import type { PedidoDeContato, RespostaDoContato } from "@/lib/perfil-publico/contato";

// T-040 · POST /api/contato: A ÚNICA PORTA POR ONDE O NÚMERO SAI (DL-047, DL-071 D1).
//
// O clique em "Chamar no WhatsApp" do perfil público (T-041) chega aqui. A rota
// confere o pedido, cria o cookie do visitante no primeiro clique (D2) e chama
// UMA função do banco, `registrar_contato` (0006, T-039), que grava a linha em
// `contatos` e SÓ ENTÃO devolve o número, na mesma transação. Esta rota não lê
// `perfil_privado`, não escreve em `contatos` e não decide limite: tudo isso é
// do Postgres, onde não dá para pular.
//
// ⚠️ DEPENDE DA 0006. Até ela ser aplicada no banco do alvo a função não
// existe: a chamada falha e a resposta é `indisponivel` (503). Em produção a
// rota nem chega ao banco enquanto `CONTATO_PELO_SITE_ABERTO = false` (ver
// `lib/contato/porta.ts`): responde `indisponivel` sem criar cookie, sem ler
// sessão e sem gravar nada.
//
// A ordem é a regra, e cada recusa sai ANTES de qualquer efeito:
//   1. `Sec-Fetch-Site` tem de ser `same-origin` (a lição do R-057). Navegador
//      de verdade manda o cabeçalho sozinho num `fetch` do próprio site; outro
//      site, um `<form>` de fora ou um script sem cabeçalho são recusados.
//   2. Corpo JSON (`Content-Type: application/json`, o que obriga preflight de
//      CORS a quem vier de fora, e esta rota não responde CORS), até 4 KB.
//   3. Corpo validado contra listas fechadas: `tipo` só `vet`/`clinic`, `slug`
//      no formato do gerador (DL-067), `canal` só `whatsapp`. A origem da busca
//      que não tiver formato de slug vira nula (não recusa o contato: o banco
//      ainda confere a origem contra `cidades`/`especialidades`/`servicos`).
//   4. A porta está aberta neste servidor? Fechada: `indisponivel`, e acabou.
//   5. Turnstile, se ligado (D4, SEC-120 a). Hoje desligado: a chave não existe.
//   6. Cookie `vetria_visitante`: o que veio, se for um UUID nosso; senão, um
//      novo. O novo só é gravado no navegador se o contato deu certo
//      (minimização, D2: quem só olha, ou quem recebeu recusa, não ganha
//      identificador).
//   7. A sessão, se houver: o `user_id` vai junto (o limite e a deduplicação
//      contam por pessoa, e o histórico do responsável depende dele).
//   8. `registrar_contato`, pelo cliente de serviço (`lib/supabase/admin.ts`,
//      `server-only`). É o ÚNICO uso dele nesta rota. A resposta do banco é
//      conferida antes de sair: só passa o formato de `RespostaDoContato`.
//
// ⚠️ NADA DE NÚMERO, COOKIE OU CORPO EM LOG. Só o `code` do erro, como no resto
// do projeto. O número existe em dois lugares: no banco e no corpo desta
// resposta, para quem fez o pedido.
//
// O que NÃO é desta rota:
//   · limite por IP: é do firewall da Vercel (D3, 10/min, IPv6 por /64,
//     SEC-120 b). Limite em memória numa função serverless não limita nada.
//   · o limite por visitante e a deduplicação: são do banco (D3, D5).
//   · o freio global (SEC-120 c): seria migration nova, ainda não decidida.
//
// É rota (e não Server Action) de propósito: a regra do firewall precisa de
// um caminho fixo (card da T-040).

export const runtime = "nodejs";

const COOKIE_DO_VISITANTE = "vetria_visitante";
const VIDA_DO_COOKIE_SEGUNDOS = 60 * 60 * 24 * 180; // 180 dias (D2)
const CORPO_MAXIMO = 4_096;
const SLUG_MAXIMO = 120;

/** O mesmo formato que a 0006 confere (e que o gerador do DL-067 produz). */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
/** Só o UUID v4 minúsculo que `randomUUID()` gera. Qualquer outra coisa no
 *  cookie é descartada e trocada por um novo. */
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
/** O contrato de `lib/contato/whatsapp.ts`: DDD + número, sem o 55. */
const WHATSAPP = /^\d{10,11}$/;

const MOTIVOS = new Set(["nao_encontrado", "sem_whatsapp", "muitas_tentativas"]);

const STATUS_DO_MOTIVO: Record<string, number> = {
  nao_encontrado: 404,
  sem_whatsapp: 422,
  muitas_tentativas: 429,
};

function responder(resposta: RespostaDoContato, status: number): NextResponse {
  return NextResponse.json(resposta, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

const indisponivel = (status: number) => responder({ ok: false, motivo: "indisponivel" }, status);

type Validado =
  | { ok: true; pedido: PedidoDeContato; turnstile: unknown }
  | { ok: false; motivo: "nao_encontrado" | "indisponivel" };

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function slugValido(v: unknown): v is string {
  return typeof v === "string" && v.length <= SLUG_MAXIMO && SLUG.test(v);
}

/** Origem: ausente ou nula vira nula; texto fora do formato vira nula; outro
 *  tipo (número, objeto) é pedido malformado. */
function lerOrigem(v: unknown): { ok: true; valor: string | null } | { ok: false } {
  if (v === undefined || v === null) return { ok: true, valor: null };
  if (typeof v !== "string") return { ok: false };
  return { ok: true, valor: slugValido(v) ? v : null };
}

function validar(corpo: unknown): Validado {
  if (!ehObjeto(corpo) || !ehObjeto(corpo.alvo)) return { ok: false, motivo: "indisponivel" };
  if (corpo.canal !== "whatsapp") return { ok: false, motivo: "indisponivel" };

  const { tipo, slug } = corpo.alvo;
  if ((tipo !== "vet" && tipo !== "clinic") || !slugValido(slug)) {
    return { ok: false, motivo: "nao_encontrado" };
  }

  const origem = corpo.origem === undefined || corpo.origem === null ? {} : corpo.origem;
  if (!ehObjeto(origem)) return { ok: false, motivo: "indisponivel" };
  const cidade = lerOrigem(origem.cidade);
  const especialidade = lerOrigem(origem.especialidade);
  if (!cidade.ok || !especialidade.ok) return { ok: false, motivo: "indisponivel" };

  return {
    ok: true,
    pedido: {
      alvo: { tipo, slug },
      origem: { cidade: cidade.valor, especialidade: especialidade.valor },
      canal: "whatsapp",
    },
    turnstile: corpo.turnstile,
  };
}

/** A resposta do banco só passa se tiver exatamente o formato combinado. */
function conferirResposta(dado: unknown): RespostaDoContato | null {
  if (!ehObjeto(dado)) return null;
  if (dado.ok === true && typeof dado.whatsapp === "string" && WHATSAPP.test(dado.whatsapp)) {
    return { ok: true, whatsapp: dado.whatsapp };
  }
  if (dado.ok === false && typeof dado.motivo === "string" && MOTIVOS.has(dado.motivo)) {
    return { ok: false, motivo: dado.motivo as "nao_encontrado" | "sem_whatsapp" | "muitas_tentativas" };
  }
  return null;
}

export async function POST(req: NextRequest) {
  // 1) só do próprio site
  if (req.headers.get("sec-fetch-site") !== "same-origin") {
    return indisponivel(403);
  }

  // 2) só JSON, e pequeno
  const tipoDoCorpo = req.headers.get("content-type") ?? "";
  if (!tipoDoCorpo.toLowerCase().startsWith("application/json")) {
    return indisponivel(415);
  }
  const declarado = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(declarado) && declarado > CORPO_MAXIMO) {
    return indisponivel(413);
  }
  const texto = await req.text().catch(() => null);
  if (texto === null || texto.length > CORPO_MAXIMO) {
    return indisponivel(413);
  }
  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return indisponivel(400);
  }

  // 3) listas fechadas
  const validado = validar(corpo);
  if (!validado.ok) {
    return responder({ ok: false, motivo: validado.motivo }, 400);
  }
  const { pedido } = validado;

  // 4) a porta (produção fechada enquanto CONTATO_PELO_SITE_ABERTO = false)
  const porta = estadoDaPorta();
  if (!porta.aberta) {
    return indisponivel(503);
  }

  // 5) Turnstile (SEC-120 a), quando ligado
  if (porta.exigeTurnstile) {
    const captcha = await conferirTurnstile(validado.turnstile);
    if (captcha === "recusado") {
      return responder({ ok: false, motivo: "verificacao_recusada" }, 403);
    }
    if (captcha !== "ok") {
      return indisponivel(503);
    }
  }

  // 6) o visitante
  const doNavegador = req.cookies.get(COOKIE_DO_VISITANTE)?.value;
  const visitanteConhecido = typeof doNavegador === "string" && UUID_V4.test(doNavegador);
  const anonId = visitanteConhecido ? doNavegador : randomUUID();

  // 7) a sessão, se houver. Sessão inválida ou vencida é visitante anônimo.
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  // 8) o banco: grava e só então devolve o número
  const { data, error } = await createAdminClient().rpc("registrar_contato", {
    p_tipo: pedido.alvo.tipo,
    p_slug: pedido.alvo.slug,
    p_user_id: userId,
    p_anon_id: anonId,
    p_origem_cidade: pedido.origem.cidade,
    p_origem_especialidade: pedido.origem.especialidade,
  });

  if (error) {
    // PGRST202 aqui quer dizer "a 0006 não está neste banco".
    console.error("[api/contato] registrar_contato falhou", { code: error.code });
    return indisponivel(503);
  }

  const resposta = conferirResposta(data);
  if (!resposta) {
    console.error("[api/contato] resposta do banco fora do formato combinado");
    return indisponivel(503);
  }

  if (!resposta.ok) {
    return responder(resposta, STATUS_DO_MOTIVO[resposta.motivo] ?? 503);
  }

  const res = responder(resposta, 200);
  if (!visitanteConhecido) {
    res.cookies.set({
      name: COOKIE_DO_VISITANTE,
      value: anonId,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: VIDA_DO_COOKIE_SEGUNDOS,
    });
  }
  return res;
}
