import { HTTPError } from "ky";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface BackendErrorBody {
  error?: string;
  code?: string;
  message?: string;
}

export async function toApiError(
  error: unknown,
  fallback = "Something went wrong",
): Promise<ApiError> {
  if (error instanceof ApiError) return error;

  if (error instanceof HTTPError) {
    let body: BackendErrorBody = {};
    try {
      body = (await error.response.clone().json()) as BackendErrorBody;
    } catch {
      // Response was not JSON — fall through with empty body.
    }
    const message = body.error ?? body.message ?? error.message ?? fallback;
    return new ApiError(message, error.response.status, body.code);
  }

  if (error instanceof Error) {
    return new ApiError(error.message || fallback, 0);
  }

  return new ApiError(fallback, 0);
}
