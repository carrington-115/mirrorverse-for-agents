import { createHash } from "node:crypto";

import type { InngestFunction } from "inngest";
import { load } from "cheerio";
import { schema, type Database } from "@mirrorverse/db";
import { PDFParse } from "pdf-parse";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

import {
  EMBEDDING_DIMS,
  EMBEDDING_MODEL_ID,
  embedTexts,
} from "../../knowledge/embed";
import * as repo from "../../knowledge/repo";
import { inngest } from "../client";
import { knowledgeIngestEvent } from "../events";

// Approx 4 chars per token; ~400 token chunks with 50-token overlap
const CHARS_PER_TOKEN = 4;
const CHUNK_TARGET_CHARS = 400 * CHARS_PER_TOKEN; // 1600
const CHUNK_OVERLAP_CHARS = 50 * CHARS_PER_TOKEN; // 200

// Timeout for all external HTTP fetches — caps worst-case step duration.
const FETCH_TIMEOUT_MS = 12_000;

export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_TARGET_CHARS, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    start = end - CHUNK_OVERLAP_CHARS;
    if (start >= text.length - CHUNK_OVERLAP_CHARS) break;
  }
  return chunks;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Normalise third-party sharing URLs before fetching:
 * - Google Docs/Sheets: rewrite to plaintext/CSV export (works for public links).
 * - Google Drive files: rewrite to direct download.
 * - Dropbox: switch dl=0 preview to dl=1 direct download.
 * - OneDrive: rewrite shared links to direct download.
 * - Notion: pass through (handled by Jina Reader).
 */
function normalizeSourceUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  const host = parsed.hostname.toLowerCase();

  if (host === "docs.google.com") {
    const docId = parsed.pathname.match(/^\/document\/d\/([^/]+)/)?.[1];
    if (docId)
      return `https://docs.google.com/document/d/${docId}/export?format=txt`;

    const sheetId = parsed.pathname.match(/^\/spreadsheets\/d\/([^/]+)/)?.[1];
    if (sheetId)
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  }

  if (host === "drive.google.com") {
    const fileId = parsed.pathname.match(/^\/file\/d\/([^/]+)/)?.[1];
    if (fileId)
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  if (host === "www.dropbox.com" || host === "dropbox.com") {
    parsed.searchParams.set("dl", "1");
    return parsed.toString();
  }

  if (host === "onedrive.live.com") {
    // Shared file preview → direct download
    parsed.searchParams.set("download", "1");
    return parsed.toString();
  }

  if (host === "1drv.ms" || host === "onedrive.live.com") {
    // Short links are resolved at fetch time via redirect following.
    // Mark them with a special param so fetchAndParseUrl knows to resolve first.
    return rawUrl;
  }

  return rawUrl;
}

/**
 * Extract body text from HTML using cheerio (lightweight — no CSS/script parse).
 * Targets article/main/[role=main] before falling back to body.
 */
function extractTextFromHtml(html: string): string {
  const $ = load(html);
  $("script, style, noscript, nav, footer, header, aside").remove();
  const main =
    $("article").text() ||
    $("main").text() ||
    $('[role="main"]').text() ||
    $("body").text();
  const extracted = main.replace(/\s+/g, " ").trim();
  if (!extracted) throw new Error("Could not extract text content from page");
  return extracted;
}

/**
 * 3-layer URL fetch strategy:
 *
 * Layer 1 — Jina Reader (fast, handles JS-rendered pages including Notion):
 *   GET https://r.jina.ai/{encodedUrl} — returns clean Markdown in ~1–3s.
 *   Falls through if non-200 or response too short.
 *
 * Layer 2 — Local fetch + Cheerio (lightweight HTML parser, 10–20× faster than JSDOM):
 *   Plain-text/CSV responses are returned directly.
 *   HTML is parsed with cheerio targeting semantic content elements.
 *
 * Both layers use AbortSignal.timeout(FETCH_TIMEOUT_MS) to cap worst-case duration.
 */
