import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Página não encontrada",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <Image
        src="/vetria/logo-square.png"
        alt="Vetria"
        width={48}
        height={48}
        className="rounded-lg mb-8"
        priority
      />
      <p className="text-principal font-bold text-6xl tracking-tight mb-3">
        404
      </p>
      <h1 className="text-titulo font-bold text-2xl mb-2">
        Página não encontrada
      </h1>
      <p className="text-corpo-texto text-[15px] leading-relaxed max-w-md mb-8">
        O endereço que você tentou acessar não existe ou foi movido.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-pill bg-principal text-white px-7 py-3 font-semibold text-sm hover:bg-[#142E33] transition no-underline"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
