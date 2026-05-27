import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

import { DEFAULT_HAIKU_MODEL } from "./models/constants";

const LOG_PREFIX = "[title]";
const TITLE_MODEL = DEFAULT_HAIKU_MODEL;
const MAX_GENERATED_TITLE_LENGTH = 80;
const FALLBACK_TITLE = "New Chat";

const SYSTEM = `You generate short, descriptive titles for chat conversations in Mirrro.

Given the user's first message, return a 3–6 word title that summarizes the subject of the conversation. The conversation could be about anything — building an AI agent or workflow, debugging code, writing content, answering a question, drafting a message, brainstorming, etc. Title it accordingly.

Output rules:
- Return ONLY the title. No quotes, prefixes, explanations, emojis, or trailing punctuation.
- Use Title Case: capitalize significant words; lowercase articles, conjunctions, and short prepositions (a, an, the, and, or, but, of, to, in, for, on, at, by, with).
- Write the title in the same language as the user's message.
- Prefer concise noun phrases describing the topic (e.g. "CSS Flexbox Centering", "Inbound Lead Qualification", "Postgres 14 to 16 Migration") over commands ("Center a Div") or first-person framings ("My Sales Question", "Help Me Debug").
- Do not start the title with filler like "Chat About", "Conversation On", "Help With", "Question About", "Discussion Of".
- Do not include the words "Workflow", "Agent", "Bot", or "Assistant" unless they are essential to disambiguate the topic.
- Do not invent details the user did not mention. Title only what is actually in the message.
- If the message is a greeting ("hi", "hello"), extremely short, gibberish, or has no identifiable subject, return exactly: New Chat

Examples:
Input: an agent that qualifies inbound leads from our contact form and routes them to sales
Output: Inbound Lead Qualification

Input: how do I center a div with flexbox
Output: CSS Flexbox Centering

Input: write me a short poem about autumn leaves
Output: Autumn Leaves Poem

Input: what's the best way to migrate from postgres 14 to 16
Output: Postgres 14 to 16 Migration

Input: draft an email to my manager about taking vacation next week
Output: Vacation Request Email

Input: respond to zendesk tickets after hours and escalate urgent ones
Output: After-Hours Support Triage

Input: can you explain how transformers work in deep learning
Output: Transformer Architecture Explained

Input: ¿cuál es la capital de Francia?
Output: Capital de Francia

Input: hi
Output: New Chat

Input: asdkjfh
Output: New Chat`;

export async function generateChatTitle(userMessage: string): Promise<string | null> {
  const trimmed = userMessage.trim();
  if (!trimmed) return null;

  try {
    const { text } = await generateText({
      model: anthropic(TITLE_MODEL),
      system: SYSTEM,
      prompt: trimmed,
      maxOutputTokens: 30,
    });

    const cleaned = text
      .trim()
      .replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, "")
      .replace(/[.!?,;:]+$/g, "")
      .replace(/\s+/g, " ")
      .slice(0, MAX_GENERATED_TITLE_LENGTH)
      .trim();

    if (!cleaned) return null;

    return cleaned;
  } catch (err) {
    console.error(`${LOG_PREFIX} generation failed:`, err);
    return FALLBACK_TITLE;
  }
}
