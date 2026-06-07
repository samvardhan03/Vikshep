"use client";

import { useState } from "react";

const PARAGRAPHS = [
  "A resonance search depends on one thing: that your selection does not deform the background mass spectrum. A deep tagger learns the mass implicitly through the features you feed it. Cut on its score, and you preferentially keep background jets in the same mass window as your signal — carving a bump-shaped hole into a spectrum that was supposed to be smooth. The tagger looks accurate. The discovery is fake.",
  "This isn't a niche failure mode. It is a recognized, cross-collaboration problem in ATLAS and CMS, and it is the reason analyses spend years on adversarial decorrelation, DisCo regularization, planing, and uBoost. The deeper issue is the architecture: learned filters can latch onto the very quantity the analysis is trying to measure.",
  "Vikshep replaces the learned feature extractor with a deterministic one. The filters are fixed by the mathematics of the wavelet scattering transform — they cannot adapt to leak mass information they were never given. What residual correlation remains is killed by a single closed-form penalty on the downstream classifier. The background mass shape is preserved by construction.",
];

const STATS = [
  { label: "ATLAS / CMS", text: "Mass decorrelation is a top concern in every boosted-object analysis" },
  { label: "HL-LHC 2030", text: "Restart with ×5 luminosity, ×10 pile-up, an order of magnitude more data" },
  { label: "BSM searches", text: "Anomaly detection is the field's response to not knowing what to look for" },
];

export default function ProblemSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 24 }}>
        <p
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            lineHeight: 1.4,
            color: "var(--accent)",
          }}
        >
          Why every modern tagger quietly breaks discovery
        </p>
        <h2
          style={{
            fontFamily: "var(--font-source-serif), Georgia, serif",
            fontWeight: 300,
            fontSize: "clamp(28px,3.6vw,52px)",
            lineHeight: 1.1,
            color: "var(--ink)",
          }}
        >
          A neural net trained on jet features learns the jet mass — and your bump-hunt with it.
        </h2>

        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {PARAGRAPHS.map((p, i) => (
              <p key={i} style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-mute)" }}>
                {p}
              </p>
            ))}
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            padding: 0,
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 13,
            color: "var(--ink)",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 4,
          }}
        >
          {open ? "Collapse ↑" : "How it breaks discovery →"}
        </button>
      </div>

      {/* Stat strip — always visible */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 1,
          marginTop: 48,
          backgroundColor: "var(--rule)",
        }}
      >
        {STATS.map((s) => (
          <div key={s.label} style={{ padding: 24, backgroundColor: "var(--bg)" }}>
            <p
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "var(--accent)",
                marginBottom: 8,
              }}
            >
              {s.label}
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-mute)" }}>{s.text}</p>
          </div>
        ))}
      </div>
    </>
  );
}
