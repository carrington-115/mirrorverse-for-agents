import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./error.js";

describe("AppError", () => {
  it("captures status code, message, and operational flag", () => {
    const err = new AppError(418, "I'm a teapot");
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("I'm a teapot");
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  it("can be marked non-operational", () => {
    const err = new AppError(500, "boom", false);
    expect(err.isOperational).toBe(false);
  });
});

describe("AppError subclasses", () => {
  it.each([
    [BadRequestError, 400, "Bad Request"],
    [UnauthorizedError, 401, "Unauthorized"],
    [ForbiddenError, 403, "Forbidden"],
    [NotFoundError, 404, "Resource not found"],
    [ConflictError, 409, "Conflict"],
    [ValidationError, 422, "Validation failed"],
    [InternalServerError, 500, "Internal server error"],
  ])("%p uses default status and message", (Cls, status, defaultMessage) => {
    const err = new Cls();
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(status);
    expect(err.message).toBe(defaultMessage);
  });

  it("accepts a custom message", () => {
    const err = new BadRequestError("missing field");
    expect(err.message).toBe("missing field");
    expect(err.statusCode).toBe(400);
  });
});
