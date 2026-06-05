import { eq, getDb, schema } from "@mirrorverse/db";
import { env } from "@mirrorverse/env/backend";

export async function handleUnsubscribe(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const appUrl = env.APP_URL;

  if (!token) {
    return Response.redirect(`${appUrl}/sign-in`, 302);
  }

  let userId: string;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    // Token format: "<userId>:<JWT_SECRET>"
    const colonIdx = decoded.lastIndexOf(":");
    if (colonIdx === -1) throw new Error("invalid format");
    const [parsedUserId, secret] = [
      decoded.slice(0, colonIdx),
      decoded.slice(colonIdx + 1),
    ];
    if (secret !== env.JWT_SECRET) throw new Error("invalid secret");
    if (!parsedUserId) throw new Error("missing userId");
    userId = parsedUserId;
  } catch {
    return Response.redirect(`${appUrl}/sign-in`, 302);
  }

  try {
    const db = getDb();
    await db
      .update(schema.userProfiles)
      .set({ emailOptOut: true })
      .where(eq(schema.userProfiles.id, userId));
  } catch (err) {
    console.error("[unsubscribe] failed to set emailOptOut:", err);
  }

  return Response.redirect(`${appUrl}/sign-in?unsubscribed=1`, 302);
}
