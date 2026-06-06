import type { McpBridge } from "@mcp/McpClient";
import { OID } from "@mcp/schemas";

export interface ClassifierResult {
  success: boolean;
  data: unknown;
  error?: string;
}

export async function runClassifier(
  bridge: McpBridge,
  featureOid: unknown,
): Promise<ClassifierResult> {
  const p = OID.safeParse(featureOid);
  if (!p.success) {
    return {
      success: false,
      data: null,
      error: "invalid feature_oid: " + (p.error.issues[0]?.message ?? "unknown"),
    };
  }
  const res = await bridge.callTool("run_classifier", { feature_oid: p.data });
  return res.isError
    ? { success: false, data: null, error: res.content }
    : { success: true, data: JSON.parse(res.content) as unknown };
}
