import { requirePainel } from "@/lib/auth/painel";
import { ONBOARDING, SO_ESPERANDO } from "@/lib/auth/status";
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
//
// ⚠️ T-025 — O LINK DE VOLTA AO ONBOARDING, E A CONDIÇÃO DELE.
//
// `ONBOARDING` é a MESMA constante que o `middleware.ts` e o guard da página de
// onboarding aplicam (`lib/auth/status.ts`), importada e não copiada. É isso que
// impede a tela de oferecer uma porta que o portão fecha: o dia em que a matriz
// §4 tirar `pending_validation` de `/onboarding`, este link desaparece no mesmo
// gesto, sem ninguém abrir este arquivo.
//
// Hoje a comparação é verdadeira para todo mundo que chega aqui, porque
// `SO_ESPERANDO` só deixa entrar `pending_validation`, que está em `ONBOARDING`.
// Escrever `rever={{...}}` direto seria mais curto e estaria certo por
// coincidência de duas listas que ninguém prometeu manter iguais. `suspended`
// nem alcança esta página: ele é mandado para `/bloqueado` e fica lá, que é o
// que impede laço de redirect (matriz §4 e `ehStatusDeBloqueio`).

export default async function VetAguardandoPage() {
  const { status } = await requirePainel("vet", SO_ESPERANDO);
  const podeRever = (ONBOARDING as readonly string[]).includes(status);

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
      rever={
        podeRever
          ? {
              href: "/app/veterinario/onboarding",
              title: "Rever e corrigir o cadastro",
              desc: "Abre o formulário preenchido com o que está salvo. As alterações só são gravadas quando você chega ao fim e salva.",
              aviso:
                "a validação passa a conferir a versão mais nova do cadastro. Mexer no CRMV, na UF do CRMV, no nome de exibição ou no documento enviado altera justamente o dado que está sendo conferido, então a conferência pode recomeçar, e a gente ainda não garante que a sua posição na fila se mantém. Depois de aprovado, mudar esses campos devolve o perfil para revisão, e ele sai da busca até a nova conferência.",
            }
          : null
      }
      perfil={{
        href: "/app/veterinario/perfil",
        title: "Ver a prévia do seu perfil público",
        desc: "Mostra o seu perfil do jeito que os responsáveis vão ver depois da validação, com os dados do seu cadastro. Por enquanto ele ainda não está visível para eles.",
      }}
    />
  );
}
