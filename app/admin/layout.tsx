import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800 }}>Admin • Vetria</div>
        <nav style={{ display: "flex", gap: 14 }}>
          <Link href="/app">Voltar</Link>
        </nav>
      </header>

      <hr style={{ margin: "16px 0" }} />

      {children}
    </div>
  );
}