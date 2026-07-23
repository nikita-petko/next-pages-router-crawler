import { useEffect, useRef } from 'react';
import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { getLastSelectedCustomEventName } from '../../exploreMode/exploreModeLastCustomEventNameStorage';
import {
  getFilterValueForDimension,
  updateFilterValues,
  type UIFilters,
} from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';

export type UseChartConfiguratorAutoFocusEventNameArgs = {
  /**
   * Parent signal: `true` only when Explore mode just defaulted the source
   * to Custom Events on the user's behalf. The cache-rehydration effect
   * below is gated on this flag, and callers should forward it to the
   * matching `autoFocus` DOM prop on the event-name combobox.
   */
  autoFocusEventName: boolean;
  resourceId: number | string;
  eventTypeValues: readonly string[];
  isEventTypeLoading: boolean;
  isEventTypeRequestFailed: boolean;
  /** True once the dimension request has resolved with a non-null payload. */
  isEventTypeResolved: boolean;
  selectedEventType: string | null;
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
};

/**
 * Side-effect-only hook that runs the one-shot cache rehydration matching
 * Explore mode's auto-defaulted Custom Events source:
 *
 *   Once the option list has resolved, auto-apply the per-universe
 *   remembered event name when it is still valid; otherwise use the first
 *   loaded event name. In both cases, include a default aggregation in the
 *   filter payload — but only when the combobox is empty.
 *
 * Pair this with `autoFocus={autoFocusEventName}` on the event-name
 * combobox at the call site (gated on the same flag) so the user also
 * lands on the control without an extra click.
 *
 * The internal one-shot ref guarantees that if the user clears the field
 * after the auto-apply, we don't silently rehydrate the cached choice on
 * the next render. We also flip the ref when we decide to skip so a later
 * filter change that causes the effect to re-run doesn't reopen the
 * auto-apply window.
 */
const useChartConfiguratorAutoFocusEventName = ({
  autoFocusEventName,
  resourceId,
  eventTypeValues,
  isEventTypeLoading,
  isEventTypeRequestFailed,
  isEventTypeResolved,
  selectedEventType,
  filters,
  onFiltersChange,
}: UseChartConfiguratorAutoFocusEventNameArgs): void => {
  const hasAutoAppliedRef = useRef(false);

  useEffect(() => {
    if (!autoFocusEventName || hasAutoAppliedRef.current) {
      return;
    }
    if (isEventTypeLoading || isEventTypeRequestFailed || !isEventTypeResolved) {
      return;
    }
    if (eventTypeValues.length === 0 || selectedEventType) {
      return;
    }
    const cached = getLastSelectedCustomEventName(resourceId);
    const eventName = cached && eventTypeValues.includes(cached) ? cached : eventTypeValues[0];
    hasAutoAppliedRef.current = true;
    const withEvent = updateFilterValues(filters, RAQIV2Dimension.CustomEventName, [eventName]);
    const existingAgg = getFilterValueForDimension(
      withEvent,
      RAQIV2UIPseudoDimension.AggregationType,
      null,
    );
    const next = existingAgg
      ? withEvent
      : updateFilterValues(withEvent, RAQIV2UIPseudoDimension.AggregationType, [
          RAQIV2AggregationType.Sum,
        ]);
    onFiltersChange(next);
  }, [
    autoFocusEventName,
    eventTypeValues,
    filters,
    isEventTypeLoading,
    isEventTypeRequestFailed,
    isEventTypeResolved,
    onFiltersChange,
    resourceId,
    selectedEventType,
  ]);
};

export default useChartConfiguratorAutoFocusEventName;
