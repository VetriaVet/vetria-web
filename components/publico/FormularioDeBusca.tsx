import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { UFS } from "@/app/app/veterinario/onboarding/campos";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  MODOS_DE_ATENDIMENTO,
  TERMO_MAXIMO,
  type FiltrosAplicados,
  type ItemDeLista,
  type PedidoDeBusca,
} from "@/lib/busca/tipos";
import { ATENDIMENTO } from "./atendimento";
import { CampoDeCidade } from "./CampoDeCidade";
import { CampoSelecao } from "./CampoSelecao";

// O formulário da /buscar. GET puro para `/buscar`, com os nomes de campo do
// contrato (`lib/busca/pedido.ts`): q, cidade, uf, tipo, especialidade,
// atendimento, servico. Funciona sem JavaScript; o único pedaço cliente é o
// autocompletar da cidade, que também funciona como campo simples.

/** Algum filtro na URL? (Decide "Limpar a busca" e o estado vazio.) */
export function temFiltro(p: PedidoDeBusca): boolean {
  return Boolean(p.termo || p.cidade || p.uf || p.especialidade || p.servico || p.atendimento || p.tipo);
}

export function FormularioDeBusca({
  pedido,
  filtros,
  especialidades,
  servicos,
}: {
  pedido: PedidoDeBusca;
  filtros: FiltrosAplicados | null;
  especialidades: ItemDeLista[];
  servicos: ItemDeLista[];
}) {
  // O que volta para os campos é o que a busca APLICOU quando deu certo
  // ("goiania-go" na URL aparece como "Goiânia" / GO), e o que a pessoa
  // digitou quando não deu (para ela corrigir, em vez de redigitar).
  const cidadeNoCampo = filtros?.cidade?.nome ?? pedido.cidade ?? "";
  const ufNoCampo = filtros?.uf ?? pedido.uf ?? "";
  const extras = [pedido.especialidade, pedido.servico, pedido.atendimento].filter(Boolean).length;

  return (
    <form
      action="/buscar"
      method="get"
      role="search"
      aria-label="Buscar profissionais"
      className="mt-6 rounded-2xl bg-white p-4 shadow-md sm:p-5"
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_1.15fr_9rem] lg:items-end">
        <div>
          <Label htmlFor="busca-termo">O que você procura</Label>
          <div className="relative">
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-corpo-texto"
            />
            <Input
              id="busca-termo"
              name="q"
              type="search"
              defaultValue={pedido.termo ?? ""}
              maxLength={TERMO_MAXIMO}
              placeholder="Nome, especialidade ou serviço"
              className="pl-10"
            />
          </div>
        </div>

        <CampoDeCidade cidadeInicial={cidadeNoCampo} ufInicial={ufNoCampo} ufs={UFS} />

        <Button type="submit" className="mt-1 lg:mt-0">
          <Search size={17} aria-hidden />
          Buscar
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <fieldset className="min-w-0">
          <legend className="sr-only">Mostrar</legend>
          <div className="flex w-full flex-wrap rounded-[22px] bg-neutro-bg-alt p-1 sm:inline-flex sm:w-auto sm:rounded-pill">
            {(
              [
                { valor: "", rotulo: "Todos" },
                { valor: "veterinario", rotulo: "Veterinários" },
                { valor: "estabelecimento", rotulo: "Estabelecimentos" },
              ] as const
            ).map((o) => (
              <label
                key={o.valor}
                className="flex-auto cursor-pointer whitespace-nowrap rounded-pill px-2 py-2 text-center text-[12.5px] font-medium sm:px-3.5 sm:text-[13px] text-corpo-texto transition has-[:checked]:bg-principal has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-principal/40 has-[:focus-visible]:ring-offset-1 sm:flex-none"
              >
                <input
                  type="radio"
                  name="tipo"
                  value={o.valor}
                  defaultChecked={(pedido.tipo ?? "") === o.valor}
                  className="sr-only"
                />
                {o.rotulo}
              </label>
            ))}
          </div>
        </fieldset>

        {temFiltro(pedido) && (
          <Link
            href="/buscar"
            className="self-start rounded-sm text-[13px] font-medium text-principal underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 sm:self-auto"
          >
            Limpar a busca
          </Link>
        )}
      </div>

      <details open={extras > 0} className="group mt-4 border-t border-neutro-border-soft pt-3">
        <summary className="inline-flex list-none items-center gap-2 rounded-pill py-1 text-[14px] font-semibold text-titulo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal size={16} aria-hidden className="text-principal" />
          Mais filtros
          {extras > 0 && (
            <span className="rounded-pill bg-fundo-destaque px-2 py-0.5 text-[12px] font-semibold text-principal">
              {extras === 1 ? "1 ativo" : `${extras} ativos`}
            </span>
          )}
        </summary>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="busca-especialidade">Especialidade</Label>
            <CampoSelecao
              id="busca-especialidade"
              name="especialidade"
              defaultValue={pedido.especialidade ?? ""}
              todas="Todas"
              opcoes={especialidades.map((e) => ({ value: e.slug, label: e.nome }))}
            />
          </div>
          <div>
            <Label htmlFor="busca-atendimento">Forma de atendimento</Label>
            <CampoSelecao
              id="busca-atendimento"
              name="atendimento"
              defaultValue={pedido.atendimento ?? ""}
              todas="Todas"
              opcoes={MODOS_DE_ATENDIMENTO.map((m) => ({ value: m, label: ATENDIMENTO[m].rotulo }))}
            />
          </div>
          <div>
            <Label htmlFor="busca-servico">Serviço do estabelecimento</Label>
            <CampoSelecao
              id="busca-servico"
              name="servico"
              defaultValue={pedido.servico ?? ""}
              todas="Todos"
              opcoes={servicos.map((s) => ({ value: s.slug, label: s.nome }))}
            />
          </div>
        </div>
        <p className="mt-2.5 text-[13px] leading-relaxed text-corpo-texto">
          Especialidade e forma de atendimento valem para veterinários. Serviço vale para
          estabelecimentos.
        </p>
      </details>
    </form>
  );
}
