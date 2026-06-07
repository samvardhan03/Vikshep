"use client";

import Link from "next/link";

const navLinks = [
  { label: "Platform", href: "/#recipes" },
  { label: "Math", href: "/math" },
  { label: "Pilot", href: "/pilot" },
  { label: "GitHub ↗", href: "https://github.com/samvardhan03/Vikshep", external: true },
];

export default function Nav() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        height: 64,
        borderColor: "var(--rule)",
        backgroundColor: "var(--bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        className="flex items-center justify-between h-full mx-auto px-6"
        style={{ maxWidth: 1280 }}
      >
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="font-serif text-xl"
            style={{ fontWeight: 300, color: "var(--ink)" }}
          >
            <span style={{ color: "var(--accent)" }}>ψ</span>{" "}
            Vikshep
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[13px] uppercase tracking-[0.12em] transition-opacity hover:opacity-60"
                style={{ color: "var(--ink-mute)" }}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono text-[13px] uppercase tracking-[0.12em] transition-opacity hover:opacity-60"
                style={{ color: "var(--ink-mute)" }}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/samvardhan03/Vikshep#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[12px] uppercase tracking-[0.12em] px-4 py-2 border transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
          >
            Docs ↗
          </a>
          <a
            href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20inquiry"
            className="font-mono text-[12px] uppercase tracking-[0.12em] px-4 py-2 transition-opacity hover:opacity-70"
            style={{
              backgroundColor: "var(--ink)",
              color: "var(--bg)",
            }}
          >
            Talk to founders
          </a>
        </div>
      </div>
    </header>
  );
}
