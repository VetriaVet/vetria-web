import { requirePainel } from "@/lib/auth/painel";
import { AguardandoCasca } from "@/components/app/cascas";

export const metadata = { title: "Aguardando validação" };

// Estado "aguardando validação" da clínica (pending_validation, CONTEXT §4.3).
// Casca: acessível pra qualquer clínica logada; gating real é a TASK-032.

export default async function ClinicAguardandoPage() {
  await requirePainel("clinic");
  return (
    <AguardandoCasca
      headline="Estamos validando o cadastro do estabelecimento."
      sub="Recebemos os dados e estamos confirmando as informações do estabelecimento. Você recebe um email assim que tudo estiver pronto."
      steps={[
        {
          state: "done",
          title: "Cadastro recebido",
          desc: "Os dados do estabelecimento foram registrados com segurança.",
        },
        {
          state: "active",
          title: "Validação dos dados",
          desc: "Em andamento · costuma levar até 48h úteis.",
        },
        {
          state: "pending",
          title: "Estabelecimento aprovado e ativo",
          desc: "Você recebe um email e o estabelecimento entra na busca pública.",
        },
      ]}
      perfil={{
        href: "/app/estabelecimento/perfil",
        title: "Adiantar o perfil do estabelecimento",
        desc: "Deixe o perfil pronto pra aparecer na busca assim que validar.",
      }}
    />
  );
}
