"use server"

const mcpServiceUrl = process.env.MCP_SERVICE_URL || "http://localhost:8000";

export async function forwardAction(message: string) {
  try {
    const response = await fetch(mcpServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [message] }),
    });
  
    const data = await response.json();

    return data.response;
  } catch (error) {
    throw new Error(`Internal server error url: ${mcpServiceUrl}: ${error}`);
  }
}
