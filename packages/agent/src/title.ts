import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

import { DEFAULT_HAIKU_MODEL } from "./models/constants";

const LOG_PREFIX = "[title]";
const TITLE_MODEL = DEFAULT_HAIKU_MODEL;
const MAX_GENERATED_TITLE_LENGTH = 80;

const SYSTEM = `Write a 3-6 word title that names the workflow the user wants to build.
Return only the title text. No quotes, no trailing punctuation, no "Untitled".
Use title case. Examples: "Lead qualification agent", "Stripe expense approvals", "HR onboarding assistant".`;

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
