import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";

// Raiz da app: sem sessão vai pro login; com sessão vai pro /app
// (que roteia por role). Substitui o boilerplate default do Next.js.
export default async function Home() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) redirect("/login");
  redirect("/app");
}
