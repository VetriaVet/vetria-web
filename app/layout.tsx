import type { Metadata } from "next";
import { Poppins, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

// Tipografia oficial Vetria v2 (design-system): corpo Poppins, títulos em
// Cormorant Garamond (serif elegante — substituta web da "Marie Regular").
// Carregadas via next/font (self-hosted, sem layout shift). Substitui o Inter
// único anterior (DL-006 § tipografia revogado por DL-031).
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

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
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${cormorant.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
