import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, name, className = "", ...props }, ref) => {
    const inputId = id ?? name;
    return (
      <div className="grid gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-medium text-titulo"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          className={`rounded-pill border border-corpo-texto/20 bg-white px-5 py-3 text-sm text-titulo placeholder:text-corpo-texto/50 focus:border-principal focus:outline-none focus:ring-2 focus:ring-principal/15 transition-colors ${className}`}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
