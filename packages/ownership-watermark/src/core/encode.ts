/**
 * Watermark encoder: DWT-DCT frequency-domain embedding with multi-lane blocks.
 *
 * The channel-coded payload is large enough that the old "one coefficient pair
 * per block" carrier would run out of capacity on representative chart cards, so each
 * 8x8 LL/DCT block now carries multiple signalling lanes (four by default).
 * Spreading the same payload over more mid-frequency pairs lets the runtime
 * lower each pair's amplitude, reducing visible carrier texture while keeping
 * enough aggregate soft-vote energy for the decoder. The raw payload bits are
 * first expanded by channelCodec.ts; this module only sees the channel-coded
 * bitstream and paints it into the image.
 */

import { bitSlotForBlock } from './blockMap';
import { CHANNEL_BIT_LENGTH } from './channelCodec';
import {
  imageDataToPlanes,
  planesToImageData,
  rgbaToYCbCr,
  yCbCrToRgba,
  type ImageLike,
} from './color';
import { dct8x8, idct8x8, DCT_BLOCK_SIZE } from './dct';
import { dwt2Haar, idwt2Haar } from './dwt';

export type SignalPair = {
  u1: number;
  v1: number;
  u2: number;
  v2: number;
  /** Encoder-only amplitude multiplier for default multi-lane carriers. */
  weight?: number;
};

export type EncodeOptions = {
  /**
   * Minimum magnitude of the modulated coefficient-pair difference. Typical
   * values: 4-8 for direct embedding. The React runtime's carrier texture is
   * generated at a much higher strength (currently 1300) because CSS opacity
   * attenuates it to ~2.5% before the screenshot reaches the decoder.
   */
  strength?: number;
  /**
   * Positions in the 8x8 DCT block to use as the signalling pair. Mid-frequency
   * diagonals survive JPEG's default luma quantisation table well.
   */
  pair?: SignalPair;
  /**
   * Multi-lane override. When omitted we use the default four-pair carrier that
   * the channel-coded payload is tuned for.
   */
  pairs?: SignalPair[];
};

/**
 * Signalling coefficient pairs. Chosen to sit on mid-frequency diagonals of
 * the 8x8 DCT with approximately equal JPEG luma quantisation within each
 * pair, so a Slack-recompressed JPEG degrades both coefficients by roughly
 * the same amount, preserving the sign of their difference. We deliberately
 * use four lanes with a 0.5 amplitude multiplier instead of two higher-
 * amplitude lanes, so the carrier energy is spread across more bases and reads
 * less like a repeated background texture without worsening direct-embed PSNR.
 *
 *   u=2, v=3 -> JPEG luma quant-table value 22
 *   u=3, v=2 -> JPEG luma quant-table value 24
 *   u=1, v=4 -> 22; u=4, v=1 -> 26
 *   u=2, v=4 -> 37; u=4, v=2 -> 40
 *   u=3, v=4 -> 56; u=4, v=3 -> 51
 */
const DEFAULT_PAIRS: SignalPair[] = [
  { u1: 2, v1: 3, u2: 3, v2: 2, weight: 0.5 },
  { u1: 1, v1: 4, u2: 4, v2: 1, weight: 0.5 },
  { u1: 2, v1: 4, u2: 4, v2: 2, weight: 0.5 },
  { u1: 3, v1: 4, u2: 4, v2: 3, weight: 0.5 },
];

/** Minimum image side (in CSS pixels) for the watermark to be embeddable at all. */
export const MIN_EMBED_SIZE = 32;
export const CHANNELS_PER_BLOCK = DEFAULT_PAIRS.length;

