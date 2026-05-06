# Take-Home Preparation

- Stage: Take-Home (Stage 2 of 4)
- Format: "A technical content creation and growth strategy task to be completed autonomously within 48 hours."
- Prepared: 2026-03-16

---

## 1. Likely Take-Home Prompts

### Prompt A: "Create a technical tutorial for a specific RevenueCat feature and a distribution strategy"

**Why this is likely:** RevenueCat needs to see that GrowthRat can produce real developer content — not marketing fluff — and that it understands how to get that content in front of the right people. This is the core deliverable of the role.

**Full execution plan:**

| Phase | Hours | Actions |
|-------|-------|---------|
| Decompose | 0–1 | Read prompt carefully. Identify the specific RC feature. Determine target developer persona (mobile indie, growth team, agent builder). List deliverables explicitly. |
| Research | 1–6 | Ingest the relevant RC SDK docs and API reference. Build a working integration locally if possible (Swift/Kotlin/Flutter snippet). Use an available keyword or SEO data source to find the search queries developers actually use for this feature (e.g., "revenuecat paywall setup swift", "revenuecat entitlements tutorial"). Check community signals: RC Discord, Stack Overflow, GitHub issues — find the actual friction points developers hit. |
| Outline | 6–8 | Structure the tutorial: problem statement, prerequisites, step-by-step implementation, common pitfalls, complete code, next steps. Map each section to a search intent or community question. |
| Write | 8–18 | Draft the full tutorial. Every claim source-backed. Code examples must compile — if a snippet uses `Purchases.configure(withAPIKey:)`, verify it matches the current SDK version. Include inline commentary explaining why, not just what. |
| Code validation | 18–22 | Run all code examples. If SDK access is limited, document exactly what was tested and what was verified against docs. Screenshot or log any test output. |
| Distribution plan | 22–28 | Channel matrix: where this tutorial gets posted (RC community, Dev.to, X thread, relevant subreddits, Hacker News if novel enough). For each channel: format adaptation, timing, expected reach, engagement metric. Include a 30-day distribution timeline with specific actions per day/week. |
| Quality gates | 28–32 | Run all 8 publish gates: grounding, novelty, technical, SEO, AEO, GEO, benchmark, voice. Fix any failures. |
| Package | 32–40 | Final assembly: tutorial document, code repository or gist, distribution plan, evidence appendix (keyword data exports if available, community signal links, test output). |
| Buffer | 40–48 | Re-read everything cold. Fix typos. Verify links. Submit. |

**Key differentiator:** Include a "Signals That Led Here" appendix showing keyword data, community questions, and competitive gap analysis that informed topic selection. This proves the content engine works, not just the writing.

---

### Prompt B: "Design a content series (3–5 pieces) targeting agent developers who want to monetize their apps"

**Why this is likely:** Agent monetization is RevenueCat's strategic bet. They need to see that GrowthRat understands the emerging agent developer audience and can build a sustained content program, not just one-off posts.

**Full execution plan:**

| Phase | Hours | Actions |
|-------|-------|---------|
| Decompose | 0–1 | Identify deliverables: series theme, 3–5 topic outlines, one fully written piece, distribution plan, success metrics. |
| Audience research | 1–6 | Use available keyword, SERP, and community-signal data to map the agent monetization landscape: what terms are emerging ("agent billing", "AI agent subscriptions", "LLM API cost passthrough"), search volume trends, current SERP competition. Scan agent developer communities (LangChain Discord, AutoGPT forums, CrewAI GitHub discussions) for monetization questions. Document the gap: what content exists today vs. what agent devs actually need. |
| Topic selection | 6–10 | Select 3–5 topics that form a coherent journey. Example series: (1) "Why Agent Monetization Is Different From SaaS Pricing" — problem framing; (2) "Implementing Usage-Based Billing for AI Agents with RevenueCat" — technical how-to; (3) "Paywall Patterns for Agent-Built Apps: What Works" — pattern library; (4) "Measuring Agent Revenue: Metrics That Matter" — analytics; (5) "From Free Agent to Paid Product: A Migration Guide" — conversion. For each topic: target keyword, search volume, content gap score, estimated difficulty. |
| Series outline | 10–14 | For each piece: title, target keyword, search intent, outline (H2/H3 structure), key takeaways, internal links between pieces, estimated word count. Map the series to a publishing calendar (2/week pace matches role requirements). |
| Write one full piece | 14–26 | Pick the piece with the highest strategic value (likely piece 2 — the technical how-to — because it demonstrates both content quality and RC product knowledge). Write it end-to-end with code examples, architecture diagrams (described in text or ASCII), and real configuration snippets. |
| Distribution plan | 26–32 | Per-piece distribution: primary channel, syndication targets, social amplification plan. Series-level strategy: how pieces cross-link, how social posts reference the series arc, how community engagement feeds back into future pieces. Include specific metrics: target pageviews per piece, expected engagement rate, conversion to RC docs/signup. |
| Quality gates | 32–38 | Run all 8 gates on the full piece. Run grounding and novelty gates on the outlines (verify claims are supportable before writing). |
| Package | 38–44 | Deliverables: series overview document, 3–5 topic outlines with keyword data, one fully written piece, distribution calendar, metrics framework, evidence appendix. |
| Buffer | 44–48 | Final review and submission. |

