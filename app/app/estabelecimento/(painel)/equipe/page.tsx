import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { Users, UserPlus } from "lucide-react";

// Equipe da clínica — casca (DL-020). Sem profissionais fake nem aviso de
// plano (planos = Sprint 6). Estado GHOST (DL-034): mostra o formato da lista
// de profissionais (avatar + nome/CRMV + status) + o fluxo de convite que
// chega com clinic_profiles + vínculos (migration 029/031). Convite desabilitado.

export const metadata = {
  title: "Equipe",
};

export default async function ClinicEquipePage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "clinic") redirect("/app");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-titulo">Equipe</h1>
          <p className="mt-1 max-w-2xl text-[14px] text-corpo-texto">
            Gerencie os profissionais que atendem no seu estabelecimento. Cada um tem
            perfil próprio vinculado.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex shrink-0 cursor-not-allowed items-center gap-2 rounded-pill bg-principal/40 px-5 py-2.5 text-sm font-semibold text-white"
        >
          {/* TODO: fluxo de convite por email (migration 029/031) */}
          <UserPlus size={16} />
          Convidar profissional (em breve)
        </button>
      </div>

      <EmptyState
        icon={Users}
        preview={
          <div className="mb-6 space-y-3 [mask-image:linear-gradient(to_bottom,black,transparent)]">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-neutro-border-soft bg-neutro-bg-alt/40 p-4"
              >
                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/5" />
                  <Skeleton className="h-2.5 w-1/4" />
                </div>
                <Skeleton className="h-6 w-20 shrink-0 rounded-pill" />
              </div>
            ))}
          </div>
        }
        title="Sua equipe ainda está vazia"
        description="Você poderá convidar veterinários por email. Cada um preenche o próprio cadastro e, depois de validado, aparece aqui e no perfil público do estabelecimento."
      />

      {/* Como vai funcionar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StepCard
          n={1}
          title="Você convida"
          desc="Envia o convite por email pro profissional."
        />
        <StepCard
          n={2}
          title="Ele se cadastra"
          desc="O veterinário preenche o próprio perfil e CRMV."
        />
        <StepCard
          n={3}
          title="Entra no estabelecimento"
          desc="Após validado, aparece vinculado ao perfil do estabelecimento."
        />
      </div>
    </div>
  );
}

function StepCard({
  n,
  title,
  desc,
}: {
  n: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-neutro-border p-5">
      <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-full bg-principal text-sm font-bold text-white">
        {n}
      </div>
      <div className="mb-1 text-sm font-semibold text-titulo">{title}</div>
      <p className="text-[12px] leading-relaxed text-corpo-texto">{desc}</p>
    </div>
  );
}
