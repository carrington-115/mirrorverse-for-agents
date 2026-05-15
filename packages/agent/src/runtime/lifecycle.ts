import { LOG_PREFIX } from "./constants";
import type { AgentLifecycleEvent } from "./types";

type LifecycleHandler = (event: AgentLifecycleEvent) => Promise<void> | void;

export function makeLifecycleEmitter(handler: LifecycleHandler | undefined) {
  if (!handler) {
    return async () => {
      // no-op when caller didn't subscribe
    };
  }
  return async (event: AgentLifecycleEvent): Promise<void> => {
    try {
      await handler(event);
    } catch (err) {
      console.error(`${LOG_PREFIX} lifecycle event handler failed:`, err);
    }
  };
}
