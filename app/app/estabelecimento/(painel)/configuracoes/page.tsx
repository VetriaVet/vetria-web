import { requirePainel } from "@/lib/auth/painel";
import { ESPERANDO_OU_ATIVO } from "@/lib/auth/status";
import { ConfiguracoesCasca } from "@/components/app/cascas";

export const metadata = { title: "Configurações" };

export default async function ClinicConfiguracoesPage() {
  const { name, email } = await requirePainel("clinic", ESPERANDO_OU_ATIVO);
  return <ConfiguracoesCasca name={name} email={email} />;
}
