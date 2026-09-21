import { requirePainel } from "@/lib/auth/painel";
import { SO_ATIVO } from "@/lib/auth/status";
import { AgendaCasca } from "@/components/app/cascas";

export const metadata = { title: "Agenda" };

export default async function VetAgendaPage() {
  await requirePainel("vet", SO_ATIVO);
  return <AgendaCasca />;
}
