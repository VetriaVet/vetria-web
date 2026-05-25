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
  // Docs de entrega (HTML estático em /public) servidos numa URL limpa e
  // noindex. Reutilizável por fase: basta um par rewrite + header por doc.
  async rewrites() {
    return [
      { source: "/entrega-fase-2", destination: "/entrega-fase-2.html" },
    ];
  },
  async headers() {
    return [
      {
        source: "/entrega-fase-2",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/entrega-fase-2.html",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
