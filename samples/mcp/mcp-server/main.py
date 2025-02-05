import asyncio
import os
from typing import Optional
from contextlib import AsyncExitStack

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from anthropic import Anthropic
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



# sample async function
async def test():
    print("Hello, world!")
    await asyncio.sleep(1)
    print("Goodbye, world!")
class MCPClient:
    def __init__(self):
        # Initialize session and client objects
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self.anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.tools = []
    # methods will go here

    async def connect_to_server(self, server_script_path: str):
        """Connect to an MCP server
        
        Args:
            server_script_path: Path to the server script (.py or .js)
        """
        
        # run the command to start the server
        server_params = StdioServerParameters(
            command="/app/.venv/bin/python",
#            args=[server_script_path],
            args=[server_script_path, "--local-timezone=America/Los_Angeles"],
            env=None
        )
        try:
           async with self.exit_stack:
                logger.error("starting async @@@@@@")
                stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
                self.stdio, self.write = stdio_transport
                self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))
                
                await self.session.initialize()
            
                # List available tools
                response = await self.session.list_tools()
                self.tools = response.tools
                
                print("\nConnected to server with tools:", [tool.name for tool in self.tools])
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

        response = await self.session.list_tools()
        available_tools = [{ 
            "name": tool.name,
            "description": tool.description,
            "input_schema": tool.inputSchema
        } for tool in response.tools]

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

        # loops through content, and if content is a tool_use, calls the tool
        for content in response.content:
            if content.type == 'text':
                final_text.append(content.text)
            elif content.type == 'tool_use':
                tool_name = content.name
                tool_args = content.input
                
                # Execute tool call
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

                # # Get next response from Claude
                # response = self.anthropic.messages.create(
                #     model="claude-3-5-sonnet-20241022",
                #     max_tokens=1000,
                #     messages=messages,
                # )

                final_text.append(response.content[0].text)

        return "\n".join(final_text)

    async def process_query2(self, query: str) -> str:
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

        # loops through content, and if content is a tool_use, calls the tool
        for content in response.content:
            if content.type == 'text':
                final_text.append(content.text)
            elif content.type == 'tool_use':
                tool_name = content.name
                tool_args = content.input
                
                # Execute tool call
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

        final_text.append(response.content[0].text)
        return jsonify({"response": "\n".join(final_text)})



    async def cleanup(self):
        """Clean up resources"""
        await self.exit_stack.aclose()

# async def main():
#     if len(sys.argv) < 2:
#         print("Usage: python client.py /Users/lindalee/Documents/Github/nextjs-flask/weather/weather.py")
#         sys.exit(1)
        
#     client = MCPClient()
#     try:
#         await client.connect_to_server(sys.argv[1])
#         await client.chat_loop()
#     finally:
#         await client.cleanup()

# if __name__ == "__main__":
#     import sys
#     asyncio.run(main())

# let's start a flask server
from flask import Flask, request, jsonify
from flask_cors import CORS
import atexit

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

client = MCPClient()

def cleanup():
    asyncio.create_task(client.cleanup())

atexit.register(cleanup)

async def initialize_client():
    await client.connect_to_server("/app/.venv/bin/mcp-server-time")

# Run the initialization
asyncio.run(initialize_client())

@app.route('/', methods=['POST'])
async def chat():

    # TODO: handle chat things in here

    # format the request
    # data = request.json
    # messages = data.get('messages', [])
    # if not messages or not isinstance(messages, list):
    #     return jsonify({"error": "No valid messages provided"}), 400

    # response = ""
    # for query in messages:
    #     if query:
    #         response += await client.process_query(query) + "\n"
    # return jsonify({"response": response})

    # response = await client.process_query("what's the time right now")
    # return jsonify({"response": response})

    return await client.process_query2("what's the time right now")




if __name__ == "__main__":
    app.run(port=8000, host='0.0.0.0')
