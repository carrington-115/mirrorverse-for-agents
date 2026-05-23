import { env } from "@mirrorverse/env/backend";

const STORAGE_BASE = `${env.SUPABASE_URL}/storage/v1`;

const serviceHeaders = {
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  "Content-Type": "application/json",
};

/**
 * Generate a presigned upload URL so the client can PUT a file directly to
 * Supabase Storage without needing bucket RLS policies.
 */
export async function createSignedUploadUrl(
  bucket: string,
  key: string,
): Promise<string> {
  const endpoint = `${STORAGE_BASE}/object/upload/sign/${bucket}/${key}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: serviceHeaders,
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Storage upload-sign failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { url: string };
  return `${STORAGE_BASE}${data.url}`;
}

/**
 * Generate a Supabase Storage signed URL for a private object.
 * Needed because the Inngest function fetches PDFs by URL, not by storage key.
 */
export async function createSignedStorageUrl(
  bucket: string,
  key: string,
  expiresIn = 86_400,
): Promise<string> {
  const endpoint = `${STORAGE_BASE}/object/sign/${bucket}/${key}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: serviceHeaders,
    body: JSON.stringify({ expiresIn }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Storage sign failed (${res.status}): ${body}`);
  }
  const data = (await res.json()) as { signedURL: string };
  return `${STORAGE_BASE}${data.signedURL}`;
}
