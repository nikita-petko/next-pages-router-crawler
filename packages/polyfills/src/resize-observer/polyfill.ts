/**
 * `ResizeObserver` is Safari 13.1+. Many UI libraries (MUI, Foundation, dnd-kit)
 * rely on it for layout measurement.
 */
import { ResizeObserver } from '@juggle/resize-observer';

export const installResizeObserverPolyfill = (): void => {
  if (typeof window === 'undefined' || typeof window.ResizeObserver === 'function') {
    return;
  }

  window.ResizeObserver = ResizeObserver;
};

installResizeObserverPolyfill();
