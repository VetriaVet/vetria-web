import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export const metadata = {
  title: "Avaliações",
};

// Avaliações do tutor — casca fiel (DL-020). Avaliações são Sprint 5; sem
// atendimentos reais, é um empty-state honesto (sem mock de estrelas/reviews).

export default async function TutorAvaliacoesPage() {
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

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-bold text-2xl text-titulo">Suas avaliações</h1>
        <p className="text-[14px] text-corpo-texto mt-1 max-w-xl leading-relaxed">
          Sua opinião ajuda outros tutores a escolher com confiança e ajuda os
          profissionais a melhorar o atendimento.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-fundo-destaque text-principal flex items-center justify-center">
          <StarIcon />
        </div>
        <h2 className="font-bold text-xl text-titulo mb-2">
          Você ainda não avaliou ninguém
        </h2>
        <p className="text-[14px] text-corpo-texto leading-relaxed max-w-md mx-auto">
          {/* TODO: avaliações reais após atendimento (Sprint 5) */}
          Depois de uma consulta marcada pela Vetria, você poderá avaliar o
          profissional aqui. Suas avaliações ficam reunidas nesta página.
        </p>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.5 2.8a.6.6 0 0 1 1 0l2.4 5 5.4.8a.6.6 0 0 1 .3 1l-3.9 3.8.9 5.4a.6.6 0 0 1-.9.6l-4.8-2.5-4.8 2.5a.6.6 0 0 1-.9-.6l.9-5.4L2.4 9.6a.6.6 0 0 1 .3-1l5.4-.8z" />
    </svg>
  );
}
