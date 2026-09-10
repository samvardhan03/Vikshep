import Link from "next/link";

const NAV = [
  { label: "Overview", href: "/docs" },
  { label: "Install", href: "/docs/install" },
  { label: "Quickstart", href: "/docs/quickstart" },
  { label: "Recipes", href: "/docs/recipes" },
  { label: "API reference", href: "/docs/api" },
  { label: "FAQ", href: "/docs/faq" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "96px 24px 80px",
        display: "grid",
        gridTemplateColumns: "200px 1fr",
        gap: 64,
        alignItems: "start",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          position: "sticky",
          top: 88,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "var(--ink-mute)",
            marginBottom: 12,
          }}
        >
          Docs
        </p>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 13,
              color: "var(--ink-mute)",
              textDecoration: "none",
              padding: "6px 0",
              borderBottom: "1px solid var(--rule)",
            }}
          >
            {item.label}
          </Link>
        ))}
        <div style={{ marginTop: 32 }}>
          <Link
            href="/pricing"
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            Pricing →
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main style={{ minWidth: 0 }}>{children}</main>
    </div>
  );
}
