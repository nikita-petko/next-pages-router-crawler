import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';

/**
 * Canonical 90-day preset window for custom-events queries.
 *
 * Three call sites issue the same `getDimensionValues` request against the
 * `CustomEventName` dimension:
 *   - The dedicated Custom Events page (`CustomEventsPageContent`).
 *   - The Explore-mode event-name combobox (`ChartConfiguratorCustomEventControls`).
 *   - The Explore-mode mount-time probe (`useExploreModeHasCustomEventsProbe`).
 *
 * Keeping these in lockstep is load-bearing: React Query keys the cache by
 * the time-range payload, so a divergent range at any of the three sites
 * silently splits the cache and forces an extra network round-trip per
 * visit. Centralising the value here makes that contract enforceable.
 */
export const CUSTOM_EVENTS_RANGE_TYPE = RAQIV2DateRangeType.Last90Days;
