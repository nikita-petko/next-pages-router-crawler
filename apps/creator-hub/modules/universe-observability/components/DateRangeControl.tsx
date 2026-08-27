import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { DatePresetPopoverControl } from '@rbx/date-range-picker';
import type { TDatePresetOption } from '@rbx/date-range-picker';
import { DateTimePicker, supportedLocales } from '@rbx/foundation-ui';
import type {
  TDateTimePickerDualProps,
  TDateTimePickerLabelsDualActions,
  TSupportedLocale,
} from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { DateRangePreset, type DateRangeSelection } from '../types/Filters';

export type DateRangeControlProps = {
  readonly value: DateRangeSelection;
  readonly onChange: (value: DateRangeSelection) => void;
  readonly label?: string;
  readonly minDate?: Date;
  readonly maxDate?: Date;
  readonly className?: string;
};

const PRESET_OPTIONS = [
  DateRangePreset.All,
  DateRangePreset.Last1Hour,
  DateRangePreset.Last1Day,
  DateRangePreset.Last7Days,
] as const;

const PRESET_LABEL_KEYS = {
  [DateRangePreset.All]: 'ServerDetailsPage.Logs.DateRange.All',
  [DateRangePreset.Last1Hour]: 'ServerDetailsPage.Logs.DateRange.LastHour',
  [DateRangePreset.Last1Day]: 'ServerDetailsPage.Logs.DateRange.LastDay',
  [DateRangePreset.Last7Days]: 'ServerDetailsPage.Logs.DateRange.LastWeek',
  [DateRangePreset.Custom]: 'ServerDetailsPage.Logs.DateRange.Custom',
} as const satisfies Record<DateRangePreset, string>;

const CUSTOM_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeZone: 'UTC',
};

const isSupportedLocale = (locale: string): locale is TSupportedLocale =>
  supportedLocales.some((supportedLocale) => supportedLocale === locale);

// The Foundation picker represents calendar dates at local midnight. Store custom
// bounds at UTC midnight so the selected calendar date is stable across time zones.
const toPickerDate = (date: Date): Date =>
  new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const fromPickerDate = (date: Date): Date =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

const DateRangeControl: FC<DateRangeControlProps> = ({
  value,
  onChange,
  label,
  minDate,
  maxDate,
  className,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslationWrapper(useTranslation());

  const translateServerManagement = useCallback(
    (key: string) => translate(translationKey(key, TranslationNamespace.ServerManagement)),
    [translate],
  );
  const resolvedLabel = label ?? translateServerManagement('ServerDetailsPage.Logs.DateRangeLabel');
  const resolvedLocale =
    locale === Locale.SimplifiedChineseJV ? Locale.SimplifiedChinese : (locale ?? Locale.English);
  const pickerLocale =
    locale === Locale.Arabic
      ? 'ar-SA'
      : isSupportedLocale(resolvedLocale)
        ? resolvedLocale
        : Locale.English;
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(resolvedLocale, CUSTOM_DATE_FORMAT_OPTIONS),
    [resolvedLocale],
  );

  const triggerLabel = useMemo(() => {
    if (value.preset !== DateRangePreset.Custom) {
      return translateServerManagement(PRESET_LABEL_KEYS[value.preset]);
    }
    return dateFormatter.formatRange(value.customStart, value.customEnd);
  }, [dateFormatter, translateServerManagement, value]);

  const pickerLabels = useMemo<TDateTimePickerLabelsDualActions>(
    () => ({
      previousMonth: translate(
        translationKey('Label.PreviousMonth', TranslationNamespace.Analytics),
      ),
      nextMonth: translate(translationKey('Label.NextMonth', TranslationNamespace.Analytics)),
      apply: translateServerManagement('ServerDetailsPage.Logs.DateRange.Custom.Apply'),
      cancel: translateServerManagement('ServerDetailsPage.Logs.DateRange.Custom.Cancel'),
      resetAll: translateServerManagement('ServerDetailsPage.Logs.DateRange.Custom.Reset'),
    }),
    [translate, translateServerManagement],
  );

  const defaultDates = useMemo<TDateTimePickerDualProps['defaultDates']>(() => {
    if (value.preset !== DateRangePreset.Custom) {
      return null;
    }
    return [toPickerDate(value.customStart), toPickerDate(value.customEnd)];
  }, [value]);

  const selectableDateRange = useMemo<TDateTimePickerDualProps['selectableDateRange']>(() => {
    if (!minDate || !maxDate) {
      return undefined;
    }
    return {
      startDate: toPickerDate(minDate),
      endDate: toPickerDate(maxDate),
    };
  }, [maxDate, minDate]);

  const presets = useMemo<TDatePresetOption[]>(
    () =>
      PRESET_OPTIONS.map((preset) => ({
        key: preset,
        label: translateServerManagement(PRESET_LABEL_KEYS[preset]),
        selected: value.preset === preset,
        onSelect: () => onChange({ preset }),
      })),
    [onChange, translateServerManagement, value.preset],
  );

  const handleCustomRangeChanged = useCallback(
    (startDate: Date | null, endDate: Date | null) => {
      if (!startDate || !endDate) {
        return;
      }
      onChange({
        preset: DateRangePreset.Custom,
        customStart: fromPickerDate(startDate),
        customEnd: fromPickerDate(endDate),
      });
    },
    [onChange],
  );

  return (
    <DatePresetPopoverControl
      label={resolvedLabel}
      triggerLabel={triggerLabel}
      presets={presets}
      customLabel={translateServerManagement(PRESET_LABEL_KEYS[DateRangePreset.Custom])}
      customSelected={value.preset === DateRangePreset.Custom}
      className={`min-width-[220px] ${className ?? ''}`}
      renderPicker={({ closePopover, backToPresets }) => (
        <DateTimePicker
          variant='Dual'
          labels={pickerLabels}
          locale={pickerLocale}
          defaultDates={defaultDates}
          selectableDateRange={selectableDateRange}
          onChanged={(startDate, endDate) => {
            handleCustomRangeChanged(startDate, endDate);
            closePopover();
          }}
          onCancel={backToPresets}
        />
      )}
    />
  );
};

export default withNamespaceSwitchedTranslation(DateRangeControl, [
  TranslationNamespace.ServerManagement,
  TranslationNamespace.Analytics,
]);
