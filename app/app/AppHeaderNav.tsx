"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

// Parte interativa do header /app (DL-018): nav desktop + sino de notificações
// (dropdown vazio, preparado pra ligar) + menu hambúrguer no mobile.
// Notificações são casca honesta: estado vazio, sem dado fake (// TODO ligar).

type NavLink = { href: string; label: string };

export default function AppHeaderNav({ nav }: { nav: NavLink[] }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Nav desktop */}
      <nav className="hidden md:flex items-center gap-5 mr-1">
        {nav.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm text-corpo-texto hover:text-principal transition"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <NotificationBell />

      <div className="hidden md:block">
        <LogoutButton />
      </div>

      {/* Hambúrguer mobile */}
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
        className="md:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg text-titulo hover:bg-fundo-claro transition"
      >
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Drawer mobile */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-16 right-0 left-0 z-50 md:hidden bg-white border-b border-gray-100 shadow-lg">
            <nav className="flex flex-col p-4 gap-1">
              {nav.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm text-titulo hover:bg-fundo-claro transition"
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-2 mt-1 border-t border-gray-100">
                <LogoutButton className="w-full rounded-pill border border-gray-200 px-4 py-2.5 text-sm text-corpo-texto hover:border-principal hover:text-principal transition" />
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        aria-expanded={open}
        className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-corpo-texto hover:bg-fundo-claro hover:text-titulo transition"
      >
        <BellIcon />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-lg z-50 p-4">
            <div className="font-semibold text-sm text-titulo mb-1">
              Notificações
            </div>
            {/* TODO: ligar a notificações reais (fase pesada) */}
            <p className="text-[13px] text-corpo-texto leading-relaxed">
              Sem notificações ainda. Quando algo acontecer no seu perfil, você é
              avisado por aqui.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h16M4 6h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
