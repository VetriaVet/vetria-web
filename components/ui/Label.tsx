import { LabelHTMLAttributes } from "react";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

// Classe EXATA do label das telas (login + TutorOnboardingForm).
const labelClass = "text-titulo font-medium text-sm mb-1.5 block";

export function Label({ className = "", ...props }: LabelProps) {
  return (
    <label
      className={[labelClass, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
