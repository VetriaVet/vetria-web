import { requirePainel } from "@/lib/auth/painel";
import { ConfiguracoesCasca } from "@/components/app/cascas";

export const metadata = { title: "Configurações" };

export default async function ClinicConfiguracoesPage() {
  const { name, email } = await requirePainel("clinic");
  return <ConfiguracoesCasca name={name} email={email} />;
}
