import { defineConfig } from "cypress";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

loadDotenv({ path: resolve(__dirname, ".env.test"), override: false });
loadDotenv({ path: resolve(__dirname, ".env.local"), override: false });

interface AdminEnv {
  url: string;
  serviceRoleKey: string;
}

function readAdminEnv(): AdminEnv {
  const url = process.env.E2E_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url.length === 0) {
    throw new Error(
      "E2E setup: missing E2E_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL fallback). Add it to apps/app/.env.test.",
    );
  }
  if (serviceRoleKey === undefined || serviceRoleKey.length === 0) {
    throw new Error(
      "E2E setup: missing E2E_SUPABASE_SERVICE_ROLE_KEY. Add it to apps/app/.env.test (never commit it).",
    );
  }
  return { url, serviceRoleKey };
}

let cachedAdmin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient {
  if (cachedAdmin !== null) return cachedAdmin;
  const { url, serviceRoleKey } = readAdminEnv();
  cachedAdmin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAdmin;
}

interface GeneratedOtp {
  email_otp: string;
  hashed_token: string;
  user_id: string | null;
}

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    fixturesFolder: "cypress/fixtures",
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",
    video: true,
    // runMode capped at 1 retry to limit email-send burn against Supabase's
    // 4/hr built-in SMTP cap. Raise once custom SMTP is configured on the
    // test project (Project Settings → Auth → SMTP).
    retries: { runMode: 1, openMode: 0 },
    defaultCommandTimeout: 10_000,
    setupNodeEvents(on, config) {
      on("task", {
        async generateOtp({
          email,
          shouldCreateUser = true,
        }: {
          email: string;
          shouldCreateUser?: boolean;
        }): Promise<GeneratedOtp> {
          const admin = getAdmin();
          const result = shouldCreateUser
            ? await admin.auth.admin.generateLink({
                type: "signup",
                email,
                password: `e2e-${Math.random().toString(36).slice(2)}-${Math.random()
                  .toString(36)
                  .slice(2)}`,
              })
            : await admin.auth.admin.generateLink({
                type: "magiclink",
                email,
              });
          if (result.error !== null) {
            throw new Error(`generateOtp failed: ${result.error.message}`);
          }
          if (result.data.properties === null) {
            throw new Error("generateOtp returned no properties");
          }
          return {
            email_otp: result.data.properties.email_otp,
            hashed_token: result.data.properties.hashed_token,
            user_id: result.data.user === null ? null : result.data.user.id,
          };
        },

        async deleteUserByEmail({ email }: { email: string }): Promise<{ deleted: boolean }> {
          const admin = getAdmin();
          const { data: list, error: listErr } = await admin.auth.admin.listUsers({
            page: 1,
            perPage: 100,
          });
          if (listErr !== null) {
            throw new Error(`listUsers failed: ${listErr.message}`);
          }
          const user = list.users.find((u) => u.email === email);
          if (user === undefined) return { deleted: false };
          const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
          if (delErr !== null) {
            throw new Error(`deleteUser failed: ${delErr.message}`);
          }
          return { deleted: true };
        },

        log(message: string) {
          // eslint-disable-next-line no-console
          console.log(`[cy.task:log] ${message}`);
          return null;
        },
      });

      // Expose the project ref to specs that assert OAuth redirect URLs.
      const adminUrl = process.env.E2E_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      config.env.SUPABASE_URL = adminUrl;
      return config;
    },
  },
});