async function fetchAndParseUrl(rawUrl: string): Promise<string> {
  const url = normalizeSourceUrl(rawUrl);

  // Layer 1: Jina Reader
  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const resp = await fetch(jinaUrl, {
      headers: { Accept: "text/plain" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (resp.ok) {
      const text = (await resp.text()).replace(/\s+/g, " ").trim();
      if (text.length >= 100) return text;
    }
  } catch {
    // fall through to local parse
  }

  // Layer 2: Local fetch + Cheerio
  const resp = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);

  const contentType = resp.headers.get("content-type") ?? "";
  if (
    contentType.startsWith("text/plain") ||
    contentType.startsWith("text/csv")
  ) {
    return (await resp.text()).replace(/\s+/g, " ").trim();
  }

  const html = await resp.text();
  return extractTextFromHtml(html);
}

async function fetchAndParsePdf(storageKeyOrUrl: string): Promise<string> {
  const resp = await fetch(storageKeyOrUrl, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching PDF`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.replace(/\s+/g, " ").trim();
  } finally {
    await parser.destroy();
  }
}

const OFFICE_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const OFFICE_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Vision model used to OCR/transcribe images into embeddable text.
const VISION_MODEL = openai("gpt-4o-mini");

async function fetchBuffer(url: string): Promise<Buffer> {
  const resp = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching file`);
  return Buffer.from(await resp.arrayBuffer());
}

/** OCR + describe an image with a vision model so its contents are searchable. */
async function transcribeImage(url: string): Promise<string> {
  const { text } = await generateText({
    model: VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Transcribe verbatim all text visible in this image, then briefly describe its visual content. Return plain text suitable for search indexing.",
          },
          { type: "image", image: new URL(url) },
        ],
      },
    ],
  });
  return text.replace(/\s+/g, " ").trim();
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value.replace(/\s+/g, " ").trim();
}

function parseXlsx(buffer: Buffer): string {
  const wb = XLSX.read(buffer, { type: "buffer" });
  return wb.SheetNames.map((name) => {
    const sheet = wb.Sheets[name];
    return sheet ? `# ${name}\n${XLSX.utils.sheet_to_csv(sheet)}` : "";
  })
    .join("\n\n")
    .trim();
}

function looksLikeText(mediaType: string, fileName: string): boolean {
  return (
    mediaType.startsWith("text/") ||
    mediaType === "application/json" ||
    /\.(txt|md|markdown|csv|tsv|json|jsonl|log|ya?ml|html?|xml)$/i.test(
      fileName,
    )
  );
}

/**
 * Extract embeddable text from a non-PDF "file" by media type / extension.
 * Unsupported binaries return "" so the document is still stored in the bucket
 * and listed in the Mirrorpilot section — it simply has no searchable chunks.
 */
