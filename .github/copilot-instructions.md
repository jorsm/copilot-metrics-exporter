# VS Code Copilot Chat Metrics Exporter: Project Instructions

## 1. High-Level Objective

Your primary task is to help me build a **VS Code extension in TypeScript** named `copilot-metrics-exporter`. The goal of this extension is to capture usage metrics from my interactions with the GitHub Copilot Chat feature within VS Code. These metrics will then be exposed on a local HTTP endpoint in a Prometheus-compatible format. The ultimate goal is to visualize this data in a Grafana dashboard.

## 2. Core Technologies & Dependencies

-   **Language:** TypeScript
-   **Environment:** VS Code Extension API
-   **Key Dependency:** `prom-client` for creating and managing Prometheus metrics.
-   **Built-in Node.js Modules:** `http` for creating the local server to expose metrics.

## 3. Proposed Project Structure

Please organize the code into the following files within the `src/` directory:

-   `extension.ts`: The main entry point. Handles extension activation (`activate`) and deactivation (`deactivate`). It will orchestrate the other modules.
-   `metrics.ts`: Defines and manages all Prometheus metrics using `prom-client`. It will export functions to initialize metrics and update their values.
-   `metricsServer.ts`: Contains the logic for the Node.js `http` server. It will expose a `/metrics` endpoint.
-   `copilotMonitor.ts`: Contains the logic for listening to Copilot Chat events and extracting the relevant data.

## 4. Detailed Implementation Plan

### Phase 1: Extension Setup (`extension.ts` and `package.json`)

1.  **`package.json` Configuration:**
    -   Set `"activationEvents": ["onStartupFinished"]`. This ensures the extension loads automatically when VS Code starts, so it's always ready to capture metrics.
    -   Add `prom-client` to the `dependencies`.
2.  **`extension.ts` Structure:**
    -   Implement the `activate(context: vscode.ExtensionContext)` and `deactivate()` functions.
    -   The `activate` function will be responsible for initializing the metrics, starting the HTTP server, and setting up the Copilot Chat event listener.
    -   The `deactivate` function will be responsible for stopping the HTTP server.

### Phase 2: Prometheus Integration (`metrics.ts` and `metricsServer.ts`)

1.  **Define Prometheus Metrics (`metrics.ts`):**
    -   Initialize a `prom-client.Registry`.
    -   Define the following core metrics. Use clear `help` text for each one.
        -   `copilot_chat_requests_total`: A `Counter` with labels: `model` (e.g., 'gpt-4'), `participant` (e.g., 'github.copilot'). This tracks the total number of chat requests.
        -   `copilot_chat_tokens_total`: A `Counter` with labels: `model`, `participant`, and `type` (`prompt` or `completion`). This tracks token consumption.
        -   `copilot_chat_response_latency_seconds`: A `Histogram` with labels: `model`, `participant`. This will measure the duration of chat responses.
    -   Register all metrics with the registry.
    -   Export functions to increment/observe these metrics.

2.  **Implement HTTP Server (`metricsServer.ts`):**
    -   Create a simple Node.js `http` server.
    -   It should listen on a configurable port (default to `9099`).
    -   Implement a single endpoint: `GET /metrics`.
    -   When this endpoint is requested, it should call a function from `metrics.ts` (e.g., `registry.metrics()`) and respond with the metrics payload.
    -   The response `Content-Type` header must be set to `text/plain; version=0.0.4`.
    -   Export `startMetricsServer()` and `stopMetricsServer()` functions.

### Phase 3: Copilot Chat Data Capture (`copilotMonitor.ts`)

This is the most critical part. We need to listen to chat events and extract the data.

1.  **Event Listener:**
    -   Use the `vscode.chat.onDidPerformUserAction` event. This is the official API for monitoring chat interactions.
    -   The listener for this event should be registered in the `activate` function and its disposable should be added to `context.subscriptions`.

2.  **Data Discovery and Extraction:**
    -   Inside the event listener, the `event` object is our source of data. The most valuable information is expected to be in `event.result.metadata`.
    -   **Crucial Step:** Your first implementation should simply `console.log(JSON.stringify(event, null, 2))` to the Debug Console. This will allow us to inspect the full object structure during a live debugging session.
    -   Based on the inspection, write defensive code to extract the following (these are hypotheses, the actual paths may differ):
        -   **Model Name:** Likely found in a property like `event.result.metadata.model` or similar.
        -   **Token Counts:** Look for an object like `event.result.metadata.tokens` containing `prompt` and `completion` values.
        -   **Participant ID:** Available directly from `event.participant`.
        -   **Latency:** Calculate this by recording `Date.now()` when the request starts and subtracting it from `Date.now()` inside the `onDidPerformUserAction` listener.

3.  **Update Metrics:**
    -   After extracting the data, call the exported functions from `metrics.ts` to update the corresponding Prometheus metrics with the correct labels.

## 5. Coding Style and Best Practices

-   Write clean, well-commented TypeScript.
-   Use `async/await` for all asynchronous operations.
-   Implement robust error handling using `try...catch` blocks, especially when accessing potentially non-existent properties on the `metadata` object.
-   Ensure all disposables (like event listeners) are properly managed in `context.subscriptions` to prevent memory leaks.