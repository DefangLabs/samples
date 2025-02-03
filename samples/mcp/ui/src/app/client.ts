// import { ClientSession, HttpServerParameters, http_client } from "@modelcontextprotocol/sdk";

// export class MCPClient {
//   private session: ClientSession | null = null;

//   async connect() {
//     const serverUrl = process.env["GIT_SERVER_URL"]; // Get the Git server URL from environment variables
//     if (!serverUrl) {
//       throw new Error('GIT_SERVER_URL environment variable is not set');
//     }

//     try {
//       const serverParams = new HttpServerParameters(serverUrl);
//       const transport = await http_client(serverParams);
//       this.session = new ClientSession(transport);
//       await this.session.initialize();

//       // Connect to Docker image mcp/git
//       await this.session.connectToDockerImage('mcp/git');
//     } catch (error) {
//       console.error('Failed to connect to MCP server:', error);
//       throw error;
//     }
//   }

//   async listTools() {
//     if (!this.session) throw new Error('Not connected to MCP server');
//     try {
//       const response = await this.session.listResources();
//       return response.resources;
//     } catch (error) {
//       console.error('Failed to list tools:', error);
//       throw error;
//     }
//   }

//   async executeTool(toolName: string, args: any) {
//     if (!this.session) throw new Error('Not connected to MCP server');
//     try {
//       const response = await this.session.callTool(toolName, args);
//       return response.result;
//     } catch (error) {
//       console.error(`Failed to execute tool ${toolName}:`, error);
//       throw error;
//     }
//   }

//   async close() {
//     if (this.session) {
//       try {
//         await this.session.close();
//       } catch (error) {
//         console.error('Failed to close session:', error);
//       } finally {
//         this.session = null;
//       }
//     }
//   }

//   // Add this method to check if the client is connected to the server
//   async isConnected(): Promise<boolean> {
//     if (!this.session) return false;
//     try {
//       await this.session.listResources(); // Perform a simple request to check the connection
//       return true;
//     } catch (error) {
//       console.error('Failed to check connection:', error);
//       return false;
//     }
//   }
// }

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    const transport = new StdioClientTransport({
        "command": "/Users/lindalee/Library/Python/3.9/bin/uv",
        "args": [
                "run",
                "--directory",
                "/Users/lindalee/Documents/Github/nextjs-flask/weather",
                "weather.py"
        ]
    });

    const client = new Client(
        {
            name: "example-client",
            version: "1.0.0"
        },
        {
            capabilities: {
                prompts: {},
                resources: {},
                tools: {}
            }
        }
    );

    console.log('Connecting to server...');
    await client.connect(transport);
    console.log('Connected to server!');

    // // List prompts
    // const prompts = await client.listPrompts();

    // // Get a prompt
    // const prompt = await client.getPrompt("example-prompt", {
    //   arg1: "value"
    // });

    // // List resources
    // const resources = await client.listResources();

    // // Read a resource
    // const resource = await client.readResource("file:///example.txt");

    // Call a tool
    const result = await client.callTool({
        name: "get_alerts",
        arguments: {
            state: "CA"
        }
    });
    if (result) {
        console.log('Tool executed successfully:', result);
        // Send a message or perform any other action
    } else {
        console.error('Failed to get tool results');
    }
}

main().catch(error => {
    console.error('Error occurred:', error);
});
