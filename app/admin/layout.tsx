import Link from "next/link";
import Image from "next/image";
import LogoutButton from "../app/LogoutButton";
import { createClient } from "@/lib/supabase/server";

// Admin tem layout próprio (dark/denso, DL-022 não se aplica — linguagem distinta).

// ⚠️ R-054 (T-023) — `soMaster` é a última linha da matriz de rotas (§2):
// `/admin/usuarios` é ❌ para admin comum. Quem recusa de verdade é o
// `requireMaster()` da própria página; esconder o item aqui é só não deixar no
// menu um link que leva a um redirect.
const NAV_OPERACAO = [
  { label: "Dashboard", href: "/admin", enabled: true, soMaster: false },
  { label: "Usuários", href: "/admin/usuarios", enabled: true, soMaster: true },
  { label: "Validações", href: "/admin/validacoes", enabled: true, soMaster: false },
  { label: "Moderação", href: "/admin/moderacao", enabled: true, soMaster: false },
  { label: "Conteúdo", href: "/admin/conteudo", enabled: true, soMaster: false },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Uma leitura de `admin_level`, só para desenhar o menu. Ela NÃO autoriza
  // nada: quem autoriza é o `requireMaster()` de `/admin/usuarios`. Se a
  // leitura falhar, o item some (errar fechado) e a página continua sendo a
  // única dona da decisão.
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { data: perfil } = userData.user
    ? await supabase
        .from("profiles")
        .select("admin_level")
        .eq("id", userData.user.id)
        .single<{ admin_level: string | null }>()
    : { data: null };

  const ehMaster = perfil?.admin_level === "master";
  const navegacao = NAV_OPERACAO.filter((item) => !item.soMaster || ehMaster);

  return (
    <div className="grid lg:grid-cols-[240px_1fr] min-h-screen bg-[#0F1F22] text-gray-200">
      <aside className="bg-[#0A1517] border-r border-white/[0.06] p-4 flex flex-col">
        <div className="flex items-center gap-2.5 px-2 pb-4 mb-3 border-b border-white/[0.06]">
          <Image src="/vetria/logo-vetria-fundo-escuro.svg" alt="Vetria" width={178} height={29} className="h-[22px] w-auto" />
          <span className="w-fit bg-red-500 text-white text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-pill">
            Admin
          </span>
        </div>

        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 px-2 pt-3 pb-1.5">
          Operação
        </div>
        <nav className="flex flex-col gap-px">
          {navegacao.map((item) =>
            item.enabled && item.href ? (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium text-white/70 hover:bg-white/[0.04] hover:text-white transition no-underline"
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="flex items-center justify-between px-2.5 py-2 rounded-md text-[13px] font-medium text-white/40 cursor-not-allowed"
                title="Em breve"
              >
                {item.label}
                <span className="text-[9px] uppercase tracking-wider bg-white/[0.06] px-1.5 py-0.5 rounded-pill">
                  em breve
                </span>
              </span>
            )
          )}
        </nav>

        <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <Link href="/app" className="text-[12px] text-white/50 hover:text-white transition no-underline">
            ← Voltar ao app
          </Link>
          <LogoutButton className="rounded-pill border border-white/15 text-white/70 px-3 py-1.5 text-[12px] hover:bg-white/[0.06] transition" />
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
