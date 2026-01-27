"use client";

import { createClient } from "../../lib/supabase/browser";

export default function LogoutButton() {
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button onClick={logout} style={{ padding: 10, borderRadius: 8, marginTop: 16 }}>
      Sair
    </button>
  );
}