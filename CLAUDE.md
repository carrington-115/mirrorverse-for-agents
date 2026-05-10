# CLAUDE.md

Project-level guidance for Claude Code working in this repo.

## Git commit and PR guidelines

- Never append "Co-Authored-By: Claude" or "Generated with Claude Code" or any similar attribution to commit messages or pull request descriptions.
- Keep commit messages concise: a short imperative subject line, and an optional body if needed. No trailers.

## Repository overview

Mirrorverse is a pnpm + Turborepo monorepo.

```
mirrorverse/
├── apps/
│   ├── app/         Main Next.js 16 product app (Supabase Auth, port 3000)
│   ├── marketing/   Marketing landing page (Next.js, port 3002)
│   └── backend/     Express + tRPC backend (port 3001)
├── packages/
│   ├── ui/                shadcn components, theme, cn, hooks
│   ├── db/                Drizzle schema, client, and migrations
│   ├── env/               @t3-oss/env schemas (app / marketing / backend)
│   ├── eslint-config/     Shared flat ESLint configs (base / next / node)
│   └── typescript-config/ Shared tsconfig presets (base / nextjs / react-library / node)
└── turbo.json, pnpm-workspace.yaml, package.json
```

Workspace package names are scoped under `@mirrorverse/*`.

## Commands

Run from the repo root unless otherwise noted.

| Command              | What it does                                                                         |
| -------------------- | ------------------------------------------------------------------------------------ |
| `pnpm install`       | Install all workspace deps                                                           |
| `pnpm dev`           | Start all dev servers (app :3000, backend :3001, marketing :3002) + package watchers |
| `pnpm dev:app`       | Start only `apps/app` (:3000) + package watchers                                     |
| `pnpm dev:marketing` | Start only `apps/marketing` (:3002) + package watchers                               |
| `pnpm dev:backend`   | Start only `apps/backend` (:3001) + package watchers                                 |
| `pnpm build`         | Build every workspace via Turbo                                                      |
| `pnpm lint`          | ESLint across the workspace                                                          |
| `pnpm lint:fix`      | ESLint with `--fix`                                                                  |
| `pnpm format`        | Prettier write across the repo                                                       |
| `pnpm format:check`  | Prettier check (used in CI)                                                          |
| `pnpm typecheck`     | `tsc --noEmit` across the workspace                                                  |
| `pnpm test`          | Run all unit tests                                                                   |
| `pnpm test:coverage` | Tests + 80% coverage gate                                                            |
| `pnpm clean`         | Remove all build/cache output and node_modules                                       |
| `pnpm db:push`       | Push Drizzle schema to the database                                                  |
| `pnpm db:generate`   | Generate Drizzle migration files                                                     |
| `pnpm db:migrate`    | Run pending Drizzle migrations                                                       |
| `pnpm db:studio`     | Open Drizzle Studio (database GUI)                                                   |

Filter to a single workspace with `--filter`, e.g. `pnpm --filter @mirrorverse/app dev`.

## Turbo conventions

`turbo.json` is the source of truth for task graph, caching, and inputs/outputs. **Always update `turbo.json` when adding or renaming a task** — running scripts directly without wiring them in bypasses caching.

- **`build`** depends on upstream `^build`. Cached. Outputs: `.next/**` (excluding cache), `dist/**`. Test files are excluded from inputs so test-only changes don't bust the build cache.
- **`dev`** is `cache: false` and `persistent: true`. Use this for any long-running process.
- **`lint`** depends on `^lint`. Cached. No outputs (pure check).
- **`typecheck`** depends on `^typecheck`. Cached. Outputs `*.tsbuildinfo` for incremental compilation.
- **`test`** depends on `^build` so workspace-package consumers get fresh builds before tests run. Cached. Inputs include vitest/jest configs.
- **`test:coverage`** mirrors `test` but emits `coverage/**`.
- **`format` / `clean`** are `cache: false` (always run).

When adding a new task:

1. Add the script to the relevant `package.json`.
2. Add a matching task entry in root `turbo.json` declaring `dependsOn`, `inputs`, `outputs`.
3. If it produces files, list them in `outputs` so Turbo can cache them.
4. Use `$TURBO_DEFAULT$` in `inputs` to inherit defaults, then add/exclude specifics.

`globalDependencies` in `turbo.json` invalidate every task's cache when changed (root `tsconfig.json`, `.prettierrc`, `.env*`). Add to it sparingly.

