import { env } from "cloudflare:workers";
import { authorizeInternalRequest } from "@/lib/activation";
import {
  getConnectorChecks,
  upsertConnectedAccount,
  type ConnectorType,
} from "@/lib/connected-accounts";
import { recordEvent } from "@/lib/runtime";

export const prerender = false;

const connectorTypes = new Set<ConnectorType>([
  "revenuecat",
  "slack",
  "cms",
  "github",
  "postiz",
  "dataforseo",
  "x",
]);

function isConnectorType(value: unknown): value is ConnectorType {
  return typeof value === "string" && connectorTypes.has(value as ConnectorType);
}

export async function GET({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  return Response.json({
    ok: true,
    accountId: "revenuecat",
    connectors: await getConnectorChecks(env),
  });
}

export async function POST({ request }: { request: Request }) {
  const authorization = await authorizeInternalRequest(request, env);
  if (!authorization.ok) {
    return Response.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    connectorType?: unknown;
    credentials?: unknown;
    authMode?: "api_key" | "oauth";
    providedByEmail?: string;
    metadata?: Record<string, unknown>;
    scopes?: string[];
    expiresAt?: string;
  };

  if (!isConnectorType(body.connectorType)) {
    return Response.json(
      { error: "connectorType is required" },
      { status: 400 },
    );
  }

  if (!body.credentials || typeof body.credentials !== "object") {
    return Response.json({ error: "credentials are required" }, { status: 400 });
  }

  try {
    await upsertConnectedAccount(env, {
      connectorType: body.connectorType,
      credentials: body.credentials as Record<string, string>,
      authMode: body.authMode ?? "api_key",
      providedByEmail: authorization.session?.email ?? body.providedByEmail,
      metadata: body.metadata,
      scopes: body.scopes,
      expiresAt: body.expiresAt,
    });

    await recordEvent(env, {
      type: "rc_connector_connected",
      path: "/api/accounts/revenuecat/connectors",
      detail: {
        connectorType: body.connectorType,
        authMode: body.authMode ?? "api_key",
      },
    });

    return Response.json({
      ok: true,
      accountId: "revenuecat",
      connectors: await getConnectorChecks(env),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Connector connection failed",
      },
      { status: 400 },
    );
  }
}
