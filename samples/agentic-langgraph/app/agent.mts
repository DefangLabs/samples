
import { TavilySearch } from "@langchain/tavily";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";

// Define the tools for the agent to use
const tools = [new TavilySearch({ maxResults: 3 })];
const toolNode = new ToolNode(tools);

const baseUrl = process.env.LLM_URL || "https://api.openai.com/v1/";
console.log("Using LLM base URL:", baseUrl);
const baseModel =  process.env.LLM_MODEL || "gpt-4o-mini";
console.log("Using LLM model:", baseModel);
// Create a model and give it access to the tools
const model = new ChatOpenAI({
  model: baseModel,
  temperature: 0.7,
  configuration: {
    baseURL: baseUrl,
  },
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user) using the special "__end__" node
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent") // __start__ is a special name for the entrypoint
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

// Helper function to get agent output for a given input and optional previous messages
const getAgentOutput = async (input: string, previousMessages: (HumanMessage | AIMessage)[] = []) => {
  
  const initialState = {
    messages: [...previousMessages, new HumanMessage(input)],
  };

  const finalState = await app.invoke(initialState);
  return {
    content: finalState.messages[finalState.messages.length - 1].content,
    messages: finalState.messages,
  };
};

// Helper function to get agent output as a readablestring
export const getAgentOutputAsString = async (input: string, previousMessages: (HumanMessage | AIMessage)[] = []) => {
  return getAgentOutput(input, previousMessages).then(result => result.content);
};

// // Example usage:
// (async () => {
//   // First query
//   const firstResult = await getAgentOutput("what is the weather in sf");
//   console.log(firstResult.content);

//   // Follow-up query with context
//   const secondResult = await getAgentOutput("what about ny", firstResult.messages);
//   console.log(secondResult.content);
// })();
