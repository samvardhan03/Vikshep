import { ImageResponse } from "next/og";

// Link preview for the whole site (pages without their own image inherit it).
export const alt = "Vikshep — deterministic features for physics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#FBF1E6",
          color: "#1B1B1F",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: "#C2461F" }}>
          SCIENTIFIC COMPUTE INFRASTRUCTURE
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, lineHeight: 1.05 }}>Deterministic features</div>
          <div style={{ display: "flex", fontSize: 92, lineHeight: 1.05 }}>for physics.</div>
          <div style={{ display: "flex", fontSize: 40, marginTop: 28, color: "#4A4A52" }}>
            Wavelet scattering and DisCo-decorrelated tagging for Geant4 data.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "#4A4A52" }}>
          <div style={{ display: "flex" }}>pip install vikshep-ingest</div>
          <div style={{ display: "flex", color: "#1B1B1F" }}>Vikshep · AGPL-3.0</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
