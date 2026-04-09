import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { api } from "@/convex/_generated/api";
import { fetchAuthAction, fetchAuthQuery } from "@/lib/auth-server";
import { isAuthorizedRcAdminEmail } from "@/lib/authz";

type OnboardingSubmitBody = {
  connector: string;
  payload?: Record<string, unknown>;
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableJson(entry)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

function signEnvelope(envelope: unknown, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(stableJson(envelope))
    .digest("hex");
}

function getInternalSecret(): string | null {
  return process.env.GROWTHCAT_INTERNAL_SECRET ?? null;
}

export async function GET() {
  try {
    const user = await fetchAuthQuery(api.auth.getCurrentUser, {});
    if (!user?.email || !isAuthorizedRcAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [connectors, config] = await Promise.all([
      fetchAuthQuery(api.onboarding.getConnectorStatuses, {}),
      fetchAuthQuery(api.agentConfig.get, {}),
    ]);

    return NextResponse.json({ connectors, config }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load onboarding state";
    const status = /auth/i.test(message) ? 401 : 500;
    return NextResponse.json(
      {
        connectors: [],
        config: null,
        error: message,
      },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  const secret = getInternalSecret();

  if (!secret) {
    return NextResponse.json({ error: "Internal onboarding secret is not configured" }, { status: 503 });
  }

  try {
    const user = await fetchAuthQuery(api.auth.getCurrentUser, {});
    if (!user?.email || !isAuthorizedRcAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: OnboardingSubmitBody;
  try {
    body = (await req.json()) as OnboardingSubmitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const connector = typeof body.connector === "string" ? body.connector.trim() : "";
  if (!connector) {
    return NextResponse.json({ error: "Connector is required" }, { status: 400 });
  }

  const payload = body.payload ?? {};
  const timestamp = Date.now();
  const nonce = crypto.randomUUID();
  const envelope = { connector, payload, timestamp, nonce };
  const signature = signEnvelope(envelope, secret);

  try {
    const result = await fetchAuthAction(api.onboarding.submitConnectorSubmission, {
      connector,
      payload,
      timestamp,
      nonce,
      signature,
    });

    return NextResponse.json(result, { status: result?.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        connector,
        status: "error",
        errorSummary: error instanceof Error ? error.message : "Unable to submit connector",
      },
      { status: 500 }
    );
  }
}
