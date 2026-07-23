/**
 * Color-space conversion helpers used by the watermark encoder/decoder.
 *
 * We watermark only the luminance (Y) channel of BT.601 YCbCr because:
 *  - Human vision is far more sensitive to chroma than luma changes, so
 *    modulating Y at ~1-3% is less perceptible than modulating RGB directly.
 *  - JPEG quantises chroma at 2x the rate of luma, so chroma-embedded signals
 *    get destroyed first under recompression.
 *
 * All functions take/return Float64Array for numerical stability across the
 * DWT/DCT pipeline.
 */

export type RGBAPlanes = {
  width: number;
  height: number;
  /** 0..255 */
  r: Uint8ClampedArray;
  g: Uint8ClampedArray;
  b: Uint8ClampedArray;
  /** 0..255, preserved through the pipeline */
  a: Uint8ClampedArray;
};

export type YCbCrPlanes = {
  width: number;
  height: number;
  y: Float64Array;
  cb: Float64Array;
  cr: Float64Array;
  a: Uint8ClampedArray;
};

/**
 * Structural alias for browser ImageData. Declared explicitly so this module
 * can be consumed in environments that lack the ImageData constructor (e.g.
 * jsdom in unit tests). The browser's ImageData shape is assignable to this.
 */
export type ImageLike = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

export function imageDataToPlanes(image: ImageLike): RGBAPlanes {
  const n = image.width * image.height;
  const r = new Uint8ClampedArray(n);
  const g = new Uint8ClampedArray(n);
  const b = new Uint8ClampedArray(n);
  const a = new Uint8ClampedArray(n);
  const d = image.data;
  for (let i = 0; i < n; i += 1) {
    r[i] = d[i * 4];
    g[i] = d[i * 4 + 1];
    b[i] = d[i * 4 + 2];
    a[i] = d[i * 4 + 3];
  }
  return { width: image.width, height: image.height, r, g, b, a };
}

export function planesToImageData(planes: RGBAPlanes): ImageLike {
  const out = new Uint8ClampedArray(planes.width * planes.height * 4);
  const n = planes.width * planes.height;
  for (let i = 0; i < n; i += 1) {
    out[i * 4] = planes.r[i];
    out[i * 4 + 1] = planes.g[i];
    out[i * 4 + 2] = planes.b[i];
    out[i * 4 + 3] = planes.a[i];
  }
  return { width: planes.width, height: planes.height, data: out };
}

export function rgbaToYCbCr(planes: RGBAPlanes): YCbCrPlanes {
  const n = planes.width * planes.height;
  const y = new Float64Array(n);
  const cb = new Float64Array(n);
  const cr = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    const r = planes.r[i];
    const g = planes.g[i];
    const b = planes.b[i];
    // BT.601 full-range
    y[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    cb[i] = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    cr[i] = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  }
  return { width: planes.width, height: planes.height, y, cb, cr, a: planes.a };
}

export function yCbCrToRgba(ycc: YCbCrPlanes): RGBAPlanes {
  const n = ycc.width * ycc.height;
  const r = new Uint8ClampedArray(n);
  const g = new Uint8ClampedArray(n);
  const b = new Uint8ClampedArray(n);
  for (let i = 0; i < n; i += 1) {
    const yv = ycc.y[i];
    const cbv = ycc.cb[i] - 128;
    const crv = ycc.cr[i] - 128;
    r[i] = clamp255(yv + 1.402 * crv);
    g[i] = clamp255(yv - 0.344136 * cbv - 0.714136 * crv);
    b[i] = clamp255(yv + 1.772 * cbv);
  }
  return { width: ycc.width, height: ycc.height, r, g, b, a: ycc.a };
}

function clamp255(v: number): number {
  if (v < 0) {
    return 0;
  }
  if (v > 255) {
    return 255;
  }
  return v;
}
