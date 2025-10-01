// Utilidades para validar y preprocesar imágenes de dígitos

import type { InvertFlag } from '../types/predict';

function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen.'));
    };
    img.src = url;
  });
}

export async function validateIs28x28(file: File): Promise<void> {
  const img = await loadImage(file);
  if (img.width !== 28 || img.height !== 28) {
    throw new Error('La imagen debe ser exactamente 28x28 píxeles.');
  }
}

export async function analyzeImagePolarity(file: File): Promise<InvertFlag> {
  const img = await loadImage(file);

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    sum += (r + g + b) / 3;
  }
  const avg = sum / (data.length / 4);
  return avg < 128 ? 'true' : 'false'; // InvertFlag
}

function toGrayscaleAndMaybeInvert(
  imgData: ImageData,
  invert: InvertFlag
): ImageData {
  const d = imgData.data;
  const shouldInvert = invert === 'true';
  for (let i = 0; i < d.length; i += 4) {
    let gray = (d[i] + d[i + 1] + d[i + 2]) / 3;
    if (shouldInvert) gray = 255 - gray;
    d[i] = d[i + 1] = d[i + 2] = gray;
    d[i + 3] = 255;
  }
  return imgData;
}

function boxBlur3x3(ctx: CanvasRenderingContext2D, passes = 1) {
  const { width, height } = ctx.canvas;
  for (let p = 0; p < passes; p++) {
    const src = ctx.getImageData(0, 0, width, height);
    const dst = ctx.createImageData(width, height);
    const s = src.data,
      d = dst.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let acc = 0,
          count = 0;
        for (let j = -1; j <= 1; j++) {
          for (let i = -1; i <= 1; i++) {
            const nx = x + i,
              ny = y + j;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const k = (ny * width + nx) * 4;
            acc += s[k]; // gris (r=g=b)
            count++;
          }
        }
        const v = Math.round(acc / count);
        const k2 = (y * width + x) * 4;
        d[k2] = d[k2 + 1] = d[k2 + 2] = v;
        d[k2 + 3] = 255;
      }
    }
    ctx.putImageData(dst, 0, 0);
  }
}

function otsuThreshold(grayData: Uint8ClampedArray): number {
  const hist = new Array<number>(256).fill(0);
  // grayData viene de un ImageData ya en escala de grises (r=g=b)
  for (let i = 0; i < grayData.length; i += 4) hist[grayData[i]]++;

  const total = grayData.length / 4;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0,
    wB = 0,
    wF = 0,
    varMax = 0,
    threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > varMax) {
      varMax = between;
      threshold = t;
    }
  }
  return threshold;
}

function binarizeOtsu(ctx: CanvasRenderingContext2D): number {
  const { width, height } = ctx.canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;
  const thr = otsuThreshold(d);
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] < thr ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return thr;
}

function dilateBinary(ctx: CanvasRenderingContext2D, iterations = 1): void {
  const { width, height } = ctx.canvas;
  for (let it = 0; it < iterations; it++) {
    const src = ctx.getImageData(0, 0, width, height);
    const dst = ctx.createImageData(width, height);
    const s = src.data,
      d = dst.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let black = false;
        for (let j = -1; j <= 1 && !black; j++) {
          for (let i = -1; i <= 1 && !black; i++) {
            const nx = x + i,
              ny = y + j;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const k = (ny * width + nx) * 4;
            if (s[k] < 128) black = true; // vecino negro
          }
        }
        const k = (y * width + x) * 4;
        const v = black ? 0 : 255;
        d[k] = d[k + 1] = d[k + 2] = v;
        d[k + 3] = 255;
      }
    }
    ctx.putImageData(dst, 0, 0);
  }
}

function binarize(ctx: CanvasRenderingContext2D, threshold?: number): void {
  const { width, height } = ctx.canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const d = img.data;

  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += d[i]; // ya gris
  const mean = sum / (d.length / 4);
  const thr = typeof threshold === 'number' ? threshold : mean * 0.9;

  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] < thr ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  bw: number;
  bh: number;
};

