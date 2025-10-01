// Cliente de API para predicción de dígitos

import type { PredictRequest, PredictResponse } from '../types/predict';
import { preprocessForMnist } from '../utils/image';

// Endpoint
const ENDPOINT = 'http://ec2-54-81-142-28.compute-1.amazonaws.com:8080/predict';

// Helpers de tipado seguro

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asNumberArray(v: unknown): number[] | undefined {
  return Array.isArray(v) && v.every((x) => typeof x === 'number')
    ? (v as number[])
    : undefined;
}

/**
 * Normaliza distintas formas comunes de respuesta del servidor a PredictResponse.
 * Acepta payloads con claves como: predicted | prediction | digit | label,
 * y opcionalmente probabilities.
 */
function normalize(data: unknown): PredictResponse {
  if (!isRecord(data)) {
    throw new Error('Respuesta de API inválida (no es un objeto).');
  }

  const predictedLike =
    (data as any).predicted ??
    (data as any).prediction ??
    (data as any).digit ??
    (data as any).label;

  let predicted: number | undefined =
    typeof predictedLike === 'number' ? predictedLike : undefined;

  const probabilities = asNumberArray((data as any).probabilities);

  // Si no hay predicted pero sí probabilidades, usar el índice del máximo
  if (predicted === undefined && probabilities && probabilities.length > 0) {
    let maxIdx = 0;
    for (let i = 1; i < probabilities.length; i++) {
      if (probabilities[i] > probabilities[maxIdx]) maxIdx = i;
    }
    predicted = maxIdx;
  }

  if (typeof predicted !== 'number') {
    throw new Error('Respuesta de API sin campo de predicción válido.');
  }

  return { predicted, probabilities };
}

// API pública

/**
 * Envía una imagen para predicción. Si `preprocess` está activo, la imagen se
 * normaliza a estilo MNIST (28×28, centrada).
 */
export async function predict(
  req: PredictRequest & { preprocess?: boolean }
): Promise<PredictResponse> {
  // Preprocesar si se solicita
  let blobToSend: Blob | File = req.image;
  if (req.preprocess) {
    blobToSend = await preprocessForMnist(req.image, req.invert);
  }

  // Construir FormData
  const fd = new FormData();
  fd.append('invert', req.invert); // 'true' | 'false'
  fd.append('image', blobToSend, 'digit.png');

  // Hacer fetch con manejo de errores y fallback de parsing
  const res = await fetch(ENDPOINT, { method: 'POST', body: fd });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || 'Error en la predicción'}`);
  }

  // Intentar JSON; si falla, leer como texto y arrojar error informativo
  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    const text = await res.text().catch(() => '');
    throw new Error(
      text
        ? `Respuesta no JSON del servidor: ${text.slice(0, 500)}`
        : 'Respuesta no JSON del servidor.'
    );
  }

  return normalize(raw);
}
