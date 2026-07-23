/**
 * Invisible watermark overlay.
 *
 * Renders a carrier texture (with the server-issued opaque payload baked
 * into its DCT domain) at very low opacity, blitted 1:1 to device pixels
 * via a `<canvas>`. Meant to be mounted inside `Card`/`CardContent`
 * surfaces such as `ChartCard`.
 *
 * Why canvas instead of <div>+background-image:
 *   - The decoder is scale-sensitive: the DCT pairs it signals on are at
 *     specific mid-frequencies of an 8x8 block; any non-integer
 *     scaling on the encode path spreads that signal across neighbouring
 *     coefficients and the CRC collapses.
 *   - With `background-image: url(...carrier.png)` and `background-size:
 *     100% 100%`, the browser resamples the PNG to fit the element's CSS
 *     box, and even a 2-5% size mismatch (e.g. from quantising carrier
 *     dimensions for cache efficiency) introduces a bilinear filter that
 *     kills the signal.
 *   - With a `<canvas>` whose `.width`/`.height` match the element's exact
 *     `devicePixelContentBoxSize`, the bitmap is 1:1 to the screen no
 *     matter the DPR, the element's fractional CSS dimensions, or the
 *     browser's compositor heuristics. This was the remaining half of the
 *     "No watermark recovered" bug after the blend-mode and DPR-multiply
 *     fixes: even with the right number of PNG pixels, CSS was still
 *     rescaling them to reach the target box size.
 *
 * Rendering properties:
 *   - position: absolute, inset: 0 -- fills the parent (which must be
 *     position: relative).
 *   - pointer-events: none and aria-hidden -- never blocks clicks or
 *     screen-readers.
 *   - opacity: 0.025 -- composites via normal alpha so the carrier
 *     contributes a small symmetric signal on both light and dark chart
 *     backgrounds. We intentionally avoid `mix-blend-mode: plus-lighter`
 *     here because on near-white card backgrounds it clips at 1.0 and
 *     annihilates the signal (guarded by core/blendCompositing.test.ts).
 *   - hostLuma: measured at runtime by walking up from the canvas to the
 *     first opaque ancestor backgroundColor. The carrier is baked with
 *     that luma as its DC mean, so the composited output is
 *     (backdrop*(1-a) + carrier*a) ≈ backdrop + ±signal*a with zero
 *     constant tint -- on either a white creator-hub light-mode card or
 *     a near-black dark-mode card. Falls back to mid-gray when the
 *     ancestor chain has no opaque background (e.g. jsdom, gradient-only
 *     surfaces, pre-layout SSR).
 *
 * Storybook policy:
 *   Storybook renders the watermark just like production -- we deliberately
 *   do NOT bypass based on a compile-time env var. Chart stories that pass a
 *   metric-aware watermark slot get the live signal; stories that need the
 *   watermark off can pass `slots={{}}` on the individual `<ChartCard>`.
 *
 * Debug visualiser:
 *   `globalThis.__RBX_OWNERSHIP_WATERMARK_DEBUG__ === true` renders the
 *   carrier at 0.5 opacity with a red dashed outline and a tiny label
 *   showing opaque attribution bytes + measured dimensions. Use it from the
 *   browser console to confirm the provider chain is live on a given chart
 *   surface.
 */

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { OwnershipPayloadV3 } from '../core';
import { DEFAULT_CARRIER_HOST_LUMA, getOrCreateCarrierImageData } from './textureCache';
import useOwnership from './useOwnership';

/**
 * Alpha used to composite the carrier canvas over the chart card backdrop.
 *
 * Tuning: this is the main visibility knob. Signal amplitude at the pixel
 * plane is `carrier_pixel_delta * CARRIER_OPACITY`, so dropping this without
 * retuning the baked carrier strength reduces both visibility and decoder
 * margin linearly. The runtime budget is guarded end-to-end by
 * `blendCompositing.test.ts`, which exercises pure-white and dark backdrops
 * under JPEG Q=80 and Q=60 re-encodes -- whichever value lives
 * here MUST also match `RUNTIME_OPACITY` in that test so the CRC-survival
 * guards stay honest.
 *
 * Empirical floor: with four 0.5-weight signalling lanes at strength=1300
 * and SIZE=512, 0.025 keeps the 85%-crop + JPEG runtime canaries alive while
 * lowering the per-lane amplitude that makes flat-background carrier texture
 * visible. Lower values still decode full-frame screenshots, but partial
 * plot-area screenshots fall off sharply.
 */
