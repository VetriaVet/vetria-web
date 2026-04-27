import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "default" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-principal text-white hover:bg-[#16323A] disabled:opacity-50 disabled:hover:bg-principal",
  secondary:
    "bg-white text-titulo border border-corpo-texto/20 hover:border-principal hover:text-principal disabled:opacity-50",
  ghost:
    "bg-transparent text-principal hover:bg-fundo-destaque disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  default: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "default", block = false, className = "", ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`rounded-pill font-medium transition-colors disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${variantClasses[variant]} ${sizeClasses[size]} ${block ? "w-full" : ""} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
