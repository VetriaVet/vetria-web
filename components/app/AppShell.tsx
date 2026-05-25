"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  MessageCircle,
  Calendar,
  Star,
  Crown,
  Settings,
  HelpCircle,
  Users,
  Building2,
  Bell,
  Search,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import LogoutButton from "@/app/app/LogoutButton";

// Shell premium dos painéis B2B (vet/clínica) — DL-032. Sidebar verde à
// esquerda (seções Principal/Conta + rodapé do usuário) + topbar (hambúrguer
// mobile, busca e sino). Casca honesta (DL-020): itens sem rota ainda viram
// "em breve" desabilitados — nunca linkam 404. Tutor NÃO usa este shell
// (segue no header topo — lado humano, DL-026).

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  user: User,
  message: MessageCircle,
  calendar: Calendar,
  star: Star,
  crown: Crown,
  settings: Settings,
  help: HelpCircle,
  users: Users,
  building: Building2,
};

export type ShellNavItem = {
  label: string;
  href?: string;
  icon: keyof typeof ICONS;
  soon?: boolean;
};
export type ShellSection = { title: string; items: ShellNavItem[] };
export type ShellUser = { name: string; meta: string; initial: string };

export default function AppShell({
  sections,
  user,
  homeHref,
  children,
}: {
  sections: ShellSection[];
  user: ShellUser;
  homeHref: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const sidebarInner = (
    <>
      <div className="flex items-center justify-between gap-2.5 px-5 h-16 shrink-0">
        <Link
          href={homeHref}
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-2.5 no-underline"
        >
          <Image
            src="/vetria/logo-vetria-fundo-escuro.svg"
            alt="Vetria"
            width={178}
            height={29}
            className="h-6 w-auto"
          />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
          className="md:hidden text-white/60 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-2 text-[11px] uppercase tracking-[0.14em] text-white/40">
              {section.title}
            </div>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = item.href && pathname === item.href;
                const base =
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition";

                if (item.soon || !item.href) {
                  return (
                    <li key={item.label}>
                      <span
                        className={`${base} text-white/40 cursor-default`}
                        title="Em breve"
                      >
                        <Icon size={18} aria-hidden />
                        <span className="flex-1">{item.label}</span>
                        <span className="text-[9px] uppercase tracking-wider rounded-pill bg-white/10 px-1.5 py-0.5">
                          em breve
                        </span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`${base} ${
                        active
                          ? "bg-white/15 text-white font-medium"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon size={18} aria-hidden />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center font-semibold text-sm shrink-0">
          {user.initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {user.name}
          </div>
          <div className="text-[11px] text-white/50 truncate">{user.meta}</div>
        </div>
        <LogoutButton className="text-[11px] text-white/50 hover:text-white transition shrink-0" />
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-fundo-claro/30">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 shrink-0 bg-principal flex-col sticky top-0 h-screen">
        {sidebarInner}
      </aside>

      {/* Sidebar mobile (drawer) */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-principal flex flex-col z-50 md:hidden">
            {sidebarInner}
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-gray-100 bg-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg text-titulo hover:bg-fundo-claro transition"
            >
              <Menu size={20} />
            </button>
            <Link
              href={homeHref}
              className="md:hidden inline-flex items-center gap-2 no-underline"
            >
              <Image
                src="/vetria/logo-vetria-fundo-claro.svg"
                alt="Vetria"
                width={178}
                height={29}
                className="h-6 w-auto"
              />
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Buscar"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-corpo-texto hover:bg-fundo-claro hover:text-titulo transition"
            >
              <Search size={18} />
            </button>
            <button
              type="button"
              aria-label="Notificações"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-corpo-texto hover:bg-fundo-claro hover:text-titulo transition"
            >
              <Bell size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1200px] mx-auto p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
