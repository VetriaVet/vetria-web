import Link from "next/link";
import Image from "next/image";
import LogoutButton from "../app/LogoutButton";

// Admin tem layout próprio (dark/denso, DL-022 não se aplica — linguagem distinta).

const NAV_OPERACAO = [
  { label: "Dashboard", href: "/admin", enabled: true },
  { label: "Usuários", href: "/admin/usuarios", enabled: true },
  { label: "Validações", href: "/admin/validacoes", enabled: true },
  { label: "Moderação", href: "/admin/moderacao", enabled: true },
  { label: "Conteúdo", href: "/admin/conteudo", enabled: true },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid lg:grid-cols-[240px_1fr] min-h-screen bg-[#0F1F22] text-gray-200">
      <aside className="bg-[#0A1517] border-r border-white/[0.06] p-4 flex flex-col">
        <div className="flex items-center gap-2.5 px-2 pb-4 mb-3 border-b border-white/[0.06]">
          <Image src="/vetria/logo-square.png" alt="Vetria" width={28} height={28} className="rounded" />
          <div>
            <span className="font-bold text-white">Vetria</span>
            <span className="block w-fit bg-red-500 text-white text-[9px] font-bold uppercase tracking-[0.14em] px-2 py-0.5 rounded-pill mt-0.5">
              Admin
            </span>
          </div>
        </div>

        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 px-2 pt-3 pb-1.5">
          Operação
        </div>
        <nav className="flex flex-col gap-px">
          {NAV_OPERACAO.map((item) =>
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
