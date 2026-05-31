import { env } from "@mirrorverse/env/backend";

import { authenticateRequest } from "../src/lib/auth.js";

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request): Promise<Response> {
  const user = await authenticateRequest(req);
  if (!user) return jsonError(401, "Authentication required");

  if (!env.ELEVENLABS_API_KEY) {
    return jsonError(503, "Speech-to-text not configured");
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return jsonError(400, "Invalid multipart body");
  }

  const audio = formData.get("audio");
  if (!audio || !(audio instanceof Blob)) {
    return jsonError(400, "Missing audio field");
  }

  const upstream = new FormData();
  upstream.append("file", audio, "recording.webm");
  upstream.append("model_id", "scribe_v1");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
    body: upstream,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (env.NODE_ENV === "development") {
      console.error(
        `[speech] elevenlabs ${response.status}: ${detail.slice(0, 200)}`,
      );
    }
    return jsonError(502, "Transcription failed");
  }

  const result = (await response.json()) as { text?: string };
  return new Response(JSON.stringify({ text: result.text ?? "" }), {
    headers: { "content-type": "application/json" },
  });
}
