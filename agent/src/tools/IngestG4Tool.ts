/**
 * IngestG4Tool — shells to `vikshep-ingest g4` and returns the manifest + shm OIDs.
 *
 * No float tensors are returned; only 28-char shm names, the manifest dict,
 * and scalar metadata cross the control plane.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { IngestG4Input } from "../../../contract/mcpSchemas";
import type { z } from "zod";

const exec = promisify(execFile);

export type IngestG4InputT = z.infer<typeof IngestG4Input>;

export async function ingestG4(input: IngestG4InputT): Promise<{
  manifest: Record<string, unknown>;
  gridOids: string[];
  manifestPath: string;
}> {
  const args: string[] = ["g4", input.path, "--schema", input.schema];

  if (input.columnMap) {
    args.push("--column-map", JSON.stringify(input.columnMap));
  }

  const outDir = input.outDir ?? path.dirname(input.path);
  args.push("--out", outDir);

  const { stdout, stderr } = await exec("vikshep-ingest", args, { timeout: 120_000 });

  const manifestPath = path.join(outDir, "manifest.json");
  let manifest: Record<string, unknown>;
  try {
    const raw = await readFile(manifestPath, "utf8");
    manifest = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `vikshep-ingest g4 did not produce manifest.json at ${manifestPath}.\n` +
      `stdout: ${stdout}\nstderr: ${stderr}`
    );
  }

  const gridOids = (manifest.grid_oids as string[] | undefined) ?? [];

  // Validate seam: no raw float arrays returned
  delete manifest.aggregates;  // aggregates stay in manifest.json, not on the wire

  return { manifest, gridOids, manifestPath };
}
