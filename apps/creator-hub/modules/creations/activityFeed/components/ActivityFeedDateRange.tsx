import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { DatePicker, PickersUtilsProvider, TextField } from '@rbx/ui';
import useActivityFeedDateRangeStyles from './ActivityFeedDateRange.styles';

interface ActivtyFeedDateRangeProps {
  date: number;
  setDate: React.Dispatch<React.SetStateAction<number>>;
}

const ActivityFeedDateRange: FunctionComponent<
  React.PropsWithChildren<ActivtyFeedDateRangeProps>
> = ({ date, setDate }) => {
  const {
    classes: { dateRange },
  } = useActivityFeedDateRangeStyles();
  const { translate } = useTranslation();
  const handleDateChange = useCallback(
    (selectedDate: Date | null) => {
      if (selectedDate) {
        selectedDate.setHours(23);
        selectedDate.setMinutes(59);
        selectedDate.setSeconds(59);
        selectedDate.setMilliseconds(999);
        const unixTimestamp = Math.floor(selectedDate.getTime());
        setDate(unixTimestamp);
      }
    },
    [setDate],
  );
  return (
    <PickersUtilsProvider>
      <DatePicker
        className={dateRange}
        disableFuture
        label='Date Picker'
        onChange={handleDateChange}
        openTo='day'
        orientation='portrait'
        renderInput={(params) => (
          <TextField
            {...params}
            variant='outlined'
            id='values'
            label={translate('Label.JumpToDate')}
          />
        )}
        value={new Date(date)}
        views={['year', 'month', 'day']}
      />
    </PickersUtilsProvider>
  );
};

export default ActivityFeedDateRange;