`globalEnv` lists env vars that affect every task's cache: `NODE_ENV`, `SKIP_ENV_VALIDATION`, `CI`. Per-task `env` keys add to this list.

## Code standards

### File naming

**All `.ts`, `.tsx`, `.js`, `.jsx` files use kebab-case.** Enforced by `eslint-plugin-unicorn/filename-case` in `packages/eslint-config/base.js`.

- ✅ `dashboard-card.tsx`, `use-chat-stream.ts`, `nav-bar.tsx`
- ❌ `DashboardCard.tsx`, `useChatStream.ts`, `NavBar.tsx`

The exception: Next.js dynamic segment files (`[id].tsx`, `[...slug].tsx`) and root markdown (`README.md`, `CLAUDE.md`).

React component identifiers stay PascalCase — only the **filename** is kebab. So `dashboard-card.tsx` exports `DashboardCard`.

### Git commits

Do not add `Co-Authored-By: Claude` (or any Claude Code attribution) trailers to commit messages. Commit messages should contain only the human-authored subject and body.

### Pre-commit (Husky + lint-staged)

`.husky/pre-commit` runs:

1. `pnpm lint-staged` — Prettier + ESLint (with `--fix`) on staged files.
2. `pnpm typecheck` — full workspace typecheck.

If a commit gets blocked, fix the underlying issue rather than `--no-verify`. The hook is fast because lint-staged only touches staged files; typecheck uses Turbo's cache.

### CI (GitHub Actions)

`.github/workflows/ci.yml` runs `format:check`, `lint`, `typecheck`, `test:coverage`, `build` on push to `main` and on every PR. Coverage artifact is uploaded for inspection.

### Tests + coverage

- Next.js apps + `ui` + `env` use **Vitest** (jsdom for components, node for env).
- The `api` uses **Jest** (already configured for ts-jest ESM).
- Threshold is **80%** across lines / functions / branches / statements in every package.
- Test files: `*.test.ts` / `*.test.tsx` co-located with source.
- Setup files: `vitest.setup.ts` (imports `@testing-library/jest-dom/vitest`).
- Excluded from coverage: shadcn-generated `components/ui/**` (vendor code), Next.js route files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).

## Workspace conventions

### TypeScript

Each app/package extends a shared preset:

| Workspace                     | Extends                                             |
| ----------------------------- | --------------------------------------------------- |
| `apps/app`, `apps/marketing`  | `@mirrorverse/typescript-config/nextjs.json`        |
| `apps/backend`                | `@mirrorverse/typescript-config/node.json`          |
| `packages/ui`                 | `@mirrorverse/typescript-config/react-library.json` |
| `packages/env`, `packages/db` | `@mirrorverse/typescript-config/react-library.json` |

#### Rules for tsconfig (read before touching any tsconfig.json)

1. **Never duplicate compiler options that are already in a preset.** A consumer `tsconfig.json` should only contain `extends`, `compilerOptions.baseUrl`/`paths`, `include`, and `exclude`. If you find yourself rewriting `target`, `module`, `moduleResolution`, `strict`, etc. — stop and check the preset.
2. **Never weaken a preset locally.** Don't set `strict: false` or `noUnusedLocals: false` in a consumer config to silence errors. Fix the code instead.
3. **Use `${configDir}` for paths in shared presets.** When a preset sets `outDir` / `rootDir` / `tsBuildInfoFile`, use `${configDir}/...` so they resolve relative to the consumer, not the preset. (TS 5.5+.)
4. **Don't add a path alias unless it's actually used.** Path aliases in `paths` should resolve to real files. Dead aliases drift and confuse tooling.
5. **`exclude` is overridden, not merged.** If you set `exclude` in a consumer tsconfig, you replace the preset's full list. Either match the preset's defaults or just inherit them by omitting `exclude`. The base preset already excludes `node_modules`, `dist`, `build`, `.next`, `.turbo`, `coverage`.

#### Strict TypeScript rules and how to satisfy them

