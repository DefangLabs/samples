"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState, type FC, type PropsWithChildren } from "react";

import { Button } from "../ui/button";
import { validateRepositoryInput } from "@/actions/validateRepositoryInput";

export const EnsureRepo: FC<PropsWithChildren> = ({ children }) => {
  const { owner, repo } = useParams();
  const [validated, setValidated] = useState(false);

  const { execute, hasErrored } = useAction(validateRepositoryInput, {
    onSettled: () => setValidated(true),
  });

  useEffect(() => {
    if (!validated) {
      execute({ input: `${owner}/${repo}`, redirect: false });
    }
  }, [execute, owner, repo, validated]);

  if (hasErrored)
    return (
      <div className="h-dvh flex flex-col items-center justify-center">
        <h1 className="font-semibold text-lg">Error retrieving repository</h1>
        <Button variant="link">
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    );

  if (!validated) return null;
  return <>{children}</>;
};
