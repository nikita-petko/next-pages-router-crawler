/**
 * Per-universe persistence of the user's last-selected source in Explore
 * mode. We track either:
 *   - an atomic numeric UI metric (e.g. DailyActiveUsers, DailyRevenue), or
 *   - a CustomEventsV2 selection along with the chosen event name.
 *
 * The atomic-metric branch matches the URL's `metric=` query param exactly,
 * while the custom-event branch combines `metric=CustomEventsV2` with
 * `filter_CustomEventName=<name>` (the event name is the differentiator the
 * user actually cares about — it's effectively the source itself, not the
 * underlying metric).
 *
 * Storage is keyed per-universe so picking a source for one experience does
 * not bleed across to another.
 */
import {
  isChartConfiguratorMetric,
  type TChartConfiguratorMetrics,
} from '../chartConfigurator/chartConfiguratorMetricsConfig';

export type LastSelectedExploreSource =
  | { kind: 'metric'; metric: TChartConfiguratorMetrics }
  | { kind: 'customEvent'; eventName: string };

const KEY_PREFIX = 'exploreModeLastSource';

const buildKey = (universeId: number | string): string => `${KEY_PREFIX}-${universeId}`;

export const isLastSelectedExploreSource = (value: unknown): value is LastSelectedExploreSource => {
  if (!value || typeof value !== 'object' || !('kind' in value)) {
    return false;
  }
  if (value.kind === 'metric') {
    return (
      'metric' in value &&
      typeof value.metric === 'string' &&
      isChartConfiguratorMetric(value.metric)
    );
  }
  if (value.kind === 'customEvent') {
    return (
      'eventName' in value && typeof value.eventName === 'string' && value.eventName.length > 0
    );
  }
  return false;
};

export const getLastSelectedExploreSource = (
  universeId: number | string,
): LastSelectedExploreSource | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(buildKey(universeId));
    if (raw == null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isLastSelectedExploreSource(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const setLastSelectedExploreSource = (
  universeId: number | string,
  value: LastSelectedExploreSource | null,
): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const key = buildKey(universeId);
    if (value === null) {
      window.localStorage.removeItem(key);
      return;
    }
    if (!isLastSelectedExploreSource(value)) {
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota-exceeded / privacy mode — silently ignore; UX gracefully
    // falls back to no remembered source.
  }
};

// Exposed for tests; not part of the public module surface.
export const testConstants = { KEY_PREFIX, buildKey } as const;
