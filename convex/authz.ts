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
  const hasExplicitAllowlist = Boolean((process.env.RC_ADMIN_EMAILS ?? "").trim() || (process.env.RC_ADMIN_DOMAINS ?? "").trim());
  if (hasExplicitAllowlist && !isAuthorizedRcAdminEmail(user.email)) {
    throw new Error("Forbidden");
  }
  return user;
}
