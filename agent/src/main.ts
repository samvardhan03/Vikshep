// SPDX-License-Identifier: AGPL-3.0-or-later
import { Command } from "commander";
import { McpBridge } from "./mcp/McpClient";
import { executeWST } from "./tools/ExecuteWSTTool";
import { selectRecipe } from "./recipes/index";

const AGENT_VERSION = "0.3.0";

// Phase D: replaced by a real POST to the vikshep-ingest /ingest endpoint.
async function ingestFile(
  _path: string,
): Promise<{ oid: string; signal_len: number; meta: Record<string, unknown> }> {
  throw new Error("ingest service not yet running — start backend first (Phase D)");
}

const program = new Command();
program.name("vikshep-agent").description("Vikshep control-plane agent").version(AGENT_VERSION);

program
  .command("process")
  .description("Ingest a file, select a pipeline recipe, and run it via the MCP backend")
  .requiredOption("--input <file>", "Input data file path (e.g. jets.root, data.h5)")
  .requiredOption("--request <text>", "Natural language description of the pipeline task")
  .action(async (options: { input: string; request: string }) => {
    const bridge = new McpBridge();
    try {
      await bridge.connect();

      const { oid, signal_len, meta } = await ingestFile(options.input);
      const recipe = selectRecipe(options.request);
      console.log(`[vikshep] recipe=${recipe.id} oid=${oid}`);

      for (const step of recipe.steps) {
        const cfg =
          step.cfgFrom === "ingestMeta"
            ? meta
            : step.cfgFrom === "fixed"
              ? (step.cfg ?? {})
              : {};

        if (step.tool === "compute_scattering") {
          const result = await executeWST(bridge, { input_oid: oid, signal_len, cfg });
          if (!result.success) {
            console.error(`[vikshep] ${step.tool} failed:`, result.error);
            process.exit(1);
          }
          console.log(`[vikshep] ${step.tool} ok`);
        } else {
          console.log(`[vikshep] step ${step.tool} — wired in Phase E/H`);
        }
      }
    } catch (err) {
      console.error("[vikshep] fatal:", err instanceof Error ? err.message : String(err));
      process.exit(1);
    } finally {
      await bridge.disconnect();
    }
  });

program.parse(Bun.argv);
