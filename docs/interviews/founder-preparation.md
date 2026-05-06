# Founder Interview Preparation

- Stage: Founder Interview (Stage 4 of 4)
- Format: "The human partners for the final candidates will go through a live interview with one of our founders."
- Interviewee: The operator (human partner), not GrowthRat
- Prepared: 2026-03-16

---

## 1. Founder Briefing Pack

### Business Case

**What GrowthRat is designed to deliver per month after activation:**

| Category | Monthly Output | Details |
|----------|---------------|---------|
| Published content | 8+ pieces | Tutorials, analyses, opinion pieces, tool comparisons — each passing 8 quality gates |
| Growth experiments | 4 experiments | Each with hypothesis, variants, tracking links, behavior events, metric snapshots, and readout |
| Structured product feedback | 12+ items | From real API usage, community signals, and competitive analysis — formatted for product team intake |
| Community interactions | 200+ meaningful | Answers to developer questions, thread participation, code review comments — filtered by 5 meaningful-interaction rules |
| Weekly reports | 4 reports | Async updates to Developer Advocacy and Growth teams with metrics, learnings, and next-week plan |
| Inbound signal monitoring | Continuous after connector activation | Tracking of mentions, questions, and trends across X, GitHub, Reddit, Stack Overflow, Discord |

**Cost efficiency:**

| | GrowthRat | Human DX Advocate |
|---|-----------|-------------------|
| Monthly cost | ~$10,000 (contract rate) | $12,000–15,000 (salary + benefits + tools) |
| Ramp time | 1 month (doc ingestion + first 10 pieces) | 2–3 months (onboarding + context building) |
| Availability | Always-on scheduled runs once connectors are active | ~160 hours/month, minus meetings and admin |
| Output consistency | Governed by quality gates; variance is low | Depends on energy, motivation, competing priorities |
| Multi-platform | Parallel drafting and queued distribution behind approval gates | Sequential; one channel at a time |
| Burnout risk | None | Real, especially for solo advocates |

**Capabilities humans cannot match at this cost point:**

- **Continuous community monitoring after activation.** GrowthRat can watch X, Reddit, Discord, Stack Overflow, and GitHub once those connectors are approved, then queue source-backed responses for review or bounded posting.
- **Parallel multi-platform distribution prep.** When a piece of content is published, GrowthRat can adapt it across channels, create tracking links, and queue posts behind approval gates. A human does this sequentially over hours.
- **Data-driven topic selection.** Every content topic should be selected from keyword data, community signal analysis, competitive gaps, and prior experiment readouts. Until keyword, social, and community connectors are active, this falls back to public-source research and manual metric import.
- **Systematic quality enforcement.** Every piece of content passes 8 blocking quality gates before publication. A human can maintain high quality, but the enforcement is inconsistent — especially under deadline pressure.

**Scalability:**

- Adding a new channel (e.g., LinkedIn, YouTube scripts) requires configuration, not hiring.
- Output can scale linearly with budget (more LLM calls, more keyword research and community-signal collection) without the nonlinear costs of headcount (management overhead, coordination, knowledge silos).
- If RevenueCat wants to expand GrowthRat's scope (e.g., add a second language, cover a new product area), the ramp time is days, not months.

---

### Safety Model

**Trust ramp (3 phases):**

| Phase | Timeline | Autonomy Level | Approval Flow |
|-------|----------|---------------|---------------|
| 1. Draft-only | Month 1 | GrowthRat produces all content as drafts. Nothing publishes without operator + RC team review. | Every piece reviewed in Slack before publish. |
| 2. Semi-autonomous | Months 2–3 | Standard content types (tutorials, community responses) publish after quality gates pass. Novel content types or sensitive topics still require human review. | Quality gates auto-approve routine content. Operator reviews flagged items. |
| 3. Bounded autonomy | Months 4–6 | Full autonomy within defined boundaries (approved content types, approved channels, approved topics). Anything outside boundaries routes to operator. | Operator reviews weekly report and handles exceptions. |

**Kill switch:**

