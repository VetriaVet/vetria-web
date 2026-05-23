"use client";

import { createClient } from "../../lib/supabase/browser";

// Lógica de signOut preservada (TASK-034 só ajustou o visual + className opcional).
export default function LogoutButton({ className }: { className?: string }) {
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const defaultClass =
    "rounded-pill border border-gray-200 px-4 py-2 text-sm text-corpo-texto hover:border-principal hover:text-principal transition";

  return (
    <button onClick={logout} className={className ?? defaultClass}>
      Sair
    </button>
  );
}
