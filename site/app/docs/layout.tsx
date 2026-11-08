import Link from "next/link";

const NAV = [
  { label: "Overview", href: "/docs" },
  { label: "Studio", href: "/docs/studio" },
  { label: "Simulate", href: "/docs/simulate" },
  { label: "Verify", href: "/docs/verify" },
  { label: "Install", href: "/docs/install" },
  { label: "Quickstart", href: "/docs/quickstart" },
  { label: "Recipes", href: "/docs/recipes" },
  { label: "API reference", href: "/docs/api" },
  { label: "FAQ", href: "/docs/faq" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      // One column below lg: the sidebar becomes a row of links above the page.
      className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_1fr] lg:gap-16 items-start"
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "96px 24px 80px",
      }}
    >
      {/* Sidebar */}
      <aside className="flex flex-row flex-wrap gap-x-5 gap-y-1 lg:flex-col lg:gap-1 lg:sticky lg:top-[88px]">
        <p
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "var(--ink-mute)",
          }}
          className="w-full mb-1 lg:mb-3"
        >
          Docs
        </p>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="lg:border-b"
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 13,
              color: "var(--ink-mute)",
              textDecoration: "none",
              padding: "6px 0",
              borderColor: "var(--rule)",
            }}
          >
            {item.label}
          </Link>
        ))}
        <div className="flex flex-row gap-5 lg:flex-col lg:gap-2 lg:mt-8 w-full lg:w-auto pt-2 lg:pt-0">
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
          <Link
            href="/download"
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            Download →
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main style={{ minWidth: 0 }}>{children}</main>
    </div>
  );
}
