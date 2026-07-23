import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import type {
  TranslationKey,
  TranslationKeyToFormattedText,
} from '@modules/analytics-translations/types';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { TChartConfiguratorMetrics } from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import { codegenChartConfiguratorMetricToGroup } from '../../chartConfigurator/codegenChartConfiguratorMetricGrouping';
import {
  getFilterValueForDimension,
  updateFilterValues,
  type UIFilters,
} from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';

export const customEventsMetric: TChartConfiguratorMetrics = RAQIV2UIMetric.CustomEventsV2;

export const customEventsSourceKey: TranslationKey = {
  key: 'Heading.CustomEvents',
  namespace: TranslationNamespace.Analytics,
};

export const economySourceKey: TranslationKey = {
  key: 'Heading.Economy',
  namespace: TranslationNamespace.Analytics,
};

export function isCustomEventsSource(sourceFilter: TranslationKey | null): boolean {
  return (
    sourceFilter?.key === customEventsSourceKey.key &&
    sourceFilter.namespace === customEventsSourceKey.namespace
  );
}

export function isEconomySource(sourceFilter: TranslationKey | null): boolean {
  return (
    sourceFilter?.key === economySourceKey.key &&
    sourceFilter.namespace === economySourceKey.namespace
  );
}

export function initSourceFromMetric(
  metric: TChartConfiguratorMetrics | null,
): TranslationKey | null {
  if (metric === customEventsMetric) {
    return customEventsSourceKey;
  }
  return null;
}

function initSourceFromMetricAndFilters(
  metric: TChartConfiguratorMetrics | null,
  filters: UIFilters,
): TranslationKey | null {
  return (
    initSourceFromMetric(metric) ??
    (getFilterValueForDimension(filters, RAQIV2Dimension.CustomEventName, null)
      ? customEventsSourceKey
      : null)
  );
}

export type SourceChangeResult = {
  nextMetric: TChartConfiguratorMetrics | null | 'keep';
  clearCustomEventFilters: boolean;
};

/**
 * Computes the side-effects of a source change without mutating any state.
 * The returned `nextMetric` is either a concrete value to set, or `'keep'`
 * when the current metric should remain unchanged.
 */
export function computeSourceChange(
  newSource: TranslationKey | null,
  currentMetric: TChartConfiguratorMetrics | null,
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
    const currentGroupLabel = translate(codegenChartConfiguratorMetricToGroup(currentMetric));
    if (currentGroupLabel !== newSourceLabel) {
      return { nextMetric: null, clearCustomEventFilters: false };
    }
  }

  return { nextMetric: 'keep', clearCustomEventFilters: false };
}

export function filterMetricsForSource(
  availableMetrics: readonly TChartConfiguratorMetrics[],
  sourceFilter: TranslationKey | null,
  isCustomEvents: boolean,
  translate: TranslationKeyToFormattedText,
): TChartConfiguratorMetrics[] {
  const nonCustom = availableMetrics.filter((m) => m !== customEventsMetric);
  if (!sourceFilter || isCustomEvents) {
    return nonCustom;
  }
  const sourceLabel = translate(sourceFilter);
  return nonCustom.filter((m) => {
    const groupLabel = translate(codegenChartConfiguratorMetricToGroup(m));
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
  metric: TChartConfiguratorMetrics | null,
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

export type UseChartConfiguratorSourceSelectionArgs = {
  metric: TChartConfiguratorMetrics | null;
  setMetric: (metric: TChartConfiguratorMetrics | null) => void;
  availableMetrics: readonly TChartConfiguratorMetrics[];
  translate: TranslationKeyToFormattedText;
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
};

export type UseChartConfiguratorSourceSelectionResult = {
  sourceFilter: TranslationKey | null;
  isCustomEventsMode: boolean;
  filteredMetrics: TChartConfiguratorMetrics[];
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
export function useChartConfiguratorSourceSelection({
  metric,
  setMetric,
  availableMetrics,
  translate,
  filters,
  onFiltersChange,
}: UseChartConfiguratorSourceSelectionArgs): UseChartConfiguratorSourceSelectionResult {
  const [sourceFilter, setSourceFilter] = useState<TranslationKey | null>(() =>
    initSourceFromMetricAndFilters(metric, filters),
  );
  const pendingMetricFromSourceChangeRef = useRef<TChartConfiguratorMetrics | null | undefined>(
    undefined,
  );

  const isCustomEventsMode = isCustomEventsSource(sourceFilter);

  useEffect(() => {
    if (pendingMetricFromSourceChangeRef.current !== undefined) {
      if (metric === pendingMetricFromSourceChangeRef.current) {
        pendingMetricFromSourceChangeRef.current = undefined;
      }
      return;
    }
    if (metric === customEventsMetric && !isCustomEventsSource(sourceFilter)) {
      setSourceFilter(customEventsSourceKey);
      return;
    }
    const hasCustomEventNameFilter = Boolean(
      getFilterValueForDimension(filters, RAQIV2Dimension.CustomEventName, null),
    );
    if (
      metric !== customEventsMetric &&
      hasCustomEventNameFilter &&
      !isCustomEventsSource(sourceFilter)
    ) {
      setSourceFilter(customEventsSourceKey);
      return;
    }
    if (
      metric !== customEventsMetric &&
      !hasCustomEventNameFilter &&
      isCustomEventsSource(sourceFilter)
    ) {
      setSourceFilter(null);
    }
  }, [filters, metric, sourceFilter]);

  const filteredMetrics = useMemo(
    () => filterMetricsForSource(availableMetrics, sourceFilter, isCustomEventsMode, translate),
    [availableMetrics, sourceFilter, isCustomEventsMode, translate],
  );

  const handleSourceChange = useCallback(
    (newSource: TranslationKey | null) => {
      const result = computeSourceChange(newSource, metric, translate);
      setSourceFilter(newSource);
      if (result.nextMetric !== 'keep') {
        pendingMetricFromSourceChangeRef.current = result.nextMetric;
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
