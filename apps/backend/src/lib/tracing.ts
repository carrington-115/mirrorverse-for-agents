// This module MUST be imported before any other application code so the
// OTel TracerProvider is registered before any spans are created.
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export let spanProcessor: LangfuseSpanProcessor | null = null;

// LangfuseSpanProcessor reads LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY,
// and LANGFUSE_BASE_URL from env automatically — only instantiate when
// the keys are present so the app works without Langfuse configured.
if (process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY) {
  const processor = new LangfuseSpanProcessor();
  spanProcessor = processor;

  const provider = new NodeTracerProvider({ spanProcessors: [processor] });
  provider.register();

  console.log("[tracing] Langfuse OTel exporter registered");
}

export async function flushTracing(): Promise<void> {
  await spanProcessor?.forceFlush();
}