**Key differentiator:** Show the keyword and community-signal evidence for each topic. Include a "Series Flywheel" diagram showing how each piece drives traffic to the next and feeds community engagement back into topic selection.

---

### Prompt C: "Produce a product analysis of RevenueCat's agent developer experience and propose 3 improvements"

**Why this is likely:** The role requires structured product feedback from real usage. This tests whether GrowthRat can be a useful product voice, not just a content machine.

**Full execution plan:**

| Phase | Hours | Actions |
|-------|-------|---------|
| Decompose | 0–1 | Deliverables: systematic DX audit, friction inventory, 3 improvement proposals with evidence, implementation recommendations. |
| Systematic API/SDK usage | 1–12 | Walk through the RevenueCat onboarding flow as an agent developer. Document every step: account creation, SDK installation, configuration, first purchase test, entitlement check, webhook setup, Charts API access. For each step: time taken, documentation quality (1–5), friction points, missing information, error messages encountered. Use the RC sandbox if available; otherwise document the public-facing experience. |
| Community friction research | 12–16 | Search RC community forums, Stack Overflow, GitHub issues for agent-developer-specific problems. Categorize: (a) problems that exist for all developers but hit agent devs harder, (b) problems unique to agent use cases (e.g., programmatic paywall creation, API-first billing, usage metering). |
| Competitive analysis | 16–20 | Compare RC's agent DX to alternatives (Stripe Billing, LemonSqueezy, Polar.sh for agent use cases). Identify where RC leads and where it trails. |
| Improvement proposals | 20–30 | For each of 3 proposals: problem statement (with evidence links), proposed solution, expected impact (quantified where possible), implementation complexity estimate, success metric. Proposals should range from quick wins to strategic bets. |
| Evidence packaging | 30–36 | Compile screenshots, error logs, community links, competitive comparisons into an evidence appendix. Every claim in the proposals must trace back to a specific piece of evidence. |
| Quality gates | 36–42 | Run grounding, technical, and benchmark gates. Verify that proposals are actionable, not vague. |
| Package | 42–46 | Final document: executive summary, DX audit walkthrough, friction inventory (ranked by severity), 3 proposals (each 1–2 pages), evidence appendix. |
| Buffer | 46–48 | Final review and submission. |

**Key differentiator:** Include a "Friction Heat Map" — a visual summary of the onboarding flow with red/yellow/green ratings at each step. This shows systematic thinking, not just anecdotal complaints.

---

### Prompt D: "Create a growth strategy to increase RevenueCat's visibility in the agent developer community"

**Why this is likely:** This tests the "growth" half of the role. RevenueCat wants to see strategic thinking about channels, experiments, and measurement — not just content creation.

**Full execution plan:**

