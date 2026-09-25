import { CartaoFantasma } from "@/components/publico/CartaoDeProfissional";
import { CascaPublica } from "@/components/publico/CascaPublica";

// Enquanto a busca responde: a mesma moldura da página, com cartões
// fantasma no lugar dos resultados. Sem dado nenhum.
export default function CarregandoBusca() {
  return (
    <CascaPublica>
      <section className="border-b border-neutro-border bg-fundo-claro">
        <div className="mx-auto max-w-6xl px-5 pb-8 pt-8 sm:pb-10 sm:pt-12">
          <p className="text-[28px] font-bold leading-tight tracking-tight text-titulo sm:text-[34px]">
            Buscando...
          </p>
          <div aria-hidden className="mt-6 h-40 animate-pulse rounded-2xl bg-white/70 shadow-md motion-reduce:animate-none" />
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10" role="status" aria-live="polite">
        <span className="sr-only">Carregando os resultados da busca.</span>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse motion-reduce:animate-none">
              <CartaoFantasma />
            </div>
          ))}
        </div>
      </div>
    </CascaPublica>
  );
}
