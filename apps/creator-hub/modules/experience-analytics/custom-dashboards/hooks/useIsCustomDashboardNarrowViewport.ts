import { useSyncExternalStore } from 'react';
import { CUSTOM_DASHBOARD_NARROW_VIEWPORT_MEDIA_QUERY } from '../constants/narrowViewport';

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mediaQueryList = window.matchMedia(CUSTOM_DASHBOARD_NARROW_VIEWPORT_MEDIA_QUERY);
  mediaQueryList.addEventListener('change', onStoreChange);
  return () => mediaQueryList.removeEventListener('change', onStoreChange);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(CUSTOM_DASHBOARD_NARROW_VIEWPORT_MEDIA_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** True when the custom-dashboard layout should use the narrow (mobile) presentation. */
export default function useIsCustomDashboardNarrowViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
