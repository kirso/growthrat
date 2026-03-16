// ---------------------------------------------------------------------------
// RevenueCat REST API v2 connector – native fetch
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.revenuecat.com";

function headers(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

async function get<T = unknown>(
  path: string,
  apiKey: string,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: headers(apiKey),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RevenueCat ${res.status}: ${text.slice(0, 500)}`);
  }

  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export interface Customer {
  id: string;
  [key: string]: unknown;
}

export async function getCustomer(
  projectId: string,
  customerId: string,
  apiKey: string,
): Promise<Customer> {
  return get<Customer>(
    `/v2/projects/${projectId}/customers/${customerId}`,
    apiKey,
  );
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface ProductsResponse {
  items: Record<string, unknown>[];
  next_page?: string;
  [key: string]: unknown;
}

export async function listProducts(
  projectId: string,
  apiKey: string,
): Promise<ProductsResponse> {
  return get<ProductsResponse>(
    `/v2/projects/${projectId}/products`,
    apiKey,
  );
}

// ---------------------------------------------------------------------------
// Offerings
// ---------------------------------------------------------------------------

export interface OfferingsResponse {
  items: Record<string, unknown>[];
  next_page?: string;
  [key: string]: unknown;
}

export async function listOfferings(
  projectId: string,
  apiKey: string,
): Promise<OfferingsResponse> {
  return get<OfferingsResponse>(
    `/v2/projects/${projectId}/offerings`,
    apiKey,
  );
}
