import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  RotateCw,
  SearchX,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { ATENDIMENTO } from "@/components/publico/atendimento";
import { FormularioDeBusca, temFiltro } from "@/components/publico/FormularioDeBusca";
import {
  CartaoDeProfissional,
  CartaoFantasma,
} from "@/components/publico/CartaoDeProfissional";
import {
  CascaPublica,
  classeDoLinkPrincipal,
  classeDoLinkSecundario,
} from "@/components/publico/CascaPublica";
import { buscarProfissionais } from "@/lib/busca/buscar";
import { carregarOpcoesDaBusca, sugerirCidades } from "@/lib/busca/opcoes";
import { lerPedidoDeBusca, urlDaBusca } from "@/lib/busca/pedido";
import {
  PAGINA_MAXIMA,
  POR_PAGINA,
  type Aviso,
  type CidadeResolvida,
  type FiltrosAplicados,
  type PedidoDeBusca,
} from "@/lib/busca/tipos";
import { robotsDaBusca } from "@/lib/publico/indexacao";
import { chaveDeNome } from "@/lib/publico/normalizar";

// /buscar (F4/S6, E4). Rota pública, fora do `matcher` do middleware e fora
// de /app (DL-043, DL-044).
//
// Nada aqui decide QUEM aparece: isso é a policy `*_select_publico` no
// Postgres (lib/busca/buscar.ts). Esta página só desenha o que voltou, e
// desenha também tudo o que pode dar errado: busca que ainda não abriu (antes
// da 0005), erro do banco, filtro que não bate com nada, página que não
// existe. Nenhum desses estados inventa profissional.
//
// O formulário é GET puro e monta a URL do contrato (`lib/busca/pedido.ts`):
// funciona sem JavaScript, e o link da busca pode ser mandado por WhatsApp.

// Sem cache de HTML, nunca: um perfil suspenso não pode continuar na lista
// por uma página guardada. Hoje isso já vale pelo `connection()` da camada de
// dados, mas lá ele roda dentro de try/catch; aqui fica explícito.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buscar veterinários e estabelecimentos",
  description:
    "Encontre veterinários e estabelecimentos veterinários por cidade, especialidade e forma de atendimento.",
  robots: robotsDaBusca(),
};

