# RevenueCat Knowledge Base for GrowthRat

Quick-reference knowledge that powers panel console responses and content generation.

## RevenueCat Core Facts

- Founded: 2017, YC S18 batch
- Processes: $10B+ annual purchase volume
- Market share: >40% of newly shipped subscription apps
- Team: 120+, remote-first, 25 countries
- Values: Customer Obsession, Always Be Shipping, Own It, Balance

## REST API v2

- Base URL: `https://api.revenuecat.com`
- Auth: `Authorization: Bearer YOUR_API_KEY`
- Rate limit: 480 requests/minute per domain

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v2/projects/{id}/customers/{customer_id}` | GET | Customer info + active entitlements |
| `/v2/projects/{id}/products` | GET | Product listing (subscription, one-time) |
| `/v2/projects/{id}/offerings` | GET | Offering configurations |
| `/v2/projects/{id}/offerings/{id}/packages` | GET | Packages within an offering |
| `/v2/projects/{id}/entitlements/{id}/products` | GET | Products for an entitlement |

### Customer Object Key Fields
- `subscriber.subscriptions` — active subscription objects with product_id, purchase_date, expiration_date
- `subscriber.entitlements` — active entitlements with product_identifier, purchase_date, expiration_date
- `subscriber.non_subscriptions` — one-time purchases
- `subscriber.first_seen` — first SDK contact timestamp
- `subscriber.original_app_user_id` — canonical user ID

## Webhook Events

Events sent via POST to registered webhook URLs.

| Event Type | When |
|-----------|------|
| `INITIAL_PURCHASE` | First purchase of a product |
| `RENEWAL` | Subscription renewed |
| `CANCELLATION` | Subscription cancelled |
| `UNCANCELLATION` | Cancellation reversed |
| `BILLING_ISSUE` | Payment failed |
| `SUBSCRIBER_ALIAS` | User IDs merged |
| `SUBSCRIPTION_PAUSED` | Subscription paused (Android) |
| `PRODUCT_CHANGE` | User changed subscription product |
| `EXPIRATION` | Subscription expired |
| `TRANSFER` | Subscription transferred between users |
| `SUBSCRIPTION_EXTENDED` | Subscription extended |
| `TEMPORARY_ENTITLEMENT_GRANT` | Temporary access granted |

### Webhook Payload Structure
```json
{
  "api_version": "1.0",
  "event": {
    "type": "INITIAL_PURCHASE",
    "app_user_id": "user123",
    "product_id": "monthly_premium",
    "price": 9.99,
    "currency": "USD",
    "store": "APP_STORE",
    "environment": "PRODUCTION",
    "entitlement_ids": ["premium"],
    "period_type": "NORMAL",
    "purchased_at_ms": 1691121853000,
    "expiration_at_ms": 1693726653000
  }
}
```

## SDKs

| Platform | Package | Min Version |
|----------|---------|-------------|
| iOS | `RevenueCat/purchases-ios` | iOS 13+ |
| Android | `com.revenuecat.purchases` | Android 5.0+ |
| Flutter | `purchases_flutter` | Flutter 3.0+ |
| React Native | `react-native-purchases` | RN 0.64+ |
| Web | `@revenuecat/purchases-js` | Modern browsers |
| Unity | `com.revenuecat.purchases-unity` | Unity 2021+ |
| KMP | Kotlin Multiplatform support | |

## Key Concepts

### Offerings
- A collection of Packages that are presented to users
- Can be A/B tested by showing different offerings to different users
- Configured in the RC dashboard, retrieved via API

### Entitlements
- The "access" a user has to premium features
- Mapped to products — when user buys a product, they get the entitlement
- Checked via `subscriber.entitlements` in customer object

### CustomerInfo
- The central object representing a user's subscription state
- Contains: subscriptions, entitlements, non_subscriptions, first_seen, management_url

### Products
- Configured in app stores (App Store, Play Store)
- Mapped to entitlements in RevenueCat
- Types: subscription, consumable, non-consumable

## Competitors

| Competitor | Key Difference |
|-----------|---------------|
| **Adapty** | More focused on paywall A/B testing, smaller market share |
| **Superwall** | Specialized in paywall UI/presentation, not full subscription management |
| **Qonversion** | Similar feature set, smaller community |
| **DIY** | Building your own subscription backend — complex, error-prone, hard to maintain |

## RevenueCat's Strengths for Agent Builders

1. **REST API is agent-friendly** — Bearer auth, JSON responses, consistent pagination
2. **Offerings model is flexible** — configure monetization without native code
3. **Webhook events are comprehensive** — full lifecycle coverage
4. **Cross-platform** — one API for iOS + Android + Web + Flutter + React Native
5. **Receipt validation handled** — no need to implement Apple/Google receipt verification

## RevenueCat's Gaps for Agent Builders

1. **No API-first quickstart** — docs assume IDE + simulator workflow
2. **Charts is dashboard-only** — no REST API for MRR, churn, trial conversion
3. **Webhook testing is manual** — no CLI or API to trigger test events
4. **No agent-specific error messages** — errors assume human developer context
5. **Project creation requires dashboard** — can't create projects via API

## DataForSEO Keyword Intelligence

Target keywords with difficulty scores (retrieved 2026-03-16):

| Keyword | Difficulty | Search Intent |
|---------|-----------|---------------|
| revenuecat react native | 2 | Informational |
| revenuecat flutter | 3 | Informational |
| revenuecat api | 13 | Informational |
| revenuecat pricing | 14 | Commercial |
| mobile app monetization | 30 | Informational |
| in-app purchase api | 37 | Informational |
| subscription management api | 50 | Informational |

## GrowthRat Architecture

- **Next.js 15** — single framework for UI, API, SSE, static pages
- **Inngest AgentKit** — 5-agent network (planner, content, growth, feedback, community)
- **Convex** — reactive database + cron + file storage + vector search
- **Vercel AI SDK** — LLM streaming with Anthropic Claude
- **Typefully** — multi-platform social distribution (X, LinkedIn, Threads, Bluesky, Mastodon)
- **DataForSEO** — keyword research, SERP analysis, content trends

## Quality Gates

Every flagship content piece passes 8 gates:
1. Grounding — claims are source-backed
2. Novelty — not duplicating existing content
3. Technical — code works, API refs correct
4. SEO — title, meta, headings, keywords
5. AEO — extractable answers for LLMs
6. GEO — comparison tables, schema markup
7. Benchmark — stronger than obvious alternative
8. Voice — matches GrowthRat identity
