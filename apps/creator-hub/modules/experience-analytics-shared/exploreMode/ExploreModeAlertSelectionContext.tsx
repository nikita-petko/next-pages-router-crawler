import type { FC, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import type { TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import { useUniverseResource } from '../hooks/useChartResourceProvider';
import useAlertsForMetric, { type AlertForMetric } from './useAlertsForMetric';

const QUERY_KEYS = [AnalyticsQueryParams.AlertIds] as const;

/**
 * Parse the raw `annotation_alertId` value coming back from `useQueryParams`
 * into the canonical "no filter" (`null`) / "show only these ids" (array)
 * shape consumed by the provider.
 *
 * Returning `null` (rather than `[]`) for the no-filter case lets the
 * per-chart filter degrade to today's "show every metric-matching
 * configured alert" behaviour, which is the pre-existing default whenever
 * the URL carries no `annotation_alertId`.
 *
 * Exported so the parsing rules stay unit-testable without rendering the
 * provider + a router mock.
 */
export const parseRawAlertIdsParam = (
  raw: string | string[] | undefined | null,
): readonly string[] | null => {
  if (raw === undefined || raw === null) {
    return null;
  }
  // The Next.js router exposes repeated query params as `string[]` and a
  // single instance as `string`. A user-typed empty value
  // (`?annotation_alertId=`) arrives as `''` and means "alerts row
  // checked but no specific ids pinned" — fall back to "show all"
  // rather than "show none".
  const asArray = Array.isArray(raw) ? raw : [raw];
  const cleaned = asArray.map((v) => v.trim()).filter((v) => v.length > 0);
  if (cleaned.length === 0) {
    return null;
  }
  // De-dupe while preserving the first-occurrence order so URLs stay stable
  // when callers (e.g. the perf-to-explore navigation) pass arrays they've
  // already ordered intentionally.
  return Array.from(new Set(cleaned));
};

/**
 * Sanitise the value passed into `setSelectedAlertIds` into the shape
 * persisted to the URL: a de-duped, trimmed array, or `null` to delete the
 * param entirely.
 *
 * An empty array (or one whose entries are all blank) collapses to `null`
 * so "clear" and "select none" produce the same URL — the latter has no
 * meaning in this UI (un-checking every row is just leaving the parent
 * Alerts annotation row checked, which is the no-filter case).
 *
 * Exported so the write-side rules stay unit-testable without router
 * mocks.
 */
export const serializeAlertIdsForUrl = (next: readonly string[] | null): string[] | null => {
  if (!next) {
    return null;
  }
  const sanitized = Array.from(new Set(next.filter((v) => v.length > 0)));
  return sanitized.length > 0 ? sanitized : null;
};

/**
 * Snapshot of the Explore Mode "Alerts" cascading sub-menu state, consumed
 * by both the dropdown UI and the per-chart annotation filter.
 *
 * `selectedAlertIds === null` is the "no `annotation_alertId` filter"
 * state — the default everywhere outside Explore Mode and in Explore
 * Mode when the URL carries no `annotation_alertId` param. Per-chart
 * filtering then degrades to today's "show every metric-matching
 * configured alert" behaviour.
 *
 * `availableAlertsForMetric` is the rich list of alerts (id + name) that
 * target the currently-displayed Explore metric, used by the sub-menu to
 * render its checkbox rows. Outside Explore Mode it stays empty so
 * non-Explore charts never reach into the alerts list.
 *
 * `isExploreModeContext` flips to `true` only inside the
 * `ExploreModeAlertSelectionProvider`. The per-chart filter uses it to
 * skip the per-chart breakdown/filter visibility rule for
 * `ConfiguredAlertIncident` annotations on Explore Mode (the rule is
 * already applied at the source chart whose visible alert ids seeded the
 * Explore URL). Outside Explore Mode it stays `false` and the existing
 * rule remains the only constraint.
 */
export type ExploreModeAlertSelectionContextValue = {
  isExploreModeContext: boolean;
  selectedAlertIds: ReadonlySet<string> | null;
  availableAlertsForMetric: readonly AlertForMetric[];
  isLoadingAvailableAlerts: boolean;
  setSelectedAlertIds: (next: readonly string[] | null) => void;
};

const EMPTY_AVAILABLE_ALERTS: readonly AlertForMetric[] = [];

const DEFAULT_VALUE: ExploreModeAlertSelectionContextValue = {
  isExploreModeContext: false,
  selectedAlertIds: null,
  availableAlertsForMetric: EMPTY_AVAILABLE_ALERTS,
  isLoadingAvailableAlerts: false,
  setSelectedAlertIds: () => undefined,
};

const ExploreModeAlertSelectionContext =
  createContext<ExploreModeAlertSelectionContextValue>(DEFAULT_VALUE);

/**
 * Pure decision helper used by `ExploreModeAlertSelectionProvider`'s
 * metric-change effect. Exported so the transition table can be unit-tested
 * without spinning up the provider + a router mock.
 *
 * Transition table (`previous → next`):
 *
 *   - `undefined → ...` (first render): never clear — required so a
 *     URL-driven pre-selection (deep link from a perf chart) survives
 *     mount whether or not `displayMetric` has resolved yet.
 *   - `null → X`: never clear — `displayMetric` starts as `null` while
 *     `displaySourceMetrics` is being resolved on mount, so the first
 *     `null → realMetric` transition is metric *resolution*, not a
 *     user-initiated metric switch. Clearing here would silently drop
 *     `?annotation_alertId` carried in from a perf-to-explore navigation
 *     (DSA-5486 regression).
 *   - `X → X`: no-op.
 *   - `X → Y` (X non-null, Y differs): clear.
 *   - `X → null` (X non-null): clear — treat metric loss as a destructive
 *     change, since the cascading sub-menu has nothing to anchor to.
 */
export const shouldClearAlertIdsOnMetricChange = (
  previous: TRAQIV2NumericUIMetric | null | undefined,
  next: TRAQIV2NumericUIMetric | null,
): boolean => previous !== undefined && previous !== null && previous !== next;

/**
 * Read the Explore Mode alert selection. Outside the Explore Mode provider
 * this returns the safe default: `selectedAlertIds = null` (no filter) and
 * an empty `availableAlertsForMetric` list, so existing pages keep their
 * unconditional "show every configured alert that targets the metric"
 * behaviour without any opt-in.
 */
export const useExploreModeAlertSelection = (): ExploreModeAlertSelectionContextValue =>
  useContext(ExploreModeAlertSelectionContext);

export type ExploreModeAlertSelectionProviderProps = PropsWithChildren<{
  /**
   * The Explore Mode display metric. `null` while the user hasn't selected
   * a metric yet (or while the metric is mid-update); the provider treats
   * that as "no available alerts" and "no filter".
   */
  displayMetric: TRAQIV2NumericUIMetric | null;
}>;

export const ExploreModeAlertSelectionProvider: FC<ExploreModeAlertSelectionProviderProps> = ({
  displayMetric,
  children,
}) => {
  const resource = useUniverseResource();

  // `annotation_alertId` URL query param is the single source of truth for
  // the cascading sub-menu's pinned ids. `null` means "no filter" — the
  // pre-existing behaviour when only the parent `Alerts` annotation row was
  // checked; a non-empty array means "show only these alert ids". The setter
  // never serialises an empty array (see `serializeAlertIdsForUrl`) so
  // "clear" and "select none" produce the same URL.
  const [params, setParams] = useQueryParams(QUERY_KEYS);
  const rawSelectedAlertIds = useMemo(
    () => parseRawAlertIdsParam(params[AnalyticsQueryParams.AlertIds]),
    [params],
  );
  const setSelectedAlertIds = useCallback(
    (next: readonly string[] | null) => {
      setParams({
        [AnalyticsQueryParams.AlertIds]: serializeAlertIdsForUrl(next),
      });
    },
    [setParams],
  );

  const { alerts, isLoading } = useAlertsForMetric(resource.id, displayMetric);

  // Clear pinned ids when the user switches the Explore display metric — ids
  // belong to a metric, so surviving a metric switch would re-engage them the
  // moment the user came back to the old metric. See
  // `shouldClearAlertIdsOnMetricChange` for the full transition table, in
  // particular why the initial `undefined → X` / `null → X` resolution
  // transitions must NOT clear (DSA-5486: preserves `?annotation_alertId`
  // deep-links from perf-to-explore navigation).
  const previousMetricRef = useRef<TRAQIV2NumericUIMetric | null | undefined>(undefined);
  useEffect(() => {
    const previous = previousMetricRef.current;
    previousMetricRef.current = displayMetric;
    if (shouldClearAlertIdsOnMetricChange(previous, displayMetric)) {
      setSelectedAlertIds(null);
    }
  }, [displayMetric, setSelectedAlertIds]);

  const selectedAlertIds = useMemo<ReadonlySet<string> | null>(() => {
    if (rawSelectedAlertIds === null) {
      return null;
    }
    // Narrow URL-supplied ids to ones the current metric actually owns. This
    // keeps stale ids (e.g. from a previous metric the user just switched
    // away from) from silently re-engaging when they re-select that metric,
    // and matches the "metric-change clears `annotation_alertId`" semantics.
    // The id-Set is computed inline (rather than exposed on the context)
    // because this is the only consumer that needs O(1) lookups; the public
    // surface ships only the rich `availableAlertsForMetric` list and lets
    // its consumers (today: a length-check and a name-rendering popover)
    // work from that directly.
    if (alerts.length === 0) {
      return new Set(rawSelectedAlertIds);
    }
    const availableIds = new Set(alerts.map((alert) => alert.alertId));
    return new Set(rawSelectedAlertIds.filter((id) => availableIds.has(id)));
  }, [rawSelectedAlertIds, alerts]);

  const value = useMemo<ExploreModeAlertSelectionContextValue>(
    () => ({
      isExploreModeContext: true,
      selectedAlertIds,
      availableAlertsForMetric: alerts,
      isLoadingAvailableAlerts: isLoading,
      setSelectedAlertIds,
    }),
    [selectedAlertIds, alerts, isLoading, setSelectedAlertIds],
  );

  return (
    <ExploreModeAlertSelectionContext.Provider value={value}>
      {children}
    </ExploreModeAlertSelectionContext.Provider>
  );
};

export default ExploreModeAlertSelectionContext;