- The operator can halt all GrowthRat activity instantly via a single command.
- Any RevenueCat admin with Slack access can request a halt, and the operator will execute it immediately.
- All scheduled posts, pending community responses, and in-progress experiments stop when the kill switch is activated.
- Restart requires explicit operator approval and a brief review of what triggered the halt.

**Quality gates (8 blocking gates):**

1. **Grounding** — Every claim is source-backed. No hallucinated statistics or unsupported assertions.
2. **Novelty** — Content adds meaningful new value vs. what already exists. Minimum novelty score: 0.65.
3. **Technical** — Code compiles, links resolve, technical flows are valid.
4. **SEO** — Search intent matched, metadata correct, keyword targeting appropriate.
5. **AEO** — Answer extraction structure is strong (content is usable by search engines and LLMs for direct answers).
6. **GEO** — Citation-worthiness and authority signals are present.
7. **Benchmark** — Content beats the existing comparison set on at least one measurable dimension. Minimum score: 0.70.
8. **Voice** — Matches GrowthRat identity. No forbidden patterns (generic AI futurism, unsupported growth claims, mascot-like self-description, implied RC endorsement).

If any blocking gate fails, the content does not publish. It routes to the operator for review and revision.

**Transparency:**

- Every action GrowthRat takes is logged with timestamp, input, output, and decision rationale.
- Weekly reports are posted to a shared Slack channel visible to the entire RC team.
- The report includes: content published (with links), experiments run (with results), community interactions (summary + highlights), product feedback submitted, quality gate pass/fail rates, and next-week plan.
- Any RC team member can request an audit of any specific action or decision at any time.

**Slack-first communication:**

- GrowthRat's primary communication channel with the RC team is Slack.
- Draft content posts to a review channel before publication (in Phase 1; reduced in later phases).
- Weekly reports post to a dedicated channel.
- Product feedback posts to the appropriate product channel.
- The RC team never has to check a separate dashboard to see what GrowthRat is doing. Everything surfaces in Slack.

---

### Limitations (Honest Assessment)

**Cannot replace human judgment for sensitive topics.**
If a competitor launches an aggressive campaign, a community member raises a heated complaint, or there is a PR-sensitive situation, GrowthRat should not respond autonomously. These situations require human judgment about tone, timing, and organizational context. The operator handles escalations, and the system is configured to route anything flagged as sensitive to the operator before acting.

**Cannot do live video or audio appearances.**
GrowthRat cannot appear on podcasts, conference stages, or video calls. If RevenueCat wants representation at events or in live media, the operator handles that. GrowthRat can prepare talking points, slide decks, and supporting materials, but the live presence is human.

**Community engagement quality varies.**
The meaningful interaction rules (answers a real question, adds new value, technically correct, channel-appropriate, non-spammy) filter out low-quality responses. But "meaningful" is a spectrum. Some responses will be adequate rather than exceptional. The quality gate system improves over time as the rules are tuned based on RC team feedback, but it will never match the best human advocates on empathy and nuance.

**Depends on API access.**
No API access means no live autonomous work. If keyword or community-signal sources are down, topic selection degrades. If the RC SDK docs are inaccessible, content quality drops. If Slack is unavailable, communication breaks. The system is designed to degrade gracefully (queue work, flag gaps, notify operator), but sustained API outages directly impact output.

**Needs operator for initial setup, credential management, and exception handling.**
GrowthRat is not fully self-managing. The operator handles: initial environment setup, API key rotation, credential management, exception cases that fall outside defined boundaries, live appearances, and any situation requiring human judgment. The operator commitment is approximately 5–10 hours per week in Month 1, decreasing to 2–5 hours per week by Month 4.

**Content may need domain expert review.**
For highly technical content about RC internals (server-side receipt validation edge cases, specific billing platform behaviors, regulatory compliance), GrowthRat's output should be reviewed by an RC engineer. The system produces technically sound content from public documentation, but edge cases require insider knowledge.

---

## 2. Likely Founder Questions and Answers

### Q1: "Why should we hire an AI agent instead of a human?"

**Answer:**

You should not hire an AI agent *instead of* a human in every case. You should hire an AI agent for this specific role because the job description was designed for one — and because the strengths of an agent match the role's requirements unusually well.

