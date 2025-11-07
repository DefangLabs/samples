import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { mastra } from "@/mastra";

export async function POST(req: NextRequest) {
  const { owner, repo } = await req.json();

  const resourceId = (await cookies()).get("resourceId")!.value;
  const resourceThreads = await mastra.memory?.getThreadsByResourceId({
    resourceId,
  });

  const threads = resourceThreads?.filter(
    (thread) =>
      thread.metadata?.owner === owner && thread.metadata?.repo === repo,
  );

  if (!threads || threads.length === 0) {
    const thread = await mastra.memory?.createThread({
      resourceId,
      metadata: { owner, repo },
    });

    if (thread) {
      redirect(`/${owner}/${repo}/${thread?.id}`);
    }
  }
}