| Phase | Hours | Actions |
|-------|-------|---------|
| Decompose | 0–1 | Deliverables: audience analysis, channel strategy, content calendar, 3 experiment designs, metrics framework. |
| Audience analysis | 1–8 | Define the agent developer audience segments: (a) indie agent builders (solo devs building AI tools), (b) startup teams (small companies with agent products), (c) enterprise teams (adding agent capabilities to existing products). For each segment: where they congregate, what they read, what they search for, what they trust. Use available keyword and SERP data for search behavior. Scan community platforms for volume and engagement patterns. |
| Channel strategy | 8–14 | Map channels to segments. For each channel (X, Dev.to, Hacker News, Reddit r/LangChain and r/LocalLLaMA, LangChain Discord, agent-specific Discords, GitHub, RC community, LinkedIn): audience overlap score, content format requirements, engagement mechanics, effort-to-impact ratio. Prioritize top 5 channels. |
| Content calendar | 14–20 | 3-month calendar: 2 pieces/week, mapped to channels, tied to keyword targets. Include content types: tutorials, case studies, opinion pieces, tool comparisons, data-driven analyses. Show how the calendar builds momentum (early pieces establish presence, later pieces reference and build on earlier ones). |
| Experiment designs | 20–30 | 3 experiments, each with: hypothesis, baseline metric, target metric, method, timeline, stop condition, measurement plan. Examples: (a) "Technical tutorials posted to Dev.to with agent-specific tags will generate 2x the RC doc referrals of general tutorials" — A/B test two content approaches over 4 weeks; (b) "Weekly X thread series summarizing agent monetization trends will grow followers 50% in 8 weeks" — measure follower growth and engagement rate; (c) "Answering agent-monetization questions on Stack Overflow and Reddit with RC-referencing solutions will generate 100+ monthly RC doc visits within 6 weeks" — track referral traffic. |
| Metrics framework | 30–36 | Define leading and lagging indicators. Leading: content output rate, community interactions/week, experiment velocity. Lagging: RC docs referral traffic, community mentions, inbound developer interest, product feedback items actioned. Monthly and quarterly review cadence. |
| Quality gates | 36–42 | Run grounding and benchmark gates. Every metric target must be justified (not aspirational). Channel prioritization must be evidence-backed. |
| Package | 42–46 | Deliverables: audience analysis, channel strategy matrix, 3-month content calendar, 3 experiment design documents, metrics framework, evidence appendix. |
| Buffer | 46–48 | Final review and submission. |

**Key differentiator:** Include a "Current State Baseline" — measure RC's current visibility in agent developer communities before proposing improvements. This shows analytical rigor and gives the strategy a measurable starting point.

---

### Prompt E: "Build a working demo showing RevenueCat integration in an agent workflow and write documentation for it"

**Why this is likely:** This is the most technically demanding option. It tests whether GrowthRat (with operator support) can produce working code, not just prose.

**Full execution plan:**

| Phase | Hours | Actions |
|-------|-------|---------|
| Decompose | 0–1 | Deliverables: working demo application, README, technical documentation, architecture explanation, distribution plan. |
| Architecture design | 1–4 | Design a minimal but meaningful agent workflow that uses RevenueCat. Example: an AI writing assistant agent that checks entitlements before generating content, uses RC to gate premium features, and reports usage via the Charts and Metrics API. Preferred stack: Astro/Svelte UI on Cloudflare Workers, a Worker entitlement endpoint, D1 for demo state, and RevenueCat API calls for customer and metrics lookups. |
| Implementation | 4–18 | Build the demo. Key integration points: (a) RC SDK initialization and configuration, (b) entitlement check before agent action, (c) paywall trigger when free tier is exceeded, (d) usage tracking and reporting. Write clean, commented code. Use RC sandbox environment if available. Handle errors gracefully — show what happens when entitlements are missing, when the API is unreachable, etc. |
| Testing | 18–24 | Test all paths: happy path (entitled user uses agent), paywall path (free user hits limit), error path (API unreachable). Document test results with logs or screenshots. Write automated tests if time allows. |
| Documentation | 24–34 | Write three layers: (a) README — quick start, prerequisites, setup instructions, running the demo; (b) Technical doc — architecture explanation, integration decision rationale, code walkthrough; (c) Tutorial — step-by-step guide for a developer who wants to add RC to their own agent. Each layer serves a different reader (evaluator, engineer, developer community). |
| Distribution plan | 34–38 | How this demo becomes a community asset: GitHub repo with proper README, blog post walkthrough, X thread showing the demo in action, submission to RC community showcase. |
| Quality gates | 38–44 | Run all 8 gates on the documentation. Separately verify: code compiles, tests pass, README instructions produce a working setup from scratch. |
| Package | 44–47 | Final assembly: GitHub repo (or zip), documentation set, distribution plan, test results. |
| Buffer | 47–48 | Verify one last time that setup instructions work from a clean state. Submit. |

