import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import {
  Dropdown,
  Icon,
  Menu,
  MenuItem,
  MenuSection,
  Radio,
  RadioGroup,
  type TDateTimePickerLabelsNav,
  type TMenuItemProps,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import { alignToUTCMidnight } from '@modules/charts-generic/utils/datePickerUtilities';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DateTimePickerSinglePopoverInput } from '@modules/monetization-shared/date-picker-input/DateTimePickerSinglePopoverInput';
import {
  type ComparisonCustomStartDateValue,
  deserializeComparisonOffset,
  type ComparisonOffsetValue,
} from '../../chartConfigurator/overlayUrlParams';
import { BenchmarkType } from '../../constants/BenchmarkType';
import type { BenchmarkOverlayType } from '../../hooks/useAnalyticsBenchmarks';
import {
  localCalendarDateToUtcMidnight,
  utcMidnightToLocalCalendarDate,
} from '../../utils/dateTimePickerCalendarDateUtils';
import type {
  OverlayAvailability,
  OverlayDisabledReason,
} from '../../utils/getOverlayAvailability';
import RadioWithDisabledTooltip from './components/RadioWithDisabledTooltip';

export type OverlayOption = 'none' | 'benchmarks' | 'period-over-period' | 'quota';

const BENCHMARK_DEFAULT_VALUE = 'default';
const DEFAULT_AVAILABLE_BENCHMARK_TYPES: readonly BenchmarkOverlayType[] = [];

type ChartConfiguratorOverlaysControlProps = {
  value: OverlayOption;
  onChange: (value: OverlayOption) => void;
  benchmarkType: BenchmarkOverlayType | null;
  onBenchmarkTypeChange: (benchmarkType: BenchmarkOverlayType | null) => void;
  availableBenchmarkTypes?: readonly BenchmarkOverlayType[];
  comparisonOffset: ComparisonOffsetValue;
  onComparisonOffsetChange: (offset: ComparisonOffsetValue) => void;
  comparisonCustomStartDate: ComparisonCustomStartDateValue;
  onComparisonCustomStartDateChange: (customStartDate: ComparisonCustomStartDateValue) => void;
  availability: OverlayAvailability;
};

const COMPARISON_OFFSET_DEFAULT = 'previous-period';
const COMPARISON_OFFSET_CUSTOM_START_DATE = 'custom-start-date';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Comparison only makes sense when the custom start is strictly before the
// main window — picking the main start itself produces a comparison series
// identical to the main one. Cap the picker at one bucket before main start.
const getMaxCustomStartTime = (mainStart: Date): number => mainStart.getTime() - ONE_DAY_MS;

