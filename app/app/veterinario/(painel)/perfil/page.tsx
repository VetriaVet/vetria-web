import { requirePainel } from "@/lib/auth/painel";
import { ESPERANDO_OU_ATIVO } from "@/lib/auth/status";
import VetProfileForm from "./VetProfileForm";

export const metadata = {
  title: "Meu perfil",
};

// O guard inline que checava só `role` virou `requirePainel` com lista de
// permitidos. `pending_validation` entra de propósito: é a promessa do DL-046
// (*"enquanto espera, ele edita o perfil"*) e é uma das três rotas que a
// matriz §4 dá a quem está na fila. `incomplete` não entra: a tela dele é o
// onboarding, e é para lá que ele é devolvido.
//
// Nome real (user_metadata) pra pré-preencher o "nome de exibição" (DL-019).

export default async function VetPerfilPage() {
  const { name: displayName } = await requirePainel("vet", ESPERANDO_OU_ATIVO);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-2xl text-titulo">
          Meu perfil profissional
        </h1>
        <p className="text-[14px] text-corpo-texto mt-1 max-w-2xl">
          Tudo que aparece no seu perfil público pra responsáveis. Mantenha
          atualizado pra receber mais contatos.
        </p>
      </div>

      <VetProfileForm initialName={displayName} />
    </div>
  );
}
