# VS Code Copilot Chat Metrics Exporter: Project Instructions

## 1. High-Level Objective

Your primary task is to help me build a **VS Code extension in TypeScript** named `copilot-metrics-exporter`. The goal of this extension is to capture usage metrics from my interactions with the GitHub Copilot Chat feature within VS Code. These metrics will be exposed on a local HTTP endpoint in a Prometheus-compatible format, for visualization in Grafana.

**Important:** There is no public API for directly monitoring Copilot Chat events. Instead, we will extract metrics by reading and parsing Copilot Chat log files written by the extension itself.

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
-   `copilotMonitor.ts`: Contains the logic for discovering, reading, and parsing Copilot Chat log files to extract relevant data.

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

This is the most critical part. **There is no public API for monitoring Copilot Chat events.** Instead, we will extract metrics by reading and parsing Copilot Chat log files written by the extension.

#### Log Scraping Approach

1. **Log File Discovery:**
    - Copilot Chat logs are typically found in a path like `~/.config/Code/logs/<date>/window*/exthost/GitHub.copilot-chat/GitHub Copilot Chat.log`.
    - Multiple VS Code windows will create multiple `window*` folders, each with its own log file.
    - Some folders may be empty or missing the log file; always check for file existence before processing.
    - The extension should scan all recent `window*` folders for valid log files, prioritizing the most recent by date.

2. **Log File Monitoring:**
    - Log files may be rotated or deleted by VS Code/Copilot after a while. The extension should handle log file disappearance gracefully and re-scan periodically for new files.
    - Use file system watchers or polling to detect new log entries in real time.

3. **Data Extraction:**
    - Parse each new log entry (usually JSON lines) to extract relevant metrics:
        - **Model Name** (e.g., `gpt-4`)
        - **Token Counts** (prompt and completion)
        - **Participant ID**
        - **Latency** (if available, or calculate from timestamps)
    - Aggregate metrics across all active log files.

4. **Update Metrics:**
    - After extracting the data, call the exported functions from `metrics.ts` to update the corresponding Prometheus metrics with the correct labels.

5. **Robustness:**
    - Handle empty folders, missing files, and log rotation.
    - Support multiple VS Code windows by monitoring all relevant log files.

## 5. Coding Style and Best Practices

-   Write clean, well-commented TypeScript.
-   Use `async/await` for all asynchronous operations.
-   Implement robust error handling using `try...catch` blocks, especially when reading/parsing log files and extracting properties.
-   Ensure all file watchers or timers are properly disposed in `context.subscriptions` to prevent memory leaks.