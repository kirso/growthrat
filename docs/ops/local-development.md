# Local Development

## Recommended topology

Use a hybrid local stack:

- run Postgres and Temporal in Docker
- run the FastAPI API on the host
- run the Temporal worker on the host
- run the operator web app on the host with bun

This keeps iteration fast while still testing the important service boundaries.

## Bootstrap

1. Copy envs: `cp .env.example .env`
2. Start infra: `docker compose up -d postgres temporal temporal-ui`
3. Install Python deps: `uv sync`
4. Install operator-web deps: `cd apps/operator-web && bun install`

## Run services

1. API: `uv run uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000`
2. Worker: `uv run python -m src.workers.temporal_worker`
3. Operator UI: `cd apps/operator-web && bun run dev`

## Local smoke checks

1. API health: `curl http://localhost:8000/healthz`
2. API config summary: `curl http://localhost:8000/internal/config-summary`
3. Operator UI health: `curl http://localhost:3000/api/health`
4. Temporal UI: open `http://localhost:8088`
5. Operator screens: open `/`, `/integrations`, `/assets`, `/scope-review`, `/audits`, `/reports`, `/panel`, `/founder`, `/settings/kill-switch`

## What this proves

- config loading works locally
- API boots cleanly
- worker can connect to local Temporal
- operator UI routes render locally
- service boundaries match the plan and blueprint before hosted deployment
