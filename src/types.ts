/**
 * Represents an active Copilot Chat session.
 */
export interface ChatSession {
  model: string;
  requestId: string;
  source: string;
  startTime: number;
  tokens: number;
  finishReason?: string;
}
