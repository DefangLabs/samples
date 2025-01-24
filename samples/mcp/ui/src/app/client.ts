import { ClientSession, HttpServerParameters, http_client } from "@modelcontextprotocol/sdk";

export class MCPClient {
  private session: ClientSession | null = null;

  async connect() {
    const serverUrl = process.env["GIT_SERVER_URL"]; // Get the Git server URL from environment variables
    if (!serverUrl) {
      throw new Error('GIT_SERVER_URL environment variable is not set');
    }

    const serverParams = new HttpServerParameters(serverUrl);
    const transport = await http_client(serverParams);
    this.session = new ClientSession(transport);
    await this.session.initialize();

    // Connect to Docker image mcp/git
    await this.session.connectToDockerImage('mcp/git');
  }

  async listTools() {
    if (!this.session) throw new Error('Not connected to MCP server');
    const response = await this.session.listResources();
    return response.resources;
  }

  async executeTool(toolName: string, args: any) {
    if (!this.session) throw new Error('Not connected to MCP server');
    const response = await this.session.callTool(toolName, args);
    return response.result;
  }

  async close() {
    if (this.session) {
      await this.session.close();
      this.session = null;
    }
  }

  // Add this method to check if the client is connected to the server
  async isConnected(): Promise<boolean> {
    if (!this.session) return false;
    try {
      await this.session.listResources(); // Perform a simple request to check the connection
      return true;
    } catch (error) {
      return false;
    }
  }
}
