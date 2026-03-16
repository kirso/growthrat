import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

export const queryRevenueCat = createTool({
  name: "query_revenuecat",
  description: "Query RevenueCat REST API v2 for product data (offerings, products, entitlements).",
  parameters: z.object({
    endpoint: z.enum(["products", "offerings", "customer"]).describe("Which API endpoint to query"),
    customerId: z.string().optional().describe("Customer ID (required for customer endpoint)"),
  }),
  handler: async ({ endpoint, customerId }) => {
    const apiKey = process.env.REVENUECAT_API_KEY;
    const projectId = process.env.REVENUECAT_PROJECT_ID;
    if (!apiKey || !projectId) return "dry-run: no RevenueCat credentials configured";

    const base = `https://api.revenuecat.com/v2/projects/${projectId}`;
    let url: string;

    switch (endpoint) {
      case "products":
        url = `${base}/products`;
        break;
      case "offerings":
        url = `${base}/offerings`;
        break;
      case "customer":
        if (!customerId) return "Error: customerId required for customer endpoint";
        url = `${base}/customers/${customerId}`;
        break;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    const data = await res.json();
    return JSON.stringify(data);
  },
});
