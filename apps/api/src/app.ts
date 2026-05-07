import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import * as Sentry from "@sentry/node";

import { config } from "@config/index";
import { logger } from "@utils/logger";
import { errorMiddleware } from "@middleware/error.middleware";
import { loggingMiddleware } from "@middleware/logging.middleware";
import { rateLimitMiddleware } from "@middleware/ratelimit.middleware";

import apiV1Routes from "@api/index";
import { connectToDatabase } from "./database/connection.db";
import { monitoringMiddleware } from "./middleware/monitoring.middleware";

const app: Express = express();

// Initialize Sentry
if (config.sentry.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.env,
    tracesSampleRate: config.env === "production" ? 0.1 : 1.0,
  });
}

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression
app.use(compression());

// Logging
if (config.env !== "test") {
  app.use(
    morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }),
  );
}

if (config.env !== "test") {
  connectToDatabase();
}

app.use(loggingMiddleware);

// Monitoring
app.use(monitoringMiddleware);

// Rate limiting
app.use(rateLimitMiddleware);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
  });
});

// API Routes
app.use("/api/v1", apiV1Routes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Sentry error handler
if (config.sentry.dsn) {
  Sentry.setupExpressErrorHandler(app);
}

// Global error handler
app.use(errorMiddleware);

export { app };
