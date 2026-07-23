/**
 * 8x8 Discrete Cosine Transform (DCT-II) and its inverse.
 *
 * We pick 8x8 block size to match JPEG's own block size; this means mid-frequency
 * coefficients we modulate here are treated as a unit by JPEG's quantiser and
 * are not split across block boundaries during recompression.
 *
 * Implementation uses the direct O(N^2) formulation. For N=8 this is 64 muls
 * per output coefficient, or ~4K ops per block. Fast enough that hoisting to
 * WASM is not warranted until we watermark >=10 cards per paint.
 */

const N = 8;
const SQRT1_N = Math.sqrt(1 / N);
const SQRT2_N = Math.sqrt(2 / N);

const cosTable = buildCosTable();
const alpha = buildAlphaTable();

function buildCosTable(): Float64Array {
  const t = new Float64Array(N * N);
  for (let i = 0; i < N; i += 1) {
    for (let j = 0; j < N; j += 1) {
      t[i * N + j] = Math.cos(((2 * j + 1) * i * Math.PI) / (2 * N));
    }
  }
  return t;
}

function buildAlphaTable(): Float64Array {
  const a = new Float64Array(N);
  a[0] = SQRT1_N;
  for (let i = 1; i < N; i += 1) {
    a[i] = SQRT2_N;
  }
  return a;
}

/**
 * Forward 2D DCT-II on an 8x8 block. Input and output are both N*N length
 * Float64Array in row-major order.
 */
export function dct8x8(block: Float64Array, out: Float64Array): void {
  const tmp = new Float64Array(N * N);
  // rows
  for (let y = 0; y < N; y += 1) {
    for (let u = 0; u < N; u += 1) {
      let s = 0;
      for (let x = 0; x < N; x += 1) {
        s += block[y * N + x] * cosTable[u * N + x];
      }
      tmp[y * N + u] = s * alpha[u];
    }
  }
  // cols
  for (let u = 0; u < N; u += 1) {
    for (let v = 0; v < N; v += 1) {
      let s = 0;
      for (let y = 0; y < N; y += 1) {
        s += tmp[y * N + u] * cosTable[v * N + y];
      }
      out[v * N + u] = s * alpha[v];
    }
  }
}

/**
 * Inverse 2D DCT-II on an 8x8 block of coefficients. Exact inverse of dct8x8.
 */
export function idct8x8(coeffs: Float64Array, out: Float64Array): void {
  const tmp = new Float64Array(N * N);
  // cols
  for (let u = 0; u < N; u += 1) {
    for (let y = 0; y < N; y += 1) {
      let s = 0;
      for (let v = 0; v < N; v += 1) {
        s += alpha[v] * coeffs[v * N + u] * cosTable[v * N + y];
      }
      tmp[y * N + u] = s;
    }
  }
  // rows
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      let s = 0;
      for (let u = 0; u < N; u += 1) {
        s += alpha[u] * tmp[y * N + u] * cosTable[u * N + x];
      }
      out[y * N + x] = s;
    }
  }
}

export const DCT_BLOCK_SIZE = N;
