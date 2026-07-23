import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, MenuItem } from '@rbx/ui';
import {
  DateRangeType,
  DateRangePicker,
  dateRangeStrings,
  useLocale,
  formatDateRange,
  useAnalyticsCurrentDateRangeBundle,
} from '@modules/charts-generic';
import { translationKey, FormattedText } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useAnalyticsPageControlBarStyles from '../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar.styles';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useRelativeDatePickerCustomMenuItemOptions from './useRelativeDatePickerCustomMenuItemOptions';

export const useAnalyticsCurrentConcatenatedDateRangeString = (): FormattedText => {
  const { endDate, startDate } = useAnalyticsCurrentDateRangeBundle();
  const locale = useLocale();
  return formatDateRange(locale, startDate, endDate);
};

const useRelativeDateRangePickerCustomMenuItem = ({
  startDate,
  endDate,
  minStartDate,
  maxEndDate,
  onDateRangeChangeConfirmed,
  maxRangeDays,
}: {
  startDate: Date;
  endDate: Date;
  minStartDate: Date;
  maxEndDate: Date;
  onDateRangeChangeConfirmed: (startDate: Date, endDate: Date) => void;
  maxRangeDays?: number;
}) => {
  const {
    classes: { relativeDatePickerConfirmButtonFlexLayout },
  } = useAnalyticsPageControlBarStyles();
  const {
    classes: { relativeDatePickerMenuItemLayout },
  } = useAnalyticsPageControlBarStyles();
  const { translate } = useRAQIV2TranslationDependencies();

  const [displayEndDate, setDisplayEndDate] = useState<Date>(endDate);
  const [displayStartDate, setDisplayStartDate] = useState<Date>(startDate);
  const maxRangeEndDate = useMemo(() => {
    if (maxRangeDays) {
      return new Date(displayStartDate.getTime() + (maxRangeDays - 1) * 24 * 60 * 60 * 1000);
    }
    return maxEndDate;
  }, [displayStartDate, maxEndDate, maxRangeDays]);

  useEffect(() => {
    setDisplayEndDate(endDate);
  }, [endDate]);
  useEffect(() => {
    setDisplayStartDate(startDate);
  }, [startDate]);

  const onChangeDisplayEndDate = useCallback(async (date: Date | null) => {
    if (date === null) {
      return;
    }
    setDisplayEndDate(date);
  }, []);

  const onChangeDisplayStartDate = useCallback(async (date: Date | null) => {
    if (date === null) {
      return;
    }
    setDisplayStartDate(date);
  }, []);

  const {
    closeMenu,
    selectProps,
    customDateItemRef,
    confirmButtonRef,
    menuItemOnKeyUp,
    setDatePickerPopoverOpen,
  } = useRelativeDatePickerCustomMenuItemOptions();

  const okOnClick: React.MouseEventHandler<HTMLButtonElement> = useCallback(() => {
    onDateRangeChangeConfirmed(displayStartDate, displayEndDate);
    closeMenu();
  }, [closeMenu, displayEndDate, displayStartDate, onDateRangeChangeConfirmed]);

  // Use tightest bound of maxEndDate and maxRangeEndDate
  const effectiveMaxEndDate = useMemo(() => {
    if (maxRangeDays) {
      return maxRangeEndDate < maxEndDate ? maxRangeEndDate : maxEndDate;
    }
    return maxEndDate;
  }, [maxEndDate, maxRangeDays, maxRangeEndDate]);

  return useMemo(
    () => ({
      closeMenu,
      selectProps,
      CustomDatePickerMenuItem: (
        <MenuItem
          key={DateRangeType.Custom}
          value={DateRangeType.Custom}
          className={relativeDatePickerMenuItemLayout}
          ref={customDateItemRef}
          onKeyUp={menuItemOnKeyUp}>
          <div>{translate(dateRangeStrings[DateRangeType.Custom])}</div>
          <DateRangePicker
            endDate={displayEndDate}
            startDate={displayStartDate}
            maxEndDate={effectiveMaxEndDate}
            minStartDate={minStartDate}
            onChangeEndDate={onChangeDisplayEndDate}
            onChangeStartDate={onChangeDisplayStartDate}
            setDatePickerPopoverOpen={setDatePickerPopoverOpen}
          />
          <Button
            ref={confirmButtonRef}
            size='small'
            onClick={okOnClick}
            className={relativeDatePickerConfirmButtonFlexLayout}>
            {translate(translationKey('Label.Ok', TranslationNamespace.Analytics))}
          </Button>
        </MenuItem>
      ),
    }),
    [
      closeMenu,
      confirmButtonRef,
      customDateItemRef,
      displayEndDate,
      displayStartDate,
      effectiveMaxEndDate,
      menuItemOnKeyUp,
      minStartDate,
      okOnClick,
      onChangeDisplayEndDate,
      onChangeDisplayStartDate,
      relativeDatePickerConfirmButtonFlexLayout,
      relativeDatePickerMenuItemLayout,
      selectProps,
      setDatePickerPopoverOpen,
      translate,
    ],
  );
};

export default useRelativeDateRangePickerCustomMenuItem;
