import type { FunctionComponent } from 'react';
import { useMemo, useCallback } from 'react';
import { subDays } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { DatePicker, PickersUtilsProvider, TextField } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import {
  handleYearMonthToDate,
  isValidYearMonthFormat,
  convertToYearMonthFormat,
} from '@modules/miscellaneous/utils/dateUtils';
import type { YearMonth } from '@modules/miscellaneous/utils/dateUtils';

type TMonthRangePickerProps = {
  startMonth: YearMonth;
  endMonth: YearMonth;
  onChangeStartMonth: (month: YearMonth) => void;
  onChangeEndMonth: (month: YearMonth) => void;
  minStartMonth?: YearMonth;
  maxEndMonth?: YearMonth;
  className?: string;
};

const MonthRangePicker: FunctionComponent<TMonthRangePickerProps> = ({
  startMonth,
  endMonth,
  onChangeStartMonth,
  onChangeEndMonth,
  minStartMonth,
  maxEndMonth,
  className,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  const minStartDate = useMemo(() => {
    const DEFAULT_DAYS_FOR_MIN_DATE = 5 * 365;
    const defaultMinStartDate = subDays(new Date(), DEFAULT_DAYS_FOR_MIN_DATE);
    const minStartMonthDate =
      minStartMonth && isValidYearMonthFormat(minStartMonth)
        ? handleYearMonthToDate(minStartMonth)
        : defaultMinStartDate;
    // NOTE[@yhe-cn]: The previous month will be unexpected enabled in the date picker UI when using 1
    return new Date(minStartMonthDate.getFullYear(), minStartMonthDate.getMonth(), 2);
  }, [minStartMonth]);

  const maxEndDate = useMemo(() => {
    const maxEndMonthDate =
      maxEndMonth && isValidYearMonthFormat(maxEndMonth)
        ? handleYearMonthToDate(maxEndMonth)
        : new Date();
    return new Date(maxEndMonthDate.getFullYear(), maxEndMonthDate.getMonth() + 1, 0);
  }, [maxEndMonth]);

  const startDate = useMemo(() => handleYearMonthToDate(startMonth), [startMonth]);

  const endDate = useMemo(() => {
    const date = handleYearMonthToDate(endMonth);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }, [endMonth]);

  const isDateValid = useCallback(
    (date: Date | null): date is Date =>
      !!date && date.getTime() <= maxEndDate.getTime() && date.getTime() >= minStartDate.getTime(),
    [maxEndDate, minStartDate],
  );

  const onChangeStartDate = useCallback(
    (date: Date | null) => {
      if (isDateValid(date)) {
        onChangeStartMonth(convertToYearMonthFormat(date));
      }
    },
    [onChangeStartMonth, isDateValid],
  );

  const onChangeEndDate = useCallback(
    (date: Date | null) => {
      if (isDateValid(date)) {
        onChangeEndMonth(convertToYearMonthFormat(date));
      }
    },
    [onChangeEndMonth, isDateValid],
  );

  return (
    <PickersUtilsProvider>
      <DatePicker
        value={startDate}
        minDate={minStartDate}
        maxDate={endDate ?? maxEndDate}
        onChange={onChangeStartDate}
        views={['year', 'month']}
        renderInput={(params) => (
          <TextField
            {...params}
            id='start-month-picker'
            variant='outlined'
            label={translate(translationKey('Label.StartMonth', TranslationNamespace.Analytics))}
            className={className}
          />
        )}
      />
      <DatePicker
        value={endDate}
        minDate={startDate ?? minStartDate}
        maxDate={maxEndDate}
        onChange={onChangeEndDate}
        views={['year', 'month']}
        renderInput={(params) => (
          <TextField
            {...params}
            id='end-month-picker'
            variant='outlined'
            label={translate(translationKey('Label.EndMonth', TranslationNamespace.Analytics))}
            className={className}
          />
        )}
      />
    </PickersUtilsProvider>
  );
};

export default MonthRangePicker;
