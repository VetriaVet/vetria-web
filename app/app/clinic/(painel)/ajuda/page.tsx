import { requirePainel } from "@/lib/auth/painel";
import { AjudaCasca } from "@/components/app/cascas";

export const metadata = { title: "Ajuda" };

export default async function ClinicAjudaPage() {
  await requirePainel("clinic");
  return <AjudaCasca />;
}
