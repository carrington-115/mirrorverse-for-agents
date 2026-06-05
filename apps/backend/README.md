# Mirrorverse Backend

Next.js (App Router) backend serving tRPC over route handlers, with Inngest for durable background jobs. Deployed to Vercel; in dev it runs as a Next.js dev server on port 3001.

## Tech stack

- **Framework**: Next.js 16 (App Router, Node.js runtime)
- **API layer**: tRPC v11 — type-safe RPC, one router per feature domain
- **Database**: Drizzle ORM + Postgres (Supabase)
- **Background jobs**: Inngest v4 — durable step functions, cron, pause/resume
- **AI**: Vercel AI SDK, Anthropic, OpenAI
- **Integrations**: Composio (tools/OAuth), Vapi (voice), Stripe (billing), Twilio, Resend

## Running locally

From the repo root:

```bash
pnpm dev           # all apps + package watchers
pnpm dev:backend   # backend only (port 3001)
```

## Inngest local dev

Inngest functions run against a local dev server that acts as the Inngest cloud.

1. Start the backend first:
   ```bash
   pnpm dev:backend
   ```
2. In a second terminal, start the Inngest dev server:
   ```bash
   pnpm --filter @mirrorverse/backend dev:inngest
   ```
3. Open **http://localhost:8288** — the Inngest Dev UI lists all registered functions and lets you trigger test events, inspect step execution, and replay runs.

> The dev server auto-sets `INNGEST_DEV=true` so no signing key is needed locally.

## Registered Inngest functions

| Function ID              | Trigger                    | Description                                                                            |
| ------------------------ | -------------------------- | -------------------------------------------------------------------------------------- |
| `chat.agent_loop`        | `chat/agent_loop` event    | Durable chat orchestrator with pause/resume for credential interrupts (body: issue #5) |
| `workflow.execute`       | `workflow/execute` event   | Walks a workflow graph step-by-step; concurrency-keyed by `workflowId`                 |
| `workflow.cron-dispatch` | Every minute (`* * * * *`) | Polls DB for due cron workflows and fans out `workflow/execute` events                 |
| `knowledge.ingest`       | `knowledge/ingest` event   | Chunks, embeds, and stores documents (PDF, URL, text, image, file)                     |
| `billing.aggregator`     | Every hour (`0 * * * *`)   | Aggregates usage, upserts period summaries, reports Stripe meter events                |

## Source layout

```
src/
├── api/              Route handler implementations (chat, inngest, speech, trpc, webhooks)
├── features/         Domain modules — each has router, service, repo, inputs
│   ├── billing/
│   ├── chats/
│   ├── inngest/      Inngest client, event types, function factories
│   ├── knowledge/
│   ├── runs/
│   ├── tenancy/
│   ├── tools/
│   ├── voice/
│   ├── webhooks/
│   └── workflows/
│       └── runtime/  Graph walker, interpreters, cron dispatcher
├── lib/              Shared infra (auth, logger, tracing, storage)
├── mcp/              Composio integration
└── trpc/             Router composition, context, middleware
```

## Environment variables

`packages/env/src/backend.ts` is the source of truth for all env vars. Key ones for Inngest:

| Variable                       | Required   | Description                                            |
| ------------------------------ | ---------- | ------------------------------------------------------ |
| `INNGEST_SIGNING_KEY`          | Production | Verifies requests from Inngest cloud                   |
| `INNGEST_EVENT_KEY`            | Production | API key for `inngest.send()` calls                     |
| `INNGEST_SIGNING_KEY_FALLBACK` | Optional   | For key rotation                                       |
| `INNGEST_DEV`                  | Dev (auto) | Set by the dev server; disables signature verification |