| Rule                                     | Where it lives | How to satisfy                                                                                                                                                                          |
| ---------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `strict: true`                           | base           | Type things properly; never use `any` to dodge it (use `unknown` + narrow).                                                                                                             |
| `noImplicitReturns: true`                | base           | Every code path of a non-void function must `return`. If a path is unreachable in practice, return explicitly anyway (e.g. `return NextResponse.next()` at the end of edge middleware). |
| `noFallthroughCasesInSwitch: true`       | base           | Every `case` ends with `break`, `return`, or `throw`.                                                                                                                                   |
| `noUnusedLocals: true` (node only)       | node           | If you must declare an unused local, prefix it with `_` (e.g. `const _unused = ...`). Otherwise delete it.                                                                              |
| `noUnusedParameters: true` (node only)   | node           | Unused params must be prefixed with `_` (e.g. `(_req, res) => ...`). TS treats `_`-prefixed params as intentionally unused.                                                             |
| `isolatedModules: true`                  | nextjs + node  | Re-exporting types requires `export type { Foo }`, not `export { Foo }`.                                                                                                                |
| `forceConsistentCasingInFileNames: true` | base           | Imports must match the on-disk filename casing exactly. Combined with our kebab-case file rule, never write `import x from "./MyFile"` — it's always `./my-file`.                       |

#### Code-generation rules

When you're writing or editing TypeScript in this repo:

- ✅ Prefix intentionally-unused params/locals with `_`. Don't add `// eslint-disable` comments and don't loosen the tsconfig.
- ✅ Use `export type` for re-exporting types under `isolatedModules`.
- ✅ Always `return` from every code path of a non-void function. If TS complains "not all code paths return a value," add an explicit `return` — don't disable the rule.
- ✅ When importing from another file, match its on-disk name in kebab-case (`./dashboard-card`, not `./DashboardCard` or `./Dashboard-Card`).
- ❌ Don't add new `paths` aliases without a clear need. If you do, add them in the consuming app's tsconfig only — never in the shared preset.
- ❌ Don't weaken `strict`, `noImplicitReturns`, `noUnusedLocals`, or `noUnusedParameters` to make code compile. Fix the code.
- ❌ Don't write `// @ts-ignore` or `// @ts-expect-error` to silence errors. If a third-party type is genuinely wrong, narrow with `as unknown as T` and add a one-line comment explaining why.
- ❌ Don't introduce `any`. Use `unknown` and narrow, or write a proper type.

### ESLint

Each workspace's `eslint.config.mjs` consumes the shared flat config:

| Workspace                                     | Imports                                                     |
| --------------------------------------------- | ----------------------------------------------------------- |
| `apps/app`, `apps/marketing`                  | `@mirrorverse/eslint-config/next` (includes Tailwind rules) |
| `apps/backend`, `packages/env`, `packages/db` | `@mirrorverse/eslint-config/node`                           |
| `packages/ui`                                 | `@mirrorverse/eslint-config/base` + `tailwind`              |

#### Rule severity policy

`pnpm lint` enforces `--max-warnings 0` in every workspace, so there are only two states: **error** (blocks CI) or **off** (silent). No warning-level rules are tolerated — they create IDE noise.

**Errors — block CI:**