const ChartConfiguratorOverlaysControl: FC<ChartConfiguratorOverlaysControlProps> = ({
  value,
  onChange,
  benchmarkType,
  onBenchmarkTypeChange,
  availableBenchmarkTypes = DEFAULT_AVAILABLE_BENCHMARK_TYPES,
  comparisonOffset,
  onComparisonOffsetChange,
  comparisonCustomStartDate,
  onComparisonCustomStartDateChange,
  availability,
}) => {
  const { startDate, minStartDate } = useAnalyticsCurrentDateRangeBundle();
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const overlaysLabel = tPendingTranslation(
    'Overlays',
    'Group label for the chart overlay options radio group.',
    translationKey('Label.ExploreMode.Overlays', TranslationNamespace.Analytics),
  );
  const noneLabel = tPendingTranslation(
    'None',
    'Default view for the chart.',
    translationKey('Label.ExploreMode.Overlay.None', TranslationNamespace.Analytics),
  );
  const benchmarksLabel = tPendingTranslation(
    'Benchmarks',
    'Radio option to show benchmark overlays on the chart.',
    translationKey('Label.ExploreMode.Overlay.Benchmarks', TranslationNamespace.Analytics),
  );
  const quotaLabel = tPendingTranslation(
    'Quota',
    'Radio option to show the quota companion line on the chart.',
    translationKey('Label.ExploreMode.Overlay.Quota', TranslationNamespace.Analytics),
  );
  const periodOverPeriodLabel = tPendingTranslation(
    'Period-over-period',
    'Radio option to show a period-over-period comparison overlay on the chart.',
    translationKey('Label.ExploreMode.Overlay.PeriodOverPeriod', TranslationNamespace.Analytics),
  );
  const secondPeriodLabel = tPendingTranslation(
    'Second period',
    'Dropdown label for selecting the comparison period offset.',
    translationKey('Label.ExploreMode.SecondPeriod', TranslationNamespace.Analytics),
  );
  const previousPeriodLabel = tPendingTranslation(
    'Previous period',
    'Option for comparing against the immediately preceding time period of equal length.',
    translationKey('Label.ExploreMode.SecondPeriod.PreviousPeriod', TranslationNamespace.Analytics),
  );
  const sevenDayOffsetLabel = tPendingTranslation(
    '7 day offset',
    'Option for comparing against the same period shifted back by 7 days.',
    translationKey('Label.ExploreMode.SecondPeriod.7DayOffset', TranslationNamespace.Analytics),
  );
  const fourteenDayOffsetLabel = tPendingTranslation(
    '14 day offset',
    'Option for comparing against the same period shifted back by 14 days.',
    translationKey('Label.ExploreMode.SecondPeriod.14DayOffset', TranslationNamespace.Analytics),
  );
  const twentyEightDayOffsetLabel = tPendingTranslation(
    '28 day offset',
    'Option for comparing against the same period shifted back by 28 days.',
    translationKey('Label.ExploreMode.SecondPeriod.28DayOffset', TranslationNamespace.Analytics),
  );
  const customStartDateLabel = tPendingTranslation(
    'Custom start date',
    'Menu option for comparing against a period anchored to a specific start date.',
    translationKey(
      'Label.ExploreMode.SecondPeriod.CustomStartDate',
      TranslationNamespace.Analytics,
    ),
  );
  const customStartDatePickerLabel = tPendingTranslation(
    'Comparison start date',
    'Label for the custom comparison start date picker.',
    translationKey(
      'Label.ExploreMode.SecondPeriod.CustomStartDatePicker',
      TranslationNamespace.Analytics,
    ),
  );
  const benchmarkTypeLabel = tPendingTranslation(
    'Benchmark type',
    'Dropdown label for selecting which type of benchmark to display.',
    translationKey('Label.ExploreMode.BenchmarkType', TranslationNamespace.Analytics),
  );
  const calendarPreviousMonthLabel = tPendingTranslation(
    'Previous month',
    'Aria label for navigating to the previous month in the custom comparison start date picker.',
    translationKey('Label.PreviousMonth', TranslationNamespace.Analytics),
  );
  const calendarNextMonthLabel = tPendingTranslation(
    'Next month',
    'Aria label for navigating to the next month in the custom comparison start date picker.',
    translationKey('Label.NextMonth', TranslationNamespace.Analytics),
  );
  const customStartDatePlaceholderLabel = tPendingTranslation(
    'Select a start date',
    'Placeholder for the custom comparison start date picker trigger.',
    translationKey(
      'Placeholder.ExploreMode.SecondPeriod.CustomStartDate',
      TranslationNamespace.Analytics,
    ),
  );
  const genreBenchmarkTypeLabel = tPendingTranslation(
    'Genre benchmark',
    'Label for range benchmarks in creator analytics that are derived from experiences in the same internally-labeled genre as the visible experience',
    translationKey('Label.BenchmarkSource.Genre', TranslationNamespace.Analytics),
  );
  const similarityBenchmarkTypeLabel = tPendingTranslation(
    'Similarity benchmark',
    'Label for similarity benchmarks in creator analytics that are derived from experiences in the same internally-labeled genre as the visible experience',
    translationKey('Label.BenchmarkSource.Similarity.Short', TranslationNamespace.Analytics),
  );
  const defaultBenchmarkTypeLabel = tPendingTranslation(
    'Default',
    'Option label for the default benchmark type when no specific benchmark source is selected.',
    translationKey('Label.BenchmarkSource.Default', TranslationNamespace.Analytics),
  );

  const disabledReasonText: Record<OverlayDisabledReason, string> = useMemo(
    () => ({
      chartType: tPendingTranslation(
        'Overlays are only available on line charts',
        'Tooltip explaining why chart overlays are disabled for the current chart type.',
        translationKey(
          'Tooltip.ExploreMode.Overlay.Disabled.ChartType',
          TranslationNamespace.Analytics,
        ),
      ),
      durationMetric: tPendingTranslation(
        'Overlays are not available for duration metrics',
        'Tooltip explaining why chart overlays are disabled for duration-based metrics that use bucket breakdowns instead of time series.',
        translationKey(
          'Tooltip.ExploreMode.Overlay.Disabled.DurationMetric',
          TranslationNamespace.Analytics,
        ),
      ),
      breakdown: tPendingTranslation(
        'Only available without breakdowns',
        'Tooltip explaining why this overlay is disabled when a breakdown dimension is active.',
        translationKey(
          'Tooltip.ExploreMode.Overlay.Disabled.Breakdown',
          TranslationNamespace.Analytics,
        ),
      ),
      granularity: tPendingTranslation(
        'Benchmarks require daily granularity',
        'Tooltip explaining why benchmarks are disabled when a non-daily granularity is selected.',
        translationKey(
          'Tooltip.ExploreMode.Overlay.Disabled.Granularity',
          TranslationNamespace.Analytics,
        ),
      ),
      benchmarkContext: tPendingTranslation(
        'Benchmarks are not available for this configuration',
        'Tooltip explaining why benchmarks are disabled for the current metric and filter configuration.',
        translationKey(
          'Tooltip.ExploreMode.Overlay.Disabled.BenchmarkContext',
          TranslationNamespace.Analytics,
        ),
      ),
      noBenchmarkData: tPendingTranslation(
        'Benchmarks are not available for this metric',
        'Tooltip explaining why benchmarks are disabled because the benchmark API returned no data for this metric.',
        translationKey(
          'Tooltip.ExploreMode.Overlay.Disabled.NoBenchmarkData',
          TranslationNamespace.Analytics,
        ),
      ),
    }),
    [tPendingTranslation],
  );

  const getTooltipText = (reason?: OverlayDisabledReason): string | undefined =>
    reason ? disabledReasonText[reason] : undefined;

  const dropdownValue = benchmarkType ?? BENCHMARK_DEFAULT_VALUE;
  const shouldShowBenchmarkTypeSelector =
    value === 'benchmarks' && availableBenchmarkTypes.length > 1;

  const handleBenchmarkTypeChange = (v: string) => {
    if (v === BENCHMARK_DEFAULT_VALUE) {
      onBenchmarkTypeChange(null);
      return;
    }

    const selectedBenchmarkType = availableBenchmarkTypes.find((type) => type.valueOf() === v);
    if (selectedBenchmarkType !== undefined) {
      onBenchmarkTypeChange(selectedBenchmarkType);
    }
  };

  const comparisonOffsetDropdownValue = comparisonCustomStartDate
    ? COMPARISON_OFFSET_CUSTOM_START_DATE
    : (comparisonOffset ?? COMPARISON_OFFSET_DEFAULT);
  const shouldShowComparisonOffsetSelector = value === 'period-over-period';
  const shouldShowCustomStartDatePicker =
    shouldShowComparisonOffsetSelector &&
    comparisonOffsetDropdownValue === COMPARISON_OFFSET_CUSTOM_START_DATE;

  // Default custom-start fallback used when the user first toggles into the
  // "custom start date" option. One bucket before the main window's start so
  // the resulting comparison series is distinct from the main series.
  //
  // `startDate` from the date-range bundle preserves time-of-day from
  // `maxEndDate` for preset ranges (e.g. Last7Days/Last28Days produce a
  // `startDate` like `2024-06-09T12:00:00.000Z`). Subtracting `ONE_DAY_MS`
  // would carry that non-midnight time into the URL-stored value, and the
  // `>= startTimestamp` filter in `sliceRAQIV2QueryResultByTimeRange` would
  // then drop the first UTC-midnight bucket of the comparison series. Snap
  // to UTC midnight so the default aligns to bucket boundaries.
  const defaultCustomStartDate = useMemo(
    () => alignToUTCMidnight(new Date(getMaxCustomStartTime(startDate))),
    [startDate],
  );

  const handleComparisonOffsetChange = useCallback(
    (v: string) => {
      if (v === COMPARISON_OFFSET_CUSTOM_START_DATE) {
        onComparisonOffsetChange(undefined);
        onComparisonCustomStartDateChange(comparisonCustomStartDate ?? defaultCustomStartDate);
        return;
      }

      // Handle the "previous-period" sentinel explicitly at the boundary so we
      // do not rely on `deserializeComparisonOffset` returning `undefined` for
      // unknown strings — that fallback would silently break if the sentinel
      // ever became a valid `TComparisonOffset` value.
      onComparisonCustomStartDateChange(undefined);
      onComparisonOffsetChange(
        v === COMPARISON_OFFSET_DEFAULT ? undefined : deserializeComparisonOffset(v),
      );
    },
    [
      comparisonCustomStartDate,
      defaultCustomStartDate,
      onComparisonCustomStartDateChange,
      onComparisonOffsetChange,
    ],
  );

  const handleComparisonCustomStartDateChange = useCallback(
    (nextCustomStartDate: Date | null) => {
      if (!nextCustomStartDate) {
        return;
      }
      // Foundation's single-date picker returns a Date at local midnight of
      // the chosen calendar day. Analytics daily buckets land on UTC midnight,
      // so passing the local-midnight value to `sliceRAQIV2QueryResultByTimeRange`
      // (which uses `>= startTime`) drops the first day's bucket in negative-
      // offset timezones — the comparison series ends up one point shorter
      // than the main series, and `ingestRaqiV2ComparisonSeries` silently
      // discards the entire series. Normalize to UTC midnight of the picked
      // calendar date so the comparison window aligns to bucket boundaries.
      const utcMidnight = localCalendarDateToUtcMidnight(nextCustomStartDate);
      const clampedTime = Math.min(
        getMaxCustomStartTime(startDate),
        Math.max(minStartDate.getTime(), utcMidnight.getTime()),
      );
      onComparisonCustomStartDateChange(new Date(clampedTime));
    },
    [minStartDate, onComparisonCustomStartDateChange, startDate],
  );

  // Picker-facing copies of the storage-side Dates. The picker renders using
  // local-time getters, so we translate UTC-midnight storage values into
  // local-midnight Dates on the same calendar day. Without this, the trigger
  // text and highlighted calendar day shift back by one day in negative-offset
  // timezones, and the `selectableDateRange` upper bound disables the user's
  // actual main-start day.
  const customStartDateForPicker = useMemo(
    () => utcMidnightToLocalCalendarDate(comparisonCustomStartDate ?? defaultCustomStartDate),
    [comparisonCustomStartDate, defaultCustomStartDate],
  );
  const selectableDateRangeForPicker = useMemo(
    () => ({
      startDate: utcMidnightToLocalCalendarDate(minStartDate),
      endDate: utcMidnightToLocalCalendarDate(new Date(getMaxCustomStartTime(startDate))),
    }),
    [minStartDate, startDate],
  );

  const comparisonOffsetMenuItems = useMemo(() => {
    const items: { value: string; label: string }[] = [
      { value: COMPARISON_OFFSET_DEFAULT, label: previousPeriodLabel },
      { value: '7d', label: sevenDayOffsetLabel },
      { value: '14d', label: fourteenDayOffsetLabel },
      { value: '28d', label: twentyEightDayOffsetLabel },
      { value: COMPARISON_OFFSET_CUSTOM_START_DATE, label: customStartDateLabel },
    ];
    return items.map((item) => (
      <MenuItem
        key={item.value}
        value={item.value}
        title={item.label}
        trailing={
          comparisonOffsetDropdownValue === item.value ? (
            <Icon name='icon-filled-check' size='Medium' />
          ) : undefined
        }
      />
    ));
  }, [
    comparisonOffsetDropdownValue,
    previousPeriodLabel,
    sevenDayOffsetLabel,
    fourteenDayOffsetLabel,
    twentyEightDayOffsetLabel,
    customStartDateLabel,
  ]);

  const customStartDatePickerLabels = useMemo<TDateTimePickerLabelsNav>(
    () => ({
      previousMonth: calendarPreviousMonthLabel,
      nextMonth: calendarNextMonthLabel,
    }),
    [calendarNextMonthLabel, calendarPreviousMonthLabel],
  );

  const benchmarkMenuItems = useMemo(() => {
    const benchmarkTypeLabels: Record<string, string> = {
      [BenchmarkType.Genre]: genreBenchmarkTypeLabel,
      [BenchmarkType.Similarity]: similarityBenchmarkTypeLabel,
      [BENCHMARK_DEFAULT_VALUE]: defaultBenchmarkTypeLabel,
    };
    const items: React.ReactElement<TMenuItemProps>[] = [
      <MenuItem
        key={BENCHMARK_DEFAULT_VALUE}
        value={BENCHMARK_DEFAULT_VALUE}
        title={defaultBenchmarkTypeLabel}
        trailing={
          dropdownValue === BENCHMARK_DEFAULT_VALUE ? (
            <Icon name='icon-filled-check' size='Medium' />
          ) : undefined
        }
      />,
      ...availableBenchmarkTypes.map((type) => (
        <MenuItem
          key={type}
          value={type}
          title={benchmarkTypeLabels[type]}
          trailing={
            dropdownValue === type ? <Icon name='icon-filled-check' size='Medium' /> : undefined
          }
        />
      )),
    ];
    return items;
  }, [
    availableBenchmarkTypes,
    defaultBenchmarkTypeLabel,
    dropdownValue,
    genreBenchmarkTypeLabel,
    similarityBenchmarkTypeLabel,
  ]);

  const benchmarkStatus = availability.benchmark;
  const comparisonStatus = availability.comparison;
  const quotaStatus = availability.quota;

  return (
    <RadioGroup
      groupLabel={overlaysLabel}
      size='Small'
      value={value}
      onValueChange={(v) => {
        switch (v) {
          case 'none':
          case 'benchmarks':
          case 'period-over-period':
          case 'quota':
            onChange(v);
            break;
          default:
            break;
        }
      }}>
      <Radio value='none' label={noneLabel} />
      <RadioWithDisabledTooltip
        value='period-over-period'
        label={periodOverPeriodLabel}
        isDisabled={comparisonStatus.disabled}
        tooltipText={getTooltipText(comparisonStatus.reason)}
      />
      {shouldShowComparisonOffsetSelector && (
        // oxlint-disable-next-line better-tailwindcss/no-unknown-classes -- Preserve existing spacing; this change only extracts date conversion helpers.
        <div className='pl-8 flex flex-col gap-medium'>
          <Dropdown
            label={secondPeriodLabel}
            size='Medium'
            placeholder={secondPeriodLabel}
            value={comparisonOffsetDropdownValue}
            onValueChange={handleComparisonOffsetChange}>
            <Menu>
              <MenuSection>{comparisonOffsetMenuItems}</MenuSection>
            </Menu>
          </Dropdown>
          {shouldShowCustomStartDatePicker && (
            <DateTimePickerSinglePopoverInput
              value={customStartDateForPicker}
              placeholder={customStartDatePlaceholderLabel}
              label={customStartDatePickerLabel}
              dateTimePickerLabels={customStartDatePickerLabels}
              popoverAriaLabel={customStartDatePickerLabel}
              selectableDateRange={selectableDateRangeForPicker}
              onChange={handleComparisonCustomStartDateChange}
            />
          )}
        </div>
      )}
      {benchmarkStatus.applicable && (
        <RadioWithDisabledTooltip
          value='benchmarks'
          label={benchmarksLabel}
          isDisabled={benchmarkStatus.disabled}
          tooltipText={getTooltipText(benchmarkStatus.reason)}
        />
      )}
      {quotaStatus.applicable && (
        <RadioWithDisabledTooltip
          value='quota'
          label={quotaLabel}
          isDisabled={quotaStatus.disabled}
          tooltipText={getTooltipText(quotaStatus.reason)}
        />
      )}
      {shouldShowBenchmarkTypeSelector && (
        // oxlint-disable-next-line better-tailwindcss/no-unknown-classes -- Preserve existing spacing; this change only extracts date conversion helpers.
        <div className='pl-8'>
          <Dropdown
            size='Medium'
            placeholder={benchmarkTypeLabel}
            value={dropdownValue}
            onValueChange={handleBenchmarkTypeChange}>
            <Menu>
              <MenuSection>{benchmarkMenuItems}</MenuSection>
            </Menu>
          </Dropdown>
        </div>
      )}
    </RadioGroup>
  );
};

export default ChartConfiguratorOverlaysControl;
