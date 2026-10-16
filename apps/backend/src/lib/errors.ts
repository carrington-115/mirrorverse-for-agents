import { TRPCError } from "@trpc/server";

export const ErrCode = {
  Unauthorized: "UNAUTHORIZED",
  Forbidden: "FORBIDDEN",
  NotFound: "NOT_FOUND",
  BadInput: "BAD_INPUT",
  Conflict: "CONFLICT",
  QuotaExceeded: "QUOTA_EXCEEDED",
  PlanLimitReached: "PLAN_LIMIT_REACHED",
  RateLimited: "RATE_LIMITED",
  Internal: "INTERNAL",
} as const;
export type ErrCode = (typeof ErrCode)[keyof typeof ErrCode];

const TRPC_CODE: Record<ErrCode, TRPCError["code"]> = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  BAD_INPUT: "BAD_REQUEST",
  CONFLICT: "CONFLICT",
  QUOTA_EXCEEDED: "TOO_MANY_REQUESTS",
  PLAN_LIMIT_REACHED: "FORBIDDEN",
  RATE_LIMITED: "TOO_MANY_REQUESTS",
  INTERNAL: "INTERNAL_SERVER_ERROR",
};

// Optional machine-readable payload surfaced to clients as `data.details`
// (e.g. per-node deploy validation issues).
export type AppErrorDetails = Readonly<Record<string, unknown>>;

export class AppError extends Error {
  readonly appCode: ErrCode;
  readonly details: AppErrorDetails | null;
  constructor(code: ErrCode, message: string, details?: AppErrorDetails) {
    super(message);
    this.name = "AppError";
    this.appCode = code;
    this.details = details ?? null;
  }
}

export function appError(
  code: ErrCode,
  message: string,
  details?: AppErrorDetails,
): TRPCError {
  return new TRPCError({
    code: TRPC_CODE[code],
    message,
    cause: new AppError(code, message, details),
  });
}

export function appCodeFromCause(cause: unknown): ErrCode | null {
  return cause instanceof AppError ? cause.appCode : null;
}

export function appDetailsFromCause(cause: unknown): AppErrorDetails | null {
  return cause instanceof AppError ? cause.details : null;
}
