/**
 * Spatial block-to-channel-bit mapping used by both the encoder and decoder.
 *
 * Each 8x8 LL/DCT block now carries four signalling lanes (four distinct
 * coefficient pairs in encode.ts / decode.ts), so the mapping key is
 * `(bx, by, lane)` rather than just `(bx, by)`. The hash still has the same
 * crop-survival invariant as the earlier prototype: any integer crop offset in block
 * space becomes a constant cyclic rotation of the recovered channel-bit vector.
 *
 * The coefficients (218, 34, 197) are chosen to produce a blue-noise-like
 * spatial distribution: blocks mapping to the same channel bit are spread
 * far apart (avg minimum distance 8.06 vs 5.83 for the original 31/113),
 * reducing spatial correlation in the watermark pattern. Blue noise is
 * less perceptible to the human visual system than the structured or
 * correlated patterns produced by smaller coprime coefficients.
 */

import { CHANNEL_BIT_LENGTH } from './channelCodec';

/**
 * 218, 34, and 197 are all coprime with CHANNEL_BIT_LENGTH, so the affine
 * hash covers the full residue space cleanly instead of getting trapped in a
 * small cycle. The coefficients were chosen via search to maximize the
 * average minimum distance between blocks mapping to the same bit slot,
 * producing a blue-noise-like spatial distribution.
 */
export function bitSlotForBlock(bx: number, by: number, lane = 0): number {
  const h = bx * 218 + by * 34 + lane * 197;
  return ((h % CHANNEL_BIT_LENGTH) + CHANNEL_BIT_LENGTH) % CHANNEL_BIT_LENGTH;
}
