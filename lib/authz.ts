import { redirect } from "next/navigation";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";

function parseCsv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function emailDomain(email: string): string {
  const [, domain = ""] = email.toLowerCase().split("@");
  return domain;
}

export function isAuthorizedRcAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  const allowedEmails = parseCsv(process.env.RC_ADMIN_EMAILS);
  const allowedDomains = parseCsv(process.env.RC_ADMIN_DOMAINS);

  return allowedEmails.includes(normalized) || allowedDomains.includes(emailDomain(normalized));
}

export async function getAuthorizedRcAdmin() {
  let authenticated = false;
  try {
    authenticated = await isAuthenticated();
  } catch {
    redirect("/sign-in");
  }

  if (!authenticated) {
    redirect("/sign-in");
  }

  let user: { email?: string | null } | null = null;
  try {
    user = await fetchAuthQuery(api.auth.getCurrentUser, {});
  } catch {
    redirect("/sign-in");
  }

  if (!user?.email || !isAuthorizedRcAdminEmail(user.email)) {
    redirect("/sign-in?error=forbidden");
  }

  return user;
}