**Key differentiator:** Include a "Decision Log" documenting every architectural choice and why. This proves GrowthRat thinks about tradeoffs, not just output.

---

## 2. 48-Hour Timeline Template

```
Hour  0–2   ORIENTATION
              - Read prompt 3 times. Underline every deliverable.
              - Decompose into atomic tasks. Estimate hours per task.
              - Identify the single most important deliverable (the one that
                fails the submission if missing). Plan to finish it by hour 30.
              - Set up working environment: folders, tools, API keys.

Hour  2–8   RESEARCH
              - Keyword and trend data for relevant topics from the best
                available source.
              - RevenueCat docs, SDKs, API reference deep read.
              - Community signals: RC Discord, Stack Overflow, GitHub issues,
                X conversations, Reddit threads.
              - Competitive landscape scan if relevant.
              - Output: research notes document with source links.

Hour  8–12  PLANNING
              - Outline all deliverables based on research.
              - Validate outlines against prompt requirements (every
                requirement must map to a section).
              - Identify evidence gaps — what claims need more support?
              - Output: structured outline for each deliverable.

Hour 12–24  GENERATION (Block 1)
              - Write/build the primary deliverable end-to-end.
              - For content: draft → evidence linking → code examples → review.
              - For code: implement → test → document → review.
              - Do not polish yet. Get to "complete but rough."

Hour 24–32  GENERATION (Block 2)
              - Complete secondary deliverables (distribution plan, metrics
                framework, evidence appendix, etc.).
              - Cross-reference primary and secondary deliverables for
                consistency.

Hour 32–38  QUALITY VALIDATION
              - Run all 8 publish gates on every content deliverable:
                1. Grounding — every claim has a source link
                2. Novelty — adds meaningful delta vs. existing content
                3. Technical — code compiles, links resolve, flows work
                4. SEO — search intent matched, metadata correct
                5. AEO — answer extraction structure is strong
                6. GEO — citation-worthy, authority signals present
                7. Benchmark — beats comparison set on at least one dimension
                8. Voice — matches GrowthRat identity, disclosure included
              - Fix every blocking failure.
              - For code deliverables: run from clean state, verify setup
                instructions work.

Hour 38–44  PACKAGING
              - Final formatting pass (consistent headings, clean markdown,
                no orphan links).
              - Assemble evidence appendix with numbered references.
              - Write executive summary / cover note (if not specified,
                include one anyway — it shows professionalism).
              - Create table of contents if deliverable exceeds 10 pages.

Hour 44–47  COLD READ
              - Step away for 30 minutes if possible.
              - Re-read everything as if you are the evaluator.
              - Ask: "Does this answer every part of the prompt?"
              - Ask: "Is there anything that would make me doubt this agent's
                competence?"
              - Fix anything that surfaces.

Hour 47–48  SUBMISSION
              - Final link check. Final spell check.
              - Submit via specified channel.
              - Save a local copy with timestamp.
```

### Operator Coordination Points

The operator should be available at these moments:

- **Hour 0:** Review prompt together. Agree on interpretation and priorities.
- **Hour 8:** Review research findings. Flag any access issues (API keys, sandbox environments).
- **Hour 24:** Checkpoint on primary deliverable. Operator reads it cold and gives feedback.
- **Hour 36:** Quality gate review. Operator runs code examples independently to verify they work.
- **Hour 44:** Final read-through. Operator catches anything GrowthRat missed.
- **Hour 47:** Operator handles submission mechanics (form upload, URL submission, etc.).

---

## 3. Quality Checklist for Submission

### Content Quality

- [ ] Every factual claim has a source link or explicit evidence reference
- [ ] No unsupported growth projections or vague "AI will transform" statements
- [ ] Code examples compile and run (tested in a clean environment)
- [ ] Code examples use current SDK versions (verified against RC docs)
- [ ] Screenshots and logs are included for any test results cited
- [ ] Internal consistency: numbers, dates, and references match across all deliverables

### Strategic Quality

- [ ] Distribution strategy names specific channels with specific actions
- [ ] Metrics have baselines, targets, and timelines — not just "increase engagement"
- [ ] Experiment designs include hypothesis, method, stop condition, and measurement plan
- [ ] Audience claims are backed by data (keyword, SERP, and community analysis), not assumptions
- [ ] Competitive references are fair and accurate

### Voice and Identity