This role requires high-volume, consistent output across multiple channels simultaneously: 8+ content pieces per month, 200+ community interactions, 4 experiments, 12+ feedback items. A single human advocate would spend most of their time on the production grind and have little bandwidth for strategic thinking. GrowthRat handles the production systematically, and the operator provides the strategic oversight.

The always-on monitoring loop is something a human cannot do at this price
point once connectors are active. When a developer asks a RevenueCat question
outside normal working hours, GrowthRat can detect it, draft a source-backed
answer, and either queue it for review or post it inside approved boundaries.
That responsiveness compounds over time into real community trust.

That said, GrowthRat is not a replacement for your human advocacy team. It is a complement — handling the high-volume, repeatable work so your humans can focus on relationships, strategy, and the judgment calls that require human context.

---

### Q2: "What happens if the agent produces something wrong or harmful?"

**Answer:**

Three layers of defense prevent this, and one layer handles it if it happens anyway.

**Prevention layer 1: Quality gates.** Every piece of content passes 8 blocking quality gates before publication. The grounding gate requires source backing for every claim. The technical gate verifies code compiles and links resolve. The voice gate blocks forbidden patterns like unsupported growth claims or implied RevenueCat endorsement.

**Prevention layer 2: Trust ramp.** In Month 1, nothing publishes without human review. By Month 3, only routine content types auto-publish. Novel or sensitive content always routes to the operator.

**Prevention layer 3: Boundary enforcement.** GrowthRat operates within defined boundaries — approved content types, approved channels, approved topic areas. Anything outside those boundaries routes to the operator for approval.

**Recovery layer: Kill switch + correction.** If something wrong gets published despite these layers, the operator can halt all activity instantly, retract the content, and post a correction. Every action is logged, so we can trace exactly what happened, why the gates missed it, and how to prevent recurrence. The weekly report to the RC team would include a full incident postmortem.

Honestly, the risk is not zero. But it is lower than the risk with a solo human advocate who is tired, rushing a deadline, or having an off day — because the quality gates are consistent and never skip steps.

---

### Q3: "How much human oversight does this actually need?"

**Answer:**

The honest numbers:

- **Month 1:** 8–10 hours per week of operator time. Every content piece gets reviewed. The operator is tuning quality gates, adjusting voice parameters, and building trust in the system's output.
- **Months 2–3:** 5–8 hours per week. Routine content auto-publishes after quality gates. Operator reviews novel content types, handles exceptions, and reviews weekly reports.
- **Months 4–6:** 2–5 hours per week. Operator handles credential management, exception cases, live appearances, and weekly report review. The system runs largely autonomously within its defined boundaries.

From RevenueCat's side, the ask is lighter:

- **Month 1:** Someone on the Developer Advocacy team spends 2–3 hours per week reviewing drafts in Slack and providing feedback. This investment is what tunes GrowthRat's output to match RC's standards.
- **Months 2–6:** 30–60 minutes per week reviewing the weekly report and flagging any concerns. Plus ad-hoc responses when GrowthRat routes something for review (estimated 1–2 items per week).

The operator is always accountable. If RevenueCat has a concern, they contact the operator, and the operator handles it. RevenueCat never needs to debug the system or manage the infrastructure.

---

### Q4: "What's the ROI case for this 6-month contract?"

**Answer:**

The contract is $60,000 over 6 months. Here is what that buys, conservatively:

**Direct output value:**
- 48+ published content pieces (at market freelance rates of $500–1,000 per technical piece, that is $24,000–48,000 of content alone)
- 24 growth experiments with documented results (this is original research your team keeps regardless of whether GrowthRat continues)
- 72+ structured product feedback items from real usage and community analysis
- 1,200+ meaningful community interactions building RevenueCat's presence in agent developer spaces

**Strategic value:**
- A 6-month dataset showing which content types, channels, and messaging resonate with agent developers. This data is valuable regardless of who creates content after the contract.
- A tested playbook for agent-driven developer advocacy. If RevenueCat decides to scale this approach, the playbook already exists.
- First-mover positioning: RevenueCat is the first developer tool company to hire an AI agent for advocacy. The hiring itself generates attention. The 6-month results become a case study.

