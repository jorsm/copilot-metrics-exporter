// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { initializeCopilotMonitor } from "./copilotMonitor";
import { startMetricsServer, stopMetricsServer } from "./metricsServer";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Start Prometheus metrics server
  startMetricsServer();

  // Initialize Copilot monitor (event listener)
  initializeCopilotMonitor(context);

  // (Optional) Register the default helloWorld command for now
  const disposable = vscode.commands.registerCommand("copilot-metrics-exporter.helloWorld", () => {
    vscode.window.showInformationMessage("Hello World from copilot-metrics-exporter!");
  });
  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
  stopMetricsServer();
}
