import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import AdminEmptyScreen from "../AdminEmptyScreen";
import {
  PERSONA_LABEL,
  POR_PAGINA,
  carregarFila,
  formatarDataHora,
  type ItemDaFila,
} from "./fila";

export const metadata = { title: "Validações" };

// T-023 — A FILA REAL. Esta tela era casca desde a fase visual: renderizava um
// `AdminEmptyScreen` fixo, com um TODO no lugar da consulta, e dizia "nenhuma
// validação pendente" mesmo com gente esperando no banco.
//
// ⚠️ A AUTORIZAÇÃO É DO SERVIDOR E VEM ANTES DE TUDO (`requireAdmin`), e a
// LEITURA é da sessão do admin, sob RLS. Nenhum `service_role` nesta página:
// se um dia a policy `profiles_select_admin` for removida, esta tela fica
// vazia em vez de continuar entregando dado que o banco não autoriza mais.
// Autorização que depende de a aplicação lembrar de filtrar é autorização que
// um `if` esquecido derruba.
//
// ⚠️ Admin comum e master veem a MESMA fila (matriz §5: "Ver fila de
// validação: ✅ / ✅"). O que os separa é `/admin/usuarios`, e isso é o R-054,
// consertado nesta mesma task.
//
// ⚠️ ESTA TELA NÃO APROVA E NÃO REPROVA: quem decide é o detalhe
// (`[conta]/DecisaoForm.tsx` → `[conta]/actions.ts`, T-024), uma conta por
// vez, com o cadastro inteiro na frente. Aqui só aparece o RESULTADO da
// decisão que acabou de ser tomada, lido de `?decisao=` e `?email=`, dois
// parâmetros de lista fechada: valor fora da lista não vira texto na tela.

type Props = {
  searchParams: Promise<{ [chave: string]: string | string[] | undefined }>;
};

type ResultadoDaDecisao = {
  decisao: "aprovado" | "reprovado";
  email: "enviado" | "falhou" | "desligado";
};

function lerResultado(params: {
  [chave: string]: string | string[] | undefined;
}): ResultadoDaDecisao | null {
  const um = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const decisao = um(params.decisao);
  const email = um(params.email);
  if (decisao !== "aprovado" && decisao !== "reprovado") return null;
  if (email !== "enviado" && email !== "falhou" && email !== "desligado") return null;
  return { decisao, email };
}

/** O que a tela diz depois da decisão. A frase sobre o email é a verdade do
 *  que aconteceu com ele, inclusive quando não saiu: a decisão vale do mesmo
 *  jeito, e o admin precisa saber que a pessoa não foi avisada. */
function AvisoDaDecisao({ resultado }: { resultado: ResultadoDaDecisao | null }) {
  if (!resultado) return null;

  const principal =
    resultado.decisao === "aprovado"
      ? "Conta aprovada. Ela já entra no painel completo."
      : "Cadastro devolvido com o motivo. A pessoa vê o motivo quando entrar na conta e pode corrigir e concluir de novo.";

  const sobreEmail =
    resultado.email === "enviado"
      ? "O email foi enviado."
      : resultado.email === "desligado"
        ? "O email NÃO foi enviado: o envio está desligado neste ambiente, porque falta a chave do Resend. Avise a pessoa por outro canal."
        : "O email NÃO foi enviado por uma falha no envio. A decisão continua valendo. Avise a pessoa por outro canal.";

  const cor =
    resultado.email === "enviado"
      ? "border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-100"
      : "border-amber-300/30 bg-amber-300/[0.08] text-amber-100";

  return (
    <div role="status" className={`rounded-md border p-4 text-[13px] ${cor}`}>
      {principal} {sobreEmail}
    </div>
  );
}

function lerPagina(valor: string | string[] | undefined): number {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  const numero = Number.parseInt(bruto ?? "1", 10);
  if (!Number.isFinite(numero) || numero < 1) return 1;
  // Teto: `?pagina=999999999` viraria um `range()` absurdo no Postgres.
  return Math.min(numero, 10_000);
}

