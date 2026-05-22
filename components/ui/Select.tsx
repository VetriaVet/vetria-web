import { SelectHTMLAttributes } from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: Option[];
  placeholder?: string;
}

// Mesma estética do Input pill + appearance-none/pr-12/cursor-pointer,
// EXATAMENTE como o SelectPill do TutorOnboardingForm.
const selectClass =
  "w-full rounded-pill bg-fundo-claro/40 border border-transparent px-5 py-3.5 text-[15px] text-titulo placeholder:text-corpo-texto/60 focus:bg-white focus:border-principal focus:ring-2 focus:ring-principal/20 focus:outline-none transition appearance-none pr-12 cursor-pointer";

export function Select({
  options,
  placeholder = "Selecione...",
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="relative">
      <select
        className={[selectClass, className].filter(Boolean).join(" ")}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-corpo-texto"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
