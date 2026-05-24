import { requirePainel } from "@/lib/auth/painel";
import { AjudaCasca } from "@/components/app/cascas";

export const metadata = { title: "Ajuda" };

export default async function VetAjudaPage() {
  await requirePainel("vet");
  return <AjudaCasca />;
}
