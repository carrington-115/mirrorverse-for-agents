import { describe, expect, it } from "vitest";

import { RunState } from "./run-state";

describe("RunState.resolveParams", () => {
  it("resolves a single {{ $json.path }} expression to its native type", () => {
    const state = new RunState();
    const resolved = state.resolveParams(
      { count: "{{ $json.count }}" },
      { count: 5 },
    );
    expect(resolved.count).toBe(5);
  });

  it("inlines {{ $json.path }} expressions within a larger string", () => {
    const state = new RunState();
    const resolved = state.resolveParams(
      { text: "New PR: {{ $json.title }}" },
      { title: "Fix bug" },
    );
    expect(resolved.text).toBe("New PR: Fix bug");
  });

  it("resolves {{ $env.NAME }} from workspace env vars", () => {
    const state = new RunState({ API_KEY: "secret123" });
    const resolved = state.resolveParams(
      { auth: "Bearer {{ $env.API_KEY }}" },
      null,
    );
    expect(resolved.auth).toBe("Bearer secret123");
  });

  it("resolves {{ $('nodeId').item.json.path }} against a prior node's output", () => {
    const state = new RunState();
    state.set("agent_1", { output: "Hello world" });

    const resolved = state.resolveParams(
      { text: "{{ $('agent_1').item.json.output }}" },
      null,
    );
    expect(resolved.text).toBe("Hello world");
  });

  it("resolves a single {{ $('nodeId').item.json }} expression to a plain-string node output", () => {
    const state = new RunState();
    state.set("agent_1", "European History summary");

    const resolved = state.resolveParams(
      { title: "{{ $('agent_1').item.json }}" },
      null,
    );
    expect(resolved.title).toBe("European History summary");
  });

  it("strips unresolved {{ }} expressions and records a warning", () => {
    const state = new RunState();
    state.set("agent_1", { output: "Some text\nMore text" });

    const resolved = state.resolveParams(
      {
        title:
          "European History: {{ $('agent_1').item.json.output.split('\\n')[0] }}",
      },
      null,
    );

    expect(resolved.title).toBe("European History: ");
    expect(state.drainWarnings()).toEqual([
      "Unresolved template expression: {{ $('agent_1').item.json.output.split('\\n')[0] }}",
    ]);
  });

  it("warns when referencing a node that has not executed", () => {
    const state = new RunState();

    const resolved = state.resolveParams(
      { text: "{{ $('missing_node').item.json.value }}" },
      null,
    );

    expect(resolved.text).toBeUndefined();
    expect(state.drainWarnings()).toEqual([
      'Template references unknown or not-yet-executed node "missing_node"',
    ]);
  });

  it("drainWarnings clears warnings after returning them", () => {
    const state = new RunState();
    state.resolveParams({ text: "{{ $('missing').item.json }}" }, null);

    expect(state.drainWarnings()).toHaveLength(1);
    expect(state.drainWarnings()).toEqual([]);
  });

  it("resolves a numeric array index in {{ $json.path }}", () => {
    const state = new RunState();
    const resolved = state.resolveParams(
      { text: "{{ $json.items[0].name }}" },
      { items: [{ name: "first" }, { name: "second" }] },
    );
    expect(resolved.text).toBe("first");
  });

  it("resolves a single {{ $json.path }} expression with an array index to its native type", () => {
    const state = new RunState();
    const resolved = state.resolveParams(
      { item: "{{ $json.items[1] }}" },
      { items: [{ name: "first" }, { name: "second" }] },
    );
    expect(resolved.item).toEqual({ name: "second" });
  });

  it("resolves a single-quoted bracket key alongside an array index", () => {
    const state = new RunState();
    const resolved = state.resolveParams(
      { text: "{{ $json['items'][0]['name'] }}" },
      { items: [{ name: "first" }] },
    );
    expect(resolved.text).toBe("first");
  });

  it("resolves an array index in {{ $('nodeId').item.json.path }}", () => {
    const state = new RunState();
    state.set("agent_1", { results: [{ title: "Alpha" }, { title: "Beta" }] });

    const resolved = state.resolveParams(
      { text: "First result: {{ $('agent_1').item.json.results[0].title }}" },
      null,
    );
    expect(resolved.text).toBe("First result: Alpha");
  });

  it("resolves nested objects and arrays recursively", () => {
    const state = new RunState();
    const resolved = state.resolveParams(
      {
        row: {
          caller: "{{ $json.from }}",
          tags: ["{{ $json.kind }}", "static"],
        },
      },
      { from: "+15551234567", kind: "inbound" },
    );
    expect(resolved.row).toEqual({
      caller: "+15551234567",
      tags: ["inbound", "static"],
    });
  });

  it("leaves non-string values untouched", () => {
    const state = new RunState();
    const resolved = state.resolveParams(
      { enabled: true, retries: 3, fallback: null },
      null,
    );
    expect(resolved).toEqual({ enabled: true, retries: 3, fallback: null });
  });
});
