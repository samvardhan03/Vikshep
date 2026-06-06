import { z } from "zod";
import { OID } from "./objectId";

export const PreviewMsg = z.object({
  type: z.literal("preview"),
  coeff_oid: OID,
  dim: z.enum(["1", "2", "3"]),
  group: z.enum(["trivial", "so2", "so3"]),
  exec_ms: z.number(),
  thumbnail: z.object({
    w: z.number().int().max(256),
    h: z.number().int().max(256),
    maxpool: z.array(z.number()),
  }),
  summary: z.object({
    mean: z.number(),
    std: z.number(),
    l2: z.number(),
    n_paths: z.number().int(),
  }),
});

export const PipelineEvent = z.object({
  type: z.literal("pipeline"),
  node: z.string(),
  status: z.enum(["start", "done", "error"]),
  exec_ms: z.number().optional(),
});

// The browser NEVER receives a full coefficient tensor; only coeff_oid + thumbnail + summary.
