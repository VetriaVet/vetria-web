import { requirePainel } from "@/lib/auth/painel";
import { ESPERANDO_OU_ATIVO, ONBOARDING } from "@/lib/auth/status";
import { carregarPreviaDoEstabelecimento } from "@/lib/perfil-publico/previa";
import { PerfilDoEstabelecimento } from "@/components/publico/Perfil";
import { PreviaDoPerfil } from "@/components/app/PreviaDoPerfil";

export const metadata = {
  title: "Perfil público do estabelecimento",
};

// Gêmea da do veterinário: a PRÉVIA do perfil público (F4/S7, E5), só
// leitura, com o MESMO componente da página /estabelecimento/[slug].
// `pending_validation` entra (DL-046, matriz §4); `incomplete` volta para o
// onboarding; `suspended` vai para a tela de bloqueio.
//
// Leitura com a SESSÃO do dono (`clinic_profiles_select_own`), só colunas
// públicas: nada de CNPJ, razão social, endereço ou CEP (R-032).
//
// O `ClinicProfileForm` saiu desta tela: não lia o banco nem salvava. O editor
// é a T-019 (F6/S11).

export default async function ClinicPerfilPage() {
  const { user, status } = await requirePainel("clinic", ESPERANDO_OU_ATIVO);
  const r = await carregarPreviaDoEstabelecimento(user.id);
  const podeRever = (ONBOARDING as readonly string[]).includes(status);

  return (
    <PreviaDoPerfil tipo="clinic" status={status} podeRever={podeRever} carregada={r}>
      {r.estado === "ok" && (
        <PerfilDoEstabelecimento
          perfil={r.conteudo}
          modo={{ tipo: "previa", verificado: status === "active" }}
        />
      )}
    </PreviaDoPerfil>
  );
}
