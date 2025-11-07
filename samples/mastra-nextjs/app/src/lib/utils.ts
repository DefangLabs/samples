import { Octokit } from "octokit";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const gh = new Octokit({
  auth: process.env.GITHUB_TOKEN!,
});
