import { requirePainel } from "@/lib/auth/painel";
import { SO_ATIVO } from "@/lib/auth/status";
import { PlanoCasca } from "@/components/app/cascas";

export const metadata = { title: "Meu plano" };

export default async function ClinicPlanoPage() {
  await requirePainel("clinic", SO_ATIVO);
  return <PlanoCasca />;
}