export default async function AdminValidacoesPage({ searchParams }: Props) {
  await requireAdmin();

  const params = await searchParams;
  const pagina = lerPagina(params.pagina);
  const resultado = lerResultado(params);

  const { itens, total, erro } = await carregarFila(pagina);
  const totalDePaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  if (erro) {
    return (
      <div>
        <Cabecalho total={null} />
        <div className="p-6 max-w-[1280px] mx-auto">
          <div className="rounded-md border border-red-500/30 bg-red-500/[0.08] p-5 text-[13px] text-red-200">
            {erro}
          </div>
        </div>
      </div>
    );
  }

  // Estado vazio honesto: a fila está vazia de verdade, e a tela diz isso sem
  // inventar linha nenhuma (nada de "Dra. Maria Silva").
  if (total === 0) {
    return (
      <AdminEmptyScreen
        title="Validações"
        heading="Ninguém esperando validação"
        desc="Quando um veterinário ou um estabelecimento concluir o cadastro, a conta entra nesta fila com os dados e o documento enviados."
        aviso={<AvisoDaDecisao resultado={resultado} />}
      />
    );
  }

  // Página fora do intervalo (alguém digitou `?pagina=90`): a fila tem gente,
  // mas esta página não. Diz isso, e oferece a volta.
  if (itens.length === 0) {
    return (
      <div>
        <Cabecalho total={total} />
        <div className="p-6 max-w-[1280px] mx-auto">
          <div className="rounded-md border border-white/[0.06] bg-[#1A2A2D] p-6 text-[13px] text-white/70">
            Esta página não tem ninguém. A fila tem {total}{" "}
            {total === 1 ? "conta" : "contas"}.{" "}
            <Link
              href="/admin/validacoes"
              className="text-white underline underline-offset-2"
            >
              Voltar para a primeira página
            </Link>
            .
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Cabecalho total={total} />

      <div className="p-6 max-w-[1280px] mx-auto flex flex-col gap-4">
        <AvisoDaDecisao resultado={resultado} />
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {itens.map((item) => (
            <li key={item.id}>
              <LinhaDaFila item={item} />
            </li>
          ))}
        </ul>

        <Paginacao pagina={pagina} totalDePaginas={totalDePaginas} total={total} />
      </div>
    </div>
  );
}

function Cabecalho({ total }: { total: number | null }) {
  return (
    <header className="bg-[#0F1F22]/90 backdrop-blur border-b border-white/[0.06] px-6 py-4 sticky top-0 z-10 flex items-center justify-between gap-4">
      <h1 className="font-bold text-lg text-white">Validações</h1>
      {total !== null && (
        <span className="text-[12px] text-white/50">
          {total === 1 ? "1 conta esperando" : `${total} contas esperando`}
        </span>
      )}
    </header>
  );
}

function LinhaDaFila({ item }: { item: ItemDaFila }) {
  const atualizadoEm = formatarDataHora(item.atualizadoEm);
  const documentoEm = formatarDataHora(item.documentoEnviadoEm);

  return (
    <Link
      href={`/admin/validacoes/${item.id}`}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-white/[0.06] bg-[#1A2A2D] p-4 hover:border-white/20 transition no-underline"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50 border border-white/15 rounded-pill px-2 py-0.5 shrink-0">
        {PERSONA_LABEL[item.role]}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-bold text-[14px] text-white truncate">
          {item.nome ?? "Cadastro sem nome preenchido"}
        </span>
        <span className="block text-[12px] text-white/50 truncate">
          {[item.registro, item.local].filter(Boolean).join(" · ") ||
            "Sem dados de identificação preenchidos"}
        </span>
      </span>

      {/* ⚠️ "Sem documento" é estado de primeira classe (SEC-088): dá para
          concluir o onboarding sem enviar arquivo, e o admin precisa ver isso
          na lista, não descobrir no detalhe. */}
      {documentoEm ? (
        <span className="text-[11px] text-white/50 shrink-0">
          Documento em {documentoEm}
        </span>
      ) : (
        <span className="text-[11px] font-semibold text-amber-300/90 border border-amber-300/30 bg-amber-300/[0.08] rounded-pill px-2 py-0.5 shrink-0">
          Sem documento
        </span>
      )}

      <span className="text-[11px] text-white/40 shrink-0 w-[132px] text-right">
        {atualizadoEm ? `Atualizado ${atualizadoEm}` : "Sem data"}
      </span>
    </Link>
  );
}

function Paginacao({
  pagina,
  totalDePaginas,
  total,
}: {
  pagina: number;
  totalDePaginas: number;
  total: number;
}) {
  const temAnterior = pagina > 1;
  const temProxima = pagina < totalDePaginas;

  return (
    <div className="flex items-center justify-between gap-4 text-[12px] text-white/50">
      <span>
        Página {Math.min(pagina, totalDePaginas)} de {totalDePaginas} ·{" "}
        {total === 1 ? "1 conta na fila" : `${total} contas na fila`} · horário de
        Brasília
      </span>

      <span className="flex items-center gap-2">
        {temAnterior ? (
          <Link
            href={`/admin/validacoes?pagina=${pagina - 1}`}
            className="rounded-pill border border-white/15 px-3 py-1.5 text-white/70 hover:bg-white/[0.06] transition no-underline"
          >
            Anterior
          </Link>
        ) : null}
        {temProxima ? (
          <Link
            href={`/admin/validacoes?pagina=${pagina + 1}`}
            className="rounded-pill border border-white/15 px-3 py-1.5 text-white/70 hover:bg-white/[0.06] transition no-underline"
          >
            Próxima
          </Link>
        ) : null}
      </span>
    </div>
  );
}
