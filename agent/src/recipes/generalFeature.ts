import type { Recipe } from "./index";

export const generalFeature: Recipe = {
  id: "general-feature",
  keywords: ["feature", "extract", "scatter", "plasma", "cosmo", "fluid", "general"],
  steps: [
    { tool: "compute_scattering", cfgFrom: "request" },
    { tool: "reduce_scattering", cfgFrom: "request" },
  ],
};
