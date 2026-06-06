/**
 * src/mcp/McpClient.ts
 * --------------------
 * Bridge between the Bun/TypeScript orchestrator and the Python
 * transient_wst MCP server.
 *
 * Spawns the Python MCP server as a subprocess communicating over
 * stdio transport, wrapping the @modelcontextprotocol/sdk Client.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface McpToolResult {
  /** Raw text content returned by the tool (typically JSON). */
  content: string;
  /** Whether the tool execution reported an error. */
  isError: boolean;
}

export interface McpBridgeConfig {
  /** Command to start the Python MCP server (default: "python3"). */
  pythonCommand?: string;
  /** Arguments for the server process. */
  serverArgs?: string[];
  /** Name of the client for MCP handshake. */
  clientName?: string;
  /** Client version for MCP handshake. */
  clientVersion?: string;
}

// ── Default configuration ─────────────────────────────────────────────────────

// Resolution order (no machine-specific fallback):
//   1. $OMNIPULSE_MCP_BIN env var
//   2. PATH lookup via `which omnipulse-mcp`
//   3. throw with install instructions
function resolveMcpBin(): string {
  if (process.env.OMNIPULSE_MCP_BIN) {
    return process.env.OMNIPULSE_MCP_BIN;
  }
  try {
    const { execSync } = require("child_process") as typeof import("child_process");
    const found = execSync("which omnipulse-mcp", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (found) return found;
  } catch {
    // `which` not found or omnipulse-mcp not on PATH — fall through to error
  }
  throw new Error(
    "[McpBridge] omnipulse-mcp not found.\n" +
    "  Install: cargo install omnipulse-mcp\n" +
    "  Or set:  export OMNIPULSE_MCP_BIN=/path/to/omnipulse-mcp"
  );
}

const DEFAULT_CONFIG: Required<McpBridgeConfig> = {
  pythonCommand: resolveMcpBin(), // field name retained; now points to the Rust bin
  serverArgs: [],
  clientName: "vikshep-agent",
  clientVersion: "0.3.0",
};

// ── MCP Bridge ────────────────────────────────────────────────────────────────

/**
 * MCP client bridge that spawns and communicates with the Python
 * transient_wst MCP server over stdio.
 *
 * Usage:
 * ```ts
 * const bridge = new McpBridge();
 * await bridge.connect();
 * const result = await bridge.callTool("execute_wst", { ... });
 * await bridge.disconnect();
 * ```
 */
export class McpBridge {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private config: Required<McpBridgeConfig>;
  private _connected = false;

  constructor(config?: McpBridgeConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = new Client(
      {
        name: this.config.clientName,
        version: this.config.clientVersion,
      },
      {
        capabilities: {},
      },
    );
  }

  /**
   * Spawn the Python MCP server and establish the stdio connection.
   *
   * @throws Error if the transport fails to initialise or the
   *   server handshake times out.
   */
  async connect(): Promise<void> {
    if (this._connected) {
      console.warn("[McpBridge] Already connected. Skipping.");
      return;
    }

    console.log(
      `[McpBridge] Spawning MCP server: ${this.config.pythonCommand} ${this.config.serverArgs.join(" ")}`,
    );

    this.transport = new StdioClientTransport({
      command: this.config.pythonCommand,
      args: this.config.serverArgs,
    });

    await this.client.connect(this.transport);
    this._connected = true;
    console.log("[McpBridge] Connected to transient-wst MCP server.");
  }

  /**
   * Invoke an MCP tool by name with the given arguments.
   *
   * @param name  - Tool identifier registered on the Python server.
   * @param args  - Arguments matching the tool's input schema.
   * @returns       Parsed tool result with content and error flag.
   */
  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<McpToolResult> {
    if (!this._connected) {
      throw new Error(
        "[McpBridge] Not connected. Call connect() before callTool().",
      );
    }

    console.log(`[McpBridge] Calling tool: ${name}`);

    const result = await this.client.callTool({
      name,
      arguments: args,
    });

    // Extract text content from the MCP response
    const textContent = (result.content as Array<{ type: string; text?: string }>)
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");

    return {
      content: textContent,
      isError: result.isError === true,
    };
  }

  /**
   * List all tools available on the connected MCP server.
   */
  async listTools(): Promise<Array<{ name: string; description?: string }>> {
    if (!this._connected) {
      throw new Error("[McpBridge] Not connected.");
    }

    const response = await this.client.listTools();
    return response.tools.map((t) => {
      const entry: { name: string; description?: string } = { name: t.name };
      if (t.description !== undefined) entry.description = t.description;
      return entry;
    });
  }

  /**
   * Gracefully shut down the MCP connection and subprocess.
   */
  async disconnect(): Promise<void> {
    if (!this._connected) return;

    try {
      await this.client.close();
    } catch {
      // Best-effort cleanup
    }
    this.transport = null;
    this._connected = false;
    console.log("[McpBridge] Disconnected from MCP server.");
  }

  /** Whether the bridge is currently connected. */
  get connected(): boolean {
    return this._connected;
  }
}
