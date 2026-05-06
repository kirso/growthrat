import { handle } from "@astrojs/cloudflare/handler";
import { Agent, routeAgentRequest } from "agents";
import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";

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
      platform: "Astro, Svelte islands, and Cloudflare Workers",
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
    const plan = await step.do("plan weekly loop", async () => ({
      trigger: event.payload.trigger,
      dryRun: event.payload.dryRun ?? true,
      requiredOutputs: [
        "two content pieces",
        "one growth experiment",
        "three feedback items",
        "community interactions",
        "weekly report",
      ],
    }));

    await step.do("record workflow run", async () => {
      await this.env.DB.prepare(
        "insert into workflow_runs (id, workflow_type, status, input_json, output_json, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?)",
      )
        .bind(
          event.instanceId,
          "weekly_loop",
          "planned",
          JSON.stringify(event.payload),
          JSON.stringify(plan),
          new Date().toISOString(),
          new Date().toISOString(),
        )
        .run();
    });

    return plan;
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
} satisfies ExportedHandler<Env>;
