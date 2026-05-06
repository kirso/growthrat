import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import { authComponent } from "./auth";

type AuthCtx = QueryCtx | MutationCtx | ActionCtx;

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

export async function requireRcAdmin(ctx: AuthCtx) {
  const user = await authComponent.getAuthUser(ctx);
  if (!user?.email) {
    throw new Error("Not authenticated");
  }
  if (!isAuthorizedRcAdminEmail(user.email)) {
    throw new Error("Forbidden");
  }
  return user;
}

export function requireInternalServerToken(token: string | undefined | null) {
  const expected =
    process.env.GROWTHCAT_INTERNAL_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET;
  if (!expected || token !== expected) {
    throw new Error("Unauthorized");
  }
}
