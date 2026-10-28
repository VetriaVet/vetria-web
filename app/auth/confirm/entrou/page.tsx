import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { caminhoInternoSeguro, mascararEmail } from "@/lib/auth/link-do-email";
import { sairDaContaDoLink } from "./actions";

// SEC-112 (T-033): a tela entre o link do email e o destino.
//
// O link com `token_hash` não fica preso ao navegador que o pediu. Um atacante
// pode mandar à vítima o link da PRÓPRIA conta; ela clica, entra logada na
// conta dele sem perceber e preenche o cadastro lá. Esta tela mostra em qual
// conta a pessoa entrou antes de seguir, com o caminho de sair.
//
// POR QUE UMA TELA E NÃO UM AVISO NO DESTINO: o destino varia (onboarding,
// painel de cada perfil, o `next` que veio no link) e o aviso teria de morar
// em todos eles; um aviso de canto também passa despercebido, e é justamente
// no primeiro formulário depois do link que o estrago acontece. O custo é um
// clique a mais num fluxo que a pessoa faz uma vez (confirmar o email), e a
// tela serve também de "pronto, deu certo". A recuperação de senha não passa
// por aqui: ela já para na tela de nova senha, que mostra a conta.
//
// O `next` é relido e revalidado: a URL é do cliente.

export const metadata: Metadata = {
  title: "Email confirmado",
  robots: { index: false, follow: false },
};

const um = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v ?? null;

export default async function ContaConfirmadaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const destino = caminhoInternoSeguro(um(sp.next)) ?? "/app";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sem sessão não há conta para mostrar: o login resolve.
  if (!user) redirect("/login");

  const email = mascararEmail(user.email);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 justify-center w-full mb-10 no-underline"
        >
          <Image
            src="/vetria/logo-vetria-fundo-claro.svg"
            alt="Vetria"
            width={178}
            height={29}
            className="h-7 w-auto"
          />
        </Link>

        <div className="rounded-2xl border border-gray-200 p-8 sm:p-10">
          <h1 className="font-bold text-[26px] leading-tight tracking-tight text-titulo mb-2">
            Email confirmado
          </h1>
          <p className="text-[15px] text-corpo-texto leading-relaxed mb-8">
            {email ? (
              <>
                Você entrou como{" "}
                <strong
                  className="font-semibold text-titulo"
                  data-testid="conta-do-link"
                >
                  {email}
                </strong>
                .
              </>
            ) : (
              "Você entrou na sua conta."
            )}
          </p>

          <Link
            href={destino}
            className="inline-flex w-full items-center justify-center rounded-pill bg-principal text-white py-3.5 font-semibold text-[15px] hover:bg-principal-deep transition no-underline"
          >
            Continuar
          </Link>

          <form
            action={sairDaContaDoLink}
            className="mt-6 text-[14px] text-corpo-texto text-center"
          >
            Não é a sua conta?{" "}
            <button
              type="submit"
              className="font-semibold text-principal hover:underline cursor-pointer"
            >
              Sair
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-corpo-texto/60 mt-6">
          © Vetria 2026
        </p>
      </div>
    </main>
  );
}
