import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  weeklyPlanningRun,
  generateContent,
  sourceFreshnessAudit,
  weeklyReportGeneration,
  generateFeedback,
  communityEngage,
} from "@/inngest/functions";
import { communityMonitor } from "@/inngest/community-monitor";
import { handleSlackCommand } from "@/inngest/slack-handler";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    weeklyPlanningRun,
    generateContent,
    sourceFreshnessAudit,
    weeklyReportGeneration,
    generateFeedback,
    communityEngage,
    communityMonitor,
    handleSlackCommand,
  ],
});
