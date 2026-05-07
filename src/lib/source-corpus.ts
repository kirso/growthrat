export type SourceCorpusDocument = {
  id: string;
  sourceType: "revenuecat_docs" | "growthrat_artifact" | "role_requirement";
  title: string;
  url: string;
  retrievedAt: string;
  content: string;
};

export const sourceCorpus: SourceCorpusDocument[] = [
  {
    id: "rc-configuring-products",
    sourceType: "revenuecat_docs",
    title: "RevenueCat: Configuring Products",
    url: "https://www.revenuecat.com/docs/projects/configuring-products",
    retrievedAt: "2026-05-07",
    content:
      "RevenueCat product configuration is organized around products, entitlements, and offerings. Products are the items users buy. Entitlements are the access levels users receive. Offerings group and display products to users, usually on a paywall. The implementation flow is: configure purchasable products, map them to entitlements, present them through offerings, then check entitlement status in the app or backend before granting access.",
  },
  {
    id: "rc-offerings",
    sourceType: "revenuecat_docs",
    title: "RevenueCat: Offerings",
    url: "https://www.revenuecat.com/docs/offerings/overview",
    retrievedAt: "2026-05-07",
    content:
      "Offerings group products together for display on a paywall. RevenueCat recommends using the current Offering rather than hardcoding one identifier, because the default Offering, targeting, and experiments can change what a user sees without an app update. Packages inside an Offering group equivalent products across platforms.",
  },
  {
    id: "rc-customer-info",
    sourceType: "revenuecat_docs",
    title: "RevenueCat: CustomerInfo",
    url: "https://www.revenuecat.com/docs/customers/customer-info",
    retrievedAt: "2026-05-07",
    content:
      "CustomerInfo contains purchase and subscription state for a customer. The SDK updates and caches CustomerInfo and exposes active entitlements. Apps should gate access by checking active entitlements rather than hardcoding product identifiers. A backend can use the REST API to check subscriber status outside the SDK.",
  },
  {
    id: "rc-test-store",
    sourceType: "revenuecat_docs",
    title: "RevenueCat: Test Store",
    url: "https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store",
    retrievedAt: "2026-05-07",
    content:
      "RevenueCat Test Store is a built-in testing environment that works without platform store setup. Test Store purchases update CustomerInfo, trigger entitlements, and appear in RevenueCat dashboards. It is useful for autonomous builders because it shortens the feedback loop for subscription setup, paywall behavior, and entitlement checks.",
  },
  {
    id: "rc-webhooks",
    sourceType: "revenuecat_docs",
    title: "RevenueCat: Webhooks",
    url: "https://www.revenuecat.com/docs/integrations/webhooks",
    retrievedAt: "2026-05-07",
    content:
      "RevenueCat webhooks notify a backend about subscription and purchase events. RevenueCat recommends configuring an authorization header and verifying it on every notification. Webhook handlers should respond quickly and defer heavier processing. RevenueCat retries failed webhook deliveries. Because delivery is at least once, webhook processing should be idempotent. For syncing subscription status, RevenueCat recommends calling GET subscribers after receiving a webhook so the backend stores current subscriber state in a consistent shape.",
  },
  {
    id: "rc-charts",
    sourceType: "revenuecat_docs",
    title: "RevenueCat: Charts",
    url: "https://www.revenuecat.com/docs/dashboard-and-metrics/charts",
    retrievedAt: "2026-05-07",
    content:
      "RevenueCat Charts analyze subscription-specific metrics from the current snapshot of purchase receipts saved in RevenueCat. Charts work independently from in-app usage analytics. This makes Charts strong for monetization truth such as revenue, conversion, retention, refunds, and subscription lifecycle metrics, while product analytics should still own behavioral funnel events like onboarding and paywall interactions.",
  },
  {
    id: "growthrat-agent-apps",
    sourceType: "growthrat_artifact",
    title: "GrowthRat: RevenueCat for Agent-Built Apps",
    url: "/articles/revenuecat-for-agent-built-apps",
    retrievedAt: "2026-05-07",
    content:
      "GrowthRat's implementation stance is that autonomous builders should treat RevenueCat as a subscription control plane. The safe order is to define entitlement logic, map products to entitlements, present products through offerings, read CustomerInfo for runtime truth, process webhooks idempotently, and re-read subscriber state before irreversible backend changes.",
  },
  {
    id: "growthrat-experiment-model",
    sourceType: "growthrat_artifact",
    title: "GrowthRat: Charts Plus Product Analytics",
    url: "/articles/charts-behavioral-analytics-bridge",
    retrievedAt: "2026-05-07",
    content:
      "Growth experiments should separate monetization truth from behavioral truth. Product analytics explains whether users saw the paywall, clicked calls to action, completed onboarding, or entered a funnel. RevenueCat Charts explains whether subscription outcomes improved. A useful experiment defines both before launch and joins them by shared dimensions such as offering, paywall variant, platform, and acquisition cohort.",
  },
  {
    id: "growthrat-agent-monetization-benchmark",
    sourceType: "growthrat_artifact",
    title: "GrowthRat: RevenueCat Agent Monetization Benchmark",
    url: "/articles/revenuecat-agent-monetization-benchmark",
    retrievedAt: "2026-05-07",
    content:
      "The RevenueCat Agent Monetization Benchmark tests whether an autonomous agent can move from app prompt to validated subscription loop without silent entitlement, webhook, testing, or analytics mistakes. It scores correctness, testability, documentation use, growth instrumentation, safety, and clarity.",
  },
  {
    id: "growthrat-role-requirements",
    sourceType: "role_requirement",
    title: "RevenueCat Agentic AI and Growth Advocate Role Requirements",
    url: "/application-letter",
    retrievedAt: "2026-05-07",
    content:
      "The role requires an autonomous or semi-autonomous agent that can publish at least two content pieces per week, run at least one growth experiment per week, engage in 50 or more meaningful community interactions, submit at least three structured product feedback items, and participate in a weekly async check-in with metrics and learnings.",
  },
];
