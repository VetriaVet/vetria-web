import Link from "next/link";
import Image from "next/image";

const ROLES = [
  {
    href: "/cadastro/tutor",
    emoji: "🐶",
    title: "Sou tutor de pet",
    desc: "Encontre profissionais perto de você, agende consultas e cuide melhor do seu pet.",
  },
  {
    href: "/cadastro/vet",
    emoji: "🩺",
    title: "Sou veterinário",
    desc: "Crie seu perfil profissional, seja encontrado por tutores e organize sua agenda.",
  },
  {
    href: "/cadastro/clinica",
    emoji: "🏥",
    title: "Sou uma clínica",
    desc: "Cadastre sua clínica, gerencie sua equipe e fortaleça sua marca regional.",
  },
];

export default function CadastroPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="flex items-center justify-between max-w-7xl mx-auto px-6 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 no-underline"
        >
          <Image
            src="/vetria/logo-square.png"
            alt="Vetria"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="text-titulo font-bold text-xl">Vetria</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-corpo-texto text-sm">Já tem conta?</span>
          <Link
            href="/login"
            className="text-principal font-medium text-sm hover:underline"
          >
            Entrar →
          </Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-titulo mb-3 tracking-tight">
          Bem-vindo à Vetria. Crie sua conta.
        </h1>
        <p className="text-corpo-texto text-lg max-w-xl mx-auto">
          Escolha seu perfil. Você pode mudar depois? Não — é permanente, então
          escolha com cuidado.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          {ROLES.map(({ href, emoji, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="block rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all hover:border-principal hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-principal/40"
            >
              <span className="text-5xl mb-4 block" aria-hidden="true">
                {emoji}
              </span>
              <h2 className="text-titulo font-bold text-xl mb-2">{title}</h2>
              <p className="text-corpo-texto text-sm leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
