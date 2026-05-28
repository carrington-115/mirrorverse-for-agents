import "./lib/tracing.js"; // must be first — registers OTel before any spans are created
import { Buffer } from "node:buffer";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { Readable } from "node:stream";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { getDb } from "@mirrorverse/db";

import { env } from "@mirrorverse/env/backend";

import { POST as chatHandler } from "../api/chat";
import { GET as connectionsCallbackGet } from "../api/connections/callback";
import { POST as speechHandler } from "../api/speech";
import { vapiWebhookHandler } from "./features/voice/webhook";
import { handleStripeWebhook } from "./features/billing/webhooks/stripe";
import { inboundWebhookHandler } from "./features/webhooks/inbound-handler";
import {
  GET as inngestGet,
  POST as inngestPost,
  PUT as inngestPut,
} from "../api/inngest";
import { TRPC_ENDPOINT } from "./config";
import { createContext } from "./trpc/context";
import { appRouter } from "./trpc/router";

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

async function toFetchRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host ?? `localhost:${env.PORT}`;
  const url = new URL(req.url ?? "/", `http://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) headers.set(key, value.join(", "));
    else if (typeof value === "string") headers.set(key, value);
  }

  const method = req.method ?? "GET";
  if (method === "GET" || method === "HEAD") {
    return new Request(url, { method, headers });
  }

  const body = await readBody(req);
  return new Request(url, { method, headers, body: new Uint8Array(body) });
}

async function pipeResponse(
  res: ServerResponse,
  response: Response,
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "content-length" || lower === "transfer-encoding") return;
    res.setHeader(key, value);
  });
  if (!response.body) {
    res.end();
    return;
  }
  res.flushHeaders();
  if (res.socket && "setNoDelay" in res.socket) res.socket.setNoDelay(true);
  await new Promise<void>((resolve, reject) => {
    const nodeStream = Readable.fromWeb(
      response.body as Parameters<typeof Readable.fromWeb>[0],
    );
    nodeStream.on("error", reject);
    nodeStream.on("end", resolve);
    nodeStream.pipe(res);
  });
}

const corsOrigin = env.CORS_ORIGIN;

function applyCors(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin;
  if (origin && (corsOrigin === "*" || origin === corsOrigin)) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "origin");
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader(
      "access-control-allow-headers",
      "authorization, content-type, x-trpc-source",
    );
    res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  }
}

const server = createServer(async (req, res) => {
  try {
    applyCors(req, res);
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    const request = await toFetchRequest(req);
    const url = new URL(request.url);

    if (url.pathname === "/api/voice/webhook") {
      const response = await vapiWebhookHandler(request);
      await pipeResponse(res, response);
      return;
    }

    if (url.pathname === "/api/webhooks/stripe") {
      const response = await handleStripeWebhook(request, getDb());
      await pipeResponse(res, response);
      return;
    }

    if (url.pathname.startsWith("/api/webhooks/")) {
      const slug = url.pathname.slice("/api/webhooks/".length);
      if (slug && slug !== "stripe") {
        const response = await inboundWebhookHandler(request, slug);
        await pipeResponse(res, response);
        return;
      }
    }

    if (url.pathname === "/api/chat") {
      const response = await chatHandler(request);
      await pipeResponse(res, response);
      return;
    }

    if (url.pathname === "/api/connections/callback") {
      const response = await connectionsCallbackGet(request);
      await pipeResponse(res, response);
      return;
    }

    if (url.pathname === "/api/speech/transcribe") {
      const response = await speechHandler(request);
      await pipeResponse(res, response);
      return;
    }

    if (url.pathname === "/api/inngest") {
      const method = request.method.toUpperCase();
      const handler =
        method === "GET"
          ? inngestGet
          : method === "PUT"
            ? inngestPut
            : inngestPost;
      const response = await handler(request);
      await pipeResponse(res, response);
      return;
    }

    const response = await fetchRequestHandler({
      endpoint: TRPC_ENDPOINT,
      req: request,
      router: appRouter,
      createContext: () => createContext({ req: request }),
      onError({ error, path }) {
        const cause =
          (error.cause as { cause?: unknown } | undefined)?.cause ??
          error.cause;
        console.error(
          `[trpc] ${path ?? "<no-path>"}: ${error.message}`,
          cause ?? "",
        );
      },
    });
    await pipeResponse(res, response);
  } catch (err) {
    console.error("[backend] unhandled error:", err);
    if (!res.headersSent) res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(env.PORT);
console.log(`[backend] dev server listening on :${env.PORT}`);