| Rule                                           | Why                                                                                                                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unused-imports/no-unused-imports`             | Auto-removed by `--fix`. Never check in dead imports.                                                                                                                     |
| `unused-imports/no-unused-vars`                | Prefix unused vars/args with `_` (e.g. `(_req, res) => ...`). For unused destructured props, use the alias form: `{ size: _size }: { size: number }` — never `{ _size }`. |
| `unicorn/filename-case`                        | All filenames kebab-case.                                                                                                                                                 |
| `react/no-unescaped-entities`                  | Use `&apos;` / `&quot;` in JSX text.                                                                                                                                      |
| `react-hooks/rules-of-hooks`                   | Real bugs — never call hooks conditionally.                                                                                                                               |
| `better-tailwindcss/no-conflicting-classes`    | Real bug — two classes set the same CSS property.                                                                                                                         |
| `better-tailwindcss/no-duplicate-classes`      | Same class twice.                                                                                                                                                         |
| `better-tailwindcss/no-deprecated-classes`     | e.g. `flex-shrink-0` → `shrink-0`.                                                                                                                                        |
| `better-tailwindcss/no-unnecessary-whitespace` | Stray whitespace inside class strings.                                                                                                                                    |

**Off — silenced for now**, will be re-enabled in dedicated cleanup sweeps:

| Rule                                      | Why off                                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `@typescript-eslint/no-unused-vars`       | Replaced by `unused-imports/*`.                                                                    |
| `@typescript-eslint/no-explicit-any`      | Existing app code uses `any` widely (chart props, error catches, form generics).                   |
| `react-hooks/exhaustive-deps`             | Existing hooks have known missing deps (`router`, etc.).                                           |
| `react-hooks/set-state-in-effect`         | React Compiler rule — pre-existing patterns.                                                       |
| `react-hooks/immutability`                | React Compiler rule — pre-existing patterns.                                                       |
| `react-hooks/preserve-manual-memoization` | React Compiler rule — pre-existing patterns.                                                       |
| `react-hooks/incompatible-library`        | React Compiler rule — usually fires on third-party lib types.                                      |
| All `better-tailwindcss/enforce-*`        | Auto-fixed by `pnpm format` (prettier-plugin-tailwindcss) and `pnpm lint:fix`. No need to surface. |

**When writing new code**, you should still:

- ✅ Type things properly. Don't reach for `any` — use `unknown` + narrow, or write a proper type.
- ✅ List all hook deps; if a dep would cause an infinite loop, restructure (memoize the dep, use a ref) — never paper over with `// eslint-disable`.
- ✅ Avoid setting state synchronously in effects when an event handler would do.
- ✅ Run `pnpm lint:fix` and `pnpm format` before committing — both are autofixers, not human work.

#### Tailwind class rules (Tailwind v4)

- ✅ Canonical CSS-var color syntax: `text-(--token)`, `bg-(--token)`. The linter (`enforce-canonical-classes`) auto-fixes `text-[var(--token)]` → `text-(--token)`.
- ✅ Use `text-(length:--token)` when the var holds a length (font-size). Plain `text-(--token)` is interpreted as **color** and conflicts with other text-color classes like `text-muted-foreground`.
- ✅ Use modern shorthand: `shrink-0` (not the deprecated `flex-shrink-0`). The linter auto-fixes deprecated classes.
- ❌ Never apply two classes that touch the same CSS property (e.g. `text-muted-foreground text-(--paragraph-mini-font-size)` both apply `color`). The linter blocks this. Use `text-(length:--token)` for the size and a separate color class.
- ❌ Don't write JSX text with raw `'` or `"` characters — use `&apos;` / `&quot;` (or wrap in `{"..."}`). The `react/no-unescaped-entities` rule blocks raw quotes.

### UI components

shadcn lives in `packages/ui` only. Add new components with `pnpm --filter @mirrorverse/ui ui:add <component>`. Apps consume via either:

- `import { Button } from "@mirrorverse/ui/components/button"` (preferred for new code)
- `import { Button } from "@/components/ui/button"` (legacy alias, mapped via tsconfig paths)

The shared theme is in `packages/ui/src/styles/globals.css`. App-level `globals.css` should `@import "@mirrorverse/ui/globals.css"` plus app-specific `@source` directives.

### Env vars

Never call `process.env.X` directly in app code. Use the appropriate import:

```ts
import { env } from "@mirrorverse/env/app"; // Next.js product app
import { env } from "@mirrorverse/env/marketing"; // Next.js marketing site
import { env } from "@mirrorverse/env/backend"; // Express backend
```

To add a new variable: edit the relevant schema file in `packages/env/src/`, add it to the `.env.example` of the consuming app.

In CI, `SKIP_ENV_VALIDATION=true` is set so builds don't require real secrets.

### Adding a new workspace package

1. `mkdir -p packages/<name>/src`
2. Create `package.json` with `"name": "@mirrorverse/<name>"`, `"private": true`, `"type": "module"`.
3. Create `tsconfig.json` extending the right preset.
4. Create `eslint.config.mjs` importing the right shared config.
5. Add `vitest.config.ts` if the package needs tests.
6. Reference it from consumers as `"@mirrorverse/<name>": "workspace:*"`.
7. Run `pnpm install` to wire it up.

## apps/app architecture

`apps/app/src` is organized **by feature, not by route concern**. Any new code (pages, components, hooks, API calls, schemas, server actions) MUST be placed in this layout. Do not put business logic in `src/app/`.

### Source layout

```
apps/app/src/
├── app/                           # Next.js App Router. ROUTING ONLY.
│   ├── (auth)/                    # split-screen auth chrome (sign-in, sign-up)
│   ├── (app)/                     # authenticated app: sidebar chrome
│   ├── (editor)/                  # full-screen editor chrome (workflow editor)
│   ├── auth/callback/route.ts     # Supabase OAuth callback (URL is /auth/callback)
│   ├── onboarding/                # post-signup OTP flow
│   ├── layout.tsx, page.tsx, not-found.tsx, globals.css, icon.png
│   ├── sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx   # SEO
│   └── ...                        # NO _components/, NO actions.ts, NO business logic
├── features/<domain>/             # auth, chat, onboarding, workflows, deploy, integrations, dashboard
│   ├── api/{types,endpoints,queries,mutations}.ts   # HTTP layer (TanStack Query)
│   ├── components/<*.tsx>         # feature-owned components
│   ├── pages/<*-page.tsx>         # full page bodies + per-page metadata
│   ├── actions/<*.ts>             # 'use server' actions, one per file
│   ├── hooks/<use-*.ts>           # client hooks
│   ├── schemas/<*.ts>             # zod schemas
│   └── lib/<*.ts>                 # feature-private utilities
└── lib/                           # shared infra ONLY
    ├── http/{client,instances,errors}.ts    # ky-based HTTP client
    ├── query/{client,provider,keys}.ts      # TanStack Query setup
    ├── seo/{site,metadata}.ts               # siteConfig + buildMetadata helper
    ├── supabase/{client,server,middleware}.ts
    └── utils.ts                             # cn() etc.
```

### App-router rules

- **`src/app/` is for routing only.** A `page.tsx` / `layout.tsx` is a 1-line re-export from `@/features/<domain>/pages/<x>` or `@/features/<domain>/components/<x>`. Put nothing else there.

  ```tsx
  // src/app/(app)/workflows/page.tsx
  export { WorkflowsPage as default, metadata } from "@/features/workflows/pages/workflows-page";
  ```

  For dynamic params, destructure and pass through:

  ```tsx
  // src/app/(app)/mirropilot/[sessionId]/page.tsx
  import { ChatPage } from "@/features/chat/pages/chat-page";
  export { metadata } from "@/features/chat/pages/chat-page";

  export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    return <ChatPage sessionId={sessionId} />;
  }
  ```

- **No `_components/` directories under `app/`.** Components live in `features/<domain>/components/`.
- **No `actions.ts` next to a route.** Server actions live in `features/<domain>/actions/<name>.ts`, one action per file, each starts with `"use server"`.
- **Route groups** (`(auth)`, `(app)`, `(editor)`) exist purely to give different chrome to different URL trees. Keep group names descriptive; rename them via `mv` when their purpose changes.
- **Every page exports `metadata`.** Build it with `buildMetadata()` (see SEO below). Authenticated pages MUST set `noIndex: true`.
- **Edit `src/proxy.ts` `PUBLIC_ROUTE_PREFIXES` / `PROTECTED_ROUTE_PREFIXES` and `apps/app/src/app/robots.ts` whenever you add a new top-level route.** Otherwise the route is either unauthenticated by accident or indexable by accident.

### HTTP client

`@/lib/http/client` exports two ky instances and an error helper. Always use these — never `fetch()` directly in app code.

```ts
import { apiClient, authedClient, toApiError } from "@/lib/http/client";

await apiClient.get("api/v1/public/health").json<HealthResponse>();
await authedClient.post("api/v1/orgs/123/create", { json: payload }).json<CreateOrgResponse>();
```

- **`apiClient`** — anonymous baseline. `baseUrl` is `env.NEXT_PUBLIC_API_URL`; retries GET once; 15s timeout.
- **`authedClient`** — extends `apiClient` with a `beforeRequest` hook that attaches the current Supabase session's `access_token` as `Authorization: Bearer ...`.
- **Errors** — `toApiError(err)` normalizes ky `HTTPError` and friends into a single `ApiError` with `status`, `code`, and a sensible `message` pulled from `{ error }` / `{ message }` response bodies. Use it in mutation `onError`.

### TanStack Query

`@/lib/query/provider` is mounted in the root layout, so every client component can use queries. Per-feature pattern:

```ts
// features/<domain>/api/endpoints.ts — typed wrappers around authedClient
export async function fetchUserProfile(
  userId: string,
  orgId: string,
): Promise<UserProfileResponse> {
  return authedClient.get(`api/v1/auth/${userId}/profile`, { searchParams: { orgId } }).json();
}

// features/<domain>/api/queries.ts — TanStack hooks for reads
("use client");
import { queryKeys } from "@/lib/query/keys";

export function useUserProfileQuery(userId: string, orgId: string) {
  return useQuery({
    queryKey: queryKeys.auth.profile(userId, orgId),
    queryFn: () => fetchUserProfile(userId, orgId),
    enabled: Boolean(userId) && Boolean(orgId),
  });
}

// features/<domain>/api/mutations.ts — TanStack hooks for writes
("use client");
export function useRegisterUserMutation() {
  return useMutation({
    mutationFn: registerUser,
    onError: (err) => toApiError(err, "Failed to register user"),
  });
}
```

- **Keep `endpoints.ts` framework-free.** It's the typed REST surface; no React, no hooks. This makes endpoints reusable from server components / route handlers / tests.
- **Add new query keys to `@/lib/query/keys.ts`** rather than inlining strings. Use the factory: `queryKeys.workflows.detail(id)`. Keys are hierarchical so partial invalidation works (`queryClient.invalidateQueries({ queryKey: queryKeys.workflows.all })`).
- **Defaults:** `staleTime: 60_000`, `refetchOnWindowFocus: false`, `retry: 1`. Override per-call when needed; don't change the defaults.

### SEO

Every page exports `metadata` built via `@/lib/seo/metadata`:

```ts
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Workflows",
  description: "Browse, search, and run your agent workflows.",
  noIndex: true, // for any authenticated page
});
```

`buildMetadata` produces `title`, `description`, `alternates.canonical`, `robots`, `openGraph`, and `twitter` from a single input. The canonical URL is derived from `siteConfig.url` (`NEXT_PUBLIC_SITE_URL`).

- **`siteConfig`** lives at `@/lib/seo/site`. Update it (and `packages/env/src/app.ts`) for new global SEO values; never inline brand strings or URLs in page files.
- **`app/sitemap.ts`** lists publicly indexable URLs. Add new public URLs there.
- **`app/robots.ts`** disallows authenticated path prefixes. Update its `disallow` list whenever you add a new authenticated top-level route.
- **`app/opengraph-image.tsx`** renders the default OG card via `next/og`. Override per-route only if a specific page needs a custom image.

### Adding a new feature

1. `mkdir -p src/features/<domain>/{api,components,pages}`. Add `actions/`, `hooks/`, `schemas/`, `lib/` only as needed.
2. Define types in `features/<domain>/api/types.ts`. Re-export from `@/lib/types` only when reusing existing shared types.
3. Write typed REST functions in `features/<domain>/api/endpoints.ts` using `authedClient` (or `apiClient` for unauthenticated calls).
4. Wrap reads as `useXxxQuery` hooks in `features/<domain>/api/queries.ts`; writes as `useXxxMutation` hooks in `features/<domain>/api/mutations.ts`. Add query keys to `@/lib/query/keys.ts`.
5. Build components in `features/<domain>/components/`. Use named exports (`export function FooBar(){}`), not default exports.
6. Compose the page body in `features/<domain>/pages/<name>-page.tsx`. Export both the component and `metadata` from this file.
7. Add a thin route file under `src/app/...` that re-exports the page.
8. If the route is authenticated, update `src/proxy.ts` `PROTECTED_ROUTE_PREFIXES` and `app/robots.ts` `disallow`.
9. If the route is publicly indexable, add it to `app/sitemap.ts`.
10. Run `pnpm --filter @mirrorverse/app typecheck lint test build` before committing.

### Adding a new server action

- One action per file under `features/<domain>/actions/<name>.ts`.
- File starts with `"use server"`.
- Action name is a verb (`signOut`, `generateSessionId`, `registerUser`).
- Don't call `fetch()` from a server action — call functions from `features/<domain>/api/endpoints.ts` (which already use the http client). Server actions should be thin orchestration over endpoints + Supabase client + `redirect()`.

### Adding a shadcn UI component

shadcn lives in `packages/ui`. From the repo root: `pnpm --filter @mirrorverse/ui ui:add <component>`. Consume in `apps/app` via `import { Button } from "@/components/ui/button"` (the alias maps to `@mirrorverse/ui` per `tsconfig.json` `paths`).

### What goes in `src/lib/`

Only **shared infrastructure** — code that has no feature affinity and that more than one feature uses. Right now: `http/`, `query/`, `seo/`, `supabase/`, `utils.ts`. If you find yourself adding something feature-specific to `src/lib/`, it belongs in `features/<domain>/lib/` instead.
