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

// Geant4 Direct Interface — ingest a Geant4 CSV export to POSIX shm.
export const IngestG4Input = z.object({
  path:       z.string().describe("Absolute or relative path to the Geant4 CSV file."),
  schema:     z.string().default("komal_v1").describe("Ingest profile name (komal_v1 or generic)."),
  columnMap:  z.record(z.string(), z.string()).optional()
               .describe("Override CSV column headers for the 'generic' profile."),
  outDir:     z.string().optional().describe("Directory to write manifest.json."),
});

// The Well pipeline — slice a trajectory and featurize it.
export const WellSliceInput = z.object({
  dataset:    z.string().describe("Well dataset name (e.g. 'turbulence_128')."),
  split:      z.string().default("train").describe("Dataset split (train/test/valid)."),
  trajStart:  z.number().int().min(0).describe("First trajectory index (inclusive)."),
  trajEnd:    z.number().int().min(0).describe("Last trajectory index (exclusive)."),
  stepStart:  z.number().int().min(0).default(0).describe("First time step (inclusive)."),
  stepEnd:    z.number().int().min(0).optional().describe("Last time step (exclusive; null = all)."),
  fields:     z.array(z.string()).optional().describe("Field names to include (null = all t0/t1/t2)."),
});

export const FeaturizeWellInput = z.object({
  shmOid:     z.string().length(28).describe("28-char shm OID from well_slice."),
  dataset:    z.string(),
  fieldNames: z.array(z.string()),
});

// INVARIANT: no *Input value carrier is z.array(z.number()). dim_shape is z.number().int() (shape).
