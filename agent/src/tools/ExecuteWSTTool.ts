import type { McpBridge } from "@mcp/McpClient";
import { ComputeScatteringInput } from "@mcp/schemas";

// Switches to "compute_scattering" after FOLDER 2's Phase H merges.
const TOOL = process.env.VIKSHEP_SCATTER_TOOL ?? "generate_fingerprint";

export async function executeWST(bridge: McpBridge, input: unknown) {
  const p = ComputeScatteringInput.safeParse(input);
  if (!p.success) {
    return { success: false, data: null, error: p.error.issues.map((i) => i.message).join("; ") };
  }
  const res = await bridge.callTool(TOOL, p.data as Record<string, unknown>);
  return res.isError
    ? { success: false, data: null, error: res.content }
    : { success: true, data: JSON.parse(res.content) as unknown };
}