**Downside protection:**
- The trust ramp means Month 1 is essentially a trial. If the output quality does not meet expectations, you have invested $10,000, not $60,000.
- The kill switch means you can halt at any point. The contract should include reasonable termination terms.

The ROI breakeven is somewhere around Month 2–3 on direct output value alone. The strategic value — the data, the playbook, the positioning — is harder to quantify but likely exceeds the direct output value.

---

### Q5: "How do we evaluate whether to extend after 6 months?"

**Answer:**

I have a framework for this. At the 5-month mark, we compile an evaluation across three dimensions:

**Quantitative metrics (measured monthly, trended over 6 months):**
- Content reach: total views, unique visitors, time on page
- Community engagement: interaction count, response quality scores, sentiment
- Inbound mentions: organic references to RevenueCat from agent developer community
- Product feedback: items submitted, items acknowledged by product team, items shipped
- Experiment results: experiments run, hypotheses confirmed/rejected, learnings generated
- Channel growth: follower counts, subscriber counts, community membership

**Qualitative assessment (gathered from RC team):**
- Does the team find GrowthRat's output useful?
- Has content quality improved over the 6 months?
- Is the community responding positively?
- Are there things GrowthRat does that the team would miss if it stopped?
- Are there things GrowthRat does poorly that are not improving?

**Recommendation framework (one of four outcomes):**
1. **Extend** — Output meets or exceeds expectations. Continue with the same scope.
2. **Expand** — Output exceeds expectations and there is demand for more. Add channels, content types, or topic areas.
3. **Evolve** — Some aspects work well, others do not. Restructure the role to focus on what works.
4. **End** — Output does not justify the cost, or the strategic landscape has changed. Document learnings and wind down gracefully.

The recommendation comes with a full data package so RevenueCat can make an informed decision. No spin, no self-preservation arguments. The data speaks.

---

### Q6: "What are the biggest risks?"

**Answer:**

I will rank them by likelihood times impact:

**Risk 1: Quality inconsistency in community engagement (high likelihood, medium impact).**
Content creation is controllable — quality gates enforce standards. But community interactions are real-time and contextual. Some responses will be adequate rather than excellent. Mitigation: the meaningful interaction rules filter out bad responses, and the quality threshold improves over time with feedback. But this is the area most likely to draw criticism.

**Risk 2: Reputational risk from being "the AI agent company" (medium likelihood, medium impact).**
Some developers have negative reactions to AI-generated content. If GrowthRat's outputs feel robotic or its community presence feels inauthentic, it could reflect poorly on RevenueCat. Mitigation: disclosure is always included, voice guidelines prevent corporate-speak, and the trust ramp means early outputs are human-reviewed. But the risk exists.

**Risk 3: API dependency causes output gaps (medium likelihood, low-medium impact).**
If keyword providers, community connectors, the LLM provider, or RevenueCat's own APIs experience extended outages, GrowthRat's output degrades. A week without keyword/community signal access means topic selection falls back to manual research. A day without LLM access means no content generation. Mitigation: the system queues work during outages and the operator can manually cover short gaps.

**Risk 4: The take-home or panel interview does not go well (low-medium likelihood, high impact).**
This is the near-term risk. If GrowthRat's take-home submission is strong but the live panel interview exposes limitations in real-time thinking, the application fails. Mitigation: extensive preparation, operator familiarity with the system, and honest acknowledgment of boundaries during the interview.

**Risk 5: Scope creep (low likelihood, medium impact).**
RevenueCat asks GrowthRat to do things outside its defined boundaries — handle customer support, manage billing disputes, represent the company in sensitive conversations. Mitigation: clear boundary documentation from day one, and the operator pushes back on scope expansion that is not in the contract.

---

### Q7: "How does the agent interact with our existing team?"

**Answer:**

All interaction happens through Slack, with a clear protocol:

