import { describe, expect, it } from "vitest";

import { lintTemplateExpressions } from "./lint-template-expressions";

const NODE_TYPES = new Map<string, string>([
  ["agent_1", "ai.agent"],
  ["http_1", "core.http_request"],
]);

describe("lintTemplateExpressions", () => {
  it("returns no warnings for a string with no expressions", () => {
    expect(lintTemplateExpressions("plain text", NODE_TYPES)).toEqual([]);
  });

  it("returns no warnings for supported $json paths and op chains", () => {
    expect(lintTemplateExpressions("{{ $json.title }}", NODE_TYPES)).toEqual([]);
    expect(lintTemplateExpressions("{{ $json.text.split(',')[0].trim() }}", NODE_TYPES)).toEqual(
      [],
    );
  });

  it("returns no warnings for supported $('id').item.json expressions", () => {
    expect(
      lintTemplateExpressions("{{ $('agent_1').item.json.split('\\n')[0] }}", NODE_TYPES),
    ).toEqual([]);
  });

  it("returns no warnings for $env expressions", () => {
    expect(lintTemplateExpressions("{{ $env.API_KEY }}", NODE_TYPES)).toEqual([]);
  });

  it("warns when .output is used on a referenced ai.agent node", () => {
    expect(
      lintTemplateExpressions(
        "European History: {{ $('agent_1').item.json.output.split('\\n')[0] }}",
        NODE_TYPES,
      ),
    ).toEqual([`"agent_1" is an agent node; its output is the text itself — drop ".output".`]);
  });

  it("does not warn about .output for a non-agent node", () => {
    expect(lintTemplateExpressions("{{ $('http_1').item.json.output }}", NODE_TYPES)).toEqual([]);
  });

  it("warns about unsupported grammar (arithmetic, unknown root)", () => {
    expect(lintTemplateExpressions("{{ $json.a + 1 }}", NODE_TYPES)).toEqual([
      "Unsupported expression: {{ $json.a + 1 }}",
    ]);
    expect(lintTemplateExpressions("{{ $foo.bar }}", NODE_TYPES)).toEqual([
      "Unsupported expression: {{ $foo.bar }}",
    ]);
  });

  it("warns about an unknown method name", () => {
    expect(lintTemplateExpressions("{{ $json.text.foo() }}", NODE_TYPES)).toEqual([
      "Unsupported expression: {{ $json.text.foo() }}",
    ]);
  });

  it("reports one warning per offending expression", () => {
    expect(
      lintTemplateExpressions(
        "{{ $json.a + 1 }} and {{ $('agent_1').item.json.output }}",
        NODE_TYPES,
      ),
    ).toEqual([
      "Unsupported expression: {{ $json.a + 1 }}",
      `"agent_1" is an agent node; its output is the text itself — drop ".output".`,
    ]);
  });
});
