function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

function json(value: unknown) {
  try {
    return JSON.stringify(value ?? {});
  } catch {
    return "{}";
  }
}

export async function recordReportDelivery(
  env: Env,
  input: {
    reportId?: string | null;
    runId?: string | null;
    channel: string;
    status: "pending" | "delivered" | "failed";
    destination?: string | null;
    externalId?: string | null;
    errorMessage?: string | null;
    detail?: unknown;
  },
) {
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(
      `insert into report_deliveries (
        id, report_id, run_id, channel, status, destination, external_id,
        error_message, detail_json, delivered_at, created_at, updated_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id("deliv"),
        input.reportId ?? null,
        input.runId ?? null,
        input.channel,
        input.status,
        input.destination ?? null,
        input.externalId ?? null,
        input.errorMessage ?? null,
        json(input.detail),
        input.status === "delivered" ? now : null,
        now,
        now,
      )
      .run();
  } catch {
    return null;
  }

  return true;
}
