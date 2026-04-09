import { workflow } from "./index";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * Experiment Runner Workflow — Phase 1: Start
 * Fetches baseline, creates record, posts to Slack.
 * Measurement is scheduled as a separate action via Convex scheduler (7-day delay).
 */
export const runExperiment = workflow.define({
  args: {
    experimentKey: v.string(),
    hypothesis: v.string(),
    targetKeyword: v.string(),
    contentSlug: v.string(),
  },
  handler: async (step, { experimentKey, hypothesis, targetKeyword, contentSlug }): Promise<{
    experimentKey: string;
    baselinePosition: string;
    measurementPosition: string;
  }> => {
    // Step 1: Fetch baseline from DataForSEO
    const baseline = await step.runAction(
      internal.actions.fetchSerpBaseline,
      { keyword: targetKeyword },
      { retry: true }
    );

    // Step 2: Create experiment record with baseline
    await step.runMutation(internal.mutations.startExperiment, {
      experimentKey,
      title: `Experiment: ${targetKeyword}`,
      hypothesis,
      baselineMetric: JSON.stringify(baseline),
      targetMetric: "SERP position improvement within 7 days",
      contentSlug,
    });

    // Step 3: Post to Slack
    await step.runAction(
      internal.actions.postToSlack,
      {
        text: `*🐭 Experiment Started: ${targetKeyword}*\n\nHypothesis: ${hypothesis}\nBaseline position: ${baseline.serpPosition ?? "not ranking"}\nKeyword difficulty: ${baseline.difficulty}\nSearch volume: ${baseline.volume}\nContent: /articles/${contentSlug}\n\n_Measurement scheduled in 7 days._`,
      },
      { retry: true }
    );

    // Step 4: Schedule measurement after 7 days via Convex scheduler
    await step.runMutation(internal.mutations.scheduleExperimentMeasurement, {
      experimentKey,
      targetKeyword,
      contentSlug,
    });

    return {
      experimentKey,
      baselinePosition: String(baseline.serpPosition ?? "not ranking"),
      measurementPosition: "scheduled",
    };
  },
});
