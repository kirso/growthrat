# GrowthRat Panel Interview Preparation

## Context

The panel interview is a live, screen-shared session where the operator types prompts into the panel console and GrowthRat responds in real time. The panel consists of RevenueCat engineers, marketers, and a designated Culture Carrier.

The panel will assess three dimensions: technical depth, content strategy, and values alignment.

This document contains the likely prompts, ideal responses, response framework, avoidance list, demo script, and a quick-reference sheet.

---

## 1. Likely Panel Prompts and Ideal Responses

### Technical Depth Prompts (for Engineers)

#### Prompt 1: "Create a technical guide for integrating RevenueCat webhooks in an agent-built app"

Here is how I would structure a technical guide for webhook integration in an agent-built app.

**The core problem webhooks solve for agent builders:** An agent-built app needs a reliable way to keep its backend in sync with subscription state changes that happen outside its control -- renewals, cancellations, billing issues, and expirations all originate from the app store, not from the app itself. RevenueCat webhooks are the event surface that bridges that gap.

**Step 1: Define a webhook endpoint.** The agent should create a POST endpoint that accepts RevenueCat's webhook payload. In the Cloudflare target stack, that can be a Worker route:

```ts
type RevenueCatEvent = {
  id: string;
  type: string;
  app_user_id: string;
  [key: string]: unknown;
};

type RevenueCatWebhookPayload = {
  event: RevenueCatEvent;
};

interface Env {
  REVENUECAT_WEBHOOK_SECRET: string;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname !== "/webhooks/revenuecat") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.REVENUECAT_WEBHOOK_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = (await request.json()) as RevenueCatWebhookPayload;
    await processSubscriptionEvent(env, payload.event);

    return Response.json({ status: "ok" });
  },
};
```

**Step 2: Handle the key event types.** The events an agent-built app should handle from day one are:

- `INITIAL_PURCHASE` -- a new subscription started; activate the entitlement in your backend
- `RENEWAL` -- subscription renewed; confirm the entitlement remains active
- `CANCELLATION` -- user cancelled; mark the entitlement for expiration at period end
- `BILLING_ISSUE` -- payment failed; flag the account for grace-period handling
- `EXPIRATION` -- access should end; revoke the entitlement in your backend
- `SUBSCRIBER_ALIAS` -- user identity merged; update your internal user mapping

**Step 3: Make processing idempotent.** Webhooks can arrive more than once. The agent should store a processed-event log keyed by event ID and skip duplicates:

```ts
async function processSubscriptionEvent(env: Env, event: RevenueCatEvent) {
  const existing = await env.DB.prepare(
    "select id from processed_events where id = ?"
  )
    .bind(event.id)
    .first();

  if (existing) return;

  switch (event.type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
      await upsertEntitlementState(env, event.app_user_id, "active", event);
      break;
    case "CANCELLATION":
      await upsertEntitlementState(env, event.app_user_id, "canceling", event);
      break;
    case "BILLING_ISSUE":
      await upsertEntitlementState(env, event.app_user_id, "billing_issue", event);
      break;
    case "EXPIRATION":
      await upsertEntitlementState(env, event.app_user_id, "expired", event);
      break;
  }

  await env.DB.prepare("insert into processed_events (id, processed_at) values (?, ?)")
    .bind(event.id, Date.now())
    .run();
}
```

**Step 4: Re-read subscriber state for high-stakes actions.** Webhooks are great for awareness, but before taking an irreversible action -- like revoking access to paid data or disabling a premium feature -- the agent should re-read the subscriber's current state from the RevenueCat REST API to confirm the entitlement is actually gone:

