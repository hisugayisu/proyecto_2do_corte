export interface HistoryItem {
  id: string;
  ts: number;
  request: { invert: 'true' | 'false'; fileName: string; fileSize: number };
  response?: { predicted: number; probabilities?: number[] };
  error?: string;
}
