# Contributing to Mirrorverse

Thanks for your interest in contributing. This guide covers how to set up the project, the rules we follow, and how to get a change merged. By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md), and your contributions are licensed under the [MIT License](LICENSE).

## Getting started

### Prerequisites

- Node.js 20 or newer
- pnpm 10 (the repo pins `pnpm@10.27.0`; enable it with `corepack enable`)
- A Postgres database with pgvector (Supabase works)
- A Supabase project for auth

### Setup

```bash
git clone https://github.com/carrington-115/mirrorverse-for-agents.git
cd mirrorverse-for-agents
pnpm install
```

Copy the example env files and fill them in:

```bash
cp apps/app/.env.example apps/app/.env.local
cp apps/backend/.env.example apps/backend/.env.development
cp apps/marketing/.env.example apps/marketing/.env.local
```

Only a few variables are required to boot the backend (`DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `ANTHROPIC_API_KEY`). Other features, such as Stripe, Slack, voice and Composio, turn on when their keys are present. Never commit real secrets.

Then start everything:

```bash
pnpm dev            # app :3000, backend :3001, marketing :3002
pnpm dev:inngest    # in a second terminal: local Inngest dev server for workflow runs
```

For a single workspace use `pnpm dev:app`, `pnpm dev:backend` or `pnpm dev:marketing`.

### Repository layout

```
apps/app        Product app (Next.js, Supabase Auth)
apps/backend    Backend (Next.js route handlers, tRPC, Inngest)
apps/marketing  Marketing site
packages/       agent, db, env, types, ui, eslint-config, typescript-config
```

## Workflow

1. Open an issue first for anything larger than a small fix, so we can agree on the approach.
2. Fork the repo and create a branch from `main`. Name it by type: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, `chore/<topic>`.
3. Make your change, with tests where it makes sense.
4. Run the checks below.
5. Open a pull request against `main` and fill in the template.

## Before you open a PR

Run these from the repo root. CI runs the same checks and all of them must pass.

```bash
pnpm lint:fix
pnpm format
pnpm typecheck
pnpm test
pnpm build
```

A Husky pre-commit hook runs lint-staged (Prettier and ESLint with `--fix`) and `pnpm typecheck`. If a commit is blocked, fix the underlying problem. Do not bypass the hook with `--no-verify`.

## Commit messages

- Short, imperative subject line, for example `Fix webhook secret rotation on reactivation`.
- Add a body only when the why is not obvious.
- Do not add `Co-Authored-By` lines, "Generated with" lines or any other tool attribution trailers to commits or PR descriptions.
- Keep each commit focused. Do not mix refactors with behavior changes.

## Code standards

### Files and naming

- All `.ts`, `.tsx`, `.js` and `.jsx` filenames are **kebab-case** (`dashboard-card.tsx`, `use-chat-stream.ts`). ESLint enforces this. React components stay PascalCase inside the file. Next.js dynamic segments such as `[id].tsx` are the exception.
- Import files using their exact on-disk name.

### TypeScript

- `strict` is on. Do not weaken any tsconfig option to silence an error; fix the code.
- No `any`. Use `unknown` and narrow it, or write a proper type.
- No `// @ts-ignore` or `// @ts-expect-error`. If a third-party type is wrong, use `as unknown as T` with a one-line comment explaining why.
- Prefix intentionally unused parameters and variables with `_`.
- Re-export types with `export type { Foo }`.
- Every code path of a non-void function must return.
- Do not duplicate compiler options that a shared preset already sets. Consumer tsconfigs only add `extends`, `paths`, `include` and `exclude`.

### ESLint and formatting

- `pnpm lint` runs with `--max-warnings 0`. A rule is either an error or off.
- List all hook dependencies. Do not paper over a loop with `eslint-disable`.
- Use `&apos;` and `&quot;` for quotes in JSX text.
- Tailwind v4: use `text-(--token)` for color variables and `text-(length:--token)` for sizes. Never apply two classes that set the same CSS property.

### Environment variables

Never read `process.env` directly in app code. Import from the typed env package:

```ts
import { env } from "@mirrorverse/env/app"; // apps/app
import { env } from "@mirrorverse/env/backend"; // apps/backend
import { env } from "@mirrorverse/env/marketing"; // apps/marketing
```

To add a variable, edit the schema in `packages/env/src/`, add it to the consuming app's `.env.example`, and add it to `turbo.json` if it affects build output.

### apps/app architecture

Code is organized by feature, not by route concern:

- `src/app/` is routing only. A `page.tsx` or `layout.tsx` re-exports from `@/features/<domain>/...`. No business logic and no `_components/` folders there.
- Feature code lives in `src/features/<domain>/` with `api/`, `components/`, `pages/`, `actions/`, `hooks/`, `schemas/` and `lib/` as needed.
- Use the shared `authedClient` or `apiClient` from `@/lib/http/client`, never raw `fetch()`.
- Reads are `useXxxQuery` hooks and writes are `useXxxMutation` hooks. Add query keys to `@/lib/query/keys.ts`.
- Every page exports `metadata` built with `buildMetadata()`. Authenticated pages set `noIndex: true`.
- Server actions go in `features/<domain>/actions/`, one per file, starting with `"use server"`.
- When you add a top-level route, update `src/proxy.ts`, `app/robots.ts` and, if it is public, `app/sitemap.ts`.

### UI components

shadcn components live in `packages/ui` only:

```bash
pnpm --filter @mirrorverse/ui ui:add <component>
```

### Database changes

- Change the schema in `packages/db/src/schema/`, then run `pnpm db:generate` to produce the migration.
- Commit the generated SQL and the matching `meta/_journal.json` entry together. Do not hand-write migration files or edit the journal by hand.
- Apply migrations to a local or staging database before opening the PR, and say in the PR whether the migration is safe to run on live data.
- Tenant-scoped tables must keep their row-level security policies. See `packages/db/README.md`.

### Tests

- Tests are co-located as `*.test.ts` or `*.test.tsx`. The app, ui and env packages use Vitest, and the backend uses Vitest too.
- New behavior should come with tests, especially anything touching billing, plan limits, auth or the workflow runtime.
- Do not call real third-party services in tests. Mock them.

### Turbo

If you add or rename a task, update `turbo.json` with `dependsOn`, `inputs` and `outputs`. Do not run scripts that bypass Turbo caching.

## Pull request checklist

- [ ] The change is focused and linked to an issue where one exists
- [ ] `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass
- [ ] New code has tests, or the PR explains why not
- [ ] No secrets, `.env` files or generated artifacts are committed
- [ ] Docs and `.env.example` files are updated when behavior or config changes
- [ ] Migrations, if any, are generated and called out in the description
- [ ] The commit messages follow the rules above

## Reporting bugs and security issues

Use the issue templates for bugs and feature requests. For security vulnerabilities do **not** open a public issue; follow [SECURITY.md](SECURITY.md).

## Review

A maintainer will review your PR. Expect feedback; please respond or push fixes in new commits and we will squash on merge where it keeps history clean. Stale PRs with no response for 30 days may be closed.
