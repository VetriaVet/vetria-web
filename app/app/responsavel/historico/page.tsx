import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarSeusContatos } from "@/lib/contato/leitura";
import { SeusContatosLista } from "@/components/app/Contatos";

export const metadata = {
  title: "Seus contatos",
};

// T-042 · "Seus contatos" do responsável (desenho §6 da T-039, DL-047): os
// veterinários e estabelecimentos que a pessoa chamou pela Vetria, com a data,
// e "Chamar de novo" levando ao bloco de contato do perfil (o mesmo POST de
// sempre). Sem agendamento: fora da entrega de 25/11.
//
// A leitura sai pela sessão do dono (policy `contatos_select_responsavel`).
// Os contatos feitos antes de ter conta, neste navegador, chegam aqui pelo
// vínculo da criação de conta (`lib/contato/vincular.ts`, D10).

export default async function TutorHistoricoPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "tutor") redirect("/app");

  const dados = await carregarSeusContatos(user.id);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-titulo">Seus contatos</h1>
        <p className="mt-1 text-[14px] text-corpo-texto">
          Os veterinários e estabelecimentos que você chamou pela Vetria.
        </p>
      </div>

      <SeusContatosLista dados={dados} />
    </div>
  );
}
