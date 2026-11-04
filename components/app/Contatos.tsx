import Link from "next/link";
import { ArrowRight, MessageCircle, Search, TriangleAlert, Stethoscope, Building2, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import {
  LIMITE_DA_LISTA,
  type ContatoFeito,
  type ContatoRecebido,
  type ContatosRecebidos,
  type SeusContatos,
} from "@/lib/contato/leitura";

// T-042 · As telas de contato (DL-047, desenho §5 e §6 da T-039).
//
// Tudo aqui é desenho: a leitura é de `lib/contato/leitura.ts`, pela sessão de
// quem está na tela. Nenhum componente recebe `anon_id` ou `user_id`, porque
// nenhuma consulta os pede (D6: o profissional não sabe quem clicou).
//
// Estados (DL-020, DL-034):
//   · vazio do profissional e do responsável: GHOST, porque ensina o que vai
//     aparecer ali;
//   · erro: aviso visível, nunca tela em branco e nunca zero inventado.

function contatos(n: number): string {
  return n === 1 ? "contato" : "contatos";
}

function AvisoDeErro({ texto }: { texto: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-5">
      <TriangleAlert size={20} className="mt-0.5 shrink-0 text-warning" aria-hidden />
      <div>
        <p className="font-semibold text-titulo">Não foi possível carregar seus contatos agora.</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-corpo-texto">{texto}</p>
      </div>
    </div>
  );
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="rounded-2xl border border-neutro-border bg-white p-5">
      <p className="text-[34px] font-bold leading-none tracking-tight text-titulo tabular-nums">{valor}</p>
      <p className="mt-2 text-[13px] leading-snug text-corpo-texto">{rotulo}</p>
    </div>
  );
}

function LinhaRecebida({ contato }: { contato: ContatoRecebido }) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-neutro-border bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fundo-destaque text-principal">
        <MessageCircle size={17} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium leading-snug text-titulo">{contato.origem}</p>
        <p className="mt-0.5 text-[12px] text-corpo-texto">
          {contato.quando} · {contato.canal}
        </p>
      </div>
    </li>
  );
}

const VAZIO_DO_PROFISSIONAL =
  "Quando alguém tocar em Chamar no WhatsApp no seu perfil, o contato aparece aqui, com a data e de onde a pessoa veio. A conversa continua no seu WhatsApp.";

/* ---------------- "Contatos recebidos" (tela inteira) ---------------- */
export function ContatosRecebidosTela({ dados }: { dados: ContatosRecebidos }) {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-titulo">Contatos recebidos</h1>
        <p className="mt-1 max-w-2xl text-[14px] text-corpo-texto">
          As vezes em que um responsável tocou em Chamar no WhatsApp no seu perfil na Vetria.
        </p>
      </div>

      {dados.estado === "erro" ? (
        <AvisoDeErro texto="Seus contatos continuam guardados. Atualize a página em alguns minutos." />
      ) : (
        <>
          <section aria-label="Resumo dos contatos" className="grid gap-3 sm:grid-cols-2">
            <Numero valor={dados.ultimos30Dias} rotulo={`${contatos(dados.ultimos30Dias)} nos últimos 30 dias`} />
            <Numero valor={dados.noMes} rotulo={`${contatos(dados.noMes)} em ${dados.nomeDoMes}`} />
          </section>

          {dados.lista.length === 0 ? (
            <EmptyState icon={MessageCircle} ghost={3} title="Nenhum contato ainda" description={VAZIO_DO_PROFISSIONAL} />
          ) : (
            <section aria-labelledby="titulo-lista-contatos" className="flex flex-col gap-3">
              <h2 id="titulo-lista-contatos" className="text-[13px] font-semibold uppercase tracking-wider text-corpo-texto">
                Mais recentes
              </h2>
              <ul className="flex flex-col gap-2">
                {dados.lista.map((c) => (
                  <LinhaRecebida key={c.id} contato={c} />
                ))}
              </ul>
              {dados.lista.length >= LIMITE_DA_LISTA && (
                <p className="text-[12px] text-corpo-texto">
                  Mostrando os {LIMITE_DA_LISTA} contatos mais recentes. Os números acima contam todos.
                </p>
              )}
            </section>
          )}

          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-corpo-texto">
            <EyeOff size={14} className="mt-0.5 shrink-0" aria-hidden />
            A Vetria não mostra quem tocou no botão: a pessoa escolhe se quer falar com você pelo WhatsApp.
          </p>
        </>
      )}
    </div>
  );
}

