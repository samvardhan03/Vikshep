"use client";

import { BlockMath } from "react-katex";

interface MathBlockProps {
  title: string;
  latex: string;
  caption: string;
  href?: string;
  children?: React.ReactNode;
}

export default function MathBlock({ title, latex, caption, href, children }: MathBlockProps) {
  return (
    <div
      style={{
        border: "1px solid var(--rule)",
        padding: 28,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: "var(--ink-mute)",
        }}
      >
        {title}
      </p>
      <div style={{ overflowX: "auto", padding: "8px 0" }}>
        <BlockMath math={latex} />
      </div>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: "var(--ink-mute)",
          paddingTop: 8,
          borderTop: "1px solid var(--rule)",
        }}
      >
        {caption}
      </p>
      {children}
      {href && (
        <a
          href={href}
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 11,
            color: "var(--ink)",
            textDecoration: "none",
          }}
        >
          Read the proof →
        </a>
      )}
    </div>
  );
}
