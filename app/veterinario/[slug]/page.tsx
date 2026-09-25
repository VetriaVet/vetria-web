import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { juntarLocal } from "@/components/publico/atendimento";
import { PerfilComErro, PerfilDoVeterinario } from "@/components/publico/Perfil";
import { carregarPerfilDeVeterinario } from "@/lib/perfil-publico/carregar";
import { robotsDaPaginaPublica } from "@/lib/publico/indexacao";

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

  // O mesmo componente da prévia do dono no painel (`/app/veterinario/perfil`).
  return <PerfilDoVeterinario perfil={r.perfil} />;
}
