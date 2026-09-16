import { requireContaBloqueada } from "@/lib/auth/painel";
import ContaBloqueada from "@/components/app/ContaBloqueada";

export const metadata = { title: "Conta bloqueada" };

// Matriz §4: `suspended` alcança a tela de bloqueio com motivo, e mais nada.
// Fica FORA do route group `(painel)` para não herdar a sidebar, que só
// listaria portas fechadas. O guard é `requireContaBloqueada`, e não
// `requirePainel`, porque esta rota é o sumidouro do portão: ver o comentário
// da função em `lib/auth/painel.ts`.

export default async function VetBloqueadoPage() {
  const { motivo } = await requireContaBloqueada("vet");

  return (
    <ContaBloqueada titulo="Sua conta está bloqueada." motivo={motivo} />
  );
}
