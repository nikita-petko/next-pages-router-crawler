import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { Dropdown, Menu, MenuItem, MenuSection, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
  type TRAQIV2APIMetric,
} from '@rbx/creator-hub-analytics-config';
import { RAQIV2ChartResource } from '@modules/clients/analytics';
import {
  useRAQIV2DimensionValuesRequest,
  useRAQIV2TranslationDependencies,
  getDimensionRenderer,
  getFilterValueForDimension,
  updateFilterValues,
  type TExploreModeMetrics,
  type UIFilters,
  TimeRangeType,
  type TTimeRangeSpec,
} from '@modules/experience-analytics-shared';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ComboboxTypeahead, ComboboxTypeaheadOption } from '@modules/charts-generic';

const CustomEventLookbackSeconds = 60 * 60 * 24 * 90;

const customEventTimeRangeSpec: TTimeRangeSpec = {
  type: TimeRangeType.Relative,
  lookbackSeconds: CustomEventLookbackSeconds,
  granularity: RAQIV2MetricGranularity.None,
};

const aggregationTypeOptions: readonly RAQIV2AggregationType[] = [
  RAQIV2AggregationType.Sum,
  RAQIV2AggregationType.Count,
  RAQIV2AggregationType.Average,
  RAQIV2AggregationType.AveragePerUser,
  RAQIV2AggregationType.Max,
  RAQIV2AggregationType.Min,
  RAQIV2AggregationType.CountUser,
];

type ExploreModeCustomEventControlsProps = {
  resource: RAQIV2ChartResource;
  metric: TExploreModeMetrics;
  filters: UIFilters;
  onFiltersChange: (filters: UIFilters) => void;
};

const ExploreModeCustomEventControls: FC<ExploreModeCustomEventControlsProps> = ({
  resource,
  metric,
  filters,
  onFiltersChange,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const translationDeps = useRAQIV2TranslationDependencies();

  const eventTypeLabel = tPendingTranslation(
    'Event type *',
    'Label for the required custom event type dropdown selector.',
    translationKey('Label.ExploreMode.EventTypeRequired', TranslationNamespace.Analytics),
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
    'No custom events found in the last 90 days.',
    'Message shown when no custom events have been fired by the experience.',
    translationKey('Message.ExploreMode.NoCustomEvents', TranslationNamespace.Analytics),
  );
  const loadingPlaceholder = tPendingTranslation(
    'Loading…',
    'Placeholder text shown while event types are being loaded.',
    translationKey('Label.ExploreMode.Loading', TranslationNamespace.Analytics),
  );

  const contextMetrics = useMemo((): TRAQIV2APIMetric[] => [metric as TRAQIV2APIMetric], [metric]);
  const { data: eventTypeData, isDataLoading: isEventTypeLoading } =
    useRAQIV2DimensionValuesRequest(
      resource,
      RAQIV2Dimension.CustomEventName,
      contextMetrics,
      customEventTimeRangeSpec,
    );

  const eventTypeValues = useMemo(() => {
    const raw =
      eventTypeData?.values?.map((v) => (v.value != null ? String(v.value) : '')).filter(Boolean) ??
      [];
    return raw.sort((a, b) => a.localeCompare(b));
  }, [eventTypeData]);

  const hasNoEvents = !isEventTypeLoading && eventTypeValues.length === 0;

  const selectedEventType = useMemo(
    () => getFilterValueForDimension(filters, RAQIV2Dimension.CustomEventName, null),
    [filters],
  );

  const handleEventTypeSelect = useCallback(
    (value: string, close: () => void) => {
      const newFilters = updateFilterValues(filters, RAQIV2Dimension.CustomEventName, [value]);
      onFiltersChange(newFilters);
      close();
    },
    [filters, onFiltersChange],
  );

  const selectedAggregationType = useMemo(
    () =>
      getFilterValueForDimension(
        filters,
        RAQIV2UIPseudoDimension.AggregationType,
        RAQIV2AggregationType.Sum,
      ),
    [filters],
  );

  const defaultAppliedRef = useRef(false);
  useEffect(() => {
    if (defaultAppliedRef.current) return;
    defaultAppliedRef.current = true;
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
  }); // eslint-disable-line react-hooks/exhaustive-deps -- guarded by ref, runs once per instance

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
      <p className='text-body-small' style={{ color: 'var(--content-muted)', margin: 0 }}>
        {noEventsMessage}
      </p>
    );
  }

  return (
    <React.Fragment>
      <ComboboxTypeahead
        label={eventTypeLabel}
        placeholder={isEventTypeLoading ? loadingPlaceholder : selectEventTypePlaceholder}
        selectedLabel={selectedEventType ?? ''}
        hasResults={eventTypeValues.length > 0}
        disabled={isEventTypeLoading}>
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
    </React.Fragment>
  );
};

export default ExploreModeCustomEventControls;
