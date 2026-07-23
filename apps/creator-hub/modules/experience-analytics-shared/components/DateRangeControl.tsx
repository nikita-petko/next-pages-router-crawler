import {
  dateRangeStrings,
  DateRangeType,
  formatDateRange,
  useLocale,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { MenuItem, Select } from '@rbx/ui';
import React, { FC, useCallback, useMemo, ReactNode } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { subDays } from '@rbx/core';
import useRelativeDateRangePickerCustomMenuItem from './CustomDatePickerMenuItem/useRelativeDateRangePickerCustomMenuItem';
import useRAQIV2TranslationDependencies from '../hooks/useRAQIV2TranslationDependencies';

const dateRangeDaysBack: Partial<Record<DateRangeType, number>> = {
  [DateRangeType.Last1Hour]: 0,
  [DateRangeType.Last1Day]: 1,
  [DateRangeType.Last3Days]: 3,
  [DateRangeType.Last7Days]: 7,
  [DateRangeType.Last28Days]: 28,
  [DateRangeType.Last56Days]: 56,
  [DateRangeType.Last90Days]: 90,
  [DateRangeType.Last365Days]: 365,
};

function isRangeWithinBounds(
  rangeType: DateRangeType,
  minStartDate: Date,
  maxEndDate: Date,
): boolean {
  if (rangeType === DateRangeType.Custom) return true;
  const daysBack = dateRangeDaysBack[rangeType];
  if (daysBack === undefined) return true;
  return subDays(maxEndDate, daysBack) >= minStartDate;
}

type DateRangeControlProps = {
  dateRangeType: DateRangeType;
  startDate: Date;
  endDate: Date;
  minStartDate: Date;
  maxEndDate: Date;
  maxRangeDays?: number;
  onChangeRangeType: (newRangeType: DateRangeType) => void;
  onCustomDateRangeChangeConfirmed: (startDate: Date, endDate: Date) => void;
  dateRangeOptions?: Readonly<DateRangeType[]>;
  selectClassName?: string;
  size?: React.ComponentProps<typeof Select>['size'];
  fullWidth?: React.ComponentProps<typeof Select>['fullWidth'];
};

const defaultDateRangeOptions = [
  DateRangeType.Last7Days,
  DateRangeType.Last28Days,
  DateRangeType.Last56Days,
  DateRangeType.Last90Days,
  DateRangeType.Custom,
];

const DateRangeControl: FC<DateRangeControlProps> = ({
  dateRangeOptions,
  selectClassName,
  dateRangeType,
  onChangeRangeType,
  onCustomDateRangeChangeConfirmed,
  startDate,
  endDate,
  minStartDate,
  maxEndDate,
  maxRangeDays,
  size,
  fullWidth,
}) => {
  const locale = useLocale();
  const { translate } = useRAQIV2TranslationDependencies();
  const dateRangeTypes = dateRangeOptions || defaultDateRangeOptions;

  const filteredDateRangeTypes = useMemo(
    () => dateRangeTypes.filter((type) => isRangeWithinBounds(type, minStartDate, maxEndDate)),
    [dateRangeTypes, minStartDate, maxEndDate],
  );

  const { CustomDatePickerMenuItem, selectProps, closeMenu } =
    useRelativeDateRangePickerCustomMenuItem({
      minStartDate,
      maxEndDate,
      startDate,
      endDate,
      maxRangeDays,
      onDateRangeChangeConfirmed: onCustomDateRangeChangeConfirmed,
    });

  const dateRangeMenuItems = useMemo(
    () =>
      filteredDateRangeTypes.map((item) => {
        if (item === DateRangeType.Custom) {
          return CustomDatePickerMenuItem;
        }
        return (
          <MenuItem key={item} value={item}>
            {translate(dateRangeStrings[item])}
          </MenuItem>
        );
      }),
    [filteredDateRangeTypes, CustomDatePickerMenuItem, translate],
  );

  const getTextFieldValueForRangeType = useCallback(
    (currentRangeType: unknown): ReactNode => {
      /**
       * NOTE(cmccarty@ 20230316): renderValue requires this input arg type to be Unknown,
       * but we actually want to make sure its a DateRangeType
       */
      const castedRangeType: DateRangeType = currentRangeType as DateRangeType;
      if (castedRangeType === DateRangeType.Custom) {
        return formatDateRange(locale, startDate, endDate);
      }
      return translate(dateRangeStrings[castedRangeType]);
    },
    [endDate, locale, startDate, translate],
  );

  const onRangeTypeChange = useCallback(
    (event: React.ChangeEvent<{ value: string }>) => {
      const newDateRange = event.target.value as DateRangeType;
      if (newDateRange !== DateRangeType.Custom) {
        closeMenu();
      }
      onChangeRangeType(newDateRange);
    },
    [closeMenu, onChangeRangeType],
  );
  const dateRangeLabel = translationKey('Label.DateRange', TranslationNamespace.Analytics);

  const selectPropsWithRenderValue = useMemo(
    () => ({
      ...selectProps,
      renderValue: getTextFieldValueForRangeType,
    }),
    [getTextFieldValueForRangeType, selectProps],
  );

  return (
    <Select
      SelectProps={selectPropsWithRenderValue}
      label={translate(dateRangeLabel)}
      variant='outlined'
      classes={{ root: selectClassName }}
      data-testid='dateRangeSelector'
      value={dateRangeType}
      onChange={onRangeTypeChange}
      size={size}
      fullWidth={fullWidth}>
      {dateRangeMenuItems}
    </Select>
  );
};

export default DateRangeControl;
