import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { juntarLocal } from "@/components/publico/atendimento";
import { PerfilComErro, PerfilDoEstabelecimento } from "@/components/publico/Perfil";
import { carregarPerfilDeEstabelecimento } from "@/lib/perfil-publico/carregar";
import { robotsDaPaginaPublica } from "@/lib/publico/indexacao";

// /estabelecimento/[slug] (F4/S7, E5). PÚBLICA, fora de /app: não confundir
// com o painel /app/estabelecimento (DL-043). Conta que não está `active`
// volta 404 pela RLS.
//
// ⚠️ Sem endereço e sem CEP (R-032 sem decisão) e sem telefone/WhatsApp
// (DL-047). O `site` chega conferido (só http/https) de lib/perfil-publico e
// sai com rel="nofollow noopener noreferrer ugc": é URL escrita pelo dono.

// Sem cache de HTML, nunca: um perfil suspenso não pode continuar no ar por
// uma página guardada. Hoje isso já vale pelo `connection()` da camada de
// dados, mas lá ele roda dentro de try/catch; aqui fica explícito.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await carregarPerfilDeEstabelecimento(slug);
  if (r.estado !== "ok") {
    return { title: "Perfil não encontrado", robots: { index: false, follow: false } };
  }
  const p = r.perfil;
  const nome = p.nome ?? "Estabelecimento";
  const local = juntarLocal(p.cidade, p.uf);
  const descricao = [
    local ? `Estabelecimento veterinário em ${local}.` : "Estabelecimento veterinário na Vetria.",
    p.servicos.length > 0 ? `${p.servicos.join(", ")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
  return {
    title: nome,
    description: descricao,
    robots: robotsDaPaginaPublica(),
    openGraph: { title: nome, description: descricao, type: "website" },
  };
}

export default async function PerfilDoEstabelecimentoPage({ params }: Props) {
  const { slug } = await params;
  const r = await carregarPerfilDeEstabelecimento(slug);

  // notFound() fora de qualquer try/catch: ele funciona lançando (DL-016).
  if (r.estado === "nao_encontrado") notFound();
  if (r.estado !== "ok") return <PerfilComErro tentarDeNovo={`/estabelecimento/${slug}`} />;

  // O mesmo componente da prévia do dono no painel (`/app/estabelecimento/perfil`).
  return <PerfilDoEstabelecimento perfil={r.perfil} />;
}
