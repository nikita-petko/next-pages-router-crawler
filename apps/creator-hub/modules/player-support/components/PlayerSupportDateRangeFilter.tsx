import { useMemo, type FunctionComponent } from 'react';
import { DatePresetPopoverControl, type TDatePresetOption } from '@rbx/date-range-picker';
import { DateTimePicker, supportedLocales } from '@rbx/foundation-ui';
import type {
  TDateRange,
  TDateTimePickerLabelsDualActions,
  TSupportedLocale,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatDateRange } from '@modules/charts-generic/charts/formatters/timeFormatters';
import useLocale from '@modules/charts-generic/context/useLocale';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  PLAYER_SUPPORT_DATE_FILTER_OPTIONS,
  PlayerSupportDateFilter,
} from '../constants/ticketFilters';
import { getMinSelectableDate } from '../utils/playerSupportDateRange';

interface PlayerSupportDateRangeFilterProps {
  dateFilter: PlayerSupportDateFilter;
  /** Only set while {@link dateFilter} is `Custom`. */
  customStartDate?: Date;
  customEndDate?: Date;
  className?: string;
  /** Start and end dates are supplied only for the `Custom` filter. */
  onChange: (dateFilter: PlayerSupportDateFilter, startDate?: Date, endDate?: Date) => void;
}

const isSupportedPickerLocale = (locale: string): locale is TSupportedLocale =>
  supportedLocales.some((supportedLocale) => supportedLocale === locale);

const PlayerSupportDateRangeFilter: FunctionComponent<PlayerSupportDateRangeFilterProps> = ({
  dateFilter,
  customStartDate,
  customEndDate,
  className,
  onChange,
}) => {
  const locale = useLocale();
  const { translate } = useTranslationWrapper(useTranslation());
  const pickerLocale: TSupportedLocale = isSupportedPickerLocale(locale) ? locale : 'en-US';

  const dateRangeLabel = translate(
    translationKey('Label.DateRange', TranslationNamespace.Analytics),
  );
  const customLabel = translate(translationKey('Label.DateCustom', TranslationNamespace.Analytics));
  const allTimeLabel = translate(
    translationKey('Label.PlayerSupport.Filter.AllTime', TranslationNamespace.PlayerFeedback),
  );

  const filterLabels = useMemo<Record<PlayerSupportDateFilter, string>>(
    () => ({
      [PlayerSupportDateFilter.AllTime]: allTimeLabel,
      [PlayerSupportDateFilter.Last7Days]: translate(
        translationKey('Label.LastSevenDays', TranslationNamespace.Analytics),
      ),
      [PlayerSupportDateFilter.Last28Days]: translate(
        translationKey('Label.LastTwentyEightDays', TranslationNamespace.Analytics),
      ),
      [PlayerSupportDateFilter.Last56Days]: translate(
        translationKey('Label.LastFiftySixDays', TranslationNamespace.Analytics),
      ),
      [PlayerSupportDateFilter.Last90Days]: translate(
        translationKey('Label.LastNinetyDays', TranslationNamespace.Analytics),
      ),
      [PlayerSupportDateFilter.Custom]: customLabel,
    }),
    [allTimeLabel, customLabel, translate],
  );

  const pickerLabels = useMemo<TDateTimePickerLabelsDualActions>(
    () => ({
      previousMonth: translate(
        translationKey('Label.PreviousMonth', TranslationNamespace.Analytics),
      ),
      nextMonth: translate(translationKey('Label.NextMonth', TranslationNamespace.Analytics)),
      apply: translate(translationKey('Action.Apply', TranslationNamespace.Controls)),
      cancel: translate(translationKey('Action.Cancel', TranslationNamespace.Controls)),
      resetAll: translate(translationKey('Action.ResetAll', TranslationNamespace.Analytics)),
    }),
    [translate],
  );

  const presets = useMemo<TDatePresetOption[]>(
    () =>
      PLAYER_SUPPORT_DATE_FILTER_OPTIONS.map((option) => ({
        key: option,
        label: filterLabels[option],
        selected: dateFilter === option,
        onSelect: () => onChange(option),
      })),
    [dateFilter, filterLabels, onChange],
  );

  const selectableDateRange = useMemo<TDateRange>(
    () => ({ startDate: getMinSelectableDate(), endDate: new Date() }),
    [],
  );

  const hasCustomRange = customStartDate !== undefined && customEndDate !== undefined;
  const triggerLabel =
    dateFilter === PlayerSupportDateFilter.Custom && hasCustomRange
      ? formatDateRange(locale, customStartDate, customEndDate, 'Local')
      : filterLabels[dateFilter];

  return (
    <DatePresetPopoverControl
      label={dateRangeLabel}
      triggerLabel={triggerLabel}
      presets={presets}
      customLabel={customLabel}
      customSelected={dateFilter === PlayerSupportDateFilter.Custom}
      className={className}
      testId='playerSupportDateRange'
      renderPicker={({ closePopover, backToPresets }) => (
        <DateTimePicker
          variant='Dual'
          labels={pickerLabels}
          locale={pickerLocale}
          defaultDates={hasCustomRange ? [customStartDate, customEndDate] : null}
          selectableDateRange={selectableDateRange}
          onChanged={(startDate, endDate) => {
            if (!startDate || !endDate) {
              return;
            }
            onChange(PlayerSupportDateFilter.Custom, startDate, endDate);
            closePopover();
          }}
          onCancel={backToPresets}
        />
      )}
    />
  );
};

export default PlayerSupportDateRangeFilter;
