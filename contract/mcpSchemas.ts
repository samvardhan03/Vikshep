import { z } from "zod";
import { OID } from "./objectId";

export const ScatterCfg = z.object({
  J: z.number().int().min(1).max(14),
  Q: z.number().int().min(1).max(32),
  L: z.number().int().min(1).max(16).default(1),
  order: z.number().int().min(1).max(3).default(2),
  dim: z.enum(["1", "2", "3"]).default("1"),
  group: z.enum(["trivial", "so2", "so3"]).default("trivial"),
  dim_shape: z.array(z.number().int().positive()).default([]),
});

export const ComputeScatteringInput = z.object({
  input_oid: OID,
  signal_len: z.number().int().positive(),
  cfg: ScatterCfg,
});

export const ReduceInput = z.object({
  coeff_oid: OID,
  method: z.enum(["mean", "std", "log_mean", "ratio"]).default("ratio"),
});

export const CompareInput = z.object({
  query_oid: OID,
  k: z.number().int().min(1).max(1000).default(10),
});

export const DetectAnomalyInput = z.object({
  query_oid: OID,
  tau: z.number().positive(),
  k: z.number().int().min(1).max(1000).default(10),
});

// INVARIANT: no *Input value carrier is z.array(z.number()). dim_shape is z.number().int() (shape).
