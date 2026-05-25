import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { Star } from "lucide-react";

// Avaliações do tutor — casca (DL-020). Avaliações dependem de atendimento
// real (fase de backend); usa estado GHOST (DL-034): mostra o formato do card
// de review (profissional + estrelas + texto) sem inventar avaliação.

export const metadata = {
  title: "Avaliações",
};

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
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-titulo">Suas avaliações</h1>
        <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-corpo-texto">
          Sua opinião ajuda outros tutores a escolher com confiança e ajuda os
          profissionais a melhorar o atendimento.
        </p>
      </div>

      {/* TODO: avaliações reais após atendimento (fase de backend) */}
      <EmptyState
        icon={Star}
        preview={
          <div className="mb-6 space-y-3 [mask-image:linear-gradient(to_bottom,black,transparent)]">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-neutro-border-soft bg-neutro-bg-alt/40 p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="mt-2 h-2.5 w-4/5" />
              </div>
            ))}
          </div>
        }
        title="Você ainda não avaliou ninguém"
        description="Depois de uma consulta marcada pela Vetria, você poderá avaliar o profissional, com nota em estrelas e um comentário. Suas avaliações ficam reunidas aqui."
      />
    </div>
  );
}
