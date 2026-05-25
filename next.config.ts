import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // As logos da Vetria são SVG (arquivos próprios em /public/vetria). O
    // next/image bloqueia SVG por padrão (SVG pode carregar script), então a
    // logo vinha "quebrada". Liberamos SVG e neutralizamos qualquer script com
    // CSP sandbox — a SVG é servida exatamente como enviada, sem recriar nada.
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
