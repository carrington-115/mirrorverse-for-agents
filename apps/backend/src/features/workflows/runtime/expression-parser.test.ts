import { describe, expect, it } from "vitest";

import {
  evaluateOperations,
  getPath,
  parseTemplateExpression,
} from "./expression-parser";

describe("parseTemplateExpression", () => {
  it("parses a bare $json root with empty path and ops", () => {
    expect(parseTemplateExpression("$json")).toEqual({
      root: { kind: "json" },
      path: "",
      ops: [],
    });
  });

  it("parses $json with a property/index path", () => {
    expect(parseTemplateExpression("$json.items[0].name")).toEqual({
      root: { kind: "json" },
      path: ".items[0].name",
      ops: [],
    });
  });

  it("parses a node reference with single or double quotes", () => {
    expect(parseTemplateExpression("$('agent_1').item.json.output")).toEqual({
      root: { kind: "nodeRef", nodeId: "agent_1" },
      path: ".output",
      ops: [],
    });
    expect(parseTemplateExpression('$("agent_1").item.json')).toEqual({
      root: { kind: "nodeRef", nodeId: "agent_1" },
      path: "",
      ops: [],
    });
  });

  it("parses $env.NAME with no path or ops", () => {
    expect(parseTemplateExpression("$env.API_KEY")).toEqual({
      root: { kind: "env", name: "API_KEY" },
      path: "",
      ops: [],
    });
  });

  it("rejects $env with a trailing path or op chain", () => {
    expect(parseTemplateExpression("$env.API_KEY.foo")).toBeNull();
    expect(parseTemplateExpression("$env.API_KEY.trim()")).toBeNull();
  });

  it("parses a single op call with a string argument", () => {
    expect(parseTemplateExpression("$json.text.split(',')")).toEqual({
      root: { kind: "json" },
      path: ".text",
      ops: [{ name: "split", args: [","] }],
    });
  });

  it("folds a trailing [N] after a call into an `at` op", () => {
    expect(parseTemplateExpression("$json.text.split('\n')[0]")).toEqual({
      root: { kind: "json" },
      path: ".text",
      ops: [
        { name: "split", args: ["\n"] },
        { name: "at", args: [0] },
      ],
    });
  });

  it("decodes \\n and \\t escapes in string literal args", () => {
    expect(parseTemplateExpression("$json.text.split('\\n')")).toEqual({
      root: { kind: "json" },
      path: ".text",
      ops: [{ name: "split", args: ["\n"] }],
    });
    expect(parseTemplateExpression("$json.text.split('\\t')")).toEqual({
      root: { kind: "json" },
      path: ".text",
      ops: [{ name: "split", args: ["\t"] }],
    });
  });

  it("parses no-arg ops", () => {
    expect(parseTemplateExpression("$json.text.trim()")).toEqual({
      root: { kind: "json" },
      path: ".text",
      ops: [{ name: "trim", args: [] }],
    });
    expect(parseTemplateExpression("$json.text.toUpperCase()")).toEqual({
      root: { kind: "json" },
      path: ".text",
      ops: [{ name: "toUpperCase", args: [] }],
    });
    expect(parseTemplateExpression("$json.text.toLowerCase()")).toEqual({
      root: { kind: "json" },
      path: ".text",
      ops: [{ name: "toLowerCase", args: [] }],
    });
  });

  it("parses slice with one or two numeric args, including negatives", () => {
    expect(parseTemplateExpression("$json.items.slice(1, 3)")).toEqual({
      root: { kind: "json" },
      path: ".items",
      ops: [{ name: "slice", args: [1, 3] }],
    });
    expect(parseTemplateExpression("$json.items.slice(2)")).toEqual({
      root: { kind: "json" },
      path: ".items",
      ops: [{ name: "slice", args: [2] }],
    });
    expect(parseTemplateExpression("$json.items.slice(-1)")).toEqual({
      root: { kind: "json" },
      path: ".items",
      ops: [{ name: "slice", args: [-1] }],
    });
  });

  it("parses join and replace", () => {
    expect(parseTemplateExpression("$json.items.join(', ')")).toEqual({
      root: { kind: "json" },
      path: ".items",
      ops: [{ name: "join", args: [", "] }],
    });
    expect(parseTemplateExpression("$json.text.replace('a', 'b')")).toEqual({
      root: { kind: "json" },
      path: ".text",
      ops: [{ name: "replace", args: ["a", "b"] }],
    });
  });

  it("parses chained op calls", () => {
    expect(
      parseTemplateExpression("$json.text.split(',')[0].trim().toUpperCase()"),
    ).toEqual({
      root: { kind: "json" },
      path: ".text",
      ops: [
        { name: "split", args: [","] },
        { name: "at", args: [0] },
        { name: "trim", args: [] },
        { name: "toUpperCase", args: [] },
      ],
    });
  });

  it("returns null for arithmetic or unrecognized roots", () => {
    expect(parseTemplateExpression("$json.a + 1")).toBeNull();
    expect(parseTemplateExpression("$foo.bar")).toBeNull();
    expect(parseTemplateExpression("1 + 1")).toBeNull();
  });

  it("returns null for an unknown method name", () => {
    expect(parseTemplateExpression("$json.text.foo()")).toBeNull();
  });

  it("returns null for malformed call syntax", () => {
    expect(parseTemplateExpression("$json.text.split('a'")).toBeNull();
    expect(parseTemplateExpression("$json.text.split(")).toBeNull();
    expect(
      parseTemplateExpression("$json.text.split('unterminated"),
    ).toBeNull();
  });

  it("returns null for path-style bracket access after an op chain", () => {
    expect(
      parseTemplateExpression("$json.text.split(',')[0][\"x\"]"),
    ).toBeNull();
  });
});