const CARRIER_OPACITY = 0.025;
/**
 * Minimum device-pixel dimensions below which the DWT-DCT decoder loses
 * enough 8x8 LL blocks to carry the channel-coded payload stream through a
 * screenshot round-trip. Surfaces smaller than this still render the watermark
 * -- it just won't survive a small screenshot. We warn once per opaque token so
 * feature owners know to give the chart more room or to stop expecting a decode.
 */
const MIN_RELIABLE_WIDTH = 320;
const MIN_RELIABLE_HEIGHT = 240;
const DEBUG_GLOBAL_KEY = '__RBX_OWNERSHIP_WATERMARK_DEBUG__';

const warnedSmallSurface = new Set<string>();

export type OwnershipWatermarkProps = {
  /**
   * Optional opacity override. Keep near 0.025; higher values risk design
   * regressions, lower values risk decoder failure.
   */
  opacity?: number;
  /**
   * Server-issued opaque v3 token to embed. If omitted, the nearest
   * OwnershipContext payload is used; if neither exists, nothing renders.
   */
  payload?: OwnershipPayloadV3 | null;
  /**
   * Diagnostic only. Passing teamId does not create payload bits client-side.
   */
  teamId?: number;
};

type MeasuredSize = {
  /** CSS pixels. Used only for the debug label. */
  cssWidth: number;
  cssHeight: number;
  /** Device pixels, as the browser itself computed them. Exact, not rounded. */
  deviceWidth: number;
  deviceHeight: number;
};

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Parse a CSS `color` string in one of the formats `getComputedStyle`
 * returns for `backgroundColor` -- `rgb(r, g, b)`, `rgba(r, g, b, a)`,
 * `transparent`, or empty string. Returns `null` when the backdrop is
 * fully transparent (caller should keep walking up the DOM tree) or when
 * the string doesn't match either grammar.
 *
 * We don't try to parse hex / named colors here: browsers normalise the
 * computed value to `rgb(...)`/`rgba(...)`, so in practice that's the
 * only shape we see in real DOM. Named `transparent` gets normalised to
 * `rgba(0, 0, 0, 0)` in every evergreen browser.
 */
function parseOpaqueRgb(raw: string): { r: number; g: number; b: number } | null {
  const match = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) {
    return null;
  }
  const parts = match[1].split(',').map((s) => s.trim());
  if (parts.length < 3) {
    return null;
  }
  const r = Number(parts[0]);
  const g = Number(parts[1]);
  const b = Number(parts[2]);
  const a = parts.length >= 4 ? Number(parts[3]) : 1;
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b) || !Number.isFinite(a)) {
    return null;
  }
  // Treat anything less than fully opaque as "keep walking up": a
  // semi-transparent parent lets the grandparent's color bleed through,
  // and picking the semi-transparent value would give us a luma that
  // drifts from what the user actually perceives.
  if (a < 1) {
    return null;
  }
  return { r, g, b };
}

/**
 * Walk up from `startNode` until we find an ancestor whose computed
 * `backgroundColor` is fully opaque, and return its Rec.709 luma
 * (0..255). Returns `DEFAULT_CARRIER_HOST_LUMA` when nothing in the
 * ancestor chain has an opaque solid color (SSR, jsdom without styles,
 * gradient-only surfaces) so the carrier silently degrades to the
 * fixed mid-gray behaviour.
 *
 * We use ITU-R Rec.709 weights (0.2126, 0.7152, 0.0722) rather than
 * Rec.601 (0.299, 0.587, 0.114) because Rec.709 is the standard for
 * sRGB displays, which is what the creator-hub theme targets. The
 * difference at our precision (8-bit, quantised to 4-level buckets in
 * textureCache) is below one bucket for any realistic chart-card color.
 */
