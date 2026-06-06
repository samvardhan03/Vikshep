import type { Recipe } from "./index";

export const bsmAnomaly: Recipe = {
  id: "bsm-anomaly",
  keywords: ["anomaly", "bsm", "new physics", "outlier", "unknown", "model-independent"],
  steps: [
    { tool: "compute_scattering", cfgFrom: "ingestMeta" },
    { tool: "reduce_scattering", cfgFrom: "fixed", cfg: { method: "ratio" } },
    { tool: "detect_anomaly", cfgFrom: "request" },
  ],
};
