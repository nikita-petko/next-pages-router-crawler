/**
 * Channel coding for the ownership watermark.
 *
 * We keep the decoded payload shape in `payload.ts` versioned and
 * human-readable. This module expands the compact v3 opaque payload bitstream
 * into the longer channel bitstream that the DWT/DCT carrier actually embeds.
 * The old "raw bits + pure repetition" strategy did not provide enough margin
 * on small chart surfaces, so we now:
 *
 *   1. encode the raw payload with a shortened Hamming(15,11) block code
 *   2. interleave the resulting code bits with a coprime multiplicative
 *      permutation so local chart chrome / crop damage spreads across many
 *      codewords instead of wiping out one contiguous block
 *
 * Representative sizing:
 *   - raw payload-v3:      PAYLOAD_BIT_LENGTH bits
 *   - Hamming(15,11):      ceil(PAYLOAD_BIT_LENGTH / 11) codewords
 *   - channel bit length:  CHANNEL_CODEWORD_COUNT * 15 bits
 *
 * Combined with the four-lane carrier in encode.ts/decode.ts, a 480x320
 * surface yields 600 blocks -> 2400 channel slots. That gives enough vote
 * diversity to lower per-lane amplitude while the
 * ECC + interleaver keep crop/chrome damage recoverable.
 */
import { PAYLOAD_BIT_LENGTH } from './payload';

export const HAMMING_DATA_BITS = 11;
export const HAMMING_CODEWORD_BITS = 15;
export const CHANNEL_CODEWORD_COUNT = Math.ceil(PAYLOAD_BIT_LENGTH / HAMMING_DATA_BITS);
export const CHANNEL_BIT_LENGTH = CHANNEL_CODEWORD_COUNT * HAMMING_CODEWORD_BITS;

/**
 * Multiplicative permutation used for spatial interleaving. Must be coprime
 * with CHANNEL_BIT_LENGTH so it forms a full permutation.
 */
export const CHANNEL_INTERLEAVER_STRIDE = 149;

const HAMMING_PARITY_POSITIONS = [1, 2, 4, 8] as const;
const HAMMING_DATA_POSITIONS = [3, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15] as const;

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
}

function assertBitArrayLength(
  name: string,
  bits: ArrayLike<number>,
  expected: number,
): asserts bits is ArrayLike<number> {
  if (bits.length !== expected) {
    throw new Error(`${name}: expected ${expected} bits, got ${bits.length}`);
  }
}

function assertInterleaverInvariant(): void {
  if (gcd(CHANNEL_INTERLEAVER_STRIDE, CHANNEL_BIT_LENGTH) !== 1) {
    throw new Error(
      `CHANNEL_INTERLEAVER_STRIDE=${CHANNEL_INTERLEAVER_STRIDE} must be coprime with CHANNEL_BIT_LENGTH=${CHANNEL_BIT_LENGTH}`,
    );
  }
}

assertInterleaverInvariant();

function multiplicativeInverse(value: number, modulus: number): number {
  for (let candidate = 1; candidate < modulus; candidate += 1) {
    if ((value * candidate) % modulus === 1) {
      return candidate;
    }
  }
  throw new Error(`multiplicativeInverse: no inverse for ${value} mod ${modulus}`);
}

const CHANNEL_DEINTERLEAVER_STRIDE = multiplicativeInverse(
  CHANNEL_INTERLEAVER_STRIDE,
  CHANNEL_BIT_LENGTH,
);

function writeCodewordDataBits(out: Uint8Array, offset: number, dataBits: ArrayLike<number>): void {
  for (const [i, dataPosition] of HAMMING_DATA_POSITIONS.entries()) {
    const pos = dataPosition - 1;
    out[offset + pos] = dataBits[i] & 1;
  }
}

function fillParityBits(codeword: Uint8Array, offset: number): void {
  for (const parityPos of HAMMING_PARITY_POSITIONS) {
    let parity = 0;
    for (let pos = 1; pos <= HAMMING_CODEWORD_BITS; pos += 1) {
      if (pos === parityPos) {
        continue;
      }
      if ((pos & parityPos) === 0) {
        continue;
      }
      parity ^= codeword[offset + pos - 1] & 1;
    }
    codeword[offset + parityPos - 1] = parity;
  }
}