async function extractFileText(
  url: string,
  mediaType: string,
  fileName: string,
): Promise<string> {
  if (looksLikeText(mediaType, fileName)) {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching file`);
    return (await resp.text()).replace(/\s+/g, " ").trim();
  }
  if (mediaType === OFFICE_DOCX || /\.docx$/i.test(fileName)) {
    return parseDocx(await fetchBuffer(url));
  }
  if (
    mediaType === OFFICE_XLSX ||
    mediaType === "application/vnd.ms-excel" ||
    /\.(xlsx|xls)$/i.test(fileName)
  ) {
    return parseXlsx(await fetchBuffer(url));
  }
  return "";
}

export function makeKnowledgeIngestFunction(db: Database): InngestFunction.Any {
  return inngest.createFunction(
    {
      id: "knowledge.ingest",
      name: "Knowledge Document Ingest",
      triggers: [knowledgeIngestEvent],
      retries: 3,
    },
    async ({ event, step }) => {
      const { documentId, kbId, workspaceId, sourceType, contentOrUrl } =
        event.data;
      const mediaType = event.data.mediaType ?? "";
      const fileName = event.data.fileName ?? "";

      await step.run("mark-processing", () =>
        repo.updateDocumentStatus(db, documentId, "processing"),
      );

      const rawText = await step.run("fetch-and-parse", async () => {
        try {
          if (sourceType === "text") return contentOrUrl;
          if (sourceType === "url") return fetchAndParseUrl(contentOrUrl);
          if (sourceType === "image") return transcribeImage(contentOrUrl);
          if (sourceType === "file")
            return extractFileText(contentOrUrl, mediaType, fileName);
          // pdf: contentOrUrl is a Supabase Storage signed URL or public URL
          return fetchAndParsePdf(contentOrUrl);
        } catch (err) {
          await repo.updateDocumentStatus(db, documentId, "failed", {
            errorMessage: err instanceof Error ? err.message : String(err),
          });
          throw err;
        }
      });

      const contentHash = createHash("sha256").update(rawText).digest("hex");

      // Idempotency: if identical content was already ingested into this KB,
      // reuse its result and skip re-embedding entirely.
      const dedupe = await step.run("dedupe-by-hash", async () => {
        const existing = await repo.findReadyDocByHash(
          db,
          kbId,
          contentHash,
          documentId,
        );
        if (!existing) return { skipped: false as const, chunkCount: 0 };
        await repo.updateDocumentStatus(db, documentId, "ready", {
          chunkCount: existing.chunkCount,
          contentHash,
        });
        return { skipped: true as const, chunkCount: existing.chunkCount };
      });

      if (dedupe.skipped) {
        return {
          documentId,
          workspaceId,
          contentHash,
          chunkCount: dedupe.chunkCount,
          deduped: true,
        };
      }

      // Embed + write in a single step so the (potentially many MB of) embedding
      // vectors never cross an Inngest step boundary as serialized step output.
      // Retries re-embed, but upsertChunks is idempotent on (documentId, chunkIndex)
      // and the usage row is idempotent on its key, so retries are safe.
      const result = await step.run("embed-and-write", async () => {
        const chunks = chunkText(rawText);

        // No extractable text (e.g. unsupported binary). Keep the document as a
        // ready, zero-chunk record so it still lists; it just isn't searchable.
        if (chunks.length === 0) {
          await repo.updateDocumentStatus(db, documentId, "ready", {
            chunkCount: 0,
            contentHash,
          });
          return { chunkCount: 0, tokens: 0 };
        }

        const { embeddings, tokens } = await embedTexts(chunks);

        // Drop any chunk whose embedding is missing or the wrong dimensionality
        // rather than inserting an invalid vector(1536) and poisoning search.
        const rows = chunks
          .map((content, index) => ({
            content,
            index,
            embedding: embeddings[index],
          }))
          .filter(
            (r): r is { content: string; index: number; embedding: number[] } =>
              Array.isArray(r.embedding) &&
              r.embedding.length === EMBEDDING_DIMS,
          )
          .map((r) => ({
            documentId,
            kbId,
            chunkIndex: r.index,
            content: r.content,
            tokenCount: estimateTokens(r.content),
            embedding: r.embedding,
          }));

        if (rows.length === 0) {
          await repo.updateDocumentStatus(db, documentId, "failed", {
            contentHash,
            errorMessage: "Embedding produced no valid vectors",
          });
          return { chunkCount: 0, tokens };
        }

        await repo.upsertChunks(db, rows);
        await repo.updateDocumentStatus(db, documentId, "ready", {
          chunkCount: rows.length,
          contentHash,
        });

        // Cost tracking: record embedding token spend. Idempotent per document
        // so a step retry can't double-bill.
        await db
          .insert(schema.usageEvents)
          .values({
            workspaceId,
            kind: "embedding",
            quantity: tokens,
            unit: "token",
            model: EMBEDDING_MODEL_ID,
            costCents: 0,
            billable: true,
            idempotencyKey: `kb_embed:${documentId}`,
          })
          .onConflictDoNothing();

        return { chunkCount: rows.length, tokens };
      });

      return {
        documentId,
        workspaceId,
        contentHash,
        chunkCount: result.chunkCount,
      };
    },
  );
}
