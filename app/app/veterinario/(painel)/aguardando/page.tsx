import { requirePainel } from "@/lib/auth/painel";
import { AguardandoCasca } from "@/components/app/cascas";

export const metadata = { title: "Aguardando validação" };

// Estado "aguardando validação do CRMV" (pending_validation, CONTEXT §4.3).
// Casca: acessível pra qualquer vet logado; gating real é a TASK-032.

export default async function VetAguardandoPage() {
  await requirePainel("vet");
  return (
    <AguardandoCasca
      headline="Estamos validando seu cadastro."
      sub="Recebemos seus dados e estamos confirmando seu CRMV junto ao conselho. Você recebe um email assim que tudo estiver pronto."
      steps={[
        {
          state: "done",
          title: "Cadastro recebido",
          desc: "Seus dados foram registrados com segurança.",
        },
        {
          state: "active",
          title: "Validação do CRMV",
          desc: "Em andamento · costuma levar até 48h úteis.",
        },
        {
          state: "pending",
          title: "Perfil aprovado e ativo",
          desc: "Você recebe um email e seu perfil entra na busca pública.",
        },
      ]}
      perfil={{
        href: "/app/veterinario/perfil",
        title: "Adiantar foto e bio",
        desc: "Deixe seu perfil pronto pra aparecer na busca assim que validar.",
      }}
    />
  );
}
