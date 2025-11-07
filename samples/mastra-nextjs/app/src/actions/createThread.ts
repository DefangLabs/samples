"use server";

import { z } from "zod";
import { actionClient } from ".";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export const createThread = actionClient
  .metadata({ actionName: "createThread" })
  .schema(z.object({ owner: z.string(), repo: z.string() }))
  .action(async ({ ctx, parsedInput: { owner, repo } }) => {
    const resourceId = (await cookies()).get("resourceId")?.value;

    if (!resourceId) throw new Error("Could not create thread");

    const thread = await ctx.mastra.memory?.createThread({
      resourceId,
      metadata: { owner, repo },
    });

    if (!thread) throw new Error("Could not create thread");

    redirect(`/${owner}/${repo}/${thread.id}`);
  });
