# Auth E2E (Cypress)

End-to-end tests for the Supabase-backed magic-code login flow. Run against a real
Supabase project — never point them at the dev or production project.

## What's covered

`cypress/e2e/auth.cy.ts`

- Unauthenticated route gating (`/dashboard` and `/` redirect to `/sign-in`)
- Sign-in form: invalid email rejected; valid email → verify-account with `email + next` params
- OTP verification: wrong code stays on page; correct code → `/dashboard` with auth cookies
- Sign-up flow lands on `/account-setup/user-role` after correct OTP
- Google OAuth button hits `https://<ref>.supabase.co/auth/v1/authorize?provider=google`
- Sign-out from the dashboard sidebar clears the session and returns to `/sign-in`

## How OTP codes are obtained

Cypress can't read inbox emails. Instead, `cy.task('generateOtp')` (defined in
`cypress.config.ts`) calls `supabase.auth.admin.generateLink()` server-side using
the service-role key and returns the `email_otp` directly. The custom command
`cy.enterOtpFromAdmin(email)` types it into the OTP input.

This means real emails are still sent during the test (Supabase issues them as a
side effect of `generateLink`), but Cypress never has to read them.

## Running locally

1. Provision a separate test Supabase project (free tier is fine). Treat it as
   ephemeral; tests create + delete users.

2. Configure that project:
   - **Authentication → URL Configuration** → Site URL `http://localhost:3000`,
     redirect URL `http://localhost:3000/auth/callback`
   - **Authentication → Providers → Email** → enabled
   - **Authentication → Providers → Google** → enabled (OAuth click test asserts
     the redirect; you can skip this if you're OK with that one test failing)
   - **Authentication → Email Templates** → leave defaults; we only need the
     OTP token, which Supabase emits regardless of the template body

3. `cp apps/app/.env.test.example apps/app/.env.test` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<test-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<test-anon-key>
   E2E_SUPABASE_URL=https://<test-ref>.supabase.co
   E2E_SUPABASE_SERVICE_ROLE_KEY=<test-service-role-key>
   NEXT_PUBLIC_API_URL=http://localhost:3001
   DATABASE_URL=postgres://...   # any reachable Postgres; the e2e flow doesn't write to it yet
   ```

4. Start the app (the test runner expects `http://localhost:3000`):

   ```bash
   pnpm dev:app
   ```

5. In another terminal:
   ```bash
   pnpm e2e          # headless run
   pnpm e2e:open     # interactive Cypress runner
   ```

## CI

`.github/workflows/e2e.yml` runs on `workflow_dispatch` and on push to `e2e/*`
branches. It builds the app with `pnpm build`, starts it with `pnpm start`,
waits for `/sign-in` to respond, then runs `pnpm e2e`.

Required repo secrets:

- `E2E_SUPABASE_URL`
- `E2E_SUPABASE_ANON_KEY`
- `E2E_SUPABASE_SERVICE_ROLE_KEY`

Cypress videos and (on failure) screenshots are uploaded as artifacts.

## Troubleshooting

- **`generateOtp` 429 / rate limit** — Supabase rate-limits `generateLink` per
  project. If tests are flaky, parallelism helps less than spacing tests; CI
  runs are sequential (`runMode: 2 retries`) so this is rare. For local
  iteration, use the interactive runner and re-run only the failing spec.
- **Tests time out on `/account-setup/verify-account`** — the OTP input uses
  shadcn's `InputOTP`, which renders a hidden input with `data-input-otp="true"`.
  If the upstream component changes, update the selector in
  `cypress/support/commands.ts`.
- **OAuth test fails on `provider=google`** — the test expects the Google
  provider to be _enabled_ in your test Supabase project. Disable the test
  (`describe.skip`) if you're not testing OAuth.
- **Users accumulate** — every test ends with `cy.task('deleteUserByEmail', ...)`.
  If a test crashes mid-flight, the user persists. Periodically inspect
  **Authentication → Users** and delete `*@e2e.mirrorverse.test` rows.
