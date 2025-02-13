import asyncio
import os
from typing import Optional
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from anthropic import Anthropic
import logging
from quart import Quart, request, jsonify
from quart_cors import cors

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define an MCP client
class MCPClient:
    def __init__(self):
        # Initialize session and client objects
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.tools = []
        

    async def connect_to_server(self, server_script_path: str):
        """Connect to an MCP server
        
        Args:
            server_script_path: Path to the server script
        """
        
        # run the command to start the server
        server_params = StdioServerParameters(
            command="/app/.venv/bin/python",
            args=[server_script_path, "--local-timezone=America/Los_Angeles"],
            env=None
        )
        try:
            logger.info("Starting async context")
            stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
            self.stdio, self.write = stdio_transport
            self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))
            
            await self.session.initialize()

            # List available tools  
            response = await self.session.list_tools()
            self.tools = response.tools
            
            logger.info("\nConnected to server with tools:", [tool.name for tool in self.tools])
            
        except Exception as e:
            logger.error(f"Failed to connect to server: {e}")
            await self.cleanup()
            raise

    async def process_query(self, query: str) -> str:
        """Process a query using Claude and available tools"""
        messages = [
            {
                "role": "user",
                "content": query
            }
        ]

        available_tools = [{ 
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.inputSchema
        } for tool in self.tools]
        
        # Initial Claude API call
        response = self.anthropic.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1000,
            messages=messages,
            tools=available_tools
        )

        # Process response and handle tool calls
        tool_results = []
        final_text = []

        # loops through content, and if content.type is a tool_use, calls the tool
        for content in response.content:
            if content.type == 'text':
                final_text.append(content.text)
            elif content.type == 'tool_use':
                tool_name = content.name
                tool_args = content.input
                logger.info(f"Noticed tool {tool_name} with args {tool_args}")
                
                if self.session is None:
                    logger.error("Session not initialized. Exiting.")
                    return jsonify({"response": "Session not initialized. Exiting."})

                try:
                    # Execute tool call
                    await self.session.initialize()
                    result = await self.session.call_tool(tool_name, tool_args)

                    tool_results.append({"call": tool_name, "result": result})
                    final_text.append(f"[Calling tool {tool_name} with args {tool_args}]")

                    # Continue conversation with tool results
                    if hasattr(content, 'text') and content.text:
                        messages.append({
                        "role": "assistant",
                        "content": content.text
                        })
                    messages.append({
                        "role": "user", 
                        "content": result.content
                    })
                except Exception as e:
                    logger.error(f"Failed to call tool {tool_name}: {(e)}")
                    final_text.append(f"Failed to call tool {tool_name}: {(e)}")
                    return jsonify({"response": "\n".join(final_text)}) 

                # Get completed response from Claude with tool results
                response = self.anthropic.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1000,
                    messages=messages,
                )

                final_text.append(response.content[0].text)

        logger.info(f"Final text: {final_text}")
        logger.info(f"Tool Results: {tool_results}")
        return jsonify({"response": response.content[0].text})

    async def cleanup(self):
        """Clean up resources"""
        await self.exit_stack.aclose()

# let's start a Quart server
app = Quart(__name__)
app = cors(app, allow_origin="*")

@app.route('/', methods=['POST'])
async def chat():
    client = MCPClient()
    try:
        data = await request.get_json()
        query = data.get('messages', [None])[0]
        logger.info(f"Received query: {query}")
        await client.connect_to_server("/app/.venv/bin/mcp-server-time")
        return await client.process_query(query)
    finally:
        await client.cleanup()

async def main():
    print("app OK")

if __name__ == "__main__":
    app.run(port=8000, host='0.0.0.0')
    asyncio.run(main())
