import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { subDays } from '@rbx/core';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { DatePresetPopoverControl } from '@rbx/date-range-picker';
import type { TDatePresetOption } from '@rbx/date-range-picker';
import { DateTimePicker } from '@rbx/foundation-ui';
import type { TDateRangePresetOption, TDateTimePickerLabelsDualActions } from '@rbx/foundation-ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatDateRange } from '@modules/charts-generic/charts/formatters/timeFormatters';
import dateRangeOffsetDays from '@modules/charts-generic/constants/dateRangeOffsetDays';
import dateRangeStrings from '@modules/charts-generic/constants/dateRangeStrings';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import useLocale from '@modules/charts-generic/context/useLocale';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import {
  localCalendarDateToUtcMidnight,
  utcMidnightToLocalCalendarDate,
} from '../../../utils/dateTimePickerCalendarDateUtils';

type ChartConfiguratorDateRangeControlProps = {
  dateRangeOptions: readonly RAQIV2DateRangeType[];
  className?: string;
};

const isLocalMidnight = (date: Date): boolean =>
  date.getHours() === 0 &&
  date.getMinutes() === 0 &&
  date.getSeconds() === 0 &&
  date.getMilliseconds() === 0;

const isUtcMidnight = (date: Date): boolean =>
  date.getUTCHours() === 0 &&
  date.getUTCMinutes() === 0 &&
  date.getUTCSeconds() === 0 &&
  date.getUTCMilliseconds() === 0;

const normalizeCalendarPickerDate = (date: Date): Date =>
  isLocalMidnight(date) ? localCalendarDateToUtcMidnight(date) : date;

const toDateTimePickerDate = (date: Date): Date =>
  isUtcMidnight(date) ? utcMidnightToLocalCalendarDate(date) : date;

const ChartConfiguratorDateRangeControl: FC<ChartConfiguratorDateRangeControlProps> = ({
  dateRangeOptions,
  className,
}) => {
  const locale = useLocale();
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    rangeType,
    onChangeRangeType,
    startDate,
    endDate,
    minStartDate,
    maxEndDate,
    onChangeDateRangeParams,
  } = useAnalyticsCurrentDateRangeBundle();

  const presetOptions = useMemo(
    () => dateRangeOptions.filter((type) => type !== RAQIV2DateRangeType.Custom),
    [dateRangeOptions],
  );

  const presets = useMemo<TDatePresetOption[]>(
    () =>
      presetOptions.map((type) => ({
        key: type,
        label: translate(dateRangeStrings[type]),
        selected: rangeType === type,
        onSelect: () => onChangeRangeType(type),
      })),
    [presetOptions, translate, rangeType, onChangeRangeType],
  );

  const pickerPresets = useMemo<TDateRangePresetOption[]>(
    () =>
      presetOptions.map((type) => ({
        key: type,
        label: translate(dateRangeStrings[type]),
        getPresetRange: (): [Date, Date] => {
          const offset = dateRangeOffsetDays[type];
          if (offset <= 0) {
            return [maxEndDate, maxEndDate];
          }
          return [
            toDateTimePickerDate(subDays(maxEndDate, offset - 1)),
            toDateTimePickerDate(maxEndDate),
          ];
        },
      })),
    [presetOptions, translate, maxEndDate],
  );

  const triggerLabel = useMemo(() => {
    if (rangeType === RAQIV2DateRangeType.Custom) {
      return formatDateRange(locale, startDate, endDate);
    }
    return translate(dateRangeStrings[rangeType]);
  }, [rangeType, locale, startDate, endDate, translate]);

  const applyPickedRange = useCallback(
    (start: Date | null, end: Date | null) => {
      if (!start || !end) {
        return;
      }
      const normalizedStart = normalizeCalendarPickerDate(start);
      const normalizedEnd = normalizeCalendarPickerDate(end);
      const pickerMaxEndDate = toDateTimePickerDate(maxEndDate);
      const matchingPreset = presetOptions.find((type) => {
        const offset = dateRangeOffsetDays[type];
        if (offset <= 0) {
          return false;
        }
        const presetStart = subDays(pickerMaxEndDate, offset - 1);
        return (
          start.getFullYear() === presetStart.getFullYear() &&
          start.getMonth() === presetStart.getMonth() &&
          start.getDate() === presetStart.getDate() &&
          end.getFullYear() === pickerMaxEndDate.getFullYear() &&
          end.getMonth() === pickerMaxEndDate.getMonth() &&
          end.getDate() === pickerMaxEndDate.getDate()
        );
      });
      if (matchingPreset) {
        onChangeRangeType(matchingPreset);
      } else {
        onChangeDateRangeParams(normalizedStart, normalizedEnd, RAQIV2DateRangeType.Custom);
      }
    },
    [presetOptions, maxEndDate, onChangeRangeType, onChangeDateRangeParams],
  );

  const dateRangeLabel =
    translate(translationKey('Label.DateRange', TranslationNamespace.Analytics)) || 'Date Range';

  const customLabel =
    translate(translationKey('Label.DateCustom', TranslationNamespace.Analytics)) ||
    'Custom date range';

  const pickerLabels = useMemo<TDateTimePickerLabelsDualActions>(
    () => ({
      previousMonth:
        translate(translationKey('Label.PreviousMonth', TranslationNamespace.Analytics)) ||
        'Previous month',
      nextMonth:
        translate(translationKey('Label.NextMonth', TranslationNamespace.Analytics)) ||
        'Next month',
      apply: translate(translationKey('Action.Apply', TranslationNamespace.Analytics)) || 'Apply',
      cancel:
        translate(translationKey('Action.Cancel', TranslationNamespace.Analytics)) || 'Cancel',
      resetAll:
        translate(translationKey('Action.ResetAll', TranslationNamespace.Analytics)) || 'Reset all',
    }),
    [translate],
  );

  return (
    <DatePresetPopoverControl
      label={dateRangeLabel}
      triggerLabel={triggerLabel}
      presets={presets}
      customLabel={customLabel}
      customSelected={rangeType === RAQIV2DateRangeType.Custom}
      className={className}
      renderPicker={({ closePopover, backToPresets }) => (
        <DateTimePicker
          variant='Dual'
          labels={pickerLabels}
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- useLocale returns the same locale strings supported by DateTimePicker, but with a wider app-level type.
          locale={locale as Parameters<typeof DateTimePicker>[0]['locale']}
          defaultDates={[toDateTimePickerDate(startDate), toDateTimePickerDate(endDate)]}
          selectableDateRange={{
            startDate: toDateTimePickerDate(minStartDate),
            endDate: toDateTimePickerDate(maxEndDate),
          }}
          presets={pickerPresets}
          onChanged={(start, end) => {
            applyPickedRange(start, end);
            closePopover();
          }}
          onCancel={backToPresets}
        />
      )}
    />
  );
};

export default ChartConfiguratorDateRangeControl;
