/**
 * WellSliceTool — downloads + ingests a Well HDF5 shard, returns manifest + shm OIDs.
 *
 * Shells to `vikshep-ingest well slice`. No float tensors cross the control plane;
 * only 28-char shm names and scalar manifest metadata are returned.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { WellSliceInput } from "../../../contract/mcpSchemas";
import type { z } from "zod";

const exec = promisify(execFile);

export type WellSliceInputT = z.infer<typeof WellSliceInput>;

export async function wellSlice(input: WellSliceInputT): Promise<{
  manifest: Record<string, unknown>;
  shmOids: string[];
}> {
  const args: string[] = [
    "well", "slice",
    "--dataset",    input.dataset,
    "--split",      input.split,
    "--traj-start", String(input.trajStart),
    "--traj-end",   String(input.trajEnd),
    "--step-start", String(input.stepStart),
  ];

  if (input.stepEnd !== undefined) {
    args.push("--step-end", String(input.stepEnd));
  }

  if (input.fields && input.fields.length > 0) {
    args.push("--fields", ...input.fields);
  }

  const outDir = path.join(os.tmpdir(), `vikshep_well_${Date.now()}`);
  args.push("--out", outDir);

  const { stdout, stderr } = await exec("vikshep-ingest", args, { timeout: 300_000 });

  const manifestPath = path.join(outDir, "manifest.json");
  let manifest: Record<string, unknown>;
  try {
    const raw = await readFile(manifestPath, "utf8");
    manifest = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `vikshep-ingest well slice did not produce manifest.json at ${manifestPath}.\n` +
      `stdout: ${stdout}\nstderr: ${stderr}`
    );
  }

  const shmOids = (manifest.shm_oids as string[] | undefined) ?? [];

  // Seam check: all OIDs must be 28 chars
  for (const oid of shmOids) {
    if (oid.length !== 28) {
      throw new Error(`Invalid OID length ${oid.length} (expected 28): ${oid}`);
    }
  }

  return { manifest, shmOids };
}
