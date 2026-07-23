import { useCallback, useMemo, useState } from 'react';
import type {
  TranslationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations';
import {
  codegenExploreModeMetricToGroup,
  getFilterValueForDimension,
  updateFilterValues,
  type TExploreModeMetrics,
  type UIFilters,
} from '@modules/experience-analytics-shared';
import {
  RAQIV2Dimension,
  RAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const customEventsMetric: TExploreModeMetrics = RAQIV2UIMetric.CustomEventsV2;

export const customEventsSourceKey: TranslationKey = {
  key: 'Heading.CustomEvents',
  namespace: TranslationNamespace.Analytics,
};

export function isCustomEventsSource(sourceFilter: TranslationKey | null): boolean {
  return (
    sourceFilter?.key === customEventsSourceKey.key &&
    sourceFilter.namespace === customEventsSourceKey.namespace
  );
}

export function initSourceFromMetric(metric: TExploreModeMetrics | null): TranslationKey | null {
  if (metric === customEventsMetric) {
    return customEventsSourceKey;
  }
  return null;
}

export type SourceChangeResult = {
  nextMetric: TExploreModeMetrics | null | 'keep';
  clearCustomEventFilters: boolean;
};

/**
 * Computes the side-effects of a source change without mutating any state.
 * The returned `nextMetric` is either a concrete value to set, or `'keep'`
 * when the current metric should remain unchanged.
 */
export function computeSourceChange(
  newSource: TranslationKey | null,
  currentMetric: TExploreModeMetrics | null,
  translate: TranslationKeyToFormattedText,
): SourceChangeResult {
  if (isCustomEventsSource(newSource)) {
    return { nextMetric: customEventsMetric, clearCustomEventFilters: false };
  }

  if (currentMetric === customEventsMetric) {
    return { nextMetric: null, clearCustomEventFilters: true };
  }

  if (newSource && currentMetric) {
    const newSourceLabel = translate(newSource);
    const currentGroupLabel = translate(codegenExploreModeMetricToGroup(currentMetric));
    if (currentGroupLabel !== newSourceLabel) {
      return { nextMetric: null, clearCustomEventFilters: false };
    }
  }

  return { nextMetric: 'keep', clearCustomEventFilters: false };
}

export function filterMetricsForSource(
  availableMetrics: readonly TExploreModeMetrics[],
  sourceFilter: TranslationKey | null,
  isCustomEvents: boolean,
  translate: TranslationKeyToFormattedText,
): TExploreModeMetrics[] {
  const nonCustom = availableMetrics.filter((m) => m !== customEventsMetric);
  if (!sourceFilter || isCustomEvents) return nonCustom;
  const sourceLabel = translate(sourceFilter);
  return nonCustom.filter((m) => {
    const groupLabel = translate(codegenExploreModeMetricToGroup(m));
    return groupLabel === sourceLabel;
  });
}

export function clearCustomEventFilters(filters: UIFilters): UIFilters {
  return updateFilterValues(
    updateFilterValues(filters, RAQIV2Dimension.CustomEventName, null),
    RAQIV2UIPseudoDimension.AggregationType,
    null,
  );
}

/**
 * Determines whether the chart query should proceed given the current
 * custom-events mode, the async context metric, and the active filters.
 *
 * Returns `false` to block the chart when:
 * - The local source mode and async context metric disagree (transition in progress)
 * - Custom events mode is active but no CustomEventName filter has been selected
 */
export function isCustomEventsQueryReady(
  isCustomEventsMode: boolean,
  metric: TExploreModeMetrics | null,
  filters: UIFilters | undefined,
): boolean {
  const metricIsCustom = metric === customEventsMetric;
  if (isCustomEventsMode !== metricIsCustom) {
    return false;
  }
  if (isCustomEventsMode) {
    return (
      getFilterValueForDimension(filters ?? [], RAQIV2Dimension.CustomEventName, null) !== null
    );
  }
  return true;
}

export type UseExploreModeSourceSelectionArgs = {
  metric: TExploreModeMetrics | null;
  setMetric: (metric: TExploreModeMetrics | null) => void;
  availableMetrics: readonly TExploreModeMetrics[];
  translate: TranslationKeyToFormattedText;
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
};

export type UseExploreModeSourceSelectionResult = {
  sourceFilter: TranslationKey | null;
  isCustomEventsMode: boolean;
  filteredMetrics: TExploreModeMetrics[];
  handleSourceChange: (source: TranslationKey | null) => void;
};

/**
 * Manages the source selector state and its relationship with custom events mode.
 *
 * `isCustomEventsMode` is derived solely from the local `sourceFilter` state
 * (not from `metric`) to avoid circular effects where an async metric update
 * from the context provider races with a synchronous source filter change.
 *
 * The initial `sourceFilter` is seeded from `metric` (for URL-based navigation)
 * via the `useState` initializer, which only runs on mount.
 */
export function useExploreModeSourceSelection({
  metric,
  setMetric,
  availableMetrics,
  translate,
  filters,
  onFiltersChange,
}: UseExploreModeSourceSelectionArgs): UseExploreModeSourceSelectionResult {
  const [sourceFilter, setSourceFilter] = useState<TranslationKey | null>(() =>
    initSourceFromMetric(metric),
  );

  const isCustomEventsMode = isCustomEventsSource(sourceFilter);

  const filteredMetrics = useMemo(
    () => filterMetricsForSource(availableMetrics, sourceFilter, isCustomEventsMode, translate),
    [availableMetrics, sourceFilter, isCustomEventsMode, translate],
  );

  const handleSourceChange = useCallback(
    (newSource: TranslationKey | null) => {
      const result = computeSourceChange(newSource, metric, translate);
      setSourceFilter(newSource);
      if (result.nextMetric !== 'keep') {
        setMetric(result.nextMetric);
      }
      if (result.clearCustomEventFilters) {
        onFiltersChange(clearCustomEventFilters(filters));
      }
    },
    [metric, setMetric, translate, filters, onFiltersChange],
  );

  return { sourceFilter, isCustomEventsMode, filteredMetrics, handleSourceChange };
}
