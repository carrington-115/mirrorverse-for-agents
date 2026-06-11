import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

// text-embedding-3-small → 1536 dims, matches the vector(1536) column
export const EMBEDDING_MODEL_ID = "text-embedding-3-small";
const MODEL = openai.embedding(EMBEDDING_MODEL_ID);

const BATCH_SIZE = 512;

// Dimension of text-embedding-3-small; chunks whose vector doesn't match this
// would be rejected by the vector(1536) column, so callers validate against it.
export const EMBEDDING_DIMS = 1536;

export interface EmbedResult {
  embeddings: number[][];
  /** Total input tokens billed across all batches, for usage tracking. */
  tokens: number;
}

export async function embedTexts(texts: string[]): Promise<EmbedResult> {
  if (texts.length === 0) return { embeddings: [], tokens: 0 };

  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE)
    batches.push(texts.slice(i, i + BATCH_SIZE));

  const results = await Promise.all(
    batches.map((batch) =>
      embedMany({ model: MODEL, values: batch, maxRetries: 0 }),
    ),
  );

  const embeddings = results.flatMap((r) => r.embeddings);
  const tokens = results.reduce((sum, r) => sum + (r.usage?.tokens ?? 0), 0);
  return { embeddings, tokens };
}

export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: MODEL,
    value: text,
    maxRetries: 0,
  });
  return embedding;
}
