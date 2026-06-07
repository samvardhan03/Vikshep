"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const OPTIONS = [
  {
    title: "Found a bug?",
    desc: "Report it on GitHub — include reproduction steps if possible.",
    href: "https://github.com/samvardhan03/Vikshep/issues/new?template=bug.md",
    external: true,
  },
  {
    title: "Want a feature?",
    desc: "Open a feature request — describe the physics use case.",
    href: "https://github.com/samvardhan03/Vikshep/issues/new?template=feature.md",
    external: true,
  },
  {
    title: "Physics / analysis question?",
    desc: "Email Komal (ATLAS diboson pilot lead) — she responds to every serious physics inquiry.",
    href: "mailto:kpapanwar@gmail.com?subject=Vikshep%20physics%20question",
    external: false,
  },
  {
    title: "Partnership or deployment?",
    desc: "Email Samvardhan — infrastructure, licensing, and custom deployment.",
    href: "mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20partnership",
    external: false,
  },
];

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, handleKey]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              backgroundColor: "rgba(27,27,31,0.45)",
            }}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 201,
              width: "min(520px, calc(100vw - 32px))",
              backgroundColor: "var(--bg)",
              border: "1px solid var(--rule)",
              padding: "32px",
            }}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between gap-4 mb-2"
            >
              <h2
                className="font-serif"
                style={{
                  fontWeight: 300,
                  fontSize: 24,
                  lineHeight: 1.2,
                  color: "var(--ink)",
                }}
              >
                Help us improve
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ink-mute)",
                  fontSize: 20,
                  lineHeight: 1,
                  padding: "2px 6px",
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p
              className="font-mono text-[12px] mb-6"
              style={{ color: "var(--ink-mute)", lineHeight: 1.6 }}
            >
              Vikshep is open-source and built in the open. Tell us where it
              breaks for your workflow.
            </p>

            {/* Option cards */}
            <div className="flex flex-col gap-3">
              {OPTIONS.map((opt) => (
                <a
                  key={opt.title}
                  href={opt.href}
                  target={opt.external ? "_blank" : undefined}
                  rel={opt.external ? "noopener noreferrer" : undefined}
                  onClick={onClose}
                  style={{
                    display: "block",
                    padding: "16px 20px",
                    border: "1px solid var(--rule)",
                    textDecoration: "none",
                    transition: "border-color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "var(--rule)";
                  }}
                >
                  <p
                    className="font-mono text-[13px] font-medium mb-1"
                    style={{ color: "var(--ink)" }}
                  >
                    {opt.title}
                  </p>
                  <p
                    className="font-mono text-[11px]"
                    style={{ color: "var(--ink-mute)" }}
                  >
                    {opt.desc}
                  </p>
                </a>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
