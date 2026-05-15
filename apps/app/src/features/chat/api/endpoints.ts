export function chatStreamUrl(sessionId: string): string {
  return `/api/v1/chat/stream?sessionId=${encodeURIComponent(sessionId)}`;
}
