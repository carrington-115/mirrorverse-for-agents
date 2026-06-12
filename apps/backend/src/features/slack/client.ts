interface SlackPostMessageResponse {
  readonly ok: boolean;
  readonly error?: string;
}

export async function postSlackMessage(
  token: string,
  channel: string,
  text: string,
  threadTs?: string,
): Promise<void> {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      channel,
      text,
      ...(threadTs ? { thread_ts: threadTs } : {}),
    }),
  });

  const data = (await response.json()) as SlackPostMessageResponse;
  if (!response.ok || !data.ok) {
    throw new Error(
      `Slack chat.postMessage failed: ${data.error ?? response.statusText}`,
    );
  }
}
