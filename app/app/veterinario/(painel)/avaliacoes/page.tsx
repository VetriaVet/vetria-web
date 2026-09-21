import { requirePainel } from "@/lib/auth/painel";
import { SO_ATIVO } from "@/lib/auth/status";
import { AvaliacoesCasca } from "@/components/app/cascas";

export const metadata = { title: "Avaliações" };

export default async function VetAvaliacoesPage() {
  await requirePainel("vet", SO_ATIVO);
  return <AvaliacoesCasca />;
}
