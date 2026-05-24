import { requirePainel } from "@/lib/auth/painel";
import { ContatosCasca } from "@/components/app/cascas";

export const metadata = { title: "Contatos recebidos" };

export default async function VetContatosPage() {
  await requirePainel("vet");
  return <ContatosCasca />;
}
