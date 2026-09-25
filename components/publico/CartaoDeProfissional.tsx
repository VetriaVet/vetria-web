import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, MapPin, Stethoscope } from "lucide-react";
import type { Cartao } from "@/lib/busca/tipos";
import { ATENDIMENTO, iniciais, juntarLocal, modosLigados } from "./atendimento";

// O cartão da lista de /buscar. Desenha SÓ o que `lib/busca` devolve: sem
// foto (não existe coluna), sem nota, sem preço. O "Verificado" (DL-070) vale
// para todo cartão: a busca só devolve conta `active`, e só é `active` quem
// passou pela validação. A explicação completa fica no perfil. Nome nulo não vira nome inventado: vira
// "Nome não informado", dito como tal.

const MAX_ETIQUETAS = 3;

export function CartaoDeProfissional({ cartao }: { cartao: Cartao }) {
  const eVet = cartao.tipo === "vet";
  const etiquetas = eVet ? cartao.especialidades : cartao.servicos;
  const visiveis = etiquetas.slice(0, MAX_ETIQUETAS);
  const sobrando = etiquetas.length - visiveis.length;
  const local = eVet
    ? juntarLocal(cartao.bairro, cartao.cidade, cartao.uf)
    : juntarLocal(cartao.cidade, cartao.uf);
  const modos = eVet ? modosLigados(cartao.atendimento) : [];
  const tipoPorExtenso = eVet ? "Veterinário" : "Estabelecimento veterinário";

  return (
    <Link
      href={cartao.href}
      className="group flex h-full flex-col rounded-2xl border border-neutro-border bg-white p-5 no-underline shadow-sm transition hover:border-principal/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2"
    >
      <div className="flex items-start gap-3.5">
        <Avatar tipo={cartao.tipo} nome={cartao.nome} tamanho="md" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] font-medium text-principal">
            <span>{tipoPorExtenso}</span>
            <span className="inline-flex items-center gap-1 text-corpo-texto">
              <BadgeCheck size={13} className="text-principal" aria-hidden />
              Verificado
              <span className="sr-only"> pela Vetria</span>
            </span>
          </p>
          <h3
            className={`mt-0.5 break-words text-[16px] leading-snug ${
              cartao.nome ? "text-titulo" : "font-medium text-corpo-texto"
            }`}
          >
            {cartao.nome ?? "Nome não informado"}
          </h3>
          {eVet && cartao.titulo && (
            <p className="mt-0.5 text-[13px] text-corpo-texto">{cartao.titulo}</p>
          )}
        </div>
      </div>

      {local && (
        <p className="mt-4 flex items-start gap-1.5 text-[13px] text-corpo-texto">
          <MapPin size={15} className="mt-0.5 shrink-0 text-principal" aria-hidden />
          <span>{local}</span>
        </p>
      )}

      {visiveis.length > 0 && (
        <ul
          aria-label={eVet ? "Especialidades" : "Serviços"}
          className="mt-3 flex flex-wrap gap-1.5"
        >
          {visiveis.map((e) => (
            <li
              key={e}
              className="rounded-pill bg-fundo-destaque px-2.5 py-1 text-[12px] font-medium text-principal"
            >
              {e}
            </li>
          ))}
          {sobrando > 0 && (
            <li className="rounded-pill bg-neutro-bg-alt px-2.5 py-1 text-[12px] text-corpo-texto">
              {sobrando === 1 ? "mais 1" : `mais ${sobrando}`}
            </li>
          )}
        </ul>
      )}

      {modos.length > 0 && (
        <ul aria-label="Formas de atendimento" className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {modos.map((m) => {
            const { rotulo, icone: Icone } = ATENDIMENTO[m];
            return (
              <li key={m} className="flex items-center gap-1.5 text-[12px] text-corpo-texto">
                <Icone size={14} className="text-principal" aria-hidden />
                {rotulo}
              </li>
            );
          })}
        </ul>
      )}

      <span className="mt-auto flex items-center gap-1.5 pt-5 text-[13px] font-semibold text-principal">
        Ver perfil
        <ArrowRight
          size={15}
          aria-hidden
          className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
        />
      </span>
    </Link>
  );
}

/**
 * Círculo de identificação. Sem foto (não há coluna, R-019): iniciais do
 * nome real, ou o ícone do tipo quando o nome não existe.
 */
export function Avatar({
  tipo,
  nome,
  tamanho,
}: {
  tipo: "vet" | "clinic";
  nome: string | null;
  tamanho: "md" | "lg";
}) {
  const letras = iniciais(nome);
  const Icone = tipo === "vet" ? Stethoscope : Building2;
  const caixa =
    tamanho === "lg" ? "h-20 w-20 text-[26px] sm:h-24 sm:w-24 sm:text-[30px]" : "h-12 w-12 text-[16px]";
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-principal font-semibold tracking-tight text-white ${caixa}`}
    >
      {letras ?? <Icone size={tamanho === "lg" ? 34 : 22} strokeWidth={1.75} />}
    </span>
  );
}

/** O cartão fantasma: a estrutura do cartão, sem dado nenhum (DL-034). */
export function CartaoFantasma() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col rounded-2xl border border-neutro-border-soft bg-white/70 p-5"
    >
      <div className="flex items-start gap-3.5">
        <span className="block h-12 w-12 shrink-0 rounded-full bg-neutro-border/70" />
        <div className="flex-1 space-y-2 pt-1">
          <span className="block h-2.5 w-1/3 rounded-md bg-neutro-border/70" />
          <span className="block h-3.5 w-2/3 rounded-md bg-neutro-border/70" />
          <span className="block h-2.5 w-1/2 rounded-md bg-neutro-border/70" />
        </div>
      </div>
      <span className="mt-5 block h-2.5 w-2/5 rounded-md bg-neutro-border/70" />
      <div className="mt-3 flex gap-1.5">
        <span className="block h-6 w-20 rounded-pill bg-fundo-destaque" />
        <span className="block h-6 w-24 rounded-pill bg-fundo-destaque" />
      </div>
      <span className="mt-6 block h-3 w-20 rounded-md bg-neutro-border/70" />
    </div>
  );
}
