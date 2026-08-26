/**
 * The one agent this server exposes.
 *
 * `memory` is backed by the same Postgres database as the rest of the server,
 * so a conversation survives a restart and continues correctly even if the
 * next request lands on a different replica.
 *
 * `model` and `memory` are passed as functions so Mastra resolves them at
 * request time. The container therefore starts even before the database and
 * the model gateway are reachable, which keeps startup order simple.
 */

import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { getChatModel } from "../model";
import { getStorage } from "../storage";
import { serverInfo } from "../tools/server-info";

let memory: Memory | undefined;

function getMemory(): Memory {
  memory ??= new Memory({
    storage: getStorage(),
    options: { lastMessages: 10 },
  });
  return memory;
}

export const assistantAgent = new Agent({
  id: "assistantAgent",
  name: "assistantAgent",
  instructions: `
    You are the assistant for a self-hosted Mastra server.

    Use the serverInfo tool whenever the user asks about the server itself —
    which instance answered, how long it has been up, what stores its data, or
    whether authentication is on. Report the values exactly as the tool returns
    them and never invent them.

    You remember earlier turns of the conversation. If the user tells you their
    name or a preference, use it later without being asked again.

    Keep answers short and concrete.
  `,
  model: getChatModel,
  memory: getMemory,
  tools: { serverInfo },
});
