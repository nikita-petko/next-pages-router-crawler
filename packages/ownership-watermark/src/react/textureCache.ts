/**
 * In-memory cache for watermark carrier bitmaps.
 *
 * Why cache:
 *   - Encoding a watermark at a typical chart-card size (~480x320) is
 *     ~20-60ms on a modern laptop and ~200ms on low-end devices. Not
 *     something we want to do on every ChartCard re-render (there can be
 *     10+ on one page).
 *   - Keyed by (opaque token material, width, height, hostLuma-bucket) so
 *     multiple chart cards at the same effective size share the carrier.
 *     Each distinct (token, size, backdrop-luma) tuple gets its own cached
 *     carrier; the hostLuma lets us bake the carrier's DC
 *     offset to match the card's measured background (see
 *     OwnershipWatermark.tsx) so the composited tint disappears on both
 *     light and dark themes. Luma is quantised to 4-level buckets so
 *     sub-pixel measurement noise doesn't thrash the cache.
 *
 * Why per-card size rather than a fixed 256x256 tile:
 *   - CSS `background-repeat: repeat` would cross tile boundaries, and
 *     the DCT block mapping is NOT tile-periodic (see blockMap.ts). With
 *     tiling, the decoder scrambles votes across bit slots and CRC fails
 *     on real screenshots -- this was the "No watermark recovered" bug
 *     devrels saw after we wired the watermark into production chart
 *     cards.
 *   - Generating at the element's exact device-pixel size and blitting it
 *     1:1 via a `<canvas>` (see OwnershipWatermark.tsx) means the decoder
 *     sees exactly one embed filling the captured region with no CSS-space
 *     resampling to smear the DCT coefficients.
 *
 * Why return raw ImageData rather than a PNG data URL:
 *   - PNG encode + decode adds ~5-15ms per cache miss for no benefit: the
 *     consumer is a `<canvas>` whose `putImageData` takes the raw buffer.
 *   - Skipping `canvas.toDataURL('image/png')` also avoids a layer of
 *     browser-side image-decode caching that was making it hard to reason
 *     about staleness during the DPR/blend-mode investigations.
 *
 * Why not IndexedDB:
 *   - The carrier is cheap to regenerate -- <100ms per unique size -- so
 *     persistence across sessions buys us little versus the complexity of
 *     IDB migrations.
 *   - Keeping the cache in-process lets us invalidate cleanly during token
 *     rotation and tests without worrying about stale persisted entries.
 *
 * This module is SSR-safe: the carrier data is still plain JS, and v3 opaque
 * tokens are already server-issued before they reach this cache.
 */

import {
  encodeChannelBits,
  encodePayload,
  MIN_EMBED_SIZE,
  type OwnershipPayloadV3,
  watermarkImage,
} from '../core';

export type CarrierKey = {
  payload: OwnershipPayloadV3;
  width: number;
  height: number;
  hostLuma?: number;
};

/** Shape-compatible with the DOM `ImageData`, but a plain JS object. */
export type CarrierImageData = {
  width: number;
  height: number;
  data: Uint8ClampedArray;
};

/**
 * Strength used when generating the carrier bitmap. Tuned empirically:
 *   - The runtime composites the carrier via normal alpha at ~2.5% opacity
 *     (OwnershipWatermark.tsx), attenuating the signal by 40x. (We moved
 *     off `mix-blend-mode: plus-lighter` because it clips on near-white
 *     chart card backgrounds and wipes the signal out entirely there.)
 *   - The channel-coded payload needs crop/compression margin, but using four
 *     signalling lanes lets us keep that margin with lower per-lane amplitude.
 *     At strength 1300, the default 0.5 lane multiplier and 0.025
 *     alpha attenuation put each lane near effective strength 16.25; the extra
 *     lanes restore aggregate soft-vote margin for the 85%-crop runtime
 *     canaries while avoiding two visibly dominant bases.
 *   - In a carrier-only render (neutral mid-gray host) that looks like
 *     subtle noise, well below the display's quantisation-to-8bit threshold.
 *
 * Re-tune only after design review with real screenshots, since this value
 * trades off watermark recoverability against visible texture.
 */
const CARRIER_STRENGTH = 1300;

/**
 * Strength for dark backdrops (hostLuma < DARK_HOST_LUMA_THRESHOLD). On dark
 * backgrounds the same pixel excursion that is invisible on light mode (4
 * levels on luma 250 = 1.6% contrast) is visibly above JND on dark mode (4
 * levels on luma 30 = 13.3% contrast). Lowering to 1000 reduces peak
 * excursion from 4 to 3 levels (~10% contrast) while still surviving
 * JPEG Q=60.
 */
const DARK_CARRIER_STRENGTH = 1000;

/**
 * Fallback "host" luminance for the carrier when the caller has not
 * measured the actual backdrop. The value uses the same 8-bit range as
 * `hostLuma` inputs: 0 is black, 255 is white. Mid-gray keeps the watermark
 * modulation equally representable in the +/- direction; callers that can
 * measure the real backdrop luma (see `OwnershipWatermark`) should pass it
 * in so the composited DC offset disappears.
 */
