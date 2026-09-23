"use client";

import { InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./Input";

interface CampoSenhaProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  id: string;
  /** Texto de ajuda sob o campo, ligado por aria-describedby. */
  ajuda?: string;
}

// Campo de senha com botão de olho (T-034). Usa o Input da casa pelo
// `rightSlot`, então a aparência é idêntica aos outros campos. O Label fica
// fora, como em todo formulário do repo.
export function CampoSenha({ id, ajuda, ...props }: CampoSenhaProps) {
  const [visivel, setVisivel] = useState(false);
  const ajudaId = ajuda ? `${id}-ajuda` : undefined;
  const describedBy =
    [props["aria-describedby"], ajudaId].filter(Boolean).join(" ") || undefined;

  return (
    <>
      <Input
        {...props}
        id={id}
        type={visivel ? "text" : "password"}
        aria-describedby={describedBy}
        rightSlot={
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visivel}
            aria-controls={id}
            className="-mr-1.5 p-1.5 rounded-full text-corpo-texto hover:text-titulo cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 transition"
          >
            {visivel ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        }
      />
      {ajuda && (
        <p id={ajudaId} className="text-[13px] text-corpo-texto mt-1.5 px-5">
          {ajuda}
        </p>
      )}
    </>
  );
}
