import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DatePicker, TDatePickerProps, TextField } from '@rbx/ui';
import { FormattedText } from '@modules/analytics-translations';
import { badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone } from './formatters';

type LocalizingDatePickerProps = {
  value: Date;
  minDate: Date;
  maxDate: Date;
  label: FormattedText;
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
  /**
   * NOTE(gperkins@ 20220925): MUI's <DatePicker> displays and sets dates as if they were in the local
   *  timezone. Since our APIs (and legacy pages) take and return UTC dates, our daily graphs are in UTC.
   *  We would like the date range shown to align with what the graphs show -- so we need to shift
   *  by the timezone offset for <DatePicker>.
   *
   * An alternative to doing this shift would be use e.g. https://day.js.org/docs/en/plugin/timezone
   */
  const offsetMinutes = valueGiven.getTimezoneOffset();
  const { value, minDate, maxDate } = useMemo(() => {
    const newValue = badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone(valueGiven);
    const newMinDate = badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone(minDateGiven);
    const newMaxDate = badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone(maxDateGiven);
    return { value: newValue, minDate: newMinDate, maxDate: newMaxDate };
  }, [valueGiven, maxDateGiven, minDateGiven]);

  const [displayValue, setDisplayValue] = useState<Date>(value);
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const isTimeValid = useCallback(
    (time: Date) => {
      return (
        !Number.isNaN(time.getTime()) &&
        time.getTime() <= maxDate.getTime() &&
        time.getTime() >= minDate.getTime()
      );
    },
    [maxDate, minDate],
  );

  const onChange: NonNullable<TDatePickerProps['onChange']> = useCallback(
    (given, context) => {
      if (!given) return;
      // NOTE(shumingxu, 09/07/2023): we need to manually update the time-of-day for the datepicker value
      // since by default it uses the time that the page was loaded and doesn't update it after that.
      // This can be an issue since minDate will move past that timestamp a second after the page has loaded.
      const now = badlyMisnamedFormatLocalizedDateValueFromUTCToUserTimezone(new Date());
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
    [offsetMinutes, isTimeValid, onChangeGiven],
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
          id='localization-date-picker'
          variant='outlined'
          label={label}
          className={className}
        />
      )}
    />
  );
};

export default LocalizingDatePicker;