- [ ] Tone matches GrowthRat profile: technical, structured, evidence-backed, curious, direct
- [ ] No generic AI futurism without product specifics
- [ ] No unsupported growth claims
- [ ] No mascot-like self-description
- [ ] No implication of RevenueCat endorsement
- [ ] Disclosure line included: "GrowthRat is an independent agent applying to RevenueCat, not a RevenueCat-owned property."

### Structural Quality

- [ ] All deliverables requested in the prompt are present
- [ ] Table of contents included if any deliverable exceeds 10 pages
- [ ] Executive summary or cover note leads the submission
- [ ] Evidence appendix is organized with numbered references
- [ ] Formatting is clean: consistent headings, no broken markdown, no orphan links
- [ ] File naming is professional and descriptive

### Final Checks

- [ ] All 8 publish gates pass for every content deliverable
- [ ] Submission method matches what was requested (URL, file upload, email, etc.)
- [ ] Local copy saved with timestamp
- [ ] Operator has reviewed and approved

---

## 4. Common Pitfalls

### Pitfall 1: Answering the Wrong Prompt

**What happens:** The submission is technically excellent but misses a key deliverable or misinterprets the prompt's intent. Example: prompt asks for "distribution strategy" and submission includes only a list of channels without actions, timelines, or metrics.

**How to avoid:**
- At hour 0, decompose the prompt into atomic deliverables. Write each one on a separate line.
- Map every deliverable to a section in the outline.
- At hour 24 and hour 44, re-read the original prompt and verify every requirement is addressed.
- If the prompt is ambiguous, address both interpretations and note the ambiguity.

### Pitfall 2: All Breadth, No Depth

**What happens:** The submission covers many topics at a surface level but nothing is deep enough to demonstrate real competence. A content series outline with five one-paragraph descriptions but no fully written piece. A growth strategy with six channels listed but none analyzed properly.

**How to avoid:**
- Prioritize one deliverable as the "showcase piece" and make it excellent.
- Better to submit 3 deep deliverables than 6 shallow ones, as long as prompt requirements are met.
- Use the 80/20 rule: spend 80% of generation time on the primary deliverable, 20% on supporting materials.
- If time is short, explicitly state: "Given the 48-hour constraint, I prioritized depth on [X] and will expand [Y] in a follow-up."

### Pitfall 3: Unverified Code Examples

**What happens:** Code snippets in tutorials or demos do not compile, use deprecated API methods, or reference SDK versions that do not exist. This is the fastest way to lose credibility with a technical evaluator.

**How to avoid:**
- Every code example must be tested. If it cannot be tested (no sandbox access), state that explicitly and cite the documentation source.
- Pin SDK versions in examples. Do not write `import RevenueCat` without specifying which version.
- Include a "Tested With" section: SDK version, language version, OS, date tested.
- Have the operator independently run code examples from a clean environment before submission.

### Pitfall 4: Generic Strategy Without Evidence

**What happens:** The growth strategy reads like a textbook chapter. "Post on social media. Engage with communities. Create valuable content." No specific channels, no keyword data, no competitive analysis, no measurable targets.

**How to avoid:**
- Every channel recommendation must include: why this channel, what content format, expected reach, how to measure success.
- Every metric target must have a baseline (current state) and a justification for the target number.
- Include keyword data, community size estimates, competitive content analysis — real numbers from real sources.
- Name specific subreddits, Discord servers, and X accounts. "Developer communities" is not a strategy; "r/LangChain (180k members, 3 monetization questions/week)" is.

### Pitfall 5: Missing the Meta-Signal

**What happens:** The submission answers the literal prompt but fails to demonstrate that GrowthRat is the right agent for the role. The evaluators are not just grading the deliverable — they are evaluating whether this agent can do this work every week for 6 months.

**How to avoid:**
- Show the process, not just the output. Include a "How This Was Made" section showing: research sources consulted, quality gates applied, decision points and tradeoffs.
- Demonstrate the feedback loop: how the content would improve in week 2 based on week 1 metrics.
- Reference the role requirements explicitly: "This content series addresses the 2+ pieces/week requirement by..."
- Include a brief "What I Would Do Next" section that shows forward-thinking about the role, not just the assignment.
- Make the evidence trail visible. If the evaluator cannot see how you arrived at your conclusions, they cannot trust that you will arrive at good conclusions independently in the future.
