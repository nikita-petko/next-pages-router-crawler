import type { FC, ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';
import { MenuItem, Select } from '@rbx/ui';
import useRelativeDateRangePickerCustomMenuItem from './CustomDatePickerMenuItem/useRelativeDateRangePickerCustomMenuItem';
import { DateRangePreset, isDateRangePreset } from './DateRangePreset';
import { formatDateRange } from './formatDateRange';
import { isRangeWithinBounds } from './presets';

export type DateRangeControlProps = {
  dateRangeType: DateRangePreset;
  startDate: Date;
  endDate: Date;
  minStartDate: Date;
  maxEndDate: Date;
  maxRangeDays?: number;
  onChangeRangeType: (next: DateRangePreset) => void;
  onCustomDateRangeChangeConfirmed: (startDate: Date, endDate: Date) => void;
  /** Subset of presets to show. Defaults to 7/28/56/90/Custom. */
  dateRangeOptions?: ReadonlyArray<DateRangePreset>;
  /** Caller-supplied translated labels for each preset. Custom is required. */
  presetLabels: Partial<Record<Exclude<DateRangePreset, DateRangePreset.Custom>, ReactNode>> & {
    [DateRangePreset.Custom]: ReactNode;
  };
  labels: {
    dateRangeLabel: ReactNode;
    okLabel: ReactNode;
    startDateLabel: ReactNode;
    endDateLabel: ReactNode;
  };
  locale?: string;
  selectClassName?: string;
  size?: React.ComponentProps<typeof Select>['size'];
  fullWidth?: React.ComponentProps<typeof Select>['fullWidth'];
  disabled?: boolean;
  error?: boolean;
};

const defaultDateRangeOptions: ReadonlyArray<DateRangePreset> = [
  DateRangePreset.Last7Days,
  DateRangePreset.Last28Days,
  DateRangePreset.Last56Days,
  DateRangePreset.Last90Days,
  DateRangePreset.Custom,
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
  presetLabels,
  labels,
  locale,
  size,
  fullWidth,
  disabled,
  error,
}) => {
  const filteredDateRangeTypes = useMemo(
    () =>
      (dateRangeOptions ?? defaultDateRangeOptions).filter((type) =>
        isRangeWithinBounds(type, minStartDate, maxEndDate),
      ),
    [dateRangeOptions, minStartDate, maxEndDate],
  );

  const resolveLabel = useCallback(
    (preset: DateRangePreset): ReactNode => {
      const label = presetLabels[preset];
      if (label === undefined) {
        // oxlint-disable-next-line no-console -- surface missing translations for callers
        console.error(
          `[DateRangeControl] Missing presetLabels entry for '${preset}'. ` +
            `Every preset in dateRangeOptions must have a corresponding label.`,
        );
        return preset;
      }
      return label;
    },
    [presetLabels],
  );

  const customLabel = resolveLabel(DateRangePreset.Custom);

  const { CustomDatePickerMenuItem, selectProps, closeMenu } =
    useRelativeDateRangePickerCustomMenuItem({
      minStartDate,
      maxEndDate,
      startDate,
      endDate,
      maxRangeDays,
      onDateRangeChangeConfirmed: onCustomDateRangeChangeConfirmed,
      customLabel,
      okLabel: labels.okLabel,
      startDateLabel: labels.startDateLabel,
      endDateLabel: labels.endDateLabel,
    });

  const dateRangeMenuItems = useMemo(
    () =>
      filteredDateRangeTypes.map((item) => {
        if (item === DateRangePreset.Custom) {
          return CustomDatePickerMenuItem;
        }
        return (
          <MenuItem key={item} value={item}>
            {resolveLabel(item)}
          </MenuItem>
        );
      }),
    [filteredDateRangeTypes, CustomDatePickerMenuItem, resolveLabel],
  );

  const getTextFieldValueForRangeType = useCallback(
    (currentRangeType: unknown): ReactNode => {
      if (!isDateRangePreset(currentRangeType)) {
        return null;
      }
      if (currentRangeType === DateRangePreset.Custom) {
        return formatDateRange(startDate, endDate, { locale });
      }
      return resolveLabel(currentRangeType);
    },
    [endDate, locale, resolveLabel, startDate],
  );

  const selectClasses = useMemo(() => ({ root: selectClassName }), [selectClassName]);

  const mergedSelectProps = useMemo(
    () => ({ ...selectProps, renderValue: getTextFieldValueForRangeType }),
    [getTextFieldValueForRangeType, selectProps],
  );

  const onRangeTypeChange: NonNullable<React.ComponentProps<typeof Select>['onChange']> =
    useCallback(
      (event) => {
        const newDateRange: unknown = event.target.value;
        if (!isDateRangePreset(newDateRange)) {
          return;
        }
        if (newDateRange !== DateRangePreset.Custom) {
          closeMenu();
        }
        onChangeRangeType(newDateRange);
      },
      [closeMenu, onChangeRangeType],
    );

  return (
    <Select
      SelectProps={mergedSelectProps}
      label={labels.dateRangeLabel}
      variant='outlined'
      classes={selectClasses}
      data-testid='dateRangeSelector'
      value={dateRangeType}
      onChange={onRangeTypeChange}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      error={error}>
      {dateRangeMenuItems}
    </Select>
  );
};

export default DateRangeControl;
