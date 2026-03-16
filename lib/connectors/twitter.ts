// ---------------------------------------------------------------------------
// X (Twitter) API v2 connector – OAuth 1.0a via Web Crypto API
// ---------------------------------------------------------------------------

const API_BASE = "https://api.twitter.com/2";

export interface TwitterCredentials {
  apiKey: string;
  apiKeySecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

// ---------------------------------------------------------------------------
// OAuth 1.0a signing helpers (Web Crypto / HMAC-SHA1)
// ---------------------------------------------------------------------------

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function nonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function buildAuthHeader(
  method: string,
  url: string,
  bodyParams: Record<string, string>,
  creds: TwitterCredentials,
): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: nonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  };

  // Combine oauth params and body params for signature base
  const allParams = { ...oauthParams, ...bodyParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(creds.apiKeySecret)}&${percentEncode(creds.accessTokenSecret)}`;
  const signature = await hmacSha1(signingKey, baseString);

  oauthParams["oauth_signature"] = signature;

  const header = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${header}`;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function tweetRequest(
  creds: TwitterCredentials,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = `${API_BASE}/tweets`;
  const authHeader = await buildAuthHeader("POST", url, {}, creds);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twitter API ${res.status}: ${text.slice(0, 500)}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

export async function postTweet(
  creds: TwitterCredentials,
  text: string,
): Promise<Record<string, unknown>> {
  return tweetRequest(creds, { text });
}

export async function reply(
  creds: TwitterCredentials,
  tweetId: string,
  text: string,
): Promise<Record<string, unknown>> {
  return tweetRequest(creds, {
    text,
    reply: { in_reply_to_tweet_id: tweetId },
  });
}

export async function quoteTweet(
  creds: TwitterCredentials,
  tweetId: string,
  text: string,
): Promise<Record<string, unknown>> {
  return tweetRequest(creds, { text, quote_tweet_id: tweetId });
}
