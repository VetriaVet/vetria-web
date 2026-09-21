"use client";

import { ButtonHTMLAttributes, ReactNode, useSyncExternalStore } from "react";

// Variantes extraídas das telas de produção (login/onboarding):
// - primary: botão de CTA (submit) — bg-principal
// - google: botão de OAuth do /login — bg-titulo (preto) com ícone Google
// secondary/ghost NÃO existem em nenhuma tela canônica — não criados aqui.
type Variant = "primary" | "google";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  /** Estado final: o botão vira um check. Mantém o botão desabilitado. */
  success?: boolean;
  /** Encolhe o botão para um disco enquanto envia (opt-in, funis de cadastro). */
  collapse?: boolean;
}

// Altura travada: é exatamente a altura que o botão tinha com `py-3.5`
// (14 + 22 + 14). Sem ela, empilhar rótulo/spinner/check em `absolute`
// zeraria o conteúdo em fluxo e o botão perderia altura no meio do clique.
const DISCO = 51;

const variantClasses: Record<Variant, string> = {
  primary:
    "relative w-full overflow-hidden rounded-pill text-white px-6 py-3.5 min-h-[51px] inline-flex items-center justify-center font-semibold text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-principal/40 focus-visible:ring-offset-2",
  google:
    "w-full rounded-pill bg-titulo text-white py-3.5 px-6 inline-flex items-center justify-center gap-3 font-medium hover:bg-black/90 disabled:opacity-60 transition",
};

export function Button({
  variant = "primary",
  loading = false,
  success = false,
  collapse = false,
  disabled,
  className = "",
  children,
  type = "button",
  style,
  ...props
}: ButtonProps) {
  const semMovimento = usePrefersReducedMotion();

  if (variant === "google") {
    return (
      <button
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={[variantClasses.google, className].filter(Boolean).join(" ")}
        style={style}
        {...props}
      >
        {!loading && <GoogleIcon />}
        {loading ? <Spinner girando={!semMovimento} /> : children}
      </button>
    );
  }

  // Com `prefers-reduced-motion`, nada encolhe e nada gira: só o estado troca.
  const encolhe = collapse && !semMovimento;
  const disco = encolhe && (loading || success);

  const classes = [
    variantClasses.primary,
    success
      ? "bg-success"
      : "bg-principal hover:bg-principal-deep",
    disabled && !loading && !success ? "opacity-50" : "",
    encolhe ? "mx-auto" : "",
    semMovimento
      ? "transition-colors duration-200"
      : "transition-[max-width,padding,background-color] duration-[420ms] ease-[var(--ease-vetria)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      disabled={disabled || loading || success}
      aria-busy={loading || undefined}
      className={classes}
      style={
        encolhe
          ? {
              maxWidth: disco ? `${DISCO}px` : "100%",
              paddingInline: disco ? 0 : undefined,
              ...style,
            }
          : style
      }
      {...props}
    >
      {/* As três camadas ficam empilhadas para que a largura do botão não
          dependa do conteúdo: quem manda na largura é só a animação. */}
      <Camada visivel={!loading && !success}>{children}</Camada>
      <Camada visivel={loading}>
        <Spinner girando={!semMovimento} />
      </Camada>
      <Camada visivel={success}>
        <Check desenhado={success} animar={!semMovimento} />
      </Camada>
    </button>
  );
}

function Camada({
  visivel,
  children,
}: {
  visivel: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={[
        "absolute inset-0 flex items-center justify-center gap-2 px-5 whitespace-nowrap pointer-events-none transition-opacity duration-200 ease-[var(--ease-vetria)] motion-reduce:transition-none",
        visivel ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function Spinner({ girando = true }: { girando?: boolean }) {
  return (
    <svg
      className={girando ? "animate-spin" : undefined}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-90"
      />
    </svg>
  );
}

// O traço tem ~23 unidades; 24 de dasharray cobre o caminho inteiro.
// Sem animação (`prefers-reduced-motion`) o check já nasce inteiro: quem o
// esconde é a opacidade da camada, nunca o dash. Escondê-lo pelo dash aqui
// deixava o botão verde e VAZIO para quem pediu menos movimento.
function Check({ desenhado, animar }: { desenhado: boolean; animar: boolean }) {
  const porDesenhar = animar && !desenhado;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12 9 17 20 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 24,
          strokeDashoffset: porDesenhar ? 24 : 0,
          transition: animar
            ? "stroke-dashoffset 320ms var(--ease-vetria) 140ms"
            : undefined,
        }}
      />
    </svg>
  );
}

const CONSULTA_MOVIMENTO = "(prefers-reduced-motion: reduce)";

function assinarMovimento(aoMudar: () => void) {
  const mq = window.matchMedia(CONSULTA_MOVIMENTO);
  mq.addEventListener("change", aoMudar);
  return () => mq.removeEventListener("change", aoMudar);
}

// Lido pelo `useSyncExternalStore` para não virar setState dentro de efeito.
// No servidor a resposta é `false`: a animação só existe depois da hidratação.
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    assinarMovimento,
    () => window.matchMedia(CONSULTA_MOVIMENTO).matches,
    () => false,
  );
}

// Ícone Google copiado EXATAMENTE do /login (4 cores, 18x18).
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}
