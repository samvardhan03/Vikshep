const MODULES = [
  { name: "vikshep", version: "0.3", channel: "PyPI" },
  { name: "omnipulse-mcp", version: null, channel: "binary" },
  { name: "omni-wst-core", version: "0.1", channel: "PyPI" },
  { name: "vector-index", version: "0.1", channel: "crate" },
  { name: "sliced-wasserstein", version: "0.1", channel: "crate" },
  { name: "Apache 2.0", version: null, channel: "license" },
];

export default function ModuleStackBadges() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 8,
      }}
    >
      {MODULES.map((m) => (
        <div
          key={m.name}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            border: "1px solid var(--rule)",
            backgroundColor: "var(--bg-elev)",
          }}
        >
          <code
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 12,
              color: "var(--ink)",
            }}
          >
            {m.name}
          </code>
          {m.version && (
            <span
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 11,
                color: "var(--ink-mute)",
              }}
            >
              {m.version}
            </span>
          )}
          <span
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--ink-mute)",
              padding: "1px 5px",
              border: "1px solid var(--rule)",
            }}
          >
            {m.channel}
          </span>
        </div>
      ))}
    </div>
  );
}
