import "dotenv/config";
import { app } from "./app";
import { logger } from "@utils/logger";
import { config } from "@config/index";
import * as Sentry from "@sentry/node";

const PORT = config.port || 3001;

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  Sentry.captureException(error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled Rejection:", reason);
  Sentry.captureException(reason);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${config.env} mode`);
  logger.info(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      // Close database connections
      // await prisma.$disconnect();
      // await redis.quit();

      logger.info("All connections closed. Exiting...");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      Sentry.captureException(error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
