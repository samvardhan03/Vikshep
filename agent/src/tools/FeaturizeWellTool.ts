/**
 * FeaturizeWellTool — runs the wavelet-scattering engine on a Well shm buffer.
 *
 * Accepts a 28-char shm OID from WellSliceTool, passes it to the engine via
 * vikshep-ingest well featurize, and returns the resulting feature OID + metadata.
 * No raw tensors cross the control plane.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { FeaturizeWellInput } from "../../contract/mcpSchemas";
import type { z } from "zod";

const exec = promisify(execFile);

export type FeaturizeWellInputT = z.infer<typeof FeaturizeWellInput>;

export async function featurizeWell(input: FeaturizeWellInputT): Promise<{
  featureOid: string;
  dataset: string;
  fieldNames: string[];
  channels: number;
}> {
  if (input.shmOid.length !== 28) {
    throw new Error(
      `shmOid must be exactly 28 hex chars, got ${input.shmOid.length}: ${input.shmOid}`
    );
  }

  const args: string[] = [
    "well", "featurize",
    "--shm-oid",  input.shmOid,
    "--dataset",  input.dataset,
    "--fields",   ...input.fieldNames,
  ];

  const outDir = path.join(os.tmpdir(), `vikshep_feat_${Date.now()}`);
  args.push("--out", outDir);

  const { stdout, stderr } = await exec("vikshep-ingest", args, { timeout: 300_000 });

  const resultPath = path.join(outDir, "features.json");
  let result: Record<string, unknown>;
  try {
    const raw = await readFile(resultPath, "utf8");
    result = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `vikshep-ingest well featurize did not produce features.json at ${resultPath}.\n` +
      `stdout: ${stdout}\nstderr: ${stderr}`
    );
  }

  const featureOid = result.feature_oid as string;
  if (!featureOid || featureOid.length !== 28) {
    throw new Error(`feature_oid in output is missing or not 28 chars: ${featureOid}`);
  }

  return {
    featureOid,
    dataset:    input.dataset,
    fieldNames: input.fieldNames,
    channels:   (result.channels as number) ?? 0,
  };
}
