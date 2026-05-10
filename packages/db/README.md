# @mirrorverse/db

Drizzle schema and Postgres client for Mirrorverse. Schema files mirror the
domains in `@mirrorverse/types` — tenancy, workflows, runs, chats, skills,
tools — and `$type<T>()` ties every `jsonb` column to an interface there.

## Layout

```
src/
├── client.ts                  connectToDatabase(url) → Drizzle instance
├── index.ts                   re-exports client + schema
└── schema/
    ├── tenancy.schema.ts      workspaces, members, user_profiles, api_keys, invitations
    ├── workflows.schema.ts    workflows, workflow_versions
    ├── runs.schema.ts         workflow_runs, workflow_run_steps
    ├── chats.schema.ts        chats, messages, chat_events
    ├── skills.schema.ts       agent_skills, agent_skill_versions, agent_skill_attachments
    ├── tools.schema.ts        mcp_servers, connections, connection_requests
    └── index.ts               aggregates the above
```

## Workflow

| Command                                     | Purpose                                                                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @mirrorverse/db db:push`     | Apply schema changes to the dev DB. **Run from an interactive terminal** — drizzle-kit prompts for confirmation on destructive diffs. |
| `pnpm --filter @mirrorverse/db db:generate` | Produce a migration SQL file under `drizzle/`. Also requires a TTY.                                                                   |
| `pnpm --filter @mirrorverse/db db:migrate`  | Apply pending migration files in order. Non-interactive; safe for CI.                                                                 |
| `pnpm --filter @mirrorverse/db db:studio`   | Open Drizzle Studio (browser GUI).                                                                                                    |
| `pnpm --filter @mirrorverse/db db:verify`   | List public-schema tables, FK count, index count. Good post-migration sanity check.                                                   |

## DATABASE_URL

`drizzle.config.ts` reads `DATABASE_URL` from `apps/backend/.env.development`.
Use the **session pooler** (port `5432`), **not** the transaction pooler
(`6543`) — the latter rejects the prepared statements drizzle-kit uses
during introspection.

## Multi-tenancy

Every domain table carries `workspace_id` and cascades on workspace delete.
Tenancy is enforced at the application layer (every Drizzle query goes
through a workspace-scoped data-access function). Row-Level Security can be
layered on later if needed — see `CLAUDE.md` for the rationale.

## Conventions

- `id` is `text` populated by `gen_random_uuid()::text` so the column type
  matches the branded `Id<T>` types in `@mirrorverse/types`.
- `created_at` / `updated_at` are `timestamptz` with `defaultNow()`.
  `updatedAt` uses Drizzle's `$onUpdate(() => new Date())`.
- All `jsonb` columns use `.$type<T>()` for compile-time type safety.
- Indexes follow Supabase's Postgres performance guide: compound indexes
  on common access pairs, partial indexes for "active" / "waiting" filters,
  unique indexes for monotonic sequences (e.g. `(chat_id, sequence)` on
  `chat_events`).

## Reset (dev only)

`scripts/reset-spine.mjs` drops every spine table + the drizzle migration
schema so a fresh push can land cleanly. Refuses to run unless
`MIRRORVERSE_ALLOW_DESTRUCTIVE=1` is set. Never run against production.
