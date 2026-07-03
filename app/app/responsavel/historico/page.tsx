import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { CalendarClock } from "lucide-react";

export const metadata = {
  title: "Histórico",
};

// Histórico de agendamentos do tutor — casca (DL-020). Agendamento é fase de
// backend; sem consultas reais, usa estado GHOST (DL-034): mostra o formato
// dos cards de consulta (data + profissional + status) sem inventar dado.

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

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-titulo">Seus agendamentos</h1>
        <p className="mt-1 text-[14px] text-corpo-texto">
          Aqui ficam as consultas que você marcar pela Vetria.
        </p>
      </div>

      {/* TODO: lista de agendamentos real + abas Próximos/Realizados/Cancelados */}
      <EmptyState
        icon={CalendarClock}
        preview={
          <div className="mb-6 space-y-3 [mask-image:linear-gradient(to_bottom,black,transparent)]">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-neutro-border-soft bg-neutro-bg-alt/40 p-4"
              >
                <Skeleton className="h-14 w-12 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-2.5 w-3/5" />
                  <Skeleton className="h-4 w-20 rounded-pill" />
                </div>
                <Skeleton className="h-6 w-24 shrink-0 rounded-pill" />
              </div>
            ))}
          </div>
        }
        title="Nenhum agendamento ainda"
        description="Quando você marcar uma consulta pela Vetria, ela aparece aqui, com data, profissional, especialidade e status (confirmado, realizado ou cancelado)."
      />
    </div>
  );
}
