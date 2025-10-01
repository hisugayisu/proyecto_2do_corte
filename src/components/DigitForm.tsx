// src/components/DigitForm.tsx
import { useEffect, useState } from 'react';
import { predict } from '../services/api';
import { validateIs28x28, analyzeImagePolarity } from '../utils/image';
import { pushHistory } from '../utils/storage';
import type { InvertFlag } from '../types/predict';
import { v4 as uuid } from 'uuid';
import UploadZone from './UploadZone';
import Canvas28 from './Canvas28';

// --- Componente de sugerencia de polaridad ---
function PolarityHint({
  file,
  onSuggest,
  onApply,
}: {
  file: File;
  onSuggest: (s: InvertFlag) => void;
  onApply: (s: InvertFlag) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<InvertFlag | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const s = await analyzeImagePolarity(file);
        if (!mounted) return;
        setSuggestion(s);
        onSuggest(s);
      } catch (e) {
        if (!mounted) return;
        const msg = e instanceof Error ? e.message : 'No se pudo analizar la polaridad';
        setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [file, onSuggest]);

  if (loading) return <p className="text-xs text-gray-500">Analizando polaridad…</p>;
  if (error) return <p className="text-xs text-red-600">{error}</p>;
  if (!suggestion) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
      <div className="mb-2">
        Sugerencia: <code>invert</code> ={' '}
        <span className="font-medium">{suggestion}</span>{' '}
        <span className="text-gray-500">(según contraste)</span>
      </div>
      <button
        type="button"
        onClick={() => onApply(suggestion)}
        className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-100"
      >
        Aplicar sugerencia
      </button>
    </div>
  );
}

// --- Tarjeta de resultado en la misma vista ---
function ResultCard({
  loading,
  error,
  predicted,
  probabilities,
}: {
  loading: boolean;
  error: string | null;
  predicted: number | null;
  probabilities?: number[];
}) {
  return (
    <aside className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">Resultado</h2>

      {loading && (
        <div className="text-sm text-gray-600">
          Procesando… <span className="animate-pulse">●</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && predicted !== null && (
        <div className="grid gap-3">
          <div className="text-2xl">
            Predicción:&nbsp;
            <span className="font-bold">{predicted}</span>
          </div>

          {probabilities && (
            <div className="grid gap-2">
              <p className="text-sm text-gray-600">Probabilidades</p>
              <div className="grid gap-1">
                {probabilities.map((p, i) => {
                  const pct = Math.max(0, Math.min(100, Math.round(p * 100)));
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 text-xs tabular-nums text-gray-600">{i}</div>
                      <div className="h-2 flex-1 rounded bg-gray-200">
                        <div
                          className="h-2 rounded bg-black"
                          style={{ width: `${pct}%` }}
                          aria-label={`Probabilidad ${i}: ${pct}%`}
                        />
                      </div>
                      <div className="w-12 text-right text-xs tabular-nums text-gray-600">
                        {pct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!probabilities && (
            <p className="text-sm text-gray-500">No se recibieron probabilidades.</p>
          )}
        </div>
      )}

      {!loading && !error && predicted === null && (
        <p className="text-sm text-gray-500">Sube o dibuja un dígito y presiona “Predecir”.</p>
      )}
    </aside>
  );
}

// --- Formulario principal con layout de 2 columnas ---
export default function DigitForm() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ predicted: number; probabilities?: number[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modo de invert
  const [invert, setInvert] = useState<InvertFlag>('false'); // manual
  const [invertMode, setInvertMode] = useState<'auto' | 'manual'>('auto');
  const [suggestion, setSuggestion] = useState<InvertFlag>('false');

  // Preprocesado frontend (recomendado)
  const [usePreprocess, setUsePreprocess] = useState(true);

  // Reset de estado al cambiar inputs
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [file, invert, invertMode, usePreprocess]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Sube un archivo o dibuja tu dígito.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Si no preprocesas, exige 28×28
      if (!usePreprocess) {
        await validateIs28x28(file);
      }

      const effectiveInvert: InvertFlag = invertMode === 'auto' ? suggestion : invert;

      const data = await predict({
        invert: effectiveInvert,
        image: file,
        preprocess: usePreprocess,
      });

      setResult(data);

      // Historial
      pushHistory({
        id: uuid(),
        ts: Date.now(),
        request: {
          invert: effectiveInvert,
          fileName: file.name,
          fileSize: file.size,
        },
        response: { predicted: data.predicted, probabilities: data.probabilities },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setError(msg);
      pushHistory({
        id: uuid(),
        ts: Date.now(),
        request: {
          invert: invertMode === 'auto' ? suggestion : invert,
          fileName: file?.name || 'N/A',
          fileSize: file?.size || 0,
        },
        error: msg,
      });
    } finally {
      setLoading(false);
    }
  }

  const showSuggestion = invertMode === 'auto' && file;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Columna izquierda: carga/dibujo y controles */}
      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl bg-white p-4 shadow">
        <div className="grid gap-3">
          <UploadZone
            onFile={(f: File) => setFile(f)}
            className="rounded-xl border border-dashed p-4 text-center"
          />
          <div className="text-center text-xs text-gray-500">— o dibuja —</div>
          <Canvas28
            onExport={(blob: Blob) => setFile(new File([blob], 'canvas.png', { type: 'image/png' }))}
            className="justify-self-center"
          />
        </div>

        {/* Invert auto / manual */}
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="invertMode"
                value="auto"
                checked={invertMode === 'auto'}
                onChange={() => setInvertMode('auto')}
              />
              <span>Invert automático</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="invertMode"
                value="manual"
                checked={invertMode === 'manual'}
                onChange={() => setInvertMode('manual')}
              />
              <span>Invert manual</span>
            </label>
          </div>

          {invertMode === 'manual' && (
            <label className="inline-flex items-center gap-2">
              <select
                className="rounded-md border px-2 py-1"
                value={invert}
                onChange={(e) => setInvert(e.target.value as InvertFlag)}
              >
                <option value="false">false (negro sobre blanco)</option>
                <option value="true">true (blanco sobre negro)</option>
              </select>
              <span className="text-sm text-gray-600">Valor de invert</span>
            </label>
          )}

          {showSuggestion && file && (
            <PolarityHint
              file={file}
              onSuggest={(s) => setSuggestion(s)}
              onApply={(s) => {
                setInvertMode('manual');
                setInvert(s);
              }}
            />
          )}
        </div>

        {/* Preprocesado */}
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={usePreprocess}
            onChange={(e) => setUsePreprocess(e.target.checked)}
          />
          <span>Mejorar imagen antes de enviar (recomendado)</span>
        </label>

        {/* Botón */}
        <button
          type="submit"
          disabled={loading || !file}
          aria-busy={loading}
          className="rounded-2xl bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Enviando…' : 'Predecir'}
        </button>

        {/* Mensaje de error inline (también se ve en la tarjeta) */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </form>

      {/* Columna derecha: resultado en vivo */}
      <ResultCard
        loading={loading}
        error={error}
        predicted={result ? result.predicted : null}
        probabilities={result?.probabilities}
      />
    </div>
  );
}
