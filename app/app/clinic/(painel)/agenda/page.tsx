import { requirePainel } from "@/lib/auth/painel";
import { AgendaCasca } from "@/components/app/cascas";

export const metadata = { title: "Agenda" };

export default async function ClinicAgendaPage() {
  await requirePainel("clinic");
  return <AgendaCasca />;
}
