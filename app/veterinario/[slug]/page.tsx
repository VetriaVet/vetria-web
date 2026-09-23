import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, IdCard, MapPin } from "lucide-react";
import { ATENDIMENTO, juntarLocal, modosLigados } from "@/components/publico/atendimento";
import {
  BlocoDeContato,
  Detalhe,
  Etiquetas,
  MolduraDoPerfil,
  PerfilComErro,
  Secao,
  TextoLivre,
} from "@/components/publico/Perfil";
import { carregarPerfilDeVeterinario } from "@/lib/perfil-publico/carregar";
import { robotsDaPaginaPublica } from "@/lib/publico/indexacao";
import type { ModoDeAtendimento } from "@/lib/busca/tipos";

// /veterinario/[slug] (F4/S7, E5). PÚBLICA, fora de /app: não confundir com
// o painel /app/veterinario (DL-043). Conta que não está `active` volta 404
// porque a RLS não devolve a linha (lib/perfil-publico/carregar.ts), e não por
// um `if` aqui.
//
// ⚠️ Nada de telefone nem WhatsApp nesta página (DL-047, matriz §3 regra 3).

// Sem cache de HTML, nunca: um perfil suspenso não pode continuar no ar por
// uma página guardada. Hoje isso já vale pelo `connection()` da camada de
// dados, mas lá ele roda dentro de try/catch; aqui fica explícito.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const O_QUE_E: Record<ModoDeAtendimento, string> = {
  presencial: "Atende no consultório ou no estabelecimento.",
  domiciliar: "Vai até a casa do responsável.",
  teleorientacao: "Orienta a distância, sem consulta presencial.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await carregarPerfilDeVeterinario(slug);
  if (r.estado !== "ok") {
    return { title: "Perfil não encontrado", robots: { index: false, follow: false } };
  }
  const p = r.perfil;
  const nome = p.nome ?? "Veterinário";
  const local = juntarLocal(p.cidade, p.uf);
  const descricao = [
    local ? `Veterinário em ${local}.` : "Veterinário na Vetria.",
    p.especialidades.length > 0 ? `${p.especialidades.join(", ")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    title: nome,
    description: descricao,
    robots: robotsDaPaginaPublica(),
    openGraph: { title: nome, description: descricao, type: "profile" },
  };
}

export default async function PerfilDoVeterinarioPage({ params }: Props) {
  const { slug } = await params;
  const r = await carregarPerfilDeVeterinario(slug);

  // notFound() fora de qualquer try/catch: ele funciona lançando (DL-016).
  if (r.estado === "nao_encontrado") notFound();
  if (r.estado !== "ok") return <PerfilComErro tentarDeNovo={`/veterinario/${slug}`} />;

  const p = r.perfil;
  const local = juntarLocal(p.bairro, p.cidade, p.uf);
  const modos = modosLigados(p.atendimento);

  return (
    <MolduraDoPerfil
      tipo="vet"
      nome={p.nome}
      subtitulo={p.titulo}
      detalhes={
        <>
          {local && <Detalhe icone={<MapPin size={16} />}>{local}</Detalhe>}
          {/* ⚠️ DECISÃO PENDENTE (Elber): mostrar o CRMV no perfil público.
              É o registro público do conselho; aqui só UF e número, sem
              selo de "verificado". */}
          {p.crmv && (
            <Detalhe icone={<IdCard size={16} />}>
              CRMV-{p.crmv.uf} {p.crmv.numero}
            </Detalhe>
          )}
          {p.experiencia && (
            <Detalhe icone={<Clock size={16} />}>{p.experiencia} de experiência</Detalhe>
          )}
        </>
      }
      principal={
        <>
          <Secao titulo="Sobre">
            {p.bio ? (
              <TextoLivre texto={p.bio} />
            ) : (
              <p className="text-[14px] text-corpo-texto">
                Este veterinário ainda não escreveu uma apresentação.
              </p>
            )}
          </Secao>

          {p.especialidades.length > 0 && (
            <Secao titulo="Especialidades">
              <Etiquetas itens={p.especialidades} rotulo="Especialidades" />
            </Secao>
          )}

          {modos.length > 0 && (
            <Secao titulo="Formas de atendimento">
              <ul className="grid gap-3 sm:grid-cols-2">
                {modos.map((m) => {
                  const { rotulo, icone: Icone } = ATENDIMENTO[m];
                  return (
                    <li key={m} className="flex items-start gap-3 rounded-xl bg-neutro-bg-alt p-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fundo-destaque text-principal">
                        <Icone size={18} aria-hidden />
                      </span>
                      <div>
                        <p className="text-[14px] font-semibold text-titulo">{rotulo}</p>
                        <p className="text-[13px] leading-relaxed text-corpo-texto">{O_QUE_E[m]}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Secao>
          )}
        </>
      }
      lateral={<BlocoDeContato tipo="vet" />}
    />
  );
}
