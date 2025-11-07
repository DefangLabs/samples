import { gh } from "@/lib/utils";
import { CardDescription } from "../ui/card";
import { SuggestedRepoButton } from "./SuggestedRepoButton";

export async function SuggestedRepo({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) {
  let description: string | null = null;

  try {
    const repoRes = await gh.rest.repos.get({ owner, repo });
    description = repoRes.data.description;
  } catch {}

  return (
    <SuggestedRepoButton owner={owner} repo={repo}>
      <CardDescription className="line-clamp-2">{description}</CardDescription>
    </SuggestedRepoButton>
  );
}