/* ---------------- Cartão do painel inicial ---------------- */
export function CartaoDeContatosRecebidos({
  dados,
  href,
  sub,
}: {
  dados: ContatosRecebidos;
  href: string;
  sub: string;
}) {
  return (
    <Card className="border-neutro-border p-6">
      <h2 className="mb-1 text-lg font-bold text-titulo">Contatos recebidos</h2>
      <p className="mb-5 text-[13px] text-corpo-texto">{sub}</p>

      {dados.estado === "erro" ? (
        <AvisoDeErro texto="Tente de novo em alguns minutos." />
      ) : dados.lista.length === 0 ? (
        <EmptyState icon={MessageCircle} ghost={3} title="Nenhum contato ainda" description={VAZIO_DO_PROFISSIONAL} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Numero valor={dados.ultimos30Dias} rotulo={`${contatos(dados.ultimos30Dias)} nos últimos 30 dias`} />
            <Numero valor={dados.noMes} rotulo={`${contatos(dados.noMes)} em ${dados.nomeDoMes}`} />
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {dados.lista.map((c) => (
              <LinhaRecebida key={c.id} contato={c} />
            ))}
          </ul>
        </>
      )}

      <Link
        href={href}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutro-border py-3 text-sm font-medium text-corpo-texto no-underline transition hover:border-principal hover:text-principal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40"
      >
        Ver contatos recebidos
        <ArrowRight size={14} aria-hidden />
      </Link>
    </Card>
  );
}

/* ---------------- "Seus contatos" (responsável) ---------------- */
function LinhaFeita({ contato }: { contato: ContatoFeito }) {
  const { perfil } = contato;
  const Icone = perfil?.tipo === "clinic" ? Building2 : Stethoscope;
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-neutro-border bg-white p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            perfil ? "bg-fundo-destaque text-principal" : "bg-neutro-bg-alt text-corpo-texto"
          }`}
        >
          <Icone size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {perfil ? (
            <>
              <Link
                href={perfil.href}
                className="break-words rounded-sm text-[15px] font-semibold text-titulo no-underline hover:text-principal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40"
              >
                {perfil.nome}
              </Link>
              <p className="text-[12px] text-corpo-texto">
                {perfil.tipo === "vet" ? "Veterinário" : "Estabelecimento"}
              </p>
            </>
          ) : (
            <p className="text-[14px] font-medium text-corpo-texto">Este perfil não está mais disponível</p>
          )}
          <p className="mt-0.5 text-[12px] text-corpo-texto">
            {contato.quando} · {contato.canal}
          </p>
        </div>
      </div>
      {perfil && (
        <Link
          href={`${perfil.href}#titulo-contato`}
          className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-pill border-[1.5px] border-principal bg-white px-4 py-2 text-[13px] font-semibold text-principal no-underline transition hover:bg-principal hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2"
        >
          <MessageCircle size={15} aria-hidden />
          Chamar de novo
        </Link>
      )}
    </li>
  );
}

export function SeusContatosLista({ dados }: { dados: SeusContatos }) {
  if (dados.estado === "erro") {
    return <AvisoDeErro texto="Seu histórico continua guardado. Atualize a página em alguns minutos." />;
  }

  if (dados.lista.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        preview={
          <div className="mb-6 space-y-3 [mask-image:linear-gradient(to_bottom,black,transparent)]">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-neutro-border-soft bg-neutro-bg-alt/40 p-4"
              >
                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-2.5 w-1/4" />
                </div>
                <Skeleton className="h-6 w-20 shrink-0 rounded-pill" />
              </div>
            ))}
          </div>
        }
        title="Nenhum contato ainda"
        description="Quando você tocar em Chamar no WhatsApp no perfil de um veterinário ou estabelecimento, ele aparece aqui, com a data, para você chamar de novo quando precisar."
        action={
          <Link
            href="/buscar"
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-principal px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-principal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2"
          >
            <Search size={16} aria-hidden />
            Buscar profissionais
          </Link>
        }
      />
    );
  }

  return (
    <section aria-label="Profissionais que você chamou" className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {dados.lista.map((c) => (
          <LinhaFeita key={c.id} contato={c} />
        ))}
      </ul>
      {dados.lista.length >= LIMITE_DA_LISTA && (
        <p className="text-[12px] text-corpo-texto">Mostrando os {LIMITE_DA_LISTA} contatos mais recentes.</p>
      )}
    </section>
  );
}
