import { getAgentConfig } from "./agent-config";
import { ensureWeeklyExperiment, slugify } from "./experiments";
import { createGitHubIssue, publishMarkdownToGitHub } from "./github";
import {
  planWeeklyOpportunities,
  type OpportunityRow,
} from "./opportunities";
import { createPostizPost, listPostizIntegrations } from "./postiz";
import { generateSourceGroundedDraft, type ContentDraft } from "./content-draft";
import { requestDistributionApproval } from "./approvals";
import { sendLangfuseTrace } from "./observability/langfuse";
import { finishRun, recordRunEvent, startRun } from "./run-ledger";

export type QualityGate = {
  key: string;
  passed: boolean;
  blocking: boolean;
  reason: string;
};

export type AdvocateLoopResult = {
  workflowRunId: string;
  runLedgerId: string | null;
  status: "blocked" | "planned" | "completed";
  plan: {
    contentTopics: string[];
    feedbackTopics: string[];
    experimentTopic: string | null;
    selectedOpportunities?: OpportunityRow[];
  };
  artifactId: string | null;
  reportId: string | null;
};

type LoopInput = {
  trigger: "manual" | "schedule" | "slack" | "task";
  dryRun?: boolean;
  topic?: string;
};

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

export function validateQuality(content: string, slug?: string): QualityGate[] {
  const lower = content.toLowerCase();
  const noCode = content.replace(/```[\s\S]*?```/g, "");
  const keyword = slug ? slug.replaceAll("-", " ").toLowerCase() : "";

  return [
    {
      key: "grounding",
      blocking: true,
      passed: content.length > 500,
      reason:
        content.length > 500
          ? "Content is substantive."
          : "Content is too short to publish.",
    },
    {
      key: "technical",
      blocking: true,
      passed:
        content.includes("```") &&
        /(revenuecat|customerinfo|entitlement|webhook|offering|api)/i.test(
          content,
        ),
      reason:
        "Requires code plus RevenueCat-specific primitives or API references.",
    },
    {
      key: "seo",
      blocking: true,
      passed:
        content.includes("## ") &&
        content.length > 800 &&
        (!keyword || lower.slice(0, 500).includes(keyword.split(" ")[0])),
      reason: "Requires H2 structure, length, and target-topic alignment.",
    },
    {
      key: "voice",
      blocking: true,
      passed:
        !/(revolutionary|game-changing|unleash the power|guaranteed growth)/i.test(
          noCode,
        ) && (noCode.match(/!/g) ?? []).length <= 3,
      reason: "Blocks hype and mascot-like copy.",
    },
    {
      key: "aeo",
      blocking: false,
      passed: /tl;dr|key takeaways|^\d+\.\s|^[-*]\s/m.test(content),
      reason: "Advisory: answer-engine structure.",
    },
    {
      key: "geo",
      blocking: false,
      passed: /\[[^\]]+\]\(|source|citation|docs/i.test(content),
      reason: "Advisory: citation-worthiness.",
    },
  ];
}

async function storeArtifact(
  env: Env,
  input: {
    title: string;
    slug: string;
    artifactType: string;
    status: string;
    content: string;
    draft: ContentDraft;
    quality: QualityGate[];
  },
) {
  const now = new Date().toISOString();
  const artifactId = id("art");
  await env.DB.prepare(
    `insert into artifacts (
      id, slug, title, artifact_type, status, summary, source_path,
      content, content_format, quality_scores_json, metadata_json,
      created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?, 'markdown', ?, ?, ?, ?)`,
  )
    .bind(
      artifactId,
      input.slug,
      input.title,
      input.artifactType,
      input.status,
      input.content.slice(0, 280),
      null,
      input.content,
      json(input.quality),
      json({
        generatedBy: "advocate_pipeline",
        citations: input.draft.citations,
        aiGatewayLogId: input.draft.aiGatewayLogId,
      }),
      now,
      now,
    )
    .run();
  return artifactId;
}

