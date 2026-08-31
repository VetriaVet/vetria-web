import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VetOnboardingForm from "./VetOnboardingForm";
import { salvarOnboardingVet } from "./actions";
import { VAZIO, type VetOnboardingInicial } from "./campos";

export const metadata = {
  title: "Configurar perfil profissional",
};

type LinhaVet = {
  nome_exibicao: string | null;
  titulo: string | null;
  crmv: string | null;
  crmv_uf: string | null;
  especialidades: string[] | null;
  experiencia: string | null;
  bio: string | null;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  atende_presencial: boolean | null;
  atende_domiciliar: boolean | null;
  atende_teleorientacao: boolean | null;
};

export default async function VetOnboardingPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single<{ role: string; status: string }>();

  if (!profile || profile.role !== "vet") redirect("/app");

  // ⚠️ T-006 — o portão desta página passou a ser `status`, não
  // `onboarding_completed`.
  //
  // Antes: `if (profile.onboarding_completed) redirect(...)`. Quem clicava em
  // "Concluir" nunca mais voltava, e como a conclusão não gravava nada, o
  // formulário era uma porta de mão única pra lugar nenhum. A `0002` devolveu
  // as contas `vet` existentes pra `incomplete` e elas vão refazer o
  // onboarding: se o portão continuasse no `onboarding_completed`, quem
  // errasse o número do CRMV ficaria preso esperando uma validação que vai ser
  // reprovada.
  //
  // A matriz (§4) diz que `pending_validation` "alcança /aguardando, /perfil e
  // /configuracoes" e que "enquanto espera, ele edita o perfil" (DL-046). O
  // editor de `/perfil` ainda é casca (F3/S3), então HOJE este formulário é a
  // única superfície de edição que existe. Deixar `pending_validation` entrar
  // aqui é o que torna a promessa do DL-046 verdadeira, e não amplia acesso:
  // ele já podia gravar as mesmas colunas pelas mesmas policies.
  //
  // `active` e `suspended` saem. Para `active` o motivo é forte: editar CRMV,
  // UF ou nome de exibição dispara o trigger de revalidação e TIRA o perfil da
  // busca. Isso é assunto do editor de perfil da S3, que vai avisar antes, e
  // não de uma tela chamada "onboarding". O portão de status completo
  // (inclusive a tela de bloqueio do `suspended`) continua sendo S3: esta
  // mudança é só o guard desta página.
  //
  // ⚠️ SEC-052 — LISTA DE PERMITIDOS, e não de negados.
  // A primeira versão era `if (status === 'active' || status === 'suspended')
  // redirect(...)`, e com ela tudo que não estivesse na lista ENTRAVA. Hoje dá
  // no mesmo, porque `user_status` tem quatro valores e a coluna é `not null
  // default 'incomplete'`. Mas no dia em que a S4 ou a F6 acrescentar
  // `rejected` ou `deleted` ao enum, o valor novo entraria nesta tela por
  // padrão, sem ninguém editar este arquivo e sem nada falhar. Assim, o valor
  // novo é barrado até alguém decidir o contrário, que é o mesmo padrão de
  // `requirePainel` e do teste de role duas linhas acima.
  const PODEM_EDITAR_AQUI = ["incomplete", "pending_validation"];
  if (!PODEM_EDITAR_AQUI.includes(profile.status)) {
    redirect("/app/veterinario");
  }

  // Abre preenchido com o que já está no banco. Sem isto, quem voltasse pra
  // corrigir uma linha salvaria o formulário vazio por cima do resto.
  const { data: vet } = await supabase
    .from("vet_profiles")
    .select(
      "nome_exibicao, titulo, crmv, crmv_uf, especialidades, experiencia, bio, cidade, estado, bairro, atende_presencial, atende_domiciliar, atende_teleorientacao"
    )
    .eq("id", user.id)
    .maybeSingle<LinhaVet>();

  // `perfil_privado` só é lido aqui porque quem lê é o DONO da linha, na
  // própria tela dele, e a policy `perfil_privado_select_own` é exatamente
  // isso. A regra "WhatsApp nunca vai no HTML" (DL-047) vale pra busca e pro
  // perfil público, onde quem lê é outra pessoa.
  const { data: privado } = await supabase
    .from("perfil_privado")
    .select("whatsapp")
    .eq("id", user.id)
    .maybeSingle<{ whatsapp: string | null }>();

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const nomeDoCadastro = (meta.full_name ?? meta.name ?? "").trim();

  const inicial: VetOnboardingInicial = {
    ...VAZIO,
    nome: vet?.nome_exibicao ?? nomeDoCadastro,
    titulo: vet?.titulo ?? "",
    crmv: vet?.crmv ?? "",
    crmvUf: vet?.crmv_uf ?? "",
    especialidades: vet?.especialidades ?? [],
    experiencia: vet?.experiencia ?? "",
    cidade: vet?.cidade ?? "",
    estado: vet?.estado ?? "",
    bairro: vet?.bairro ?? "",
    atendePresencial: vet?.atende_presencial ?? false,
    atendeDomiciliar: vet?.atende_domiciliar ?? false,
    atendeTeleorientacao: vet?.atende_teleorientacao ?? false,
    bio: vet?.bio ?? "",
    whatsapp: privado?.whatsapp ?? "",
  };

  return (
    <VetOnboardingForm
      inicial={inicial}
      modo={profile.status === "pending_validation" ? "revisao" : "novo"}
      action={salvarOnboardingVet}
    />
  );
}
