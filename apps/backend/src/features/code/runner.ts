import type { JsonValue } from "@mirrorverse/types";
import { env } from "@mirrorverse/env/backend";
import { Sandbox } from "./e2b-client";
import { buildEgressPrelude, type SandboxPolicy } from "./policy";

export type CodeLanguage = "python" | "typescript";

export interface RunCodeInput {
  readonly language: CodeLanguage;
  readonly source: string;
  readonly inputs: JsonValue;
  readonly policy: SandboxPolicy;
}

export interface RunCodeResult {
  readonly output: JsonValue;
  readonly stderr: string;
  readonly exitCode: number;
  readonly durationMs: number;
}

const SANDBOX_COST_CENTS_PER_SECOND = 0.0225;

export function computeSandboxCostCents(durationMs: number): number {
  return Math.ceil((durationMs / 1000) * SANDBOX_COST_CENTS_PER_SECOND);
}

export async function runCode(input: RunCodeInput): Promise<RunCodeResult> {
  const apiKey = env.E2B_API_KEY;
  if (!apiKey) throw new Error("core.code: E2B_API_KEY is not configured");

  const sandbox = await Sandbox.create({
    apiKey,
    timeoutMs: input.policy.timeoutMs,
  });

  const startedAt = Date.now();

  try {
    const egressPrelude = buildEgressPrelude(
      input.language,
      input.policy.egressAllowlist,
    );
    const inputsPrelude = buildInputsPrelude(input.language, input.inputs);
    const combined = egressPrelude + inputsPrelude + input.source;

    const execution = await sandbox.runCode(combined, {
      language: input.language,
      timeoutMs: input.policy.timeoutMs,
    });

    const durationMs = Date.now() - startedAt;

    if (execution.error) {
      const stderr = execution.logs.stderr.join("\n");
      throw new Error(
        `core.code: execution failed — ${execution.error.name}: ${execution.error.value}\n${stderr}`.trim(),
      );
    }

    const stdout = execution.logs.stdout.join("\n");
    const stderr = execution.logs.stderr.join("\n");
    const output = parseOutput(stdout);

    return { output, stderr, exitCode: 0, durationMs };
  } finally {
    await sandbox.kill().catch(() => undefined);
  }
}

function buildInputsPrelude(language: CodeLanguage, inputs: JsonValue): string {
  const json = JSON.stringify(inputs);
  if (language === "python") {
    return `import json as _json\ninputs = _json.loads(${JSON.stringify(json)})\n`;
  }
  return `const inputs = ${json};\n`;
}

function parseOutput(stdout: string): JsonValue {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as JsonValue;
  } catch {
    return trimmed;
  }
}
