import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";

export const metadata = {
  title: "Seus contatos",
};

// Histórico do responsável: casca de "Seus contatos" (DL-020). T-055 tirou
// daqui a promessa de agendamento (fora da entrega de 25/11). A lista real
// chega na T-042, com os profissionais que o responsável chamou pela Vetria.
// Até lá, estado GHOST (DL-034): o formato da linha (profissional + data +
// canal) sem inventar dado.

export default async function TutorHistoricoPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "tutor") redirect("/app");

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-titulo">Seus contatos</h1>
        <p className="mt-1 text-[14px] text-corpo-texto">
          Os veterinários e estabelecimentos que você chamou pela Vetria.
        </p>
      </div>

      {/* TODO (T-042): lista real dos contatos, lida pela sessão do dono */}
      <EmptyState
        icon={MessageCircle}
        preview={
          <div className="mb-6 space-y-3 [mask-image:linear-gradient(to_bottom,black,transparent)]">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-neutro-border-soft bg-neutro-bg-alt/40 p-4"
              >
                <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-2/5" />
                  <Skeleton className="h-2.5 w-1/4" />
                </div>
                <Skeleton className="h-6 w-20 shrink-0 rounded-pill" />
              </div>
            ))}
          </div>
        }
        title="Nenhum contato ainda"
        description="Seus contatos aparecem aqui quando você chamar um veterinário ou estabelecimento pelo perfil dele na Vetria, com a data e o canal usado."
        action={
          <Link
            href="/buscar"
            className="inline-flex items-center justify-center gap-2 rounded-pill bg-principal px-5 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-principal-deep"
          >
            <Search size={16} aria-hidden />
            Buscar profissionais
          </Link>
        }
      />
    </div>
  );
}