export const DEFAULT_CARRIER_HOST_LUMA = 128;

/**
 * Below this backdrop luma, the carrier uses reduced strength and pixel
 * clipping to lower the peak excursion and reduce visible "snow" on
 * dark mode.
 */
const DARK_HOST_LUMA_THRESHOLD = 96;

/**
 * Pixel excursion clip for dark backdrops. After IDWT, each pixel's
 * deviation from the original is clipped to ±this value. This reduces
 * the visible peaks from 3 to 2 levels (10% → 6.7% contrast on luma 30)
 * while keeping the DCT coefficient sign relationship intact for the
 * decoder. Light mode is not clipped — the excursion is already below
 * JND on light backdrops.
 */
const DARK_CLIP_EXCURSION = 80;

/** Visible for tests and debug labels so the strength rule is not duplicated. */
export function resolveWatermarkStrength(hostLuma: number | null | undefined): number {
  const resolved = hostLuma ?? DEFAULT_CARRIER_HOST_LUMA;
  return resolved < DARK_HOST_LUMA_THRESHOLD ? DARK_CARRIER_STRENGTH : CARRIER_STRENGTH;
}

/**
 * Returns the pixel excursion clip for the given backdrop luma. Dark
 * backdrops get clipped to reduce visible peaks; light backdrops are
 * not clipped (excursion is already below JND).
 */
export function resolveWatermarkClip(hostLuma: number | null | undefined): number | null {
  const resolved = hostLuma ?? DEFAULT_CARRIER_HOST_LUMA;
  return resolved < DARK_HOST_LUMA_THRESHOLD ? DARK_CLIP_EXCURSION : null;
}

/**
 * Quantise hostLuma to the nearest multiple of 4 for cache keying. The
 * resulting 64 distinct buckets across 0..255 are plenty of resolution to kill the
 * flat tint (human perception struggles to resolve <3 levels at low
 * contrast) while being coarse enough to avoid cache thrash from 1-level
 * fluctuations in `getComputedStyle` rounding.
 */
const LUMA_BUCKET = 4;

const cache = new Map<string, Promise<CarrierImageData | null>>();

function bucketedLuma(hostLuma: number | undefined): number {
  const raw = hostLuma ?? DEFAULT_CARRIER_HOST_LUMA;
  const clamped = Math.max(0, Math.min(255, Math.round(raw)));
  return Math.max(0, Math.min(255, Math.round(clamped / LUMA_BUCKET) * LUMA_BUCKET));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function tokenMaterialKey(payload: OwnershipPayloadV3): string {
  return [
    payload.version,
    payload.codecProfile,
    payload.keyEpoch,
    payload.flags,
    bytesToHex(payload.attributionData),
    bytesToHex(payload.serverMac),
  ].join(':');
}

function cacheKey(k: CarrierKey, luma: number): string {
  return `${tokenMaterialKey(k.payload)}:${k.width}x${k.height}:${luma}`;
}

/**
 * Produce the watermark carrier as raw pixel data, sized to the requested
 * device-pixel dimensions. The first call for a given key is slow
 * (~20-100ms); subsequent calls return in O(1).
 *
 * Returns null when the requested size is below the DWT-DCT decoder's
 * minimum embed size (so the runtime gracefully renders nothing rather than
 * producing a carrier that can never be decoded).
 */
export async function getOrCreateCarrierImageData(
  key: CarrierKey,
): Promise<CarrierImageData | null> {
  if (!Number.isFinite(key.width) || !Number.isFinite(key.height)) {
    return null;
  }
  if (key.width < MIN_EMBED_SIZE || key.height < MIN_EMBED_SIZE) {
    return null;
  }

  const luma = bucketedLuma(key.hostLuma);
  const k = cacheKey(key, luma);
  const cached = cache.get(k);
  if (cached) {
    return cached;
  }

  const pending = (async () => {
    const bits = encodeChannelBits(encodePayload(key.payload));
    const host = buildNeutralHost(key.width, key.height, luma);
    const strength = resolveWatermarkStrength(luma);
    const clipExcursion = resolveWatermarkClip(luma);
    const marked = watermarkImage(host, bits, { strength, clipExcursion });
    return {
      width: marked.width,
      height: marked.height,
      data: marked.data,
    };
  })().catch((error) => {
    cache.delete(k);
    throw error;
  });

  cache.set(k, pending);
  return pending;
}

function buildNeutralHost(width: number, height: number, hostLuma: number): CarrierImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = hostLuma;
    data[i * 4 + 1] = hostLuma;
    data[i * 4 + 2] = hostLuma;
    // Carrier is rendered via CSS opacity; alpha=255 on the source keeps
    // the luma channel intact through the compositor.
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

/** Visible for tests and feature-flag teardown. */
export function clearCarrierCache(): void {
  cache.clear();
}
