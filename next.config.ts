import type { NextConfig } from "next";

// T-033 (SEC-104, SEC-112): cabeçalhos de segurança do site inteiro.
//
// - `frame-ancestors 'none'` + `X-Frame-Options: DENY`: nenhuma página da
//   Vetria abre dentro de iframe de outro site. Protege o botão "Aprovar" do
//   /admin/validacoes (clickjacking) e o /auth/confirm (SEC-112). O XFO é para
//   navegador antigo que não conhece `frame-ancestors`.
// - A CSP daqui é SÓ `frame-ancestors`: não restringe script, estilo, fonte,
//   imagem nem conexão, então Supabase, Vercel Analytics, Google OAuth e
//   next/font seguem como estão. A CSP completa com nonce é da F6.
//   No /_next/image a CSP sandbox da SVG (DL-040, abaixo) sai junto; duas CSPs
//   valem somadas, e as duas só restringem, sem conflito.
// - Permissions-Policy: o app não usa câmera, microfone nem localização
//   (conferido em 25/09: nenhum getUserMedia, mediaDevices nem geolocation no
//   código). Se um dia usar, liberar aqui com `(self)`.
// - HSTS NÃO entra aqui: a Vercel já manda `Strict-Transport-Security:
//   max-age=63072000` no domínio (medido em 25/09). Duplicar daria dois valores.
const CABECALHOS_DE_SEGURANCA = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Não anuncia o framework no cabeçalho `X-Powered-By`.
  poweredByHeader: false,
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
        // Todas as rotas, inclusive /_next e os arquivos de /public.
        source: "/:path*",
        headers: CABECALHOS_DE_SEGURANCA,
      },
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
