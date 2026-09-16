import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClinicOnboardingForm from "./ClinicOnboardingForm";
import { salvarOnboardingClinic } from "./actions";
import { VAZIO, type ClinicOnboardingInicial } from "./campos";

export const metadata = {
  title: "Configurar cadastro do estabelecimento",
};

type LinhaClinic = {
  nome_fantasia: string | null;
  endereco: string | null;
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  sobre: string | null;
  servicos: string[] | null;
};

type LinhaPrivada = {
  whatsapp: string | null;
  razao_social: string | null;
  cnpj: string | null;
  responsavel_tecnico: string | null;
  documento_enviado_em: string | null;
};

export default async function ClinicOnboardingPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single<{ role: string; status: string }>();

  if (!profile || profile.role !== "clinic") redirect("/app");

  // ⚠️ T-007 — o portão desta página é `status`, e NÃO `onboarding_completed`.
  //
  // Este arquivo é clone do `page.tsx` do veterinário (T-006), por condição do
  // parecer de 09/09. A versão anterior fazia
  // `if (profile.onboarding_completed) redirect(...)`: como a conclusão não
  // gravava nada, o formulário era porta de mão única pra lugar nenhum, e a
  // coluna que sustentava o portão é escrita pelo próprio usuário pela API
  // (SEC-061 / R-040). Aqui ela some do caminho: quem decide é `profiles.status`,
  // que a policy 7.2 da `0002` pina no WITH CHECK.
  //
  // A matriz (§4) diz que `pending_validation` alcança /aguardando, /perfil e
  // /configuracoes, e que "enquanto espera, ele edita o perfil" (DL-046). O
  // editor de `/perfil` do estabelecimento ainda é casca, então HOJE este
  // formulário é a única superfície de edição que existe.
  //
  // `active` sai daqui de propósito: desde a `0003`, mexer em CNPJ, razão
  // social, responsável técnico ou nome fantasia devolve o estabelecimento
  // para `pending_validation` e o TIRA da busca. Isso é assunto do editor de
  // perfil da S3, que vai avisar antes, e não de uma tela chamada "onboarding".
  //
  // ⚠️ SEC-052 — LISTA DE PERMITIDOS, e não de negados. No dia em que a S4 ou a
  // F6 acrescentar `rejected` ou `deleted` ao enum, o valor novo fica barrado
  // até alguém decidir o contrário, em vez de entrar por padrão.
  //
  // ⚠️ Isto NÃO é o portão de status do painel (R-038 / SEC-059). As páginas de
  // `(painel)/` continuam sem ler `status`, e isso é a T-016 de propósito: o
  // parecer pede que a T-007 não improvise esse portão aqui.
  const PODEM_EDITAR_AQUI = ["incomplete", "pending_validation"];
  if (!PODEM_EDITAR_AQUI.includes(profile.status)) {
    redirect("/app/estabelecimento");
  }

  // Abre preenchido com o que já está no banco. Sem isto, quem voltasse pra
  // corrigir uma linha salvaria o formulário vazio por cima do resto.
  const { data: clinic } = await supabase
    .from("clinic_profiles")
    .select("nome_fantasia, endereco, cep, cidade, estado, sobre, servicos")
    .eq("id", user.id)
    .maybeSingle<LinhaClinic>();

  // ⚠️ `perfil_privado` só é lido aqui porque quem lê é o DONO da linha, na
  // própria tela dele, e a policy `perfil_privado_select_own` é exatamente
  // isso. Vale para o WhatsApp (DL-047 fala de busca e perfil público, onde
  // quem lê é outra pessoa) e vale para CNPJ, razão social e responsável
  // técnico: são privados por decisão (DL-053) e não podem aparecer em nada
  // público, nem na busca, nem no perfil da F4/S7. Aqui aparecem para que quem
  // volta corrigir um campo não apague os outros três.
  //
  // ⚠️ T-008 — `documento_enviado_em` entra no mesmo `select`, e é só ele.
  // `documento_path` e `documento_hash` NÃO vêm para a tela: o caminho é dado
  // de servidor (quem precisa dele é a rota de leitura, que o busca de novo) e
  // pôr a string no HTML seria convidar a próxima tela a montar URL com ela.
  // O que a tela precisa saber é uma coisa só: existe documento, e de quando.
  const { data: privado } = await supabase
    .from("perfil_privado")
    .select("whatsapp, razao_social, cnpj, responsavel_tecnico, documento_enviado_em")
    .eq("id", user.id)
    .maybeSingle<LinhaPrivada>();

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    name?: string;
  };
  const nomeDoCadastro = (meta.full_name ?? meta.name ?? "").trim();

  const inicial: ClinicOnboardingInicial = {
    ...VAZIO,
    nomeFantasia: clinic?.nome_fantasia ?? nomeDoCadastro,
    razaoSocial: privado?.razao_social ?? "",
    cnpj: privado?.cnpj ?? "",
    responsavelTecnico: privado?.responsavel_tecnico ?? "",
    endereco: clinic?.endereco ?? "",
    cep: clinic?.cep ?? "",
    cidade: clinic?.cidade ?? "",
    estado: clinic?.estado ?? "",
    sobre: clinic?.sobre ?? "",
    servicos: clinic?.servicos ?? [],
    whatsapp: privado?.whatsapp ?? "",
  };

  return (
    <ClinicOnboardingForm
      inicial={inicial}
      modo={profile.status === "pending_validation" ? "revisao" : "novo"}
      documentoEnviadoEm={privado?.documento_enviado_em ?? null}
      action={salvarOnboardingClinic}
    />
  );
}