function measureBackdropLuma(startNode: HTMLElement): number {
  if (typeof window === 'undefined') {
    return DEFAULT_CARRIER_HOST_LUMA;
  }
  let el: HTMLElement | null = startNode.parentElement;
  // Bound the climb so a pathological tree (shadow DOMs, detached
  // fragments) can't spin indefinitely. 50 levels is far deeper than any
  // real chart card.
  let hops = 0;
  while (el && hops < 50) {
    const cs = window.getComputedStyle(el);
    const rgb = parseOpaqueRgb(cs.backgroundColor);
    if (rgb) {
      return Math.round(0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b);
    }
    el = el.parentElement;
    hops += 1;
  }
  return DEFAULT_CARRIER_HOST_LUMA;
}

/**
 * Pull the exact integer device-pixel size from a ResizeObserver entry.
 * Falls back to `contentRect.width * devicePixelRatio` when
 * `devicePixelContentBoxSize` isn't supported (older Safari, etc.); that
 * fallback rounds and so can introduce <1-px mismatch, but it's only hit on
 * browsers where we already accept some signal loss.
 */
function measureDevicePixelSize(entry: ResizeObserverEntry): {
  cssW: number;
  cssH: number;
  deviceW: number;
  deviceH: number;
} {
  const cssW = entry.contentRect.width;
  const cssH = entry.contentRect.height;
  // `devicePixelContentBoxSize` is the authoritative device-pixel size; it's
  // what the compositor will use when it paints the element. Using it here
  // means our carrier bitmap maps 1:1 to screen pixels, no matter how the
  // browser happens to round fractional layout positions.
  const dpcbs = entry.devicePixelContentBoxSize;
  const firstDevicePixelBox = dpcbs[0];
  if (firstDevicePixelBox) {
    return {
      cssW,
      cssH,
      deviceW: firstDevicePixelBox.inlineSize,
      deviceH: firstDevicePixelBox.blockSize,
    };
  }
  const dpr = typeof window === 'undefined' ? 1 : Math.max(1, window.devicePixelRatio || 1);
  return {
    cssW,
    cssH,
    deviceW: Math.round(cssW * dpr),
    deviceH: Math.round(cssH * dpr),
  };
}

