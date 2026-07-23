import type { ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';
import { Button, MenuItem } from '@rbx/ui';
import DateRangePicker from '../DateRangePicker';
import { DateRangePreset } from '../DateRangePreset';
import { clampEndDateToMaxRange } from '../presets';
import useDerivedDateFromProp from '../useDerivedDateFromProp';
import useRelativeDatePickerCustomMenuItemOptions from './useRelativeDatePickerCustomMenuItemOptions';

type UseRelativeDateRangePickerCustomMenuItemArgs = {
  startDate: Date;
  endDate: Date;
  minStartDate: Date;
  maxEndDate: Date;
  onDateRangeChangeConfirmed: (startDate: Date, endDate: Date) => void;
  maxRangeDays?: number;
  customLabel: ReactNode;
  okLabel: ReactNode;
  startDateLabel: ReactNode;
  endDateLabel: ReactNode;
};

const useRelativeDateRangePickerCustomMenuItem = ({
  startDate,
  endDate,
  minStartDate,
  maxEndDate,
  onDateRangeChangeConfirmed,
  maxRangeDays,
  customLabel,
  okLabel,
  startDateLabel,
  endDateLabel,
}: UseRelativeDateRangePickerCustomMenuItemArgs) => {
  const [displayEndDate, setDisplayEndDate] = useDerivedDateFromProp(endDate);
  const [displayStartDate, setDisplayStartDate] = useDerivedDateFromProp(startDate);

  const onChangeDisplayEndDate = useCallback(
    (date: Date | null) => {
      if (date === null) {
        return;
      }
      setDisplayEndDate(date);
    },
    [setDisplayEndDate],
  );

  const onChangeDisplayStartDate = useCallback(
    (date: Date | null) => {
      if (date === null) {
        return;
      }
      setDisplayStartDate(date);
    },
    [setDisplayStartDate],
  );

  const effectiveMaxEndDate = useMemo(
    () => clampEndDateToMaxRange(displayStartDate, maxEndDate, maxRangeDays),
    [displayStartDate, maxEndDate, maxRangeDays],
  );

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

  return {
    closeMenu,
    selectProps,
    CustomDatePickerMenuItem: (
      <MenuItem
        key={DateRangePreset.Custom}
        value={DateRangePreset.Custom}
        sx={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}
        ref={customDateItemRef}
        onKeyUp={menuItemOnKeyUp}>
        <div>{customLabel}</div>
        <DateRangePicker
          endDate={displayEndDate}
          startDate={displayStartDate}
          maxEndDate={effectiveMaxEndDate}
          minStartDate={minStartDate}
          onChangeEndDate={onChangeDisplayEndDate}
          onChangeStartDate={onChangeDisplayStartDate}
          setDatePickerPopoverOpen={setDatePickerPopoverOpen}
          startDateLabel={startDateLabel}
          endDateLabel={endDateLabel}
        />
        <Button
          ref={confirmButtonRef}
          size='small'
          onClick={okOnClick}
          sx={{ alignSelf: 'flex-end' }}>
          {okLabel}
        </Button>
      </MenuItem>
    ),
  };
};

export default useRelativeDateRangePickerCustomMenuItem;
