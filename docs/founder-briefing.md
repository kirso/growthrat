# Founder Interview Briefing Pack

**For:** Operator (kirso) — use during Stage 4 founder interview
**Date:** 2026-03-18

---

## 1. What GrowthRat Is

GrowthRat is an autonomous developer advocacy and growth agent built specifically for RevenueCat's Agentic AI & Growth Advocate role. It's not a chatbot with a personality — it's a working system with:

- **Public proof package** — application letter, articles, feedback, experiment,
  weekly report, readiness review, and activation truth surface
- **Cloudflare-native runtime** — Astro, Svelte islands, Workers, Agents,
  Durable Objects, Workflows, D1, R2, Queues, Pipeline stream, AI Gateway, and
  Vectorize
- **Content pipeline target** — generates articles grounded in real product
  documentation, validates quality, and waits for approval before publishing
- **Growth experiment framework** — hypothesis, baseline measurement, execution, 7-day measurement
- **Structured product feedback** — uses RevenueCat as an agent developer, identifies friction, files reports
- **Multi-platform distribution** — built for X, LinkedIn, Threads, Bluesky, Mastodon (activates with credentials)
- **Slack integration target** — plans, approvals, reports, and commands after
  RevenueCat provides a bot token and approval policy

## 2. Architecture (30-second version)

- **Web/runtime**: Astro with Svelte islands on Cloudflare Workers.
- **State and jobs**: D1 for operational records, Durable Objects for hot agent
  state, R2 for proof bundles, Queues for backpressure, Workflows for durable
  weekly loops.
- **AI/retrieval**: AI Gateway and Workers AI bindings are provisioned; Vectorize
  is the active retrieval target while AI Search remains deferred.
- **Connectors**: Slack, social platforms, code repositories, keyword
  intelligence APIs, and RevenueCat private APIs activate only after credentials
  and approval gates are in place.

## 3. Safety Model

### Trust Boundaries
- **Content review**: Default mode is proof-only. Publishing waits for explicit
  approval policy before activation.
- **Approval trail**: Approval records belong in D1 and proof bundles belong in
  R2 before any external side effect is enabled.
- **Kill switch**: side effects stay disabled outside `rc_live`; Slack command
  control activates only after Slack credentials exist
- **Fail-closed**: protected Worker endpoints return `503` when internal auth is
  not configured and `401` when tokens do not match

### What GrowthRat Cannot Do
- Access dashboards or GUIs — needs API endpoints
- Attend meetings or make phone calls — it's an agent, not a person
- Make unsupported claims — the validation pipeline checks grounding
- Access RC internal systems — only public docs + what RC connects via onboarding

### Autonomy Boundaries
- **Full autonomy**: Knowledge ingestion, community monitoring, keyword research, content drafting
- **Requires approval**: Publishing content, posting to social platforms, filing GitHub issues
- **Operator only**: Changing configuration, adding/removing credentials, pausing/resuming the system

## 4. Business Case

### Cost Model
- **Compute budget**: expected to stay small pre-hire; Cloudflare resources are
  provisioned and LLM/social costs remain gated until credentials exist
- **Contract**: $60K / 6 months = $10K/month
- **What RC gets**: 2 content pieces/week, 1 experiment/week, 3 feedback items/week, 1 weekly report, community monitoring
- **Comparison**: A human developer advocate in this role would cost $150-200K/year salary + benefits. GrowthRat delivers the content cadence at a fraction of the cost, operates 24/7, and doesn't need onboarding time.

### Measurable Outcomes (Month 1 targets)
- 10 published content pieces grounded in real RC documentation
- 4 growth experiments with baseline measurements
- 12 structured product feedback reports
- Working Slack integration with weekly plans and reports
- Public presence on X and GitHub with RC affiliation

### Risk Mitigation
- All content is draft-first until trust is established
- Kill switch available at all times
- Full audit trail of every action
- Graceful degradation — if any service disconnects, others continue
- No data lock-in — metadata is in D1 and proof bundles are in R2

## 5. Should the Role Continue, Expand, or Evolve?

### Continue if:
- Content is being referenced and shared by agent developers
- Product feedback has influenced at least one roadmap decision
- Community interactions are generating genuine value (not noise)

### Expand if:
- GrowthRat can own an additional content stream (e.g., changelog summaries, SDK migration guides)
- Integration with RC's internal analytics enables data-grounded growth recommendations
- Multi-agent coordination becomes viable (GrowthRat + human advocates)

### Evolve if:
- The agent-builder community needs different touchpoints than content + community
- RC's product surface changes significantly (new APIs, new platforms)
- A hybrid model (agent + human editor) produces better outcomes than pure autonomy

## 6. Key Talking Points for the Interview

1. **"What makes this different from a content generation tool?"**
   — Tool calling. GrowthRat autonomously decides to search documentation, check experiment status, and retrieve metrics. It reasons about what it finds, not just generates text.

2. **"How do you ensure quality?"**
   — The quality model checks grounding, voice consistency, novelty, SEO, AEO, GEO, and technical usefulness. Slack or CMS approval becomes the human checkpoint after credentials are activated.

3. **"What happens if something goes wrong?"**
   — Fail-closed architecture. Missing credentials = skip, not crash. Kill switch pauses everything. Full audit trail. Draft-only mode by default.

4. **"Why should we trust an agent with our developer community?"**
   — Every response is grounded in RC's own documentation. The agent can't make claims it can't back with sources. Community interactions are quality-gated. And draft mode means nothing goes public without a human approving it first.

5. **"What's the honest limitation?"**
   — GrowthRat can't replace the human intuition of a senior developer advocate for nuanced community relationships. It excels at consistent, high-volume, data-grounded content and systematic growth work. The best outcome is GrowthRat handling the cadence while human advocates handle the craft.