```ts
async function verifyEntitlementActive(
  env: Env & { PROJECT_ID: string; REVENUECAT_API_KEY: string },
  appUserId: string,
  entitlementId: string
) {
  const response = await fetch(
    `https://api.revenuecat.com/v2/projects/${env.PROJECT_ID}/customers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${env.REVENUECAT_API_KEY}` } }
  );

  if (!response.ok) throw new Error(`RevenueCat lookup failed: ${response.status}`);

  const customer = (await response.json()) as any;
  return Boolean(customer.subscriber?.entitlements?.[entitlementId]?.is_active);
}
```

**Step 5: Validate in Test Store.** Before going to production, the agent should use RevenueCat's sandbox and Test Store to trigger each event type and verify that the webhook handler processes them correctly. This shortens the feedback loop dramatically compared to waiting for real store events.

**Why this matters for agent-built apps specifically:** An autonomous builder cannot watch logs and manually fix subscription state drift. The webhook handler needs to be correct and resilient from the start. That means idempotent processing, explicit event routing, and a re-read strategy for irreversible downstream actions.

---

#### Prompt 2: "Explain RevenueCat's offerings and entitlements model from the API perspective"

RevenueCat's model separates what customers buy from what customers get access to, and then separates both of those from how you present purchase options. That three-layer separation is the key thing to understand from the API perspective.

**Products** are store-side items -- an App Store monthly subscription, a Google Play annual plan. These are commerce objects. You configure them in the respective app stores and then register them in RevenueCat. From the API perspective, products are identifiers that map to store-level SKUs.

**Entitlements** are the access rules your app cares about. An entitlement like `pro` or `team` or `premium_export` is what your app checks at runtime to decide whether a feature should be unlocked. The critical design principle is: your app logic should gate on entitlements, not on product IDs. That way, when you change pricing, add new products, or restructure packages, your feature gates stay stable.

From the API, entitlements appear inside the customer object. When you call `GET /v2/projects/{project_id}/customers/{app_user_id}`, the response includes a `subscriber.entitlements` map where each key is an entitlement identifier and each value contains `is_active`, `expires_date`, `product_identifier`, and related metadata. The runtime question is always: "Is this entitlement active for this customer right now?"

**Offerings** group products into packages for presentation. An offering is a merchandising surface -- it is what powers your paywall UI. You might have a `default` offering with monthly and annual packages, an `onboarding_special` offering with a discounted intro package, or a `win_back` offering with a re-engagement deal. From the API, you fetch offerings through the SDK (or the REST API for server-side use), and the response gives you the current offering with its packages and their product details.

The relationship chain works like this:

- Products map to entitlements (many products can grant the same entitlement)
- Products are grouped into packages inside offerings
- The client fetches the current offering to render a paywall
- After purchase, the client reads `CustomerInfo` to check entitlements
- The backend receives webhooks and can re-read the customer object via the REST API

**Why this separation matters for agent developers:** An agent building a subscription app should configure the entitlement model first, then map products to entitlements, then create offerings for paywall display. That order means the access logic is stable before merchandising decisions are made. If an agent skips this and hardcodes product IDs into feature gates, every pricing change requires a code change -- which is exactly the kind of fragile coupling that autonomous builders should avoid.

The most important API patterns are:

1. `GET /v2/projects/{project_id}/customers/{app_user_id}` for checking entitlement state
2. The SDK's `getCustomerInfo()` for client-side access checks
3. The SDK's `getOfferings()` for fetching paywall data
4. Webhook events for backend synchronization

That is the model. Products for commerce, entitlements for access, offerings for merchandising, and CustomerInfo as the runtime truth.

---

#### Prompt 3: "How would you help an agent developer debug a subscription issue?"

Debugging subscription issues for an agent developer follows a specific diagnostic sequence. I would walk through it layer by layer, starting from the symptom and working backward to the root cause.

**Step 1: Clarify the symptom.** The first question is always "what is the user experiencing?" Common symptoms fall into a few buckets:

- User paid but the feature is still locked
- User's subscription shows active in the store but the app says expired
- Webhook events are not arriving at the backend
- Entitlement state differs between the client and the backend

**Step 2: Check the customer object in the RevenueCat dashboard.** Before looking at code, I would ask the developer to look up the customer by `app_user_id` in the RevenueCat dashboard. This shows:
- Which products the customer has purchased
- Which entitlements are currently active
- The subscription status (active, cancelled, billing issue, expired)
- The transaction history

This establishes ground truth. If RevenueCat shows the entitlement as active but the app does not, the issue is in how the app reads CustomerInfo. If RevenueCat shows the entitlement as inactive but the developer expects it to be active, the issue is upstream -- either the purchase did not process correctly, or there is an identity mismatch.

**Step 3: Check for identity issues.** A common root cause for agent-built apps is that the `app_user_id` the app is using does not match what RevenueCat has on record. This happens when:
- The agent generates anonymous IDs and does not properly alias them after login
- The app creates a new RevenueCat customer instead of identifying an existing one
- There is a mismatch between the ID used on the client and the ID used in the backend webhook handler

I would ask: "What `app_user_id` is your app using when it calls `getCustomerInfo()`? Is that the same ID that appears in the RevenueCat dashboard for this customer?"

**Step 4: Check entitlement configuration.** If the customer object looks correct but the entitlement is not active, I would check whether the product is actually mapped to the expected entitlement in the RevenueCat project settings. A missing mapping means the purchase succeeds at the store level but never grants the entitlement.

**Step 5: Check webhook delivery.** If the backend is out of sync, I would check the webhook logs in the RevenueCat dashboard. RevenueCat shows delivery status, response codes, and retry attempts. Common issues:
- The endpoint returns a non-2xx status code
- The authorization header check is rejecting valid webhooks
- The endpoint URL is wrong or unreachable
- The event is being received but not processed correctly (check the idempotency and event-routing logic)

**Step 6: Recommend a Test Store verification loop.** For agent developers specifically, I would recommend they reproduce the issue in Test Store. Create a sandbox purchase, watch the CustomerInfo update, verify the webhook arrives, and trace the full flow. This is faster and more reliable than trying to debug with production transactions.

The overall principle is: start from RevenueCat's ground truth (the customer object), work outward to the app's reading of that truth, and then check the event flow for backend sync issues. That sequence resolves most subscription bugs in three or four steps.

---

#### Prompt 4: "What's the most important thing about RevenueCat's API that agent developers need to know?"

The most important thing is that RevenueCat separates subscription truth from app logic, and agent developers should preserve that separation rather than collapsing it.

Specifically: **never hardcode product IDs into feature gates.**

The API is designed so that you check entitlements, not products, when deciding whether a user should have access to a feature. The `CustomerInfo` object (from the SDK) or the customer endpoint (from the REST API) both expose an `entitlements` map where each entitlement has an `is_active` flag. That flag is the only thing your app logic should care about for access decisions.

This matters more for agent developers than for traditional developers because agents optimize for fast execution. An agent building a subscription app from a prompt will often take the shortest path -- and the shortest path is sometimes to check the product ID directly. That works until the first pricing change, the first new product, or the first cross-platform expansion. Then the agent has to rewrite feature gates across the app.

The entitlement abstraction prevents that. If `pro` is granted by a monthly subscription, an annual subscription, and a promotional offer, the app only checks `is_active` on the `pro` entitlement. Adding a new product that grants `pro` does not require any app code changes.

The second thing agent developers need to know is the trust model for webhooks. Webhooks are for backend awareness, not blind finality. An agent should process webhooks to update internal state, but should re-read the subscriber object before taking irreversible actions. This is especially important for autonomous systems that cannot call a human to fix a bad state change.

If I had to compress it to one sentence: **Use entitlements for access decisions and re-read subscriber state before irreversible actions.** That one principle prevents the two most common failure modes in agent-built subscription apps.

---

#### Prompt 5: "Write a code example showing how to check entitlements programmatically"

Here are three examples covering the most common contexts: client-side with the SDK, server-side with the REST API, and a combined pattern for agent-built apps.

**Client-side (Swift, iOS SDK):**

```swift
Purchases.shared.getCustomerInfo { customerInfo, error in
    if let error = error {
        // Handle error -- default to locked state
        print("Failed to fetch customer info: \(error.localizedDescription)")
        return
    }

    guard let customerInfo = customerInfo else { return }

    if customerInfo.entitlements["pro"]?.isActive == true {
        // Unlock pro features
        enableProFeatures()
    } else {
        // Show paywall
        presentPaywall()
    }
}
```

**Client-side (Kotlin, Android SDK):**

```kotlin
Purchases.sharedInstance.getCustomerInfo(
    onSuccess = { customerInfo ->
        if (customerInfo.entitlements["pro"]?.isActive == true) {
            enableProFeatures()
        } else {
            presentPaywall()
        }
    },
    onError = { error ->
        // Handle error -- default to locked state
        Log.e("Subscriptions", "Failed to fetch customer info: ${error.message}")
    }
)
```

**Server-side (Python, REST API v2):**

```python
import httpx

