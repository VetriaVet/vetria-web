import { requirePainel } from "@/lib/auth/painel";
import { SO_ATIVO } from "@/lib/auth/status";
import { AjudaCasca } from "@/components/app/cascas";

export const metadata = { title: "Ajuda" };

export default async function ClinicAjudaPage() {
  await requirePainel("clinic", SO_ATIVO);
  return <AjudaCasca />;
}