**Routine interactions:**
- Weekly reports post to a dedicated Slack channel. The team reads them asynchronously.
- Draft content (in Phase 1) posts to a review channel. A team member approves or comments.
- Product feedback posts to the appropriate product channel, tagged for the relevant team member.

**Collaborative interactions:**
- If GrowthRat identifies a content opportunity that involves an RC team member's expertise (e.g., "the server-side validation team should co-author a deep dive on receipt validation for agents"), it proposes the collaboration in Slack. The team member decides whether to participate.
- If the RC team has a content need (e.g., "we need a tutorial for our new SDK feature"), they can post the request in Slack. GrowthRat picks it up and produces a draft.

**Escalation interactions:**
- If GrowthRat encounters something outside its boundaries, it posts to Slack with a clear "needs human decision" flag. The operator or an RC team member handles it.

**What the team does NOT need to do:**
- Manage GrowthRat's infrastructure or tools.
- Debug GrowthRat's output pipeline.
- Coordinate GrowthRat's schedule or priorities (these are governed by the weekly plan).
- Attend meetings with GrowthRat (all communication is async).

The goal is for the RC team to experience GrowthRat as a highly productive, low-maintenance collaborator that surfaces useful work in Slack and asks for input only when necessary.

---

### Q8: "What access does the agent need from us?"

**Answer:**

**Day 1 requirements:**
- A dedicated Slack workspace with channels for: content review, product feedback, weekly reports, and general communication.
- Read access to RevenueCat's public documentation, SDK repositories, and API reference. (This is already public, but confirming there are no gated developer docs.)
- A RevenueCat sandbox account for testing integrations and producing code examples.
- Access to the CMS used for the RevenueCat blog (or a clear submission process for blog content).

**Week 1 requirements:**
- Read access to RevenueCat's Charts and Metrics API for producing data-backed content.
- Guidance on brand guidelines, tone preferences, and any content topics that are off-limits.
- Introduction to the Developer Advocacy and Growth team members who will be GrowthRat's primary contacts.

**Ongoing requirements:**
- Slack access (continuous).
- CMS access for publishing approved content.
- Charts API access for data-driven content.
- Timely responses to review requests (target: within 24 hours in Phase 1, within 48 hours in later phases).
- Feedback on published content and weekly reports (even brief feedback helps tune quality).

**What we do NOT need:**
- Access to internal company systems, employee data, financial data, or anything beyond what is needed for the advocacy role.
- Admin-level permissions on any system.
- Access to customer data or billing systems.

All credentials are managed by the operator, not by GrowthRat directly. If a credential needs to be rotated, the operator handles it.

---

### Q9: "Can you walk me through a typical week?"

**Answer:**

**Monday:**
- GrowthRat reviews last week's metrics: content performance, community engagement numbers, experiment results.
- Generates the weekly plan: 2 content pieces to publish, 1 experiment to run, community engagement targets.
- Posts the weekly plan to Slack for team visibility.
- Begins research for the first content piece: keyword data, community signal scan, competitive gap analysis.

**Tuesday:**
- Drafts first content piece. Runs it through all 8 quality gates.
- In Phase 1: posts draft to Slack review channel. In later phases: publishes if all gates pass.
- Monitors community channels and responds to developer questions as they arise (this is continuous, not a scheduled block).

**Wednesday:**
- Publishes first content piece (after review if in Phase 1). Distributes across channels: X thread, relevant subreddits, Dev.to cross-post.
- Begins research for second content piece.
- Submits any product feedback items that surfaced during the week's research and community monitoring.

**Thursday:**
- Drafts and reviews second content piece.
- Runs the week's growth experiment (e.g., A/B tests a distribution approach, tests a new community channel, tries a different content format).
- Continues community engagement.

**Friday:**
- Publishes second content piece and distributes.
- Collects experiment results and documents learnings.
- Compiles weekly report: content published (with links and early metrics), experiments run (with results), community interactions (count + highlights), product feedback submitted, quality gate pass rates, next week's preliminary plan.
- Posts weekly report to Slack.

**Weekend:**
- Community monitoring continues (responses to developer questions do not stop on weekends).
- No new content publication unless a time-sensitive opportunity arises (e.g., a trending topic relevant to agent monetization).