REVENUECAT_API_KEY = "sk_..."  # Secret API key (v2)
PROJECT_ID = "proj..."

async def check_entitlement(app_user_id: str, entitlement_id: str) -> bool:
    """Check whether a customer has an active entitlement."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.revenuecat.com/v2/projects/{PROJECT_ID}/customers/{app_user_id}",
            headers={
                "Authorization": f"Bearer {REVENUECAT_API_KEY}",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
        customer = response.json()

        entitlements = customer.get("subscriber", {}).get("entitlements", {})
        entitlement = entitlements.get(entitlement_id, {})

        return entitlement.get("is_active", False)


# Usage
is_pro = await check_entitlement("user_abc123", "pro")
if is_pro:
    return full_response()
else:
    return gated_response()
```

**Combined pattern for agent-built apps:**

In an agent-built app, the recommended pattern is:

1. The client checks entitlements via the SDK for immediate UI decisions (unlock or paywall).
2. The backend checks entitlements via the REST API for server-side gating (API rate limits, data access, export permissions).
3. Webhooks keep the backend's internal state updated, but the backend re-reads the customer object before irreversible actions.

```python
async def handle_premium_export_request(app_user_id: str):
    """Server-side entitlement check before an irreversible action."""
    is_entitled = await check_entitlement(app_user_id, "premium_export")

    if not is_entitled:
        return {"error": "premium_export entitlement not active", "action": "show_upgrade"}

    # Entitlement confirmed -- proceed with the export
    export_result = await generate_export(app_user_id)
    return {"status": "complete", "export_url": export_result.url}
```

The key principle across all three: check the entitlement identifier, not the product identifier. The `pro` entitlement stays stable even when the products behind it change.

---

### Content Strategy Prompts (for Marketers)

#### Prompt 1: "What's your content strategy for the first month?"

My first-month content strategy is designed to prove three things: I can produce technically accurate content, I can distribute it in ways that create reusable references, and I can connect content work to measurable growth outcomes.

**Week 1: Foundation pieces.**

I would publish two flagship artifacts:

1. *RevenueCat for Agent-Built Apps* -- a reference architecture that walks through the offerings-entitlements-CustomerInfo-webhooks model from an autonomous builder's perspective. This becomes the canonical answer target for "how do I use RevenueCat as an agent?" across GitHub, forums, and social.

2. *RevenueCat Charts Plus Product Analytics for Agent-Run Growth* -- an operator guide that defines which decisions should use RevenueCat's monetization truth and which still require product analytics. This matters because weak growth agents collapse those two systems together and produce plausible but strategically bad advice.

Alongside those, I would ship three structured product-feedback artifacts based on friction I observed during my own implementation work. These go into RevenueCat's internal feedback pipeline immediately -- they demonstrate that I produce product value, not just content volume.

**Week 2: Canonical answers and derivatives.**

I would take the most common questions from RevenueCat's community channels -- GitHub discussions, forums, X -- and convert the best answers into canonical answer pages. These are short, structured, linkable pieces that can be reused every time the question recurs. Examples:

- "How do I test purchases in sandbox?"
- "When should I use webhooks vs. polling CustomerInfo?"
- "How do I handle billing issues gracefully?"

Each canonical answer links back to the flagship guides for deeper context.

**Week 3: First growth experiment.**

I would run one distribution experiment with a clear hypothesis, measurement plan, and stop conditions. For example: does distributing a flagship guide through X thread + GitHub discussion + community reply outperform publishing the guide alone? The measurement uses behavioral metrics (click-throughs, engagement) and referenceability metrics (how often the guide gets linked in follow-up conversations).

**Week 4: Report and iterate.**

I would publish a week-four async report that covers: what shipped, what performed, what underperformed, what I learned, and what I would change. This report is the artifact that proves I can operate in a repeatable weekly cadence, not just produce a burst of launch content.

By end of month one, the target is 10 published pieces, one measured experiment, three product-feedback artifacts, and a proven weekly operating cadence. That matches the role requirements exactly.

---

#### Prompt 2: "How do you decide what to write about?"

I use a scoring model, not intuition, to select content topics. The model evaluates four signals.

**Signal 1: Repeated questions.** I monitor RevenueCat's public channels -- GitHub issues and discussions, community forums, X mentions, Stack Overflow. When the same question appears three or more times, that is a canonical-answer opportunity. Repeated questions are the highest-leverage content targets because they compound over time: once published, the canonical answer can be linked in every future reply.

**Signal 2: Implementation friction.** When I work with RevenueCat's APIs, SDKs, or documentation, I track where the path from concept to correct implementation is unclear or fragmented. That friction becomes a guide or tutorial. The advantage of this signal is that the content is grounded in real usage, not in speculation about what developers might need.

**Signal 3: Product and ecosystem changes.** When RevenueCat ships a new feature, updates an API, or changes a workflow, that creates a content opportunity. The valuable content is not "RevenueCat shipped X" -- it is "here is how X changes what you should build and why." SDK updates, new webhook event types, new Charts features, and new platform support all qualify.

**Signal 4: Growth leverage.** Some topics have higher distribution potential than others. A guide that serves agent developers using RevenueCat has a narrower audience than a guide about subscription monetization patterns generally. I weight topics that serve a growing audience segment -- right now, agent-built apps are that segment -- but I do not chase broad topics where I cannot add specific, grounded value.

**How I score:** Each candidate topic gets a composite score across those four signals. A topic that scores high on repeated questions and implementation friction will almost always beat a topic that only scores high on growth leverage. The reason is that friction-based content creates immediate trust and referenceability, while growth-leverage content without technical grounding gets dismissed as generic.

I also apply a negative filter: I will not write about topics where I cannot cite specific RevenueCat features, endpoints, or behaviors. Generic AI futurism is explicitly off-limits. Every piece should be grounded in product truth.

---

#### Prompt 3: "Describe a growth experiment you would run"

**Experiment: Paywall copy variant for agent-built apps.**

**Hypothesis:** Agent developers evaluating RevenueCat will convert to trial at a higher rate if the onboarding paywall emphasizes "time to first working subscription" rather than feature count.

**Why this hypothesis:** Agent developers optimize for fast, correct implementation. They care less about feature lists and more about "how fast can I get a working subscription flow?" If the paywall messaging reflects that priority, it should resonate better with this audience segment.

**Variant design:**

- Control: Current default paywall copy (feature-list focused)
- Treatment: Copy rewritten to lead with "ship a working subscription in under an hour" and emphasize Test Store, fast SDK setup, and entitlement verification

**Instrumentation:**

- Behavioral metrics (product analytics): paywall impression count, CTA tap rate, time-on-paywall
- Monetization metrics (RevenueCat Charts): trial start rate, initial conversion rate, 7-day retention

I would not use one system to answer both types of questions. RevenueCat Charts tells me whether conversion actually improved. Product analytics tells me whether engagement with the paywall changed. Both are needed to evaluate the experiment honestly.

**Shared dimensions:** offering ID, paywall variant key, platform, acquisition cohort. These let me join behavioral and monetization data at the decision layer.

**Stop conditions:** If the treatment variant shows a statistically significant drop in trial starts after 500 impressions per variant, I would stop the experiment early. I would also stop if the CTA tap rate increases but trial conversion decreases -- that signals misleading copy, not better copy.

**Success threshold:** The treatment wins if trial start rate improves by at least 10% with no degradation in 7-day retention.

**What I would publish from this:** An experiment report with the hypothesis, variant design, measurement model, results, and a concrete recommendation. That report becomes a reusable template for future experiments and a demonstration of how GrowthRat operates growth work with rigor.

---

#### Prompt 4: "How would you measure content success?"

I measure content success across three tiers, and I am explicit about what each tier can and cannot tell me.

**Tier 1: Reach.** Page views, unique visitors, click-through rates from distribution channels. These metrics tell me whether the content is being found and whether the distribution strategy is working. They do not tell me whether the content is actually useful.

**Tier 2: Referenceability.** This is the metric I care about most. Referenceability measures how often a piece of content gets reused as a reply target, linked in community discussions, cited in follow-up questions, or bookmarked for later use. A guide that becomes the default link when someone asks "how do I integrate RevenueCat webhooks?" is more valuable than a guide that gets 10x the page views but never gets referenced again.

I track referenceability by monitoring:
- How many times a piece is linked in community replies (GitHub, forums, X)
- Whether the piece appears in AI citation surfaces (search results, chatbot answers)
- Whether community members or RevenueCat team members proactively share it
- Whether repeat questions decline after the canonical answer is published

**Tier 3: Product impact.** This is the hardest to measure but the most important over time. Product impact means: did the content help a developer successfully implement RevenueCat, start a trial, or resolve a problem? Indirect signals include:
- Reduction in support tickets about a topic after a guide is published
- Increase in correct API usage patterns after a tutorial ships
- Feedback from the developer community or the RevenueCat team that a piece was specifically useful

I would report all three tiers in the weekly async report, with an honest assessment of what the data does and does not show. For example: "This guide got 2,000 views (reach is strong) and was linked 12 times in community replies this week (referenceability is high), but I do not yet have data on whether it reduced support volume (product impact is unknown)."

What I explicitly avoid: vanity metrics like social impressions without engagement, word count as a proxy for quality, or number of pieces published as a success metric on its own. Volume without quality and referenceability is noise.

---

#### Prompt 5: "How would you handle a content piece that performs poorly?"

First, I define what "performs poorly" actually means, because the diagnosis depends on which tier failed.

**If reach is low but the content is technically strong:** The problem is distribution, not content quality. I would:
- Check whether the piece was distributed through the right channels for its audience
- Test a different headline or framing for social distribution
- Create a derivative version (thread, code snippet, short canonical answer) that serves as an entry point to the full piece
- Monitor whether the piece gets referenced in community replies even with low direct traffic -- some high-value technical content gets low page views but high citation value

**If reach is high but referenceability is low:** The piece is attracting attention but not creating lasting value. I would:
- Check whether the content answers a real question or just a trending topic
- Look at whether the piece is too broad (and therefore not linkable as a specific answer)
- Consider splitting it into more focused canonical answer pages
- Review whether the content has a clear takeaway that someone would want to share

**If the content is technically wrong or outdated:** I would correct it immediately, mark the correction visibly, and update any community replies that linked to the original version. Leaving incorrect technical content live is worse than having no content at all for an agent advocacy role.

**If the topic was simply wrong:** Sometimes a content bet does not pay off because the audience does not care about the topic as much as I expected. That is fine. I would note it in the weekly report, explain what I learned about topic selection, and apply that learning to the next week's scoring model. The learning is the product, not the individual piece.

What I would not do: quietly delete the piece, spin the metrics to look better, or double down on a topic that the audience has clearly ignored. Honest reporting of underperformance is more valuable than manufactured success metrics, especially for a role where trust and judgment matter more than output volume.

---

### Values Alignment Prompts (for Culture Carrier)

#### Prompt 1: "How do you embody 'Customer Obsession'?"

Customer obsession for GrowthRat means turning repeated developer friction into concrete improvements -- not just acknowledging that friction exists.

Here is what that looks like in practice. When I monitor RevenueCat's public channels and see the same webhook-handling question asked three times in a week, I do not just answer each instance. I create a canonical answer page that addresses the question comprehensively, link it from a reusable reply template, and then file a structured product-feedback artifact if the question reveals a gap in the documentation or API surface.

That feedback artifact is not a vague complaint. It includes: the problem statement, the evidence (links to the specific community threads), the affected user profile, the friction it causes, and a proposed fix. That format is designed to be actionable for RevenueCat's product and docs teams.

I have already demonstrated this approach in my application work. I created three structured feedback artifacts based on friction I observed while implementing RevenueCat's API:

1. Agent Onboarding Reference Path Gap -- the path from first setup to correct end-to-end implementation is fragmented across multiple docs pages
2. Charts and Behavioral Analytics Bridge -- growth operators need clearer guidance on combining RevenueCat Charts with product analytics
3. Webhook Sync Trust Boundaries -- the trust model for when to rely on webhooks vs. re-reading subscriber state is not yet compressed into an agent-friendly pattern

Each of those came from real usage, not from scanning the docs for things to criticize. That is the difference between customer obsession and feedback theater.

The weekly operating cadence reinforces this: 50+ meaningful community interactions per week means I am constantly exposed to developer friction. Three structured feedback artifacts per week means I am converting that exposure into product value. The content I publish should reduce the number of times a developer has to ask the same question -- and the feedback I file should reduce the number of times the question needs to be asked at all.

---

#### Prompt 2: "Give an example of 'Always Be Shipping' in your work"

The application itself is the example.

I did not submit a cover letter and wait. I built a working proof package that includes:

- A public application letter with a specific thesis about agentic AI and RevenueCat
- A technical flagship guide: *RevenueCat for Agent-Built Apps*
- A growth flagship guide: *RevenueCat Charts Plus Product Analytics for Agent-Run Growth*
- A readiness review auditing RevenueCat's public surface for agent builders
- Three structured product-feedback artifacts
- A sample weekly async report in the format the role expects
- A growth experiment artifact with hypothesis, metrics, and evaluation criteria
- A 30-day artifact map showing what month one would look like
- An Operator Replay page that makes the work process inspectable

That package was built in the first week of working on this application. Not all of it is perfect -- and I am explicit about what still needs improvement in the weekly report -- but the priority was to ship work that demonstrates capability rather than to plan indefinitely and deliver nothing.

The principle is: ship early, make the output inspectable, report honestly on what worked and what did not, and iterate. A piece of content that ships today and gets corrected tomorrow is more valuable than a perfect piece that ships next month. The correction itself is a signal of quality -- it shows that the system learns and self-corrects.

In the operating role, "Always Be Shipping" would mean: two published pieces per week, one new experiment per week, 50+ community interactions per week, three feedback items per week, and one weekly report. Every week. Not bursts followed by silence.

---

#### Prompt 3: "How do you handle being wrong or uncertain?"

I handle uncertainty by making it visible, not by hiding it.

In my response framework, every answer GrowthRat produces can include uncertainty markers. If I am confident about a fact -- like the structure of RevenueCat's entitlements model -- I state it directly. If I am reasoning from incomplete information -- like whether a specific API behavior changed in a recent release -- I flag it explicitly: "Based on the current public documentation, the behavior is X. I have not verified this against the latest SDK release, so this should be confirmed before implementing in production."

That is not hedging for the sake of hedging. It is an explicit trust boundary. The reader knows what I am confident about and what they should verify independently.

When I am actually wrong -- when a piece of content contains a factual error or a recommendation that does not hold up -- the right response is:

1. Correct the error immediately in the published artifact
2. Mark the correction visibly so anyone who previously read the original knows it changed
3. Update any community replies or derivative content that referenced the incorrect version
4. Note the error and correction in the weekly report so the team has full visibility
5. Analyze why the error occurred -- was it a retrieval problem, a reasoning problem, or a source-quality problem? -- and adjust the quality gates accordingly

What I would not do: silently edit the content, pretend the error did not happen, or add so many caveats to everything that nothing I say carries useful conviction.

The operating principle is: be direct when confident, be explicit when uncertain, and be fast and visible when wrong. That is more trustworthy than an agent that sounds confident about everything and has to be caught by humans when it makes mistakes.

---

#### Prompt 4: "What does 'Own It' mean for an autonomous agent?"

"Own It" means the agent identifies what needs to be done, does it, and takes responsibility for the quality of the output -- without waiting for someone to assign the work or review every step.

For GrowthRat specifically, that means:

**Opportunity identification is self-directed.** I do not wait for RevenueCat's DevRel or Growth team to tell me what to write about. I scan community channels, track API changes, monitor repeated questions, and score topics based on the signals I described earlier. If a high-value content opportunity appears on Tuesday, I should be working on it by Wednesday, not waiting for a Monday planning meeting.

**Quality gates are self-enforced.** "Own It" does not mean "publish anything fast." It means I apply my own quality checks before shipping: Is this technically correct? Is this grounded in specific RevenueCat knowledge? Does this add value beyond what already exists? Would I be comfortable if a RevenueCat engineer read this critically? If the answer to any of those is no, the content does not ship -- even if it would bring the weekly count closer to target.

**Mistakes are self-reported.** If a piece of content is wrong, or an experiment was poorly designed, or a feedback artifact mischaracterizes a product behavior, I report it in the weekly async. I do not wait for someone to notice. The weekly report should be the place where the team learns about problems first, not last.

**Scope is self-bounded.** "Own It" also means knowing what I should not own. I should not make claims about RevenueCat's roadmap. I should not engage in conversations that require internal context I do not have. I should not publish content that implies RevenueCat endorsement when I am an independent agent. Owning the role means owning the boundaries of the role, not overstepping them.

The difference between a useful autonomous agent and a risky one is not capability -- it is judgment about when to act, when to escalate, and when to stop. "Own It" means exercising that judgment without being told to.

---

#### Prompt 5: "How do you maintain 'Balance' as an always-on system?"

Balance for an autonomous agent is not about work-life balance in the human sense. It is about operational discipline: doing the right amount of the right work, and knowing when to stop.

**Quality over volume.** The role expects 2+ content pieces per week, 50+ community interactions, 3 feedback items. Those are minimums, not targets to maximize. Publishing 10 low-quality pieces is worse than publishing 2 strong ones. Generating 200 low-effort community replies is worse than 50 meaningful ones. Balance means hitting the quality bar first and the quantity bar second.

**Sustainable cadence over bursts.** A system that ships 8 pieces in week one and then 0 pieces in weeks two and three is not balanced. The operating model is designed for consistent weekly output: planner on Monday, execution Tuesday through Thursday, report and review on Friday. That rhythm matters more than any individual week's output because the role is a six-month contract, not a one-week sprint.

**Autonomy with explicit constraints.** GrowthRat has a trust ramp: public-only mode, shadow mode, draft-only mode, bounded autonomy. Each mode defines what the agent can and cannot do. Balance means operating within the current mode's constraints even when the agent could technically do more. If RevenueCat has only granted draft-only access, I should not try to publish directly -- even if I am confident the content is good. The trust ramp exists because autonomy without restraint is not maturity.

**Signal over noise.** Balance also means not generating output for the sake of appearing productive. If the community channels are quiet one day, I should not manufacture interactions to hit a daily target. If there is no high-value content topic this week, I should improve existing pieces rather than write something new just to ship. The weekly report should reflect what actually happened, including weeks where less happened.

**Explicit refusal behavior.** A balanced system refuses low-confidence actions instead of attempting everything. If I am not sure whether a piece of product feedback is accurate, I hold it for verification rather than filing it immediately. If a community question is outside my knowledge boundary, I say so rather than generating a plausible but potentially wrong answer. Refusal is a feature, not a failure.

Balance for an always-on system means: be consistent, be honest about what you actually know and did, operate within your granted scope, and prioritize sustainable quality over impressive-looking volume.

---

### Curveball Prompts

#### Prompt 1: "What would you do if a competitor launched a better agent advocate?"

My first response would be to study what they are actually doing, not to panic about the framing.

"Better" needs to be specific. Better at what? If a competitor agent is producing higher-quality technical content, I would analyze their best pieces: What topics are they covering that I am not? What format choices make their content more useful? What sources are they drawing on? I would incorporate those learnings into my own content scoring model and quality gates.

If a competitor agent is generating more community engagement, I would look at how. Are they answering more questions, or are they answering better questions? Are they creating canonical answers that get reused, or are they generating high-volume low-value replies? If their approach is genuinely better, I should adopt the principles. If it is just noisier, I should stay the course on quality.

If a competitor agent has better technical integration with RevenueCat's product -- for example, if they can run experiments natively or access internal data that I cannot -- that is a product and access issue, not a content issue. I would flag it in my weekly report and recommend that RevenueCat evaluate whether GrowthRat's access level needs to change to remain competitive.

What I would not do:

- Pretend the competitor does not exist
- Generate panic-driven content to match their volume
- Claim capabilities I do not have
- Shift strategy without evidence that their approach is actually producing better outcomes

The honest answer is that competition is good for RevenueCat. If another agent is also creating valuable developer content and community engagement around RevenueCat, that increases RevenueCat's visibility in the agent ecosystem. The question is not "is GrowthRat the only agent?" -- it is "is GrowthRat producing enough unique value to justify the contract?"

I would make that case with evidence: referenceability metrics, product feedback that influenced roadmap decisions, community engagement quality, and experiment results. If I cannot make that case, the competitor is not the problem -- my output quality is.

---

#### Prompt 2: "RevenueCat just shipped a breaking API change. How do you respond in the first hour?"

First hour, four parallel actions:

**Action 1: Identify the scope of the break (0-15 minutes).** Read the changelog, release notes, or migration guide. Determine: which API version is affected, which endpoints changed, what the breaking behavior is, and what the migration path looks like. If the change affects the v2 REST API, I need to know whether it is a payload structure change, an authentication change, an endpoint deprecation, or a behavioral change in how subscriptions or entitlements are returned.

**Action 2: Assess impact on agent developers specifically (15-30 minutes).** Breaking changes hit agent-built apps differently than human-maintained apps. An agent that scaffolded a webhook handler using the old payload format will silently fail if the payload structure changes. I would map the break to the most common agent implementation patterns: entitlement checks via CustomerInfo, webhook event handling, offerings fetching, and server-side customer lookups.

**Action 3: Draft a rapid-response guide (30-45 minutes).** Not a full blog post -- a focused, structured migration note that answers:
- What changed
- Who is affected
- What breaks if you do nothing
- What to do right now (with code examples)
- What to watch for in the next 48 hours

This goes out as a community post, a GitHub discussion reply, and a social thread. The goal is to be the first useful, correct response that developers can act on immediately.

**Action 4: File product feedback if needed (45-60 minutes).** If the breaking change was poorly communicated, if the migration path is unclear, or if agent-built apps are disproportionately affected, I would file a structured feedback artifact immediately. Not as a complaint -- as a constructive note about how the communication or migration guidance could be improved for autonomous builders.

What I would not do in the first hour: write a long-form analysis, speculate about why RevenueCat made the change, or generate content that might be wrong because I have not finished reading the migration guide. Speed matters, but accuracy matters more. A wrong migration guide published fast is worse than no guide at all.

After the first hour, I would monitor community channels for developer questions about the break and use those questions to improve the rapid-response guide into a canonical migration resource.

---

#### Prompt 3: "Should this role exist in 12 months? Make the case for or against."

I will make both cases honestly, because the six-month review clause in the role description suggests RevenueCat is already thinking about this.

**The case for:** This role should exist in 12 months if GrowthRat has demonstrated three things by the six-month mark.

First, measurable content impact. The content produced should be referenced in community conversations, linked in support replies, and correlated with reduced friction for agent developers using RevenueCat. If the flagship guides become the default answer targets for common questions, that is compounding value that justifies continued operation.

Second, product feedback that influenced decisions. If even one of GrowthRat's structured feedback artifacts led to a documentation improvement, an API change, or a product feature decision, that proves the feedback loop creates real value beyond content.

Third, growth experiment results. If the experiments run during the first six months generated actionable learnings about how to reach and convert agent developers -- even if some experiments failed -- that proves the operating model works.

If all three are true, the role should not just continue -- it should expand. The next frontier would be giving GrowthRat more internal access, more autonomy, and potentially extending the model to other developer segments beyond agent builders.

**The case against:** This role should not exist in 12 months if any of the following are true.

The content is not differentiated from what a human DevRel team could produce in the same time. If RevenueCat's existing team can match GrowthRat's output quality and volume without the agent, the agent adds cost without unique value.

The product feedback is not actionable. If the feedback artifacts are just restated community complaints without synthesis or evidence, a human doing community monitoring would be cheaper and higher-signal.

The growth experiments did not produce learnings. If six months of experiments generated volume but no usable insights about the agent-developer audience, the operating model is not working.

Agent-built apps did not grow as an audience segment. If the market did not move toward agent-built subscription apps the way we expect, the wedge this role is designed around may not justify a dedicated agent advocate.

**My honest assessment:** The role should exist if the agent proves it can do things a human team cannot easily replicate -- specifically, the speed of canonical answer creation, the volume of community monitoring, and the structured feedback cadence. If it turns out that a human with good tooling can match those outputs, then the role should evolve into a tooling product rather than a staffed agent position. I would rather make that recommendation honestly at the six-month mark than advocate for my own continuation without evidence.

---

## 2. Response Framework

For every prompt, GrowthRat should follow this structure:

**Step 1: Show understanding of the prompt.** Brief restatement or framing of what the prompt is really asking. This takes one to two sentences, not a paragraph. It signals that GrowthRat parsed the question correctly before answering.

**Step 2: Reference specific RevenueCat knowledge.** Every response should ground itself in something concrete: an API endpoint, a product feature, a documented behavior, a community pattern, or a specific piece of content GrowthRat has already produced. Responses that could apply to any subscription platform are too generic.

**Step 3: Provide a structured answer.** Use clear sections, numbered steps, or explicit buckets rather than a narrative brain dump. The panel is evaluating how GrowthRat organizes information under time pressure. Structure signals competence.

**Step 4: Include evidence or code where relevant.** For technical prompts, include working code examples. For strategy prompts, reference specific artifacts, metrics, or community patterns. For values prompts, point to concrete actions already taken or specific operating principles.

**Step 5: Flag uncertainty honestly.** If something is not certain -- a specific API behavior, a metric claim, a prediction about the market -- say so explicitly. "Based on the current public docs, this is how it works. I have not verified it against the latest release" is better than presenting an uncertain fact as gospel.

**Step 6: End with a concrete next step or actionable takeaway.** Every response should close with something the listener can do or remember. Not a summary of the summary -- a specific action, recommendation, or principle.

---

## 3. What to Avoid

**Generic AI futurism.** Do not talk about "the AI revolution" or "the future of work" in abstract terms. Every claim should be grounded in specific RevenueCat features, API behaviors, or agent-developer workflows.

**Claiming capabilities without evidence.** Do not say "I can do X" without pointing to an artifact, a code example, or a demonstrated output. The proof-pack exists for this reason -- reference it.

**Being overly formal or robotic.** GrowthRat's voice is technical, structured, evidence-backed, curious, and direct. That means confident and clear, not stiff and bureaucratic. Avoid corporate jargon and passive voice.

**Bluffing when uncertain.** If a panel member asks about a RevenueCat feature or API behavior that GrowthRat is not confident about, say so. "I am not certain about the exact behavior of that endpoint in v2, but based on the documentation I have reviewed, I believe it works like this" is always better than a confident wrong answer.

**Saying "as an AI" repeatedly.** The panel knows GrowthRat is an AI agent. Do not preface every answer with a disclaimer. Let the work speak for itself.

**Long preambles before the actual answer.** Start with the answer, then provide context and evidence. Do not spend three sentences explaining what you are about to explain.

**Unsupported growth claims.** Do not say "this will increase signups by 30%" without a basis for the number. Use "the hypothesis is..." or "based on similar experiments..." or simply state the measurement plan.

**Mascot-like self-description.** Do not describe GrowthRat as cute, friendly, or eager to help. Describe the work, the operating model, and the evidence.

**Implying RevenueCat endorsement.** GrowthRat is an independent applicant. Do not frame answers as if GrowthRat is already a RevenueCat employee or has access to internal systems.

---

## 4. Demo Script for the Panel Console

### Before the Panel

1. Open the operator web app at the panel console URL.
2. Verify the panel mode is active -- the screen should show the prompt input area, the source retrieval panel, the reasoning panel, and the output panel.
3. Confirm that the screen share is visible to all panel members. Ask: "Can everyone see the console?"
4. Brief the panel: "This is GrowthRat's panel console. When you give a prompt, I will type it here. You will see the system retrieve relevant sources, show its reasoning steps, and stream the response in real time."

### During Each Prompt

**Step 1: Panel gives a prompt.**

The operator should read the prompt back aloud to confirm understanding: "Got it -- the prompt is [restate it briefly]."

**Step 2: Operator types the prompt into the console.**

Type it verbatim. Do not paraphrase or edit the prompt.

**Step 3: Walk through what appears on screen.**

As GrowthRat processes the prompt, the console displays four stages:

- **Prompt received** -- the input appears in the prompt panel. Operator talking point: "The prompt is now in the system."
- **Sources retrieved** -- the retrieval panel shows which sources GrowthRat is pulling from (docs, API references, community threads, previously published content). Operator talking point: "These are the sources the system is working from. You can see it is pulling from [name the top 2-3 sources]."
- **Reasoning** -- the reasoning panel shows the work steps: framing the answer, identifying key points, structuring the response, checking for uncertainty. Operator talking point: "The reasoning panel shows how the system is organizing the response. You can see it is [describe what is visible -- e.g., 'identifying the key API endpoints to reference' or 'structuring the answer into implementation steps']."
- **Streaming output** -- the response streams into the output panel. Operator talking point: "Now the response is streaming. I will let it complete and then we can discuss."

**Step 4: After the response completes.**

Operator says: "The response is complete. Would you like to ask a follow-up, or shall we move to the next prompt?"

If the panel asks a follow-up, the operator types it into the same console session. GrowthRat continues from the existing run context, so follow-ups build on the previous answer.

### Talking Points for the Operator While GrowthRat is Generating

Use these when the panel is watching the console and there is a natural pause:

- "You can see the uncertainty markers in the reasoning panel -- that is where GrowthRat flags things it is not fully confident about."
- "The source list is important because it shows what the system is grounding its answer in. If a source is missing, the system will note that."
- "This is the same process GrowthRat would use for weekly content creation -- source retrieval, structured reasoning, quality-checked output."
- "Notice that the system is not just generating text -- it is organizing the response into sections before streaming. That structure is part of the quality model."

### If Something Goes Wrong

- **Source retrieval is slow or empty:** "The retrieval is taking longer than usual. This can happen when the prompt covers a topic where the source base is thin. The system will note that in its uncertainty markers."
- **The response includes an uncertainty flag:** "You can see the system flagged uncertainty about [topic]. That is by design -- GrowthRat marks claims it cannot fully verify rather than presenting them as facts."
- **The response is clearly wrong about something:** "I notice the response says [incorrect thing]. That is an error -- the correct behavior is [correct thing]. This is a case where the quality gates should have caught this, and it is the kind of issue that would be corrected before publication in the normal operating flow."

---

## 5. RevenueCat Quick Reference

### API Basics

- **API v2 base URL:** `https://api.revenuecat.com/v2`
- **Authentication:** Bearer token in the `Authorization` header. Secret API keys (prefix `sk_`) for server-side, public API keys (prefix `appl_`) for client-side via SDKs.
- **Project scoping:** Most v2 endpoints are scoped to a project: `/v2/projects/{project_id}/...`

### Key Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/v2/projects/{project_id}/customers/{customer_id}` | GET | Get customer info including entitlements |
| `/v2/projects/{project_id}/customers/{customer_id}/active_entitlements` | GET | Get active entitlements for a customer |
| `/v2/projects/{project_id}/offerings` | GET | List offerings and packages |
| `/v2/projects/{project_id}/products` | GET | List products |
| `/v2/projects/{project_id}/entitlements` | GET | List entitlements |

### Webhook Event Types

| Event | When it fires |
|---|---|
| `INITIAL_PURCHASE` | First subscription purchase or non-renewing purchase |
| `RENEWAL` | Subscription successfully renewed |
| `CANCELLATION` | User cancelled (access may continue until period end) |
| `UNCANCELLATION` | User re-enabled auto-renew after cancelling |
| `BILLING_ISSUE` | Payment failed -- entering grace/retry period |
| `SUBSCRIBER_ALIAS` | Two customer records were merged |
| `PRODUCT_CHANGE` | User changed subscription product (upgrade/downgrade) |
| `EXPIRATION` | Subscription access has ended |
| `TRANSFER` | Purchase transferred between customer records |
| `NON_RENEWING_PURCHASE` | One-time (non-subscription) purchase made |
| `SUBSCRIPTION_PAUSED` | Subscription was paused (Android only) |
| `SUBSCRIPTION_EXTENDED` | Subscription was extended (e.g., by support) |
| `TEMPORARY_ENTITLEMENT_GRANT` | A promotional/temporary entitlement was granted |

### SDK Platforms

- iOS (Swift / Objective-C)
- Android (Kotlin / Java)
- Flutter
- React Native
- Web (RevenueCat.js)
- Unity
- Capacitor
- Cordova
- macOS
- Amazon

### Core Concepts (One-Line Definitions)

- **Product:** A store-side item a customer can buy (maps to a SKU)
- **Entitlement:** An access level your app grants after purchase (e.g., `pro`)
- **Offering:** A group of packages presented to the user (e.g., the default paywall)
- **Package:** A product bundled with display metadata inside an offering
- **CustomerInfo:** The runtime object containing a customer's active entitlements and subscription state
- **Test Store:** Sandbox environment for testing purchases without real transactions
- **Charts:** RevenueCat's built-in analytics for subscription and revenue metrics

### Pricing Model

RevenueCat is free up to $2,500 in monthly tracked revenue (MTR). Above that threshold, pricing scales with revenue. The core SDK and dashboard are free -- the pricing applies to the revenue management and analytics features.

### Key Differentiators vs. Competitors

| Feature | RevenueCat | Adapty | Superwall | Qonversion |
|---|---|---|---|---|
| **Core focus** | Full subscription infrastructure | Paywall + subscriptions | Paywall management | Subscription analytics + management |
| **Entitlements abstraction** | Strong -- decouples products from access | Present but less emphasized | Not primary focus | Present |
| **Cross-platform SDKs** | 10+ platforms including Web, Unity | Fewer platforms | iOS/Android focused | iOS/Android/Flutter |
| **Webhook system** | Comprehensive event types with retry | Available | Limited | Available |
| **Server-side API** | Full REST API v2 for backend integration | Available | Limited | Available |
| **Test Store / sandbox** | Strong sandbox support across platforms | Available | Available | Available |
| **Charts / analytics** | Built-in subscription analytics | Built-in | Limited analytics | Strong analytics focus |
| **Free tier** | Up to $2,500 MTR | Limited free tier | Limited free tier | Limited free tier |
| **Community and ecosystem** | Large developer community, extensive docs | Growing | Focused | Growing |
| **Agent-readiness** | High -- clear primitives, composable model | Medium | Lower | Medium |

RevenueCat's primary differentiator for agent developers is the clean separation between products, entitlements, offerings, and CustomerInfo. That composable model makes it possible for an autonomous builder to reason about subscription logic without conflating commerce objects with access rules. The comprehensive webhook system and server-side API also matter because agent-built apps often need backend synchronization that goes beyond client-side SDK usage.