const LIMITE_DE_RESULTADOS = PAGINA_MAXIMA * POR_PAGINA;

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function BuscarPage({ searchParams }: Props) {
  const pedido = lerPedidoDeBusca(await searchParams);
  const [opcoes, resultado] = await Promise.all([
    carregarOpcoesDaBusca(),
    buscarProfissionais(pedido),
  ]);

  // 1. A busca ainda não abriu (a 0005 não está no banco, ou falta config).
  if (opcoes.estado === "indisponivel" || resultado.estado === "indisponivel") {
    return (
      <CascaPublica>
        <BuscaEmBreve />
      </CascaPublica>
    );
  }

  // 2. Sem as listas não dá para desenhar os filtros: erro de página inteira.
  if (opcoes.estado !== "ok") {
    return (
      <CascaPublica>
        <Topo>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-titulo sm:text-[34px]">
            Buscar veterinários e estabelecimentos
          </h1>
        </Topo>
        <Conteudo>
          <ErroDaBusca tentarDeNovo={urlDaBusca(pedido)} />
        </Conteudo>
      </CascaPublica>
    );
  }

  const filtros = resultado.estado === "ok" ? resultado.filtros : null;

  // Cidade com o mesmo nome em mais de um estado: as opções, para um clique.
  const candidatas =
    resultado.estado === "ok" && resultado.avisos.includes("cidade_ambigua") && pedido.cidade
      ? await cidadesComEsteNome(pedido.cidade)
      : [];

  return (
    <CascaPublica>
      <Topo>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-titulo sm:text-[34px]">
          Encontre veterinários e{" "}
          <span className="text-principal">estabelecimentos veterinários</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-corpo-texto">
          Busque por nome, especialidade ou serviço, e filtre pela cidade onde o seu animal
          precisa de atendimento.
        </p>

        <FormularioDeBusca
          pedido={pedido}
          filtros={filtros}
          especialidades={opcoes.especialidades}
          servicos={opcoes.servicos}
        />
      </Topo>

      <Conteudo>
        {resultado.estado !== "ok" ? (
          <ErroDaBusca tentarDeNovo={urlDaBusca(pedido)} />
        ) : resultado.avisos.length > 0 ? (
          <Avisos pedido={pedido} avisos={resultado.avisos} candidatas={candidatas} />
        ) : resultado.total === 0 ? (
          temFiltro(pedido) ? (
            <NenhumResultado pedido={pedido} filtros={resultado.filtros} />
          ) : (
            <BuscaAindaVazia />
          )
        ) : resultado.itens.length === 0 ? (
          <PaginaInexistente
            pedido={pedido}
            total={resultado.total}
            totalDePaginas={resultado.totalDePaginas}
          />
        ) : (
          <section aria-labelledby="titulo-resultados">
            <Resumo pedido={pedido} filtros={resultado.filtros} total={resultado.total} />

            <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {resultado.itens.map((c) => (
                <li key={`${c.tipo}-${c.slug}`}>
                  <CartaoDeProfissional cartao={c} />
                </li>
              ))}
            </ul>

            {resultado.total > LIMITE_DE_RESULTADOS && (
              <p className="mt-6 flex items-start gap-2 rounded-2xl bg-fundo-destaque px-4 py-3 text-[14px] text-principal">
                <SlidersHorizontal size={17} className="mt-0.5 shrink-0" aria-hidden />
                <span>
                  A lista mostra os primeiros {LIMITE_DE_RESULTADOS} resultados. Para chegar a quem
                  você procura, escolha a cidade ou uma especialidade.
                </span>
              </p>
            )}

            <Paginacao
              pedido={pedido}
              pagina={resultado.pagina}
              totalDePaginas={resultado.totalDePaginas}
            />
          </section>
        )}
      </Conteudo>
    </CascaPublica>
  );
}

/* ------------------------------------------------------------------ */
/* Moldura                                                            */
/* ------------------------------------------------------------------ */

function Topo({ children }: { children: ReactNode }) {
  return (
    <section className="border-b border-neutro-border bg-fundo-claro">
      <div className="mx-auto max-w-6xl px-5 pb-8 pt-8 sm:pb-10 sm:pt-12">{children}</div>
    </section>
  );
}

