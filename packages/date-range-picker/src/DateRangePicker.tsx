import type { FC, ReactNode } from 'react';
import React, { useCallback } from 'react';
import { PickersUtilsProvider } from '@rbx/ui';
import LocalizingDatePicker from './LocalizingDatePicker';

type DateRangePickerProps = {
  endDate: Date;
  startDate: Date;
  onChangeEndDate: (date: Date | null) => Promise<void> | void;
  onChangeStartDate: (date: Date | null) => Promise<void> | void;
  maxEndDate: Date;
  minStartDate: Date;
  setDatePickerPopoverOpen: (open: boolean) => void;
  startDateLabel: ReactNode;
  endDateLabel: ReactNode;
};

const DateRangePicker: FC<DateRangePickerProps> = ({
  endDate,
  startDate,
  onChangeEndDate,
  onChangeStartDate,
  maxEndDate,
  minStartDate,
  setDatePickerPopoverOpen,
  startDateLabel,
  endDateLabel,
}) => {
  const onPopoverOpen = useCallback(() => {
    setDatePickerPopoverOpen(true);
  }, [setDatePickerPopoverOpen]);

  const onPopoverClose = useCallback(() => {
    setDatePickerPopoverOpen(false);
  }, [setDatePickerPopoverOpen]);

  return (
    <PickersUtilsProvider>
      <div className='flex flex-row gap-2.5'>
        <LocalizingDatePicker
          label={startDateLabel}
          value={startDate}
          onChange={onChangeStartDate}
          minDate={minStartDate}
          maxDate={endDate}
          onOpen={onPopoverOpen}
          onClose={onPopoverClose}
        />
        <LocalizingDatePicker
          label={endDateLabel}
          value={endDate}
          onChange={onChangeEndDate}
          minDate={startDate}
          maxDate={maxEndDate}
          onOpen={onPopoverOpen}
          onClose={onPopoverClose}
        />
      </div>
    </PickersUtilsProvider>
  );
};

export default DateRangePicker;
