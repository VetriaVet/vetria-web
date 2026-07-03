import { requirePainel } from "@/lib/auth/painel";
import { AvaliacoesCasca } from "@/components/app/cascas";

export const metadata = { title: "Avaliações" };

export default async function ClinicAvaliacoesPage() {
  await requirePainel("clinic");
  return <AvaliacoesCasca />;
}
