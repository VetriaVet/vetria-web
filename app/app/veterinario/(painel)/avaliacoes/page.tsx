import { redirect } from "next/navigation";
import { requirePainel } from "@/lib/auth/painel";
import { SO_ATIVO } from "@/lib/auth/status";

// T-055: Avaliações está fora da entrega de 25/11 (docs/00-ESCOPO.md) e saiu do
// menu. A rota continua existindo para não quebrar link antigo nem o portão:
// o guard roda primeiro, com a mesma lista de antes (matriz §4, só `active`),
// e quem passa volta para o painel. Quem não passa é despachado pelo próprio
// guard para a tela do seu status, como em qualquer outra página do painel.
//
// ⚠️ `redirect()` fora de try/catch (DL-016).

export default async function VetAvaliacoesPage() {
  await requirePainel("vet", SO_ATIVO);
  redirect("/app/veterinario");
}
