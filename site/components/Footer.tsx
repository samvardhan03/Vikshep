"use client";

import Link from "next/link";

const NAV_COLS = [
  {
    title: "Product",
    links: [
      { label: "Platform", href: "/#recipes" },
      { label: "Math", href: "/math" },
      { label: "Pilot", href: "/pilot" },
      { label: "Architecture", href: "/#architecture" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub ↗", href: "https://github.com/samvardhan03/Vikshep", external: true },
      { label: "Changelog", href: "#" },
      { label: "OmniPulse — Media IP plane ↗", href: "https://omnipulseid.vercel.app", external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Founders", href: "/#founders" },
      { label: "Samvardhan (infra)", href: "mailto:shekhawatsamvardhan@gmail.com", external: true },
      { label: "Yash (systems)", href: "mailto:yash01012002@gmail.com", external: true },
      { label: "Komal (physics)", href: "mailto:kpapanwar@gmail.com", external: true },
      { label: "Help us improve", href: "#feedback", action: "feedback" },
    ],
  },
];

interface FooterProps {
  onFeedback?: () => void;
}

export default function Footer({ onFeedback }: FooterProps) {
  return (
    <footer className="pt-16 pb-12" style={{ borderTop: "1px solid var(--rule)" }}>
      <div className="mx-auto px-6" style={{ maxWidth: 1280 }}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          {/* Brand column */}
          <div className="col-span-2 flex flex-col gap-2">
            <span
              className="font-serif text-[18px]"
              style={{ fontWeight: 300, color: "var(--ink)" }}
            >
              <span style={{ color: "var(--accent)" }}>ψ</span> Vikshep
            </span>
            <span
              className="font-mono text-[11px]"
              style={{ color: "var(--ink-mute)" }}
            >
              Deterministic feature extraction for scientific compute
            </span>
            <span
              className="font-mono text-[11px] mt-1"
              style={{ color: "var(--ink-mute)" }}
            >
              Apache-2.0 ·{" "}
              <a
                href="mailto:shekhawatsamvardhan@gmail.com"
                className="transition-opacity hover:opacity-60"
                style={{ color: "var(--ink)" }}
              >
                shekhawatsamvardhan@gmail.com
              </a>
            </span>
          </div>

          {/* Nav columns */}
          {NAV_COLS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <p
                className="font-mono text-[11px] uppercase tracking-[0.16em]"
                style={{ color: "var(--ink-mute)" }}
              >
                {col.title}
              </p>
              {col.links.map((l) => {
                if (l.action === "feedback") {
                  return (
                    <button
                      key={l.label}
                      onClick={onFeedback}
                      className="font-mono text-[12px] transition-opacity hover:opacity-60 text-left"
                      style={{ color: "var(--ink)" }}
                    >
                      {l.label}
                    </button>
                  );
                }
                if (l.external || l.href.startsWith("mailto")) {
                  return (
                    <a
                      key={l.label}
                      href={l.href}
                      target={l.external ? "_blank" : undefined}
                      rel={l.external ? "noopener noreferrer" : undefined}
                      className="font-mono text-[12px] transition-opacity hover:opacity-60"
                      style={{ color: "var(--ink)" }}
                    >
                      {l.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="font-mono text-[12px] transition-opacity hover:opacity-60"
                    style={{ color: "var(--ink)" }}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legal row */}
        <div
          className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--rule)" }}
        >
          <div className="flex flex-wrap gap-6">
            {[
              { label: "License: AGPL-3.0 + Commercial", href: "https://github.com/samvardhan03/Vikshep/blob/main/LICENSING.md" },
              { label: "vikshep on PyPI", href: "https://pypi.org/project/vikshep/" },
              { label: "omni-wst-core on PyPI", href: "https://pypi.org/project/omni-wst-core/" },
              { label: "omnipulse-mcp on crates.io", href: "https://crates.io/crates/omnipulse-mcp" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] transition-opacity hover:opacity-60"
                style={{ color: "var(--ink-mute)" }}
              >
                {l.label}
              </a>
            ))}
          </div>
          <span
            className="font-mono text-[11px]"
            style={{ color: "var(--ink-mute)" }}
          >
            © 2026 Vikshep · AGPL-3.0 + Commercial · Companion to OmniPulse
          </span>
        </div>
      </div>
    </footer>
  );
}
