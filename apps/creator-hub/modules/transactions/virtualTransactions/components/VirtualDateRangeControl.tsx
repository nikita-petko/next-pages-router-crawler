import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Button,
  DateTimePicker,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import type {
  TDateRangePresetOption,
  TDateTimePickerLabelsDualActions,
  TSelectableDateRange,
} from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatDateRange } from '@modules/charts-generic/charts/formatters/timeFormatters';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSupportedLocale } from '@modules/monetization-shared/date-picker-input/useSupportedLocale';
import {
  DAYS_BY_PRESET,
  startOfLocalDaysAgo,
  VirtualDateRangePreset,
} from '../constants/virtualDateRange';

export type VirtualDateRangeControlProps = {
  // The currently-applied range, shown in the trigger and used to seed the calendar.
  startDate: Date;
  endDate: Date;
  // Committed only when the user clicks Apply.
  onRangeChange: (startDate: Date, endDate: Date) => void;
  minStartDate: Date;
  maxEndDate: Date;
};

// Date-range selector matching the Figma DateTimePickerMenu: a dual-month calendar with the
// Last 7/30/90-day quick-select chips and a Reset/Apply/Cancel footer, all provided by the
// Foundation DateTimePicker in Dual mode. Opens from a trigger button showing the applied range.
// Selections are only committed to the parent on Apply.
const VirtualDateRangeControl: FunctionComponent<
  React.PropsWithChildren<VirtualDateRangeControlProps>
> = ({ startDate, endDate, onRangeChange, minStartDate, maxEndDate }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const { locale } = useLocalization();
  // Locale.SimplifiedChineseJV ('zh-CJV') is a Roblox-internal tag that Intl rejects; fold it into
  // standard Simplified Chinese before formatting the trigger label, matching VirtualTransactionCell
  // and the picker's useSupportedLocale mapping.
  const resolvedLocale =
    locale === Locale.SimplifiedChineseJV ? Locale.SimplifiedChinese : (locale ?? Locale.English);

  const [open, setOpen] = useState(false);

  // The Foundation DateTimePicker requires all five labels. Reuse already-registered shared keys
  // instead of minting feature-specific ones: month-nav from Analytics, actions from Controls.
  const labels = useMemo<TDateTimePickerLabelsDualActions>(
    () => ({
      previousMonth: translate(
        translationKey('Label.PreviousMonth', TranslationNamespace.Analytics),
      ),
      nextMonth: translate(translationKey('Label.NextMonth', TranslationNamespace.Analytics)),
      apply: translate(translationKey('Action.Apply', TranslationNamespace.Controls)),
      cancel: translate(translationKey('Action.Cancel', TranslationNamespace.Controls)),
      resetAll: translate(translationKey('Action.Reset', TranslationNamespace.Controls)),
    }),
    [translate],
  );

  const presets = useMemo<TDateRangePresetOption[]>(
    () => [
      {
        key: 'last7Days',
        label: translate(translationKey('Label.Last7Days', TranslationNamespace.Transactions)),
        getPresetRange: () => [
          startOfLocalDaysAgo(maxEndDate, DAYS_BY_PRESET[VirtualDateRangePreset.Last7Days]),
          maxEndDate,
        ],
      },
      {
        key: 'last30Days',
        label: translate(translationKey('Label.Last30Days', TranslationNamespace.Transactions)),
        getPresetRange: () => [
          startOfLocalDaysAgo(maxEndDate, DAYS_BY_PRESET[VirtualDateRangePreset.Last30Days]),
          maxEndDate,
        ],
      },
      {
        key: 'last90Days',
        label: translate(translationKey('Label.Last90Days', TranslationNamespace.Transactions)),
        getPresetRange: () => [
          startOfLocalDaysAgo(maxEndDate, DAYS_BY_PRESET[VirtualDateRangePreset.Last90Days]),
          maxEndDate,
        ],
      },
    ],
    [maxEndDate, translate],
  );

  const selectableDateRange = useMemo<TSelectableDateRange>(
    () => ({ startDate: minStartDate, endDate: maxEndDate }),
    [minStartDate, maxEndDate],
  );

  const triggerLabel = formatDateRange(resolvedLocale, startDate, endDate, 'Local');

  const handleChanged = useCallback(
    (start: Date | null, end: Date | null) => {
      if (start && end) {
        onRangeChange(start, end);
      }
      setOpen(false);
    },
    [onRangeChange],
  );

  const closePicker = useCallback(() => setOpen(false), []);
  const defaultDates = useMemo<[Date, Date]>(() => [startDate, endDate], [startDate, endDate]);

  // Maps the intl locale to a locale the Foundation picker supports (falling back when unsupported)
  // instead of an unsafe cast.
  const foundationLocale = useSupportedLocale();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='Standard'
          // Transparent fill with an outline, matching the Figma date-range input (the Standard
          // variant is otherwise a solid grey fill).
          className='!bg-none stroke-standard stroke-emphasis'
          size='Medium'
          icon='icon-regular-calendar'
          aria-label={translate(
            translationKey('Label.DateRange', TranslationNamespace.Transactions),
          )}
          data-testid='virtual-date-range-id'>
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side='bottom'
        align='end'
        sideOffset={4}
        collisionPadding={16}
        // Cap the popover to the space Radix measures between the trigger and the viewport edges and
        // let it scroll on both axes, so on small screens the dual-month calendar stays reachable
        // left-to-right and the Apply/Cancel footer isn't clipped off the bottom. overscroll-behavior
        // keeps the wheel/touch scroll inside the picker instead of chaining to the page behind it.
        className='max-height-[var(--radix-popover-content-available-height)] max-width-[var(--radix-popover-content-available-width)] scroll [overscroll-behavior:contain]'
        ariaLabel={translate(translationKey('Label.DateRange', TranslationNamespace.Transactions))}>
        {open ? (
          <DateTimePicker
            key={`${startDate.getTime()}-${endDate.getTime()}`}
            variant='Dual'
            labels={labels}
            locale={foundationLocale}
            defaultDates={defaultDates}
            selectableDateRange={selectableDateRange}
            presets={presets}
            onChanged={handleChanged}
            onCancel={closePicker}
          />
        ) : null}
      </PopoverContent>
    </Popover>
  );
};

export default VirtualDateRangeControl;
