import { useEffect, useRef, useState } from 'react';
import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import { isChartConfiguratorMetric } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import { customEventsMetric } from '@modules/experience-analytics-shared/components/chartConfigurator/useChartConfiguratorSourceSelection';
import {
  getLastSelectedExploreSource,
  setLastSelectedExploreSource,
  type LastSelectedExploreSource,
} from '@modules/experience-analytics-shared/exploreMode/exploreModeLastSourceStorage';
import {
  getFilterValueForDimension,
  updateFilterValues,
  type UIFilters,
} from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import {
  getUIMetricFromAtomicMetricLike,
  isCustomEventsAtomicMetricLike,
  type ComputedMetric,
} from '@modules/experience-analytics-shared/types/ComputedMetric';
import type { HasCustomEventsState } from './useExploreModeHasCustomEventsProbe';

export type ExploreModeLastSourcePersistenceArgs = {
  universeId: number | string;
  metric: TChartConfiguratorMetrics | null;
  setMetric: (metric: TChartConfiguratorMetrics | null) => void;
  computedMetric: ComputedMetric | null;
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
  hasCustomEvents: HasCustomEventsState;
  /**
   * Set to `true` once feature flags have resolved and the URL has had a
   * chance to populate the explore-mode metric / computedMetric query
   * params. Restoration is gated on this so we don't clobber URL state
   * during the brief Next.js router-not-ready window.
   */
  isReady: boolean;
};

export type ExploreModeLastSourcePersistenceResult = {
  /**
   * `true` after this hook automatically defaulted the source to
   * CustomEventsV2 — either because the cached "has custom events" flag
   * said yes, or because a remembered custom-event source was applied.
   *
   * Consumers use this to forward an `autoFocus` hint to the event-name
   * combobox so the user lands on the next required control.
   */
  didAutoSelectCustomEvents: boolean;
};

const eventNameFromComputedSource = (cm: ComputedMetric): string | null => {
  if (cm.sources.length === 0) {
    return null;
  }
  const first = cm.sources[0];
  if (!isCustomEventsAtomicMetricLike(first.metric) || first.metric.metric !== customEventsMetric) {
    return null;
  }
  return first.metric.customEventName;
};

const computeRememberedValue = (
  metric: TChartConfiguratorMetrics | null,
  computedMetric: ComputedMetric | null,
  filters: UIFilters,
  isCustomEventsMode: boolean,
): LastSelectedExploreSource | null => {
  // Custom events branch (atomic): the source is identified by its event
  // name, not by the underlying CustomEventsV2 metric. Skip persisting
  // until the user actually picks an event so we don't overwrite a
  // previously remembered choice with an in-progress empty state.
  if (isCustomEventsMode && metric === customEventsMetric) {
    const eventName = getFilterValueForDimension(filters, RAQIV2Dimension.CustomEventName, null);
    if (typeof eventName === 'string' && eventName.length > 0) {
      return { kind: 'customEvent', eventName };
    }
    return null;
  }

  // Computed metric: persist whatever the first (primary) source resolves
  // to. For computed metrics whose primary source is CustomEventsV2 with a
  // selected event, this still surfaces the user's "intended source" on a
  // later visit even though the URL carries a `cm2.` payload.
  if (computedMetric && computedMetric.sources.length > 0) {
    const eventName = eventNameFromComputedSource(computedMetric);
    if (eventName) {
      return { kind: 'customEvent', eventName };
    }
    const firstMetric = getUIMetricFromAtomicMetricLike(computedMetric.sources[0].metric);
    if (isChartConfiguratorMetric(firstMetric) && firstMetric !== customEventsMetric) {
      return { kind: 'metric', metric: firstMetric };
    }
    return null;
  }

  if (metric && metric !== customEventsMetric) {
    return { kind: 'metric', metric };
  }
  return null;
};

const sameValue = (
  a: LastSelectedExploreSource | null,
  b: LastSelectedExploreSource | null,
): boolean => {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  if (a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'metric' && b.kind === 'metric') {
    return a.metric === b.metric;
  }
  if (a.kind === 'customEvent' && b.kind === 'customEvent') {
    return a.eventName === b.eventName;
  }
  return false;
};

/**
 * Combines the two persistence flows for Explore mode's remembered source:
 *
 *   1. Restore (one-shot): on the first ready render where neither
 *      `metric` nor `computedMetric` is populated, apply the remembered
 *      source from localStorage. If nothing is remembered but the universe
 *      is known to have custom events, default to CustomEventsV2.
 *   2. Remember (ongoing): persist the user's active source to localStorage
 *      whenever it materially changes.
 *
 * The remember effect runs unconditionally (after restore has had its
 * one-shot opportunity), so a restore-induced metric update is itself
 * persisted — confirming the remembered value with a fresh storedAtMs.
 */
const useExploreModeLastSourcePersistence = ({
  universeId,
  metric,
  setMetric,
  computedMetric,
  filters,
  onFiltersChange,
  hasCustomEvents,
  isReady,
}: ExploreModeLastSourcePersistenceArgs): ExploreModeLastSourcePersistenceResult => {
  const restoredRef = useRef(false);
  // State (not ref) so consumers re-render when this flips. Refs don't
  // trigger re-renders, which made the previous version rely on the
  // coincidence that every `didAutoSelectCustomEventsRef.current = true`
  // happened immediately before a `setMetric(customEventsMetric)` — fragile
  // if a future code path flips the flag without changing metric.
  const [didAutoSelectCustomEvents, setDidAutoSelectCustomEvents] = useState(false);
  const lastPersistedRef = useRef<LastSelectedExploreSource | null>(null);

  const isCustomEventsMode = metric === customEventsMetric;

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (restoredRef.current) {
      return;
    }
    // The user already has a metric or computed metric in the URL — that
    // takes precedence over remembered state. Mark restore complete so we
    // don't ever attempt it again for this mount.
    if (metric || computedMetric) {
      restoredRef.current = true;
      return;
    }

    const remembered = getLastSelectedExploreSource(universeId);
    if (remembered) {
      restoredRef.current = true;
      if (remembered.kind === 'metric') {
        setMetric(remembered.metric);
        return;
      }
      // Custom event branch.
      setMetric(customEventsMetric);
      setDidAutoSelectCustomEvents(true);
      const existingEventName = getFilterValueForDimension(
        filters,
        RAQIV2Dimension.CustomEventName,
        null,
      );
      if (existingEventName !== remembered.eventName) {
        onFiltersChange(
          updateFilterValues(filters, RAQIV2Dimension.CustomEventName, [remembered.eventName]),
        );
      }
      return;
    }

    if (hasCustomEvents === 'yes') {
      restoredRef.current = true;
      setDidAutoSelectCustomEvents(true);
      setMetric(customEventsMetric);
      return;
    }
    if (hasCustomEvents === 'no') {
      restoredRef.current = true;
    }
    // hasCustomEvents === 'unknown' → re-run when the probe resolves.
  }, [
    isReady,
    metric,
    computedMetric,
    universeId,
    setMetric,
    filters,
    onFiltersChange,
    hasCustomEvents,
  ]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    const next = computeRememberedValue(metric, computedMetric, filters, isCustomEventsMode);
    if (next === null) {
      return;
    }
    if (sameValue(lastPersistedRef.current, next)) {
      return;
    }
    lastPersistedRef.current = next;
    setLastSelectedExploreSource(universeId, next);
  }, [isReady, metric, computedMetric, filters, isCustomEventsMode, universeId]);

  return { didAutoSelectCustomEvents };
};

export default useExploreModeLastSourcePersistence;
