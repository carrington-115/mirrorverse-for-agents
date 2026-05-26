import type { UIMessage } from "ai";
import { AlertCircle, Brain, Lightbulb, PenLine, Sparkles, Wrench } from "lucide-react";
import { describe, expect, it } from "vitest";

import { buildCotTimeline, deriveCotPhase } from "./cot-timeline";

// UIMessagePart is a wide discriminated union; building exact literals fights
// the compiler without adding test value, so fixtures are loosely typed and
// cast once at the boundary.
type TestPart = Record<string, unknown>;
function msg(parts: TestPart[]): UIMessage {
  return { id: "m1", role: "assistant", parts: parts as unknown as UIMessage["parts"] };
}

describe("buildCotTimeline", () => {
  it("uses Sparkles for a standalone reasoning step (no following tool)", () => {
    const { steps, hasAny } = buildCotTimeline(msg([{ type: "reasoning", text: "thinking hard" }]));
    expect(hasAny).toBe(true);
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ kind: "reasoning", text: "thinking hard", icon: Sparkles });
  });

  it("uses Lightbulb when reasoning precedes submit_plan", () => {
    const { steps } = buildCotTimeline(
      msg([
        { type: "reasoning", text: "forming a plan" },
        { type: "tool-submit_plan", toolCallId: "t1", state: "input-available" },
      ]),
    );
    expect(steps[0]).toMatchObject({ kind: "reasoning", icon: Lightbulb });
  });

  it("uses PenLine when reasoning precedes workflow_commit", () => {
    const { steps } = buildCotTimeline(
      msg([
        { type: "reasoning", text: "drafting the workflow" },
        { type: "tool-workflow_commit", toolCallId: "t1", state: "input-available" },
      ]),
    );
    expect(steps[0]).toMatchObject({ kind: "reasoning", icon: PenLine });
  });

  it("uses Brain as fallback when reasoning precedes an unknown tool", () => {
    const { steps } = buildCotTimeline(
      msg([
        { type: "reasoning", text: "thinking" },
        { type: "tool-do_magic_thing", toolCallId: "t1", state: "input-available" },
      ]),
    );
    expect(steps[0]).toMatchObject({ kind: "reasoning", icon: Brain });
  });

  it("uses Sparkles for final reasoning after a completed tool (no further tool follows)", () => {
    const { steps } = buildCotTimeline(
      msg([
        { type: "tool-workflow_commit", toolCallId: "t1", state: "output-available", output: {} },
        { type: "reasoning", text: "summarising" },
      ]),
    );
    expect(steps[1]).toMatchObject({ kind: "reasoning", icon: Sparkles });
  });

  it("drops blank reasoning parts", () => {
    const { steps, hasAny } = buildCotTimeline(msg([{ type: "reasoning", text: "   " }]));
    expect(hasAny).toBe(false);
    expect(steps).toHaveLength(0);
  });

  it("maps a known tool to its label", () => {
    const { steps } = buildCotTimeline(
      msg([{ type: "tool-search_available_numbers", toolCallId: "t1", state: "input-available" }]),
    );
    expect(steps[0]).toMatchObject({
      kind: "acting",
      label: "Searching available numbers",
      status: "active",
    });
  });

  it.each([
    ["input-streaming", "active"],
    ["input-available", "active"],
    ["output-available", "complete"],
    ["output-error", "error"],
  ] as const)("derives status %s -> %s", (state, expected) => {
    const { steps } = buildCotTimeline(
      msg([{ type: "tool-provision_phone_number", toolCallId: "t1", state }]),
    );
    expect(steps[0]).toMatchObject({ kind: "acting", status: expected });
  });

  it("uses the alert icon for errored acting steps", () => {
    const { steps } = buildCotTimeline(
      msg([{ type: "tool-provision_phone_number", toolCallId: "t1", state: "output-error" }]),
    );
    expect(steps[0]).toMatchObject({ kind: "acting", icon: AlertCircle });
  });

  it("preserves chronological order across reasoning and acting", () => {
    const { steps } = buildCotTimeline(
      msg([
        { type: "reasoning", text: "first" },
        { type: "tool-workflow_commit", toolCallId: "t1", state: "output-available", output: {} },
        { type: "reasoning", text: "second" },
      ]),
    );
    expect(steps.map((s) => s.kind)).toEqual(["reasoning", "acting", "reasoning"]);
  });

  it("ignores text and step-start parts", () => {
    const { steps } = buildCotTimeline(
      msg([
        { type: "step-start" },
        { type: "text", text: "the answer" },
        { type: "reasoning", text: "r" },
      ]),
    );
    expect(steps).toHaveLength(1);
    expect(steps[0].kind).toBe("reasoning");
  });

  it("falls back to a humanized label and wrench icon for unknown tools", () => {
    const { steps } = buildCotTimeline(
      msg([{ type: "tool-do_magic_thing", toolCallId: "t1", state: "input-available" }]),
    );
    expect(steps[0]).toMatchObject({
      kind: "acting",
      label: "Do magic thing",
      icon: Wrench,
      status: "active",
    });
  });

  it("returns an empty timeline when there are no reasoning or tool parts", () => {
    const { steps, hasAny } = buildCotTimeline(msg([{ type: "text", text: "hi" }]));
    expect(hasAny).toBe(false);
    expect(steps).toHaveLength(0);
  });
});

describe("deriveCotPhase", () => {
  it("is done when the message is not live", () => {
    expect(deriveCotPhase(msg([{ type: "reasoning", text: "r" }]), false)).toBe("done");
  });

  it("is thinking when the last meaningful part is reasoning", () => {
    expect(deriveCotPhase(msg([{ type: "reasoning", text: "r" }]), true)).toBe("thinking");
  });

  it("is working when the last meaningful part is a tool", () => {
    const message = msg([
      { type: "tool-workflow_commit", toolCallId: "t1", state: "input-available" },
    ]);
    expect(deriveCotPhase(message, true)).toBe("working");
  });

  it("looks past a streaming answer to the preceding tool", () => {
    const message = msg([
      { type: "tool-workflow_commit", toolCallId: "t1", state: "output-available", output: {} },
      { type: "text", text: "answer" },
    ]);
    expect(deriveCotPhase(message, true)).toBe("working");
  });

  it("defaults to thinking when there are no reasoning or tool parts", () => {
    expect(deriveCotPhase(msg([{ type: "text", text: "hi" }]), true)).toBe("thinking");
  });
});
