import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { verifyHmacSignature } from "./verify.js";

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyHmacSignature", () => {
  const secret = "test-secret-abc123";
  const body = JSON.stringify({ event: "test" });

  it("returns true for a correct signature", () => {
    const sig = sign(body, secret);
    expect(verifyHmacSignature(body, secret, sig)).toBe(true);
  });

  it("returns false for a tampered body", () => {
    const sig = sign(body, secret);
    expect(verifyHmacSignature(body + "x", secret, sig)).toBe(false);
  });

  it("returns false for a wrong secret", () => {
    const sig = sign(body, "wrong-secret");
    expect(verifyHmacSignature(body, secret, sig)).toBe(false);
  });

  it("returns false when header is null", () => {
    expect(verifyHmacSignature(body, secret, null)).toBe(false);
  });

  it("returns false for a mismatched-length header", () => {
    expect(verifyHmacSignature(body, secret, "short")).toBe(false);
  });
});
