"use client";

import { useEffect, useState } from "react";

interface FeedbackButtonProps {
  onClick: () => void;
}

export default function FeedbackButton({ onClick }: FeedbackButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 100,
        backgroundColor: "var(--ink)",
        color: "var(--bg)",
        padding: "10px 18px",
        borderRadius: 9999,
        fontFamily: "var(--font-jetbrains), monospace",
        fontSize: 12,
        letterSpacing: "0.06em",
        cursor: "pointer",
        border: "none",
        transition: "transform 150ms ease, opacity 150ms ease",
        boxShadow: "0 2px 12px rgba(27,27,31,0.18)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      }}
    >
      Help us improve →
    </button>
  );
}
