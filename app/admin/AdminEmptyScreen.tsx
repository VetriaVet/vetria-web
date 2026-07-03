// Empty-state dark reutilizável pras telas admin sem backend (DL-022 honesto).
// Estado GHOST (DL-034): mostra o esqueleto de uma fila/tabela (linhas
// fantasma escuras) + texto honesto do que vai aparecer — sem inventar item.

function DarkSkeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded bg-white/10 ${className}`}
    />
  );
}

export default function AdminEmptyScreen({
  title,
  heading,
  desc,
}: {
  title: string;
  heading: string;
  desc: string;
}) {
  return (
    <div>
      <header className="bg-[#0F1F22]/90 backdrop-blur border-b border-white/[0.06] px-6 py-4 sticky top-0 z-10">
        <h1 className="font-bold text-lg text-white">{title}</h1>
      </header>

      <div className="p-6 max-w-[1280px] mx-auto">
        <div className="rounded-md border border-white/[0.06] bg-[#1A2A2D] p-6">
          {/* Esqueleto de fila/tabela (some pra baixo) */}
          <div className="space-y-2.5 mb-8 [mask-image:linear-gradient(to_bottom,black,transparent)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-white/[0.05] bg-black/15 p-3"
              >
                <DarkSkeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <DarkSkeleton className="h-2.5 w-1/3" />
                  <DarkSkeleton className="h-2 w-1/2" />
                </div>
                <DarkSkeleton className="h-6 w-20 shrink-0 rounded-md" />
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="font-bold text-xl text-white mb-2">{heading}</h2>
            <p className="text-[14px] text-white/70 leading-relaxed max-w-md mx-auto">
              {desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
