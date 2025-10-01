import NavBar from '../components/NavBar';
import { useEffect, useState } from 'react';
import { getHistory } from '../utils/storage';
import type { HistoryItem } from '../types/history';

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => setItems(getHistory()), []);

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="mb-4 text-xl font-semibold">Historial de peticiones</h1>
        {items.length === 0 ? (
          <p className="text-sm text-gray-600">Sin registros todavía.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((h) => (
              <li key={h.id} className="rounded border bg-white p-3">
                <div className="text-xs text-gray-500">
                  {new Date(h.ts).toLocaleString()}
                </div>
                <div className="mt-1 text-sm">
                  <strong>invert:</strong> {h.request.invert} ·{' '}
                  <strong>archivo:</strong> {h.request.fileName} (
                  {h.request.fileSize} B)
                </div>
                {h.response ? (
                  <div className="mt-1">
                    ✅ Predicción: {h.response.predicted}
                  </div>
                ) : (
                  <div className="mt-1 text-red-600">❌ {h.error}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
