"use client";

import { useState } from "react";

const LAYERS = [
  {
    icon: "ψ",
    title: "TypeScript / Bun agent  (Vikshep)",
    lines: ["Coordinator · MCP client · Recipe library", "React preview dashboard"],
  },
  {
    icon: "🦀",
    title: "omnipulse-mcp  (Rust — Data Plane)",
    lines: ["shm_open + mmap · spawn_blocking", "HNSW + Sliced-Wasserstein"],
  },
  {
    icon: "🌉",
    title: "omni-ffi  (Rust ⇄ C++ bridge)",
    lines: ['cxx 1.0 — unsafe extern "C++"', "CPU and CUDA dispatch paths"],
  },
  {
    icon: "⚙️",
    title: "omni-wst-core  (C++/CUDA)",
    lines: ["ScatteringEngine<Arch, Dim, Group, J, Q, L>", "Morlet bank · Solid-harmonic bank"],
  },
];

const ARROWS = [
  "28-hex shm OID · JSON-RPC 2.0 over stdio",
  "u64 host pointer · cxx zero-marshalling",
  "pinned host page",
];

export default function ArchitectureDiagram() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [captionOpen, setCaptionOpen] = useState(false);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }} aria-label="Vikshep architecture stack diagram">
      {LAYERS.map((layer, i) => (
        <div key={i}>
          {/* Layer card */}
          <div
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              border: `1px solid ${hovered === i ? "#C2461F" : "var(--ink)"}`,
              borderRadius: 4,
              padding: "14px 18px",
              backgroundColor: "var(--bg-elev)",
              cursor: "default",
              transition: "border-color 120ms",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 13,
                fontWeight: 600,
                color: hovered === i ? "#C2461F" : "var(--ink)",
                marginBottom: layer.lines.length ? 8 : 0,
                transition: "color 120ms",
              }}
            >
              {layer.icon}{"  "}{layer.title}
            </div>
            {layer.lines.map((line, li) => (
              <div
                key={li}
                style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  lineHeight: 1.7,
                }}
              >
                • {line}
              </div>
            ))}
          </div>

          {/* Arrow between layers */}
          {i < ARROWS.length && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "6px 0",
                gap: 2,
              }}
            >
              <div
                style={{
                  width: 1,
                  height: 14,
                  backgroundColor: "var(--ink-mute)",
                }}
              />
              <div
                style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 10,
                  color: "var(--ink-mute)",
                  textAlign: "center",
                  padding: "0 8px",
                  lineHeight: 1.5,
                }}
              >
                {ARROWS[i]}
              </div>
              <svg width="10" height="6" viewBox="0 0 10 6" style={{ display: "block" }}>
                <path d="M0 0 L5 6 L10 0 Z" fill="var(--ink-mute)" />
              </svg>
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: 16, fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, lineHeight: 1.6, color: "var(--ink-mute)" }}>
        <p>
          Every arrow is one of: a 28-char hex OID, a{" "}
          <code style={{ fontFamily: "inherit" }}>\n</code>-terminated JSON frame, or a registered host page.
        </p>
        {captionOpen && (
          <p style={{ marginTop: 8 }}>
            No protobuf, no HTTP, no JSON-over-network, no Python ↔ Rust serialization.
            The browser receives only OIDs and downsampled previews — raw tensors never leave the data plane.
          </p>
        )}
        <button
          onClick={() => setCaptionOpen((v) => !v)}
          style={{
            marginTop: 8,
            background: "none",
            border: "none",
            padding: 0,
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 11,
            color: "var(--ink)",
            cursor: "pointer",
          }}
        >
          {captionOpen ? "Collapse ↑" : "What crosses each arrow →"}
        </button>
      </div>
    </div>
  );
}
