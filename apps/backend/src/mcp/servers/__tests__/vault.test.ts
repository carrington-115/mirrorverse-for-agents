import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";

beforeAll(() => {
  process.env.VAULT_ENCRYPTION_KEY = "b".repeat(64);
  process.env.SKIP_ENV_VALIDATION = "true";
});

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
};

function buildSelectChain(returnValue: unknown[]) {
  const chain: Record<string, unknown> = {};
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.limit = vi.fn(() => Promise.resolve(returnValue));
  return chain;
}

describe("vault server", () => {
  // The first import of the server module loads the whole runtime graph,
  // which can take several seconds on a loaded machine. Load it once here,
  // outside the 5s per-test timeout.
  beforeAll(async () => {
    process.env.SKIP_ENV_VALIDATION = "true";
    await import("../vault");
  }, 30_000);

  const ctx = { db: mockDb as never, workspaceId: "ws-1", userId: "u-1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("read_credential decrypts and returns stored value", async () => {
    const { encryptSecret } = await import("../../../lib/encrypt");
    const plaintext = "sk-live-abc123";
    const encrypted = encryptSecret(plaintext);

    mockDb.select.mockReturnValue(
      buildSelectChain([{ credentialEncrypted: encrypted }]),
    );

    const { vaultServer } = await import("../vault");
    const result = (await vaultServer.tools.read_credential.handler(
      { provider: "openai" },
      ctx,
    )) as { value: string };

    expect(result.value).toBe(plaintext);
  });

  it("read_credential throws NeedsAuthError when credential is absent", async () => {
    mockDb.select.mockReturnValue(buildSelectChain([]));

    const { vaultServer } = await import("../vault");
    const { NeedsAuthError } = await import("../../composio/dispatcher");

    await expect(
      vaultServer.tools.read_credential.handler({ provider: "stripe" }, ctx),
    ).rejects.toBeInstanceOf(NeedsAuthError);
  });

  it("write_credential inserts a new connection when none exists", async () => {
    // First select: mcpServers lookup; second select: existing connection lookup.
    mockDb.select
      .mockReturnValueOnce(buildSelectChain([{ id: "srv-vault" }]))
      .mockReturnValueOnce(buildSelectChain([]));
    mockDb.insert.mockReturnValue({ values: vi.fn(() => Promise.resolve()) });

    const { vaultServer } = await import("../vault");
    const result = (await vaultServer.tools.write_credential.handler(
      { provider: "openai", value: "sk-new-key" },
      ctx,
    )) as { ok: boolean };

    expect(result.ok).toBe(true);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("write_credential updates an existing connection", async () => {
    mockDb.select
      .mockReturnValueOnce(buildSelectChain([{ id: "srv-vault" }]))
      .mockReturnValueOnce(buildSelectChain([{ id: "conn-1" }]));

    const updateChain: Record<string, unknown> = {};
    updateChain.set = vi.fn(() => updateChain);
    updateChain.where = vi.fn(() => Promise.resolve());
    mockDb.update.mockReturnValue(updateChain);

    const { vaultServer } = await import("../vault");
    const result = (await vaultServer.tools.write_credential.handler(
      { provider: "openai", value: "sk-updated" },
      ctx,
    )) as { ok: boolean };

    expect(result.ok).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});
