import type { FC, ReactNode } from 'react';
import React, { useCallback, useId, useMemo } from 'react';
import type { TDatePickerProps } from '@rbx/ui';
import { DatePicker, TextField } from '@rbx/ui';
import { shiftUtcToLocal } from './timezone';
import useDerivedDateFromProp from './useDerivedDateFromProp';

type LocalizingDatePickerProps = {
  value: Date;
  minDate: Date;
  maxDate: Date;
  label: ReactNode;
  onChange: NonNullable<TDatePickerProps['onChange']>;
  onOpen?: TDatePickerProps['onOpen'];
  onClose?: TDatePickerProps['onClose'];
  className?: TDatePickerProps['className'];
};

const LocalizingDatePicker: FC<LocalizingDatePickerProps> = ({
  value: valueGiven,
  minDate: minDateGiven,
  maxDate: maxDateGiven,
  onChange: onChangeGiven,
  label,
  className,
  onOpen,
  onClose,
}) => {
  const textFieldId = useId();
  const offsetMinutes = valueGiven.getTimezoneOffset();
  const { value, minDate, maxDate } = useMemo(() => {
    return {
      value: shiftUtcToLocal(valueGiven),
      minDate: shiftUtcToLocal(minDateGiven),
      maxDate: shiftUtcToLocal(maxDateGiven),
    };
  }, [valueGiven, maxDateGiven, minDateGiven]);

  const [displayValue, setDisplayValue] = useDerivedDateFromProp(value);

  const isTimeValid = useCallback(
    (time: Date) =>
      !Number.isNaN(time.getTime()) &&
      time.getTime() <= maxDate.getTime() &&
      time.getTime() >= minDate.getTime(),
    [maxDate, minDate],
  );

  const onChange: NonNullable<TDatePickerProps['onChange']> = useCallback(
    (given, context) => {
      if (!given) {
        return;
      }
      // Manually re-apply time-of-day: MUI's DatePicker keeps the time the
      // component mounted with, which can drift past `minDate` after page load.
      const now = shiftUtcToLocal(new Date());
      const localizedDate = new Date(given);
      localizedDate.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds(),
      );
      setDisplayValue(localizedDate);
      if (isTimeValid(localizedDate)) {
        const newDate = new Date(localizedDate);
        newDate.setMinutes(localizedDate.getMinutes() - offsetMinutes);
        onChangeGiven(newDate, context);
      }
    },
    [offsetMinutes, isTimeValid, onChangeGiven, setDisplayValue],
  );

  return (
    <DatePicker
      value={displayValue}
      minDate={minDate}
      maxDate={maxDate}
      onChange={onChange}
      onOpen={onOpen}
      onClose={onClose}
      format='MM/dd/yyyy'
      renderInput={(params) => (
        <TextField
          {...params}
          id={textFieldId}
          variant='outlined'
          label={label}
          className={className}
        />
      )}
    />
  );
};

export default LocalizingDatePicker;
