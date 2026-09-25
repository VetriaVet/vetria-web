import { requirePainel } from "@/lib/auth/painel";
import { ESPERANDO_OU_ATIVO, ONBOARDING } from "@/lib/auth/status";
import { carregarPreviaDoVeterinario } from "@/lib/perfil-publico/previa";
import { PerfilDoVeterinario } from "@/components/publico/Perfil";
import { PreviaDoPerfil } from "@/components/app/PreviaDoPerfil";

export const metadata = {
  title: "Meu perfil público",
};

// A PRÉVIA do perfil público (F4/S7, E5), só leitura. Pedido do Elber: a
// prévia mostra exatamente os dados escolhidos, com o MESMO componente da
// página /veterinario/[slug].
//
// `pending_validation` entra (DL-046, matriz §4); `incomplete` volta para o
// onboarding; `suspended` vai para a tela de bloqueio.
//
// A leitura é com a SESSÃO do dono (policy `vet_profiles_select_own`), nunca
// `service_role`, e só com as colunas da página pública
// (`lib/perfil-publico/previa.ts`).
//
// O formulário `VetProfileForm` saiu desta tela: não lia o banco nem salvava.
// O editor é a T-019 (F6/S11).

export default async function VetPerfilPage() {
  const { user, status } = await requirePainel("vet", ESPERANDO_OU_ATIVO);
  const r = await carregarPreviaDoVeterinario(user.id);
  // A mesma lista que o middleware aplica em /onboarding (ver aguardando/page.tsx).
  const podeRever = (ONBOARDING as readonly string[]).includes(status);

  return (
    <PreviaDoPerfil tipo="vet" status={status} podeRever={podeRever} carregada={r}>
      {r.estado === "ok" && (
        <PerfilDoVeterinario
          perfil={r.conteudo}
          modo={{ tipo: "previa", verificado: status === "active" }}
        />
      )}
    </PreviaDoPerfil>
  );
}
