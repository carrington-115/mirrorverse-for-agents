export async function sendSlackReview(
  webhookUrl: string,
  promptText: string,
  reviewUrl: string,
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `*Review required*\n${promptText}\n\n<${reviewUrl}|Review Now>`,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Slack webhook delivery failed: ${response.status} ${response.statusText}`,
    );
  }
}
