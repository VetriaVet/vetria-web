import { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-fundo-claro flex items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <div className="bg-white rounded-3xl shadow-[0_2px_24px_rgba(30,67,73,0.06)] border border-corpo-texto/10 p-8 sm:p-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-md bg-principal flex items-center justify-center text-white font-bold text-lg">
              V
            </div>
            <span className="text-2xl font-semibold text-principal tracking-tight">
              Vetria
            </span>
          </div>

          <h1 className="text-2xl font-semibold text-titulo leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-corpo-texto mt-2">{subtitle}</p>
          )}

          <div className="mt-8">{children}</div>
        </div>

        {footer && (
          <div className="text-center text-xs text-corpo-texto mt-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
