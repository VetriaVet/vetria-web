import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export const metadata = {
  title: "Aguardando validação",
};

// Estado "aguardando validação" da clínica (pending_validation, CONTEXT §4.3).
// Casca: acessível pra qualquer clínica logada visualizar — gating real é a
// TASK-032 (vermelha). Timeline espelha o pipeline do dashboard (DL-020).

export default async function ClinicAguardandoPage() {
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
    <div className="max-w-2xl mx-auto">
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-principal text-white px-8 py-12 text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-white/15 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <ClockIcon />
          </div>
          <h1 className="font-bold text-[26px] sm:text-[30px] leading-tight mb-3">
            Estamos validando o cadastro da clínica.
          </h1>
          <p className="text-[15px] text-white/80 leading-relaxed max-w-md mx-auto">
            Recebemos os dados e estamos confirmando as informações da clínica.
            Você recebe um email assim que tudo estiver pronto.
          </p>
        </div>

        <div className="p-8">
          <h2 className="font-bold text-lg text-titulo mb-5">
            O que está acontecendo agora
          </h2>

          <ol className="flex flex-col mb-8">
            <TimelineItem
              state="done"
              title="Cadastro recebido"
              desc="Os dados da clínica foram registrados com segurança."
            />
            <TimelineItem
              state="active"
              title="Validação dos dados"
              desc="Em andamento · costuma levar até 48h úteis."
            />
            <TimelineItem
              state="pending"
              title="Clínica aprovada e ativa"
              desc="Você recebe um email e a clínica entra na busca pública."
              last
            />
          </ol>

          <h2 className="font-bold text-lg text-titulo mb-3">
            Enquanto isso, você pode
          </h2>
          <Link
            href="/app/clinic/perfil"
            className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-5 hover:border-principal hover:shadow-sm transition no-underline"
          >
            <span className="w-10 h-10 rounded-lg bg-fundo-destaque text-principal flex items-center justify-center shrink-0">
              <ImageIcon />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-titulo">
                Adiantar o perfil da clínica
              </span>
              <span className="block text-[13px] text-corpo-texto leading-relaxed">
                Deixe o perfil pronto pra aparecer na busca assim que validar.
              </span>
            </span>
            <span className="text-corpo-texto/50 group-hover:text-principal transition">
              <ArrowRightIcon />
            </span>
          </Link>

          <div className="flex gap-3 mt-6 rounded-xl bg-fundo-destaque p-4">
            <span className="text-principal shrink-0 mt-0.5">
              <InfoIcon />
            </span>
            <p className="text-[13px] text-corpo-texto leading-relaxed">
              <strong className="text-titulo">Passou de 48h?</strong> Se a
              validação demorar mais que o previsto, a gente te avisa por email
              — não precisa fazer nada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type TLState = "done" | "active" | "pending";

function TimelineItem({
  state,
  title,
  desc,
  last,
}: {
  state: TLState;
  title: string;
  desc: string;
  last?: boolean;
}) {
  const marker =
    state === "done" ? (
      <span className="w-10 h-10 rounded-full bg-principal text-white flex items-center justify-center shrink-0 z-10">
        <CheckIcon />
      </span>
    ) : state === "active" ? (
      <span className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 border-2 border-amber-400 flex items-center justify-center shrink-0 z-10 animate-pulse">
        <ClockIcon small />
      </span>
    ) : (
      <span className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 text-gray-300 flex items-center justify-center shrink-0 z-10">
        <BuildingIcon />
      </span>
    );

  return (
    <li className="flex gap-4 relative pb-6 last:pb-0">
      {!last && (
        <span
          className={`absolute left-[19px] top-10 bottom-0 w-0.5 ${
            state === "done" ? "bg-principal" : "bg-gray-200"
          }`}
        />
      )}
      {marker}
      <div className="flex-1 pt-1.5">
        <div
          className={`font-medium text-[15px] mb-0.5 ${
            state === "pending" ? "text-corpo-texto/60" : "text-titulo"
          }`}
        >
          {title}
        </div>
        <div className="text-[13px] text-corpo-texto leading-relaxed">{desc}</div>
      </div>
    </li>
  );
}

function ClockIcon({ small }: { small?: boolean }) {
  const s = small ? 18 : 32;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