function interleaveIndex(index: number): number {
  return (index * CHANNEL_INTERLEAVER_STRIDE) % CHANNEL_BIT_LENGTH;
}

function deinterleaveIndex(index: number): number {
  return (index * CHANNEL_DEINTERLEAVER_STRIDE) % CHANNEL_BIT_LENGTH;
}

export function encodeChannelBits(rawPayloadBits: ArrayLike<number>): Uint8Array {
  assertBitArrayLength('encodeChannelBits', rawPayloadBits, PAYLOAD_BIT_LENGTH);
  const padded = new Uint8Array(CHANNEL_CODEWORD_COUNT * HAMMING_DATA_BITS);
  for (let i = 0; i < rawPayloadBits.length; i += 1) {
    padded[i] = rawPayloadBits[i] & 1;
  }

  const encoded = new Uint8Array(CHANNEL_BIT_LENGTH);
  for (let cw = 0; cw < CHANNEL_CODEWORD_COUNT; cw += 1) {
    const dataStart = cw * HAMMING_DATA_BITS;
    const codeStart = cw * HAMMING_CODEWORD_BITS;
    writeCodewordDataBits(
      encoded,
      codeStart,
      padded.slice(dataStart, dataStart + HAMMING_DATA_BITS),
    );
    fillParityBits(encoded, codeStart);
  }

  const interleaved = new Uint8Array(CHANNEL_BIT_LENGTH);
  for (let i = 0; i < CHANNEL_BIT_LENGTH; i += 1) {
    interleaved[interleaveIndex(i)] = encoded[i] & 1;
  }
  return interleaved;
}

export type DecodeChannelBitsResult = {
  rawPayloadBits: Uint8Array;
  correctedCodewords: number;
};

function computeSyndrome(codeword: Uint8Array, offset: number): number {
  let syndrome = 0;
  for (const parityPos of HAMMING_PARITY_POSITIONS) {
    let parity = 0;
    for (let pos = 1; pos <= HAMMING_CODEWORD_BITS; pos += 1) {
      if ((pos & parityPos) === 0) {
        continue;
      }
      parity ^= codeword[offset + pos - 1] & 1;
    }
    if (parity !== 0) {
      syndrome |= parityPos;
    }
  }
  return syndrome;
}

export function decodeChannelBits(channelBits: ArrayLike<number>): DecodeChannelBitsResult {
  assertBitArrayLength('decodeChannelBits', channelBits, CHANNEL_BIT_LENGTH);

  const deinterleaved = new Uint8Array(CHANNEL_BIT_LENGTH);
  for (let i = 0; i < CHANNEL_BIT_LENGTH; i += 1) {
    deinterleaved[deinterleaveIndex(i)] = channelBits[i] & 1;
  }

  const rawPayloadBits = new Uint8Array(CHANNEL_CODEWORD_COUNT * HAMMING_DATA_BITS);
  let correctedCodewords = 0;

  for (let cw = 0; cw < CHANNEL_CODEWORD_COUNT; cw += 1) {
    const codeStart = cw * HAMMING_CODEWORD_BITS;
    const syndrome = computeSyndrome(deinterleaved, codeStart);
    if (syndrome > 0 && syndrome <= HAMMING_CODEWORD_BITS) {
      deinterleaved[codeStart + syndrome - 1] ^= 1;
      correctedCodewords += 1;
    }

    const dataStart = cw * HAMMING_DATA_BITS;
    for (const [i, dataPosition] of HAMMING_DATA_POSITIONS.entries()) {
      rawPayloadBits[dataStart + i] = deinterleaved[codeStart + dataPosition - 1] & 1;
    }
  }

  return {
    rawPayloadBits: rawPayloadBits.slice(0, PAYLOAD_BIT_LENGTH),
    correctedCodewords,
  };
}
