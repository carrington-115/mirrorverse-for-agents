import { describe, expect, it, beforeAll } from "vitest";

// Set a test encryption key before importing the module.
beforeAll(() => {
  process.env.VAULT_ENCRYPTION_KEY = "a".repeat(64);
  process.env.SKIP_ENV_VALIDATION = "true";
});

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a plaintext value", async () => {
    const { encryptSecret, decryptSecret } = await import("../encrypt");
    const plaintext = "super-secret-api-key-12345";
    const ciphertext = encryptSecret(plaintext);
    expect(ciphertext).not.toBe(plaintext);
    expect(decryptSecret(ciphertext)).toBe(plaintext);
  });

  it("produces different ciphertext each call (random IV)", async () => {
    const { encryptSecret } = await import("../encrypt");
    const a = encryptSecret("same");
    const b = encryptSecret("same");
    expect(a).not.toBe(b);
  });

  it("throws on tampered ciphertext", async () => {
    const { encryptSecret, decryptSecret } = await import("../encrypt");
    const ct = encryptSecret("value");
    const [iv, tag, data] = ct.split(":");
    const tampered = `${iv}:${tag}:${data}ff`;
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("throws on malformed ciphertext", async () => {
    const { decryptSecret } = await import("../encrypt");
    expect(() => decryptSecret("not-valid")).toThrow(
      "Invalid ciphertext format",
    );
  });
});
