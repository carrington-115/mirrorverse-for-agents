export function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export function formatTime(date: Date) {
  return date.toTimeString().slice(0, 5);
}
