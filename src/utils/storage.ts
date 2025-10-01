import type { HistoryItem } from '../types/history';

const KEY = 'predict_history';

// Inserta al inicio, guarda máx. 200 para no crecer indefinidamente
export function pushHistory(item: HistoryItem) {
  const arr = getHistory();
  arr.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 200)));
}

// Lee el historial
export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}
