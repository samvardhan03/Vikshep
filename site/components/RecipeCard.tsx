"use client";

import Link from "next/link";

interface RecipeCardProps {
  number: string;
  title: string;
  tagline: string;
  body: string;
  command: string;
  href: string;
  preview?: boolean;
  visualization?: React.ReactNode;
}

export default function RecipeCard({
  number,
  title,
  tagline,
  body,
  command,
  href,
  preview,
  visualization,
}: RecipeCardProps) {
  const isExternal = href.startsWith("mailto") || href.startsWith("http");

  const inner = (
    <div
      style={{
        border: "1px solid var(--rule)",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        height: "100%",
        transition: "border-color 150ms ease",
        opacity: preview ? 0.72 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--ink)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--rule)";
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 11,
            color: "var(--ink-mute)",
            letterSpacing: "0.12em",
          }}
        >
          {number}
        </span>
        {preview && (
          <span
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--signal-warm)",
              padding: "1px 6px",
              border: "1px solid var(--signal-warm)",
            }}
          >
            Preview
          </span>
        )}
      </div>
      <div>
        <h3
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontWeight: 300,
            fontSize: 22,
            lineHeight: 1.2,
            color: "var(--ink)",
            marginBottom: 6,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 12,
            color: "var(--ink-mute)",
            letterSpacing: "0.06em",
          }}
        >
          {tagline}
        </p>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-mute)", flex: visualization ? undefined : 1 }}>
        {body}
      </p>
      {visualization && (
        <div style={{ marginTop: 4 }}>{visualization}</div>
      )}
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: "var(--bg-elev)",
          border: "1px solid var(--rule)",
        }}
      >
        <code
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 11,
            color: "var(--ink)",
            wordBreak: "break-all",
          }}
        >
          {command}
        </code>
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={href} style={{ textDecoration: "none", display: "block", color: "inherit" }}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block", color: "inherit" }}>
      {inner}
    </Link>
  );
}
