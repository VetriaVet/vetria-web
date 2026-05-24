import { requirePainel } from "@/lib/auth/painel";
import { AgendaCasca } from "@/components/app/cascas";

export const metadata = { title: "Agenda" };

export default async function VetAgendaPage() {
  await requirePainel("vet");
  return <AgendaCasca />;
}
