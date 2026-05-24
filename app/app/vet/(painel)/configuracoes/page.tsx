import { requirePainel } from "@/lib/auth/painel";
import { ConfiguracoesCasca } from "@/components/app/cascas";

export const metadata = { title: "Configurações" };

export default async function VetConfiguracoesPage() {
  const { name, email } = await requirePainel("vet");
  return <ConfiguracoesCasca name={name} email={email} />;
}
