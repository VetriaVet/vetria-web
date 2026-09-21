import { requireContaBloqueada } from "@/lib/auth/painel";
import ContaBloqueada from "@/components/app/ContaBloqueada";

export const metadata = { title: "Conta bloqueada" };

// Gêmea da do veterinário. Matriz §4: `suspended` alcança a tela de bloqueio
// com motivo, e mais nada. Fora do route group `(painel)` pelo mesmo motivo.

export default async function ClinicBloqueadoPage() {
  const { motivo } = await requireContaBloqueada("clinic");

  return (
    <ContaBloqueada
      titulo="A conta do estabelecimento está bloqueada."
      motivo={motivo}
    />
  );
}
