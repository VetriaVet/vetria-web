import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Bloco "ghost" — revela a ESTRUTURA da tela sem inventar dado (DL-020 +
// DL-034): em vez de um "em breve" seco, mostramos o esqueleto do conteúdo
// (linhas/cards fantasma) + um texto honesto do que vai aparecer ali. Assim
// dá pra ver o design vivo da tela mesmo antes do backend ligar.

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block animate-pulse rounded-md bg-neutro-border/70 ${className}`}
    />
  );
}

// Linha fantasma no formato "avatar + duas linhas" (feeds, listas, contatos).
export function GhostRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutro-border-soft bg-neutro-bg-alt/40 p-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2.5 w-2/3" />
      </div>
      <Skeleton className="h-5 w-16 rounded-pill" />
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  // ghost: nº de linhas fantasma exibidas acima do texto (0 = sem esqueleto).
  ghost?: number;
  // preview: esqueleto custom (sobrepõe `ghost`) pra telas com layout próprio.
  preview?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ghost = 0,
  preview,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-neutro-border p-6">
      {preview ??
        (ghost > 0 ? (
          <div className="mb-6 space-y-3 [mask-image:linear-gradient(to_bottom,black,transparent)]">
            {Array.from({ length: ghost }).map((_, i) => (
              <GhostRow key={i} />
            ))}
          </div>
        ) : null)}

      <div className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-fundo-claro text-corpo-texto">
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <p className="mb-1 font-semibold text-titulo">{title}</p>
        <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-corpo-texto">
          {description}
        </p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
