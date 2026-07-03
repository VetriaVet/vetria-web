import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Tipografia oficial Vetria (manual de marca): Inter ÚNICA, no corpo e nos
// títulos (--fs-body e --fs-display da referência v2 são ambos Inter). A serif
// (Poppins+Cormorant da DL-031) foi revertida — destoava do manual (DL-033).
// next/font self-hosta a fonte (sem layout shift); a variável vira --font-sans.
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vetria: veterinários e estabelecimentos de confiança",
    template: "%s · Vetria",
  },
  description:
    "A Vetria conecta responsáveis por animais a veterinários, estabelecimentos veterinários e empresas do setor. Encontre profissionais de confiança perto de você.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