function Conteudo({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Resultados                                                         */
/* ------------------------------------------------------------------ */

function Resumo({
  pedido,
  filtros,
  total,
}: {
  pedido: PedidoDeBusca;
  filtros: FiltrosAplicados;
  total: number;
}) {
  const onde = filtros.cidade
    ? `em ${filtros.cidade.nome}, ${filtros.cidade.uf}`
    : filtros.uf
      ? `em ${filtros.uf}`
      : null;
  const quem =
    filtros.incluiVeterinarios && filtros.incluiEstabelecimentos
      ? null
      : filtros.incluiVeterinarios
        ? "veterinários"
        : "estabelecimentos";

  // Quando um filtro tirou um dos lados da lista sem a pessoa ter pedido
  // (escolheu especialidade, e estabelecimento não tem especialidade), diz.
  const motivoDoRecorte =
    quem === "veterinários" && pedido.tipo !== "veterinario"
      ? "Mostrando só veterinários, porque especialidade e forma de atendimento valem só para eles."
      : quem === "estabelecimentos" && pedido.tipo !== "estabelecimento"
        ? "Mostrando só estabelecimentos, porque serviço vale só para eles."
        : null;

  return (
    <div>
      <h2 id="titulo-resultados" className="text-[20px] font-bold text-titulo">
        {total === 1 ? "1 resultado" : `${total.toLocaleString("pt-BR")} resultados`}
        {quem && <span className="font-medium text-corpo-texto"> · só {quem}</span>}
        {onde && <span className="font-medium text-corpo-texto"> {onde}</span>}
      </h2>
      {(filtros.termo || filtros.especialidade || filtros.servico || filtros.atendimento) && (
        <ul aria-label="Filtros aplicados" className="mt-2.5 flex flex-wrap gap-1.5">
          {filtros.termo && <Etiqueta>&ldquo;{filtros.termo}&rdquo;</Etiqueta>}
          {filtros.especialidade && <Etiqueta>{filtros.especialidade.nome}</Etiqueta>}
          {filtros.servico && <Etiqueta>{filtros.servico.nome}</Etiqueta>}
          {filtros.atendimento && <Etiqueta>{ATENDIMENTO[filtros.atendimento].rotulo}</Etiqueta>}
        </ul>
      )}
      {motivoDoRecorte && (
        <p className="mt-2.5 text-[13px] text-corpo-texto">{motivoDoRecorte}</p>
      )}
    </div>
  );
}

function Etiqueta({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-pill border border-neutro-border bg-white px-3 py-1 text-[12px] font-medium text-titulo">
      {children}
    </li>
  );
}

function Paginacao({
  pedido,
  pagina,
  totalDePaginas,
}: {
  pedido: PedidoDeBusca;
  pagina: number;
  totalDePaginas: number;
}) {
  if (totalDePaginas <= 1) return null;
  const anterior = pagina > 1 ? urlDaBusca(pedido, { pagina: pagina - 1 }) : null;
  const proxima = pagina < totalDePaginas ? urlDaBusca(pedido, { pagina: pagina + 1 }) : null;

  return (
    <nav aria-label="Páginas de resultados" className="mt-8 flex items-center justify-between gap-3">
      {anterior ? (
        <Link href={anterior} className={classeDoLinkSecundario} rel="prev">
          <ArrowLeft size={15} aria-hidden />
          Anterior
        </Link>
      ) : (
        <span aria-hidden className="w-[108px]" />
      )}
      <p className="text-[13px] text-corpo-texto">
        Página <strong className="font-semibold text-titulo">{pagina}</strong> de {totalDePaginas}
      </p>
      {proxima ? (
        <Link href={proxima} className={classeDoLinkSecundario} rel="next">
          Próxima
          <ArrowRight size={15} aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className="w-[108px]" />
      )}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Estados                                                            */
/* ------------------------------------------------------------------ */

/** Antes da 0005: a estrutura da busca, esmaecida, e o aviso honesto. */
function BuscaEmBreve() {
  return (
    <>
      <Topo>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 text-[12px] font-medium text-principal shadow-sm">
          <Sparkles size={14} aria-hidden />
          Em preparação
        </span>
        <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-tight text-titulo sm:text-[34px]">
          A busca abre em breve
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-corpo-texto">
          Estamos preparando a lista de veterinários e estabelecimentos veterinários. Quando ela
          abrir, é aqui que você vai buscar por cidade, especialidade e forma de atendimento.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className={classeDoLinkPrincipal}>
            Voltar ao início
          </Link>
        </div>
      </Topo>
      <Conteudo>
        <div
          aria-hidden
          className="grid gap-4 [mask-image:linear-gradient(to_bottom,black,transparent)] md:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <CartaoFantasma key={i} />
          ))}
        </div>
        <p className="mt-2 text-center text-[13px] text-corpo-texto">
          Veterinário ou estabelecimento?{" "}
          <Link href="/cadastro" className="font-semibold text-principal underline-offset-4 hover:underline">
            Crie o seu perfil
          </Link>{" "}
          para aparecer aqui quando a busca abrir.
        </p>
      </Conteudo>
    </>
  );
}

function ErroDaBusca({ tentarDeNovo }: { tentarDeNovo: string }) {
  return (
    <div
      role="alert"
      className="mx-auto max-w-xl rounded-2xl border border-error/30 bg-white p-6 text-center"
    >
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error-soft text-error">
        <CircleAlert size={22} aria-hidden />
      </span>
      <h2 className="text-[18px] font-bold text-titulo">Não conseguimos buscar agora</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-[14px] leading-relaxed text-corpo-texto">
        A falha foi do nosso lado, não da sua busca. Tente de novo em alguns instantes.
      </p>
      <Link href={tentarDeNovo} className={`${classeDoLinkPrincipal} mt-5`}>
        <RotateCw size={16} aria-hidden />
        Tentar de novo
      </Link>
    </div>
  );
}

/** A busca rodou sem filtro e voltou vazia: ninguém validado ainda. */
function BuscaAindaVazia() {
  return (
    <div className="rounded-2xl border border-dashed border-neutro-border bg-white/60 p-6">
      <div
        aria-hidden
        className="mb-6 grid gap-4 [mask-image:linear-gradient(to_bottom,black,transparent)] md:grid-cols-3"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <CartaoFantasma key={i} />
        ))}
      </div>
      <div className="text-center">
        <h2 className="text-[18px] font-bold text-titulo">Os primeiros perfis estão chegando</h2>
        <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-relaxed text-corpo-texto">
          Veterinários e estabelecimentos aparecem aqui assim que a equipe Vetria confere os
          documentos de cada um.
        </p>
      </div>
    </div>
  );
}

