import { requirePainel } from "@/lib/auth/painel";
import { SO_ATIVO } from "@/lib/auth/status";
import { PlanoCasca } from "@/components/app/cascas";

export const metadata = { title: "Meu plano" };

export default async function VetPlanoPage() {
  await requirePainel("vet", SO_ATIVO);
  return <PlanoCasca />;
}
