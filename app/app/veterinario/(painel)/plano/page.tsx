import { requirePainel } from "@/lib/auth/painel";
import { PlanoCasca } from "@/components/app/cascas";

export const metadata = { title: "Meu plano" };

export default async function VetPlanoPage() {
  await requirePainel("vet");
  return <PlanoCasca />;
}
