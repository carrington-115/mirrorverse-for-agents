import { describe, expect, it } from "vitest";

import {
  AI_SLOT_NAMES,
  isAiSlotPort,
  matchesSlotPort,
} from "./connection-ports";

describe("isAiSlotPort", () => {
  it.each(AI_SLOT_NAMES)("returns true for bare slot port %s", (slot) => {
    expect(isAiSlotPort(slot)).toBe(true);
  });

  it.each(AI_SLOT_NAMES)("returns true for %s-in", (slot) => {
    expect(isAiSlotPort(`${slot}-in`)).toBe(true);
  });

  it.each(AI_SLOT_NAMES)("returns true for %s-out", (slot) => {
    expect(isAiSlotPort(`${slot}-out`)).toBe(true);
  });

  it.each(["main", "main-out", "true", "false", "0", "1"])(
    "returns false for non-AI-slot port %s",
    (port) => {
      expect(isAiSlotPort(port)).toBe(false);
    },
  );
});

describe("matchesSlotPort", () => {
  it("matches the bare slot name", () => {
    expect(matchesSlotPort("ai_languageModel", "ai_languageModel")).toBe(true);
  });

  it("matches the -in suffixed canvas-handle form", () => {
    expect(matchesSlotPort("ai_languageModel-in", "ai_languageModel")).toBe(
      true,
    );
  });

  it("matches the -out suffixed canvas-handle form", () => {
    expect(matchesSlotPort("ai_languageModel-out", "ai_languageModel")).toBe(
      true,
    );
  });

  it("does not match a different slot name", () => {
    expect(matchesSlotPort("ai_retriever-in", "ai_languageModel")).toBe(false);
  });

  it("does not match main-flow ports", () => {
    expect(matchesSlotPort("main", "ai_languageModel")).toBe(false);
  });
});