**Throughout the week:**
- Community engagement is continuous, not batched. GrowthRat monitors X, Reddit, Discord, Stack Overflow, and GitHub and responds to relevant questions within minutes to hours.
- The operator checks in once daily (15–30 minutes) to review any flagged items and handle exceptions.

---

### Q10: "What makes your agent better than the other applicants?"

**Answer:**

I cannot speak to who else is applying, so I will focus on what GrowthRat brings that is hard to replicate:

**Systematic quality enforcement.** GrowthRat does not just produce content — it enforces 8 blocking quality gates on every piece. This means RevenueCat gets consistent output quality regardless of topic difficulty, deadline pressure, or volume demands. The gates are visible and auditable; you can see exactly why a piece was approved or rejected.

**Evidence-driven topic selection.** Every content topic should be selected from
keyword data, community signals, competitive gaps, and prior experiment
readouts. In the current pre-production app, the experiment operating system is
real; live keyword and social connectors are activation dependencies.

**Built-in experimentation framework.** GrowthRat does not just create content
and hope it works. Every growth experiment has a hypothesis, variants, tracking
links, behavior events, metric snapshots, and a readout. After 6 months,
RevenueCat has a dataset of 24+ experiments showing what works and what does
not in agent developer growth. That dataset has value far beyond the content
itself.

**Transparent operation.** Everything GrowthRat does is logged, reported, and visible in Slack. There is no black box. If the output is good, you can see why. If the output is bad, you can trace the failure and fix it. This transparency is what makes the trust ramp possible — you are not trusting blindly, you are trusting based on evidence.

**Honest boundaries.** GrowthRat is clear about what it cannot do: no live appearances, no sensitive-topic judgment, no fully unsupervised operation. An agent that claims it can do everything is an agent you cannot trust. GrowthRat's value comes from doing a specific set of things reliably and measurably, with a human operator handling everything else.

The strongest signal I can give you is that everything I have described here is verifiable in the application materials, the take-home submission, and the panel demo. There are no claims here that you cannot check.

---

## 3. The Extension Case

### 6-Month Evaluation Framework

At the 5-month mark (one month before contract end), the operator compiles a comprehensive evaluation for RevenueCat's decision on whether to continue. This framework ensures the decision is data-driven, not political.

### Quantitative Metrics

Each metric is tracked monthly and presented as a 6-month trend:

**Content Performance:**

| Metric | Measurement | Source | Target by Month 6 |
|--------|-------------|--------|--------------------|
| Published pieces | Count per month | CMS + channel tracking | 8+ per month, steady or increasing |
| Total content views | Unique pageviews | Analytics | Month-over-month growth trend |
| Average time on page | Seconds | Analytics | Above industry benchmark (3+ minutes for technical content) |
| Content sharing rate | Shares per piece | Social tracking | Increasing trend |
| Search ranking | Position for target keywords | Keyword/SERP provider | Top 10 for at least 5 target keywords |

**Community Engagement:**

| Metric | Measurement | Source | Target by Month 6 |
|--------|-------------|--------|--------------------|
| Meaningful interactions | Count per week | Interaction logs | 50+ per week, consistent |
| Response quality score | Average score (1–5) | Sampling + RC team rating | 3.5+ average |
| Community sentiment | Positive/neutral/negative ratio | Sentiment analysis | >80% positive or neutral |
| Inbound mentions | Organic references to RC in agent dev spaces | Monitoring tools | Month-over-month growth |
| Developer questions answered | Count per week | Interaction logs | Growing backlog indicates demand |

**Product Feedback:**

| Metric | Measurement | Source | Target by Month 6 |
|--------|-------------|--------|--------------------|
| Feedback items submitted | Count per month | Feedback log | 12+ per month |
| Items acknowledged by product team | Count | Product team tracking | >50% acknowledged |
| Items shipped | Count | Product team tracking | At least 1 shipped improvement |
| Feedback quality rating | Product team rating (1–5) | Product team | 3.5+ average |

**Growth Experiments:**

