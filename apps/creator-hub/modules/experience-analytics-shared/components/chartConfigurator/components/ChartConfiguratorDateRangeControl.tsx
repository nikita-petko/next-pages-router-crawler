import type { FC, MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { subDays } from '@rbx/core';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { DatePresetPopoverControl } from '@rbx/date-range-picker';
import type { TDatePresetOption } from '@rbx/date-range-picker';
import { Button, DateTimePicker, supportedLocales } from '@rbx/foundation-ui';
import type {
  TDateRange,
  TDateRangePresetOption,
  TDateTimePickerLabelsDualActions,
  TSupportedLocale,
} from '@rbx/foundation-ui';
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

type MaxLengthDateTimePickerProps = {
  readonly defaultDates: [Date, Date];
  readonly labels: TDateTimePickerLabelsDualActions;
  readonly locale: TSupportedLocale;
  readonly maxRangeDays: number;
  readonly onApply: (startDate: Date, endDate: Date) => void;
  readonly onCancel: () => void;
  readonly presets: TDateRangePresetOption[];
  readonly selectableDateRange: TDateRange;
};

const CONSTRAINED_PICKER_CLASSES =
  '![border-bottom-left-radius:0] ![border-bottom-right-radius:0] ![box-shadow:none]';

const shiftCalendarDays = (date: Date, days: number): Date => {
  const shiftedDate = new Date(date);
  shiftedDate.setDate(shiftedDate.getDate() + days);
  return shiftedDate;
};

const laterDate = (left: Date, right: Date): Date => (left > right ? left : right);
const earlierDate = (left: Date, right: Date): Date => (left < right ? left : right);
const isSupportedDateTimePickerLocale = (locale: string): locale is TSupportedLocale =>
  supportedLocales.some((supportedLocale) => supportedLocale === locale);

const MaxLengthDateTimePicker: FC<MaxLengthDateTimePickerProps> = ({
  defaultDates,
  labels,
  locale,
  maxRangeDays,
  onApply,
  onCancel,
  presets,
  selectableDateRange,
}) => {
  const [selection, setSelection] = useState<{
    readonly startDate: Date | null;
    readonly endDate: Date | null;
  }>(() => ({ startDate: defaultDates[0], endDate: defaultDates[1] }));
  const [selectionAnchor, setSelectionAnchor] = useState<Date | null>(null);
  const [pickerKey, setPickerKey] = useState(0);
  const constrainedSelectableDateRange = useMemo<TDateRange>(() => {
    if (!selectionAnchor || maxRangeDays <= 0) {
      return selectableDateRange;
    }
    const maximumCalendarDayOffset = maxRangeDays - 1;
    return {
      startDate: laterDate(
        selectableDateRange.startDate,
        shiftCalendarDays(selectionAnchor, -maximumCalendarDayOffset),
      ),
      endDate: earlierDate(
        selectableDateRange.endDate,
        shiftCalendarDays(selectionAnchor, maximumCalendarDayOffset),
      ),
    };
  }, [maxRangeDays, selectableDateRange, selectionAnchor]);
  const pickerDefaultDates = useMemo<[Date] | [Date, Date] | null>(() => {
    if (!selection.startDate) {
      return null;
    }
    return selection.endDate ? [selection.startDate, selection.endDate] : [selection.startDate];
  }, [selection.endDate, selection.startDate]);
  const handleReset = useCallback(() => {
    setSelection({ startDate: null, endDate: null });
    setSelectionAnchor(null);
    setPickerKey((currentKey) => currentKey + 1);
  }, []);
  // TODO(DSA-6004): Move max-range enforcement into Foundation DateTimePicker so keyboard
  // selection can constrain the second date after the first date is selected.
  const handleCalendarClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (selectionAnchor || !(event.target instanceof Element)) {
        return;
      }
      // Foundation only emits onChanged once a dual-date range is complete. Capture the first
      // calendar click so the selectable window can constrain the second click in either direction.
      const dateKey =
        event.target.closest<HTMLButtonElement>('button[data-date-key]')?.dataset.dateKey;
      if (!dateKey) {
        return;
      }
      const [year, monthIndex, day] = dateKey.split('-').map(Number);
      if (![year, monthIndex, day].every(Number.isInteger)) {
        return;
      }
      const clickedDate = new Date(year, monthIndex, day);
      setSelection({ startDate: clickedDate, endDate: null });
      setSelectionAnchor(clickedDate);
    },
    [selectionAnchor],
  );
  const handlePickerChanged = useCallback((startDate: Date | null, endDate: Date | null) => {
    setSelection({ startDate, endDate });
    setSelectionAnchor(endDate ? null : startDate);
  }, []);
  const handleApply = useCallback(() => {
    if (selection.startDate && selection.endDate) {
      onApply(selection.startDate, selection.endDate);
    }
  }, [onApply, selection.endDate, selection.startDate]);
  const navLabels = useMemo(
    () => ({ previousMonth: labels.previousMonth, nextMonth: labels.nextMonth }),
    [labels.nextMonth, labels.previousMonth],
  );

  return (
    <div className='bg-surface-200 radius-large clip' onClickCapture={handleCalendarClickCapture}>
      <DateTimePicker
        key={pickerKey}
        variant='Dual'
        hasActions={false}
        labels={navLabels}
        locale={locale}
        defaultDates={pickerDefaultDates}
        selectableDateRange={constrainedSelectableDateRange}
        presets={presets}
        className={CONSTRAINED_PICKER_CLASSES}
        onChanged={handlePickerChanged}
      />
      <div className='flex items-center justify-between padding-large bg-surface-200 [border-top:var(--stroke-thin)_solid_var(--color-stroke-default)]'>
        <Button variant='Link' size='Medium' onClick={handleReset}>
          {labels.resetAll}
        </Button>
        <div className='flex items-center gap-small'>
          <Button
            variant='Emphasis'
            size='Medium'
            isDisabled={!selection.startDate || !selection.endDate}
            onClick={handleApply}
            className='grow-1'>
            {labels.apply}
          </Button>
          <Button variant='Standard' size='Medium' onClick={onCancel} className='grow-1'>
            {labels.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
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
    maxRangeDays,
  } = useAnalyticsCurrentDateRangeBundle();
  const pickerLocale: TSupportedLocale = isSupportedDateTimePickerLocale(locale) ? locale : 'en-US';
  const pickerSelectableDateRange = useMemo<TDateRange>(
    () => ({
      startDate: toDateTimePickerDate(minStartDate),
      endDate: toDateTimePickerDate(maxEndDate),
    }),
    [maxEndDate, minStartDate],
  );

  const presetOptions = useMemo(
    () =>
      dateRangeOptions.filter(
        (type) =>
          type !== RAQIV2DateRangeType.Custom &&
          (maxRangeDays === undefined ||
            dateRangeOffsetDays[type] <= 0 ||
            dateRangeOffsetDays[type] <= maxRangeDays),
      ),
    [dateRangeOptions, maxRangeDays],
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
      renderPicker={({ closePopover, backToPresets }) => {
        const defaultDates: [Date, Date] = [
          toDateTimePickerDate(startDate),
          toDateTimePickerDate(endDate),
        ];
        const handleApply = (start: Date, end: Date) => {
          applyPickedRange(start, end);
          closePopover();
        };
        return maxRangeDays === undefined ? (
          <DateTimePicker
            variant='Dual'
            labels={pickerLabels}
            locale={pickerLocale}
            defaultDates={defaultDates}
            selectableDateRange={pickerSelectableDateRange}
            presets={pickerPresets}
            onChanged={(start, end) => {
              applyPickedRange(start, end);
              closePopover();
            }}
            onCancel={backToPresets}
          />
        ) : (
          <MaxLengthDateTimePicker
            labels={pickerLabels}
            locale={pickerLocale}
            defaultDates={defaultDates}
            selectableDateRange={pickerSelectableDateRange}
            presets={pickerPresets}
            maxRangeDays={maxRangeDays}
            onApply={handleApply}
            onCancel={backToPresets}
          />
        );
      }}
    />
  );
};

export default ChartConfiguratorDateRangeControl;
