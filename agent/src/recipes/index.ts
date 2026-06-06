export interface RecipeStep {
  tool: string;
  cfgFrom: "ingestMeta" | "request" | "fixed";
  cfg?: Record<string, unknown>;
}

export interface Recipe {
  id: string;
  keywords: string[];
  steps: RecipeStep[];
}

import { hepTaggingDisco } from "./hepTaggingDisco";
import { bsmAnomaly } from "./bsmAnomaly";
import { generalFeature } from "./generalFeature";

export const RECIPES: Recipe[] = [hepTaggingDisco, bsmAnomaly, generalFeature];

export function selectRecipe(request: string): Recipe {
  const r = request.toLowerCase();
  const scored = RECIPES.map((x) => ({ x, n: x.keywords.filter((k) => r.includes(k)).length }));
  scored.sort((a, b) => b.n - a.n);
  return (scored[0]?.n ?? 0) > 0 ? scored[0]!.x : generalFeature;
}
