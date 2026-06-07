"use client";

import { useState } from "react";

interface CodeBlockProps {
  children: string;
  copyable?: boolean;
  lang?: string;
}

export default function CodeBlock({ children, copyable }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        border: "1px solid var(--rule)",
        backgroundColor: "var(--bg-elev)",
      }}
    >
      <code
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 13,
          color: "var(--ink)",
        }}
      >
        {children}
      </code>
      {copyable && (
        <button
          onClick={copy}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--ink-mute)",
            padding: 0,
          }}
        >
          {copied ? "copied" : "copy"}
        </button>
      )}
    </div>
  );
}
