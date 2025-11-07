"use client";

import { memo, useEffect } from "react";
import { useAction } from "next-safe-action/hooks";
import type { FC, PropsWithChildren } from "react";

import { createResourceId } from "@/actions/createResourceIdAction";

const ResourceProvider: FC<
  PropsWithChildren<{ resourceId: string | undefined }>
> = ({ children, resourceId }) => {
  const { execute } = useAction(createResourceId);

  useEffect(() => {
    if (!resourceId) {
      console.log("executing");
      execute();
    }
  }, [execute, resourceId]);

  if (!resourceId) return null;
  return <>{children}</>;
};

export const MemoizedResourceProvider = memo(
  ResourceProvider,
  (prev, next) => prev.resourceId === next.resourceId,
);
