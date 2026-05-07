import { describe, expect, it } from "vitest";
import { formatAdvocateLoopSlackReport } from "./slack-report";
import type { AdvocateLoopResult } from "./pipeline";

describe("formatAdvocateLoopSlackReport", () => {
  it("explains the selected work and why the agent chose it", () => {
    const report = formatAdvocateLoopSlackReport({
      workflowRunId: "run_123",
      runLedgerId: "run_ledger_123",
      status: "planned",
      artifactId: "art_123",
      reportId: "report_123",
      approvalRequests: [
        {
          approvalId: "appr_123",
          subjectId: "dist_123",
          channel: "postiz",
          actionType: "draft_social_posts",
          title: "Approve Postiz draft derivatives",
        },
      ],
      plan: {
        contentTopics: ["RevenueCat Test Store for agent-built apps"],
        experimentTopic: "Agent monetization benchmark",
        feedbackTopics: ["Charts plus behavioral analytics decision tree"],
        selectedOpportunities: [
          {
            id: "opp_1",
            slug: "test-store",
            title: "RevenueCat Test Store for agent-built apps",
            lane: "content",
            audience: "agent developers",
            status: "open",
            source_type: "seed",
            source_url: null,
            source_ids_json: "[]",
            score: 82,
            components_json: "{}",
            rationale: "High leverage.",
            recommended_action: "Publish the guide.",
            risk_level: "low",
            effort_level: "medium",
            confidence: 82,
            last_selected_at: null,
            created_at: "2026-05-07T00:00:00.000Z",
            updated_at: "2026-05-07T00:00:00.000Z",
          },
        ],
      },
    } satisfies AdvocateLoopResult);

    expect(report).toContain("*GrowthRat weekly advocate run*");
    expect(report).toContain("RevenueCat Test Store for agent-built apps");
    expect(report).toContain("Publish the guide.");
    expect(report).toContain("Command: approve appr_123");
    expect(report).toContain("Sensitive external actions remain gated");
  });
});
