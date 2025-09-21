import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { LogParser } from "./logParser";

const watchedFiles = new Map<string, fs.FSWatcher>();
const fileSizes = new Map<string, number>();
const logParsers = new Map<string, LogParser>();

/**
 * Initializes the Copilot monitor, which finds and watches Copilot Chat log files.
 * It periodically scans for new log files and sets up file watchers.
 * @param context The extension context for managing disposables.
 */
export function initializeCopilotMonitor(context: vscode.ExtensionContext) {
  const scanInterval = setInterval(() => findAndWatchLogFiles(context), 15000);

  // Add the interval timer to subscriptions to be cleared on deactivation
  context.subscriptions.push({
    dispose: () => clearInterval(scanInterval),
  });

  findAndWatchLogFiles(context); // Perform an initial scan immediately on activation
}

/**
 * Finds Copilot Chat log files and starts watching them.
 * This function is designed to be called periodically.
 * Each new VS Code session creates a new dated log folder.
 * Each new window instance creates a new window* folder within that dated folder, so we need to scan periodically for new log files.
 * We look for the most recent dated folder containing at least one window* folder.
 * Then we look for Copilot Chat log files within those window* folders.
 * Finally, we set up file watchers on any new log files found.
 * @param context The extension context for managing disposables.
 */
function findAndWatchLogFiles(context: vscode.ExtensionContext) {
  const logsDirectory = getLogsDirectory();
  if (!logsDirectory || !fs.existsSync(logsDirectory)) {
    console.error("VS Code logs directory not found.");
    return;
  }

  const filesToWatch = findLogFiles(logsDirectory);
  if (filesToWatch.length === 0) {
    console.log("No Copilot Chat log files found.");
    return;
  }

  for (const filePath of filesToWatch) {
    watchLogFile(filePath, context);
  }
}

/**
 * Watches a log file for changes and processes new entries.
 * @param filePath The absolute path to the log file.
 * @param context The extension context for managing disposables.
 */
function watchLogFile(filePath: string, context: vscode.ExtensionContext) {
  if (watchedFiles.has(filePath)) {
    return; // Already watching this file
  }

  try {
    const { session, window } = extractSessionAndWindow(filePath);
    if (!session || !window) {
      console.error(`Could not extract session and window from path: ${filePath}`);
      return;
    }

    const parser = new LogParser(session, window);
    logParsers.set(filePath, parser);

    let currentSize = fs.statSync(filePath).size;
    fileSizes.set(filePath, currentSize);

    const watcher = fs.watch(filePath, (eventType) => {
      if (eventType === "change") {
        try {
          const newSize = fs.statSync(filePath).size;
          const lastSize = fileSizes.get(filePath) || 0;

          if (newSize > lastSize) {
            const stream = fs.createReadStream(filePath, {
              start: lastSize,
              end: newSize,
            });
            stream.on("data", (chunk) => parser.processLogData(chunk.toString("utf-8")));
          }
          fileSizes.set(filePath, newSize);
        } catch (error) {
          // File might have been deleted, stop watching
          unwatchLogFile(filePath);
        }
      }
    });

    watcher.on("error", () => {
      unwatchLogFile(filePath);
    });

    context.subscriptions.push({ dispose: () => unwatchLogFile(filePath) });
    watchedFiles.set(filePath, watcher);
    console.log(`Watching Copilot Chat log: ${filePath}`);
  } catch (error) {
    console.error(`Error watching file ${filePath}:`, error);
  }
}

/**
 * Stops watching a log file and cleans up resources.
 * @param filePath The path to the log file to stop watching.
 */
function unwatchLogFile(filePath: string) {
  const watcher = watchedFiles.get(filePath);
  if (watcher) {
    watcher.close();
    watchedFiles.delete(filePath);
    fileSizes.delete(filePath);
    logParsers.delete(filePath);
    console.log(`Stopped watching Copilot Chat log: ${filePath}`);
  }
}

/**
 * Gets the VS Code logs directory based on the operating system.
 * @returns The path to the logs directory, or an empty string if the OS is not supported.
 */
function getLogsDirectory(): string {
  const platform = process.platform;
  // TODO: Add a configuration setting for 'Code' vs 'Code - Insiders'
  const productName = "Code";

  switch (platform) {
    case "darwin": // macOS
      return path.join(os.homedir(), "Library", "Application Support", productName, "logs");
    case "linux":
      return path.join(os.homedir(), ".config", productName, "logs");
    case "win32": // Windows
      return path.join(process.env.APPDATA || "", productName, "logs");
    default:
      return "";
  }
}

/**
 * Searches for Copilot Chat log files in the given logs directory.
 * @param logsDirectory The root logs directory of VS Code.
 * @returns An array of absolute paths to found log files.
 */
function findLogFiles(logsDirectory: string): string[] {
  try {
    // Find the most recent date folder that contains at least one window* directory.
    const dateFolders = fs
      .readdirSync(logsDirectory, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory() && /^\d{8}T\d{6}$/.test(dirent.name))
      .map((dirent) => dirent.name)
      .sort()
      .reverse()
      .map((dateFolder) => path.join(logsDirectory, dateFolder));

    const searchRoot = dateFolders.find((folder) => fs.existsSync(folder) && fs.readdirSync(folder, { withFileTypes: true }).some((dirent) => dirent.isDirectory() && dirent.name.startsWith("window")));

    if (!searchRoot || !fs.existsSync(searchRoot)) {
      return [];
    }

    // Look for window* directories within the identified date folder
    const logFiles = fs
      .readdirSync(searchRoot, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory() && dirent.name.startsWith("window"))
      .map((dirent) => dirent.name)
      .map((folderName) => path.join(searchRoot, folderName, "exthost", "GitHub.copilot-chat", "GitHub Copilot Chat.log"))
      .filter((filePath) => fs.existsSync(filePath));
    return logFiles;
  } catch (error) {
    console.error("Error finding Copilot Chat log files:", error);
  }
  return [];
}

function extractSessionAndWindow(filePath: string): { session?: string; window?: string } {
  const parts = filePath.split(path.sep);
  // Expected path structure: .../logs/YYYYMMDDTHHMMSS/windowX/...
  const windowIndex = parts.findIndex((part) => part.startsWith("window"));
  if (windowIndex > 0 && windowIndex - 1 < parts.length) {
    const session = parts[windowIndex - 1];
    const window = parts[windowIndex];
    return { session, window };
  }
  return {};
}
