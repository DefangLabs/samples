"use client";

import {
  type PropsWithChildren,
  useEffect,
  type FC,
  memo,
  useState,
  useRef,
} from "react";
import type { StorageThreadType } from "@mastra/core";
import { createThread } from "@/actions/createThread";
import { useAction } from "next-safe-action/hooks";

export const EnsureThreadImpl: FC<
  PropsWithChildren<{
    owner: string;
    repo: string;
    threads: StorageThreadType[] | undefined;
  }>
> = ({ owner, repo, threads, children }) => {
  const [checked, setChecked] = useState(!!threads?.length);
  const effectRan = useRef(false);

  const { execute, isPending } = useAction(createThread, {
    onSettled: () => setChecked(true),
  });

  /**
   * BUG: In development mode, this fires twice and creates two threads
   * Doesn't happen in production environment
   */
  useEffect(() => {
    if (effectRan.current) return;

    if (!checked && !isPending) {
      execute({ owner, repo });
    }

    return () => {
      effectRan.current = false;
    };
  }, [checked, execute, isPending, owner, repo]);

  if (!checked) return null;
  return <>{children}</>;
};

export const EnsureThread = memo(
  EnsureThreadImpl,
  (prev, next) =>
    prev.repo === next.repo &&
    prev.owner === next.owner &&
    prev.threads?.length === next.threads?.length,
);
