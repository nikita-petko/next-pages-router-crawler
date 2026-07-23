import type { CreatorConfigsPublicApiConfigValueFull } from '@modules/clients/creatorConfigsPublicApi';
import stableFingerprint from './stableFingerprint';

export type LastUpdatedCacheEntry = {
  fingerprint: string;
  updatedAtIso: string;
};

export const getNextLastUpdatedByKey = (
  prev: Record<string, LastUpdatedCacheEntry>,
  entriesMap: Record<string, CreatorConfigsPublicApiConfigValueFull | null | undefined>,
): Record<string, LastUpdatedCacheEntry> => {
  const next: Record<string, LastUpdatedCacheEntry> = {};

  Object.entries(entriesMap).forEach(([key, entry]) => {
    if (!entry || entry.value == null) return;
    const fingerprint = stableFingerprint(entry.value);
    const existing = prev[key];
    const updatedAtIso =
      existing && existing.fingerprint === fingerprint
        ? existing.updatedAtIso
        : entry.lastModifiedTime;
    next[key] = { fingerprint, updatedAtIso };
  });

  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  const isSame =
    prevKeys.length === nextKeys.length &&
    nextKeys.every(
      (k) =>
        prev[k]?.fingerprint === next[k]?.fingerprint &&
        prev[k]?.updatedAtIso === next[k]?.updatedAtIso,
    );

  return isSame ? prev : next;
};
