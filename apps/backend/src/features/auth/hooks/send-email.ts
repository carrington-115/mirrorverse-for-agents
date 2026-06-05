import { env } from "@mirrorverse/env/backend";

import { sendEmailChangeEmail, sendOtpEmail } from "../../notifications/email";

interface SupabaseHookBody {
  user: {
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    email_action_type:
      | "signup"
      | "magiclink"
      | "recovery"
      | "invite"
      | "email_change_new"
      | "email_change_current";
    redirect_to?: string;
    new_email?: string;
  };
}

export async function handleSupabaseEmailHook(req: Request): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  const secret = env.SUPABASE_HOOK_SECRET;

  if (secret) {
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let body: SupabaseHookBody;
  try {
    body = (await req.json()) as SupabaseHookBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { user, email_data } = body;
  const { token, email_action_type, new_email } = email_data;

  try {
    switch (email_action_type) {
      case "signup":
      case "magiclink":
        await sendOtpEmail(user.email, token, email_action_type);
        break;
      case "email_change_new":
      case "email_change_current":
        await sendEmailChangeEmail(
          user.email,
          email_action_type,
          token,
          new_email,
        );
        break;
      default:
        // recovery / invite — not used in this app but let Supabase handle them
        break;
    }
  } catch (err) {
    console.error("[supabase-email-hook] failed to send email:", err);
    // Return 500 so Supabase retries
    return new Response("Email send failed", { status: 500 });
  }

  return Response.json({});
}
