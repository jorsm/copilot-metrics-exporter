# Copilot Metrics Exporter

> **⚠️ Experimental Project:** This extension is highly experimental and relies on scraping internal VS Code log files. The log format can change at any time, which may cause this extension to break. Use at your own risk.

Monitor and analyze your GitHub Copilot Chat usage directly in VS Code!\
**Copilot Metrics Exporter** is a VS Code extension that scrapes Copilot Chat logs, extracts detailed usage metrics (token counts, model names, response latency, and more), and exposes them on a local Prometheus-compatible endpoint for visualization in Grafana.

***

## 🚀 Features

* **Automatic Metrics Collection:**\
  Parses Copilot Chat log files—no API keys or external services required.
* **Prometheus Integration:**\
  Metrics are served at [`http://localhost:9099/metrics`](http://localhost:9099/metrics).
* **Grafana Ready:**\
  Visualize trends, model usage, and latency with your own dashboards.
* **Multi-Window & Log Rotation Support:**\
  Handles multiple VS Code windows and log file changes seamlessly.
* **Privacy First:**\
  All processing and metrics stay local—no data leaves your machine.

***

## 📊 Metrics Collected

* **copilot\_chat\_requests\_total**\
  Total Copilot Chat requests, labeled by model, session, window, and API source.
* **copilot\_chat\_output\_tokens\_total**\
  Total output tokens generated, labeled by model, session, window, and API source.
* **copilot\_chat\_response\_latency\_seconds**\
  Histogram of response times (seconds), labeled by model, session, window, and API source.

***

## 🛠️ How It Works

1. **Log Scraping:**\
   Scans your VS Code log folders for Copilot Chat logs (e.g., `~/.config/Code/logs/<date>/window*/exthost/GitHub.copilot-chat/GitHub Copilot Chat.log`).
2. **Real-Time Monitoring:**\
   Watches all active log files for new entries, handling log rotation and multiple windows.
3. **Data Extraction:**\
   Parses log lines to extract model name, token counts, finish reason, and latency.
   * Supports both GPT (streams tokens) and Gemini (streams text chunks) models.
   * Handles differences in log structure for accurate metrics.
4. **Metrics Export:**\
   Updates Prometheus metrics, served at `/metrics` on port 9099.

***

## 📦 Project Structure

* [`src/extension.ts`](src/extension.ts): Extension activation/deactivation.
* [`src/metrics.ts`](src/metrics.ts): Prometheus metric definitions and update helpers.
* [`src/metricsServer.ts`](src/metricsServer.ts): HTTP server for `/metrics`.
* [`src/copilotMonitor.ts`](src/copilotMonitor.ts): Log file discovery, monitoring, and watcher logic.
* [`src/logParser.ts`](src/logParser.ts): Log line parsing and metric extraction.
* [`src/types.ts`](src/types.ts): Type definitions for chat sessions and metrics.

***

## ⚡ Getting Started

1. **Install dependencies:**

   ```sh
   npm install
   ```

2. **Build the extension:**

   ```sh
   npm run compile
   ```

3. **Launch in VS Code:**
   * Press `F5` in VS Code to open a new Extension Development Host window.

4. **Access metrics:**
   * Visit <http://localhost:9099/metrics> to see Prometheus metrics.

***

## 📈 Visualize in Grafana

1. Add your local Prometheus as a data source in Grafana.
2. Create dashboards using:
   * `copilot_chat_requests_total`
   * `copilot_chat_output_tokens_total`
   * `copilot_chat_response_latency_seconds`

***

## 🛡️ Privacy & Security

* All metrics are collected and served **locally**.
* No chat content or personal data is transmitted externally.

***

## 📝 License

MIT

***

## 🙏 Acknowledgements

* [prom-client](https://github.com/siimon/prom-client)
* [VS Code Extension API](https://code.visualstudio.com/api)
