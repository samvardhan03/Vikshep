"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MathBlock from "@/components/MathBlock";
import DeformationStability from "@/components/visualizations/DeformationStability";

export default function MathAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Trigger row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 14,
            color: "var(--ink)",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              display: "inline-block",
              transition: "transform 200ms",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              fontSize: 12,
            }}
          >
            ▾
          </span>
          The math, in three equations
        </button>
        <a
          href="/math"
          style={{
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 12,
            color: "var(--ink-mute)",
            textDecoration: "none",
          }}
        >
          Read the full math →
        </a>
      </div>

      {/* Accordion body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="math-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                gap: 16,
                paddingTop: 4,
              }}
            >
              <MathBlock
                title="The cascade"
                latex={String.raw`S_2[\lambda_1,\lambda_2]\,x \;=\; \big|\,|x \star \psi_{\lambda_1}|\,\star\,\psi_{\lambda_2}\big| \,\star\, \phi_J`}
                caption="Modulus, convolve, modulus, low-pass. Non-expansive. Lipschitz-stable to deformation."
                href="/math#s1"
              />
              <MathBlock
                title="The invariance"
                latex={String.raw`\|S(\mathcal{L}_\tau x) - Sx\| \;\le\; C\!\left(\|\nabla\tau\|_\infty + \tfrac{\|\tau\|_\infty}{2^J} + \|H\tau\|_\infty\right)\|x\|`}
                caption="Small deformations produce small changes in features. Detector smearing is bounded, not amplified."
                href="/math#s2"
              >
                <DeformationStability />
              </MathBlock>
              <MathBlock
                title="The decorrelation"
                latex={String.raw`\mathcal{L} \;=\; \mathrm{wBCE}(\hat y, y) \;+\; \lambda\,\mathrm{dCorr}^2_w(\hat y,\, m \mid \text{bkg})`}
                caption="Distance correlation is zero iff the tagger output is statistically independent of the mass. The cut preserves the spectrum by construction."
                href="/math#s6"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