const OwnershipWatermark: React.FC<OwnershipWatermarkProps> = ({
  opacity = CARRIER_OPACITY,
  payload,
  teamId,
}) => {
  const contextOwnership = useOwnership();
  const ownership = useMemo(() => {
    if (payload === null) {
      return null;
    }
    const resolvedPayload = payload ?? contextOwnership?.payload ?? null;
    if (!resolvedPayload) {
      return null;
    }
    if (contextOwnership && !contextOwnership.enabled && payload === undefined) {
      return null;
    }
    return {
      payload: resolvedPayload,
      teamId: teamId ?? contextOwnership?.teamId,
      enabled: true,
    };
  }, [contextOwnership, payload, teamId]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<MeasuredSize | null>(null);
  // `null` while we haven't had a chance to run DOM measurement yet
  // (pre-mount, SSR, jsdom without a ref). The paint effect refuses to
  // run until we know the backdrop luma so we never blit a flat-mid-gray
  // carrier over a dark-mode card even for a single frame.
  const [hostLuma, setHostLuma] = useState<number | null>(null);
  const [carrierReady, setCarrierReady] = useState(false);

  const debug =
    typeof globalThis !== 'undefined' && Reflect.get(globalThis, DEBUG_GLOBAL_KEY) === true;

  // Measure the parent's device-pixel content box and the effective
  // backdrop luma, keep them both in sync.
  //
  // Performance note: with the naive "re-measure in a no-dep effect"
  // approach a 10-chart dashboard spends ~50-100ms per parent re-render
  // on getComputedStyle alone (walking 1-5 ancestors per chart, each
  // call forcing a style flush). Instead we subscribe to the three
  // events that can actually change the answer:
  //
  //   (a) mount -- synchronous measurement so the first paint is right.
  //   (b) resize -- existing ResizeObserver fires; DPR changes, layout
  //       shifts, and accordion/tab expansions are all covered here.
  //   (c) theme flip -- creator-hub's `useFoundationTheme` toggles
  //       `light-theme`/`dark-theme`/`system-theme` classes on
  //       `document.documentElement`; MutationObserver on that class
  //       attribute catches user-driven toggles. `matchMedia` covers OS
  //       flips when the app is in system-theme mode.
  //
  // Doing nothing on unrelated renders keeps the watermark effectively
  // free during routine chart-card activity (hover, tooltip, timeseries
  // update) while still being correct across theme changes.
  useLayoutEffect(() => {
    if (!ownership || !ownership.enabled) {
      return undefined;
    }
    const node = canvasRef.current;
    if (!node) {
      return undefined;
    }

    const measureLuma = () => {
      const measured = measureBackdropLuma(node);
      setHostLuma((prev) => (prev === measured ? prev : measured));
    };
    // Synchronous first measurement: runs after the DOM is committed
    // but before the browser paints, so the canvas's first frame
    // already has the correct hostLuma.
    measureLuma();

    // (b) Size observer -- measures device-pixel dimensions and also
    // piggy-backs a luma re-measurement because resize can reveal a
    // different ancestor's bg (e.g. a sidebar collapse changing what
    // the card sits on top of) almost as cheaply as the size check.
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      try {
        ro = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (!entry) {
            return;
          }
          const { cssW, cssH, deviceW, deviceH } = measureDevicePixelSize(entry);
          setSize((prev) => {
            if (
              prev &&
              prev.deviceWidth === deviceW &&
              prev.deviceHeight === deviceH &&
              prev.cssWidth === cssW &&
              prev.cssHeight === cssH
            ) {
              return prev;
            }
            if (deviceW === 0 || deviceH === 0) {
              return prev;
            }
            return { cssWidth: cssW, cssHeight: cssH, deviceWidth: deviceW, deviceHeight: deviceH };
          });
          measureLuma();
        });
      } catch {
        ro = null;
      }
    }
    if (ro) {
      // Request devicePixelContentBoxSize explicitly -- it is the
      // Content Box in the element's own device-pixel grid. Without
      // the options argument, some browsers still populate it, but
      // passing it is explicit and spec-correct.
      try {
        ro.observe(node, { box: 'device-pixel-content-box' } as ResizeObserverOptions);
      } catch {
        // Safari <15.4 etc.: fall back to default observe().
        ro.observe(node);
      }
    }

    // (c1) DOM theme-class observer -- creator-hub's useFoundationTheme
    // toggles light-theme/dark-theme/system-theme on <html>. Narrow
    // attributeFilter keeps the MO from firing on unrelated <html>
    // attribute churn.
    let mo: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
      try {
        mo = new MutationObserver(measureLuma);
        mo.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'data-theme', 'data-mui-color-scheme', 'data-color-mode'],
        });
      } catch {
        mo = null;
      }
    }

    // (c2) prefers-color-scheme listener -- covers OS-level dark/light
    // flips while the app is in system-theme mode. The
    // useFoundationTheme `system-theme` class stays the same on OS
    // flip, so (c1) alone doesn't suffice here.
    let mql: MediaQueryList | null = null;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        mql = window.matchMedia('(prefers-color-scheme: dark)');
        mql.addEventListener('change', measureLuma);
      } catch {
        mql = null;
      }
    }

    return () => {
      if (ro) {
        ro.disconnect();
      }
      if (mo) {
        mo.disconnect();
      }
      if (mql) {
        try {
          mql.removeEventListener('change', measureLuma);
        } catch {
          // Older Safari implementations may reject removeEventListener on
          // MediaQueryList; there's no damage from leaving it attached
          // (the closure will be GC'd when the component unmounts).
        }
      }
    };
  }, [ownership]);

  // Paint the carrier whenever size, identity, or backdrop luma changes.
  //
  // Carrier generation is async because the bitmap cache can miss. Clear the
  // old bitmap immediately so we never show a stale opaque token.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!ownership || !ownership.enabled || !size || hostLuma === null || !canvas) {
      setCarrierReady(false);
      return undefined;
    }

    let cancelled = false;
    setCarrierReady(false);

    if (canvas.width !== size.deviceWidth) {
      canvas.width = size.deviceWidth;
    }
    if (canvas.height !== size.deviceHeight) {
      canvas.height = size.deviceHeight;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    (async () => {
      try {
        const img = await getOrCreateCarrierImageData({
          payload: ownership.payload,
          width: size.deviceWidth,
          height: size.deviceHeight,
          hostLuma,
        });
        if (cancelled || !img) {
          return;
        }
        const latestCanvas = canvasRef.current;
        if (!latestCanvas) {
          return;
        }
        const latestCtx = latestCanvas.getContext('2d');
        if (!latestCtx) {
          return;
        }
        const frame = latestCtx.createImageData(img.width, img.height);
        frame.data.set(img.data);
        latestCtx.putImageData(frame, 0, 0);
        setCarrierReady(true);
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[OwnershipWatermark] Failed to build carrier: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    })().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [ownership, size, hostLuma]);

  // Size-coverage warning. Runs once per team per page load. Fires only
  // after we have a measured size, so jsdom/SSR renders never trigger it.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    if (!ownership || !ownership.enabled || !size) {
      return;
    }
    if (size.deviceWidth >= MIN_RELIABLE_WIDTH && size.deviceHeight >= MIN_RELIABLE_HEIGHT) {
      return;
    }
    const key = bytesToHex(ownership.payload.attributionData);
    if (warnedSmallSurface.has(key)) {
      return;
    }
    warnedSmallSurface.add(key);
    console.warn(
      `[OwnershipWatermark] Surface is ${Math.round(size.cssWidth)}×${Math.round(
        size.cssHeight,
      )} CSS px (${size.deviceWidth}×${size.deviceHeight} device px) which is below the ` +
        `${MIN_RELIABLE_WIDTH}×${MIN_RELIABLE_HEIGHT} device-px threshold for reliable ` +
        `screenshot decoding (attribution=${key}). The watermark ` +
        'is still rendered but screenshots smaller than the DCT block budget may CRC-fail in ' +
        'the decoder tool.',
    );
  }, [ownership, size]);

  if (!ownership || !ownership.enabled) {
    return null;
  }

  const attributionDataHex = bytesToHex(ownership.payload.attributionData);

  let overlayOpacity = 0;
  if (carrierReady) {
    overlayOpacity = debug ? 0.5 : opacity;
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    opacity: overlayOpacity,
    zIndex: 0,
    // Debug-only visual aid so engineers can confirm the overlay is mounted.
    ...(debug ? { outline: '2px dashed rgba(255, 0, 0, 0.8)', outlineOffset: -2 } : null),
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden='true'
        data-testid='ownership-watermark'
        data-watermark-version={ownership.payload.version}
        data-watermark-profile={ownership.payload.codecProfile}
        data-watermark-key-epoch={ownership.payload.keyEpoch}
        data-attribution-data={attributionDataHex}
        data-team-id={ownership.teamId}
        style={style}
      />
      {debug ? (
        <div
          aria-hidden='true'
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            padding: '2px 6px',
            font: '10px/1.2 ui-monospace, SFMono-Regular, monospace',
            color: '#fff',
            background: 'rgba(220, 38, 38, 0.9)',
            borderRadius: 2,
            pointerEvents: 'none',
            zIndex: 1,
          }}>
          {/* oxlint-disable-next-line rbx/no-hardcoded-translation-string -- dev-only debug overlay, not user-facing UI */}
          {`attr=${attributionDataHex.slice(0, 12)} · epoch=${ownership.payload.keyEpoch} · ${
            size?.cssWidth ? Math.round(size.cssWidth) : '?'
          }×${
            size?.cssHeight ? Math.round(size.cssHeight) : '?'
          }css · ${size?.deviceWidth ?? '?'}×${size?.deviceHeight ?? '?'}dev`}
        </div>
      ) : null}
    </>
  );
};

/** Visible for tests that need to reset the small-surface warning state. */
export function clearSmallSurfaceWarningsForTest(): void {
  warnedSmallSurface.clear();
}

export default OwnershipWatermark;
