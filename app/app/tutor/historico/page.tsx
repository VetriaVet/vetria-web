import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export const metadata = {
  title: "Histórico",
};

// Histórico de agendamentos do tutor — casca fiel (DL-020). Agendamento é
// Sprint 4; sem consultas reais, é um empty-state honesto (sem mock).

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
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-bold text-2xl text-titulo">Seus agendamentos</h1>
        <p className="text-[14px] text-corpo-texto mt-1">
          Aqui ficam as consultas que você marcar pela Vetria.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-fundo-destaque text-principal flex items-center justify-center">
          <CalendarIcon />
        </div>
        <h2 className="font-bold text-xl text-titulo mb-2">
          Nenhum agendamento ainda
        </h2>
        <p className="text-[14px] text-corpo-texto leading-relaxed max-w-md mx-auto">
          {/* TODO: lista de agendamentos real (Sprint 4 — Google Calendar) */}
          Em breve você vai poder buscar profissionais e marcar consultas direto
          pela Vetria. Suas consultas passadas e futuras aparecem aqui.
        </p>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
