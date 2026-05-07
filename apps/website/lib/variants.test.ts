import { describe, expect, it } from "vitest";
import { buttonVariants } from "./variants";

describe("buttonVariants", () => {
  it("applies filled+full defaults when no args given", () => {
    const cls = buttonVariants();
    expect(cls).toContain("rounded-full");
    expect(cls).toContain("bg-[var(--colors-black-70)]");
  });

  it("switches to outlined variant", () => {
    const cls = buttonVariants({ variant: "outlined" });
    expect(cls).toContain("outline");
    expect(cls).not.toContain("bg-[var(--colors-black-70)]");
  });

  it("switches to corner radius", () => {
    const cls = buttonVariants({ round: "corner" });
    expect(cls).toContain("rounded-[var(--radius-sm)]");
    expect(cls).not.toContain("rounded-full");
  });

  it("applies size modifiers", () => {
    expect(buttonVariants({ size: "sm" })).toContain("text-xs");
    expect(buttonVariants({ size: "medium" })).toContain("text-base");
  });
});
