import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** Current scroll offset and measured sizes of the canvas scroll container. */
export type SankeyViewport = {
  scrollLeft: number;
  scrollTop: number;
  clientWidth: number;
  clientHeight: number;
  scrollWidth: number;
  scrollHeight: number;
};

type UseSankeyViewportParams = {
  /** Unzoomed (base) content width in px. */
  contentWidth: number;
  /** Unzoomed (base) content height in px. */
  contentHeight: number;
  enabled: boolean;
  minZoom?: number;
  maxZoom?: number;
  /** Multiplier applied per zoom-button press. */
  zoomStep?: number;
  /** How long after the last pan gesture before transient UI hides. */
  panHideDelayMs?: number;
};

const EmptyViewport: SankeyViewport = {
  scrollLeft: 0,
  scrollTop: 0,
  clientWidth: 0,
  clientHeight: 0,
  scrollWidth: 0,
  scrollHeight: 0,
};

const TouchPanThreshold = 4;
/** How long after the last pan gesture before the minimap hides. */
const DefaultPanHideDelayMs = 1200;
/** Ignore zoom requests smaller than this delta to avoid redundant renders. */
const ZoomDeltaEpsilon = 1e-4;
/** Wheel delta multiplier chosen to match Figma-like ctrl/trackpad pinch speed. */
const WheelZoomSensitivity = 0.0015;

const distanceBetween = (a: Touch, b: Touch): number =>
  Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

/**
 * Manages the zoomable/pannable canvas for {@link SankeyChart}.
 *
 * Zoom scales the SVG's rendered pixel size (the renderer multiplies the base
 * width/height by `zoom` while keeping the viewBox fixed) so vector geometry and
 * text stay crisp at any level. Panning is the scroll container's native scroll,
 * so mouse wheel, trackpad two-finger scroll, scrollbars, and (via the touch
 * handlers) one-finger drag all pan without a scroll-trap.
 *
 * Input model (Figma/Photoshop-inspired):
 *  - ⌘/Ctrl + wheel and trackpad pinch (reported as `wheel` with `ctrlKey`) zoom
 *    centered on the cursor.
 *  - Plain wheel / two-finger trackpad scroll pans (native).
 *  - Touch: one finger pans, two fingers pinch-zoom around their midpoint.
 *  - Zoom buttons / reset operate around the viewport center.
 */
