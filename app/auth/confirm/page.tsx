import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { destinoDoErroDoLink } from "@/lib/auth/erros";
import {
  caminhoInternoSeguro,
  fluxoDoTipo,
  lerTipoDoLink,
  lerTokenHash,
  type TipoDoLink,
} from "@/lib/auth/link-do-email";
import { confirmarLinkDoEmail } from "./actions";
import { BotaoContinuar } from "./BotaoContinuar";

// T-036 — a porta de entrada do link que chega por email.
//
// Template do Supabase: {{ .SiteURL }}/auth/confirm?token_hash=...&type=...&next=...
//
// POR QUE UMA PÁGINA COM BOTÃO, E NÃO UM GET QUE JÁ VERIFICA:
// antivírus e filtros de email corporativo (Microsoft Defender/Safe Links,
// Mimecast, Proofpoint e parecidos) abrem os links do email com um GET antes
// da pessoa, para conferir se são seguros. O `token_hash` é de uso único: se
// o GET o gastasse, a pessoa clicaria num link já usado. Na recuperação de
// senha isso é trancar a pessoa para fora, porque cada link novo seria gasto
// do mesmo jeito. Este GET só desenha a página; quem gasta o token é o POST do
// botão (Server Action), que robô de pré-visualização não faz. É a mitigação
// que a documentação do Supabase recomenda para "email prefetching".
//
// Esta página não carrega nada de terceiro, e o `referrer` vai desligado: a
// URL dela carrega o token, e não pode vazar no cabeçalho Referer.

export const metadata: Metadata = {
  title: "Confirmar acesso",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

const TEXTOS: Record<
  "senha" | "confirmacao" | "troca",
  { titulo: string; corpo: string }
> = {
  senha: {
    titulo: "Criar uma nova senha",
    corpo: "Clique em Continuar para abrir a tela de nova senha.",
  },
  confirmacao: {
    titulo: "Confirmar seu email",
    corpo: "Clique em Continuar para confirmar seu email e entrar na sua conta.",
  },
  troca: {
    titulo: "Confirmar o novo email",
    corpo: "Clique em Continuar para confirmar a troca do email da sua conta.",
  },
};

function textoDoTipo(tipo: TipoDoLink) {
  if (tipo === "recovery") return TEXTOS.senha;
  if (tipo === "email_change") return TEXTOS.troca;
  return TEXTOS.confirmacao;
}

const um = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v ?? null;

export default async function ConfirmarLinkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tipo = lerTipoDoLink(um(sp.type));
  const tokenHash = lerTokenHash(um(sp.token_hash));

  // Link sem token ou com tipo fora da lista fechada: não há o que confirmar.
  // Vai direto para a tela de erro do fluxo, sem botão.
  if (!tokenHash) {
    redirect(
      tipo
        ? destinoDoErroDoLink({ error: "invalid_request" }, fluxoDoTipo(tipo)) ??
            "/login?msg=missing_code"
        : "/login?msg=missing_code"
    );
  }
  if (!tipo) redirect("/login?msg=auth_error");

  // O `next` só segue adiante se for caminho interno seguro. A Action confere
  // de novo: o campo escondido é HTML, e o cliente escreve o que quiser nele.
  const next = caminhoInternoSeguro(um(sp.next)) ?? "";
  const texto = textoDoTipo(tipo);

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
            {texto.titulo}
          </h1>
          <p className="text-[15px] text-corpo-texto leading-relaxed mb-8">
            {texto.corpo}
          </p>

          <form action={confirmarLinkDoEmail} className="flex flex-col gap-4">
            <input type="hidden" name="token_hash" value={tokenHash} />
            <input type="hidden" name="type" value={tipo} />
            <input type="hidden" name="next" value={next} />
            <BotaoContinuar />
          </form>

          <p className="mt-6 text-[13px] text-corpo-texto leading-relaxed">
            Pedimos este clique para proteger o seu link: alguns serviços de
            email abrem os links sozinhos para conferir se são seguros, e isso
            poderia gastar o link antes de você.
          </p>
        </div>

        <p className="text-center text-xs text-corpo-texto/60 mt-6">
          © Vetria 2026
        </p>
      </div>
    </main>
  );
}
