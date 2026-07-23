import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getOverride, subscribe } from '../config/overrides';
import {
  COLLAPSED_SECTIONS_STORAGE_KEY,
  MAX_RECENTLY_CHANGED,
  RECENTLY_CHANGED_STORAGE_KEY,
} from './constants';
import { getValidOverride } from './flagUtils';
import { readRecentEntries, readStringArray, setStorageItem } from './storage';
import type { FlagMetadata } from './widgetTypes';

export function useLocalOverride<T, TValueType extends string>(
  metadata: FlagMetadata<T, TValueType>,
): T | undefined;
export function useLocalOverride(metadata: FlagMetadata): unknown {
  const getSnapshot = useCallback(
    () => getValidOverride(metadata, getOverride(metadata.namespace, metadata.name)),
    [metadata],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}

export function useCollapsedSections() {
  const [collapsedSections, setCollapsedSections] = useState(() =>
    readStringArray(COLLAPSED_SECTIONS_STORAGE_KEY),
  );

  // Persist section collapse state so the widget layout survives page reloads.
  useEffect(() => {
    setStorageItem(COLLAPSED_SECTIONS_STORAGE_KEY, JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  const toggleSection = useCallback((sectionKey: string) => {
    setCollapsedSections((prev) =>
      prev.includes(sectionKey) ? prev.filter((key) => key !== sectionKey) : [...prev, sectionKey],
    );
  }, []);

  const isSectionCollapsed = useCallback(
    (sectionKey: string) => collapsedSections.includes(sectionKey),
    [collapsedSections],
  );

  return { isSectionCollapsed, toggleSection };
}

export function useRecentlyChangedFlags() {
  const [recentlyChanged, setRecentlyChanged] = useState(() => readRecentEntries());

  // Persist the recently changed list so local override history is not lost on refresh.
  useEffect(() => {
    setStorageItem(RECENTLY_CHANGED_STORAGE_KEY, JSON.stringify(recentlyChanged));
  }, [recentlyChanged]);

  const recordFlagChange = useCallback((metadata: FlagMetadata) => {
    setRecentlyChanged((prev) => {
      const existingIndex = prev.findIndex(
        (entry) => entry.namespace === metadata.namespace && entry.name === metadata.name,
      );

      // Keep a flag that's already listed in its current spot so repeatedly
      // toggling it doesn't make the row jump out from under the cursor. Only
      // refresh its timestamp; brand-new flags still surface at the top.
      if (existingIndex !== -1) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], changedAt: Date.now() };
        return next;
      }

      return [
        { namespace: metadata.namespace, name: metadata.name, changedAt: Date.now() },
        ...prev,
      ].slice(0, MAX_RECENTLY_CHANGED);
    });
  }, []);

  const clearRecentlyChanged = useCallback(() => {
    setRecentlyChanged([]);
  }, []);

  return { recentlyChanged, recordFlagChange, clearRecentlyChanged };
}
