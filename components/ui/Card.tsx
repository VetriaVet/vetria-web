import Link from "next/link";
import { MouseEventHandler, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  // hoverable: liga o realce de borda + sombra no hover (cards de role do /cadastro).
  hoverable?: boolean;
  // interactive: torna o card clicável (cursor + focus ring), como os cards-link.
  interactive?: boolean;
  className?: string;
  onClick?: MouseEventHandler;
  as?: "div" | "link";
  href?: string;
}

// Base EXATA dos cards de role do /cadastro.
const base = "rounded-2xl border-2 border-gray-200 bg-white p-8 transition-all";

export function Card({
  children,
  hoverable = false,
  interactive = false,
  className = "",
  onClick,
  as = "div",
  href,
}: CardProps) {
  const cls = [
    base,
    hoverable ? "hover:border-principal hover:shadow-lg" : "",
    interactive
      ? "block cursor-pointer focus:outline-none focus:ring-2 focus:ring-principal/40"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (as === "link" && href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <div className={cls} onClick={onClick}>
      {children}
    </div>
  );
}
