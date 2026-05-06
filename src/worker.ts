import { handle } from "@astrojs/cloudflare/handler";
import { Agent, routeAgentRequest } from "agents";
import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { ensureWeeklyExperiment } from "./lib/experiments";

type AgentState = {
  mode: string;
  lastPrompt?: string;
  lastUpdatedAt?: string;
  weeklyRuns: number;
};

type WeeklyLoopParams = {
  trigger: "manual" | "schedule" | "queue";
  dryRun?: boolean;
};

function currentWeekKey(now = new Date()) {
  const day = now.getUTCDay();
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export class GrowthRatAgent extends Agent<Env, AgentState> {
  initialState: AgentState = {
    mode: "interview_proof",
    weeklyRuns: 0,
  };

  async onMessage(_connection: unknown, message: unknown) {
    const text = typeof message === "string" ? message : JSON.stringify(message);
    this.setState({
      ...this.state,
      lastPrompt: text,
      lastUpdatedAt: new Date().toISOString(),
    });
  }

  getReadiness() {
    return {
      mode: this.state.mode,
      weeklyRuns: this.state.weeklyRuns,
      target: "RevenueCat Agentic AI and Growth Advocate",
      product:
        "autonomous developer advocacy loop for content, experiments, feedback, and reporting",
    };
  }

  async startWeeklyDryRun() {
    const instance = await this.env.WEEKLY_LOOP.create({
      params: {
        trigger: "manual",
        dryRun: true,
      },
    });

    this.setState({
      ...this.state,
      weeklyRuns: this.state.weeklyRuns + 1,
      lastUpdatedAt: new Date().toISOString(),
    });

    return {
      workflowId: instance.id,
      status: await instance.status(),
    };
  }
}

export class GrowthRatWeeklyWorkflow extends WorkflowEntrypoint<
  Env,
  WeeklyLoopParams
> {
  async run(event: Readonly<WorkflowEvent<WeeklyLoopParams>>, step: WorkflowStep) {
    const now = new Date().toISOString();
    const week = currentWeekKey();

    const experiment = await step.do("ensure weekly experiment", async () => {
      const detail = await ensureWeeklyExperiment(this.env, week.start);
      return detail
        ? {
            id: detail.id,
            slug: detail.slug,
            title: detail.title,
            status: detail.status,
            trackingLinks: detail.assets.map((asset) => ({
              title: asset.title,
              trackingId: asset.tracking_id,
              url: `/r/${asset.tracking_id}`,
            })),
          }
        : null;
    });

    const plan = await step.do("plan weekly loop", async () => ({
      trigger: event.payload.trigger,
      dryRun: event.payload.dryRun ?? true,
      weekStart: week.start,
      weekEnd: week.end,
      experiment,
      requiredOutputs: [
        "two content pieces",
        "one growth experiment with variants and tracking links",
        "daily metric snapshots or manual imports",
        "one experiment readout",
        "three feedback items",
        "community interactions",
        "weekly report",
      ],
    }));

    const r2Key = await step.do("write weekly proof bundle", async () => {
      const key = `weekly-runs/${week.start}/plan.json`;
      await this.env.ARTIFACT_BUCKET.put(
        key,
        JSON.stringify(
          {
            workflowId: event.instanceId,
            generatedAt: now,
            plan,
          },
          null,
          2,
        ),
        {
          httpMetadata: {
            contentType: "application/json",
          },
        },
      );
      return key;
    });

    await step.do("record workflow run", async () => {
      await this.env.DB.prepare(
        "insert into workflow_runs (id, workflow_type, status, input_json, output_json, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?)",
      )
        .bind(
          event.instanceId,
          "weekly_loop",
          "planned",
          JSON.stringify(event.payload),
          JSON.stringify({ ...plan, r2Key }),
          new Date().toISOString(),
          new Date().toISOString(),
        )
        .run();
    });

    return { ...plan, r2Key };
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const routed = await routeAgentRequest(request, env);
    if (routed) return routed;

    return handle(request, env, ctx);
  },

  async queue(batch: MessageBatch, env: Env) {
    const now = new Date().toISOString();

    for (const message of batch.messages) {
      await env.DB.prepare(
        "insert into workflow_runs (id, workflow_type, status, input_json, created_at, updated_at) values (?, ?, ?, ?, ?, ?)",
      )
        .bind(
          crypto.randomUUID(),
          "queue_event",
          "received",
          JSON.stringify(message.body),
          now,
          now,
        )
        .run()
        .catch(() => undefined);

      message.ack();
    }
  },

  async scheduled(_controller: ScheduledController, env: Env) {
    const mode = env.APP_MODE as string;
    if (mode === "dormant") return;

    const instance = await env.WEEKLY_LOOP.create({
      params: {
        trigger: "schedule",
        dryRun: mode !== "rc_live",
      },
    });

    await env.DB.prepare(
      "insert into workflow_runs (id, workflow_type, status, input_json, output_json, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        crypto.randomUUID(),
        "scheduled_trigger",
        "created",
        JSON.stringify({ workflowId: instance.id, mode }),
        null,
        new Date().toISOString(),
        new Date().toISOString(),
      )
      .run()
      .catch(() => undefined);
  },
} satisfies ExportedHandler<Env>;
