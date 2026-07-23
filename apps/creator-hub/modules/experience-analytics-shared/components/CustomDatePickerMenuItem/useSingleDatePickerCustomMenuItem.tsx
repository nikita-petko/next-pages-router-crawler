import React, { useCallback, useEffect, useState } from 'react';
import { Button, MenuItem, PickersUtilsProvider } from '@rbx/ui';
import {
  SingleDateType,
  LocalizingDatePicker,
  singleDateStrings,
  useLocale,
  formatSingleDate,
  useAnalyticsCurrentSingleDateBundle,
} from '@modules/charts-generic';
import { translationKey, FormattedText } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useRelativeDatePickerCustomMenuItemOptions from './useRelativeDatePickerCustomMenuItemOptions';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useAnalyticsPageControlBarStyles from '../../layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar.styles';

export const useExperienceAnalyticsCurrentSingleDateString = (): FormattedText => {
  const { date } = useAnalyticsCurrentSingleDateBundle();
  const locale = useLocale();
  return formatSingleDate(locale, date);
};

const useRelativeSingleDatePickerCustomMenuItem = () => {
  const {
    classes: { relativeDatePickerMenuItemLayout, relativeDatePickerConfirmButtonFlexLayout },
  } = useAnalyticsPageControlBarStyles();
  const { translate } = useRAQIV2TranslationDependencies();

  const { date, minStartDate, maxEndDate, onChangeDate, singleDateType } =
    useAnalyticsCurrentSingleDateBundle();

  const [displayDate, setDisplayDate] = useState<Date>(date);
  useEffect(() => {
    setDisplayDate(date);
  }, [date]);

  const onChangeDisplayDate = useCallback((newDate: Date | null) => {
    if (newDate === null) {
      return;
    }
    setDisplayDate(new Date(newDate));
  }, []);

  const {
    closeMenu,
    selectProps,
    customDateItemRef,
    confirmButtonRef,
    menuItemOnKeyUp,
    setDatePickerPopoverOpen,
  } = useRelativeDatePickerCustomMenuItemOptions();

  const onOkClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    onChangeDate(displayDate);
    closeMenu();
  };

  return {
    closeMenu,
    selectProps,
    CustomDatePickerMenuItem: (
      <MenuItem
        ref={customDateItemRef}
        key={SingleDateType.Custom}
        value={SingleDateType.Custom}
        className={relativeDatePickerMenuItemLayout}
        onKeyUp={menuItemOnKeyUp}>
        <div>{translate(singleDateStrings[SingleDateType.Custom])}</div>
        {singleDateType === SingleDateType.Custom && (
          <PickersUtilsProvider>
            <LocalizingDatePicker
              label={translate(translationKey('Label.Date', TranslationNamespace.Analytics))}
              value={displayDate}
              onChange={onChangeDisplayDate}
              minDate={minStartDate}
              maxDate={maxEndDate}
              onClose={() => setDatePickerPopoverOpen(false)}
              onOpen={() => {
                setDatePickerPopoverOpen(true);
              }}
            />
            <Button
              ref={confirmButtonRef}
              onClick={onOkClick}
              size='small'
              className={relativeDatePickerConfirmButtonFlexLayout}>
              {translate(translationKey('Label.Ok', TranslationNamespace.Analytics))}
            </Button>
          </PickersUtilsProvider>
        )}
      </MenuItem>
    ),
  };
};

export default useRelativeSingleDatePickerCustomMenuItem;
