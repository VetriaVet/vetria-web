import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export const metadata = {
  title: "Equipe",
};

// Equipe da clínica — casca fiel (DL-020). Sem profissionais fake nem aviso de
// plano (planos = Sprint 6). Empty-state que descreve o fluxo de convite que
// chega com clinic_profiles + vínculos (migration 029/031). Convite desabilitado.

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-bold text-2xl text-titulo">Equipe</h1>
          <p className="text-[14px] text-corpo-texto mt-1 max-w-2xl">
            Gerencie os profissionais que atendem na sua clínica. Cada um tem
            perfil próprio vinculado.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="shrink-0 inline-flex items-center gap-2 rounded-pill bg-principal/40 text-white px-5 py-2.5 font-semibold text-sm cursor-not-allowed"
        >
          {/* TODO: fluxo de convite por email (migration 029/031) */}
          <UserPlusIcon />
          Convidar profissional (em breve)
        </button>
      </div>

      {/* Empty-state */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8 sm:p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-fundo-destaque text-principal flex items-center justify-center">
          <UsersIcon />
        </div>
        <h2 className="font-bold text-xl text-titulo mb-2">
          Sua equipe ainda está vazia
        </h2>
        <p className="text-[14px] text-corpo-texto leading-relaxed max-w-md mx-auto mb-8">
          Em breve você poderá convidar veterinários por email. Cada um preenche
          o próprio cadastro e, depois de validado, aparece no perfil público da
          clínica.
        </p>

        {/* Como vai funcionar */}
        <div className="grid sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
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
            title="Entra na clínica"
            desc="Após validado, aparece vinculado ao perfil da clínica."
          />
        </div>
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
    <div className="rounded-2xl border border-gray-200 p-5">
      <div className="w-7 h-7 rounded-full bg-principal text-white flex items-center justify-center text-sm font-bold mb-3">
        {n}
      </div>
      <div className="font-semibold text-sm text-titulo mb-1">{title}</div>
      <p className="text-[12px] text-corpo-texto leading-relaxed">{desc}</p>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserPlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}
