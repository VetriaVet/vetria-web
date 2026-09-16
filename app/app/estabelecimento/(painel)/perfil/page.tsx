import { requirePainel } from "@/lib/auth/painel";
import { ESPERANDO_OU_ATIVO } from "@/lib/auth/status";
import ClinicProfileForm from "./ClinicProfileForm";

export const metadata = {
  title: "Perfil do estabelecimento",
};

// Gêmea da do veterinário: guard inline de role virou lista de permitidos.
// `pending_validation` entra (DL-046, matriz §4); `incomplete` volta para o
// onboarding; `suspended` vai para a tela de bloqueio.

export default async function ClinicPerfilPage() {
  const { name: displayName } = await requirePainel(
    "clinic",
    ESPERANDO_OU_ATIVO
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-2xl text-titulo">Perfil do estabelecimento</h1>
        <p className="text-[14px] text-corpo-texto mt-1 max-w-2xl">
          Tudo que aparece no perfil público do estabelecimento pra responsáveis. Mantenha
          atualizado pra receber mais contatos.
        </p>
      </div>

      <ClinicProfileForm initialName={displayName} />
    </div>
  );
}
