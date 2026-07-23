import { useLocalStorage } from '@rbx/react-utilities';
import { useCallback } from 'react';
import { FeatureFlagNamespace } from '../namespaces';
import { TFlag } from '../types';

const LOCAL_OVERRIDE_STORAGE_KEY = 'feature-flags-local-override';

const useLocalFlagOverrides = () => {
  const [localFlagOverrides, setLocalFlagOverrides] = useLocalStorage<
    Partial<{
      [Namespace in FeatureFlagNamespace]: {
        flags: Partial<Record<TFlag<Namespace>, boolean>>;
      };
    }>
  >(LOCAL_OVERRIDE_STORAGE_KEY, {});

  const overrideFlag = useCallback(
    <Namespace extends FeatureFlagNamespace>(
      flag: TFlag<Namespace>,
      value: boolean | undefined,
      namespace: Namespace,
    ) => {
      setLocalFlagOverrides((prev) => {
        const currentFlags = {
          ...(prev[namespace]?.flags ?? {}),
        } as Record<string, boolean | undefined>;

        if (value === undefined) {
          delete currentFlags[flag];
        } else {
          currentFlags[flag] = value;
        }
        return {
          ...prev,
          [namespace]: {
            flags: currentFlags,
          },
        };
      });
    },
    [setLocalFlagOverrides],
  );

  const clearAllOverrides = useCallback(() => {
    setLocalFlagOverrides({});
  }, [setLocalFlagOverrides]);

  return { localFlagOverrides, overrideFlag, clearAllOverrides };
};

export default useLocalFlagOverrides;

const RECENTLY_CHANGED_STORAGE_KEY = 'feature-flags-recently-changed';
const MAX_RECENTLY_CHANGED = 15;

export interface RecentlyChangedEntry {
  flag: string;
  namespace: FeatureFlagNamespace;
  changedAt: number;
}

const COLLAPSED_SECTIONS_STORAGE_KEY = 'feature-flags-collapsed-sections';

export const useCollapsedSections = () => {
  const [collapsedSections, setCollapsedSections] = useLocalStorage<string[]>(
    COLLAPSED_SECTIONS_STORAGE_KEY,
    [],
  );

  const toggleSection = useCallback(
    (sectionKey: string) => {
      setCollapsedSections((prev) =>
        prev.includes(sectionKey)
          ? prev.filter((key) => key !== sectionKey)
          : [...prev, sectionKey],
      );
    },
    [setCollapsedSections],
  );

  const isSectionCollapsed = useCallback(
    (sectionKey: string) => collapsedSections.includes(sectionKey),
    [collapsedSections],
  );

  return { isSectionCollapsed, toggleSection };
};

export const useRecentlyChangedFlags = () => {
  const [recentlyChanged, setRecentlyChanged] = useLocalStorage<RecentlyChangedEntry[]>(
    RECENTLY_CHANGED_STORAGE_KEY,
    [],
  );

  const recordFlagChange = useCallback(
    (flag: string, namespace: FeatureFlagNamespace) => {
      setRecentlyChanged((prev) => {
        const filtered = prev.filter(
          (entry) => !(entry.flag === flag && entry.namespace === namespace),
        );
        return [{ flag, namespace, changedAt: Date.now() }, ...filtered].slice(
          0,
          MAX_RECENTLY_CHANGED,
        );
      });
    },
    [setRecentlyChanged],
  );

  const clearRecentlyChanged = useCallback(() => {
    setRecentlyChanged([]);
  }, [setRecentlyChanged]);

  return { recentlyChanged, recordFlagChange, clearRecentlyChanged };
};
