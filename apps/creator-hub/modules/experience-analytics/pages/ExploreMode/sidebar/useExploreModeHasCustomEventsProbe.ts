import { useEffect, useState } from 'react';
import {
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2UIMetric,
  type TRAQIV2APIMetric,
} from '@rbx/creator-hub-analytics-config';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { CUSTOM_EVENTS_RANGE_TYPE } from '@modules/experience-analytics-shared/chartConfigurator/customEventsDateRange';
import {
  getCachedHasCustomEvents,
  setCachedHasCustomEvents,
} from '@modules/experience-analytics-shared/exploreMode/exploreModeHasCustomEventsStorage';
import useRAQIV2DimensionValuesRequest from '@modules/experience-analytics-shared/hooks/useRAQIV2DimensionValuesRequest';
import type TDateRangeSelection from '@modules/experience-analytics-shared/types/DateRangeSelection';
import { DateRangeSelectionType } from '@modules/experience-analytics-shared/types/DateRangeSelection';
import { getAPIMetricFromUIMetric } from '@modules/experience-analytics-shared/utils/getAPIMetricFromUIMetric';

const probeDateRangeSelection: TDateRangeSelection = {
  type: DateRangeSelectionType.Preset,
  rangeType: CUSTOM_EVENTS_RANGE_TYPE,
  granularity: RAQIV2MetricGranularity.None,
};

const probeContextMetrics: TRAQIV2APIMetric[] = [
  getAPIMetricFromUIMetric(RAQIV2UIMetric.CustomEventsV2, {
    percentile: null,
    aggregationType: null,
  }),
];

// Stable empty-array reference for the disabled-probe path. Hoisted to module
// scope so `useRAQIV2DimensionValuesRequest`'s `useCallback` dependency arrays
// don't see a fresh `[]` on every render.
const EMPTY_CONTEXT_METRICS: TRAQIV2APIMetric[] = [];

export type HasCustomEventsState = 'unknown' | 'yes' | 'no';

/**
 * Resolves whether the universe has any custom events in the last 90 days.
 *
 * Cache flow:
 *   - Synchronous read of the per-universe localStorage cache on mount.
 *     If a non-stale value is present, we report it immediately and skip
 *     the network probe.
 *   - Otherwise (cache miss / stale), fire the same `getDimensionValues`
 *     request the dedicated custom-events page uses and persist the result
 *     when it resolves.
 *
 * `enabled=false` fully disables the probe (returns `'unknown'` and does no
 * network or cache work). Useful when the caller already has a metric or
 * computedMetric and the answer is irrelevant for default selection.
 */
const useExploreModeHasCustomEventsProbe = (
  resource: RAQIV2ChartResource,
  enabled = true,
): HasCustomEventsState => {
  const universeId = resource.id;
  // Snapshot the cache when `universeId` changes (or on mount) so the return
  // value is stable across renders for a given universe — re-reading from
  // localStorage on every render would still be correct, but it would let an
  // external write change our return value mid-component-tree, which is
  // harder to reason about. We re-derive on `universeId` change (rather than
  // assuming the parent remounts) so a route-driven universe switch without
  // remount can't keep returning the previous universe's cached answer.
  // (https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  const [cachedAnswer, setCachedAnswer] = useState<boolean | null>(() =>
    getCachedHasCustomEvents(universeId),
  );
  const [snapshotUniverseId, setSnapshotUniverseId] = useState<number | string>(universeId);
  if (snapshotUniverseId !== universeId) {
    setSnapshotUniverseId(universeId);
    setCachedAnswer(getCachedHasCustomEvents(universeId));
  }
  const shouldFetch = enabled && cachedAnswer === null;

  // Always call the hook (rules of hooks). When `shouldFetch` is false, we
  // pass an empty `contextMetrics` array which short-circuits the hook to a
  // null response without hitting the network.
  const { data, isDataLoading, isResponseFailed } = useRAQIV2DimensionValuesRequest(
    resource,
    RAQIV2Dimension.CustomEventName,
    shouldFetch ? probeContextMetrics : EMPTY_CONTEXT_METRICS,
    probeDateRangeSelection,
  );

  useEffect(() => {
    if (!shouldFetch) {
      return;
    }
    if (isDataLoading || isResponseFailed) {
      return;
    }
    if (data === null || data === undefined) {
      return;
    }
    const hasCustomEvents = (data.values?.length ?? 0) > 0;
    setCachedHasCustomEvents(universeId, hasCustomEvents);
  }, [data, isDataLoading, isResponseFailed, shouldFetch, universeId]);

  if (cachedAnswer !== null) {
    return cachedAnswer ? 'yes' : 'no';
  }
  if (!shouldFetch) {
    return 'unknown';
  }
  if (isDataLoading || isResponseFailed) {
    return 'unknown';
  }
  if (data === null || data === undefined) {
    return 'unknown';
  }
  return (data.values?.length ?? 0) > 0 ? 'yes' : 'no';
};

export default useExploreModeHasCustomEventsProbe;
