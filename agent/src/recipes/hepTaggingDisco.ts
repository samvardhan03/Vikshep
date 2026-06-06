import type { Recipe } from "./index";

export const hepTaggingDisco: Recipe = {
  id: "hep-tagging-disco",
  keywords: ["tag", "jet", "mass", "decorrel", "disco", "sculpt", "background"],
  steps: [
    { tool: "compute_scattering", cfgFrom: "ingestMeta" },
    { tool: "reduce_scattering", cfgFrom: "fixed", cfg: { method: "ratio" } },
    { tool: "run_classifier", cfgFrom: "request" },
  ],
};
