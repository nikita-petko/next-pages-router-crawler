/**
 * Single-level 2D Haar Discrete Wavelet Transform and its inverse.
 *
 * Why Haar (not db4 like the Python reference)? Haar has the smallest support
 * (2 samples) so it introduces zero ringing artefacts when we modulate the
 * approximation sub-band. For JPEG-resilience the exact wavelet family doesn't
 * matter much — the DCT stage in the approximation sub-band is doing the heavy
 * lifting.
 *
 * Layout convention: the returned coeffs array packs the four sub-bands in a
 * quadrant grid of the original image size:
 *
 *   +----+----+
 *   | LL | HL |
 *   +----+----+
 *   | LH | HH |
 *   +----+----+
 *
 * Each sub-band is (width/2) x (height/2). Dimensions must be even; caller
 * is responsible for padding.
 */

export type DwtCoeffs = {
  /** Original width (sub-band width is width/2). */
  width: number;
  /** Original height (sub-band height is height/2). */
  height: number;
  /** Approximation (low-frequency) sub-band, row-major, (width/2)*(height/2). */
  ll: Float64Array;
  /** Horizontal details. */
  hl: Float64Array;
  /** Vertical details. */
  lh: Float64Array;
  /** Diagonal details. */
  hh: Float64Array;
};

const SQRT2_INV = 1 / Math.SQRT2;

export function dwt2Haar(input: Float64Array, width: number, height: number): DwtCoeffs {
  if (width % 2 !== 0 || height % 2 !== 0) {
    throw new Error(`dwt2Haar: width and height must be even (got ${width}x${height})`);
  }
  const hw = width >> 1;
  const hh = height >> 1;
  const ll = new Float64Array(hw * hh);
  const hl = new Float64Array(hw * hh);
  const lh = new Float64Array(hw * hh);
  const hhd = new Float64Array(hw * hh);

  for (let i = 0; i < hh; i += 1) {
    for (let j = 0; j < hw; j += 1) {
      const r0 = i * 2;
      const r1 = r0 + 1;
      const c0 = j * 2;
      const c1 = c0 + 1;
      const a = input[r0 * width + c0];
      const b = input[r0 * width + c1];
      const c = input[r1 * width + c0];
      const d = input[r1 * width + c1];
      const idx = i * hw + j;
      // Orthonormal Haar: factor 1/2 overall (SQRT2_INV twice).
      ll[idx] = (a + b + c + d) * 0.5;
      hl[idx] = (a - b + c - d) * 0.5;
      lh[idx] = (a + b - c - d) * 0.5;
      hhd[idx] = (a - b - c + d) * 0.5;
    }
  }

  return { width, height, ll, hl, lh, hh: hhd };
}

export function idwt2Haar(coeffs: DwtCoeffs): Float64Array {
  const { width, height, ll, hl, lh, hh } = coeffs;
  const hw = width >> 1;
  const hhh = height >> 1;
  const out = new Float64Array(width * height);

  for (let i = 0; i < hhh; i += 1) {
    for (let j = 0; j < hw; j += 1) {
      const idx = i * hw + j;
      const a = (ll[idx] + hl[idx] + lh[idx] + hh[idx]) * 0.5;
      const b = (ll[idx] - hl[idx] + lh[idx] - hh[idx]) * 0.5;
      const c = (ll[idx] + hl[idx] - lh[idx] - hh[idx]) * 0.5;
      const d = (ll[idx] - hl[idx] - lh[idx] + hh[idx]) * 0.5;
      const r0 = i * 2;
      const r1 = r0 + 1;
      const c0 = j * 2;
      const c1 = c0 + 1;
      out[r0 * width + c0] = a;
      out[r0 * width + c1] = b;
      out[r1 * width + c0] = c;
      out[r1 * width + c1] = d;
    }
  }

  return out;
}

/** Normalisation factor used by dwt2Haar (0.5 = SQRT2_INV * SQRT2_INV). Exported for tests. */
export const HAAR_NORM = SQRT2_INV * SQRT2_INV;
