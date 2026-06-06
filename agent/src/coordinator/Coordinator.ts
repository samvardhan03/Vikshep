import type { McpBridge } from "@mcp/McpClient";
import { MessageBus } from "./MessageBus";
import { SubAgent } from "./SubAgent";

export class Coordinator {
  private bus = new MessageBus();

  constructor(private bridge: McpBridge) {}

  async run(
    steps: Array<{ tool: string; args: Record<string, unknown> }>,
  ): Promise<unknown[]> {
    const results: unknown[] = [];
    for (const step of steps) {
      const agent = new SubAgent(this.bridge, step.tool);
      const result = await agent.execute(step.args);
      this.bus.emit("step_done", { tool: step.tool, result });
      results.push(result);
    }
    return results;
  }

  on(event: string, handler: (payload: unknown) => void): void {
    this.bus.on(event, handler);
  }
}
