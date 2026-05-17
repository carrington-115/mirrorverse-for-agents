import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

import { DEFAULT_HAIKU_MODEL } from "./models/constants";

const LOG_PREFIX = "[title]";
const TITLE_MODEL = DEFAULT_HAIKU_MODEL;
const MAX_GENERATED_TITLE_LENGTH = 80;

const SYSTEM = `You generate short titles for AI agent workflows in Mirrro.

Given the user's description of a workflow they want to build, return a 3–6 word title that names what the workflow does.

Output rules:
- Return only the title — no quotes, prefixes, explanations, or trailing punctuation.
- Use Title Case: capitalize each significant word; lowercase articles, conjunctions, and short prepositions (a, an, the, and, or, of, to, in, for).
- Write the title in the same language as the input.
- Prefer noun phrases describing the workflow's function (e.g. "Lead Qualification") over commands ("Qualify Leads") or user-centric phrasing ("My Sales Helper").
- Do not include "Workflow", "Agent", "Bot", or "Assistant" unless it disambiguates.
- If the input is empty, unclear, or not actually about a workflow, return exactly: New Workflow

Examples:
Input: an agent that qualifies inbound leads from our contact form and routes them to sales
Output: Inbound Lead Qualification

Input: approve expense reports submitted via Stripe and notify finance on Slack
Output: Stripe Expense Approvals

Input: onboard new hires by sending welcome emails and provisioning accounts
Output: New Hire Onboarding

Input: respond to support tickets in zendesk during off hours and escalate urgent ones
Output: After-Hours Support Triage`;

export async function generateChatTitle(userMessage: string): Promise<string | null> {
  const trimmed = userMessage.trim();
  if (!trimmed) return null;
  try {
    const { text } = await generateText({
      model: anthropic(TITLE_MODEL),
      system: SYSTEM,
      prompt: trimmed,
    });
    const cleaned = text
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/[.!?]+$/g, "")
      .slice(0, MAX_GENERATED_TITLE_LENGTH);
    return cleaned.length > 0 ? cleaned : null;
  } catch (err) {
    console.error(`${LOG_PREFIX} generation failed:`, err);
    return null;
  }
}
