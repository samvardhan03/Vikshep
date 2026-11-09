"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { label: "Studio", href: "/studio" },
  { label: "Determinism", href: "/determinism" },
  { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "GitHub ↗", href: "https://github.com/samvardhan03/Vikshep", external: true },
];

const signInHref = process.env.NEXT_PUBLIC_VIKSHEP_API_BASE
  ? `${process.env.NEXT_PUBLIC_VIKSHEP_API_BASE}/signin`
  : null;
const contactHref = "mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20inquiry";

const linkClass =
  "font-mono text-[13px] uppercase tracking-[0.12em] transition-opacity hover:opacity-60";
const outlineButtonClass =
  "font-mono text-[12px] uppercase tracking-[0.12em] px-4 py-2 border transition-opacity hover:opacity-70";
const solidButtonClass =
  "font-mono text-[12px] uppercase tracking-[0.12em] px-4 py-2 transition-opacity hover:opacity-70";

function NavLink({
  link,
  className,
  onClick,
}: {
  link: (typeof navLinks)[number];
  className: string;
  onClick?: () => void;
}) {
  return link.external ? (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{ color: "var(--ink-mute)", borderColor: "var(--rule)" }}
      onClick={onClick}
    >
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className={className} style={{ color: "var(--ink-mute)", borderColor: "var(--rule)" }} onClick={onClick}>
      {link.label}
    </Link>
  );
}

export default function Nav() {
  // Below lg (1024px) the links and buttons do not fit on one row; they move
  // into a menu panel under the bar.
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
        <Link href="/" className="flex items-center gap-2 group" onClick={close}>
          <span
            className="font-serif text-xl"
            style={{ fontWeight: 300, color: "var(--ink)" }}
          >
            <span style={{ color: "var(--accent)" }}>ψ</span>{" "}
            Vikshep
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.label} link={link} className={linkClass} />
          ))}
        </nav>

        {/* Right CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          {signInHref && (
            <a href={signInHref} className={outlineButtonClass} style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>
              Sign in
            </a>
          )}
          <a href="/download" className={outlineButtonClass} style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>
            Download
          </a>
          <a href={contactHref} className={solidButtonClass} style={{ backgroundColor: "var(--ink)", color: "var(--bg)" }}>
            Talk to founders
          </a>
        </div>

        {/* Menu toggle (below lg) */}
        <button
          type="button"
          className={`lg:hidden ${outlineButtonClass}`}
          style={{ borderColor: "var(--rule)", color: "var(--ink)", backgroundColor: "transparent" }}
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div
          id="site-menu"
          className="lg:hidden border-b"
          style={{ backgroundColor: "var(--bg)", borderColor: "var(--rule)" }}
        >
          <nav className="flex flex-col px-6 py-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                link={link}
                className={`${linkClass} py-3 border-b`}
                onClick={close}
              />
            ))}
          </nav>
          <div className="flex flex-wrap gap-3 px-6 pt-2 pb-5">
            {signInHref && (
              <a href={signInHref} className={outlineButtonClass} style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>
                Sign in
              </a>
            )}
            <a href="/download" className={outlineButtonClass} style={{ borderColor: "var(--rule)", color: "var(--ink)" }} onClick={close}>
              Download
            </a>
            <a href={contactHref} className={solidButtonClass} style={{ backgroundColor: "var(--ink)", color: "var(--bg)" }}>
              Talk to founders
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
