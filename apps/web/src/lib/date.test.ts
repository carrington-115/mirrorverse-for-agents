import { describe, expect, it } from "vitest";
import { formatDate, formatTime } from "./date";

describe("formatDate", () => {
  it("returns ISO date portion (YYYY-MM-DD)", () => {
    const date = new Date(Date.UTC(2026, 4, 6, 12, 30, 0));
    expect(formatDate(date)).toBe("2026-05-06");
  });
});

describe("formatTime", () => {
  it("returns HH:MM portion of the time string", () => {
    const date = new Date(2026, 4, 6, 9, 5, 0);
    expect(formatTime(date)).toMatch(/^\d{2}:\d{2}$/);
  });
});
