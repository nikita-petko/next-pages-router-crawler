/**
 * Spatial block-to-channel-bit mapping used by both the encoder and decoder.
 *
 * Each 8x8 LL/DCT block now carries four signalling lanes (four distinct
 * coefficient pairs in encode.ts / decode.ts), so the mapping key is
 * `(bx, by, lane)` rather than just `(bx, by)`. The hash still has the same
 * crop-survival invariant as the earlier prototype: any integer crop offset in block
 * space becomes a constant cyclic rotation of the recovered channel-bit vector.
 */

import { CHANNEL_BIT_LENGTH } from './channelCodec';

/**
 * 31, 113, and 197 are all coprime with CHANNEL_BIT_LENGTH, so the affine
 * hash covers the full residue space cleanly instead of getting trapped in a
 * small cycle.
 */
export function bitSlotForBlock(bx: number, by: number, lane = 0): number {
  const h = bx * 31 + by * 113 + lane * 197;
  return ((h % CHANNEL_BIT_LENGTH) + CHANNEL_BIT_LENGTH) % CHANNEL_BIT_LENGTH;
}
