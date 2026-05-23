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

## Multi-tenancy (Row-Level Security)

Tenant isolation is enforced in two layers (issue #31):

1. **Application layer** — every workspace-scoped query filters by `workspace_id`.
2. **Database layer (defense in depth)** — Postgres RLS policies so that even a
   query that forgot the filter sees only the active tenant's rows.

### Two connection roles

| Connection         | Env                    | Role               | RLS      | Used by                                                         |
| ------------------ | ---------------------- | ------------------ | -------- | --------------------------------------------------------------- |
| Privileged / admin | `DATABASE_URL`         | service/`postgres` | bypassed | migrations, scripts, the workspace bootstrap, `withServiceRole` |
| Runtime            | `RUNTIME_DATABASE_URL` | `app_user`         | enforced | every per-request query, via `withTenantContext`                |

`getDb()` returns the admin connection; `getRuntimeDb()` returns the runtime
one. If `RUNTIME_DATABASE_URL` is unset it falls back to `DATABASE_URL` (RLS
inert) with a warning — fine for local dev before the role exists.

### The GUC and the helpers

Policies gate on `current_setting('app.current_workspace', true)`, a per-request
GUC. Set it through the helpers in `src/runtime.ts`:

- **`withTenantContext(workspaceId, fn)`** — opens a transaction on the runtime
  connection, runs `SET LOCAL app.current_workspace = <id>` (parameterized), and
  passes the transaction handle as `db`. `tRPC`'s `workspaceProc` wraps every
  resolver in this, so services keep using `ctx.db` unchanged.
- **`withServiceRole({ reason }, fn)`** — escape hatch for genuine cross-tenant
  work on the admin connection; writes an `audit_log` row per call.

`getRuntimeDb` must never be queried directly (an unset GUC means **zero rows**,
fail-closed) — an ESLint rule in `apps/backend` forbids importing it.

### Policies

Declared in the schema via `pgPolicy` (see `src/schema/rls.ts`), so `db:push`
applies them. Three shapes:

- **`tenantPolicy`** — `workspace_id = <guc>` for tables with a NOT NULL `workspace_id`.
- **`tenantOrGlobalPolicy`** — adds `OR workspace_id IS NULL` so global/built-in
  rows (`mcp_servers`, `agent_skills`) stay readable; writes still require a match.
- **`transitivePolicy`** — an `EXISTS` against the parent for tables with no
  `workspace_id` of their own (`messages`, `chat_events`, `agent_skill_versions`,
  `agent_skill_attachments`, `knowledge_chunks`).

### Provisioning `app_user`

`db:push` can't create roles. Once per environment, on a privileged connection:

```bash
pnpm --filter @mirrorverse/db exec node scripts/apply-sql.mjs sql/app_user.sql
# then enable login out of band (keep the secret out of git):
#   ALTER ROLE app_user WITH LOGIN PASSWORD '<generated>';
# and point RUNTIME_DATABASE_URL at it.
```

### Known limitations (app-layer only, for now)

- **`workspaces` / `user_profiles`** are not under RLS (they're read by the
  pre-tenant bootstrap, and protecting `user_profiles` needs a user-identity
  GUC). They remain application-enforced. Follow-up: an id-based policy on
  `workspaces`.
- **`apps/backend/api/chat.ts` (streaming) and Inngest jobs** run on the
  privileged connection by design — long-lived streaming / multi-step jobs
  can't sit inside one request-scoped transaction. They pre-resolve the
  workspace and filter explicitly.

### Testing isolation

`test/rls.integration.test.ts` spins up a throwaway Postgres (Testcontainers),
applies a representative slice of the schema + policies, and proves tenant A
can't SELECT/UPDATE/DELETE/INSERT across into tenant B. It needs Docker, so it
only runs when gated:

```bash
RUN_RLS_IT=1 pnpm --filter @mirrorverse/db test
```

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
