import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export const metadata = {
  title: "Admin",
};

const SECOES = [
  { href: "/admin/usuarios", label: "Usuários", desc: "Gerencie role e nível de acesso." },
  { href: "/admin/validacoes", label: "Validações", desc: "Aprove CRMV de veterinários e estabelecimentos." },
  { href: "/admin/moderacao", label: "Moderação", desc: "Avaliações e conteúdo reportado." },
  { href: "/admin/conteudo", label: "Conteúdo", desc: "Especialidades e textos da plataforma." },
];

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, admin_level, admin_team")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/app");

  return (
    <div>
      <header className="bg-[#0F1F22]/90 backdrop-blur border-b border-white/[0.06] px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="font-bold text-lg text-white">Dashboard administrativo</h1>
        <span className="text-[12px] text-white/50">
          level: <b className="text-white/80">{profile.admin_level ?? "-"}</b> · team:{" "}
          <b className="text-white/80">{profile.admin_team ?? "-"}</b>
        </span>
      </header>

      <div className="p-6 max-w-[1280px] mx-auto flex flex-col gap-6">
        {/* Stats — TODO: métricas reais (contagens do banco) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AdminStat label="Usuários totais" />
          <AdminStat label="Veterinários ativos" />
          <AdminStat label="Validações pendentes" />
          <AdminStat label="Moderação aberta" />
        </div>

        {/* Seções */}
        <div className="grid sm:grid-cols-2 gap-3">
          {SECOES.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-md border border-white/[0.06] bg-[#1A2A2D] p-5 hover:border-white/20 transition no-underline block"
            >
              <div className="font-bold text-white mb-1">{s.label}</div>
              <div className="text-[13px] text-white/50">{s.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminStat({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-[#1A2A2D] p-[18px]">
      <div className="text-[11px] uppercase tracking-[0.08em] text-white/50 mb-2">
        {label}
      </div>
      {/* TODO: métricas reais (contagens do banco) — fase de backend */}
      <span
        aria-hidden
        className="block h-7 w-12 animate-pulse rounded bg-white/10"
      />
      <div className="text-[12px] text-white/40 mt-2">Em breve</div>
    </div>
  );
}