export const useSankeyViewport = ({
  contentWidth,
  contentHeight,
  enabled,
  minZoom = 1,
  maxZoom = 8,
  zoomStep = 1.2,
  panHideDelayMs = DefaultPanHideDelayMs,
}: UseSankeyViewportParams) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState<SankeyViewport>(EmptyViewport);
  const [isPanning, setIsPanning] = useState(false);
  const panHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mirrors `zoom` for use inside imperative event handlers without stale closures.
  const zoomRef = useRef(1);
  // Scroll offset to apply after a zoom-driven resize (keeps a focal point fixed).
  const pendingScroll = useRef<{ left: number; top: number } | null>(null);
  // Set true at the end of a drag-pan so the consumer can suppress the trailing
  // click (which would otherwise toggle node focus).
  const wasDraggedRef = useRef(false);

  const readViewport = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    setViewport({
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      scrollWidth: element.scrollWidth,
      scrollHeight: element.scrollHeight,
    });
  }, []);

  /** Shows the minimap while panning; schedules hide after a short idle period. */
  const signalPanActivity = useCallback(() => {
    setIsPanning(true);
    if (panHideTimerRef.current) {
      clearTimeout(panHideTimerRef.current);
    }
    panHideTimerRef.current = setTimeout(() => {
      setIsPanning(false);
      panHideTimerRef.current = null;
    }, panHideDelayMs);
  }, [panHideDelayMs]);

  const clampZoom = useCallback(
    (value: number): number => Math.min(maxZoom, Math.max(minZoom, value)),
    [minZoom, maxZoom],
  );

  /** Zoom to `nextZoom`, keeping the given client point (or viewport center) fixed. */
  const zoomToPoint = useCallback(
    (nextZoom: number, focalClientX?: number, focalClientY?: number) => {
      const element = scrollRef.current;
      if (!element) {
        return;
      }
      const z0 = zoomRef.current;
      const z1 = clampZoom(nextZoom);
      if (Math.abs(z1 - z0) < ZoomDeltaEpsilon) {
        return;
      }
      const rect = element.getBoundingClientRect();
      const focalX =
        focalClientX === undefined ? element.clientWidth / 2 : focalClientX - rect.left;
      const focalY =
        focalClientY === undefined ? element.clientHeight / 2 : focalClientY - rect.top;
      const contentX = (element.scrollLeft + focalX) / z0;
      const contentY = (element.scrollTop + focalY) / z0;
      pendingScroll.current = {
        left: contentX * z1 - focalX,
        top: contentY * z1 - focalY,
      };
      zoomRef.current = z1;
      setZoom(z1);
    },
    [clampZoom],
  );

  const zoomIn = useCallback(
    () => zoomToPoint(zoomRef.current * zoomStep),
    [zoomToPoint, zoomStep],
  );
  const zoomOut = useCallback(
    () => zoomToPoint(zoomRef.current / zoomStep),
    [zoomToPoint, zoomStep],
  );
  const reset = useCallback(() => {
    pendingScroll.current = { left: 0, top: 0 };
    zoomRef.current = 1;
    setZoom(1);
  }, []);

  /** Imperatively scroll the canvas (used by the minimap). */
  const scrollTo = useCallback((left: number, top: number) => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    element.scrollLeft = left;
    element.scrollTop = top;
  }, []);

  // Apply pending focal scroll after the SVG has resized for the new zoom.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    if (pendingScroll.current) {
      element.scrollLeft = pendingScroll.current.left;
      element.scrollTop = pendingScroll.current.top;
      pendingScroll.current = null;
    }
    readViewport();
  }, [zoom, contentWidth, contentHeight, readViewport]);

  // Track native scrolling (wheel, scrollbars, touch pan) for the minimap.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return undefined;
    }
    const handleScroll = (): void => {
      readViewport();
      signalPanActivity();
    };
    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [readViewport, signalPanActivity]);

  useEffect(
    () => () => {
      if (panHideTimerRef.current) {
        clearTimeout(panHideTimerRef.current);
      }
    },
    [],
  );

  // Non-passive wheel listener so we can preventDefault on zoom gestures.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !enabled) {
      return undefined;
    }
    const handleWheel = (event: WheelEvent): void => {
      if (event.ctrlKey || event.metaKey) {
        // ⌘/Ctrl + wheel, and macOS trackpad pinch (ctrlKey set), zoom at cursor.
        event.preventDefault();
        const factor = Math.exp(-event.deltaY * WheelZoomSensitivity);
        zoomToPoint(zoomRef.current * factor, event.clientX, event.clientY);
      }
      // Otherwise let the browser scroll natively (pan).
    };
    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [enabled, zoomToPoint]);

  // Mouse: grab-and-drag to pan (Figma-style hand). A small movement threshold
  // distinguishes a pan from a click so node-focus clicks still work.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !enabled) {
      return undefined;
    }

    let start: { x: number; y: number; scrollLeft: number; scrollTop: number } | null = null;
    let dragging = false;

    const handlePointerDown = (event: PointerEvent): void => {
      if (event.pointerType !== 'mouse' || event.button !== 0) {
        return;
      }
      wasDraggedRef.current = false;
      start = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop,
      };
      dragging = false;
    };

    const handlePointerMove = (event: PointerEvent): void => {
      if (!start) {
        return;
      }
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (!dragging) {
        if (Math.hypot(dx, dy) < TouchPanThreshold) {
          return;
        }
        dragging = true;
        element.style.cursor = 'grabbing';
        if (element.setPointerCapture) {
          element.setPointerCapture(event.pointerId);
        }
        signalPanActivity();
      }
      event.preventDefault();
      element.scrollLeft = start.scrollLeft - dx;
      element.scrollTop = start.scrollTop - dy;
      if (dragging) {
        signalPanActivity();
      }
    };

    const handlePointerUp = (event: PointerEvent): void => {
      if (dragging) {
        wasDraggedRef.current = true;
        signalPanActivity();
      }
      if (element.hasPointerCapture?.(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
      start = null;
      dragging = false;
      element.style.cursor = 'grab';
    };

    element.style.cursor = 'grab';
    element.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      element.style.cursor = '';
      element.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [enabled, signalPanActivity]);

  // Touch: one-finger pan, two-finger pinch. touch-action is disabled on the
  // element (see renderer) so these gestures don't fight native scrolling.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !enabled) {
      return undefined;
    }

    let panStart: { x: number; y: number; scrollLeft: number; scrollTop: number } | null = null;
    let pinchStart: { distance: number; zoom: number } | null = null;
    let touchPanning = false;

    const handleTouchStart = (event: TouchEvent): void => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        panStart = {
          x: touch.clientX,
          y: touch.clientY,
          scrollLeft: element.scrollLeft,
          scrollTop: element.scrollTop,
        };
        touchPanning = false;
        pinchStart = null;
      } else if (event.touches.length === 2) {
        pinchStart = {
          distance: distanceBetween(event.touches[0], event.touches[1]),
          zoom: zoomRef.current,
        };
        panStart = null;
      }
    };

    const handleTouchMove = (event: TouchEvent): void => {
      if (pinchStart && event.touches.length === 2) {
        event.preventDefault();
        const distance = distanceBetween(event.touches[0], event.touches[1]);
        if (pinchStart.distance > 0) {
          const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
          const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
          zoomToPoint(pinchStart.zoom * (distance / pinchStart.distance), midX, midY);
        }
        return;
      }
      if (panStart && event.touches.length === 1) {
        const touch = event.touches[0];
        const dx = touch.clientX - panStart.x;
        const dy = touch.clientY - panStart.y;
        if (!touchPanning && Math.hypot(dx, dy) < TouchPanThreshold) {
          return;
        }
        touchPanning = true;
        event.preventDefault();
        element.scrollLeft = panStart.scrollLeft - dx;
        element.scrollTop = panStart.scrollTop - dy;
        signalPanActivity();
      }
    };

    const handleTouchEnd = (event: TouchEvent): void => {
      if (touchPanning) {
        signalPanActivity();
      }
      if (event.touches.length === 0) {
        panStart = null;
        pinchStart = null;
        touchPanning = false;
      } else if (event.touches.length === 1) {
        pinchStart = null;
        const touch = event.touches[0];
        panStart = {
          x: touch.clientX,
          y: touch.clientY,
          scrollLeft: element.scrollLeft,
          scrollTop: element.scrollTop,
        };
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [enabled, zoomToPoint, signalPanActivity]);

  return {
    scrollRef,
    zoom: enabled ? zoom : 1,
    viewport,
    isPanning,
    zoomIn,
    zoomOut,
    reset,
    scrollTo,
    readViewport,
    signalPanActivity,
    wasDraggedRef,
  };
};
