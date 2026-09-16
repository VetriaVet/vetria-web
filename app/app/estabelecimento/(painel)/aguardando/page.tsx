import { requirePainel } from "@/lib/auth/painel";
import { SO_ESPERANDO } from "@/lib/auth/status";
import { AguardandoCasca } from "@/components/app/cascas";

export const metadata = { title: "Aguardando validação" };

// Estado "aguardando validação" do estabelecimento — a única tela do painel
// que `pending_validation` alcança de verdade, junto com `/perfil` e
// `/configuracoes` (matriz §4 de `docs/06-PERMISSOES.md`).
//
// ⚠️ Mesma correção da gêmea do veterinário: o comentário anterior apontava o
// gating para a TASK-032, que vive em `BACKLOG.md`, arquivo CONGELADO. O
// gating é a T-016 e está em `lib/auth/status.ts`.
//
// É esta a tela em que o estabelecimento que concluiu o onboarding da T-007
// passa a cair. Antes ele caía no painel, aprovado sem ter sido (R-050).

export default async function ClinicAguardandoPage() {
  await requirePainel("clinic", SO_ESPERANDO);
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
