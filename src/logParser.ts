import { incrementChatOutputTokens, incrementChatRequests, observeResponseLatency } from "./metrics";

const logRegexes = {
  chatModel: /\[debug\] chat model (.+)/i,
  requestId: /\[info\] ccreq:([\w\-\.]+)\.copilotmd/,
  completion: /\[info\] ccreq:([\w\-\.]+)\.copilotmd \| success \| (models\/)?(.+) \| (\d+)ms/,
  choice: /\[trace\] choice (\{.*\})/,
};

export class LogParser {
  private currentModel: string | undefined;
  private apiSource: string | undefined;
  private session: string;
  private window: string;

  constructor(session: string, window: string) {
    this.session = session;
    this.window = window;
  }

  /**
   * Processes a chunk of log data.
   * @param data The data chunk to process.
   */
  processLogData(data: string) {
    const lines = data.split("\n").filter((line) => line.trim() !== "");
    for (const line of lines) {
      this.processLogLine(line);
    }
  }

  /**
   * Processes a single line of log data to extract metrics.
   * @param line The log line to process.
   */
  processLogLine(line: string) {
    const chatModelMatch = line.match(logRegexes.chatModel);
    if (chatModelMatch) {
      const fullModelName = chatModelMatch[1];
      if (fullModelName.startsWith("models/")) {
        this.currentModel = fullModelName.substring(7);
        this.apiSource = "custom_key";
      } else {
        this.currentModel = fullModelName;
        this.apiSource = "copilot";
      }
      return;
    }

    const completionMatch = line.match(logRegexes.completion);
    if (completionMatch && this.currentModel && this.apiSource) {
      const model = completionMatch[3];
      const latencyMs = parseInt(completionMatch[4], 10);
      incrementChatRequests({ model, source: "copilot-chat", session: this.session, window: this.window, api_source: this.apiSource });
      observeResponseLatency({ model, source: "copilot-chat", session: this.session, window: this.window, api_source: this.apiSource }, latencyMs / 1000);
      // Reset currentModel after completion
      this.currentModel = undefined;
      this.apiSource = undefined;
      return;
    }

    const choiceMatch = line.match(logRegexes.choice);
    if (choiceMatch && this.currentModel && this.apiSource) {
      try {
        const choice = JSON.parse(choiceMatch[1]);
        if (choice.delta && typeof choice.delta.content === "string") {
          if (this.currentModel.startsWith("gpt")) {
            incrementChatOutputTokens({ model: this.currentModel, source: "copilot-chat", session: this.session, window: this.window, api_source: this.apiSource }, 1);
          } else {
            // Gemini streams chunks of text, so we count words as a proxy for tokens,
            // precise tokens would require an API Key to use the tokenizer
            // overall this should be a reasonable approximation
            incrementChatOutputTokens({ model: this.currentModel, source: "copilot-chat", session: this.session, window: this.window, api_source: this.apiSource }, choice.delta.content.split(/\s+/).length);
          }
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
  }
}
