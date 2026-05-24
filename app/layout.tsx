import type { Metadata } from "next";
import "./globals.css";

// Inter é carregado via @import no globals.css (DL-006); o body usa
// var(--font-sans). Sem next/font Geist (era peso morto do boilerplate).
export const metadata: Metadata = {
  title: {
    default: "Vetria — veterinários e clínicas de confiança",
    template: "%s · Vetria",
  },
  description:
    "A Vetria conecta tutores de pets a veterinários, clínicas e empresas do setor pet. Encontre profissionais de confiança perto de você.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
