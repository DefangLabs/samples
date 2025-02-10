"use server"

const mcpServiceUrl = process.env.MCP_SERVER_URL || "http://localhost:8000";

export async function forwardAction(message: string) {
  try {
    const response = await fetch(mcpServiceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: message,
    });
    
    // log the body of the response
    console.log(await response.text());

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Internal server error url: ${mcpServiceUrl}: ${error}`);
  }
}