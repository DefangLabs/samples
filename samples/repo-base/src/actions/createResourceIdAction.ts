"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { actionClient } from ".";

export const createResourceId = actionClient
  .metadata({ actionName: "createResourceId" })
  .action(async () => {
    const cookieStore = await cookies();

    cookieStore.set("resourceId", crypto.randomUUID());

    revalidatePath("/");
  });
