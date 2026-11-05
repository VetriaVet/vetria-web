import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { podeEscolherTipo } from "../../lib/auth/tipo";
import OnboardingClient from "./OnboardingClient";

export const metadata = { title: "Escolha o tipo de conta" };

// T-064 / DL-080 item 2: A TELA DE ESCOLHA DO TIPO DE CONTA.
//
// Só abre para a conta criada sem tipo (Google, ou o cadastro pelo `/login`)
// que ainda não escolheu. Qualquer outra conta volta para `/app`, que sabe o
// destino de cada uma. Quem decide se a escolha vale é o banco
// (`escolher_tipo_de_conta`, 0009), chamado por `/api/onboarding/set-role`.
//
// Esta rota está fora do `matcher` do middleware (`/app`, `/admin`), por isso
// confere a sessão aqui.
export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) redirect("/login");

  // Já escolheu (ou nasceu com tipo, ou o banco ainda não tem a 0009): não
  // escolhe de novo.
  if (!(await podeEscolherTipo(supabase, user.id))) redirect("/app");

  return <OnboardingClient />;
}
