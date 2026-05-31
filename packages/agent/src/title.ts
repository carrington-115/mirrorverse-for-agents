import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

import { DEFAULT_HAIKU_MODEL } from "./models/constants";

const LOG_PREFIX = "[title]";
const TITLE_MODEL = DEFAULT_HAIKU_MODEL;
const MAX_GENERATED_TITLE_LENGTH = 80;
const SKIP_SENTINEL = "NONE";

const SYSTEM = `You generate short, descriptive titles for chat conversations in Mirrorverse.

Given the user's first message, return a 3–6 word title that captures the subject or goal of the conversation. The conversation could be about anything — building an AI agent or automation, debugging code, writing content, answering a question, drafting a message, analyzing data, brainstorming ideas, etc. Title it accordingly.

Output rules:
- Return ONLY the title. No quotes, prefixes, explanations, emojis, or trailing punctuation.
- Use Title Case: capitalize significant words; lowercase articles, conjunctions, and short prepositions (a, an, the, and, or, but, of, to, in, for, on, at, by, with).
- Write the title in the same language as the user's message.
- Prefer concise noun phrases that describe the topic or goal (e.g. "CSS Flexbox Centering", "Inbound Lead Qualification", "Postgres 14 to 16 Migration") over commands or first-person framings.
- Do not start with filler words like "Chat About", "Conversation On", "Help With", "Question About", or "Discussion Of".
- Do not include the words "Workflow", "Agent", "Bot", or "Assistant" unless they are essential to disambiguate the topic.
- Do not invent details the user did not mention. Title only what is actually in the message.
- If the message is a greeting or salutation with no further subject, title it as a greeting exchange — see greeting examples below.
- Only output NONE if the message is pure gibberish (random characters that are not recognizable words in any language).

Greeting examples — when the opener is a salutation with no stated topic:
Input: hi
Output: Greeting Exchange

Input: hello
Output: Greeting Exchange

Input: hey
Output: Casual Hello

Input: hey there
Output: Casual Hello

Input: hello there!
Output: Friendly Greeting

Input: good morning
Output: Morning Greeting

Input: good morning!
Output: Morning Greeting

Input: good afternoon
Output: Afternoon Greeting

Input: good evening
Output: Evening Greeting

Input: how are you?
Output: Friendly Check-in

Input: how are you doing?
Output: Friendly Check-in

Input: what's up?
Output: Casual Check-in

Input: hi, I'm new here
Output: New User Introduction

Input: greetings
Output: Greeting Exchange

Input: Dear assistant,
Output: Formal Greeting

Input: To whom it may concern,
Output: Formal Greeting

Topic examples — when there is a clear subject or goal:
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

Input: analyze my Q3 sales data and find the top-performing regions
Output: Q3 Sales Data Analysis

Input: write a LinkedIn post announcing our product launch
Output: LinkedIn Product Launch Post

Input: I want to build something that scrapes job postings and emails me daily
Output: Job Posting Scraper with Daily Digest

Input: whenever a new Typeform response comes in, add it to Airtable and notify Slack
Output: Typeform to Airtable Slack Notifications

Input: debug this Python script — it keeps throwing a KeyError on line 42
Output: Python KeyError Debugging

Input: I need to refactor this React component to use context instead of prop drilling
Output: React Context Refactor

Input: help me come up with a name for my new SaaS product
Output: SaaS Product Naming

Gibberish examples — only for random non-language characters:
Input: asdkjfh
Output: NONE

Input: xzqq1928!!!
Output: NONE`;

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
      .replace(/^["'`""'']+|["'`""'']+$/g, "")
      .replace(/[.!?,;:]+$/g, "")
      .replace(/\s+/g, " ")
      .slice(0, MAX_GENERATED_TITLE_LENGTH)
      .trim();

    if (!cleaned || cleaned === SKIP_SENTINEL) return null;

    return cleaned;
  } catch (err) {
    console.error(`${LOG_PREFIX} generation failed:`, err);
    return null;
  }
}
