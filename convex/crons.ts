import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Weekly planning - Monday 9am UTC
crons.weekly(
  "weekly-planning",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  internal.workflowRuns.triggerWeeklyPlan
);

// Source freshness audit - daily at 6am UTC
crons.daily(
  "source-freshness",
  { hourUTC: 6, minuteUTC: 0 },
  internal.sources.auditFreshness
);

// Weekly report - Friday 5pm UTC
crons.weekly(
  "weekly-report",
  { dayOfWeek: "friday", hourUTC: 17, minuteUTC: 0 },
  internal.weeklyReports.generateReport
);

export default crons;