export function watermarkImage(
  image: ImageLike,
  payloadBits: Uint8Array,
  options: EncodeOptions = {},
): ImageLike {
  if (payloadBits.length !== CHANNEL_BIT_LENGTH) {
    throw new Error(
      `watermarkImage: expected ${CHANNEL_BIT_LENGTH}-bit channel payload, got ${payloadBits.length}`,
    );
  }
  if (image.width < MIN_EMBED_SIZE || image.height < MIN_EMBED_SIZE) {
    throw new Error(
      `watermarkImage: image too small (${image.width}x${image.height}), min ${MIN_EMBED_SIZE}`,
    );
  }

  const strength = options.strength ?? 8;
  const pairs = options.pairs ?? (options.pair ? [options.pair] : DEFAULT_PAIRS);

  const rgba = imageDataToPlanes(image);
  const ycc = rgbaToYCbCr(rgba);

  // DWT requires even dimensions; crop to even if necessary.
  const dw = ycc.width - (ycc.width % 2);
  const dh = ycc.height - (ycc.height % 2);
  const yCropped = cropPlane(ycc.y, ycc.width, ycc.height, dw, dh);

  const coeffs = dwt2Haar(yCropped, dw, dh);
  const llW = dw >> 1;
  const llH = dh >> 1;

  const blocksX = Math.floor(llW / DCT_BLOCK_SIZE);
  const blocksY = Math.floor(llH / DCT_BLOCK_SIZE);
  const totalBlocks = blocksX * blocksY;
  const totalSlots = totalBlocks * pairs.length;
  if (totalSlots < CHANNEL_BIT_LENGTH) {
    throw new Error(
      `watermarkImage: image yields only ${totalSlots} channel slots, need >= ${CHANNEL_BIT_LENGTH}`,
    );
  }

  const block = new Float64Array(DCT_BLOCK_SIZE * DCT_BLOCK_SIZE);
  const dctBlock = new Float64Array(DCT_BLOCK_SIZE * DCT_BLOCK_SIZE);
  const idctBlock = new Float64Array(DCT_BLOCK_SIZE * DCT_BLOCK_SIZE);

  for (let by = 0; by < blocksY; by += 1) {
    for (let bx = 0; bx < blocksX; bx += 1) {
      readBlock(coeffs.ll, llW, bx, by, block);
      dct8x8(block, dctBlock);
      for (const [lane, pair] of pairs.entries()) {
        const bit = payloadBits[bitSlotForBlock(bx, by, lane)];
        modulatePair(dctBlock, pair, bit, strength * (pair.weight ?? 1));
      }
      idct8x8(dctBlock, idctBlock);
      writeBlock(coeffs.ll, llW, bx, by, idctBlock);
    }
  }

  const yRebuilt = idwt2Haar(coeffs);
  pastePlane(ycc.y, ycc.width, ycc.height, yRebuilt, dw, dh);

  const rebuiltRgba = yCbCrToRgba(ycc);
  return planesToImageData(rebuiltRgba);
}

function cropPlane(
  src: Float64Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): Float64Array {
  if (dstW === srcW && dstH === srcH) {
    return src;
  }
  const out = new Float64Array(dstW * dstH);
  for (let y = 0; y < dstH; y += 1) {
    for (let x = 0; x < dstW; x += 1) {
      out[y * dstW + x] = src[y * srcW + x];
    }
  }
  return out;
}

function pastePlane(
  dst: Float64Array,
  dstW: number,
  dstH: number,
  src: Float64Array,
  srcW: number,
  srcH: number,
): void {
  const w = Math.min(dstW, srcW);
  const h = Math.min(dstH, srcH);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      dst[y * dstW + x] = src[y * srcW + x];
    }
  }
}

function readBlock(
  plane: Float64Array,
  planeW: number,
  bx: number,
  by: number,
  out: Float64Array,
): void {
  const x0 = bx * DCT_BLOCK_SIZE;
  const y0 = by * DCT_BLOCK_SIZE;
  for (let y = 0; y < DCT_BLOCK_SIZE; y += 1) {
    for (let x = 0; x < DCT_BLOCK_SIZE; x += 1) {
      out[y * DCT_BLOCK_SIZE + x] = plane[(y0 + y) * planeW + (x0 + x)];
    }
  }
}

function writeBlock(
  plane: Float64Array,
  planeW: number,
  bx: number,
  by: number,
  src: Float64Array,
): void {
  const x0 = bx * DCT_BLOCK_SIZE;
  const y0 = by * DCT_BLOCK_SIZE;
  for (let y = 0; y < DCT_BLOCK_SIZE; y += 1) {
    for (let x = 0; x < DCT_BLOCK_SIZE; x += 1) {
      plane[(y0 + y) * planeW + (x0 + x)] = src[y * DCT_BLOCK_SIZE + x];
    }
  }
}

/**
 * Koch-Zhao style modulation: adjust two mid-frequency coefficients so their
 * ordering encodes the bit, with a minimum gap of `strength`.
 *
 * If the host block already has the desired ordering and enough margin, leave
 * it untouched. That preserves chart texture in direct-embed use cases and
 * avoids paying visible distortion for signal the decoder already gets for
 * free.
 */
function modulatePair(
  dctBlock: Float64Array,
  pair: { u1: number; v1: number; u2: number; v2: number },
  bit: number,
  strength: number,
): void {
  const i1 = pair.v1 * DCT_BLOCK_SIZE + pair.u1;
  const i2 = pair.v2 * DCT_BLOCK_SIZE + pair.u2;
  const a = dctBlock[i1];
  const b = dctBlock[i2];
  const diff = a - b;
  if ((bit === 1 && diff >= strength) || (bit === 0 && diff <= -strength)) {
    return;
  }
  const avg = (a + b) * 0.5;
  const half = strength * 0.5;
  if (bit === 1) {
    // want a > b + strength
    dctBlock[i1] = avg + half;
    dctBlock[i2] = avg - half;
  } else {
    // want a < b - strength
    dctBlock[i1] = avg - half;
    dctBlock[i2] = avg + half;
  }
}
