import { Request, Response, NextFunction } from "express";

export const monitoringMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Metrics can be collected here with prom-client or PostHog
    // This middleware is a placeholder for custom monitoring logic
    if (duration > 1000) {
      console.warn(
        `Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`,
      );
    }
  });

  next();
};
