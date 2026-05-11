export type LogLevel = "info" | "warn" | "error" | "debug";

export interface Logger {
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
  debug(msg: string, fields?: Record<string, unknown>): void;
}

export function makeLogger(requestId: string): Logger {
  const emit =
    (level: LogLevel) => (msg: string, fields?: Record<string, unknown>) => {
      const line = JSON.stringify({
        ts: new Date().toISOString(),
        level,
        requestId,
        msg,
        ...fields,
      });
      if (level === "error") console.error(line);
      else if (level === "warn") console.warn(line);
      else console.log(line);
    };
  return {
    info: emit("info"),
    warn: emit("warn"),
    error: emit("error"),
    debug: emit("debug"),
  };
}
