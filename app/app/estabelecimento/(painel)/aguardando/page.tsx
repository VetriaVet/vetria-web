import { requirePainel } from "@/lib/auth/painel";
import { ONBOARDING, SO_ESPERANDO } from "@/lib/auth/status";
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
//
// ⚠️ T-025 — mesma condição da gêmea do veterinário, e pelo mesmo motivo:
// `ONBOARDING` é a lista de `lib/auth/status.ts` IMPORTADA, a mesma que o
// `middleware.ts` aplica. O link de volta ao cadastro não pode sobreviver a uma
// mudança da matriz §4 que feche `/onboarding` para quem espera. `suspended`
// não chega até aqui: vai para `/bloqueado` e fica lá.
//
// O aviso sobre salvar de novo cita os campos que fazem o trigger de
// revalidação disparar NESTA persona (`cnpj`, `razao_social`, `nome_fantasia` e
// o documento, em `0002_nucleo.sql:388-436`). São outros campos que os do
// veterinário, e por isso o texto não é compartilhado entre as duas telas.

export default async function ClinicAguardandoPage() {
  const { status } = await requirePainel("clinic", SO_ESPERANDO);
  const podeRever = (ONBOARDING as readonly string[]).includes(status);

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
      rever={
        podeRever
          ? {
              href: "/app/estabelecimento/onboarding",
              title: "Rever e corrigir o cadastro",
              desc: "Abre o formulário preenchido com o que está salvo. As alterações só são gravadas quando você chega ao fim e salva.",
              aviso:
                "a validação passa a conferir a versão mais nova do cadastro. Mexer no CNPJ, na razão social, no nome fantasia ou no documento enviado altera justamente o dado que está sendo conferido, então a conferência pode recomeçar, e a gente ainda não garante que a posição do estabelecimento na fila se mantém. Depois de aprovado, mudar esses campos devolve o perfil para revisão, e ele sai da busca até a nova conferência.",
            }
          : null
      }
      perfil={{
        href: "/app/estabelecimento/perfil",
        title: "Ver a tela do perfil público",
        desc: "Ainda em construção: por enquanto ela não mostra o que o estabelecimento mandou no cadastro, e salvar não funciona. O que a equipe confere é o cadastro.",
      }}
    />
  );
}
