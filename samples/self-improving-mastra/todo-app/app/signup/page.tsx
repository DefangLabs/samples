import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getSession()) redirect("/");
  return <AuthForm mode="signup" />;
}