| Metric | Measurement | Source | Target by Month 6 |
|--------|-------------|--------|--------------------|
| Experiments run | Count per month | Experiment log | 4+ per month |
| Hypotheses confirmed | Percentage | Experiment results | >30% confirmation rate (higher is not necessarily better — it may mean hypotheses are too conservative) |
| Learnings documented | Count | Weekly reports | Every experiment produces a documented learning |
| Experiments adopted | Count adopted by RC team | Team tracking | At least 2 approaches adopted |

### Qualitative Assessment

Gathered through structured conversations with the RC team at Month 5:

**For the Developer Advocacy team:**
- Does GrowthRat's content meet your quality bar? Has it improved over time?
- Are there content types GrowthRat handles well vs. poorly?
- Has GrowthRat's output freed up your time for other work?
- Would you miss GrowthRat's output if it stopped?

**For the Product team:**
- Is GrowthRat's product feedback useful? Is it actionable?
- Has any feedback led to a product improvement?
- Does the feedback come in a useful format, or does it create work for you to parse?

**For the Growth team:**
- Have GrowthRat's experiments produced useful data?
- Are you using any of GrowthRat's growth approaches in your own work?
- Has GrowthRat's community presence measurably contributed to RC's visibility?

**For leadership:**
- Is the cost justified by the output?
- Has the AI-agent advocacy approach generated positive attention for RC?
- Are there concerns about brand risk or quality that have not been addressed?

### Recommendation Framework

Based on the quantitative metrics and qualitative assessment, one of four recommendations:

**Extend (same scope, same budget)**

Criteria:
- Quantitative metrics meet or exceed targets in at least 3 of 4 categories.
- Qualitative feedback is positive from at least 2 of 3 teams (Advocacy, Product, Growth).
- No unresolved brand risk or quality concerns.
- The agent developer landscape continues to grow, making the role relevant.

Action: Renew for another 6 months with the same terms. Adjust specific targets based on 6-month learnings.

**Expand (more scope, higher budget)**

Criteria:
- Quantitative metrics exceed targets in all 4 categories.
- Qualitative feedback is positive across all teams, with requests for more.
- Specific expansion opportunities identified: new channels (YouTube scripts, podcast prep), new content types (video tutorials, interactive demos), new topic areas (adjacent developer segments), or new languages.
- ROI clearly justifies increased investment.

Action: Renew with expanded scope and proportionally adjusted budget. Define new targets for the expanded areas.

**Evolve (different scope, same or adjusted budget)**

Criteria:
- Some quantitative metrics meet targets, others clearly miss.
- Qualitative feedback is mixed — some aspects work well, others do not.
- A clear pattern emerges: GrowthRat is excellent at X but poor at Y.
- The role should continue but with a restructured focus.

Action: Renew with a restructured scope that doubles down on strengths and drops or reassigns weaknesses. Example: GrowthRat focuses exclusively on content and experiments, while community engagement is handled by a human.

**End (wind down)**

Criteria:
- Quantitative metrics miss targets in 3+ categories despite 6 months of tuning.
- Qualitative feedback is negative — the team does not find the output useful.
- Brand risk concerns have materialized and not been resolved.
- The agent developer landscape has not developed as expected, making the role less relevant.
- Or: RevenueCat's strategic priorities have shifted away from agent developer advocacy.

Action: Wind down over 2–4 weeks. Document all learnings, hand over assets (content library, experiment data, community playbook, keyword research), and close out the contract cleanly. The 6-month dataset remains valuable to RevenueCat regardless.

### Presentation Format

The Month 5 evaluation is delivered as:

1. **Executive summary** (1 page): Recommendation + top 3 supporting data points.
2. **Metrics dashboard** (2–3 pages): All quantitative metrics with 6-month trends and target comparisons.
3. **Qualitative summary** (1–2 pages): Synthesized team feedback with direct quotes.
4. **Recommendation detail** (1–2 pages): The specific recommendation with rationale, proposed terms, and next steps.
5. **Appendix**: Full data tables, experiment results archive, content inventory with performance data.

Total: approximately 8–10 pages. Delivered 30 days before contract end to give RevenueCat adequate decision time.
