import { requirePainel } from "@/lib/auth/painel";
import { SO_ESPERANDO } from "@/lib/auth/status";
import { AguardandoCasca } from "@/components/app/cascas";

export const metadata = { title: "Aguardando validação" };

// Estado "aguardando validação do CRMV" — a única tela do painel que
// `pending_validation` alcança de verdade, junto com `/perfil` e
// `/configuracoes` (matriz §4 de `docs/06-PERMISSOES.md`).
//
// ⚠️ O comentário que estava aqui dizia "casca: acessível pra qualquer vet
// logado; gating real é a TASK-032", e a TASK-032 vive em `BACKLOG.md`, que é
// arquivo CONGELADO da fase visual. Era o R-034 em miniatura: controle que
// existe só em comentário de código não existe. O gating é a T-016 e está em
// `lib/auth/status.ts`, aplicado pelo `middleware.ts` e por `requirePainel`.
//
// Quem já foi aprovado NÃO entra aqui: ler "estamos validando seu cadastro"
// depois de ativo é mentira de tela. `SO_ESPERANDO` devolve o `active` para o
// painel e o `incomplete` para o onboarding.

export default async function VetAguardandoPage() {
  await requirePainel("vet", SO_ESPERANDO);
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