/** Calcula el bounding box de pixeles “negros” (<128) de un canvas binarizado. */
function boundingBox(ctx: CanvasRenderingContext2D): BoundingBox | null {
  const { width: W, height: H } = ctx.canvas;
  const { data } = ctx.getImageData(0, 0, W, H);

  let minX = W,
    minY = H,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4;
      const v = data[k]; // 0 negro, 255 blanco
      if (v < 128) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) {
    return null; // ✅ sin 'as const'
  }
  return { minX, minY, maxX, maxY, bw: maxX - minX + 1, bh: maxY - minY + 1 };
}

function scaleToMax(
  canvasSrc: HTMLCanvasElement,
  targetMax = 20
): HTMLCanvasElement {
  const bw = canvasSrc.width;
  const bh = canvasSrc.height;
  const scale = targetMax / Math.max(bw, bh);

  const sw = Math.max(1, Math.round(bw * scale));
  const sh = Math.max(1, Math.round(bh * scale));

  const out = document.createElement('canvas');
  out.width = sw;
  out.height = sh;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(canvasSrc, 0, 0, bw, bh, 0, 0, sw, sh);
  return out;
}

function centroid(ctx: CanvasRenderingContext2D): { cx: number; cy: number } {
  const { width: W, height: H } = ctx.canvas;
  const { data } = ctx.getImageData(0, 0, W, H);
  let sx = 0,
    sy = 0,
    count = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4;
      const v = data[k];
      if (v < 128) {
        sx += x;
        sy += y;
        count++;
      }
    }
  }
  if (!count) return { cx: W / 2, cy: H / 2 };
  return { cx: sx / count, cy: sy / count };
}

/**
 * Preprocesa estilo MNIST y devuelve un PNG 28×28.
 */
export async function preprocessForMnist(
  file: File,
  invert: InvertFlag
): Promise<Blob> {
  const img = await loadImage(file);

  const base = document.createElement('canvas');
  base.width = img.width;
  base.height = img.height;
  const bctx = base.getContext('2d')!;
  bctx.drawImage(img, 0, 0);

  const gd = bctx.getImageData(0, 0, base.width, base.height);
  bctx.putImageData(toGrayscaleAndMaybeInvert(gd, invert), 0, 0);
  boxBlur3x3(bctx, 1);
  binarizeOtsu(bctx);

  // Bounding box con padding
  const bbox = boundingBox(bctx);
  if (!bbox) {
    const empty = document.createElement('canvas');
    empty.width = empty.height = 28;
    return await new Promise<Blob>((res) =>
      empty.toBlob((b) => res(b!), 'image/png')
    );
  }
  const pad = 2;
  const x0 = Math.max(0, bbox.minX - pad);
  const y0 = Math.max(0, bbox.minY - pad);
  const w = Math.min(base.width - x0, bbox.bw + pad * 2);
  const h = Math.min(base.height - y0, bbox.bh + pad * 2);

  const crop = document.createElement('canvas');
  crop.width = w;
  crop.height = h;
  const cctx = crop.getContext('2d')!;
  cctx.drawImage(
    base,
    x0,
    y0,
    w,
    h, // <-- usa el bbox con padding
    0,
    0,
    w,
    h
  );

  const scaled = scaleToMax(crop, 20);

  const out = document.createElement('canvas');
  out.width = out.height = 28;
  const octx = out.getContext('2d')!;
  octx.fillStyle = '#ffffff';
  octx.fillRect(0, 0, 28, 28);

  const sctx = scaled.getContext('2d')!;
  const { cx, cy } = centroid(sctx);
  const targetX = Math.round(14 - cx);
  const targetY = Math.round(14 - cy);
  octx.drawImage(scaled, targetX, targetY);

  return await new Promise<Blob>((res) =>
    out.toBlob((b) => res(b!), 'image/png')
  );
}
