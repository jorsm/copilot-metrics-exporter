import { Counter, Histogram, Registry } from "prom-client";

// Create a new Prometheus Registry
export const registry = new Registry();

// Counter: Total Copilot Chat requests
export const copilotChatRequestsTotal = new Counter({
  name: "copilot_chat_requests_total",
  help: "Total number of Copilot Chat requests",
  labelNames: ["model", "source", "session", "window", "api_source"] as const,
  registers: [registry],
});

// Counter: Total Copilot Chat output tokens
export const copilotChatOutputTokensTotal = new Counter({
  name: "copilot_chat_output_tokens_total",
  help: "Total number of output tokens used in Copilot Chat responses",
  labelNames: ["model", "source", "session", "window", "api_source"] as const,
  registers: [registry],
});

// Histogram: Copilot Chat response latency (seconds)
export const copilotChatResponseLatencySeconds = new Histogram({
  name: "copilot_chat_response_latency_seconds",
  help: "Latency of Copilot Chat responses in seconds",
  labelNames: ["model", "source", "session", "window", "api_source"] as const,
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

// Functions to update metrics
export function incrementChatRequests(labels: { model: string; source: string; session: string; window: string; api_source: string }) {
  copilotChatRequestsTotal.inc(labels);
}

export function incrementChatOutputTokens(labels: { model: string; source: string; session: string; window: string; api_source: string }, tokens: number) {
  copilotChatOutputTokensTotal.inc(labels, tokens);
}

export function observeResponseLatency(labels: { model: string; source: string; session: string; window: string; api_source: string }, seconds: number) {
  copilotChatResponseLatencySeconds.observe(labels, seconds);
}
