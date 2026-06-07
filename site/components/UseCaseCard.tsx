interface UseCaseCardProps {
  category: string;
  body: string;
  footer: string;
}

export default function UseCaseCard({ category, body, footer }: UseCaseCardProps) {
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
          color: "var(--accent)",
        }}
      >
        {category}
      </p>
      <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-mute)", flex: 1 }}>
        {body}
      </p>
      <p
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 11,
          color: "var(--ink-mute)",
          paddingTop: 12,
          borderTop: "1px solid var(--rule)",
        }}
      >
        {footer}
      </p>
    </div>
  );
}
