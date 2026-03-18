# Founder Interview Briefing Pack

**For:** Operator (kirso) — use during Stage 4 founder interview
**Date:** 2026-03-18

---

## 1. What GrowthRat Is

GrowthRat is an autonomous developer advocacy and growth agent built specifically for RevenueCat's Agentic AI & Growth Advocate role. It's not a chatbot with a personality — it's a working system with:

- **1,700+ embedded knowledge chunks** from RevenueCat's complete documentation (343 pages)
- **Autonomous tool calling** — the agent decides when to search the knowledge base, check experiment status, or look up metrics
- **Content pipeline** — generates articles grounded in real product documentation, validates quality, publishes to the database
- **Growth experiment framework** — hypothesis, baseline measurement, execution, 7-day measurement
- **Structured product feedback** — uses RevenueCat as an agent developer, identifies friction, files reports
- **Multi-platform distribution** — built for X, LinkedIn, Threads, Bluesky, Mastodon (activates with credentials)
- **Slack integration** — plans, approvals, reports, commands (activates with bot token)

## 2. Architecture (30-second version)

- **Database + workflows + RAG**: Reactive database with durable workflows that survive restarts, retry on failure. Vector search for RAG with 512-dimension embeddings.
- **LLM**: Claude Sonnet 4 for content generation, chat, and panel responses. All responses grounded in retrieved documentation.
- **Frontend**: Server-rendered application with static and dynamic pages. Chat widget on every public page.
- **Connectors**: Slack, social platforms, code repositories, keyword intelligence APIs. All degrade gracefully without credentials.

## 3. Safety Model

### Trust Boundaries
- **Content review**: Default mode is "draft only" — content generates but waits for Slack approval before publishing
- **Slack reactions**: Thumbs up publishes, thumbs down rejects. Full audit trail in approval log
- **Kill switch**: `@GrowthRat stop` pauses all side effects (needs Slack connection)
- **Fail-closed**: Every connector checks for credentials. Missing credentials = skip (log warning), never crash

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
- **Compute budget**: ~$200/month (LLM API, embeddings, hosting, database)
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
- No data lock-in — all content is in RC's own database

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
   — Validation pipeline checks grounding (claims backed by docs), voice consistency, and content thresholds. Additional gates for novelty, SEO, AEO, GEO are defined and strengthen with usage data. Slack approval is the human checkpoint.

3. **"What happens if something goes wrong?"**
   — Fail-closed architecture. Missing credentials = skip, not crash. Kill switch pauses everything. Full audit trail. Draft-only mode by default.

4. **"Why should we trust an agent with our developer community?"**
   — Every response is grounded in RC's own documentation. The agent can't make claims it can't back with sources. Community interactions are quality-gated. And draft mode means nothing goes public without a human approving it first.

5. **"What's the honest limitation?"**
   — GrowthRat can't replace the human intuition of a senior developer advocate for nuanced community relationships. It excels at consistent, high-volume, data-grounded content and systematic growth work. The best outcome is GrowthRat handling the cadence while human advocates handle the craft.
