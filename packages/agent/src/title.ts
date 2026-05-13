import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const TITLE_MODEL = "claude-haiku-4-5";

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
      .slice(0, 80);
    return cleaned.length > 0 ? cleaned : null;
  } catch (err) {
    console.error("[title] generation failed:", err);
    return null;
  }
}
