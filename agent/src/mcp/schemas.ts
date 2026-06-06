import { z } from "zod";

// Contract seam re-exports — 28-hex OID + new MCP tool schemas
export { OID, type Oid } from "../../../contract/objectId";
export {
  ScatterCfg,
  ComputeScatteringInput,
  ReduceInput,
  CompareInput,
  DetectAnomalyInput,
} from "../../../contract/mcpSchemas";

// Legacy schemas retained for QueryEngine and ArtifactRejectionTool
export const WSTResultSchema = z.object({
  snr_db: z.number(),
  variance: z.array(z.number()),
  null_count: z.number().int().min(0),
  n_files_processed: z.number().int().min(0),
  output_shape: z.array(z.number().int()),
  outlier_paths: z.array(z.number().int()),
  pca_applied: z.boolean(),
  pca_components: z.number().int().nullable(),
});
export type WSTResult = z.infer<typeof WSTResultSchema>;

export const EvaluationConfigSchema = z.object({
  variance_threshold: z.number().positive().nullable().default(null),
  variance_n_sigma: z.number().positive().default(3.0),
  min_snr_db: z.number().default(3.0),
  max_null_count: z.number().int().min(0).default(0),
});
export type EvaluationConfig = z.infer<typeof EvaluationConfigSchema>;
