import type { McpBridge } from "@mcp/McpClient";

export class SubAgent {
  constructor(
    private bridge: McpBridge,
    private tool: string,
  ) {}

  async execute(args: Record<string, unknown>): Promise<unknown> {
    const res = await this.bridge.callTool(this.tool, args);
    if (res.isError) throw new Error(`${this.tool} error: ${res.content}`);
    return JSON.parse(res.content) as unknown;
  }
}
