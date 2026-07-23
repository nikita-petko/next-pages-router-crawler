import type { FC } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
  RAQIV2AggregationType,
  RAQIV2APIMetric,
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { Dropdown, FeedbackBanner, Menu, MenuItem, MenuSection, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import ComboboxTypeahead, {
  ComboboxTypeaheadOption,
} from '@modules/charts-generic/components/ComboboxTypeahead';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { setCachedHasCustomEvents } from '../../exploreMode/exploreModeHasCustomEventsStorage';
import { setLastSelectedCustomEventName } from '../../exploreMode/exploreModeLastCustomEventNameStorage';
import useRAQIV2DimensionValuesRequest from '../../hooks/useRAQIV2DimensionValuesRequest';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import {
  getFilterValueForDimension,
  updateFilterValues,
  type UIFilters,
} from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import getDimensionRenderer from '../getDimensionRenderer';
import useChartConfiguratorAutoFocusEventName from './useChartConfiguratorAutoFocusEventName';

const aggregationTypeOptions: readonly RAQIV2AggregationType[] = [
  RAQIV2AggregationType.Sum,
  RAQIV2AggregationType.Count,
  RAQIV2AggregationType.Average,
  RAQIV2AggregationType.AveragePerUser,
  RAQIV2AggregationType.Max,
  RAQIV2AggregationType.Min,
  RAQIV2AggregationType.CountUser,
];

type ChartConfiguratorCustomEventControlsProps = {
  resource: RAQIV2ChartResource;
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
  hasEventTypeError?: boolean;
  /**
   * When true, the event-name combobox auto-focuses on first mount. Set
   * by the parent only when Explore mode just defaulted the source to
   * Custom Events on the user's behalf, so the user lands on the next
   * required control without an extra click.
   */
  autoFocusEventName?: boolean;
};

const ChartConfiguratorCustomEventControls: FC<ChartConfiguratorCustomEventControlsProps> = ({
  resource,
  filters,
  onFiltersChange,
  hasEventTypeError,
  autoFocusEventName = false,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const translationDeps = useRAQIV2TranslationDependencies();

  const eventTypeLabel = tPendingTranslation(
    'Event type',
    'Label for the custom event type dropdown selector.',
    translationKey('Label.ExploreMode.EventType', TranslationNamespace.Analytics),
  );
  const selectEventTypePlaceholder = tPendingTranslation(
    'Select an event type',
    'Placeholder text in the event type dropdown before a value is selected.',
    translationKey('Placeholder.ExploreMode.SelectEventType', TranslationNamespace.Analytics),
  );
  const aggregationLabel = tPendingTranslation(
    'Aggregation',
    'Label for the aggregation type dropdown selector.',
    translationKey('Label.ExploreMode.Aggregation', TranslationNamespace.Analytics),
  );
  const selectAggregationPlaceholder = tPendingTranslation(
    'Select aggregation',
    'Placeholder text in the aggregation type dropdown before a value is selected.',
    translationKey('Placeholder.ExploreMode.SelectAggregation', TranslationNamespace.Analytics),
  );
  const noEventsMessage = tPendingTranslation(
    'No custom events found in the selected date range',
    'Warning shown in place of the event-type selector when no custom events have been fired by the experience within the page-wide date range that the user has selected.',
    translationKey('Message.ExploreMode.NoCustomEvents', TranslationNamespace.Analytics),
  );
  const loadingPlaceholder = tPendingTranslation(
    'Loading…',
    'Placeholder text shown while event types are being loaded.',
    translationKey('Label.ExploreMode.Loading', TranslationNamespace.Analytics),
  );

  const contextMetrics = useMemo(() => [RAQIV2APIMetric.CustomEventCount], []);
  const {
    data: eventTypeData,
    isDataLoading: isEventTypeLoading,
    isResponseFailed: isEventTypeRequestFailed,
  } = useRAQIV2DimensionValuesRequest(resource, RAQIV2Dimension.CustomEventName, contextMetrics);

  const eventTypeValues = useMemo(() => {
    const raw = eventTypeData?.values?.map((v) => v.value ?? '').filter(Boolean) ?? [];
    return raw.sort((a, b) => a.localeCompare(b));
  }, [eventTypeData]);

  // Only surface the "no custom events" banner once the request has actually
  // completed successfully with an empty result. `isDataLoading` flips to
  // false even when the underlying makeRequest short-circuits to `null`
  // (e.g. RAQIV2 prerequisites not yet ready), so we additionally require
  // that we received a non-null response and the request didn't fail —
  // otherwise the banner would flash on mount before the fetch resolves.
  const hasNoEvents =
    !isEventTypeLoading &&
    !isEventTypeRequestFailed &&
    eventTypeData !== null &&
    eventTypeValues.length === 0;

  // Whenever this control's dimension fetch resolves, write the result
  // through to the per-universe localStorage cache. Two downstream consumers
  // read it without a dedicated probe round-trip on subsequent visits:
  //   - The Explore-mode left-rail entry, for the "creator already has
  //     custom events" NUX tooltip on navigation render.
  //   - Explore mode at mount time, to decide whether to default the source
  //     picker to Custom Events — see `useExploreModeHasCustomEventsProbe`.
  useEffect(() => {
    if (isEventTypeLoading || isEventTypeRequestFailed) {
      return;
    }
    if (eventTypeData === null || eventTypeData === undefined) {
      return;
    }
    setCachedHasCustomEvents(resource.id, eventTypeValues.length > 0);
  }, [
    eventTypeData,
    eventTypeValues.length,
    isEventTypeLoading,
    isEventTypeRequestFailed,
    resource.id,
  ]);

  const selectedEventType = useMemo(
    () => getFilterValueForDimension(filters, RAQIV2Dimension.CustomEventName, null),
    [filters],
  );

  const handleEventTypeSelect = useCallback(
    (value: string, close: () => void) => {
      const withEvent = updateFilterValues(filters, RAQIV2Dimension.CustomEventName, [value]);
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
      setLastSelectedCustomEventName(resource.id, value);
      close();
    },
    [filters, onFiltersChange, resource.id],
  );

  // Side-effect: one-shot rehydrate the per-universe remembered event name
  // once the option list resolves. Gated on `autoFocusEventName` so the
  // rehydration and the DOM auto-focus below stay in lockstep.
  useChartConfiguratorAutoFocusEventName({
    autoFocusEventName,
    resourceId: resource.id,
    eventTypeValues,
    isEventTypeLoading,
    isEventTypeRequestFailed,
    isEventTypeResolved: eventTypeData !== null && eventTypeData !== undefined,
    selectedEventType,
    filters,
    onFiltersChange,
  });

  const selectedAggregationType = useMemo(
    () =>
      getFilterValueForDimension(
        filters,
        RAQIV2UIPseudoDimension.AggregationType,
        RAQIV2AggregationType.Sum,
      ),
    [filters],
  );

  // Back-stop for non-interactive paths (deep-linked URLs, URL-ownership
  // restoration when toggling out of operations mode). The interactive
  // path bundles the default into handleEventTypeSelect to avoid a
  // second filter update.
  useEffect(() => {
    if (!selectedEventType) {
      return;
    }
    const existing = getFilterValueForDimension(
      filters,
      RAQIV2UIPseudoDimension.AggregationType,
      null,
    );
    if (!existing) {
      onFiltersChange(
        updateFilterValues(filters, RAQIV2UIPseudoDimension.AggregationType, [
          RAQIV2AggregationType.Sum,
        ]),
      );
    }
  }, [filters, onFiltersChange, selectedEventType]);

  const handleAggregationChange = useCallback(
    (value: string) => {
      const newFilters = updateFilterValues(filters, RAQIV2UIPseudoDimension.AggregationType, [
        value,
      ]);
      onFiltersChange(newFilters);
    },
    [filters, onFiltersChange],
  );

  const aggregationRenderer = useMemo(
    () => getDimensionRenderer(RAQIV2UIPseudoDimension.AggregationType),
    [],
  );

  const getAggregationLabel = useCallback(
    (aggType: RAQIV2AggregationType) =>
      aggregationRenderer.getBreakdownValueName({ value: aggType }, translationDeps) || aggType,
    [aggregationRenderer, translationDeps],
  );

  if (hasNoEvents) {
    return (
      <FeedbackBanner
        severity='Warning'
        variant='Standard'
        layout='Inline'
        title={noEventsMessage}
      />
    );
  }

  return (
    <>
      <ComboboxTypeahead
        label={eventTypeLabel}
        placeholder={isEventTypeLoading ? loadingPlaceholder : selectEventTypePlaceholder}
        selectedLabel={selectedEventType ?? ''}
        hasResults={eventTypeValues.length > 0}
        hasError={hasEventTypeError}
        disabled={isEventTypeLoading}
        isRequired
        renderListboxInPortal
        // Only fires when Explore mode auto-defaulted the source to Custom
        // Events on the user's behalf (see `useExploreModeLastSourcePersistence`
        // and `useChartConfiguratorAutoFocusEventName`). In every other code path
        // the parent passes `false`, so this never steals focus from user
        // input — the a11y rule's default-on behavior is what we want
        // elsewhere, hence a targeted disable rather than a file-wide one.
        // oxlint-disable-next-line jsx_a11y/no-autofocus -- intentional only on auto-defaulted source
        autoFocus={autoFocusEventName}>
        {({ searchText, close }) => {
          const filtered = searchText
            ? eventTypeValues.filter((v) => v.toLowerCase().includes(searchText.toLowerCase()))
            : eventTypeValues;
          return filtered.map((value) => (
            <ComboboxTypeaheadOption
              key={value}
              label={value}
              isSelected={value === selectedEventType}
              onClick={() => handleEventTypeSelect(value, close)}
            />
          ));
        }}
      </ComboboxTypeahead>

      <Dropdown
        label={aggregationLabel}
        size='Medium'
        placeholder={selectAggregationPlaceholder}
        value={selectedAggregationType ?? undefined}
        onValueChange={handleAggregationChange}>
        <Menu>
          <MenuSection>
            {aggregationTypeOptions.map((aggType) => (
              <MenuItem
                key={aggType}
                value={aggType}
                title={getAggregationLabel(aggType)}
                trailing={
                  selectedAggregationType === aggType ? (
                    <Icon name='icon-filled-check' size='Medium' />
                  ) : undefined
                }
              />
            ))}
          </MenuSection>
        </Menu>
      </Dropdown>
    </>
  );
};

export default ChartConfiguratorCustomEventControls;
