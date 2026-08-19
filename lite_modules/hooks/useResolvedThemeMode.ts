import { type ThemeMode, useThemeMode } from '@rbx/settings';
import { useEffect, useState } from 'react';

import { resolvedThemeModeStorageKey } from '@constants/theme';
import { useAppStore } from '@stores/appStoreProvider';
import { InBrowser } from '@utils/browser';

const readCachedThemeMode = (): ThemeMode | undefined => {
  if (!InBrowser()) {
    return undefined;
  }

  const cached = window.localStorage.getItem(resolvedThemeModeStorageKey);

  return cached === 'light' || cached === 'dark' ? cached : undefined;
};

/**
 * The theme mode Ads Manager actually renders in.
 *
 * `useThemeMode()` returns the preference the user set in Creator Hub, which is
 * shared across `create.roblox.com`. Until light mode finishes rolling out that
 * preference is gated behind `isLightModeEnabled` and collapses to dark, so a
 * light-mode user never lands on a surface that hasn't been converted to theme
 * tokens yet.
 *
 * Because that flag arrives over the network, the answer is cached in
 * `localStorage` and reused while the metadata is in flight — see
 * `resolvedThemeModeStorageKey`. The pre-paint script in `_document.tsx` reads the
 * same cache to set the theme class before the first paint, so the two agree on
 * the very first render and nothing flips.
 *
 * Read `themeMode` rather than `themeOption`: Creator Hub offers "sync with the
 * Roblox website" and "sync with my device" alongside plain light/dark, and
 * `ThemeModeProvider` has already collapsed all of them into a resolved
 * light/dark answer. Branching on `themeOption` here would mean reimplementing
 * that resolution and drifting whenever Creator Hub adds an option.
 *
 * Anything that needs to branch on the mode — picking a light or dark asset, for
 * example — must read it from here rather than calling `useThemeMode()` directly,
 * otherwise it will disagree with the rest of the app while the flag is off.
 */
const useResolvedThemeMode = (): ThemeMode => {
  const { themeMode } = useThemeMode();
  const isLightModeEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isLightModeEnabled ?? false,
  );
  const isMetadataLoading = useAppStore((state) => state.appMetadataState?.isLoading ?? true);
  // Read once, at mount: this is the answer from the previous visit, and it must
  // not change underneath the render while the real one is still loading.
  const [cachedThemeMode] = useState<ThemeMode | undefined>(readCachedThemeMode);

  const confirmedThemeMode: ThemeMode = isLightModeEnabled ? themeMode : 'dark';
  // The metadata defaults to `isLightModeEnabled: false` while it is in flight, so
  // reading the flag before it resolves would answer "dark" for the length of a
  // network round trip and then flip. Prefer last visit's answer for that window
  // and fall back to dark only on a first-ever load, which keeps a rollout that is
  // still off from ever flashing light.
  const resolvedThemeMode: ThemeMode = isMetadataLoading
    ? (cachedThemeMode ?? 'dark')
    : confirmedThemeMode;

  useEffect(() => {
    if (isMetadataLoading || !InBrowser()) {
      return;
    }

    window.localStorage.setItem(resolvedThemeModeStorageKey, confirmedThemeMode);
  }, [confirmedThemeMode, isMetadataLoading]);

  return resolvedThemeMode;
};

export default useResolvedThemeMode;
