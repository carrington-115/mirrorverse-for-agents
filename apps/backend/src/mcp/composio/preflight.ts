import { randomUUID } from "node:crypto";
import { and, eq, inArray, schema, type Database } from "@mirrorverse/db";
import type { ChatId } from "@mirrorverse/types";

import { appendChatEvent } from "../../features/chats/repo";
import { isComposioConfigured } from "./client";

/**
 * Known app keyword → Composio slug mappings.
 * Keys are lowercase words that indicate an external service is needed.
 * Any unrecognised app will still be caught organically when the agent
 * tries to call a Composio tool and receives a NeedsAuthError.
 */
const APP_KEYWORD_MAP: Record<string, string> = {
  notion: "notion",
  gmail: "gmail",
  "google mail": "gmail",
  slack: "slack",
  github: "github",
  gitlab: "gitlab",
  airtable: "airtable",
  hubspot: "hubspot",
  salesforce: "salesforce",
  jira: "jira",
  asana: "asana",
  trello: "trello",
  linear: "linear",
  "google calendar": "googlecalendar",
  "google drive": "googledrive",
  "google sheets": "googlesheets",
  "google docs": "googledocs",
  "google tasks": "googletasks",
  discord: "discord",
  telegram: "telegram",
  twitter: "twitter",
  x: "twitter",
  shopify: "shopify",
  stripe: "stripe",
  zendesk: "zendesk",
  intercom: "intercom",
  mailchimp: "mailchimp",
  sendgrid: "sendgrid",
  twilio: "twilio",
  dropbox: "dropbox",
  box: "box",
  onedrive: "onedrive",
  monday: "monday",
  basecamp: "basecamp",
  zoom: "zoom",
  calendly: "calendly",
  typeform: "typeform",
  webflow: "webflow",
  wordpress: "wordpress",
  figma: "figma",
  confluence: "confluence",
  bamboohr: "bamboohr",
  quickbooks: "quickbooks",
  xero: "xero",
  pipedrive: "pipedrive",
};

function detectSlugsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  // Check multi-word phrases first (longest match wins)
  const phrases = Object.keys(APP_KEYWORD_MAP).sort(
    (a, b) => b.length - a.length,
  );
  for (const phrase of phrases) {
    // Word-boundary-like check: preceded by space/start, followed by space/end/punctuation
    const idx = lower.indexOf(phrase);
    if (idx === -1) continue;
    const before = idx === 0 ? " " : lower[idx - 1];
    const after = lower[idx + phrase.length] ?? " ";
    const validBefore = /[\s,.()\-/]/.test(before);
    const validAfter = /[\s,.()\-/]/.test(after);
    if (validBefore && validAfter) {
      const slug = APP_KEYWORD_MAP[phrase];
      if (slug) found.add(slug);
    }
  }

  return [...found];
}

export interface PreflightResult {
  readonly interrupted: boolean;
  readonly missingSlug: string | null;
}

/**
 * Run before the chat agent to detect obvious missing Composio connections.
 * If a missing connection is found, creates a connectionRequest row and emits
 * an interrupt chatEvent. Returns { interrupted: true } so the caller can
 * return an early streaming response without running the agent.
 *
 * Fails open: any error returns { interrupted: false } so the agent always
 * has a chance to run and handle auth organically via NeedsAuthError.
 */
export async function runPreflightCheck(
  db: Database,
  workspaceId: string,
  chatId: string,
  userText: string,
): Promise<PreflightResult> {
  try {
    if (!isComposioConfigured()) {
      return { interrupted: false, missingSlug: null };
    }

    const detected = detectSlugsFromText(userText);
    if (detected.length === 0) return { interrupted: false, missingSlug: null };

    // Check which slugs already have an active connection for this workspace
    const activeRows = await db
      .select({ appSlug: schema.connections.appSlug })
      .from(schema.connections)
      .where(
        and(
          eq(schema.connections.workspaceId, workspaceId),
          eq(schema.connections.status, "active"),
          inArray(schema.connections.appSlug, detected),
        ),
      );
    const activeSet = new Set(activeRows.map((r) => r.appSlug));
    const missing = detected.filter((s) => !activeSet.has(s));

    if (missing.length === 0) return { interrupted: false, missingSlug: null };

    // Emit a single interrupt with all missing slugs.
    // Redirect URLs and connection requests are created on-demand when the user
    // clicks "Connect" for each app in the UI.
    await appendChatEvent({
      db,
      chatId,
      kind: "interrupt",
      payload: {
        kind: "interrupt",
        interrupt: {
          id: randomUUID(),
          kind: "needs_credentials",
          chatId: chatId as ChatId,
          appSlugs: missing,
        },
      },
    });

    return { interrupted: true, missingSlug: missing[0]! };
  } catch (err) {
    console.warn(
      "[preflight] fail-open:",
      err instanceof Error ? err.message : err,
    );
    return { interrupted: false, missingSlug: null };
  }
}
