import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { coreAuthConfigured } from "@/lib/auth-config";

export async function getCurrentSession() {
  if (!coreAuthConfigured) {
    return null;
  }

  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  if (!coreAuthConfigured) {
    redirect("/setup");
  }

  const session = await getCurrentSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}