describe("getPath", () => {
  it("returns the object itself for an empty path", () => {
    expect(getPath({ a: 1 }, "")).toEqual({ a: 1 });
  });

  it("walks property and index tokens", () => {
    expect(getPath({ items: [{ name: "first" }] }, ".items[0].name")).toBe(
      "first",
    );
  });

  it("returns undefined when a segment isn't an object", () => {
    expect(getPath("a string", ".output")).toBeUndefined();
  });
});

describe("evaluateOperations", () => {
  it("returns the value unchanged for an empty op chain", () => {
    expect(evaluateOperations("hello", [])).toBe("hello");
  });

  it("split: splits a string on the given separator", () => {
    expect(
      evaluateOperations("a,b,c", [{ name: "split", args: [","] }]),
    ).toEqual(["a", "b", "c"]);
  });

  it("split: returns undefined for non-string input", () => {
    expect(
      evaluateOperations(42, [{ name: "split", args: [","] }]),
    ).toBeUndefined();
  });

  it("trim/toUpperCase/toLowerCase operate on strings", () => {
    expect(evaluateOperations("  Hi  ", [{ name: "trim", args: [] }])).toBe(
      "Hi",
    );
    expect(evaluateOperations("hi", [{ name: "toUpperCase", args: [] }])).toBe(
      "HI",
    );
    expect(evaluateOperations("HI", [{ name: "toLowerCase", args: [] }])).toBe(
      "hi",
    );
    expect(
      evaluateOperations(42, [{ name: "trim", args: [] }]),
    ).toBeUndefined();
  });

  it("slice works on strings and arrays, including negative indices", () => {
    expect(evaluateOperations("hello", [{ name: "slice", args: [1, 3] }])).toBe(
      "el",
    );
    expect(
      evaluateOperations([1, 2, 3], [{ name: "slice", args: [-1] }]),
    ).toEqual([3]);
    expect(
      evaluateOperations(42, [{ name: "slice", args: [0, 1] }]),
    ).toBeUndefined();
  });

  it("join: joins array elements with a separator", () => {
    expect(
      evaluateOperations(["a", "b"], [{ name: "join", args: [", "] }]),
    ).toBe("a, b");
    expect(evaluateOperations([1, 2], [{ name: "join", args: [","] }])).toBe(
      "1,2",
    );
    expect(
      evaluateOperations("not array", [{ name: "join", args: [","] }]),
    ).toBeUndefined();
  });

  it("replace: replaces all occurrences", () => {
    expect(
      evaluateOperations("a-b-c", [{ name: "replace", args: ["-", "_"] }]),
    ).toBe("a_b_c");
    expect(
      evaluateOperations(42, [{ name: "replace", args: ["a", "b"] }]),
    ).toBeUndefined();
  });

  it("at: indexes into strings and arrays, returns undefined out of range", () => {
    expect(evaluateOperations(["a", "b"], [{ name: "at", args: [1] }])).toBe(
      "b",
    );
    expect(evaluateOperations("ab", [{ name: "at", args: [1] }])).toBe("b");
    expect(
      evaluateOperations(["a"], [{ name: "at", args: [5] }]),
    ).toBeUndefined();
    expect(
      evaluateOperations(["a"], [{ name: "at", args: [-1] }]),
    ).toBeUndefined();
    expect(evaluateOperations(42, [{ name: "at", args: [0] }])).toBeUndefined();
  });

  it("short-circuits to undefined once a step yields undefined", () => {
    expect(
      evaluateOperations(42, [
        { name: "split", args: [","] },
        { name: "trim", args: [] },
      ]),
    ).toBeUndefined();
  });

  it("chains operations left-to-right", () => {
    expect(
      evaluateOperations("Some text\nMore text", [
        { name: "split", args: ["\n"] },
        { name: "at", args: [0] },
        { name: "toUpperCase", args: [] },
      ]),
    ).toBe("SOME TEXT");
  });
});
