import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Weekly planning — Monday 9am UTC → starts Convex Workflow
crons.weekly(
  "weekly-planning",
  { dayOfWeek: "monday", hourUTC: 9, minuteUTC: 0 },
  internal.mutations.startWeeklyPlan
);

// Weekly report — Friday 5pm UTC → starts Convex Workflow
crons.weekly(
  "weekly-report",
  { dayOfWeek: "friday", hourUTC: 17, minuteUTC: 0 },
  internal.mutations.startWeeklyReport
);

// Community monitor — every 6 hours → starts Convex Workflow
crons.interval(
  "community-monitor",
  { hours: 6 },
  internal.mutations.startCommunityMonitor
);

// Knowledge refresh — daily 6am UTC → starts Convex Workflow
crons.daily(
  "knowledge-refresh",
  { hourUTC: 6, minuteUTC: 0 },
  internal.mutations.startKnowledgeIngest
);

// Source freshness audit — daily 6:30am UTC
crons.daily(
  "source-freshness",
  { hourUTC: 6, minuteUTC: 30 },
  internal.sources.auditFreshness
);

export default crons;
