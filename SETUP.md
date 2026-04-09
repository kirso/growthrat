# GrowthRat Setup & Testing Guide

## Quick Start

```bash
bun install
cp .env.example .env.local
bunx convex dev
bun run dev
```

Open `http://localhost:3000`.

## Required local environment

Minimum auth + app shell config:

```bash
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_CONVEX_SITE_URL=...
SITE_URL=http://localhost:3000
RC_ADMIN_EMAILS=you@example.com
# or
RC_ADMIN_DOMAINS=example.com
```

Core runtime providers:

```bash
ANTHROPIC_API_KEY=...
VOYAGE_API_KEY=...
DATAFORSEO_LOGIN=...
DATAFORSEO_PASSWORD=...
SLACK_BOT_TOKEN=...
SLACK_SIGNING_SECRET=...
GITHUB_TOKEN=...
TYPEFULLY_API_KEY=...
TYPEFULLY_SOCIAL_SET_ID=...
```

## Local development flow

Terminal 1:
```bash
bunx convex dev
```

Terminal 2:
```bash
bun run dev
```

Convex handles the database, codegen, workflows, and HTTP actions. Inngest is no longer part of the runtime.

## Authenticated activation flow

1. Visit `/sign-in`
2. Create or sign into an allowlisted account
3. Open `/onboarding`
4. Submit connector credentials
5. Confirm connector state:
   - `verified`
   - `manual_verification`
   - `pending`
   - `error`

## Smoke tests

### Public evaluation
- `/`
- `/application`
- `/proof-pack`
- `/articles`
- `/readiness-review`
- `/operator-replay`

### Authenticated operator surfaces
- `/onboarding`
- `/dashboard`
- `/go-live`
- `/pipeline`
- `/experiments`
- `/feedback`
- `/report`

### Security checks
- unauthenticated user is redirected away from `/onboarding` and operator pages
- unauthenticated access to `/api/onboarding/secrets` returns 401/403
- public chat works, but chat history does not persist across reloads

## Production notes

- Better Auth requires `SITE_URL` in both Next.js and Convex environments.
- Operator access requires `RC_ADMIN_EMAILS` and/or `RC_ADMIN_DOMAINS` in both Next.js and Convex environments.
- After changing Vercel environment variables, redeploy:

```bash
bunx vercel deploy --prod
```
