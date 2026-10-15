# Mirrorverse

**The platform to broaden collaboration between humans and agents.**

Mirrorverse lets you describe what you want in chat, turns it into a workflow of AI agents and tools, and runs it for you on a schedule, from a webhook, from a Slack mention or over the phone.

[Contributing](CONTRIBUTING.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [Security](SECURITY.md) · [License](LICENSE)

## Features

- **MirrorPilot chat.** A streaming chat agent that plans and builds workflows, provisions phone numbers, and works with your knowledge bases.
- **Workflow editor and runtime.** A visual canvas with trigger, agent, code, HTTP request, transform, tool call, human review and flow-control (branch, loop) nodes. Runs execute durably on Inngest, with a run history and step viewer.
- **Triggers.** Manual, cron and webhook triggers, plus Slack mention replies.
- **Knowledge bases.** Upload documents, ingest them into pgvector, and let agents retrieve from them.
- **Integrations.** Connect third-party apps through Composio, with credentials kept in an encrypted vault.
- **Voice agents.** Phone numbers and call handling through Twilio and Vapi.
- **Code execution.** Sandboxed code nodes through E2B.
- **Billing and usage.** Stripe checkout, credit-based usage metering and plan limits.
- **Multi-tenant.** Workspaces, members, API keys and row-level security in Postgres.

> Some areas are still being built. The deployment flow (pinning a deployed version, rollback), per-workspace Slack and additional channels such as email or embeds are in progress. See the open issues for current status.

## Architecture

```
mirrorverse/
├── apps/
│   ├── app/         Product app (Next.js 16, Supabase Auth, port 3000)
│   ├── backend/     Backend API: tRPC, REST/SSE routes, Inngest functions (port 3001)
│   └── marketing/   Marketing site (Next.js, port 3002)
└── packages/
    ├── agent/              Agent runtime, billing and usage logic, workflow schemas
    ├── db/                 Drizzle schema, migrations, RLS policies
    ├── env/                Typed environment schemas (@t3-oss/env)
    ├── types/              Shared types
    ├── ui/                 shadcn components, theme, hooks
    ├── eslint-config/      Shared ESLint flat configs
    └── typescript-config/  Shared tsconfig presets
```

How a run flows: the app talks to the backend over tRPC and SSE. When a workflow is triggered, the backend sends an event to Inngest, which calls back into `/api/inngest` and walks the workflow graph one durable step at a time, writing run and step records to Postgres.

## Tech stack

- **Frontend:** Next.js 16, React, Tailwind CSS v4, shadcn/ui, TanStack Query
- **Backend:** Next.js route handlers, tRPC, Inngest
- **Data:** Postgres with pgvector, Drizzle ORM, Supabase Auth, Upstash Redis
- **AI and tools:** Anthropic and other model providers via the AI SDK, Composio, E2B, Vapi, Twilio
- **Payments and email:** Stripe, Resend
- **Tooling:** pnpm, Turborepo, TypeScript, ESLint, Prettier, Vitest, Cypress, Husky

## Getting started

Requirements: Node.js 20+, pnpm 10, a Postgres database with pgvector, and a Supabase project.

```bash
git clone https://github.com/carrington-115/mirrorverse-for-agents.git
cd mirrorverse-for-agents
pnpm install

cp apps/app/.env.example apps/app/.env.local
cp apps/backend/.env.example apps/backend/.env.development
cp apps/marketing/.env.example apps/marketing/.env.local
# fill in the values, see below

pnpm db:migrate     # apply database migrations
pnpm dev            # app :3000, backend :3001, marketing :3002
pnpm dev:inngest    # second terminal: local Inngest dev server for workflow runs
```

Workflow runs need the Inngest dev server running locally and `INNGEST_DEV=1` set in the backend env.

### Configuration

Each app documents its variables in its `.env.example`. The backend requires `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` and `ANTHROPIC_API_KEY`. Other features switch on when their keys are set (Stripe, Slack, Vapi/Twilio, Composio, E2B, Resend, Upstash). Env vars are validated through the schemas in `packages/env`, so never read `process.env` directly.

## Commands

Run from the repo root.

| Command                                          | What it does                        |
| ------------------------------------------------ | ----------------------------------- |
| `pnpm dev`                                       | Start all apps and package watchers |
| `pnpm dev:app` / `dev:backend` / `dev:marketing` | Start one app                       |
| `pnpm dev:inngest`                               | Local Inngest dev server            |
| `pnpm build`                                     | Build every workspace               |
| `pnpm lint` / `pnpm lint:fix`                    | ESLint                              |
| `pnpm format` / `pnpm format:check`              | Prettier                            |
| `pnpm typecheck`                                 | `tsc --noEmit` across the workspace |
| `pnpm test` / `pnpm test:coverage`               | Unit tests                          |
| `pnpm e2e`                                       | Cypress end-to-end tests            |
| `pnpm db:generate` / `db:migrate`                | Generate and run Drizzle migrations |
| `pnpm db:studio`                                 | Open Drizzle Studio                 |

## Deployment

The three apps deploy as separate Vercel projects from this one repo, with root directories `apps/app`, `apps/backend` and `apps/marketing` (enable "Include files outside root directory" for the pnpm workspace).

For the backend, set the production env vars, leave `INNGEST_DEV` unset, add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` from Inngest Cloud, then sync the app in Inngest using the path `/api/inngest` (the Inngest Vercel integration can do this on every deploy). Point Stripe, Slack, Vapi and Supabase webhooks at the backend's public URL.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, code standards and the PR checklist, and follow the [Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
