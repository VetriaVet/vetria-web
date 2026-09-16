import Image from "next/image";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import LogoutButton from "@/app/app/LogoutButton";

// T-016 — a tela de bloqueio da matriz §4: *"`suspended` → tela de bloqueio
// com motivo"*.
//
// ⚠️ Ela é a única saída do portão que não tem para onde mandar a pessoa. Sem
// esta tela, `suspended` seria despachado para um lugar que o portão fecha na
// cara dele, e isso é laço de redirect — a conta suspensa ficaria presa numa
// tela de carregamento, sem nunca ler uma frase.
//
// **Nada aqui é inventado.** O motivo é `profiles.status_motivo`, escrito por
// `admin_definir_status()` e lido pelo próprio dono da linha. Quando ele é
// nulo, a tela diz que não há motivo registrado, em vez de fabricar um: estado
// vazio honesto é regra do projeto (DL-020).
//
// Fora do route group `(painel)` de propósito: a sidebar do painel lista
// dashboard, contatos, agenda e plano, e para uma conta suspensa todos eles
// devolvem para cá. Menu que só bate na porta é pior que menu nenhum.

export default function ContaBloqueada({
  titulo,
  motivo,
}: {
  titulo: string;
  motivo: string | null;
}) {
  return (
    <div className="min-h-screen bg-fundo-claro">
      <header className="border-b border-neutro-border bg-white">
        <div className="mx-auto flex h-16 max-w-[980px] items-center justify-between px-6">
          <Link href="/" className="inline-flex items-center no-underline">
            <Image
              src="/vetria/logo-vetria-fundo-claro.svg"
              alt="Vetria"
              width={178}
              height={29}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="overflow-hidden rounded-2xl border border-neutro-border bg-white">
          <div className="bg-principal px-8 py-12 text-center text-white">
            <div className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/15">
              <ShieldAlert size={32} strokeWidth={1.75} />
            </div>
            <h1 className="mb-3 text-[26px] font-bold leading-tight sm:text-[30px]">
              {titulo}
            </h1>
            <p className="mx-auto max-w-md text-[15px] leading-relaxed text-white/80">
              Enquanto o acesso estiver bloqueado, o painel e o perfil público
              ficam indisponíveis.
            </p>
          </div>

          <div className="p-8">
            <h2 className="mb-2 text-lg font-bold text-titulo">Motivo</h2>
            {motivo ? (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-corpo-texto">
                {motivo}
              </p>
            ) : (
              <p className="text-[15px] leading-relaxed text-corpo-texto">
                Nenhum motivo foi registrado no seu cadastro. Escreva para a
                gente e explicamos o que aconteceu.
              </p>
            )}

            <div className="mt-8 rounded-xl bg-fundo-destaque p-5">
              <h3 className="font-semibold text-titulo">
                Quer revisar essa decisão?
              </h3>
              <p className="mt-1 text-[14px] leading-relaxed text-corpo-texto">
                Fale com a gente em{" "}
                <a
                  href="mailto:contato@vetriabrasil.com.br"
                  className="font-medium text-principal underline underline-offset-2"
                >
                  contato@vetriabrasil.com.br
                </a>{" "}
                e respondemos em até 24h úteis. Seus dados continuam guardados:
                nada foi apagado.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