function NenhumResultado({
  pedido,
  filtros,
}: {
  pedido: PedidoDeBusca;
  filtros: FiltrosAplicados;
}) {
  // Uma saída por filtro ativo: tirar só aquele, mantendo o resto.
  const saidas: { rotulo: string; href: string }[] = [];
  const base = { pagina: 1 };
  if (filtros.termo) saidas.push({ rotulo: `Sem "${filtros.termo}"`, href: urlDaBusca(pedido, { ...base, termo: null }) });
  if (filtros.cidade)
    saidas.push({
      rotulo: `Em todo o estado (${filtros.cidade.uf})`,
      href: urlDaBusca(pedido, { ...base, cidade: null, uf: filtros.cidade.uf }),
    });
  if (pedido.cidade || pedido.uf)
    saidas.push({ rotulo: "Em todo o Brasil", href: urlDaBusca(pedido, { ...base, cidade: null, uf: null }) });
  if (filtros.especialidade)
    saidas.push({ rotulo: `Sem ${filtros.especialidade.nome}`, href: urlDaBusca(pedido, { ...base, especialidade: null }) });
  if (filtros.servico)
    saidas.push({ rotulo: `Sem ${filtros.servico.nome}`, href: urlDaBusca(pedido, { ...base, servico: null }) });
  if (filtros.atendimento)
    saidas.push({
      rotulo: "Qualquer forma de atendimento",
      href: urlDaBusca(pedido, { ...base, atendimento: null }),
    });
  if (pedido.tipo)
    saidas.push({ rotulo: "Veterinários e estabelecimentos", href: urlDaBusca(pedido, { ...base, tipo: null }) });

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-neutro-border bg-white p-6 text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-fundo-claro text-corpo-texto">
        <SearchX size={22} aria-hidden />
      </span>
      <h2 className="text-[18px] font-bold text-titulo">Nenhum resultado com esses filtros</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-[14px] leading-relaxed text-corpo-texto">
        A Vetria ainda está crescendo e pode não ter alguém exatamente assim. Tente ampliar a
        busca:
      </p>
      {saidas.length > 0 && (
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {saidas.map((s) => (
            <li key={s.href}>
              <Link href={s.href} className={classeDoLinkSecundario}>
                {s.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PaginaInexistente({
  pedido,
  total,
  totalDePaginas,
}: {
  pedido: PedidoDeBusca;
  total: number;
  totalDePaginas: number;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-neutro-border bg-white p-6 text-center">
      <h2 className="text-[18px] font-bold text-titulo">Esta página da busca não existe</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-[14px] leading-relaxed text-corpo-texto">
        {total === 1 ? "A busca tem 1 resultado" : `A busca tem ${total.toLocaleString("pt-BR")} resultados`}
        {totalDePaginas > 1 ? `, em ${totalDePaginas} páginas.` : ", todos na primeira página."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href={urlDaBusca(pedido, { pagina: 1 })} className={classeDoLinkPrincipal}>
          Ir para a primeira página
        </Link>
        {totalDePaginas > 1 && (
          <Link href={urlDaBusca(pedido, { pagina: totalDePaginas })} className={classeDoLinkSecundario}>
            Ir para a última
          </Link>
        )}
      </div>
    </div>
  );
}

function Avisos({
  pedido,
  avisos,
  candidatas,
}: {
  pedido: PedidoDeBusca;
  avisos: Aviso[];
  candidatas: CidadeResolvida[];
}) {
  const base = { pagina: 1 };
  return (
    <div className="mx-auto max-w-2xl space-y-3" role="status">
      {avisos.map((a) => {
        switch (a) {
          case "cidade_desconhecida":
            return (
              <CaixaDeAviso
                key={a}
                titulo={
                  pedido.uf
                    ? `Não encontramos "${pedido.cidade}" em ${pedido.uf}`
                    : `Não encontramos a cidade "${pedido.cidade}"`
                }
                texto="Confira como o nome está escrito, ou escolha uma das cidades que aparecem enquanto você digita."
                saidas={[
                  ...(pedido.uf
                    ? [{ rotulo: `Buscar em todo o estado (${pedido.uf})`, href: urlDaBusca(pedido, { ...base, cidade: null }) }]
                    : []),
                  { rotulo: "Buscar em qualquer cidade", href: urlDaBusca(pedido, { ...base, cidade: null, uf: null }) },
                ]}
              />
            );
          case "cidade_ambigua":
            return (
              <CaixaDeAviso
                key={a}
                titulo={`Existe mais de uma cidade chamada "${pedido.cidade}"`}
                texto={
                  candidatas.length > 0
                    ? "Qual delas você procura?"
                    : "Escolha o estado ao lado da cidade e busque de novo."
                }
                saidas={candidatas.map((c) => ({
                  rotulo: `${c.nome}, ${c.uf}`,
                  href: urlDaBusca(pedido, { ...base, cidade: c.slug, uf: c.uf }),
                }))}
              />
            );
          case "especialidade_desconhecida":
            return (
              <CaixaDeAviso
                key={a}
                titulo="Não encontramos essa especialidade"
                texto="O link pode ter uma especialidade que não está mais na lista. Escolha uma em Mais filtros."
                saidas={[{ rotulo: "Buscar sem especialidade", href: urlDaBusca(pedido, { ...base, especialidade: null }) }]}
              />
            );
          case "servico_desconhecido":
            return (
              <CaixaDeAviso
                key={a}
                titulo="Não encontramos esse serviço"
                texto="O link pode ter um serviço que não está mais na lista. Escolha um em Mais filtros."
                saidas={[{ rotulo: "Buscar sem serviço", href: urlDaBusca(pedido, { ...base, servico: null }) }]}
              />
            );
          case "filtros_incompativeis":
            return (
              <CaixaDeAviso
                key={a}
                titulo="Esses filtros não combinam"
                texto="Especialidade e forma de atendimento valem para veterinários. Serviço vale para estabelecimentos. Nenhum perfil tem os dois ao mesmo tempo."
                saidas={[
                  {
                    rotulo: "Ver veterinários",
                    href: urlDaBusca(pedido, { ...base, servico: null, tipo: "veterinario" }),
                  },
                  {
                    rotulo: "Ver estabelecimentos",
                    href: urlDaBusca(pedido, { ...base, especialidade: null, atendimento: null, tipo: "estabelecimento" }),
                  },
                ]}
              />
            );
        }
      })}
    </div>
  );
}

function CaixaDeAviso({
  titulo,
  texto,
  saidas,
}: {
  titulo: string;
  texto: string;
  saidas: { rotulo: string; href: string }[];
}) {
  return (
    <div className="rounded-2xl border border-warning/40 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning">
          <TriangleAlert size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="break-words text-[16px] font-bold text-titulo">{titulo}</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-corpo-texto">{texto}</p>
          {saidas.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {saidas.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className={classeDoLinkSecundario}>
                    {s.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Apoio                                                              */
/* ------------------------------------------------------------------ */

/** As cidades cujo nome é exatamente o digitado, em estados diferentes. */
async function cidadesComEsteNome(digitado: string): Promise<CidadeResolvida[]> {
  const chave = chaveDeNome(digitado);
  const r = await sugerirCidades(digitado, null, 20);
  if (r.estado !== "ok") return [];
  return r.cidades.filter((c) => c.chave === chave).slice(0, 8);
}
