import type { OpportunityRow } from "./opportunities";
import type { AdvocateLoopResult } from "./pipeline";

function formatOpportunity(item: OpportunityRow, index: number) {
  return `${index + 1}. ${item.title} (${Math.round(Number(item.score))}) - ${item.recommended_action}`;
}

export function formatOpportunitiesSlackReport(opportunities: OpportunityRow[]) {
  if (opportunities.length === 0) {
    return "*GrowthRat opportunities*\nNo scored opportunities are available yet.";
  }

  return [
    "*GrowthRat opportunity backlog*",
    ...opportunities.slice(0, 5).map(formatOpportunity),
  ].join("\n");
}

export function formatAdvocateLoopSlackReport(result: AdvocateLoopResult) {
  const opportunities = result.plan.selectedOpportunities ?? [];
  return [
    "*GrowthRat weekly advocate run*",
    `Run: ${result.workflowRunId}`,
    `Status: ${result.status}`,
    "",
    "*Selected work*",
    `Content: ${result.plan.contentTopics.join(", ") || "none"}`,
    `Experiment: ${result.plan.experimentTopic ?? "none"}`,
    `Feedback: ${result.plan.feedbackTopics.join(", ") || "none"}`,
    "",
    "*Why these bets*",
    opportunities.length
      ? opportunities.slice(0, 3).map(formatOpportunity).join("\n")
      : "No scored opportunities were attached to this run.",
    "",
    "*Outputs*",
    `Artifact: ${result.artifactId ?? "none"}`,
    `Report: ${result.reportId ?? "none"}`,
    "",
    "*Approvals*",
    result.approvalRequests.length
      ? result.approvalRequests
          .map((request) =>
            [
              `${request.title}`,
              `Approval: ${request.approvalId ?? request.subjectId}`,
              `Command: approve ${request.approvalId ?? request.subjectId}`,
            ].join("\n"),
          )
          .join("\n\n")
      : "No approval requests queued.",
    "",
    "Sensitive external actions remain gated until RevenueCat-connected accounts and approvals are active.",
  ].join("\n");
}
