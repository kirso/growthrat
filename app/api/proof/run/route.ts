import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchAuthAction, fetchAuthQuery } from "@/lib/auth-server";
import { isAuthorizedRcAdminEmail } from "@/lib/authz";

export async function POST() {
  try {
    const user = await fetchAuthQuery(api.auth.getCurrentUser, {});
    if (!user?.email || !isAuthorizedRcAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await fetchAuthAction(api.agentActions.triggerProofCycle, {});

    if (!result?.triggered) {
      return NextResponse.json(
        {
          ok: false,
          started: [],
          error: result?.reason ?? "Proof cycle was not triggered.",
          mode: result?.mode ?? null,
          isActive: result?.isActive ?? null,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      started: result.steps ?? [],
      message: "Proof cycle triggered. Check the dashboard for live artifact updates.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to trigger proof cycle";
    const status = /auth/i.test(message) ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
