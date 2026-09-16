import { requirePainel } from "@/lib/auth/painel";
import { SO_ATIVO } from "@/lib/auth/status";
import { ContatosCasca } from "@/components/app/cascas";

export const metadata = { title: "Contatos recebidos" };

export default async function ClinicContatosPage() {
  await requirePainel("clinic", SO_ATIVO);
  return <ContatosCasca />;
}
