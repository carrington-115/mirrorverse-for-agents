import type { JsonValue } from "@mirrorverse/types";
import type { InterpretResult } from "./types";

/** All trigger.* nodes simply expose the trigger payload as their output. */
export function interpretTrigger(triggerPayload: JsonValue): InterpretResult {
  return { output: triggerPayload, nextPorts: ["main"] };
}
