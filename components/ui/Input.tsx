import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Slot opcional à direita (ex.: botão olho do toggle de senha no /login).
  rightSlot?: ReactNode;
}

// Classe EXATA do input pill das telas de produção (login + TutorOnboardingForm).
// O Label é componente SEPARADO (ver Label.tsx) — não embutido aqui.
const inputClass =
  "w-full rounded-pill bg-fundo-claro/40 border border-transparent px-5 py-3.5 text-[15px] text-titulo placeholder:text-corpo-texto/60 focus:bg-white focus:border-principal focus:ring-2 focus:ring-principal/20 focus:outline-none transition";

export function Input({ rightSlot, className = "", ...props }: InputProps) {
  const cls = [inputClass, rightSlot ? "pr-12" : "", className]
    .filter(Boolean)
    .join(" ");

  if (!rightSlot) {
    return <input className={cls} {...props} />;
  }

  return (
    <div className="relative">
      <input className={cls} {...props} />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
        {rightSlot}
      </span>
    </div>
  );
}
