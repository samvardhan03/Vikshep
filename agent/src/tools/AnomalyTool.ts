import type { McpBridge } from "@mcp/McpClient";
import { DetectAnomalyInput } from "@mcp/schemas";

export interface AnomalyDetectionResult {
  success: boolean;
  data: { is_anomaly: boolean; distance: number; nearest_oid: string | null } | null;
  error?: string;
}

export async function detectAnomaly(
  bridge: McpBridge,
  input: unknown,
): Promise<AnomalyDetectionResult> {
  const p = DetectAnomalyInput.safeParse(input);
  if (!p.success) {
    return { success: false, data: null, error: p.error.issues.map((i) => i.message).join("; ") };
  }
  const res = await bridge.callTool("detect_anomaly", p.data as Record<string, unknown>);
  return res.isError
    ? { success: false, data: null, error: res.content }
    : {
        success: true,
        data: JSON.parse(res.content) as AnomalyDetectionResult["data"],
      };
}
