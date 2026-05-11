import { Buffer } from "node:buffer";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { env } from "@mirrorverse/env/backend";

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
  return new Request(url, { method, headers, body });
}

async function writeResponse(
  res: ServerResponse,
  response: Response,
): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const body = new Uint8Array(await response.arrayBuffer());
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const request = await toFetchRequest(req);
    const response = await fetchRequestHandler({
      endpoint: TRPC_ENDPOINT,
      req: request,
      router: appRouter,
      createContext: () => createContext({ req: request }),
      onError({ error, path }) {
        console.error(`[trpc] ${path ?? "<no-path>"}: ${error.message}`);
      },
    });
    await writeResponse(res, response);
  } catch (err) {
    console.error("[backend] unhandled error:", err);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
});

server.listen(env.PORT);
console.log(`[backend] tRPC dev server listening on :${env.PORT}`);