async function createFeedbackItems(env: Env, topics: string[]) {
  const now = new Date().toISOString();
  for (const topic of topics.slice(0, 3)) {
    await env.DB.prepare(
      `insert or ignore into feedback_items (
        id, slug, title, severity, status, evidence_json, recommendation,
        created_at, updated_at
      ) values (?, ?, ?, 'medium', 'draft', ?, ?, ?, ?)`,
    )
      .bind(
        id("fb"),
        slugify(topic),
        topic,
        json([{ source: "weekly_advocate_loop", topic }]),
        `Review repeated agent-builder friction around ${topic}.`,
        now,
        now,
      )
      .run();
    if (String(env.APP_MODE) === "rc_live") {
      await createGitHubIssue(env, {
        title: `[Feedback] ${topic}`,
        body: `## Product feedback\n\n${topic}\n\nRecommendation: Review repeated agent-builder friction around ${topic}.`,
        labels: ["feedback"],
      }).catch(() => undefined);
    }
  }
}

async function storeOpportunities(
  env: Env,
  workflowRunId: string,
  keywords: Array<{ keyword: string; difficulty: number | null; volume: number | null }>,
) {
  const now = new Date().toISOString();
  for (const keyword of keywords.slice(0, 10)) {
    const difficulty = keyword.difficulty ?? 100;
    const volume = keyword.volume ?? 0;
    const score = Math.max(0, volume / 100 - difficulty);
    await env.DB.prepare(
      `insert into opportunity_snapshots (
        id, slug, title, lane, audience, score, components_json, rationale,
        readiness_score, readiness_passes, workflow_run_id, created_at
      ) values (?, ?, ?, 'content', ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id("opp"),
        slugify(keyword.keyword),
        keyword.keyword,
        "agent developers and subscription-app growth operators",
        score,
        json(keyword),
        "Selected from DataForSEO keyword idea output or proof fallback seeds.",
        Math.max(0, 100 - difficulty),
        difficulty <= 70 ? 1 : 0,
        workflowRunId,
        now,
      )
      .run();
  }
}

async function planTopics(env: Env, overrideTopic?: string) {
  if (overrideTopic?.trim()) {
    return {
      contentTopics: [overrideTopic.trim()],
      feedbackTopics: [
        "Agent onboarding reference path",
        "Charts plus behavioral analytics bridge",
        "Webhook sync trust boundaries",
      ],
      experimentTopic: overrideTopic.trim(),
      selectedOpportunities: [],
      keywords: [],
    };
  }

  const planned = await planWeeklyOpportunities(env).catch(() => null);
  if (planned) {
    return {
      ...planned,
      selectedOpportunities: planned.selected,
      keywords: [],
    };
  }

  return {
    contentTopics: [
      "RevenueCat Test Store for agent-built apps",
      "Webhook trust boundaries for autonomous builders",
    ],
    feedbackTopics: [
      "Charts plus behavioral analytics decision tree",
      "Agent onboarding reference path",
      "Webhook trust boundaries for autonomous builders",
    ],
    experimentTopic: "Agent monetization benchmark",
    selectedOpportunities: [],
    keywords: [],
  };
}

async function maybeQueueDistribution(
  env: Env,
  artifactId: string,
  title: string,
  slug: string,
  content: string,
  dryRun: boolean,
  runId?: string | null,
) {
  const config = await getAgentConfig(env);
  const now = new Date().toISOString();

  if (dryRun || !config.budgetPolicy.allowAutoPublish) {
    const distributionActionId = id("dist");
    await env.DB.prepare(
      `insert or ignore into distribution_actions (
        id, artifact_id, channel, action_type, status, idempotency_key,
        detail_json, created_at, updated_at
      ) values (?, ?, 'postiz', 'draft_social_posts', 'planned', ?, ?, ?, ?)`,
    )
      .bind(
        distributionActionId,
        artifactId,
        `postiz:${artifactId}:draft`,
        json({ title, slug }),
        now,
        now,
      )
      .run();
    await requestDistributionApproval(env, {
      runId,
      distributionActionId,
      title: `Approve Postiz draft derivatives for ${title}`,
      artifactId,
      channel: "postiz",
      actionType: "draft_social_posts",
      slug,
    });
    return { published: false, reason: "queued for approval" };
  }

  const github = await publishMarkdownToGitHub(env, { title, slug, content });
  const integrations = await listPostizIntegrations(env).catch(() => []);
  if (integrations[0]) {
    await createPostizPost(env, {
      type: "draft",
      date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      content: `${title}\n\n${env.PUBLIC_SITE_URL}/articles/${slug}`,
      targets: [
        {
          integrationId: integrations[0].id,
          provider: integrations[0].identifier,
        },
      ],
    }).catch(() => undefined);
  }

  return github;
}

export async function runWeeklyAdvocateLoop(
  env: Env,
  input: LoopInput,
): Promise<AdvocateLoopResult> {
  const now = new Date().toISOString();
  const workflowRunId = id("run");
  const ledgerRunId = await startRun(env, {
    runType: "weekly_advocate_loop",
    triggerType: input.trigger,
    title: input.topic ? `Weekly loop: ${input.topic}` : "Weekly advocate loop",
    input: { ...input, workflowRunId },
    langfuseTraceId: workflowRunId,
  });
  const config = await getAgentConfig(env);
  const week = currentWeekKey();

  if (!config.isActive || String(env.APP_MODE) === "dormant") {
    await env.DB.prepare(
      "insert into workflow_runs (id, workflow_type, status, input_json, output_json, created_at, updated_at) values (?, 'weekly_advocate_loop', 'blocked', ?, ?, ?, ?)",
    )
      .bind(
        workflowRunId,
        json(input),
        json({ reason: "agent config inactive or dormant" }),
        now,
        now,
      )
      .run();
    await recordRunEvent(env, {
      runId: ledgerRunId,
      eventType: "blocked",
      status: "blocked",
      detail: { reason: "agent config inactive or dormant" },
    });
    await finishRun(env, {
      runId: ledgerRunId,
      status: "blocked",
      output: { reason: "agent config inactive or dormant", workflowRunId },
    });
    return {
      workflowRunId,
      runLedgerId: ledgerRunId,
      status: "blocked",
      plan: { contentTopics: [], feedbackTopics: [], experimentTopic: null },
      artifactId: null,
      reportId: null,
    };
  }

  const plan = await planTopics(env, input.topic);
  await recordRunEvent(env, {
    runId: ledgerRunId,
    eventType: "plan_created",
    status: "succeeded",
    detail: {
      contentTopics: plan.contentTopics,
      feedbackTopics: plan.feedbackTopics,
      experimentTopic: plan.experimentTopic,
      selectedOpportunities: plan.selectedOpportunities?.map((item) => ({
        id: item.id,
        title: item.title,
        lane: item.lane,
        score: item.score,
      })),
    },
  });
  await storeOpportunities(env, workflowRunId, plan.keywords);
  await createFeedbackItems(env, plan.feedbackTopics);
  const experiment = plan.experimentTopic
    ? await ensureWeeklyExperiment(env, week.start)
    : null;

  let artifactId: string | null = null;
  let quality: QualityGate[] = [];
  let draft: ContentDraft | null = null;

  const topic = plan.contentTopics[0];
  if (topic) {
    draft = await generateSourceGroundedDraft(env, topic);
    const slug = slugify(topic);
    quality = validateQuality(draft.body, slug);
    const blockingPassed = quality
      .filter((gate) => gate.blocking)
      .every((gate) => gate.passed);
    artifactId = await storeArtifact(env, {
      title: draft.title,
      slug: `${slug}-${workflowRunId.slice(-6)}`,
      artifactType: "technical",
      status: blockingPassed ? "validated" : "draft",
      content: draft.body,
      draft,
      quality,
    });
    await maybeQueueDistribution(
      env,
      artifactId,
      draft.title,
      `${slug}-${workflowRunId.slice(-6)}`,
      draft.body,
      input.dryRun ?? String(env.APP_MODE) !== "rc_live",
      ledgerRunId,
    );
    await recordRunEvent(env, {
      runId: ledgerRunId,
      eventType: "artifact_created",
      status: blockingPassed ? "succeeded" : "blocked",
      detail: {
        artifactId,
        title: draft.title,
        slug: `${slug}-${workflowRunId.slice(-6)}`,
        blockingPassed,
        quality,
      },
    });
  }

  const reportId = id("report");
  const summary = [
    `Weekly advocate loop for ${week.start} to ${week.end}.`,
    `Topics: ${plan.contentTopics.join(", ") || "none"}.`,
    `Feedback: ${plan.feedbackTopics.join(", ")}.`,
    `Experiment: ${experiment?.title ?? "not created"}.`,
    `Opportunity rationale: ${
      plan.selectedOpportunities
        ?.slice(0, 3)
        .map((item) => `${item.title} (${Math.round(Number(item.score))})`)
        .join(", ") || "fallback seeds"
    }.`,
    `Artifact: ${artifactId ?? "none"}.`,
  ].join("\n");

  await env.DB.prepare(
    `insert into weekly_reports (
      id, week_start, week_end, status, summary, r2_key, created_at, updated_at
    ) values (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      reportId,
      week.start,
      week.end,
      input.dryRun ? "draft" : "planned",
      summary,
      null,
      now,
      now,
    )
    .run();
  await recordRunEvent(env, {
    runId: ledgerRunId,
    eventType: "weekly_report_created",
    status: "succeeded",
    detail: { reportId, week, summary },
  });

  await env.DB.prepare(
    "insert into workflow_runs (id, workflow_type, status, input_json, output_json, created_at, updated_at) values (?, 'weekly_advocate_loop', 'planned', ?, ?, ?, ?)",
  )
    .bind(
      workflowRunId,
      json(input),
      json({ plan, artifactId, reportId, quality, draft }),
      now,
      now,
    )
    .run();

  const output = { plan, artifactId, reportId, quality, draft, workflowRunId };
  await finishRun(env, {
    runId: ledgerRunId,
    status: "planned",
    output,
  });
  await sendLangfuseTrace(env, {
    traceId: workflowRunId,
    name: "weekly_advocate_loop",
    userId: "growthrat",
    input,
    output,
    metadata: {
      mode: env.APP_MODE,
      trigger: input.trigger,
      dryRun: input.dryRun ?? String(env.APP_MODE) !== "rc_live",
      ledgerRunId,
    },
    events: [
      {
        name: "plan_created",
        input: input.topic ?? null,
        output: {
          contentTopics: plan.contentTopics,
          experimentTopic: plan.experimentTopic,
          opportunityCount: plan.selectedOpportunities?.length ?? 0,
        },
      },
      {
        name: "quality_gates",
        output: quality,
      },
      {
        name: "weekly_report_created",
        output: { reportId },
      },
    ],
  });

  return {
    workflowRunId,
    runLedgerId: ledgerRunId,
    status: "planned",
    plan,
    artifactId,
    reportId,
  };
}

export async function executeTakeHomeTask(
  env: Env,
  input: { prompt: string; deadline?: string },
) {
  const prompt = input.prompt.trim();
  const topics = prompt
    .split(/[.;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);
  const results = [];

  for (const topic of topics.length ? topics : [prompt]) {
    results.push(
      await runWeeklyAdvocateLoop(env, {
        trigger: "task",
        dryRun: true,
        topic,
      }),
    );
  }

  return {
    prompt,
    deadline: input.deadline ?? "48 hours",
    subtasks: results.length,
    results,
  };
}
